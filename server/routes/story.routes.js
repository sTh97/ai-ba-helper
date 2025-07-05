// server/routes/story.routes.js
const express = require("express");
const router = express.Router();
const storyController = require("../controllers/story.controller");

router.post("/", storyController.createStory);
router.get("/", storyController.getAllStories);
router.get("/:id", storyController.getStoryById);
router.put("/:id", storyController.updateStory);
router.delete("/:id", storyController.deleteStory);
router.post("/enhance", storyController.enhanceStoryWithAI);
    

module.exports = router;
