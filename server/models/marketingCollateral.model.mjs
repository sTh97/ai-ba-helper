import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  heading: String,
  subheading: String,
  body: String,
  bullets: [String],
}, { _id: false });

const contentSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  summary: String,
  sections: [sectionSchema],
  callToAction: String,
  contact: String,
  theme: {
    primary: String,
    accent: String,
  },
}, { _id: false });

const marketingCollateralSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  collateralType: { type: String, trim: true, default: "one-pager" },
  format: { type: String, enum: ["pdf", "docx", "pptx"], default: "pdf" },
  storyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  prompt: { type: String, trim: true },
  content: { type: contentSchema, default: {} },
  hasContent: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("MarketingCollateral", marketingCollateralSchema);
