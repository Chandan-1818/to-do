// controllers/taskController.js
// CRUD for tasks scoped to req.user._id.
// Emits a notification for every create / update / delete action.
// getStats now includes overdue, dueToday, weekly and monthly trend data.

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Task     = require("../models/Task");
const Category = require("../models/Category");
const { createNotification } = require("./notificationController");

// ── Helper: resolve + validate a category value from the request body ─────────
// Accepts both `category` and `categoryId` field names.
// Returns { ok, value } — value is an ObjectId or null.
// Rejects ids that are malformed or belong to another user.
const resolveCategoryId = async (rawValue, userId) => {
  // Not provided / cleared → uncategorised
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return { ok: true, value: null };
  }
  if (!mongoose.Types.ObjectId.isValid(rawValue)) {
    return { ok: false, message: "Invalid category ID" };
  }
  // Ownership check — the category must exist AND belong to this user
  const category = await Category.findOne({ _id: rawValue, user: userId }).select("_id");
  if (!category) {
    return { ok: false, message: "Category not found or does not belong to you" };
  }
  return { ok: true, value: category._id };
};

// ── GET /api/tasks ─────────────────────────────────────────────────────────────
const getAllTasks = async (req, res) => {
  try {
    const {
      search   = "",
      status   = "all",
      sort     = "newest",
      priority,
      category,
      page     = 1,
      limit    = 10,
    } = req.query;

    const filter = { user: req.user._id };

    if (status === "completed") filter.completed = true;
    if (status === "pending")   filter.completed = false;
    if (priority)               filter.priority  = priority;

    if (category === "none") {
      filter.category = null;
    } else if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    if (search.trim()) {
      filter.$or = [
        { title:       { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const sortMap = {
      newest:   { createdAt: -1 },
      oldest:   { createdAt:  1 },
      alpha:    { title:      1 },
      priority: { priority:  -1 },
      dueDate:  { dueDate:    1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    const pageNum  = Math.max(1, parseInt(page,  10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
          .populate("category", "name icon color")
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum),
      Task.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count:      tasks.length,
      total,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      data:       tasks,
    });
  } catch (error) {
    console.error("[getAllTasks]", error);
    res.status(500).json({ success: false, message: "Server error fetching tasks", error: error.message });
  }
};

// ── GET /api/tasks/stats ───────────────────────────────────────────────────────
// Enhanced: includes overdue, dueToday, weekly completion trend, monthly trend.
const getStats = async (req, res) => {
  try {
    const userId  = req.user._id;
    const now     = new Date();

    // Start of today (midnight local ≈ UTC for server)
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    // Last 7 days — generate day labels
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    // Last 12 months
    const monthStarts = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return d;
    });

    const [
      total,
      completed,
      overdue,
      dueToday,
      byPriority,
      byCategory,
      recentTasks,
      weeklyRaw,
      monthlyRaw,
    ] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, completed: true }),
      // Overdue: past due date, not yet completed
      Task.countDocuments({
        user: userId,
        completed: false,
        dueDate: { $lt: todayStart, $ne: null },
      }),
      // Due today: due date falls within today
      Task.countDocuments({
        user: userId,
        completed: false,
        dueDate: { $gte: todayStart, $lte: todayEnd },
      }),
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { user: userId, category: { $ne: null } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
        { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, count: 1, name: "$cat.name", color: "$cat.color", icon: "$cat.icon" } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Task.find({ user: userId })
          .populate("category", "name icon color")
          .sort({ createdAt: -1 })
          .limit(5)
          .select("title completed priority category createdAt dueDate"),
      // Daily completed count for the last 7 days
      Task.aggregate([
        {
          $match: {
            user: userId,
            completed: true,
            createdAt: { $gte: weekDays[0] },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            completed: { $sum: 1 },
          },
        },
      ]),
      // Monthly task counts for the last 12 months
      Task.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: monthStarts[0] },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            },
            created:   { $sum: 1 },
            completed: { $sum: { $cond: ["$completed", 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const pending        = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const priorityCounts = { low: 0, medium: 0, high: 0 };
    byPriority.forEach(({ _id, count }) => {
      if (_id in priorityCounts) priorityCounts[_id] = count;
    });

    // Build weekly chart data (last 7 days)
    const weeklyCompletedMap = {};
    weeklyRaw.forEach(({ _id, completed }) => { weeklyCompletedMap[_id] = completed; });

    const weeklyData = weekDays.map((d) => {
      const key = d.toISOString().split("T")[0];
      return {
        day:       d.toLocaleDateString("en-US", { weekday: "short" }),
        date:      key,
        completed: weeklyCompletedMap[key] || 0,
      };
    });

    // Build monthly chart data (last 12 months)
    const monthlyMap = {};
    monthlyRaw.forEach(({ _id, created, completed }) => { monthlyMap[_id] = { created, completed }; });

    const monthlyData = monthStarts.map((d) => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        month:     d.toLocaleDateString("en-US", { month: "short" }),
        created:   monthlyMap[key]?.created   || 0,
        completed: monthlyMap[key]?.completed || 0,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        completed,
        pending,
        overdue,
        dueToday,
        completionRate,
        priorityCounts,
        categoryStats: byCategory,
        recentTasks,
        weeklyData,
        monthlyData,
      },
    });
  } catch (error) {
    console.error("[getStats]", error);
    res.status(500).json({ success: false, message: "Server error fetching stats", error: error.message });
  }
};

// ── GET /api/tasks/:id ─────────────────────────────────────────────────────────
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
                           .populate("category", "name icon color");
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ── POST /api/tasks ────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { title, description, priority, category, categoryId: categoryIdField, dueDate } = req.body;

    // Accept both `category` and `categoryId`, validate ownership
    const rawCategory = categoryIdField !== undefined ? categoryIdField : category;
    const catResult   = await resolveCategoryId(rawCategory, req.user._id);
    if (!catResult.ok) {
      return res.status(400).json({ success: false, message: catResult.message });
    }
    const categoryId = catResult.value;

    const task = await Task.create({
      user:        req.user._id,
      title:       title.trim(),
      description: description?.trim() || "",
      priority:    priority || "medium",
      category:    categoryId,
      dueDate:     dueDate || null,
    });

    const populated = await task.populate("category", "name icon color");

    // Fire notification (non-blocking)
    createNotification(
      req.user._id,
      "task_created",
      "Task created",
      `"${title.trim()}" was added to your list.`,
      task._id,
      "task"
    );

    res.status(201).json({ success: true, message: "Task created", data: populated });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error("[createTask]", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ── PUT /api/tasks/:id ─────────────────────────────────────────────────────────
const updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { title, completed, description, priority, category, categoryId: categoryIdField, dueDate } = req.body;
    const updateFields = {};

    if (title       !== undefined) updateFields.title       = title.trim();
    if (completed   !== undefined) updateFields.completed   = completed;
    if (description !== undefined) updateFields.description = description.trim();
    if (priority    !== undefined) updateFields.priority    = priority;
    if (dueDate     !== undefined) updateFields.dueDate     = dueDate || null;

    // Accept both `category` and `categoryId`, validate ownership
    if (category !== undefined || categoryIdField !== undefined) {
      const rawCategory = categoryIdField !== undefined ? categoryIdField : category;
      const catResult   = await resolveCategoryId(rawCategory, req.user._id);
      if (!catResult.ok) {
        return res.status(400).json({ success: false, message: catResult.message });
      }
      updateFields.category = catResult.value;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateFields,
      { new: true, runValidators: true }
    ).populate("category", "name icon color");

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    // Decide notification type
    if (completed === true) {
      createNotification(
        req.user._id,
        "task_completed",
        "Task completed! 🎉",
        `"${task.title}" has been marked as done.`,
        task._id,
        "task"
      );
    } else if (completed === false) {
      createNotification(
        req.user._id,
        "task_edited",
        "Task reopened",
        `"${task.title}" was marked as pending.`,
        task._id,
        "task"
      );
    } else {
      createNotification(
        req.user._id,
        "task_edited",
        "Task updated",
        `"${task.title}" was edited.`,
        task._id,
        "task"
      );
    }

    res.status(200).json({ success: true, message: "Task updated", data: task });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error("[updateTask]", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ── DELETE /api/tasks/:id ──────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    createNotification(
      req.user._id,
      "task_deleted",
      "Task deleted",
      `"${task.title}" was removed.`,
      null,
      null
    );

    res.status(200).json({ success: true, message: "Task deleted", data: task });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }
    console.error("[deleteTask]", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = { getAllTasks, getStats, getTaskById, createTask, updateTask, deleteTask };
