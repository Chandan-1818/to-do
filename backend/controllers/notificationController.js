// controllers/notificationController.js
// Full CRUD for per-user notifications.
// All operations are scoped to req.user._id.

const Notification = require("../models/Notification");

// ── GET /api/notifications ─────────────────────────────────────────────────────
// Returns up to 50 notifications, newest first.
// ?unread=true returns only unread ones.
const getAll = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.unread === "true") filter.read = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);

    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    console.error("[getAll notifications]", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ── PATCH /api/notifications/:id/read ─────────────────────────────────────────
const markRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ── PATCH /api/notifications/read-all ─────────────────────────────────────────
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ── DELETE /api/notifications/:id ─────────────────────────────────────────────
const deleteOne = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ── DELETE /api/notifications ──────────────────────────────────────────────────
const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ── Helper exported for use by other controllers ───────────────────────────────
// Creates a notification without going through HTTP — called internally.
const createNotification = async (userId, type, title, message = "", refId = null, refType = null) => {
  try {
    await Notification.create({ user: userId, type, title, message, refId, refType });

    // Cap at 100 notifications per user — delete the oldest ones beyond the limit
    const count = await Notification.countDocuments({ user: userId });
    if (count > 100) {
      const oldest = await Notification.find({ user: userId })
        .sort({ createdAt: 1 })
        .limit(count - 100)
        .select("_id");
      await Notification.deleteMany({ _id: { $in: oldest.map((n) => n._id) } });
    }
  } catch (err) {
    // Notifications are non-critical — log but don't throw
    console.error("[createNotification]", err.message);
  }
};

module.exports = { getAll, markRead, markAllRead, deleteOne, clearAll, createNotification };
