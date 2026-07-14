const Redis = require("ioredis");

// Separate connections: one for normal commands, one dedicated to pub/sub.
// A Redis connection in subscribe mode can't run regular commands, so they must be split.
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const redisSubscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redisClient.on("error", (err) => console.error("Redis client error:", err));
redisSubscriber.on("error", (err) => console.error("Redis subscriber error:", err));

// Ensure keyspace notifications are enabled at runtime, since hosted Redis providers
// (Render, etc.) may not expose the --notify-keyspace-events startup flag directly.
// "Ex" = keyEvent notifications for Expired events.
redisClient.on("ready", async () => {
  try {
    await redisClient.config("SET", "notify-keyspace-events", "Ex");
    console.log("Redis keyspace notifications enabled (Ex)");
  } catch (err) {
    console.error("Failed to set Redis keyspace notifications:", err.message);
  }
});

module.exports = { redisClient, redisSubscriber };