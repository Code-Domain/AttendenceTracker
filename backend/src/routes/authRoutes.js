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

    const payload = { teacher: { id: teacher._id } };
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

    const payload = { teacher: { id: teacher._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "my_super_secret_key_123", { expiresIn: "1d" });

    res.json({ success: true, token, teacher: { id: teacher._id, name: teacher.name, email: teacher.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get logged in teacher's profile
router.get("/me", auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.id).select("-password");
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;