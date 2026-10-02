const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    status: { type: String, enum: ["Present", "Absent", "Unmarked"], default: "Unmarked" },
    date: { type: String, required: true }, // Stored as YYYY-MM-DD
  },
  { timestamps: true }
);

// Prevent duplicate attendance records for the same student/class/date
attendanceSchema.index({ teacherId: 1, classId: 1, studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);