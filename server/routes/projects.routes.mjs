// routes/projects.routes.mjs
import express from "express";
import Project from "../models/projects.mjs"; // ✅ Make sure this file exists with correct casing

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
    const project = new Project({ name, description }); // ✅ fixed casing
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: "Failed to create project" });
  }
});

export default router;
