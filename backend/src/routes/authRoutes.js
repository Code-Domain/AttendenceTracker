const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Teacher = require("../models/Teacher");
const auth = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET || "my_super_secret_key_123";


/*
====================================================
REGISTER
POST /api/auth/register
====================================================
*/

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department,
      employeeId
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check existing teacher
    const existingTeacher = await Teacher.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: "Teacher already exists"
      });
    }

    /*
    IMPORTANT:
    Do NOT bcrypt.hash() here.

    Teacher.js automatically hashes the password
    before save().
    */

    const teacher = new Teacher({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      department,
      employeeId
    });

    await teacher.save();

    // Create JWT
    const payload = {
      teacher: {
        id: teacher._id.toString()
      }
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
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
    const {
      email,
      password
    } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find teacher
    const teacher = await Teacher.findOne({
      email: email.toLowerCase().trim()
    });

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    /*
    IMPORTANT:
    The password entered by the user is plain text.

    The password in MongoDB is a bcrypt hash.

    bcrypt.compare() checks them correctly.
    */

    const isPasswordCorrect = await bcrypt.compare(
      password,
      teacher.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Create JWT
    const payload = {
      teacher: {
        id: teacher._id.toString()
      }
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
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
    // auth middleware puts teacher ID here
    const teacherId = req.teacher;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    // Don't return password
    const teacher = await Teacher
      .findById(teacherId)
      .select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: teacher
    });

  } catch (error) {
    console.error("GET ME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message
    });
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

    /*
    Get password fields separately.
    Everything else goes into otherFields.
    */

    const {
      password,
      currentPassword,
      ...otherFields
    } = req.body;


    /*
    ==================================================
    SECURITY CHECK
    ==================================================
    
    Make sure the logged-in teacher can only update
    their own profile.
    */

    if (req.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile"
      });
    }


    /*
    ==================================================
    FIND TEACHER
    ==================================================
    */

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }


    /*
    ==================================================
    CHANGE PASSWORD
    ==================================================
    */

    if (password !== undefined) {

      // Validate new password
      if (
        typeof password !== "string" ||
        password.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long"
        });
      }


      // Current password required
      if (
        !currentPassword ||
        typeof currentPassword !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Current password is required"
        });
      }


      /*
      Check current password.
      */

      const currentPasswordCorrect =
        await bcrypt.compare(
          currentPassword,
          teacher.password
        );

      if (!currentPasswordCorrect) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }


      /*
      IMPORTANT:

      DO NOT bcrypt.hash() here.

      Teacher.js has the pre-save hook.

      Assign the plain new password and save.
      Teacher.js will hash it exactly once.
      */

      teacher.password = password;
    }


    /*
    ==================================================
    UPDATE OTHER PROFILE FIELDS
    ==================================================
    */

    Object.keys(otherFields).forEach((key) => {

      // Don't allow password to sneak through
      if (key !== "password") {
        teacher[key] = otherFields[key];
      }

    });


    /*
    ==================================================
    SAVE
    ==================================================
    */

    await teacher.save();


    /*
    ==================================================
    RESPONSE
    ==================================================
    */

    const teacherResponse = teacher.toObject();

    // Never send password back to frontend
    delete teacherResponse.password;

    return res.status(200).json({
      success: true,
      message:
        password !== undefined
          ? "Password changed successfully"
          : "Profile updated successfully",
      data: teacherResponse
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(400).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
});


/*
====================================================
EXPORT ROUTER
====================================================
*/

module.exports = router;
