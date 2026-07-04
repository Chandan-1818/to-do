// controllers/taskController.js
// CRUD for tasks. All operations are scoped to req.user._id so users
// can only access their own data.
// Supports search, filter by status, sort order, and pagination.

const { validationResult } = require("express-validator");
const Task = require("../models/Task");

// ── GET /api/tasks ─────────────────────────────────────────────────────────────
// Query params:
//   search   - text search on title/description/category
//   status   - "all" | "completed" | "pending"
//   sort     - "newest" | "oldest" | "alpha" | "priority" | "dueDate"
//   priority - "low" | "medium" | "high"
//   category - any string
//   page     - page number (default 1)
//   limit    - items per page (default 10)
const getAllTasks = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      sort = "newest",
      priority,
      category,
      page = 1,
      limit = 10,
    } = req.query;

    // ── Build the filter object ──────────────────────────────────────────────
    const filter = { user: req.user._id };

    if (status === "completed") filter.completed = true;
    if (status === "pending")   filter.completed = false;
    if (priority)               filter.priority = priority;
    if (category)               filter.category = { $regex: category, $options: "i" };

    if (search.trim()) {
      filter.$or = [
        { title:       { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { category:    { $regex: search.trim(), $options: "i" } },
      ];
    }

    // ── Build the sort object ────────────────────────────────────────────────
    const sortMap = {
      newest:   { createdAt: -1 },
      oldest:   { createdAt:  1 },
      alpha:    { title:      1 },
      priority: { priority:  -1 },  // high → medium → low when sorted desc
      dueDate:  { dueDate:    1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    // ── Pagination ───────────────────────────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page,  10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sortObj).skip(skip).limit(limitNum),
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
    res.status(500).json({
      success: false,
      message: "Server error while fetching tasks",
      error: error.message,
    });
  }
};

// ── GET /api/tasks/stats ───────────────────────────────────────────────────────
// Returns aggregate counts for the dashboard.
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [total, completed, byPriority, recentTasks] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, completed: true }),
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Task.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title completed priority createdAt dueDate"),
    ]);

    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Reshape priority aggregation into a plain object
    const priorityCounts = { low: 0, medium: 0, high: 0 };
    byPriority.forEach(({ _id, count }) => {
      if (_id in priorityCounts) priorityCounts[_id] = count;
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        completed,
        pending,
        completionRate,
        priorityCounts,
        recentTasks,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching stats",
      error: error.message,
    });
  }
};

// ── GET /api/tasks/:id ─────────────────────────────────────────────────────────
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

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
    const { title, description, priority, category, dueDate } = req.body;

    const task = await Task.create({
      user:        req.user._id,
      title:       title.trim(),
      description: description?.trim() || "",
      priority:    priority || "medium",
      category:    category?.trim() || "General",
      dueDate:     dueDate || null,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
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
    const { title, completed, description, priority, category, dueDate } = req.body;

    const updateFields = {};
    if (title       !== undefined) updateFields.title       = title.trim();
    if (completed   !== undefined) updateFields.completed   = completed;
    if (description !== undefined) updateFields.description = description.trim();
    if (priority    !== undefined) updateFields.priority    = priority;
    if (category    !== undefined) updateFields.category    = category.trim();
    if (dueDate     !== undefined) updateFields.dueDate     = dueDate || null;

    // user filter ensures a user cannot update another user's task
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
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
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ── DELETE /api/tasks/:id ──────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, message: "Task deleted", data: task });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = { getAllTasks, getStats, getTaskById, createTask, updateTask, deleteTask };
