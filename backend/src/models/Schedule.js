const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true }, // ADD THIS
    day: { type: String, required: true },
    time: { type: String, required: true },
    subject: { type: String, required: true },
    semester: { type: Number, required: true },
    rollRange: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", scheduleSchema);