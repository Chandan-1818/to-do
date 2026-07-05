// models/Task.js
// Mongoose schema for a To-Do task.
// category field now holds an ObjectId reference to Category instead of a plain string.
// The string fallback (categoryName) is kept for display when the category is deleted.

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  // Every task belongs to exactly one user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Task must belong to a user"],
  },

  title: {
    type: String,
    required: [true, "Task title is required"],
    trim: true,
    minlength: [1, "Title must not be empty"],
    maxlength: [200, "Title must be 200 characters or fewer"],
  },

  completed: {
    type: Boolean,
    default: false,
  },

  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description must be 1000 characters or fewer"],
    default: "",
  },

  priority: {
    type: String,
    enum: {
      values: ["low", "medium", "high"],
      message: "Priority must be low, medium, or high",
    },
    default: "medium",
  },

  // ObjectId reference to Category — nullable (task may be uncategorised)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },

  dueDate: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for fast per-user queries
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model("Task", taskSchema);
