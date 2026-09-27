const express = require("express");
const Schedule = require("../models/Schedule");
const auth = require("../middleware/auth"); // Import Auth Middleware

const router = express.Router();

// Get all schedules
router.get("/", auth, async (req, res) => {
  try {
    const schedules = await Schedule.find({ teacherId: req.teacher }).sort({ day: 1, time: 1 });
    res.json({ success: true, data: schedules });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Add a single schedule class
router.post("/", auth, async (req, res) => {
  try {
    const scheduleClass = await Schedule.create({ ...req.body, teacherId: req.teacher });
    res.status(201).json({ success: true, data: scheduleClass });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// BULK ADD schedule classes
router.post("/bulk", auth, async (req, res) => {
  try {
    const { schedules } = req.body;
    const schedulesWithTeacher = schedules.map(s => ({ ...s, teacherId: req.teacher }));
    const insertedSchedules = await Schedule.insertMany(schedulesWithTeacher, { ordered: false });
    res.status(201).json({ success: true, data: insertedSchedules });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(201).json({ 
        success: true, 
        message: "Some schedules were skipped, but others were saved.",
        data: error.insertedDocs || [] 
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete a schedule class
router.delete("/:id", auth, async (req, res) => {
  try {
    const scheduleClass = await Schedule.findOneAndDelete({ _id: req.params.id, teacherId: req.teacher });
    if (!scheduleClass) return res.status(404).json({ success: false, message: "Schedule not found or unauthorized." });
    res.json({ success: true, message: "Schedule class deleted." });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

module.exports = router;