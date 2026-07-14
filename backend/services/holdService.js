const pool = require("../config/db");
const { redisClient } = require("../config/redis");

const HOLD_TTL_SECONDS = parseInt(process.env.HOLD_TTL_SECONDS || "600", 10);

async function attemptHold(showId, seatId, userId) {
  const redisKey = `hold:${showId}:${seatId}`;

  // Atomic: only succeeds if key doesn't already exist
  const acquired = await redisClient.set(redisKey, userId, "NX", "EX", HOLD_TTL_SECONDS);

  if (!acquired) {
    return { success: false, reason: "Seat is already held or booked" };
  }

  try {
    const result = await pool.query(
      `UPDATE seat_status
       SET status = 'held', held_by = $1, hold_expires_at = NOW() + INTERVAL '${HOLD_TTL_SECONDS} seconds'
       WHERE show_id = $2 AND seat_id = $3 AND status = 'available'
       RETURNING seat_id, status, hold_expires_at`,
      [userId, showId, seatId]
    );

    if (result.rows.length === 0) {
      // Postgres said seat wasn't available (shouldn't normally happen if Redis is truthful,
      // but guards against drift). Roll back the Redis key.
      await redisClient.del(redisKey);
      return { success: false, reason: "Seat is not available" };
    }

    return { success: true, seat: result.rows[0] };
  } catch (err) {
    await redisClient.del(redisKey); // don't leave an orphaned Redis lock if Postgres failed
    throw err;
  }
}

async function releaseHold(showId, seatId, userId) {
  const redisKey = `hold:${showId}:${seatId}`;
  const holder = await redisClient.get(redisKey);

  if (holder && holder !== String(userId)) {
    return { success: false, reason: "You do not hold this seat" };
  }

  await redisClient.del(redisKey);

  await pool.query(
    `UPDATE seat_status
     SET status = 'available', held_by = NULL, hold_expires_at = NULL
     WHERE show_id = $1 AND seat_id = $2 AND held_by = $3`,
    [showId, seatId, userId]
  );

  return { success: true };
}

module.exports = { attemptHold, releaseHold, HOLD_TTL_SECONDS };
