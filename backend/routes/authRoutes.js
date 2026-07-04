// routes/authRoutes.js
// Authentication endpoints: register, login, get profile, update profile.

const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");

const { register, login, getMe, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// ── Validation rule sets ───────────────────────────────────────────────────────

const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginRules = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),
  body("newPassword")
    .optional()
    .isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.post("/register", registerRules,       register);
router.post("/login",    loginRules,          login);
router.get( "/me",       protect,             getMe);
router.put( "/profile",  protect, updateProfileRules, updateProfile);

module.exports = router;
