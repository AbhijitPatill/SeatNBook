const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const { getEventSummary } = require("../controllers/reportController");

router.get("/events/:id/summary", authenticate, requireRole("organiser", "admin"), getEventSummary);

module.exports = router;