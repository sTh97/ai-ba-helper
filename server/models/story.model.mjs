import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    type: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const storySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  originalText: { type: String, required: true },
  correctedText: { type: String },
  feature: { type: String, default: "" },
  acceptanceCriteria: [String],
  happyTests: [String],
  negativeTests: [String],
  fields: [fieldSchema],
  businessRules: [String],
  validations: [String],
  edgeCases: [String],
  constraints: [String],
  dependencies: [String],
  businessImpact: { type: String, default: "" },
  definitionOfReady: [String],
  definitionOfDone: [String],
  status: {
    type: String,
    default: "draft",
    enum: ["draft", "reviewed", "final"],
  },
  wireframeApplicable: { type: Boolean, default: true },
  wireframe: {
    applicable: { type: Boolean },
    message: { type: String },
    html: { type: String },
    css: { type: String },
    js: { type: String },
    fullDocument: { type: String },
  },
}, { timestamps: true });

export default mongoose.model("Story", storySchema);
