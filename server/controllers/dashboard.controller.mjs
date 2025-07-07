// server/controllers/dashboard.controller.js

import Project from "../models/projects.mjs";
import Story from "../models/story.model.mjs";

export const getDashboardStats = async (req, res) => {
  try {
    const [projects, stories] = await Promise.all([
      Project.find({}, "_id name"), // Only fetch _id and name
      Story.find({}).populate("projectId", "name"),
    ]);

    const projectMap = {};
    projects.forEach(project => {
      projectMap[project._id.toString()] = project.name;
    });

    // Total counts
    const totalProjects = projects.length;
    const totalStories = stories.length;

    // User stories by project
    const storiesByProject = {};
    const testCasesByProject = {};

    // Test cases
    let totalTestCases = 0;
    const testCasesByStory = {};

    stories.forEach(story => {
      const projName = story.projectId?.name || "Unassigned";

      // Count stories by project
      storiesByProject[projName] = (storiesByProject[projName] || 0) + 1;

      const happyTests = Array.isArray(story.happyTests) ? story.happyTests.length : 0;
      const negativeTests = Array.isArray(story.negativeTests) ? story.negativeTests.length : 0;
      const totalTests = happyTests + negativeTests;

      totalTestCases += totalTests;

      // Count test cases by story
      testCasesByStory[story._id] = totalTests;

      // Count test cases by project
      testCasesByProject[projName] = (testCasesByProject[projName] || 0) + totalTests;
    });

    return res.json({
      totalProjects,
      totalStories,
      totalTestCases,
      storiesByProject,
      testCasesByProject,
      testCasesByStory,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
};
