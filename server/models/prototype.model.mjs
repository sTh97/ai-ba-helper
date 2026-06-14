import mongoose from "mongoose";

const prototypeSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  storyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  structure: {
    appName: String,
    summary: String,
    userFlow: String,
    theme: { type: mongoose.Schema.Types.Mixed },
    navigation: [{ id: String, label: String, screenId: String }],
    screens: [{
      id: String,
      title: String,
      description: String,
      mappedStoryIds: [String],
      mappedStoryTitles: [String],
      features: [String],
    }],
  },
  prototype: {
    html: String,
    css: String,
    js: String,
    fullDocument: String,
  },
  usedScaffold: { type: Boolean, default: false },
  structureFromFallback: { type: Boolean, default: false },
  prototypePrompt: { type: String, trim: true },
  hasCode: { type: Boolean, default: false },
  isMerged: { type: Boolean, default: false },
  mergedFromIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ApplicationPrototype" }],
}, { timestamps: true });

export default mongoose.model("ApplicationPrototype", prototypeSchema);
