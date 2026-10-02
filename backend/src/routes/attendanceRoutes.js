const express = require("express");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const records = await Attendance.find({ teacherId: req.teacher });
    res.json({ success: true, data: records });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post("/mark", auth, async (req, res) => {
  const { classId, studentId, status, date } = req.body;
  try {
    let record = await Attendance.findOne({ teacherId: req.teacher, classId, studentId, date });
    if (record) {
      record.status = status;
      await record.save();
    } else {
      record = await Attendance.create({ teacherId: req.teacher, classId, studentId, status, date });
    }
    res.json({ success: true, data: record });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.post("/finalize", auth, async (req, res) => {
  const { records } = req.body;
  try {
    const bulkOps = records.map(rec => ({
      updateOne: {
        filter: { teacherId: req.teacher, classId: rec.classId, studentId: rec.studentId, date: rec.date },
        update: { $set: { status: "Absent", teacherId: req.teacher, classId: rec.classId, studentId: rec.studentId, date: rec.date } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(bulkOps);
    res.json({ success: true, message: "Attendance finalized successfully" });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

module.exports = router;