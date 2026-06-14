import Project from "../models/projects.mjs";
import Story from "../models/story.model.mjs";
import ApplicationPrototype from "../models/prototype.model.mjs";
import PrototypeJob from "../models/prototypeJob.model.mjs";
import { callAI, getErrorMessage, getStructureAIOptions } from "./ai.controller.mjs";
import { startGenerateJob, startMergeJob, startUpdateJob } from "../services/prototypeJobRunner.mjs";
import { normalizeSavedPrototype } from "../utils/prototypeBuilder.mjs";
import {
  buildOwnerFilter,
  canAccessResource,
  hasDataAccessAll,
} from "../utils/permissions.mjs";

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

const truncate = (value, max = 180) => {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const summarizeStoriesForAI = (stories) => {
  const compact = stories.length > 12;
  const textLimit = compact ? 120 : 180;
  const criteriaLimit = compact ? 2 : 3;
  const criteriaTextLimit = compact ? 60 : 80;

  return stories.map((s) => ({
    id: s._id.toString(),
    feature: (s.feature || "").trim() || undefined,
    text: truncate(s.correctedText || s.originalText, textLimit),
    acceptanceCriteria: (s.acceptanceCriteria || [])
      .slice(0, criteriaLimit)
      .map((item) => truncate(item, criteriaTextLimit)),
  }));
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

export const refinePrototypePrompt = async (req, res) => {
  try {
    const { projectId, draftPrompt, storyIds: selectedStoryIds } = req.body;
    if (!projectId) return res.status(400).json({ error: "Project is required" });
    if (!draftPrompt?.trim()) {
      return res.status(400).json({ error: "Describe what you want before refining" });
    }

    const result = await getProjectStories(req.user, projectId);
    if (result.error) return res.status(result.status).json({ error: result.error });

    const { project } = result;
    const stories = filterStoriesByIds(result.stories, selectedStoryIds);
    if (stories.length === 0) {
      return res.status(400).json({ error: "Select at least one user story" });
    }
    const storySummary = summarizeStoriesForAI(stories);

    const systemPrompt = `You are a senior UX strategist and product consultant who briefs AI to build investor-quality interactive prototypes.
Output plain text only — no JSON, no markdown code fences.
Use these labeled sections:
Vision:
Target users:
Screen priorities:
User story alignment:
UI style and layout:
Must include:
Avoid:

The brief must instruct the AI to build PROFESSIONAL, production-grade UI tailored to the specific application domain — not wireframe placeholders.`;

    const userPrompt = `Project: "${project.name}"
${project.description ? `Description: ${truncate(project.description, 300)}` : ""}

User stories (${stories.length}):
${JSON.stringify(storySummary)}

User's draft instructions:
${draftPrompt.trim()}

Refine into a comprehensive, actionable prototype brief. Be specific about:
1. How user stories map to named screens appropriate for this application's domain (e.g. "Patient Dashboard", "Leave Request Form", "Fleet Tracking Map" — NOT generic ecommerce screens unless the domain is ecommerce)
2. UI quality bar: polished forms/tables/wizards/dashboards with realistic domain-specific data
3. Layout: SEPARATE role experiences — end-users get top navbar, admins get sidebar console, auth is a fullscreen page
4. Domain-specific controls per screen (filters, steppers, KPI cards, approval workflows, etc.)
5. Visual style: Inter font, #2563eb primary, generous whitespace, subtle shadows — NOT gray placeholder boxes`;

    const refined = await callAI(systemPrompt, userPrompt, false, getStructureAIOptions({ maxTokens: 2048 }));

    res.json({
      refinedPrompt: refined.trim(),
      draftPrompt: draftPrompt.trim(),
    });
  } catch (err) {
    console.error("Refine prompt error:", err?.response?.data || err.message);
    res.status(500).json({
      error: getErrorMessage(err),
      detail: err.attempts || err?.response?.data,
    });
  }
};

const toPlain = (value) => (value?.toObject ? value.toObject() : value);

const resolveJobPrototype = (job) => {
  const partial = toPlain(job.partialPrototype);
  if (partial?.html || partial?.fullDocument) return partial;

  const result = toPlain(job.result);
  if (result?.appPrototype?.html || result?.appPrototype?.fullDocument) {
    return result.appPrototype;
  }
  if (result?.prototype?.html || result?.prototype?.fullDocument) {
    return result.prototype;
  }
  return null;
};

const formatJobResponse = (job) => {
  const partialPrototype = toPlain(job.partialPrototype);
  let result = job.status === "completed" ? toPlain(job.result) : undefined;

  if (result) {
    const prototype = resolveJobPrototype(job);
    if (prototype) {
      result = { ...result, prototype };
    }
  }

  return {
    jobId: job._id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    chunks: job.chunks,
    structure: job.structure,
    partialPrototype,
    result,
    error: job.error,
    usedScaffold: job.usedScaffold,
    structureFromFallback: job.structureFromFallback,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
};

export const generatePrototype = async (req, res) => {
  try {
    const { projectId, prototypePrompt, storyIds: selectedStoryIds, name: customName } = req.body;
    if (!projectId) return res.status(400).json({ error: "Project is required" });

    const result = await getProjectStories(req.user, projectId);
    if (result.error) return res.status(result.status).json({ error: result.error });

    const stories = filterStoriesByIds(result.stories, selectedStoryIds);
    if (stories.length === 0) {
      return res.status(400).json({ error: "Select at least one user story to generate a prototype" });
    }

    const job = await PrototypeJob.create({
      type: "generate",
      status: "queued",
      projectId,
      createdBy: req.user._id,
      storyIds: stories.map((s) => s._id),
      prototypePrompt: prototypePrompt?.trim() || "",
      customName: customName?.trim() || "",
      progress: { phase: "queued", message: "Queued for generation", percent: 0 },
    });

    startGenerateJob(job._id.toString());
    res.status(202).json({ jobId: job._id, status: "queued", message: "Prototype generation started" });
  } catch (err) {
    console.error("Prototype job create error:", err.message);
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

export const updatePrototypeApplication = async (req, res) => {
  try {
    const {
      projectId,
      prototypeId,
      updatePrompt,
      prototype: inlinePrototype,
      structure: inlineStructure,
      storyIds,
      prototypePrompt,
      name,
    } = req.body;

    if (!projectId) return res.status(400).json({ error: "Project is required" });
    if (!updatePrompt?.trim()) {
      return res.status(400).json({ error: "Describe what you want to change" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!canAccessResource(req.user, "projects", project)) {
      return res.status(403).json({ error: "Access denied" });
    }

    let sourceSnapshot = null;
    let sourcePrototypeId = null;

    if (prototypeId) {
      const proto = await ApplicationPrototype.findById(prototypeId);
      if (!proto) return res.status(404).json({ error: "Prototype not found" });
      if (!canAccessResource(req.user, "applications", proto)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const normalized = normalizeSavedPrototype(proto.prototype);
      if (!normalized.fullDocument && !normalized.html) {
        return res.status(400).json({ error: "Saved prototype has no preview code to update" });
      }
      sourcePrototypeId = proto._id;
      sourceSnapshot = {
        name: proto.name,
        description: proto.description,
        storyIds: proto.storyIds,
        structure: proto.structure,
        prototype: normalized,
        prototypePrompt: proto.prototypePrompt || "",
        usedScaffold: proto.usedScaffold,
        structureFromFallback: proto.structureFromFallback,
        isMerged: proto.isMerged,
        mergedFromIds: proto.mergedFromIds,
      };
    } else if (inlinePrototype?.html || inlinePrototype?.fullDocument) {
      const normalized = normalizeSavedPrototype(inlinePrototype);
      sourceSnapshot = {
        name: name?.trim() || "Application Prototype",
        storyIds: storyIds || [],
        structure: inlineStructure || {},
        prototype: normalized,
        prototypePrompt: prototypePrompt?.trim() || "",
      };
    } else {
      return res.status(400).json({ error: "Prototype preview code is required to update" });
    }

    const job = await PrototypeJob.create({
      type: "update",
      status: "queued",
      projectId,
      createdBy: req.user._id,
      sourcePrototypeId,
      sourceSnapshot,
      updatePrompt: updatePrompt.trim(),
      customName: name?.trim() || sourceSnapshot.name || "",
      progress: { phase: "queued", message: "Queued for update", percent: 0 },
    });

    startUpdateJob(job._id.toString());
    res.status(202).json({ jobId: job._id, status: "queued", message: "Prototype update started" });
  } catch (err) {
    console.error("Update job create error:", err.message);
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

export const mergePrototypes = async (req, res) => {
  try {
    const { projectId, prototypeIds, mergePrompt, name } = req.body;
    if (!projectId) return res.status(400).json({ error: "Project is required" });
    if (!Array.isArray(prototypeIds) || prototypeIds.length < 2) {
      return res.status(400).json({ error: "Select at least 2 saved prototypes to merge" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!canAccessResource(req.user, "projects", project)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const protos = await ApplicationPrototype.find({
      _id: { $in: prototypeIds },
      projectId,
    });

    if (protos.length < 2) {
      return res.status(400).json({ error: "Could not find the selected prototypes" });
    }

    for (const proto of protos) {
      if (!canAccessResource(req.user, "applications", proto)) {
        return res.status(403).json({ error: "Access denied to one of the prototypes" });
      }
      if (!proto.prototype?.html?.trim()) {
        return res.status(400).json({
          error: `"${proto.name}" has no saved code. Regenerate and save it before merging.`,
        });
      }
    }

    const job = await PrototypeJob.create({
      type: "merge",
      status: "queued",
      projectId,
      createdBy: req.user._id,
      prototypeIds,
      mergePrompt: mergePrompt?.trim() || "",
      customName: name?.trim() || "",
      progress: { phase: "queued", message: "Queued for merge", percent: 0 },
    });

    startMergeJob(job._id.toString());
    res.status(202).json({ jobId: job._id, status: "queued", message: "Prototype merge started" });
  } catch (err) {
    console.error("Merge job create error:", err.message);
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

export const getPrototypeJob = async (req, res) => {
  try {
    const job = await PrototypeJob.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.createdBy && job.createdBy.toString() !== req.user._id.toString()) {
      if (!hasDataAccessAll(req.user, "applications")) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    res.json(formatJobResponse(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelPrototypeJob = async (req, res) => {
  try {
    const job = await PrototypeJob.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.createdBy && job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (job.status === "completed" || job.status === "failed") {
      return res.status(400).json({ error: "Job already finished" });
    }

    job.cancelled = true;
    job.status = "cancelled";
    job.progress.message = "Cancelled by user";
    await job.save();

    res.json({ message: "Job cancelled", jobId: job._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllPrototypes = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = buildOwnerFilter(req.user, "applications");
    if (projectId) filter.projectId = projectId;

    const prototypes = await ApplicationPrototype.find(filter)
      .select("name description projectId storyIds structure usedScaffold structureFromFallback prototypePrompt hasCode isMerged mergedFromIds prototype.html prototype.fullDocument createdAt updatedAt createdBy")
      .populate("projectId", "name")
      .sort({ updatedAt: -1 });

    res.json(prototypes.map((p) => {
      const row = p.toObject();
      row.hasCode = Boolean(p.hasCode || p.prototype?.html || p.prototype?.fullDocument);
      delete row.prototype;
      return row;
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPrototypeById = async (req, res) => {
  try {
    const prototype = await ApplicationPrototype.findById(req.params.id)
      .populate("projectId", "name");
    if (!prototype) return res.status(404).json({ error: "Prototype not found" });

    if (!canAccessResource(req.user, "applications", prototype)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const row = prototype.toObject();
    row.prototype = normalizeSavedPrototype(prototype.prototype);
    row.hasCode = Boolean(row.prototype.html || row.prototype.fullDocument);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const savePrototype = async (req, res) => {
  try {
    const {
      projectId,
      name,
      description,
      storyIds,
      structure,
      prototype,
      usedScaffold,
      structureFromFallback,
      prototypePrompt,
      isMerged,
      mergedFromIds,
    } = req.body;
    if (!projectId || !name?.trim()) {
      return res.status(400).json({ error: "Project and name are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!canAccessResource(req.user, "projects", project)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const normalizedPrototype = normalizeSavedPrototype(prototype);
    if (!normalizedPrototype.fullDocument && !normalizedPrototype.html) {
      return res.status(400).json({ error: "Prototype code is required to save" });
    }

    const saved = await ApplicationPrototype.create({
      projectId,
      name: name.trim(),
      description: description?.trim() || "",
      storyIds: storyIds || [],
      structure: structure || {},
      prototype: normalizedPrototype,
      usedScaffold: Boolean(usedScaffold),
      structureFromFallback: Boolean(structureFromFallback),
      prototypePrompt: prototypePrompt?.trim() || "",
      hasCode: true,
      isMerged: Boolean(isMerged),
      mergedFromIds: mergedFromIds || [],
      createdBy: req.user._id,
    });

    const row = saved.toObject();
    row.prototype = normalizeSavedPrototype(saved.prototype);
    row.hasCode = true;
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updatePrototype = async (req, res) => {
  try {
    const prototype = await ApplicationPrototype.findById(req.params.id);
    if (!prototype) return res.status(404).json({ error: "Prototype not found" });
    if (!canAccessResource(req.user, "applications", prototype)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const {
      name,
      description,
      structure,
      prototype: protoData,
      usedScaffold,
      structureFromFallback,
      prototypePrompt,
      isMerged,
      mergedFromIds,
    } = req.body;
    if (name?.trim()) prototype.name = name.trim();
    if (description !== undefined) prototype.description = description?.trim() || "";
    if (structure) prototype.structure = structure;
    if (protoData) {
      prototype.prototype = normalizeSavedPrototype(protoData);
      prototype.hasCode = Boolean(
        prototype.prototype?.html || prototype.prototype?.fullDocument
      );
    }
    if (usedScaffold !== undefined) prototype.usedScaffold = Boolean(usedScaffold);
    if (structureFromFallback !== undefined) {
      prototype.structureFromFallback = Boolean(structureFromFallback);
    }
    if (prototypePrompt !== undefined) {
      prototype.prototypePrompt = prototypePrompt?.trim() || "";
    }
    if (isMerged !== undefined) prototype.isMerged = Boolean(isMerged);
    if (mergedFromIds !== undefined) prototype.mergedFromIds = mergedFromIds;

    await prototype.save();
    const row = prototype.toObject();
    row.prototype = normalizeSavedPrototype(prototype.prototype);
    row.hasCode = Boolean(row.prototype.html || row.prototype.fullDocument);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deletePrototype = async (req, res) => {
  try {
    const prototype = await ApplicationPrototype.findById(req.params.id);
    if (!prototype) return res.status(404).json({ error: "Prototype not found" });
    if (!canAccessResource(req.user, "applications", prototype)) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prototype.deleteOne();
    res.json({ message: "Prototype deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
