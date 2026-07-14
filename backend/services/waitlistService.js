const pool = require("../config/db");
const { redisClient } = require("../config/redis");
const crypto = require("crypto");

const WAITLIST_OFFER_TTL_SECONDS = parseInt(process.env.WAITLIST_OFFER_TTL_SECONDS || "900", 10); // 15 min

async function joinWaitlist(showId, category, userId) {
  // Check for an existing 'waiting' entry (partial unique index also enforces this at DB level)
  const existing = await pool.query(
    `SELECT id FROM waitlist_entries WHERE show_id = $1 AND category = $2 AND customer_id = $3 AND status = 'waiting'`,
    [showId, category, userId]
  );
  if (existing.rows.length > 0) {
    return { success: false, reason: "Already on waitlist for this category" };
  }

  const result = await pool.query(
    `INSERT INTO waitlist_entries (show_id, category, customer_id, status)
     VALUES ($1, $2, $3, 'waiting')
     RETURNING id, show_id, category, customer_id, created_at`,
    [showId, category, userId]
  );

  const entry = result.rows[0];

  // Redis sorted set, scored by join timestamp -> gives FIFO order
  const score = new Date(entry.created_at).getTime();
  await redisClient.zadd(`waitlist:${showId}:${category}`, score, entry.id);

  return { success: true, entry };
}

async function popNextInWaitlist(showId, category) {
  // Get the earliest-scored entry (lowest timestamp = first joined)
  const popped = await redisClient.zpopmin(`waitlist:${showId}:${category}`);

  if (!popped || popped.length === 0) {
    return null; // nobody waiting
  }

  const waitlistEntryId = popped[0];

  const entryResult = await pool.query(
    `SELECT id, show_id, category, customer_id FROM waitlist_entries WHERE id = $1 AND status = 'waiting'`,
    [waitlistEntryId]
  );

  if (entryResult.rows.length === 0) {
    // Entry was already handled/stale, try the next one recursively
    return popNextInWaitlist(showId, category);
  }

  return entryResult.rows[0];
}

async function offerSeatToWaitlistEntry(showId, seatId, waitlistEntry) {
  const redisKey = `hold:${showId}:${seatId}`;

  // Create a hold scoped to this specific customer, shorter TTL than normal holds
  await redisClient.set(redisKey, waitlistEntry.customer_id, "NX", "EX", WAITLIST_OFFER_TTL_SECONDS);

  const offerExpiresAt = new Date(Date.now() + WAITLIST_OFFER_TTL_SECONDS * 1000);

  await pool.query(
    `UPDATE seat_status
     SET status = 'held', held_by = $1, hold_expires_at = $2
     WHERE show_id = $3 AND seat_id = $4`,
    [waitlistEntry.customer_id, offerExpiresAt, showId, seatId]
  );

  await pool.query(
    `UPDATE waitlist_entries
     SET status = 'offered', offered_seat_id = $1, offer_expires_at = $2
     WHERE id = $3`,
    [seatId, offerExpiresAt, waitlistEntry.id]
  );

  // Generate a signed token embedding show_id, seat_id, waitlist_entry_id
  const token = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${showId}:${seatId}:${waitlistEntry.id}`)
    .digest("hex");

return { token, offerExpiresAt, waitlistEntryId: waitlistEntry.id };}
function verifyOfferToken(showId, seatId, waitlistEntryId, token) {
  const expectedToken = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${showId}:${seatId}:${waitlistEntryId}`)
    .digest("hex");

  return token === expectedToken;
}

module.exports = {
  joinWaitlist,
  popNextInWaitlist,
  offerSeatToWaitlistEntry,
  verifyOfferToken,
  WAITLIST_OFFER_TTL_SECONDS,
};