const pool = require("../config/db");
const { redisSubscriber } = require("../config/redis");
const { popNextInWaitlist, offerSeatToWaitlistEntry } = require("./waitlistService");
const { sendWaitlistOfferEmail } = require("./emailService");

function startExpiryListener(io) {
  redisSubscriber.psubscribe("__keyevent@0__:expired");

  redisSubscriber.on("pmessage", async (pattern, channel, expiredKey) => {
    if (!expiredKey.startsWith("hold:")) return;

    const [, showId, seatId] = expiredKey.split(":");

    try {
      // Check if this expired hold was a waitlist offer BEFORE we reset it,
      // since we need to know the category to re-offer to the next person.
      const seatResult = await pool.query(
        `SELECT seat_status.status, seats.category
         FROM seat_status
         JOIN seats ON seats.id = seat_status.seat_id
         WHERE seat_status.show_id = $1 AND seat_status.seat_id = $2`,
        [showId, seatId]
      );

      if (seatResult.rows.length === 0) return;
      const category = seatResult.rows[0].category;

      // Was there a waitlist_entries row in 'offered' state pointing at this exact seat?
      const offerResult = await pool.query(
        `SELECT id, customer_id FROM waitlist_entries
         WHERE show_id = $1 AND offered_seat_id = $2 AND status = 'offered'`,
        [showId, seatId]
      );

      // Release the seat back to available first, either way
      await pool.query(
        `UPDATE seat_status
         SET status = 'available', held_by = NULL, hold_expires_at = NULL
         WHERE show_id = $1 AND seat_id = $2 AND status = 'held'`,
        [showId, seatId]
      );

      if (offerResult.rows.length > 0) {
        // This was a waitlist offer that expired unclaimed. Mark it expired, then re-offer.
        const expiredEntry = offerResult.rows[0];
        await pool.query(
          `UPDATE waitlist_entries SET status = 'expired' WHERE id = $1`,
          [expiredEntry.id]
        );

        console.log(`Waitlist offer expired for seat ${seatId}, show ${showId}. Re-offering...`);

        const nextInLine = await popNextInWaitlist(showId, category);

        if (nextInLine) {
const { token, waitlistEntryId } = await offerSeatToWaitlistEntry(showId, seatId, nextInLine);
          io.to(`show:${showId}`).emit("seat_update", { seat_id: seatId, status: "held" });

          const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [
            nextInLine.customer_id,
          ]);

sendWaitlistOfferEmail(userResult.rows[0].email, token, showId, seatId, waitlistEntryId).catch((err) =>            console.error("Waitlist re-offer email failed:", err)
          );
        } else {
          // Nobody left waiting for this category, seat just goes available
          io.to(`show:${showId}`).emit("seat_update", { seat_id: seatId, status: "available" });
        }
      } else {
        // Regular hold expiry, not a waitlist offer
        io.to(`show:${showId}`).emit("seat_update", { seat_id: seatId, status: "available" });
        console.log(`Auto-released seat ${seatId} for show ${showId} (hold expired)`);
      }
    } catch (err) {
      console.error("Error handling expired hold:", err);
    }
  });

  console.log("Redis expiry listener started");
}

module.exports = { startExpiryListener };