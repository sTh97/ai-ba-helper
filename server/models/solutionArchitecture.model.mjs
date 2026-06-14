import mongoose from "mongoose";

const solutionArchitectureSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  storyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  prompt: { type: String, trim: true },
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
  hasContent: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("SolutionArchitecture", solutionArchitectureSchema);
