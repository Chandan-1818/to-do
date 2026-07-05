// routes/notificationRoutes.js
// All notification endpoints are protected.

const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const {
  getAll,
  markRead,
  markAllRead,
  deleteOne,
  clearAll,
} = require("../controllers/notificationController");

router.get("/",              protect, getAll);
router.patch("/read-all",    protect, markAllRead);   // must be before /:id
router.patch("/:id/read",    protect, markRead);
router.delete("/",           protect, clearAll);
router.delete("/:id",        protect, deleteOne);

module.exports = router;
