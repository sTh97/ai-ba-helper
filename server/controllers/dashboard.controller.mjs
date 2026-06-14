import Project from "../models/projects.mjs";
import Story from "../models/story.model.mjs";
import { buildOwnerFilter, hasDataAccessAll } from "../utils/permissions.mjs";

export const getDashboardStats = async (req, res) => {
  try {
    const projectFilter = buildOwnerFilter(req.user, "dashboard");
    const storyOwnerFilter = buildOwnerFilter(req.user, "dashboard");

    const projects = await Project.find(projectFilter, "_id name");

    let storyFilter = storyOwnerFilter;
    if (!hasDataAccessAll(req.user, "dashboard")) {
      const projectIds = projects.map((p) => p._id);
      storyFilter = {
        $or: [
          { createdBy: req.user._id },
          { projectId: { $in: projectIds } },
        ],
      };
    }

    const stories = await Story.find(storyFilter).populate("projectId", "name");

    const projectMap = {};
    projects.forEach((project) => {
      projectMap[project._id.toString()] = project.name;
    });

    const totalProjects = projects.length;
    const totalStories = stories.length;

    const storiesByProject = {};
    const testCasesByProject = {};

    let totalTestCases = 0;
    const testCasesByStory = {};

    stories.forEach((story) => {
      const projName = story.projectId?.name || "Unassigned";

      storiesByProject[projName] = (storiesByProject[projName] || 0) + 1;

      const happyTests = Array.isArray(story.happyTests) ? story.happyTests.length : 0;
      const negativeTests = Array.isArray(story.negativeTests) ? story.negativeTests.length : 0;
      const totalTests = happyTests + negativeTests;

      totalTestCases += totalTests;
      testCasesByStory[story._id] = totalTests;
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
