const { joinWaitlist } = require("../services/waitlistService");

async function joinWaitlistHandler(req, res) {
  const { showId, category } = req.body;
  const userId = req.user.id;

  if (!showId || !category) {
    return res.status(400).json({ error: "showId and category are required" });
  }

  try {
    const result = await joinWaitlist(showId, category, userId);
    if (!result.success) {
      return res.status(409).json({ error: result.reason });
    }
    res.status(201).json({ message: "Joined waitlist", entry: result.entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { joinWaitlistHandler };