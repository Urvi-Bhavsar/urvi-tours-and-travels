const express = require("express");
const router = express.Router();
const {
  getCars,
  getAllCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  toggleCarVisibility,
} = require("../controllers/carController");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/", getCars);
router.get("/:id", getCar);

// Admin routes
router.get("/admin/all", protect, authorize("admin", "staff"), getAllCars);
router.post("/", protect, authorize("admin", "staff"), createCar);
router.put("/:id", protect, authorize("admin", "staff"), updateCar);
router.delete("/:id", protect, authorize("admin"), deleteCar);
router.patch("/:id/toggle", protect, authorize("admin", "staff"), toggleCarVisibility);

module.exports = router;
