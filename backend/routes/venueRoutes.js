const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const { createVenue, addSeats, getVenue, getAllVenues } = require("../controllers/venueController");

router.post("/", authenticate, requireRole("admin"), createVenue);
router.post("/:id/seats", authenticate, requireRole("admin"), addSeats);
router.get("/", authenticate, getAllVenues);
router.get("/:id", authenticate, getVenue);

module.exports = router;