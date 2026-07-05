// controllers/categoryController.js
// Full CRUD for user-owned categories.
// Emits notifications on create/delete.
// getStats endpoint returns per-category analytics.

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Task     = require("../models/Task");
const { createNotification } = require("./notificationController");

// ── GET /api/categories ────────────────────────────────────────────────────────
const getAllCategories = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const filter = { user: req.user._id };
    if (search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const [categories, taskCounts, completedCounts] = await Promise.all([
      Category.find(filter).sort({ createdAt: -1 }),
      Task.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { user: req.user._id, completed: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap     = {};
    const completedMap = {};
    taskCounts.forEach(({ _id, count }) => {
      if (_id) countMap[_id.toString()] = count;
    });
    completedCounts.forEach(({ _id, count }) => {
      if (_id) completedMap[_id.toString()] = count;
    });

    const data = categories.map((cat) => {
      const id       = cat._id.toString();
      const total    = countMap[id]     || 0;
      const done     = completedMap[id] || 0;
      return {
        ...cat.toObject(),
        taskCount:     total,
        completedCount: done,
        pendingCount:  total - done,
        completionPct: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("[getAllCategories]", error);
    res.status(500).json({ success: false, message: "Server error fetching categories", error: error.message });
  }
};

// ── GET /api/categories/:id ────────────────────────────────────────────────────
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const now        = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const [total, completed, overdue, dueToday, byPriority, weeklyRaw] = await Promise.all([
      Task.countDocuments({ user: req.user._id, category: category._id }),
      Task.countDocuments({ user: req.user._id, category: category._id, completed: true }),
      Task.countDocuments({
        user: req.user._id, category: category._id, completed: false,
        dueDate: { $lt: todayStart, $ne: null },
      }),
      Task.countDocuments({
        user: req.user._id, category: category._id,
        dueDate: { $gte: todayStart, $lte: todayEnd },
      }),
      Task.aggregate([
        { $match: { user: req.user._id, category: category._id } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      // Weekly completion for this category
      Task.aggregate([
        {
          $match: {
            user: req.user._id,
            category: category._id,
            completed: true,
            createdAt: { $gte: new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            completed: { $sum: 1 },
          },
        },
      ]),
    ]);

    const pending        = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const priorityCounts = { low: 0, medium: 0, high: 0 };
    byPriority.forEach(({ _id, count }) => {
      if (_id in priorityCounts) priorityCounts[_id] = count;
    });

    // Build 7-day weekly array
    const weeklyMap = {};
    weeklyRaw.forEach(({ _id, completed }) => { weeklyMap[_id] = completed; });
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split("T")[0];
      return {
        day:       d.toLocaleDateString("en-US", { weekday: "short" }),
        completed: weeklyMap[key] || 0,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        taskCount:      total,
        completedCount: completed,
        pendingCount:   pending,
        overdueCount:   overdue,
        dueTodayCount:  dueToday,
        completionRate,
        priorityCounts,
        weeklyData,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ── POST /api/categories ───────────────────────────────────────────────────────
const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { name, icon, color, description } = req.body;

    const existing = await Category.findOne({
      user: req.user._id,
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: `Category "${name}" already exists` });
    }

    const category = await Category.create({
      user:        req.user._id,
      name:        name.trim(),
      icon:        icon        || "FiFolder",
      color:       color       || "#6366f1",
      description: description?.trim() || "",
    });

    createNotification(
      req.user._id,
      "category_created",
      "Category created",
      `"${name.trim()}" category is ready to use.`,
      category._id,
      "category"
    );

    res.status(201).json({
      success: true,
      message: "Category created",
      data: {
        ...category.toObject(),
        taskCount: 0, completedCount: 0, pendingCount: 0, completionPct: 0,
      },
    });
  } catch (error) {
    console.error("[createCategory]", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Category name already exists" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: "Server error creating category", error: error.message });
  }
};

// ── PUT /api/categories/:id ────────────────────────────────────────────────────
const updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { name, icon, color, description } = req.body;
    const updateFields = {};
    if (name        !== undefined) updateFields.name        = name.trim();
    if (icon        !== undefined) updateFields.icon        = icon;
    if (color       !== undefined) updateFields.color       = color;
    if (description !== undefined) updateFields.description = description.trim();

    if (name) {
      const existing = await Category.findOne({
        user: req.user._id,
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `Category "${name}" already exists` });
      }
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const [taskCount, completedCount] = await Promise.all([
      Task.countDocuments({ user: req.user._id, category: category._id }),
      Task.countDocuments({ user: req.user._id, category: category._id, completed: true }),
    ]);

    res.status(200).json({
      success: true, message: "Category updated",
      data: {
        ...category.toObject(),
        taskCount,
        completedCount,
        pendingCount:  taskCount - completedCount,
        completionPct: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("[updateCategory]", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Category name already exists" });
    }
    res.status(500).json({ success: false, message: "Server error updating category", error: error.message });
  }
};

// ── DELETE /api/categories/:id ─────────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const { action, moveTo } = req.query;
    const categoryId = req.params.id;

    const category = await Category.findOne({ _id: categoryId, user: req.user._id });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (action === "deleteAll") {
      await Task.deleteMany({ user: req.user._id, category: categoryId });
    } else if (action === "moveTo" && moveTo) {
      const targetCategory = await Category.findOne({ _id: moveTo, user: req.user._id });
      if (!targetCategory) {
        return res.status(404).json({ success: false, message: "Target category not found" });
      }
      await Task.updateMany(
        { user: req.user._id, category: categoryId },
        { $set: { category: moveTo } }
      );
    } else {
      await Task.updateMany(
        { user: req.user._id, category: categoryId },
        { $set: { category: null } }
      );
    }

    await Category.findByIdAndDelete(categoryId);

    createNotification(
      req.user._id,
      "category_deleted",
      "Category deleted",
      `"${category.name}" was removed.`,
      null, null
    );

    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("[deleteCategory]", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }
    res.status(500).json({ success: false, message: "Server error deleting category", error: error.message });
  }
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
