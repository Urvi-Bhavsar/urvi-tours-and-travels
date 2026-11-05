const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: [true, "Car selection is required"],
    },
    carName: {
      type: String,
      required: true,
    },
    ratePerKmAtTime: {
      type: Number,
      required: true,
    },
    pickupLocation: {
      type: String,
      trim: true,
    },
    dropLocation: {
      type: String,
      trim: true,
    },
    travelDate: {
      type: Date,
    },
    passengers: {
      type: Number,
      min: 1,
    },
    note: {
      type: String,
      trim: true,
    },
    estimatedDistance: {
      type: Number,
      min: 0,
    },
    estimatedFare: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["New", "Called", "Booked", "Closed"],
      default: "New",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
