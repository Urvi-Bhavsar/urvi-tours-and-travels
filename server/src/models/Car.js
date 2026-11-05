const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Car name is required"],
      trim: true,
    },
    seats: {
      type: Number,
      required: [true, "Number of seats is required"],
      min: 1,
    },
    ratePerKm: {
      type: Number,
      required: [true, "Rate per km is required"],
      min: 0,
    },
    photo: {
      type: String,
      default: "",
    },
    photos: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Car", carSchema);
