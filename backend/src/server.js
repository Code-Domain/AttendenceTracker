require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("../src/config/database");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/students", studentRoutes);

app.get("/", (req , res ) => {
    res.json({
        success: true,
        message: "Attendance Tracker Backend is running",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});