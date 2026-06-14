import Project from "../models/projects.mjs";
import Story from "../models/story.model.mjs";
import SolutionArchitecture from "../models/solutionArchitecture.model.mjs";
import { callAI, getErrorMessage, getStructureAIOptions } from "./ai.controller.mjs";
import { parseAIJson } from "../utils/aiParser.mjs";
import {
  buildOwnerFilter,
  canAccessResource,
  hasDataAccessAll,
} from "../utils/permissions.mjs";

const truncate = (value, max = 200) => {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const filterStoriesByIds = (stories, storyIds) => {
  if (!Array.isArray(storyIds) || storyIds.length === 0) return stories;
  const idSet = new Set(storyIds.map(String));
  return stories.filter((s) => idSet.has(s._id.toString()));
};

const getProjectStories = async (user, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: "Project not found", status: 404 };

  if (!canAccessResource(user, "projects", project)) {
    return { error: "Access denied to this project", status: 403 };
  }

  const filter = { projectId };
  if (!hasDataAccessAll(user, "stories")) {
    filter.createdBy = user._id;
  }

  const stories = await Story.find(filter).sort({ createdAt: -1 });
  return { project, stories };
};

const summarizeStoriesForAI = (stories) =>
  stories.map((s) => ({
    feature: (s.feature || "").trim() || undefined,
    text: truncate(s.correctedText || s.originalText, 180),
    acceptanceCriteria: (s.acceptanceCriteria || []).slice(0, 3).map((item) => truncate(item, 90)),
    fields: (s.fields || [])
      .slice(0, 8)
      .map((f) => ({ name: f.name, type: f.type }))
      .filter((f) => f.name),
    dependencies: (s.dependencies || []).slice(0, 3),
  }));

const collectFeatures = (stories) => {
  const set = new Set();
  stories.forEach((s) => {
    const f = (s.feature || "").trim();
    if (f) set.add(f);
  });
  return Array.from(set);
};

export const getProjectStoriesPreview = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await getProjectStories(req.user, projectId);
    if (result.error) return res.status(result.status).json({ error: result.error });

    res.json({
      project: result.project,
      stories: result.stories.map((s) => ({
        _id: s._id,
        originalText: s.originalText,
        correctedText: s.correctedText,
        feature: s.feature || "",
        acceptanceCriteria: s.acceptanceCriteria,
        status: s.status,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const refineSolutionPrompt = async (req, res) => {
  try {
    const { projectId, draftPrompt, storyIds } = req.body;
    if (!projectId) return res.status(400).json({ error: "Project is required" });
    if (!draftPrompt?.trim()) {
      return res.status(400).json({ error: "Describe your constraints before refining" });
    }

    const result = await getProjectStories(req.user, projectId);
    if (result.error) return res.status(result.status).json({ error: result.error });

    const { project } = result;
    const stories = filterStoriesByIds(result.stories, storyIds);
    if (stories.length === 0) {
      return res.status(400).json({ error: "Select at least one user story" });
    }

    const systemPrompt = `You are a principal solution architect who briefs an AI to produce a rigorous solution architecture.
Output plain text only — no JSON, no markdown code fences.
Use these labeled sections:
Architecture goals:
Constraints & assumptions:
Preferred technologies:
Non-functional priorities (scale, security, performance):
Integrations:
Out of scope:

The brief must steer the AI to recommend a concrete, justified technology stack and a viable technical design grounded in the product's real capabilities.`;

    const userPrompt = `Project: "${project.name}"
${project.description ? `Description: ${truncate(project.description, 300)}` : ""}

Product capabilities (from user stories, ${stories.length}):
${JSON.stringify(summarizeStoriesForAI(stories))}

Detected features: ${JSON.stringify(collectFeatures(stories))}

Architect's rough notes:
${draftPrompt.trim()}

Refine this into a comprehensive, actionable architecture brief another AI can follow.`;

    const refined = await callAI(systemPrompt, userPrompt, false, getStructureAIOptions({ maxTokens: 2048 }));

    res.json({ refinedPrompt: refined.trim(), draftPrompt: draftPrompt.trim() });
  } catch (err) {
    console.error("Refine solution prompt error:", err?.response?.data || err.message);
    res.status(500).json({ error: getErrorMessage(err), detail: err.attempts || err?.response?.data });
  }
};

const buildArchitectureContent = async (project, stories, prompt) => {
  const features = collectFeatures(stories);

  const systemPrompt = `You are a principal solution architect and staff engineer.
You design pragmatic, modern, production-ready software architectures grounded in real product requirements.
Return ONLY valid JSON — no markdown, no code fences.`;

  const userPrompt = `Project / product: "${project.name}"
${project.description ? `Description: ${truncate(project.description, 400)}` : ""}

Product capabilities (derived from user stories, ${stories.length}):
${JSON.stringify(summarizeStoriesForAI(stories))}

Detected features: ${JSON.stringify(features)}

Architect's brief (highest priority — follow closely):
${prompt?.trim() || "(no explicit brief — choose the most pragmatic modern stack and design)"}

Design the solution architecture. Return JSON ONLY with this exact shape:
{
  "title": "Solution architecture title",
  "summary": "2-4 sentence executive overview of the proposed solution",
  "techStack": [
    { "layer": "Frontend", "technology": "e.g. React + Vite + TypeScript", "rationale": "why this fits", "alternatives": "optional alternatives" },
    { "layer": "Backend", "technology": "...", "rationale": "...", "alternatives": "..." },
    { "layer": "Database", "technology": "...", "rationale": "...", "alternatives": "..." },
    { "layer": "Authentication", "technology": "...", "rationale": "...", "alternatives": "..." },
    { "layer": "Infrastructure / Hosting", "technology": "...", "rationale": "...", "alternatives": "..." },
    { "layer": "Integrations / Third-party", "technology": "...", "rationale": "...", "alternatives": "..." }
  ],
  "technicalViability": {
    "assessment": "Narrative on overall feasibility and approach",
    "rating": "High | Medium | Low",
    "scalability": "How the design scales",
    "security": "Key security considerations",
    "risks": ["Concrete technical risk"],
    "mitigations": ["Mitigation matched to a risk"]
  },
  "featureLinkages": [
    { "feature": "Feature name", "components": ["Service/module that implements it"], "dependsOn": ["Other feature/component it depends on"], "description": "How the feature is realized technically" }
  ],
  "schemas": [
    { "name": "EntityName", "description": "What it stores", "fields": [ { "name": "id", "type": "UUID", "description": "Primary key" }, { "name": "...", "type": "...", "description": "..." } ] }
  ],
  "erd": {
    "entities": [ { "name": "EntityName", "attributes": ["id (PK)", "field: type"] } ],
    "relationships": [ { "from": "EntityA", "to": "EntityB", "cardinality": "1:N", "label": "verb" } ],
    "mermaid": "erDiagram\\n  USER ||--o{ ORDER : places\\n  USER { string id PK\\n string email }"
  },
  "workflow": {
    "description": "Overview of the end-to-end project/process flow",
    "steps": [ { "step": 1, "actor": "Who", "action": "What happens", "outcome": "Result" } ],
    "mermaid": "flowchart TD\\n  A[Start] --> B[Step]\\n  B --> C{Decision}\\n  C -->|yes| D[End]"
  }
}

Rules:
- Recommend a concrete, justified, modern stack — no vague "a database" answers.
- featureLinkages MUST cover the detected features (or logical features derived from the stories) and show how they connect/depend on each other.
- schemas MUST reflect the real data fields implied by the user stories.
- erd.mermaid MUST be valid Mermaid "erDiagram" syntax. workflow.mermaid MUST be valid Mermaid "flowchart TD" syntax. Escape newlines as \\n inside the JSON strings.
- Keep entity/relationship names consistent between schemas, erd, and featureLinkages.`;

  let lastError = "Response was not valid JSON";
  let lastRaw = "";
  for (let attempt = 0; attempt <= 2; attempt++) {
    const promptText = attempt === 0
      ? userPrompt
      : `${userPrompt}\n\nYour previous response was invalid JSON (${lastError}). Return ONLY valid JSON matching the shape.`;
    lastRaw = await callAI(systemPrompt, promptText, true, getStructureAIOptions({ maxTokens: 4000 }));
    try {
      const parsed = parseAIJson(lastRaw);
      const content = parsed.content || parsed;
      if (content && (content.title || content.techStack || content.schemas)) {
        return content;
      }
      lastError = "Missing architecture content";
    } catch (err) {
      lastError = err.message;
    }
  }

  const error = new Error(lastError);
  error.raw = lastRaw?.slice?.(0, 2000);
  throw error;
};

export const generateSolutionArchitecture = async (req, res) => {
  try {
    const { projectId, prompt, storyIds } = req.body;
    if (!projectId) return res.status(400).json({ error: "Project is required" });

    const result = await getProjectStories(req.user, projectId);
    if (result.error) return res.status(result.status).json({ error: result.error });

    const { project } = result;
    const stories = filterStoriesByIds(result.stories, storyIds);
    if (stories.length === 0) {
      return res.status(400).json({ error: "Select at least one user story to generate an architecture" });
    }

    const content = await buildArchitectureContent(project, stories, prompt);

    res.json({
      projectId,
      storyIds: stories.map((s) => s._id),
      prompt: prompt?.trim() || "",
      name: content.title || `${project.name} — Solution Architecture`,
      description: content.summary || "",
      content,
    });
  } catch (err) {
    console.error("Generate solution architecture error:", err?.response?.data || err.message);
    res.status(500).json({ error: getErrorMessage(err), detail: err.attempts || err.raw });
  }
};

export const getAllSolutions = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = buildOwnerFilter(req.user, "solution");
    if (projectId) filter.projectId = projectId;

    const items = await SolutionArchitecture.find(filter)
      .select("name description projectId storyIds prompt hasContent createdAt updatedAt createdBy")
      .populate("projectId", "name")
      .sort({ updatedAt: -1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSolutionById = async (req, res) => {
  try {
    const item = await SolutionArchitecture.findById(req.params.id).populate("projectId", "name");
    if (!item) return res.status(404).json({ error: "Solution architecture not found" });
    if (!canAccessResource(req.user, "solution", item)) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(item.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const saveSolution = async (req, res) => {
  try {
    const { projectId, name, description, storyIds, prompt, content } = req.body;
    if (!projectId || !name?.trim()) {
      return res.status(400).json({ error: "Project and name are required" });
    }
    if (!content || (!content.title && !content.techStack && !content.schemas)) {
      return res.status(400).json({ error: "Architecture content is required to save" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!canAccessResource(req.user, "projects", project)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const saved = await SolutionArchitecture.create({
      projectId,
      name: name.trim(),
      description: description?.trim() || "",
      storyIds: storyIds || [],
      prompt: prompt?.trim() || "",
      content,
      hasContent: true,
      createdBy: req.user._id,
    });

    res.status(201).json(saved.toObject());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateSolution = async (req, res) => {
  try {
    const item = await SolutionArchitecture.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Solution architecture not found" });
    if (!canAccessResource(req.user, "solution", item)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, description, prompt, content } = req.body;
    if (name?.trim()) item.name = name.trim();
    if (description !== undefined) item.description = description?.trim() || "";
    if (prompt !== undefined) item.prompt = prompt?.trim() || "";
    if (content) {
      item.content = content;
      item.markModified("content");
      item.hasContent = Boolean(content.title || content.techStack || content.schemas);
    }

    await item.save();
    res.json(item.toObject());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteSolution = async (req, res) => {
  try {
    const item = await SolutionArchitecture.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Solution architecture not found" });
    if (!canAccessResource(req.user, "solution", item)) {
      return res.status(403).json({ error: "Access denied" });
    }
    await item.deleteOne();
    res.json({ message: "Solution architecture deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
