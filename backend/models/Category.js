// models/Category.js
// User-owned category. Each logged-in user manages their own categories.
// Tasks reference a Category by ObjectId.

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  // Every category belongs to exactly one user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Category must belong to a user"],
    index: true,
  },

  name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
    minlength: [1, "Name must not be empty"],
    maxlength: [50, "Name must be 50 characters or fewer"],
  },

  // react-icons identifier string, e.g. "FiBriefcase", "FiHome"
  icon: {
    type: String,
    default: "FiFolder",
    trim: true,
  },

  // CSS colour string stored as hex, e.g. "#6366f1"
  color: {
    type: String,
    default: "#6366f1",
    trim: true,
    match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Color must be a valid hex value"],
  },

  description: {
    type: String,
    trim: true,
    maxlength: [200, "Description must be 200 characters or fewer"],
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: a user cannot have two categories with the same name
categorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
