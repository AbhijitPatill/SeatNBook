const pool = require("../config/db");
const { redisClient } = require("../config/redis");
const { generateQRCode } = require("../services/qrService");
const { sendTicketEmail, sendWaitlistOfferEmail } = require("../services/emailService");
const crypto = require("crypto");
const { popNextInWaitlist, offerSeatToWaitlistEntry, verifyOfferToken } = require("../services/waitlistService");

function generateBookingReference() {
  return "BK" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function checkout(req, res) {
  const { showId, seatIds } = req.body;
  const userId = req.user.id;

  if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "showId and seatIds are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const heldCheck = await client.query(
      `SELECT seat_status.seat_id, seat_status.status, seats.category
       FROM seat_status
       JOIN seats ON seats.id = seat_status.seat_id
       WHERE seat_status.show_id = $1
         AND seat_status.seat_id = ANY($2::int[])
         AND seat_status.held_by = $3
         AND seat_status.status = 'held'`,
      [showId, seatIds, userId]
    );

    if (heldCheck.rows.length !== seatIds.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "One or more seats are not held by you (hold may have expired)",
      });
    }

    const pricingResult = await client.query(
      "SELECT category, price FROM show_pricing WHERE show_id = $1",
      [showId]
    );
    const priceMap = {};
    pricingResult.rows.forEach((p) => (priceMap[p.category] = parseFloat(p.price)));

    let totalAmount = 0;
    const seatPrices = heldCheck.rows.map((s) => {
      const price = priceMap[s.category] || 0;
      totalAmount += price;
      return { seat_id: s.seat_id, price };
    });

    const bookingReference = generateBookingReference();

    const bookingResult = await client.query(
      `INSERT INTO bookings (booking_reference, customer_id, show_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'confirmed')
       RETURNING id, booking_reference, total_amount`,
      [bookingReference, userId, showId, totalAmount]
    );
    const booking = bookingResult.rows[0];

    for (const sp of seatPrices) {
      await client.query(
        `INSERT INTO booking_seats (booking_id, seat_id, price) VALUES ($1, $2, $3)`,
        [booking.id, sp.seat_id, sp.price]
      );
    }

    await client.query(
      `UPDATE seat_status SET status = 'booked', held_by = NULL, hold_expires_at = NULL
       WHERE show_id = $1 AND seat_id = ANY($2::int[])`,
      [showId, seatIds]
    );

await client.query("COMMIT");

    // Booking is now permanent. Nothing below this point may cause a rollback
    // or a failure response — best-effort only, all errors are logged and swallowed.

    res.status(201).json({
      booking: {
        id: booking.id,
        reference: booking.booking_reference,
        total_amount: booking.total_amount,
      },
    });

    try {
      for (const seatId of seatIds) {
        await redisClient.del(`hold:${showId}:${seatId}`);
      }

      const io = req.app.get("io");
      seatIds.forEach((seatId) => {
        io.to(`show:${showId}`).emit("seat_update", { seat_id: seatId, status: "booked" });
      });

      const qrCodeDataUrl = await generateQRCode(booking.booking_reference);
      const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);

      sendTicketEmail(userResult.rows[0].email, booking.booking_reference, qrCodeDataUrl).catch(
        (err) => console.error("Email send failed:", err)
      );
    } catch (postCommitErr) {
      console.error("Post-booking cleanup/notification failed (booking is still valid):", postCommitErr);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

async function cancelBooking(req, res) {
  const bookingId = req.params.id;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT id, show_id, customer_id, status FROM bookings WHERE id = $1`,
      [bookingId]
    );
    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found" });
    }
    const booking = bookingResult.rows[0];

    if (booking.customer_id !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Not your booking" });
    }
    if (booking.status === "cancelled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Booking already cancelled" });
    }

    const seatsResult = await client.query(
      `SELECT booking_seats.seat_id, seats.category
       FROM booking_seats
       JOIN seats ON seats.id = booking_seats.seat_id
       WHERE booking_seats.booking_id = $1`,
      [bookingId]
    );

    await client.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [bookingId]);

    await client.query(
      `UPDATE seat_status SET status = 'available', held_by = NULL, hold_expires_at = NULL
       WHERE show_id = $1 AND seat_id = ANY($2::int[])`,
      [booking.show_id, seatsResult.rows.map((s) => s.seat_id)]
    );

    await client.query("COMMIT");

    const io = req.app.get("io");

    for (const seat of seatsResult.rows) {
      const nextInLine = await popNextInWaitlist(booking.show_id, seat.category);

      if (nextInLine) {
const { token, waitlistEntryId } = await offerSeatToWaitlistEntry(booking.show_id, seat.seat_id, nextInLine);
        io.to(`show:${booking.show_id}`).emit("seat_update", {
          seat_id: seat.seat_id,
          status: "held",
        });

        const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [
          nextInLine.customer_id,
        ]);

sendWaitlistOfferEmail(userResult.rows[0].email, token, booking.show_id, seat.seat_id, waitlistEntryId).catch(          (err) => console.error("Waitlist offer email failed:", err)
        );
      } else {
        io.to(`show:${booking.show_id}`).emit("seat_update", {
          seat_id: seat.seat_id,
          status: "available",
        });
      }
    }

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

async function checkoutWaitlistOffer(req, res) {
  const { showId, seatId, waitlistEntryId, token } = req.body;
  const userId = req.user.id;

  if (!showId || !seatId || !waitlistEntryId || !token) {
    return res.status(400).json({ error: "showId, seatId, waitlistEntryId, and token are required" });
  }

  if (!verifyOfferToken(showId, seatId, waitlistEntryId, token)) {
    return res.status(403).json({ error: "Invalid or tampered offer link" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const entryResult = await client.query(
      `SELECT id, customer_id, category FROM waitlist_entries
       WHERE id = $1 AND show_id = $2 AND offered_seat_id = $3 AND status = 'offered'`,
      [waitlistEntryId, showId, seatId]
    );

    if (entryResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This offer is no longer valid (expired or already used)" });
    }

    const entry = entryResult.rows[0];
    if (entry.customer_id !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "This offer was not made to you" });
    }

    const seatCheck = await client.query(
      `SELECT seat_status.seat_id, seats.category
       FROM seat_status
       JOIN seats ON seats.id = seat_status.seat_id
       WHERE seat_status.show_id = $1 AND seat_status.seat_id = $2
         AND seat_status.held_by = $3 AND seat_status.status = 'held'`,
      [showId, seatId, userId]
    );

    if (seatCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Seat hold has expired" });
    }

    const pricingResult = await client.query(
      "SELECT price FROM show_pricing WHERE show_id = $1 AND category = $2",
      [showId, entry.category]
    );
    const price = pricingResult.rows.length > 0 ? parseFloat(pricingResult.rows[0].price) : 0;

    const bookingReference = generateBookingReference();

    const bookingResult = await client.query(
      `INSERT INTO bookings (booking_reference, customer_id, show_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'confirmed')
       RETURNING id, booking_reference, total_amount`,
      [bookingReference, userId, showId, price]
    );
    const booking = bookingResult.rows[0];

    await client.query(
      `INSERT INTO booking_seats (booking_id, seat_id, price) VALUES ($1, $2, $3)`,
      [booking.id, seatId, price]
    );

    await client.query(
      `UPDATE seat_status SET status = 'booked', held_by = NULL, hold_expires_at = NULL
       WHERE show_id = $1 AND seat_id = $2`,
      [showId, seatId]
    );

    await client.query(
      `UPDATE waitlist_entries SET status = 'converted' WHERE id = $1`,
      [waitlistEntryId]
    );

await client.query("COMMIT");

    // Booking is now permanent. Nothing below this point may cause a rollback
    // or a failure response — best-effort only, all errors are logged and swallowed.

    res.status(201).json({
      booking: {
        id: booking.id,
        reference: booking.booking_reference,
        total_amount: booking.total_amount,
      },
    });

    try {
      await redisClient.del(`hold:${showId}:${seatId}`);

      const io = req.app.get("io");
      io.to(`show:${showId}`).emit("seat_update", { seat_id: seatId, status: "booked" });

      const qrCodeDataUrl = await generateQRCode(booking.booking_reference);
      const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);

      sendTicketEmail(userResult.rows[0].email, booking.booking_reference, qrCodeDataUrl).catch((err) =>
        console.error("Email send failed:", err)
      );
    } catch (postCommitErr) {
      console.error("Post-booking cleanup/notification failed (booking is still valid):", postCommitErr);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

async function getMyBookings(req, res) {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT bookings.id, bookings.booking_reference, bookings.total_amount, bookings.status,
              bookings.created_at, shows.show_date, shows.show_time, events.title AS event_title,
              venues.name AS venue_name,
              json_agg(json_build_object(
                'seat_id', seats.id,
                'row_label', seats.row_label,
                'seat_number', seats.seat_number,
                'category', seats.category
              )) AS seats
       FROM bookings
       JOIN shows ON shows.id = bookings.show_id
       JOIN events ON events.id = shows.event_id
       JOIN venues ON venues.id = events.venue_id
       JOIN booking_seats ON booking_seats.booking_id = bookings.id
       JOIN seats ON seats.id = booking_seats.seat_id
       WHERE bookings.customer_id = $1
       GROUP BY bookings.id, shows.id, events.id, venues.id
       ORDER BY bookings.created_at DESC`,
      [userId]
    );

    res.json({ bookings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { checkout, cancelBooking, checkoutWaitlistOffer, getMyBookings };
