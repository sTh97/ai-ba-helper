const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  originalText: { type: String, required: true },
  correctedText: { type: String },
  acceptanceCriteria: [String],
  happyTests: [String],
  negativeTests: [String],
  status: {
    type: String,
    default: "draft",
    enum: ["draft", "reviewed", "final"],
  },
}, { timestamps: true });

module.exports = mongoose.model("Story", storySchema);
