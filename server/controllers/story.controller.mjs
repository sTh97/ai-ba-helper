import mongoose from "mongoose";
import Story from "../models/story.model.mjs";
import Project from "../models/projects.mjs";
import {
  buildOwnerFilter,
  canAccessResource,
  hasDataAccessAll,
} from "../utils/permissions.mjs";

const getAccessibleProjectIds = async (user) => {
  const filter = buildOwnerFilter(user, "projects");
  const projects = await Project.find(filter).select("_id");
  return projects.map((p) => p._id);
};

const canAccessStory = async (user, story) => {
  if (canAccessResource(user, "stories", story)) return true;

  if (!hasDataAccessAll(user, "stories") && story.projectId) {
    const project = await Project.findById(story.projectId);
    return project && canAccessResource(user, "projects", project);
  }

  return false;
};

export const createStory = async (req, res) => {
  try {
    const {
      originalText,
      correctedText,
      feature,
      acceptanceCriteria,
      happyTests,
      negativeTests,
      fields,
      businessRules,
      validations,
      edgeCases,
      constraints,
      dependencies,
      businessImpact,
      definitionOfReady,
      definitionOfDone,
      status,
      projectId,
      wireframeApplicable,
      wireframe,
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(400).json({ error: "Invalid project" });
    }

    if (!canAccessResource(req.user, "projects", project)) {
      return res.status(403).json({ error: "Access denied to this project" });
    }

    const story = await Story.create({
      originalText,
      correctedText,
      feature,
      acceptanceCriteria,
      happyTests,
      negativeTests,
      fields,
      businessRules,
      validations,
      edgeCases,
      constraints,
      dependencies,
      businessImpact,
      definitionOfReady,
      definitionOfDone,
      status: status || "draft",
      projectId,
      createdBy: req.user._id,
      wireframeApplicable: wireframeApplicable !== false,
      wireframe: wireframe || undefined,
    });

    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllStories = async (req, res) => {
  try {
    const ownerFilter = buildOwnerFilter(req.user, "stories");
    let filter = ownerFilter;

    if (!hasDataAccessAll(req.user, "stories")) {
      const projectIds = await getAccessibleProjectIds(req.user);
      filter = {
        $or: [
          { createdBy: req.user._id },
          { projectId: { $in: projectIds } },
        ],
      };
    }

    const stories = await Story.find(filter)
      .populate("projectId", "name")
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate("projectId", "name");
    if (!story) return res.status(404).json({ error: "Story not found" });

    if (!(await canAccessStory(req.user, story))) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(story);
  } catch (err) {
    res.status(404).json({ error: "Story not found" });
  }
};

export const getStoriesByProjectName = async (req, res) => {
  const { name } = req.query;

  try {
    let filter = {};
    if (!hasDataAccessAll(req.user, "stories")) {
      const projectIds = await getAccessibleProjectIds(req.user);
      filter = {
        $or: [
          { createdBy: req.user._id },
          { projectId: { $in: projectIds } },
        ],
      };
    }

    const stories = await Story.find(filter)
      .populate("projectId", "name")
      .exec();

    const filteredStories = stories.filter((story) =>
      story.projectId?.name?.toLowerCase().includes(name.toLowerCase())
    );

    res.json(filteredStories);
  } catch (err) {
    console.error("Error fetching stories by project name:", err);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
};

export const updateStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: "Story not found" });

    if (!(await canAccessStory(req.user, story))) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await Story.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid story ID" });
    }

    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ error: "Story not found" });

    if (!(await canAccessStory(req.user, story))) {
      return res.status(403).json({ error: "Access denied" });
    }

    await story.deleteOne();
    res.json({ message: "Story deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const enhanceStoryWithAI = async (req, res) => {
  const {
    storyId,
    correctedText,
    feature,
    acceptanceCriteria,
    happyTests,
    negativeTests,
    fields,
    businessRules,
    validations,
    edgeCases,
    constraints,
    dependencies,
    businessImpact,
    definitionOfReady,
    definitionOfDone,
  } = req.body;

  try {
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ error: "Story not found" });

    if (!(await canAccessStory(req.user, story))) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updates = {
      correctedText,
      acceptanceCriteria,
      happyTests,
      negativeTests,
      status: "reviewed",
    };
    const optional = {
      feature,
      fields,
      businessRules,
      validations,
      edgeCases,
      constraints,
      dependencies,
      businessImpact,
      definitionOfReady,
      definitionOfDone,
    };
    for (const [key, value] of Object.entries(optional)) {
      if (value !== undefined) updates[key] = value;
    }

    const updated = await Story.findByIdAndUpdate(storyId, updates, { new: true });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
