const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { browseEvents, getSeatMap, getShowsForEvent } = require("../controllers/showController");

router.get("/events", authenticate, browseEvents);
router.get("/events/:id/shows", authenticate, getShowsForEvent);
router.get("/shows/:id/seatmap", authenticate, getSeatMap);

module.exports = router;