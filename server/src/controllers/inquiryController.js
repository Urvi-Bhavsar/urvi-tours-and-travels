const Inquiry = require("../models/Inquiry");
const Car = require("../models/Car");

// @desc    Create new inquiry (public)
// @route   POST /api/inquiries
// @access  Public
exports.createInquiry = async (req, res) => {
  try {
    const {
      customerName,
      mobileNumber,
      car,
      pickupLocation,
      dropLocation,
      travelDate,
      passengers,
      note,
      estimatedDistance,
      estimatedFare,
    } = req.body;

    // Get car details to save rate at inquiry time
    const carDetails = await Car.findById(car);

    if (!carDetails) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    // Create inquiry with car details at the time of inquiry
    const inquiry = await Inquiry.create({
      customerName,
      mobileNumber,
      car,
      carName: carDetails.name,
      ratePerKmAtTime: carDetails.ratePerKm,
      pickupLocation,
      dropLocation,
      travelDate,
      passengers,
      note,
      estimatedDistance,
      estimatedFare,
    });

    // Populate car details
    await inquiry.populate("car");

    res.status(201).json({
      success: true,
      data: inquiry,
      message: "Inquiry submitted successfully. We will call you back soon!",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all inquiries (admin)
// @route   GET /api/inquiries
// @access  Private/Admin
exports.getInquiries = async (req, res) => {
  try {
    const { status } = req.query;

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    const inquiries = await Inquiry.find(query)
      .populate("car", "name seats ratePerKm photo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single inquiry (admin)
// @route   GET /api/inquiries/:id
// @access  Private/Admin
exports.getInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).populate(
      "car",
      "name seats ratePerKm photo"
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update inquiry status (admin)
// @route   PATCH /api/inquiries/:id/status
// @access  Private/Admin
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ["New", "Called", "Booked", "Closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: New, Called, Booked, or Closed",
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    inquiry.status = status;
    await inquiry.save();

    res.status(200).json({
      success: true,
      data: inquiry,
      message: `Inquiry status updated to ${status}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete inquiry (admin)
// @route   DELETE /api/inquiries/:id
// @access  Private/Admin
exports.deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    await inquiry.deleteOne();

    res.status(200).json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get inquiry statistics (admin)
// @route   GET /api/inquiries/stats/summary
// @access  Private/Admin
exports.getInquiryStats = async (req, res) => {
  try {
    const totalInquiries = await Inquiry.countDocuments();
    const newInquiries = await Inquiry.countDocuments({ status: "New" });
    const calledInquiries = await Inquiry.countDocuments({ status: "Called" });
    const bookedInquiries = await Inquiry.countDocuments({ status: "Booked" });

    // Get inquiries by car
    const inquiriesByCar = await Inquiry.aggregate([
      {
        $group: {
          _id: "$carName",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get inquiries by week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const inquiriesThisWeek = await Inquiry.countDocuments({
      createdAt: { $gte: oneWeekAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalInquiries,
        new: newInquiries,
        called: calledInquiries,
        booked: bookedInquiries,
        thisWeek: inquiriesThisWeek,
        byCar: inquiriesByCar,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
