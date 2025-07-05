import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
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

export default mongoose.model("Story", storySchema);
