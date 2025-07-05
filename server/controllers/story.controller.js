// server/controllers/story.controller.js
const Story = require("../models/story.model");

exports.createStory = async (req, res) => {
  try {
    const {
      originalText,
      correctedText,
      acceptanceCriteria,
      happyTests,
      negativeTests,
      status,
    } = req.body;

    const story = await Story.create({
      originalText,
      correctedText,
      acceptanceCriteria,
      happyTests,
      negativeTests,
      status: status || "draft",
    });

    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.getAllStories = async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    res.json(story);
  } catch (err) {
    res.status(404).json({ error: "Story not found" });
  }
};

exports.updateStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid story ID" });
    }

    const deleted = await Story.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Story not found" });
    }

    res.json({ message: "Story deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.enhanceStoryWithAI = async (req, res) => {
  const { storyId, correctedText, acceptanceCriteria, happyTests, negativeTests } = req.body;

  try {
    const updated = await Story.findByIdAndUpdate(
      storyId,
      {
        correctedText,
        acceptanceCriteria,
        happyTests,
        negativeTests,
        status: "reviewed",
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


