import mongoose from "mongoose";
import { MODULES, DATA_ACCESS } from "../constants/modules.mjs";

const permissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      enum: MODULES.map((m) => m.key),
    },
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    dataAccess: {
      type: String,
      enum: [DATA_ACCESS.OWN, DATA_ACCESS.ALL],
      default: DATA_ACCESS.OWN,
    },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    permissions: { type: [permissionSchema], default: [] },
    allowedLlms: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
