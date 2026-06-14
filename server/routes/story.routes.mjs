import express from "express";
import {
  createStory,
  getAllStories,
  getStoryById,
  updateStory,
  deleteStory,
  enhanceStoryWithAI,
  getStoriesByProjectName,
} from "../controllers/story.controller.mjs";
import { authenticate, authorize } from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.use(authenticate);

router.post("/", authorize("stories", "create"), createStory);
router.get("/", authorize("stories", "read"), getAllStories);
router.get("/search/by-project", authorize("stories", "read"), getStoriesByProjectName);
router.get("/:id", authorize("stories", "read"), getStoryById);
router.put("/:id", authorize("stories", "update"), updateStory);
router.delete("/:id", authorize("stories", "delete"), deleteStory);
router.post("/enhance", authorize("stories", "update"), enhanceStoryWithAI);

export default router;
