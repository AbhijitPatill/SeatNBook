const Redis = require("ioredis");

// Separate connections: one for normal commands, one dedicated to pub/sub.
// A Redis connection in subscribe mode can't run regular commands, so they must be split.
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const redisSubscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redisClient.on("error", (err) => console.error("Redis client error:", err));
redisSubscriber.on("error", (err) => console.error("Redis subscriber error:", err));

module.exports = { redisClient, redisSubscriber };