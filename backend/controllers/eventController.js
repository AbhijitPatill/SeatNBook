const pool = require("../config/db");

async function createEvent(req, res) {
  const { title, description, venue_id, category, image_url } = req.body;

  if (!title || !venue_id) {
    return res.status(400).json({ error: "title and venue_id are required" });
  }
  if (category && !["movie", "concert"].includes(category)) {
    return res.status(400).json({ error: "category must be 'movie' or 'concert'" });
  }

  try {
    const venueCheck = await pool.query("SELECT id FROM venues WHERE id = $1", [venue_id]);
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const result = await pool.query(
      `INSERT INTO events (title, description, organiser_id, venue_id, category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, organiser_id, venue_id, category, image_url, created_at`,
      [title, description || null, req.user.id, venue_id, category || "movie", image_url || null]
    );

    res.status(201).json({ event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function createShow(req, res) {
  const eventId = req.params.id;
  const { show_date, show_time } = req.body;

  if (!show_date || !show_time) {
    return res.status(400).json({ error: "show_date and show_time are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Confirm event exists and belongs to this organiser, and get its venue
    const eventResult = await client.query(
      "SELECT id, venue_id, organiser_id FROM events WHERE id = $1",
      [eventId]
    );
    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event not found" });
    }
    const event = eventResult.rows[0];

    if (event.organiser_id !== req.user.id && req.user.role !== "admin") {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Not your event" });
    }

    // Create the show
    const showResult = await client.query(
      `INSERT INTO shows (event_id, show_date, show_time)
       VALUES ($1, $2, $3)
       RETURNING id, event_id, show_date, show_time, created_at`,
      [eventId, show_date, show_time]
    );
    const show = showResult.rows[0];

    // *** Seat population step ***
    // Every seat in the venue gets a seat_status row for this show, defaulting to 'available'
    await client.query(
      `INSERT INTO seat_status (show_id, seat_id, status)
       SELECT $1, id, 'available' FROM seats WHERE venue_id = $2`,
      [show.id, event.venue_id]
    );

    await client.query("COMMIT");
    res.status(201).json({ show });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

async function setPricing(req, res) {
  const showId = req.params.id;
  const { pricing } = req.body; // [{ category, price }, ...]

  if (!Array.isArray(pricing) || pricing.length === 0) {
    return res.status(400).json({ error: "pricing must be a non-empty array" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const showCheck = await client.query("SELECT id FROM shows WHERE id = $1", [showId]);
    if (showCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Show not found" });
    }

    for (const p of pricing) {
      if (!p.category || p.price == null) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Each entry needs category and price" });
      }
      await client.query(
        `INSERT INTO show_pricing (show_id, category, price)
         VALUES ($1, $2, $3)
         ON CONFLICT (show_id, category) DO UPDATE SET price = EXCLUDED.price`,
        [showId, p.category, p.price]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Pricing set" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

async function getEvents(req, res) {
  try {
    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.category, e.image_url, e.created_at,
              v.name AS venue_name, v.address AS venue_address,
              u.name AS organiser_name
       FROM events e
       JOIN venues v ON e.venue_id = v.id
       JOIN users u ON e.organiser_id = u.id
       ORDER BY e.created_at DESC`
    );
    res.json({ events: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { createEvent, createShow, setPricing, getEvents };

