// routes/taskRoutes.js
// All task endpoints are protected — the auth middleware runs first
// so req.user is always available in controllers.

const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");

const {
  getAllTasks,
  getStats,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");

// ── Validation rules ───────────────────────────────────────────────────────────

const createTaskRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Task title is required")
    .isLength({ max: 200 }).withMessage("Title must be 200 characters or fewer"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"]).withMessage("Priority must be low, medium, or high"),
  body("dueDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage("Due date must be a valid date"),
];

const updateTaskRules = [
  body("title")
    .optional()
    .trim()
    .notEmpty().withMessage("Title cannot be empty")
    .isLength({ max: 200 }).withMessage("Title must be 200 characters or fewer"),
  body("completed")
    .optional()
    .isBoolean().withMessage("Completed must be true or false"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"]).withMessage("Priority must be low, medium, or high"),
  body("dueDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage("Due date must be a valid date"),
];

// ── Routes — all protected ─────────────────────────────────────────────────────

// Dashboard stats — must come before /:id so it isn't caught as an id lookup
router.get("/stats", protect, getStats);

router.route("/")
  .get(protect, getAllTasks)
  .post(protect, createTaskRules, createTask);

router.route("/:id")
  .get(protect, getTaskById)
  .put(protect, updateTaskRules, updateTask)
  .delete(protect, deleteTask);

module.exports = router;
