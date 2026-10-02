const express = require("express");
const Activity = require("../models/Activity");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all activities for the logged-in teacher
router.get("/", auth, async (req, res) => {
  try {
    const activities = await Activity.find({ teacherId: req.teacher }).sort({ timestamp: -1 }).limit(10);
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new activity log
router.post("/", auth, async (req, res) => {
  try {
    const { action, details } = req.body;
    const newActivity = await Activity.create({ teacherId: req.teacher, action, details });
    res.status(201).json({ success: true, data: newActivity });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;