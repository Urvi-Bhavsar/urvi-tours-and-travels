const Car = require("../models/Car");

// @desc    Get all active cars (public)
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res) => {
  try {
    const cars = await Car.find({ active: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all cars including hidden (admin)
// @route   GET /api/cars/admin
// @access  Private/Admin
exports.getAllCars = async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single car by ID
// @route   GET /api/cars/:id
// @access  Public
exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    res.status(200).json({
      success: true,
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new car
// @route   POST /api/cars
// @access  Private/Admin
exports.createCar = async (req, res) => {
  try {
    const { name, seats, ratePerKm, photo, photos, active } = req.body;

    const car = await Car.create({
      name,
      seats,
      ratePerKm,
      photo,
      photos,
      active,
    });

    res.status(201).json({
      success: true,
      data: car,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private/Admin
exports.updateCar = async (req, res) => {
  try {
    let car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: car,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private/Admin
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    await car.deleteOne();

    res.status(200).json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle car visibility (active/hidden)
// @route   PATCH /api/cars/:id/toggle
// @access  Private/Admin
exports.toggleCarVisibility = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    car.active = !car.active;
    await car.save();

    res.status(200).json({
      success: true,
      data: car,
      message: `Car is now ${car.active ? "visible" : "hidden"}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
