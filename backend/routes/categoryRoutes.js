// routes/categoryRoutes.js
// All category endpoints are protected — req.user is always available.

const express   = require("express");
const router    = express.Router();
const { body }  = require("express-validator");

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect } = require("../middleware/auth");

// ── Validation rules ───────────────────────────────────────────────────────────

const createRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Category name is required")
    .isLength({ max: 50 }).withMessage("Name must be 50 characters or fewer"),
  body("color")
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage("Color must be a valid hex value"),
  body("description")
    .optional()
    .isLength({ max: 200 }).withMessage("Description must be 200 characters or fewer"),
];

const updateRules = [
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Category name cannot be empty")
    .isLength({ max: 50 }).withMessage("Name must be 50 characters or fewer"),
  body("color")
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage("Color must be a valid hex value"),
  body("description")
    .optional()
    .isLength({ max: 200 }).withMessage("Description must be 200 characters or fewer"),
];

// ── Routes ─────────────────────────────────────────────────────────────────────

router.route("/")
  .get(protect, getAllCategories)
  .post(protect, createRules, createCategory);

router.route("/:id")
  .get(protect, getCategoryById)
  .put(protect, updateRules, updateCategory)
  .delete(protect, deleteCategory);

module.exports = router;
