// server/routes/story.routes.mjs
import express from "express";
const router = express.Router();

import {
  createStory,
  getAllStories,
  getStoryById,
  updateStory,
  deleteStory,
  enhanceStoryWithAI,
} from "../controllers/story.controller.mjs";

router.post("/", createStory);
router.get("/", getAllStories);
router.get("/:id", getStoryById);
router.put("/:id", updateStory);
router.delete("/:id", deleteStory);
router.post("/enhance", enhanceStoryWithAI);

export default router;
