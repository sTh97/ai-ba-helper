import express from "express";
import {
  getProjectStoriesPreview,
  refinePrototypePrompt,
  generatePrototype,
  mergePrototypes,
  updatePrototypeApplication,
  getPrototypeJob,
  cancelPrototypeJob,
  getAllPrototypes,
  getPrototypeById,
  savePrototype,
  updatePrototype,
  deletePrototype,
} from "../controllers/prototype.controller.mjs";
import { authenticate, authorize } from "../middleware/auth.middleware.mjs";
import { attachAISelection } from "../middleware/aiSelection.middleware.mjs";

const router = express.Router();

router.use(authenticate);
router.use(attachAISelection);

router.get("/project/:projectId/stories", authorize("applications", "read"), getProjectStoriesPreview);
router.post("/prompt/refine", authorize("applications", "create"), refinePrototypePrompt);
router.post("/refine-prompt", authorize("applications", "create"), refinePrototypePrompt);
router.post("/generate", authorize("applications", "create"), generatePrototype);
router.post("/merge", authorize("applications", "create"), mergePrototypes);
router.post("/update", authorize("applications", "create"), updatePrototypeApplication);
router.get("/jobs/:jobId", authorize("applications", "read"), getPrototypeJob);
router.delete("/jobs/:jobId", authorize("applications", "create"), cancelPrototypeJob);
router.get("/", authorize("applications", "read"), getAllPrototypes);
router.get("/:id", authorize("applications", "read"), getPrototypeById);
router.post("/", authorize("applications", "create"), savePrototype);
router.put("/:id", authorize("applications", "update"), updatePrototype);
router.delete("/:id", authorize("applications", "delete"), deletePrototype);

export default router;
