const pool = require("../config/db");

async function getEventSummary(req, res) {
  const eventId = req.params.id;
  const organiserId = req.user.id;

  try {
    const eventCheck = await pool.query(
      "SELECT id, title, organiser_id FROM events WHERE id = $1",
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (eventCheck.rows[0].organiser_id !== organiserId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not your event" });
    }

    // Per-show breakdown: seats booked, revenue, seats still available
    const showBreakdown = await pool.query(
      `SELECT shows.id AS show_id, shows.show_date, shows.show_time,
              COUNT(DISTINCT CASE WHEN seat_status.status = 'booked' THEN seat_status.seat_id END) AS seats_booked,
              COUNT(DISTINCT CASE WHEN seat_status.status = 'available' THEN seat_status.seat_id END) AS seats_available,
              COALESCE(SUM(booking_seats.price), 0) AS revenue
       FROM shows
       LEFT JOIN seat_status ON seat_status.show_id = shows.id
       LEFT JOIN bookings ON bookings.show_id = shows.id AND bookings.status = 'confirmed'
       LEFT JOIN booking_seats ON booking_seats.booking_id = bookings.id
       WHERE shows.event_id = $1
       GROUP BY shows.id
       ORDER BY shows.show_date, shows.show_time`,
      [eventId]
    );

    const totalRevenue = showBreakdown.rows.reduce((sum, s) => sum + parseFloat(s.revenue), 0);
    const totalSeatsBooked = showBreakdown.rows.reduce((sum, s) => sum + parseInt(s.seats_booked), 0);

    res.json({
      event: { id: eventCheck.rows[0].id, title: eventCheck.rows[0].title },
      total_revenue: totalRevenue,
      total_seats_booked: totalSeatsBooked,
      shows: showBreakdown.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getEventSummary };