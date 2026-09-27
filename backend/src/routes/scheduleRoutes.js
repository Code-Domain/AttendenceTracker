const express = require("express");
const Schedule = require("../models/Schedule");
const auth = require("../middleware/auth"); // ADD THIS

const router = express.Router();

// Get all schedules for logged in teacher
router.get("/", auth, async (req, res) => { // Add auth
  try {
    const schedules = await Schedule.find({ teacherId: req.teacher.id }).sort({ day: 1, time: 1 });
    res.json({ success: true, data: schedules });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Add a single schedule class
router.post("/", auth, async (req, res) => { // Add auth
  try {
    const scheduleClass = await Schedule.create({ ...req.body, teacherId: req.teacher.id });
    res.status(201).json({ success: true, data: scheduleClass });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// BULK ADD schedule classes
router.post("/bulk", auth, async (req, res) => { // Add auth
  try {
    const { schedules } = req.body;
    const schedulesWithTeacher = schedules.map(s => ({ ...s, teacherId: req.teacher.id }));
    const insertedSchedules = await Schedule.insertMany(schedulesWithTeacher, { ordered: false });
    res.status(201).json({ success: true, data: insertedSchedules });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Delete a schedule class
router.delete("/:id", auth, async (req, res) => { // Add auth
  try {
    const scheduleClass = await Schedule.findOneAndDelete({ _id: req.params.id, teacherId: req.teacher.id });
    if (!scheduleClass) return res.status(404).json({ success: false, message: "Not found or unauthorized" });
    res.json({ success: true, message: "Schedule class deleted." });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

module.exports = router;