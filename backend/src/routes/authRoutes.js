const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Teacher = require("../models/Teacher");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new teacher
router.post("/register", async (req, res) => {
  const { name, email, password, department, employeeId } = req.body;
  try {
    let teacher = await Teacher.findOne({ email });
    if (teacher) return res.status(400).json({ success: false, message: "Teacher already exists" });

    teacher = new Teacher({ name, email, password, department, employeeId });
    await teacher.save();

    const payload = { teacher: { id: teacher._id.toString() } }; // Ensure ID is a string
    const token = jwt.sign(payload, process.env.JWT_SECRET || "my_super_secret_key_123", { expiresIn: "1d" });

    res.status(201).json({ success: true, token, teacher: { id: teacher._id, name, email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login teacher
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const payload = { teacher: { id: teacher._id.toString() } }; // Ensure ID is a string
    const token = jwt.sign(payload, process.env.JWT_SECRET || "my_super_secret_key_123", { expiresIn: "1d" });

    res.json({ success: true, token, teacher: { id: teacher._id, name: teacher.name, email: teacher.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get logged in teacher's profile
// @route   GET /api/auth/me
// @desc    Get logged in teacher's profile
router.get("/me", auth, async (req, res) => {
  try {
    // req.teacher is now just the ID string (e.g. '6ab8ff34801dd3ac19a6c853')
    const teacherId = req.teacher; 

    if (!teacherId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    // Fetch the teacher from the database, but exclude the password field
    const teacher = await Teacher.findById(teacherId).select("-password");
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found in database" });
    }

    res.json({ success: true, data: teacher });
  } catch (error) {
    console.error("Error fetching /me:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/auth/update/:id
// @desc    Update teacher profile
router.put("/update/:id", auth, async (req, res) => {
  try {
    const updated = await Teacher.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!updated) return res.status(404).json({ success: false, message: "Teacher not found" });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
module.exports = router;