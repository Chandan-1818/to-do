// controllers/authController.js
// Handles user registration, login, logout, and profile retrieval.

const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

// ── Guard: fail loudly at startup if JWT_SECRET is not configured ─────────────
// This prevents a cryptic 500 at runtime and surfaces the misconfiguration
// immediately when the server starts.
if (!process.env.JWT_SECRET) {
  console.error(
    "FATAL: JWT_SECRET is not set in .env. " +
    "The server cannot sign tokens. Exiting."
  );
  process.exit(1);
}

// ── Helper: sign a JWT and return it ──────────────────────────────────────────
// Throws if JWT_SECRET is undefined — now caught by surrounding try/catch blocks.
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ── Helper: build a consistent auth response ──────────────────────────────────
// Must be called from INSIDE a try/catch so that jwt.sign() errors are caught.
const sendAuthResponse = (res, statusCode, user, message) => {
  const token = signToken(user._id); // may throw — callers must be in try/catch

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userData,
  });
};

// ── POST /api/auth/register ────────────────────────────────────────────────────
const register = async (req, res) => {
  // 1. express-validator checks
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }

  try {
    const { name, email, password } = req.body;

    // 2. Duplicate email check (application-level, fast path)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists",
      });
    }

    // 3. Create user — password hashing happens in the pre-save hook
    const user = await User.create({ name, email, password });

    // 4. Fire a welcome notification (non-blocking)
    createNotification(
      user._id,
      "welcome",
      `Welcome to TaskFlow, ${name.trim()}! 🎉`,
      "Start by creating your first task or setting up a category.",
      null, null
    );

    // 5. Sign token and send response — INSIDE try/catch so jwt errors are caught
    console.log(`[register] New user created: ${user.email} (${user._id})`);
    sendAuthResponse(res, 201, user, "Account created successfully");
  } catch (error) {
    // Log the full error so it appears in server console for debugging
    console.error("[register] Error:", error);

    // MongoDB duplicate key (race condition — two requests with same email)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists",
      });
    }

    // Mongoose schema validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }

    // JWT misconfiguration
    if (error.message === "secretOrPrivateKey must have a value") {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT secret is not set",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { email, password } = req.body;

    // Explicitly select password (it is select:false in the schema)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      // Generic message — don't reveal whether the email exists
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // sendAuthResponse is inside try/catch so jwt.sign() errors are caught
    console.log(`[login] User authenticated: ${user.email}`);
    sendAuthResponse(res, 200, user, "Login successful");
  } catch (error) {
    console.error("[login] Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// ── GET /api/auth/me — returns the currently logged-in user ───────────────────
// Protected by the auth middleware, so req.user is already populated
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("[getMe] Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
      error: error.message,
    });
  }
};

// ── PUT /api/auth/profile — update name and/or password ───────────────────────
const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { name, currentPassword, newPassword } = req.body;

    // Reload user with password so we can verify currentPassword
    const user = await User.findById(req.user._id).select("+password");

    // Update name if provided
    if (name) user.name = name;

    // Update password if provided — require the current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set a new password",
        });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
      user.password = newPassword; // pre-save hook will hash it
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
      error: error.message,
    });
  }
};

module.exports = { register, login, getMe, updateProfile };
