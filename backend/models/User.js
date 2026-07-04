// models/User.js
// Mongoose schema for an application user.
// Passwords are hashed with bcrypt before saving.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name must be 50 characters or fewer"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,         // enforced at the DB index level
    lowercase: true,      // normalise before storing
    trim: true,
    match: [
      /^\S+@\S+\.\S+$/,
      "Please provide a valid email address",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    // Never return the password field in query results by default
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Pre-save hook — hash the password whenever it is modified ──────────────────
userSchema.pre("save", async function (next) {
  // Only hash if the password field was actually changed
  if (!this.isModified("password")) return next();

  // Salt rounds: 12 is a good balance of security vs speed
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method — compare a plain-text password against the hash ───────────
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
