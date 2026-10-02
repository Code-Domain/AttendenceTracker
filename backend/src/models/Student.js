const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true, trim: true, unique: true }, // Enforces no duplicate roll numbers
    semester: { type: Number, required: true, min: 1, max: 8 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);