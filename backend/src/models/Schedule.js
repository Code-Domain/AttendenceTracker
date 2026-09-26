// models/Schedule.js
const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    time: { type: String, required: true },
    subject: { type: String, required: true },
    semester: { type: Number, required: true },
    rollRange: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", scheduleSchema);