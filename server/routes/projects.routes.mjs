import express from "express";
import {
  getAllProjects,
  createProject,
  searchProject,
  updateProject,
  deleteProject,
} from "../controllers/projects.controller.mjs";
import { authenticate, authorize } from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("projects", "read"), getAllProjects);
router.post("/", authorize("projects", "create"), createProject);
router.get("/search", authorize("projects", "read"), searchProject);
router.put("/:id", authorize("projects", "update"), updateProject);
router.delete("/:id", authorize("projects", "delete"), deleteProject);

export default router;
