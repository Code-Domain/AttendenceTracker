const express = require("express");
const Student = require("../models/Student");
const auth = require("../middleware/auth"); // ADD THIS

const router = express.Router();

// Get all students for logged in teacher
router.get("/", auth, async (req, res) => { // Add auth
  try {
    const students = await Student.find({ teacherId: req.teacher.id }).sort({ rollNo: 1 });
    res.json({ success: true, data: students });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Add a single student
router.post("/", auth, async (req, res) => { // Add auth
  try {
    const student = await Student.create({ ...req.body, teacherId: req.teacher.id });
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Roll number already exists." });
    res.status(400).json({ success: false, message: error.message });
  }
});

// BULK ADD students
router.post("/bulk", auth, async (req, res) => { // Add auth
  try {
    const { students } = req.body;
    const studentsWithTeacher = students.map(s => ({ ...s, teacherId: req.teacher.id }));
    const insertedStudents = await Student.insertMany(studentsWithTeacher, { ordered: false });
    res.status(201).json({ success: true, data: insertedStudents });
  } catch (error) {
    if (error.code === 11000) return res.status(201).json({ success: true, data: error.insertedDocs || [] });
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete a student
router.delete("/:id", auth, async (req, res) => { // Add auth
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, teacherId: req.teacher.id });
    if (!student) return res.status(404).json({ success: false, message: "Not found or unauthorized" });
    res.json({ success: true, message: "Student deleted." });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

module.exports = router;