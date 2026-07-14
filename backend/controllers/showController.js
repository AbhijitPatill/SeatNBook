const pool = require("../config/db");

async function getShowsForEvent(req, res) {
  const eventId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT shows.id, shows.show_date, shows.show_time, events.title, venues.name AS venue_name
       FROM shows
       JOIN events ON events.id = shows.event_id
       JOIN venues ON venues.id = events.venue_id
       WHERE shows.event_id = $1
       ORDER BY shows.show_date, shows.show_time`,
      [eventId]
    );

    res.json({ shows: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function browseEvents(req, res) {
  const { title, date, category } = req.query;

  try {
    let query = `
      SELECT DISTINCT e.id, e.title, e.description, e.category, e.image_url, v.name AS venue_name
      FROM events e
      JOIN venues v ON v.id = e.venue_id
      LEFT JOIN shows s ON s.event_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (title) {
      params.push(`%${title}%`);
      query += ` AND e.title ILIKE $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND s.show_date = $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND e.category = $${params.length}`;
    }

    query += " ORDER BY e.id";

    const result = await pool.query(query, params);
    res.json({ events: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
async function getSeatMap(req, res) {
  const showId = req.params.id;

  try {
    const showCheck = await pool.query("SELECT id FROM shows WHERE id = $1", [showId]);
    if (showCheck.rows.length === 0) {
      return res.status(404).json({ error: "Show not found" });
    }

    const result = await pool.query(
      `SELECT seats.id AS seat_id, seats.row_label, seats.seat_number, seats.category,
              seat_status.status, seat_status.hold_expires_at
       FROM seat_status
       JOIN seats ON seats.id = seat_status.seat_id
       WHERE seat_status.show_id = $1
       ORDER BY seats.row_label, seats.seat_number`,
      [showId]
    );

    res.json({ show_id: showId, seats: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { browseEvents, getSeatMap, getShowsForEvent };