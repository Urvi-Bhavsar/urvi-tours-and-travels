const express = require("express");
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
} = require("../controllers/inquiryController");
const { protect, authorize } = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");

// Public route - rate limited to prevent spam
router.post("/", rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), createInquiry);

// Admin routes
router.get("/", protect, authorize("admin", "staff"), getInquiries);
router.get("/stats/summary", protect, authorize("admin", "staff"), getInquiryStats);
router.get("/:id", protect, authorize("admin", "staff"), getInquiry);
router.patch("/:id/status", protect, authorize("admin", "staff"), updateInquiryStatus);
router.delete("/:id", protect, authorize("admin"), deleteInquiry);

module.exports = router;
