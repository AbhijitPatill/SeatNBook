const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const { joinWaitlistHandler } = require("../controllers/waitlistController");

router.post("/join", authenticate, requireRole("customer"), joinWaitlistHandler);

module.exports = router;