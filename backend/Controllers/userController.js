const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { auth } = require("../middleware/auth");
const { validationResult } = require("express-validator");
const {
  generateToken,
  verifyRefreshToken,
  generateRefreshToken,
} = require("../utils/jwt");
const { sendEmail } = require("../utils/sendEmail");
const { enqueueEmail } = require("../utils/enqueueEmail");
const { client: redis } = require("../config/redis");

// Register a new user (deferred creation until OTP verification)
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const pendingKey = `regotp:${email}`;
    let code;

    // If a pending registration exists, reuse the same OTP
    try {
      const pendingStr = await redis.get(pendingKey);
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        if (pending && pending.code) {
          code = pending.code;
        }
      }
    } catch (_) {}

    if (!code) {
      code = String(Math.floor(100000 + Math.random() * 900000));
      const payload = {
        code,
        data: { name, email, password, provider: "local" },
      };
      await redis.set(pendingKey, JSON.stringify(payload), { EX: 300 });
    }

    const subject = "Your OTP Code";
    const text = `Your OTP is ${code}. It expires in 5 minutes.`;
    const html = `<p>Your OTP is <b>${code}</b>. It expires in 5 minutes.</p>`;
    await sendEmail(email, subject, text, html);

    return res.status(200).json({
      success: true,
      message: "OTP sent. Complete verification to create your account.",
      requireOtp: true,
    });
  } catch (err) {
    console.error("Error starting registration:", err);
    return res.status(500).json({ message: "Server error" });
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

    if (!user) {
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
      message: "Password reset token generated.",
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

    // Validate required fields
    if (!firebaseUid || !email || !name) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: firebaseUid, email, and name are required",
      });
    }

    // Check if user already exists by email or firebaseUid
    let user = await User.findOne({ $or: [{ email }, { firebaseUid }] });
    let isNew = false;

    if (!user) {
      // New Google user; defer DB creation until OTP verification
      isNew = true;

      const pendingKey = `regotp:${email}`;
      let code;

      // Try to reuse an existing pending OTP
      try {
        const existingPendingStr = await redis.get(pendingKey);
        if (existingPendingStr) {
          const existingPending = JSON.parse(existingPendingStr);
          if (existingPending && existingPending.code) {
            code = existingPending.code;
          }
        }
      } catch (_) {}

      if (!code) {
        code = String(Math.floor(100000 + Math.random() * 900000));
        const payload = {
          code,
          data: {
            name,
            email,
            firebaseUid,
            avatar:
              photoURL ||
              "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
            provider: "google",
          },
        };
        await redis.set(pendingKey, JSON.stringify(payload), { EX: 300 });
      }

      try {
        await sendEmail(
          email,
          "Your OTP Code",
          `Your OTP is ${code}. It expires in 5 minutes.`,
          `<p>Your OTP is <b>${code}</b>. It expires in 5 minutes.</p>`
        );
      } catch (e) {
        console.warn("Failed to send OTP for Google user:", e.message);
      }

      return res.json({
        success: true,
        message: "Google Sign-Up started. OTP sent.",
        requireOtp: true,
      });
    }

    // Existing user → generate tokens for the user
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: "Google Sign-In successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Google Sign-In error:", error);
    res.status(500).json({
      success: false,
      message: "Google Sign-In failed",
      error: error.message,
    });
  }
};

// OTP: generate and send
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    const user = await User.findOne({ email });
    if (!user) {
      // Check for pending registration and resend that OTP if present
      const pendingKey = `regotp:${email}`;
      try {
        const pendingStr = await redis.get(pendingKey);
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          if (pending && pending.code) {
            const subject = "Your OTP Code";
            const text = `Your OTP is ${pending.code}. It expires in 5 minutes.`;
            const html = `<p>Your OTP is <b>${pending.code}</b>. It expires in 5 minutes.</p>`;
            await sendEmail(email, subject, text, html);
            return res.json({ success: true, message: "OTP resent to email" });
          }
        }
      } catch (_) {}
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const key = `otp:${user._id}`;
    // Avoid duplicate emails: if an OTP exists, do not resend
    const existing = await redis.get(key);
    if (existing) {
      return res.json({ success: true, message: "OTP already sent" });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    // SET with NX so concurrent requests won't overwrite or send multiple
    await redis.set(key, code, { EX: 300, NX: true }); // 5 minutes

    const subject = "Your OTP Code";
    const text = `Your OTP is ${code}. It expires in 5 minutes.`;
    const html = `<p>Your OTP is <b>${code}</b>. It expires in 5 minutes.</p>`;
    await sendEmail(user.email, subject, text, html);

    return res.json({ success: true, message: "OTP sent to email" });
  } catch (e) {
    console.error("sendOtp error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// OTP: verify and login or complete registration
const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res
        .status(400)
        .json({ success: false, message: "Email and code are required" });

    // First, check if this is a pending registration
    const pendingKey = `regotp:${email}`;
    try {
      const pendingStr = await redis.get(pendingKey);
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        if (!pending || String(pending.code) !== String(code)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid OTP" });
        }

        // Create the user now
        const data = pending.data || {};
        const avatarDefault =
          "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1";

        const newUser = new User({
          name: data.name,
          email: data.email,
          password: data.provider === "google" ? "google-oauth" : data.password,
          avatar: data.avatar || avatarDefault,
          provider: data.provider || "local",
          firebaseUid: data.firebaseUid,
          emailVerified: true,
        });
        await newUser.save();
        await redis.del(pendingKey);

        // Welcome email
        const subject = "Welcome to Formula 🎉";
        const text = `Hi ${data.name}, welcome to Formula! Your account has been created successfully.`;
        const html = `
          <div style="font-family:sans-serif;">
            <h2>Welcome to Formula, ${data.name}!</h2>
            <p>You've successfully verified your email.</p>
            <p>Start building and sharing your forms 🚀</p>
            <p>— The Formula Team</p>
          </div>
        `;
        enqueueEmail({ email: data.email, subject, text, html });

        const token = generateToken(newUser._id);
        const refreshToken = generateRefreshToken(newUser._id);

        return res.json({
          success: true,
          message: "Registration completed",
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            avatar: newUser.avatar,
          },
          token,
          refreshToken,
        });
      }
    } catch (_) {}

    // Otherwise, treat as OTP verification for existing user
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const key = `otp:${user._id}`;
    const saved = await redis.get(key);
    if (!saved)
      return res.status(400).json({ success: false, message: "OTP expired" });
    if (saved !== String(code))
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    await redis.del(key);
    user.emailVerified = true;
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res.json({
      success: true,
      message: "OTP verified",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    });
  } catch (e) {
    console.error("verifyOtp error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  googleSignIn,
  sendOtp,
  verifyOtp,
};
