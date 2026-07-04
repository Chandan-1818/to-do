// models/Task.js
// Mongoose schema for a To-Do task.
// Extended with userId (owner), dueDate, priority, and category.

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

  // Optional free-text description / notes
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

  category: {
    type: String,
    trim: true,
    maxlength: [50, "Category must be 50 characters or fewer"],
    default: "General",
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

// Index on user so "find all tasks for user X" is fast
taskSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);
