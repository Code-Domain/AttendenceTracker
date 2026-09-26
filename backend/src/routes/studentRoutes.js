const express = require("express");
const Student = require("../models/Student");

const router = express.Router();

// Get all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ rollNo: 1 });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a single student
router.post("/", async (req, res) => {
  try {
    const { name, rollNo, semester } = req.body;

    if (!name || !rollNo || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, roll number, and semester are required.",
      });
    }

    const student = await Student.create({ name, rollNo, semester });
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A student with this roll number already exists.",
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// BULK ADD students (For Excel Uploads)
router.post("/bulk", async (req, res) => {
  try {
    const { students } = req.body; // Expecting an array of student objects
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: "No students provided for bulk insert." });
    }

    // InsertMany with ordered:false will skip duplicates and insert the rest
    const insertedStudents = await Student.insertMany(students, { ordered: false });
    
    res.status(201).json({ success: true, data: insertedStudents });
  } catch (error) {
    // If there are duplicate roll numbers, MongoDB throws an error, but still inserts the non-duplicates.
    // We check if it's a duplicate error (code 11000) and still return success for the ones that went through.
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
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.json({ success: true, message: "Student deleted." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;