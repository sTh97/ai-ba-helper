import Project from "../models/projects.mjs";
import Story from "../models/story.model.mjs";
import SolutionArchitecture from "../models/solutionArchitecture.model.mjs";
import { callAI, getErrorMessage, getDocumentAIOptions, getRefineAIOptions } from "./ai.controller.mjs";
import { parseAIJson } from "../utils/aiParser.mjs";
import {
  buildOwnerFilter,
  canAccessResource,
  hasDataAccessAll,
} from "../utils/permissions.mjs";
import {
  generateArchitectureFile,
  buildExportFilename,
  FORMAT_META,
} from "../utils/solutionExport.mjs";

const VALID_FORMATS = ["pdf", "docx"];

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

const summarizeStoriesForArchitecture = (stories) => {
  if (stories.length <= 20) return summarizeStoriesForAI(stories);

  const byFeature = new Map();
  for (const story of stories) {
    const feature = (story.feature || "").trim() || "General";
    if (!byFeature.has(feature)) byFeature.set(feature, []);
    byFeature.get(feature).push(story);
  }

  return Array.from(byFeature.entries()).map(([feature, group]) => {
    const fields = new Set();
    const dependencies = new Set();
    for (const story of group) {
      for (const field of story.fields || []) {
        if (field?.name) fields.add(field.name);
      }
      for (const dep of story.dependencies || []) {
        if (dep) dependencies.add(String(dep).trim());
      }
    }
    return {
      feature,
      storyCount: group.length,
      examples: group.slice(0, 2).map((s) => truncate(s.correctedText || s.originalText, 120)),
      fields: Array.from(fields).slice(0, 10),
      dependencies: Array.from(dependencies).slice(0, 4),
    };
  });
};

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

    const storySummary = summarizeStoriesForArchitecture(stories);
    const compact = stories.length > 20;

    const userPrompt = `Project: "${project.name}"
${project.description ? `Description: ${truncate(project.description, 300)}` : ""}

Product capabilities (${compact ? "grouped by feature" : "from user stories"}, ${stories.length} stories total):
${JSON.stringify(storySummary)}

Detected features: ${JSON.stringify(collectFeatures(stories))}

Architect's rough notes:
${draftPrompt.trim()}

Refine this into a comprehensive, actionable architecture brief another AI can follow. Be thorough but concise — cover all major feature areas.`;

    const refined = await callAI(
      systemPrompt,
      userPrompt,
      false,
      getRefineAIOptions(req.aiSelection),
    );

    res.json({ refinedPrompt: refined.trim(), draftPrompt: draftPrompt.trim() });
  } catch (err) {
    console.error("Refine solution prompt error:", err?.response?.data || err.message);
    res.status(500).json({ error: getErrorMessage(err), detail: err.attempts || err?.response?.data });
  }
};

const buildArchitectureContent = async (project, stories, prompt, aiSelection) => {
  const features = collectFeatures(stories);
  const storySummary = summarizeStoriesForArchitecture(stories);
  const compact = stories.length > 20;

  const systemPrompt = `You are a principal solution architect and staff engineer.
You design pragmatic, modern, production-ready software architectures grounded in real product requirements.
Return ONLY valid JSON — no markdown, no code fences.
Keep mermaid diagrams concise (max 12 entities / 10 flow steps).`;

  const userPrompt = `Project / product: "${project.name}"
${project.description ? `Description: ${truncate(project.description, 400)}` : ""}

Product capabilities (${compact ? "grouped by feature" : "from user stories"}, ${stories.length} stories total):
${JSON.stringify(storySummary)}

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
- featureLinkages: ONE entry per unique detected feature (not one per story). Cover all features listed above.
- schemas: 6-12 core entities max with the most important fields only.
- erd.mermaid MUST be valid Mermaid "erDiagram" syntax. workflow.mermaid MUST be valid Mermaid "flowchart TD" syntax. Escape newlines as \\n inside the JSON strings.
- Keep entity/relationship names consistent between schemas, erd, and featureLinkages.
- Return COMPLETE valid JSON — do not truncate mid-response.`;

  let lastError = "Response was not valid JSON";
  let lastRaw = "";
  let aiOptions = getDocumentAIOptions(aiSelection);

  for (let attempt = 0; attempt <= 3; attempt++) {
    const promptText = attempt === 0
      ? userPrompt
      : `${userPrompt}\n\nYour previous response was invalid or truncated (${lastError}). Return ONLY complete valid JSON matching the shape. Be concise in mermaid strings if needed.`;

    if (attempt > 1) {
      aiOptions = getDocumentAIOptions(aiSelection, { maxTokens: Math.min((aiOptions.maxTokens || 8192) * 2, 16384) });
    }

    lastRaw = await callAI(systemPrompt, promptText, true, aiOptions);
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

    const content = await buildArchitectureContent(project, stories, prompt, req.aiSelection);

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

export const exportSolution = async (req, res) => {
  try {
    const { id, content: inlineContent, name: inlineName, format = "pdf" } = req.body;
    if (!VALID_FORMATS.includes(format)) {
      return res.status(400).json({ error: "Invalid format" });
    }

    let content = inlineContent;
    let name = inlineName;

    if (id) {
      const item = await SolutionArchitecture.findById(id);
      if (!item) return res.status(404).json({ error: "Solution architecture not found" });
      if (!canAccessResource(req.user, "solution", item)) {
        return res.status(403).json({ error: "Access denied" });
      }
      content = item.content;
      name = name || item.name;
    }

    if (!content || (!content.title && !content.techStack && !content.schemas)) {
      return res.status(400).json({ error: "No architecture content to export" });
    }

    const buffer = await generateArchitectureFile(content, format);
    const meta = FORMAT_META[format];
    const filename = buildExportFilename(name || content.title || "solution-architecture", format);

    res.setHeader("Content-Type", meta.mime);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("Export solution architecture error:", err.message);
    res.status(500).json({ error: getErrorMessage(err) });
  }
};
