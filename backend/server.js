// server.js
// Entry point for the Express backend.
//
// IMPORTANT: dotenv.config() MUST run before any other require() that
// reads process.env (controllers, middleware, models). Node executes
// require() calls synchronously at load time, so env vars must already
// be populated by the time those modules initialise.

// ── 1. Load environment variables — MUST BE FIRST ─────────────────────────────
const path   = require("path");
const dotenv = require("dotenv");
// Absolute path ensures .env is always found regardless of CWD
dotenv.config({ path: path.join(__dirname, ".env") });

// ── 2. All other requires come AFTER dotenv ────────────────────────────────────
const express = require("express");
const cors    = require("cors");

const connectDB  = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

// ── 3. Connect to MongoDB ──────────────────────────────────────────────────────
connectDB();

// ── 4. Create Express app ──────────────────────────────────────────────────────
const app = express();

// ── 5. Middleware ──────────────────────────────────────────────────────────────

// Allow requests from the React dev server and production origin
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Parse JSON request bodies — required for req.body to be populated
app.use(express.json());

// ── 6. Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/tasks", taskRoutes);

// Health-check endpoint
app.get("/", (req, res) => {
  res.json({ message: "To-Do API v2 is running" });
});

// ── 7. 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ── 8. Global error handler ────────────────────────────────────────────────────
// Express recognises a 4-argument middleware as an error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred",
    error:   err.message,
  });
});

// ── 9. Start server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
