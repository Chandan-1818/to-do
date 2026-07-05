// models/Notification.js
// Per-user notification documents.
// Created by the backend whenever a significant event occurs
// (task created/completed/deleted/edited, category events, due-date alerts).

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // Semantic type used by the frontend to pick an icon and colour
  type: {
    type: String,
    enum: [
      "task_created",
      "task_completed",
      "task_deleted",
      "task_edited",
      "category_created",
      "category_deleted",
      "due_today",
      "overdue",
      "upcoming",
      "welcome",
      "info",
    ],
    default: "info",
  },

  title:   { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, default: "",    trim: true, maxlength: 300 },

  // Optional reference so the frontend can link to the relevant resource
  refId:   { type: mongoose.Schema.Types.ObjectId, default: null },
  refType: { type: String, enum: ["task", "category", null], default: null },

  read: { type: Boolean, default: false, index: true },

  createdAt: { type: Date, default: Date.now, index: true },
});

// Keep only the 100 most-recent notifications per user (TTL-style cap on delete)
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
