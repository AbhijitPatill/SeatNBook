const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const { createEvent, createShow, setPricing, getEvents } = require("../controllers/eventController");

router.get("/", authenticate, getEvents);
router.post("/", authenticate, requireRole("organiser", "admin"), createEvent);
router.post("/:id/shows", authenticate, requireRole("organiser", "admin"), createShow);
router.post("/shows/:id/pricing", authenticate, requireRole("organiser", "admin"), setPricing);

module.exports = router;