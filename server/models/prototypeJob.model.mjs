import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  phase: { type: String, enum: ["scaffold", "structure", "screen", "assemble"], required: true },
  screenId: { type: String },
  screenIndex: { type: Number },
  status: {
    type: String,
    enum: ["pending", "running", "done", "failed", "skipped"],
    default: "pending",
  },
  usedScaffold: { type: Boolean, default: false },
  error: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
}, { _id: false });

const screenChunkSchema = new mongoose.Schema({
  screenId: { type: String, required: true },
  html: { type: String, default: "" },
  css: { type: String, default: "" },
  js: { type: String, default: "" },
  usedScaffold: { type: Boolean, default: false },
}, { _id: false });

const prototypeJobSchema = new mongoose.Schema({
  type: { type: String, enum: ["generate", "merge", "update"], required: true },
  status: {
    type: String,
    enum: ["queued", "running", "completed", "failed", "cancelled"],
    default: "queued",
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  storyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  prototypeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ApplicationPrototype" }],
  sourcePrototypeId: { type: mongoose.Schema.Types.ObjectId, ref: "ApplicationPrototype" },
  sourceSnapshot: { type: mongoose.Schema.Types.Mixed },
  prototypePrompt: { type: String, trim: true },
  mergePrompt: { type: String, trim: true },
  updatePrompt: { type: String, trim: true },
  customName: { type: String, trim: true },
  aiSelection: {
    id: String,
    provider: String,
    models: [String],
    label: String,
    tier: String,
  },
  progress: {
    phase: { type: String, default: "queued" },
    currentChunk: { type: Number, default: 0 },
    totalChunks: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    message: { type: String, default: "" },
  },
  chunks: [chunkSchema],
  structure: { type: mongoose.Schema.Types.Mixed, default: {} },
  screenChunks: [screenChunkSchema],
  partialPrototype: {
    html: String,
    css: String,
    js: String,
    fullDocument: String,
  },
  result: { type: mongoose.Schema.Types.Mixed },
  usedScaffold: { type: Boolean, default: false },
  structureFromFallback: { type: Boolean, default: false },
  error: { type: String },
  cancelled: { type: Boolean, default: false },
}, { timestamps: true });

prototypeJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
prototypeJobSchema.index({ projectId: 1, createdBy: 1, status: 1 });

export default mongoose.model("PrototypeJob", prototypeJobSchema);
