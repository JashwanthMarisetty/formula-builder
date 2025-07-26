const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { auth } = require("../middleware/auth");
const { validationResult } = require("express-validator");
const { generateToken, verifyRefreshToken, generateRefreshToken } = require("../utils/jwt");

// Register a new user
const register = async (req, res) => {
  try {
    const errors = validationResult(req); // Validate request body using express-validator

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password, // Let the model's pre-save middleware handle hashing
    });

    await user.save();

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req); // Validate request body using express-validator
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id); // Refresh token valid for 30 days
    
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };

    res.json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token,
      refreshToken,
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // TODO: Implement email functionality
    // For now, just return the token (in production, this should be sent via email)
    res.json({
      success: true,
      message: "Password reset token generated. Check console for token (implement email service)",
      resetToken: resetToken, // Remove this in production
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMe = async (req, res) => {
  // Get current user details. This endpoint is used to retrieve the authenticated user's details.
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Google Sign-In
const googleSignIn = async (req, res) => {
  try {
    const { firebaseUid, email, name, photoURL } = req.body;

    // Check if user already exists by email or firebaseUid
    let user = await User.findOne({ $or: [{ email }, { firebaseUid }] });

    if (!user) {
      // New Google user; create them in the database
      user = new User({
        firebaseUid,
        email,
        name,
        avatar: photoURL,
        provider: 'google',
        password: 'google-oauth', // Password not needed for Google Sign-In
        emailVerified: true // Google users have verified emails
      });
      await user.save();
    }

    // Generate tokens for the user
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: "Google Sign-In successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Google Sign-In error:", error);
    res.status(500).json({ message: "Google Sign-In failed", error: error.message });
  }
};

module.exports = { register , login , refreshToken , forgotPassword , resetPassword , getMe, googleSignIn };
