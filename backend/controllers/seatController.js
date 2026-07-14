const { attemptHold, releaseHold } = require("../services/holdService");
const pool = require("../config/db");

async function holdSeat(req, res) {
  const { showId, seatId } = req.params;
  const userId = req.user.id;

  try {
    const result = await attemptHold(showId, seatId, userId);

    if (!result.success) {
      return res.status(409).json({ error: result.reason });
    }

    // Broadcast to everyone viewing this show's seat map that the seat is now held
    const io = req.app.get("io");
    io.to(`show:${showId}`).emit("seat_update", {
      seat_id: seatId,
      status: "held",
    });

    res.json({ message: "Seat held", seat: result.seat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function unholdSeat(req, res) {
  const { showId, seatId } = req.params;
  const userId = req.user.id;

  try {
    const result = await releaseHold(showId, seatId, userId);

    if (!result.success) {
      return res.status(403).json({ error: result.reason });
    }

    const io = req.app.get("io");
    io.to(`show:${showId}`).emit("seat_update", {
      seat_id: seatId,
      status: "available",
    });

    res.json({ message: "Seat released" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getSeatMap(req, res) {
  const { showId } = req.params;

  try {
    const result = await pool.query(
      `SELECT s.id AS seat_id, s.row_label, s.seat_number, s.category,
              ss.status, ss.held_by, ss.hold_expires_at
       FROM seat_status ss
       JOIN seats s ON ss.seat_id = s.id
       WHERE ss.show_id = $1
       ORDER BY s.row_label, s.seat_number`,
      [showId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Show not found or no seats" });
    }

    res.json({ seats: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
module.exports = { holdSeat, unholdSeat, getSeatMap };