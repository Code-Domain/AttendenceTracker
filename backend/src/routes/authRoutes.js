const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Teacher = require("../models/Teacher");
const auth = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_key_123";

/*
====================================================
REGISTER
POST /api/auth/register
====================================================
*/
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, department, employeeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const existingTeacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
    if (existingTeacher) {
      return res.status(400).json({ success: false, message: "Teacher already exists" });
    }

    const teacher = new Teacher({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Hashed automatically by Teacher.js pre-save hook
      department,
      employeeId
    });

    await teacher.save();

    const payload = { teacher: { id: teacher._id.toString() } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      teacher: { id: teacher._id, name: teacher.name, email: teacher.email }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
});

/*
====================================================
LOGIN
POST /api/auth/login
====================================================
*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
    if (!teacher) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, teacher.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const payload = { teacher: { id: teacher._id.toString() } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      teacher: { id: teacher._id, name: teacher.name, email: teacher.email }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
});

/*
====================================================
GET LOGGED-IN TEACHER
GET /api/auth/me
====================================================
*/
router.get("/me", auth, async (req, res) => {
  try {
    const teacherId = req.teacher;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const teacher = await Teacher.findById(teacherId).select("-password");
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    return res.status(200).json({ success: true, data: teacher });

  } catch (error) {
    console.error("GET ME ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to get profile", error: error.message });
  }
});

/*
====================================================
UPDATE PROFILE / CHANGE PASSWORD
PUT /api/auth/update/:id
====================================================
*/
router.put("/update/:id", auth, async (req, res) => {
  try {
    const teacherId = req.params.id;

    // SECURITY CHECK: Ensure teacher can only update their own profile
    if (req.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "You can only update your own profile" });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const { password, currentPassword, name, email, department, employeeId, phone } = req.body;

    // Update basic fields if provided
    if (name) teacher.name = name;
    if (email) teacher.email = email.toLowerCase().trim();
    if (department) teacher.department = department;
    if (employeeId) teacher.employeeId = employeeId;
    if (phone) teacher.phone = phone;

    // Handle password update securely
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
      }
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: "Current password is required to set a new password." });
      }

      const isMatch = await bcrypt.compare(currentPassword, teacher.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Current password is incorrect." });
      }

      // Assign plain text password; Teacher.js pre-save hook will hash it automatically
      teacher.password = password;
    }

    await teacher.save();

    // Return the updated teacher without the password
    const updatedTeacher = await Teacher.findById(teacher._id).select("-password");
    
    return res.status(200).json({
      success: true,
      message: password ? "Password changed successfully" : "Profile updated successfully",
      data: updatedTeacher
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
  }
});

module.exports = router;