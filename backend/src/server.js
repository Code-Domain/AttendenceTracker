require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database"); // Make sure this path is correct

const studentRoutes = require("./routes/studentRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const activityRoutes = require("./routes/activityRoutes");
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/activities", activityRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Attendance Tracker Backend is running",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});