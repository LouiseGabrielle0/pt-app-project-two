const { default: mongoose } = require("mongoose");
const { Schema, model } = require("mongoose");

const exerciseSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  image: {
    type: String,
  },
  category: {
    type: [String],
    enum: ["weight", "yoga", "cardio", "interval", "dance", "balance", "other"],
  },
  description: String,
  reps: {
    type: Number,
  },
  sets: {
    type: Number,
    enum: [1, 2, 3, 4, 5],
  },
});

const Exercise = model("Exercise", exerciseSchema);

module.exports = Exercise;
