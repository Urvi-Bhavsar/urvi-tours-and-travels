const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// @desc    Register admin user
// @route   POST /api/auth/register
// @access  Private (only for initial setup or by existing admin)
exports.register = async (req, res) => {
  try {
    const { name, email, mobileNumber, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { mobileNumber }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      mobileNumber,
      password,
      role: role || "admin",
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or mobile

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/mobile number and password",
      });
    }

    // Check for user
    const user = await User.findOne({
      $or: [{ email: identifier }, { mobileNumber: identifier }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: "Account is locked due to multiple failed login attempts. Please try again later.",
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;

      // Lock account after 5 failed attempts for 30 minutes
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
