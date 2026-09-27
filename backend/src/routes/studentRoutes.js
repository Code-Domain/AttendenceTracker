const express = require("express");
const Student = require("../models/Student");
const auth = require("../middleware/auth"); // Import Auth Middleware

const router = express.Router();

// Get all students for logged in teacher
router.get("/", auth, async (req, res) => {
  try {
    const students = await Student.find({ teacherId: req.teacher }).sort({ rollNo: 1 });
    res.json({ success: true, data: students });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Add a single student
router.post("/", auth, async (req, res) => {
  try {
    // Attach the teacherId from the token
    const student = await Student.create({ ...req.body, teacherId: req.teacher });
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "A student with this roll number already exists." });
    res.status(400).json({ success: false, message: error.message });
  }
});

// BULK ADD students (For Excel Uploads)
router.post("/bulk", auth, async (req, res) => {
  try {
    const { students } = req.body;
    // Attach teacherId to every student in the array
    const studentsWithTeacher = students.map(s => ({ ...s, teacherId: req.teacher }));
    
    const insertedStudents = await Student.insertMany(studentsWithTeacher, { ordered: false });
    res.status(201).json({ success: true, data: insertedStudents });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(201).json({ 
        success: true, 
        message: "Some students were skipped (duplicate roll numbers), but others were saved.",
        data: error.insertedDocs || [] 
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete a student by MongoDB ID
router.delete("/:id", auth, async (req, res) => {
  try {
    // Ensure teacher can only delete their own students
    const student = await Student.findOneAndDelete({ _id: req.params.id, teacherId: req.teacher });
    if (!student) return res.status(404).json({ success: false, message: "Student not found or unauthorized." });
    res.json({ success: true, message: "Student deleted." });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

module.exports = router;