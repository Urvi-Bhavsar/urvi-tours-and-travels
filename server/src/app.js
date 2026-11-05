const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const carRoutes = require("./routes/carRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Urvi Tours & Travels API",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/inquiries", inquiryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
