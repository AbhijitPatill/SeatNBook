const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const { holdSeat, unholdSeat, getSeatMap } = require("../controllers/seatController");

router.get("/:showId/seats", authenticate, getSeatMap);
router.post("/:showId/seats/:seatId/hold", authenticate, requireRole("customer"), holdSeat);
router.delete("/:showId/seats/:seatId/hold", authenticate, requireRole("customer"), unholdSeat);

module.exports = router;