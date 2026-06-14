import express from "express";
import {
  getProjectStoriesPreview,
  refineSolutionPrompt,
  generateSolutionArchitecture,
  getAllSolutions,
  getSolutionById,
  saveSolution,
  updateSolution,
  deleteSolution,
} from "../controllers/solution.controller.mjs";
import { authenticate, authorize } from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.use(authenticate);

router.get("/project/:projectId/stories", authorize("solution", "read"), getProjectStoriesPreview);
router.post("/prompt/refine", authorize("solution", "create"), refineSolutionPrompt);
router.post("/generate", authorize("solution", "create"), generateSolutionArchitecture);
router.get("/", authorize("solution", "read"), getAllSolutions);
router.get("/:id", authorize("solution", "read"), getSolutionById);
router.post("/", authorize("solution", "create"), saveSolution);
router.put("/:id", authorize("solution", "update"), updateSolution);
router.delete("/:id", authorize("solution", "delete"), deleteSolution);

export default router;
