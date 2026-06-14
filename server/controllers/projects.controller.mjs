import Project from "../models/projects.mjs";
import {
  buildOwnerFilter,
  canAccessResource,
} from "../utils/permissions.mjs";

export const getAllProjects = async (req, res) => {
  try {
    const filter = buildOwnerFilter(req.user, "projects");
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = new Project({
      name,
      description,
      createdBy: req.user._id,
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: "Failed to create project" });
  }
};

export const searchProject = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: "Project name is required" });

    const filter = {
      name: { $regex: new RegExp(`^${name}$`, "i") },
      ...buildOwnerFilter(req.user, "projects"),
    };

    const project = await Project.findOne(filter);
    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Error searching for project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (!canAccessResource(req.user, "projects", project)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, description } = req.body;
    project.name = name ?? project.name;
    project.description = description ?? project.description;
    await project.save();

    res.json(project);
  } catch (err) {
    res.status(400).json({ error: "Failed to update project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (!canAccessResource(req.user, "projects", project)) {
      return res.status(403).json({ error: "Access denied" });
    }

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
};
