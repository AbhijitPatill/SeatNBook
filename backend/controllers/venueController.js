const pool = require("../config/db");

async function getAllVenues(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, address FROM venues ORDER BY name"
    );
    res.json({ venues: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function createVenue(req, res) {
  const { name, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Venue name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO venues (name, address, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, address, created_by, created_at`,
      [name, address || null, req.user.id]
    );
    res.status(201).json({ venue: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function addSeats(req, res) {
  const venueId = req.params.id;
  const { seats } = req.body; // [{ row_label, seat_number, category }, ...]

  if (!Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ error: "seats must be a non-empty array" });
  }

  for (const s of seats) {
    if (!s.row_label || !s.seat_number || !s.category) {
      return res.status(400).json({
        error: "Each seat requires row_label, seat_number, and category",
      });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const venueCheck = await client.query("SELECT id FROM venues WHERE id = $1", [venueId]);
    if (venueCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Venue not found" });
    }

    // Build a multi-row INSERT
    const values = [];
    const placeholders = seats.map((s, i) => {
      const base = i * 4;
      values.push(venueId, s.row_label, s.seat_number, s.category);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
    });

    const insertQuery = `
      INSERT INTO seats (venue_id, row_label, seat_number, category)
      VALUES ${placeholders.join(", ")}
      RETURNING id, row_label, seat_number, category
    `;

    const result = await client.query(insertQuery, values);
    await client.query("COMMIT");

    res.status(201).json({ seats: result.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Duplicate seat (row/seat_number already exists for this venue)" });
    }
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

async function getVenue(req, res) {
  const venueId = req.params.id;

  try {
    const venue = await pool.query("SELECT * FROM venues WHERE id = $1", [venueId]);
    if (venue.rows.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const seats = await pool.query(
      "SELECT id, row_label, seat_number, category FROM seats WHERE venue_id = $1 ORDER BY row_label, seat_number",
      [venueId]
    );

    res.json({ venue: venue.rows[0], seats: seats.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { createVenue, addSeats, getVenue, getAllVenues };