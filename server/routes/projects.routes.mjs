import express from "express";
import Project from "../models/projects.mjs";

const router = express.Router();

// GET all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// POST a new project
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = new Project({ name, description });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: "Failed to create project" });
  }
});

// GET one project by name (optional)
router.get("/search", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: "Project name is required" });

    const project = await Project.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Error searching for project" });
  }
});

// PUT update a project by ID
router.put("/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json(project);
  } catch (err) {
    res.status(400).json({ error: "Failed to update project" });
  }
});

// DELETE a project by ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Project not found" });

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;

