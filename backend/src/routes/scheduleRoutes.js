// routes/scheduleRoutes.js
const express = require("express");
const Schedule = require("../models/Schedule");

const router = express.Router();

// Get all schedules
router.get("/", async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ day: 1, time: 1 });
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a single schedule class
router.post("/", async (req, res) => {
  try {
    const { day, time, subject, semester, rollRange } = req.body;

    if (!day || !time || !subject || semester === undefined || !rollRange) {
      return res.status(400).json({
        success: false,
        message: "All fields (day, time, subject, semester, rollRange) are required.",
      });
    }

    const scheduleClass = await Schedule.create({ day, time, subject, semester, rollRange });
    res.status(201).json({ success: true, data: scheduleClass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// BULK ADD schedule classes (For Excel Uploads)
router.post("/bulk", async (req, res) => {
  try {
    const { schedules } = req.body; // Expecting an array
    
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ success: false, message: "No schedules provided for bulk insert." });
    }

    const insertedSchedules = await Schedule.insertMany(schedules, { ordered: false });
    res.status(201).json({ success: true, data: insertedSchedules });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(201).json({ 
        success: true, 
        message: "Some schedules were skipped (duplicates), but others were saved.",
        data: error.insertedDocs || [] 
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete a schedule class by MongoDB ID
router.delete("/:id", async (req, res) => {
  try {
    const scheduleClass = await Schedule.findByIdAndDelete(req.params.id);

    if (!scheduleClass) {
      return res.status(404).json({
        success: false,
        message: "Schedule class not found.",
      });
    }

    res.json({ success: true, message: "Schedule class deleted." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
