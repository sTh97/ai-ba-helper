import Project from "../models/projects.mjs";
import Story from "../models/story.model.mjs";
import MarketingCollateral from "../models/marketingCollateral.model.mjs";
import { callAI, getErrorMessage, getDocumentAIOptions, getRefineAIOptions } from "./ai.controller.mjs";
import { parseAIJson } from "../utils/aiParser.mjs";
import {
  buildCollateralPreviewHtml,
  generateCollateralFile,
  buildExportFilename,
  FORMAT_META,
} from "../utils/marketingExport.mjs";
import {
  buildOwnerFilter,
  canAccessResource,
  hasDataAccessAll,
} from "../utils/permissions.mjs";

const VALID_FORMATS = ["pdf", "docx", "pptx"];

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
    acceptanceCriteria: (s.acceptanceCriteria || []).slice(0, 3).map((item) => truncate(item, 80)),
  }));

const formatGuidance = (format) => {
  if (format === "pptx") {
    return "Target format: PowerPoint deck. Keep each section punchy — short heading, a one-line subheading, a brief body sentence, and 3-5 crisp bullet points (each bullet a short phrase). Aim for 4-7 sections (slides).";
  }
  if (format === "docx") {
    return "Target format: editable Word document. Write fuller, well-structured prose — each section has a descriptive heading, an optional subheading, a 2-4 sentence body paragraph, and supporting bullets where useful. Aim for 4-8 sections.";
  }
  return "Target format: polished PDF one-pager/brochure. Balance concise persuasive copy with scannable bullets — each section has a clear heading, a short subheading, a 1-3 sentence body, and 2-5 bullets. Aim for 4-7 sections.";
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

export const refineMarketingPrompt = async (req, res) => {
  try {
    const { projectId, draftPrompt, storyIds, collateralType, format } = req.body;
    if (!projectId) return res.status(400).json({ error: "Project is required" });
    if (!draftPrompt?.trim()) {
      return res.status(400).json({ error: "Describe your vision before refining" });
    }

    const result = await getProjectStories(req.user, projectId);
    if (result.error) return res.status(result.status).json({ error: result.error });

    const { project } = result;
    const stories = filterStoriesByIds(result.stories, storyIds);
    if (stories.length === 0) {
      return res.status(400).json({ error: "Select at least one user story" });
    }

    const systemPrompt = `You are a senior product marketing strategist who briefs an AI to produce premium marketing collateral.
Output plain text only — no JSON, no markdown code fences.
Use these labeled sections:
Goal:
Audience:
Key messages:
Tone & style:
Proof points / features:
Call to action:
Must include:
Avoid:

The brief must instruct the AI to write persuasive, benefit-led marketing copy grounded in the product's real capabilities.`;

    const userPrompt = `Project: "${project.name}"
${project.description ? `Description: ${truncate(project.description, 300)}` : ""}
Collateral type: ${collateralType || "one-pager"}
Output format: ${format || "pdf"}

Product capabilities (from user stories, ${stories.length}):
${JSON.stringify(summarizeStoriesForAI(stories))}

User's rough vision:
${draftPrompt.trim()}

Refine this into a comprehensive, actionable marketing brief that another AI can follow to write the collateral.`;

    const refined = await callAI(systemPrompt, userPrompt, false, getRefineAIOptions(req.aiSelection));

    res.json({ refinedPrompt: refined.trim(), draftPrompt: draftPrompt.trim() });
  } catch (err) {
    console.error("Refine marketing prompt error:", err?.response?.data || err.message);
    res.status(500).json({ error: getErrorMessage(err), detail: err.attempts || err?.response?.data });
  }
};

const generateContent = async (project, stories, prompt, collateralType, format, aiSelection) => {
  const systemPrompt = `You are an award-winning product marketing copywriter.
You write compelling, benefit-driven marketing collateral grounded in a product's real capabilities.
Return ONLY valid JSON — no markdown, no code fences.`;

  const userPrompt = `Project / product: "${project.name}"
${project.description ? `Description: ${truncate(project.description, 400)}` : ""}
Collateral type: ${collateralType || "one-pager"}
${formatGuidance(format)}

Product capabilities (derived from user stories, ${stories.length}):
${JSON.stringify(summarizeStoriesForAI(stories))}

Marketing brief / vision (highest priority — follow closely):
${prompt?.trim() || "(no explicit brief — infer the most compelling angle from the product capabilities)"}

Write the marketing collateral. Return JSON ONLY with this shape:
{
  "title": "Punchy product/headline title",
  "subtitle": "One-line value proposition",
  "summary": "1-3 sentence overview paragraph",
  "sections": [
    {
      "heading": "Section heading",
      "subheading": "Optional short subheading or empty string",
      "body": "Persuasive paragraph (omit or empty for slide-style bullets)",
      "bullets": ["Benefit-led point", "Another point"]
    }
  ],
  "callToAction": "Strong closing call to action",
  "contact": "Optional contact line or empty string",
  "theme": { "primary": "#hex", "accent": "#hex" }
}

Rules:
- Write real marketing copy — NEVER echo raw user story text ("As a user I want…").
- Lead with benefits and outcomes, supported by concrete features.
- theme colors MUST be valid 6-digit hex with strong contrast on white.
- Tailor depth to the target format described above.`;

  let lastError = "Response was not valid JSON";
  let lastRaw = "";
  for (let attempt = 0; attempt <= 2; attempt++) {
    const prompt2 = attempt === 0
      ? userPrompt
      : `${userPrompt}\n\nYour previous response was invalid JSON (${lastError}). Return ONLY valid JSON.`;
    lastRaw = await callAI(systemPrompt, prompt2, true, getDocumentAIOptions(aiSelection, { maxTokens: 6000 }));
    try {
      const parsed = parseAIJson(lastRaw);
      const content = parsed.content || parsed;
      if (content && (content.title || (content.sections && content.sections.length))) {
        return content;
      }
      lastError = "Missing collateral content";
    } catch (err) {
      lastError = err.message;
    }
  }

  const error = new Error(lastError);
  error.raw = lastRaw?.slice?.(0, 2000);
  throw error;
};

export const generateMarketingCollateral = async (req, res) => {
  try {
    const { projectId, prompt, storyIds, collateralType, format = "pdf" } = req.body;
    if (!projectId) return res.status(400).json({ error: "Project is required" });
    if (!VALID_FORMATS.includes(format)) {
      return res.status(400).json({ error: "Invalid format" });
    }

    const result = await getProjectStories(req.user, projectId);
    if (result.error) return res.status(result.status).json({ error: result.error });

    const { project } = result;
    const stories = filterStoriesByIds(result.stories, storyIds);
    if (stories.length === 0) {
      return res.status(400).json({ error: "Select at least one user story to generate collateral" });
    }

    const content = await generateContent(project, stories, prompt, collateralType, format, req.aiSelection);

    res.json({
      projectId,
      storyIds: stories.map((s) => s._id),
      collateralType: collateralType || "one-pager",
      format,
      prompt: prompt?.trim() || "",
      name: content.title || project.name,
      description: content.subtitle || "",
      content,
      previewHtml: buildCollateralPreviewHtml(content),
    });
  } catch (err) {
    console.error("Generate marketing collateral error:", err?.response?.data || err.message);
    res.status(500).json({ error: getErrorMessage(err), detail: err.attempts || err.raw });
  }
};

export const getAllCollateral = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = buildOwnerFilter(req.user, "marketing");
    if (projectId) filter.projectId = projectId;

    const items = await MarketingCollateral.find(filter)
      .select("name description projectId storyIds collateralType format prompt hasContent createdAt updatedAt createdBy")
      .populate("projectId", "name")
      .sort({ updatedAt: -1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCollateralById = async (req, res) => {
  try {
    const item = await MarketingCollateral.findById(req.params.id).populate("projectId", "name");
    if (!item) return res.status(404).json({ error: "Collateral not found" });
    if (!canAccessResource(req.user, "marketing", item)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const row = item.toObject();
    row.previewHtml = buildCollateralPreviewHtml(item.content);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const saveCollateral = async (req, res) => {
  try {
    const { projectId, name, description, storyIds, collateralType, format, prompt, content } = req.body;
    if (!projectId || !name?.trim()) {
      return res.status(400).json({ error: "Project and name are required" });
    }
    if (!content || (!content.title && !(content.sections && content.sections.length))) {
      return res.status(400).json({ error: "Collateral content is required to save" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!canAccessResource(req.user, "projects", project)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const saved = await MarketingCollateral.create({
      projectId,
      name: name.trim(),
      description: description?.trim() || "",
      storyIds: storyIds || [],
      collateralType: collateralType || "one-pager",
      format: VALID_FORMATS.includes(format) ? format : "pdf",
      prompt: prompt?.trim() || "",
      content,
      hasContent: true,
      createdBy: req.user._id,
    });

    const row = saved.toObject();
    row.previewHtml = buildCollateralPreviewHtml(saved.content);
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateCollateral = async (req, res) => {
  try {
    const item = await MarketingCollateral.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Collateral not found" });
    if (!canAccessResource(req.user, "marketing", item)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, description, collateralType, format, prompt, content } = req.body;
    if (name?.trim()) item.name = name.trim();
    if (description !== undefined) item.description = description?.trim() || "";
    if (collateralType) item.collateralType = collateralType;
    if (format && VALID_FORMATS.includes(format)) item.format = format;
    if (prompt !== undefined) item.prompt = prompt?.trim() || "";
    if (content) {
      item.content = content;
      item.hasContent = Boolean(content.title || (content.sections && content.sections.length));
    }

    await item.save();
    const row = item.toObject();
    row.previewHtml = buildCollateralPreviewHtml(item.content);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteCollateral = async (req, res) => {
  try {
    const item = await MarketingCollateral.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Collateral not found" });
    if (!canAccessResource(req.user, "marketing", item)) {
      return res.status(403).json({ error: "Access denied" });
    }
    await item.deleteOne();
    res.json({ message: "Collateral deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const exportCollateral = async (req, res) => {
  try {
    const { id, content: inlineContent, name: inlineName, format = "pdf" } = req.body;
    if (!VALID_FORMATS.includes(format)) {
      return res.status(400).json({ error: "Invalid format" });
    }

    let content = inlineContent;
    let name = inlineName;

    if (id) {
      const item = await MarketingCollateral.findById(id);
      if (!item) return res.status(404).json({ error: "Collateral not found" });
      if (!canAccessResource(req.user, "marketing", item)) {
        return res.status(403).json({ error: "Access denied" });
      }
      content = item.content;
      name = name || item.name;
    }

    if (!content || (!content.title && !(content.sections && content.sections.length))) {
      return res.status(400).json({ error: "No collateral content to export" });
    }

    const buffer = await generateCollateralFile(content, format);
    const meta = FORMAT_META[format];
    const filename = buildExportFilename(name || content.title || "marketing-collateral", format);

    res.setHeader("Content-Type", meta.mime);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("Export marketing collateral error:", err.message);
    res.status(500).json({ error: getErrorMessage(err) });
  }
};
