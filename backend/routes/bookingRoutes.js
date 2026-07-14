const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const { checkout, cancelBooking, checkoutWaitlistOffer, getMyBookings } = require("../controllers/bookingController");

router.post("/checkout", authenticate, requireRole("customer"), checkout);
router.delete("/:id", authenticate, requireRole("customer"), cancelBooking);
router.post("/waitlist-checkout", authenticate, requireRole("customer"), checkoutWaitlistOffer);
router.get("/my-bookings", authenticate, requireRole("customer"), getMyBookings);

module.exports = router;