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
const verifyRecaptcha = require("../utils/verifyRecaptcha");
const { sendEmail } = require("../utils/sendEmail");
const { enqueueEmail } = require("../utils/enqueueEmail");
const { client: redis } = require("../config/redis");

// Register a new user (deferred creation until OTP verification)
const register = async (req, res) => {
  try {
    const errors = validationResult(req); // Validate request body using express-validator

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, captchaToken } = req.body;

    // 1. Verify reCAPTCHA
    const human = await verifyRecaptcha(captchaToken);
    if (!human) {
      return res.status(400).json({
        success: false,
        message: "Captcha failed. Please confirm you're not a bot.",
      });
    }

    // If a user already exists, don't allow re-registration
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Stage pending registration in Redis (expires in 15 minutes)
    const dataKey = `reg:data:${email}`;
    const otpKey = `reg:otp:${email}`;

    // Store minimal required data; password will be hashed by Mongoose on save
    await redis.set(
      dataKey,
      JSON.stringify({ name, email, password, provider: "local" }),
      { EX: 900 }
    );

    // Generate OTP and store
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await redis.set(otpKey, code, { EX: 300 });

    // Send OTP email
    try {
      await sendEmail(
        email,
        "Your OTP Code",
        `Your OTP is ${code}. It expires in 5 minutes.`,
        `<p>Your OTP is <b>${code}</b>. It expires in 5 minutes.</p>`
      );
    } catch (e) {
      console.warn("Failed to send OTP email:", e.message);
    }

    const payload = {
      success: true,
      message: "Registration started. OTP sent to email.",
      requireOtp: true,
    };
    if (process.env.NODE_ENV !== "production") payload.devCode = code;

    return res.status(200).json(payload);
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

// Google Sign-In (deferred user creation for new users until OTP verification)
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

    if (!user) {
      // Stage pending Google registration
      const dataKey = `reg:data:${email}`;
      const otpKey = `reg:otp:${email}`;
      await redis.set(
        dataKey,
        JSON.stringify({
          provider: 'google',
          firebaseUid,
          email,
          name,
          avatar:
            photoURL ||
            "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
        }),
        { EX: 900 }
      );
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await redis.set(otpKey, code, { EX: 300 });
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

      const payload = {
        success: true,
        message: "Google Sign-Up started. OTP sent.",
        requireOtp: true,
      };
      if (process.env.NODE_ENV !== 'production') payload.devCode = code;
      return res.json(payload);
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

// OTP: generate and send (supports both pending registration and existing users)
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Resend for pending registration if staged
      const dataKey = `reg:data:${email}`;
      const otpKey = `reg:otp:${email}`;
      const pending = await redis.get(dataKey);
      if (!pending) {
        return res.status(404).json({ success: false, message: "No pending registration for this email" });
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await redis.set(otpKey, code, { EX: 300 });
      await sendEmail(
        email,
        "Your OTP Code",
        `Your OTP is ${code}. It expires in 5 minutes.`,
        `<p>Your OTP is <b>${code}</b>. It expires in 5 minutes.</p>`
      );
      const payload = { success: true, message: "OTP sent to email" };
      if (process.env.NODE_ENV !== 'production') payload.devCode = code;
      return res.json(payload);
    }

    // Existing user flow: always send a fresh OTP (supports resend)
    const key = `otp:${user._id}`;
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    await redis.set(key, code, { EX: 300 }); // overwrite and reset TTL

    const subject = "Your OTP Code";
    const text = `Your OTP is ${code}. It expires in 5 minutes.`;
    const html = `<p>Your OTP is <b>${code}</b>. It expires in 5 minutes.</p>`;
    await sendEmail(user.email, subject, text, html);

    const payload = { success: true, message: "OTP sent to email" };
    if (process.env.NODE_ENV !== 'production') payload.devCode = code;
    return res.json(payload);
  } catch (e) {
    console.error("sendOtp error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// OTP: verify and login or finalize registration
const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    const codeStr = String(code || '').trim();
    if (!email || !codeStr || codeStr.length !== 6) {
      return res.status(400).json({ success: false, message: "Email and 6-digit code are required" });
    }

    let user = await User.findOne({ email });
    if (user) {
      // Existing user verification (e.g., email verify for existing account)
      const key = `otp:${user._id}`;
      const saved = await redis.get(key);
      if (!saved) {
        return res.status(400).json({ success: false, message: "OTP expired" });
      }
      if (saved !== codeStr) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
      await redis.del(key);
      user.emailVerified = true;
      await user.save();
    } else {
      // Pending registration path
      const dataKey = `reg:data:${email}`;
      const otpKey = `reg:otp:${email}`;
      const saved = await redis.get(otpKey);
      if (!saved) {
        return res.status(400).json({ success: false, message: "OTP expired" });
      }
      if (saved !== codeStr) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
      const raw = await redis.get(dataKey);
      if (!raw) {
        return res.status(404).json({ success: false, message: "No pending registration" });
      }
      const pending = JSON.parse(raw);
      // Create the user now (only include password for local provider)
      const provider = pending.provider || 'local';
      const doc = {
        name: pending.name,
        email: pending.email,
        provider,
        firebaseUid: pending.firebaseUid,
        avatar: pending.avatar,
        emailVerified: true,
      };
      if (provider === 'local') {
        if (!pending.password) {
          return res.status(400).json({ success: false, message: 'Password missing for pending registration' });
        }
        doc.password = pending.password;
      }
      user = new User(doc);
      await user.save();
      await redis.del(otpKey);
      await redis.del(dataKey);

      // Optionally send welcome email asynchronously
      try {
        const subject = "Welcome to Formula 🎉";
        const text = `Hi ${user.name}, welcome to Formula! Your account has been created successfully.`;
        const html = `
          <div style=\"font-family:sans-serif;\">\n            <h2>Welcome to Formula, ${user.name}!</h2>\n            <p>You've successfully registered your account.</p>\n            <p>Start building and sharing your forms 🚀</p>\n            <p>— The Formula Team</p>\n          </div>
        `;
        enqueueEmail({ email: user.email, subject, text, html });
      } catch {}
    }

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
