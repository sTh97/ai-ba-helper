import PrototypeJob from "../models/prototypeJob.model.mjs";
import ApplicationPrototype from "../models/prototype.model.mjs";
import Project from "../models/projects.mjs";
import Story from "../models/story.model.mjs";
import {
  callAI,
  getErrorMessage,
  getPrototypeScreenConcurrency,
  getScreenAIOptions,
  getStructureAIOptions,
  selectionToOptions,
} from "../controllers/ai.controller.mjs";
import { parseAIJson } from "../utils/aiParser.mjs";
import { planPrototypeChunks } from "../utils/prototypeChunker.mjs";
import {
  assemblePrototypeFromChunks,
  buildRichScreenScaffold,
  buildScaffoldFromStructure,
  buildStructureFromStories,
  detectScreenType,
  detectScreenRole,
  extractScreenHtml,
  getDesignSystemPrompt,
  inferApplicationDomain,
  injectScreenIntoShell,
  normalizeSavedPrototype,
  isValidStructure,
  mergeStructures,
  mergeScreenCss,
  isStoryDerivedStructure,
  normalizeStructureAfterAI,
  sanitizePrototypeCode,
  truncateCodeForAI,
} from "../utils/prototypeBuilder.mjs";
import { isAmateurScreenOutput } from "../utils/prototypeDesignSystem.mjs";
import {
  DEFAULT_THEME,
  heuristicTheme,
  normalizeTheme,
} from "../utils/prototypeTheme.mjs";

const LARGE_STORY_THRESHOLD = 12;
const STRUCTURE_SKIP_THRESHOLD = 5;

const truncate = (value, max = 180) => {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const summarizeStoriesForAI = (stories) => {
  const compact = stories.length > LARGE_STORY_THRESHOLD;
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

const collectStoryFields = (stories, limit = 14) => {
  const seen = new Set();
  const out = [];
  for (const s of stories) {
    for (const f of s.fields || []) {
      const name = String(f.name || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        name: truncate(name, 40),
        type: truncate(String(f.type || "").trim(), 20),
        description: truncate(String(f.description || "").trim(), 80),
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
};

const collectStoryList = (stories, key, limit = 8, maxLen = 120) => {
  const seen = new Set();
  const out = [];
  for (const s of stories) {
    for (const item of s[key] || []) {
      const text = String(item || "").trim();
      if (!text || seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());
      out.push(truncate(text, maxLen));
      if (out.length >= limit) return out;
    }
  }
  return out;
};

const buildCustomPromptBlock = (prompt) => {
  const text = String(prompt || "").trim();
  if (!text) return "";
  return `

=== PRODUCT OWNER PROTOTYPE BRIEF (highest priority — follow closely) ===
${text}
=== END BRIEF ===`;
};

const compactStructureForAI = (structure) => ({
  appName: structure.appName,
  summary: structure.summary,
  screens: (structure.screens || []).map((screen) => ({
    id: screen.id,
    title: screen.title,
    description: truncate(screen.description, 120),
    features: (screen.features || []).slice(0, 4),
    mappedStoryCount: (screen.mappedStoryIds || []).length,
  })),
});

const parseAIWithRetries = async (systemPrompt, userPrompt, options = {}, maxRetries = 1) => {
  let lastError = "Response was not valid JSON";
  let lastRaw = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const prompt = attempt === 0
      ? userPrompt
      : `${userPrompt}\n\nYour previous response was invalid JSON (${lastError}). Return ONLY valid JSON.`;

    lastRaw = await callAI(systemPrompt, prompt, true, options);
    try {
      return parseAIJson(lastRaw);
    } catch (err) {
      lastError = err.message;
    }
  }

  const err = new Error(lastError);
  err.raw = lastRaw?.slice?.(0, 2000);
  throw err;
};

const withJobSelection = (aiSelection, factory, overrides = {}) =>
  selectionToOptions(aiSelection, factory(overrides));

const generateDesignTheme = async (prototypePrompt, stories, projectName, domain, aiSelection = null) => {
  const fallback = heuristicTheme(prototypePrompt || "", projectName || "");
  const storyText = (stories || [])
    .slice(0, 8)
    .map((s) => s.correctedText || s.originalText || "")
    .join(" ")
    .slice(0, 1200);

  const systemPrompt = `You are a brand & UI design director. Invent a UNIQUE visual identity for an app from its brief.
Return ONLY valid JSON. Pick colors and Google Fonts that genuinely match the brand mood — avoid defaulting to blue + Inter unless the brief truly calls for it.`;

  const userPrompt = `Project: "${projectName}"
Domain: ${domain}
Brief / instructions:
${(prototypePrompt || "").slice(0, 1500) || "(no explicit brief — infer from stories)"}

User stories (excerpt):
${storyText}

Design a cohesive theme. Return JSON ONLY:
{
  "styleName": "short name e.g. Minimalist Editorial Luxury",
  "mood": "3-5 adjectives",
  "primary": "#hex",
  "accent": "#hex",
  "background": "#hex (page background; dark hex allowed for dark themes)",
  "surface": "#hex (cards/panels)",
  "text": "#hex",
  "textMuted": "#hex",
  "border": "#hex",
  "headingFont": "a real Google Font family name",
  "bodyFont": "a real Google Font family name",
  "radius": "corner radius like 2px, 8px, 16px, or 20px",
  "layout": "one sentence describing the layout personality"
}

Rules:
- Colors MUST be valid 6-digit hex with strong contrast (text vs background).
- Luxury/editorial/minimal => near-black + a refined accent, a serif heading font (e.g. Playfair Display, Fraunces), small radius.
- Playful/consumer => brighter palette, rounded radius, friendly fonts (e.g. Poppins, Nunito).
- Fintech/enterprise => deep blue/navy, restrained accent, medium radius.
- Match the SPECIFIC brand described — do not output a generic SaaS theme.`;

  try {
    const parsed = await parseAIWithRetries(
      systemPrompt,
      userPrompt,
      withJobSelection(aiSelection, getStructureAIOptions, { maxTokens: 700 }),
      1
    );
    const raw = parsed.theme || parsed;
    const theme = normalizeTheme(raw, fallback);
    console.log(`Design theme: "${theme.styleName}" — ${theme.primary}/${theme.accent}, ${theme.headingFont}/${theme.bodyFont}`);
    return theme;
  } catch (err) {
    console.warn("Design theme AI failed, using heuristic theme:", err.message);
    return fallback;
  }
};

const activeJobs = new Set();

const isJobCancelled = async (jobId) => {
  const job = await PrototypeJob.findById(jobId).select("cancelled status");
  return !job || job.cancelled || job.status === "cancelled";
};

const updateJob = async (jobId, patch) => {
  await PrototypeJob.findByIdAndUpdate(jobId, patch);
};

const setChunkStatus = async (job, chunkId, status, extra = {}) => {
  const { progressPatch, usedScaffold, error, ...chunkExtra } = extra;
  const chunks = (job.chunks || []).map((c) => {
    const plain = c.toObject ? c.toObject() : { ...c };
    if (plain.id !== chunkId) return plain;
    return {
      ...plain,
      ...chunkExtra,
      status,
      ...(usedScaffold !== undefined ? { usedScaffold } : {}),
      ...(error !== undefined ? { error } : {}),
      ...(status === "running" ? { startedAt: new Date() } : {}),
      ...(status === "done" || status === "failed" ? { completedAt: new Date() } : {}),
    };
  });

  const doneCount = chunks.filter((c) => c.status === "done" || c.status === "skipped").length;
  const percent = job.progress.totalChunks > 0
    ? Math.round((doneCount / job.progress.totalChunks) * 100)
    : 0;

  await updateJob(job._id, {
    chunks,
    "progress.percent": percent,
    "progress.currentChunk": doneCount,
    ...(progressPatch || {}),
  });

  return PrototypeJob.findById(job._id);
};

const resolveScreenId = (chunkDef) =>
  chunkDef.screenId || String(chunkDef.id || "").replace(/^screen-/, "");

const orderScreenChunks = (structure, screenChunks) => {
  const order = (structure.screens || []).map((s) => s.id);
  const byId = new Map(screenChunks.map((c) => [c.screenId, c]));
  return order.map((id) => byId.get(id)).filter(Boolean);
};

const rebuildPartialFromChunks = (structure, screenChunks, shell) => {
  let html = shell.html;
  let css = shell.css;
  for (const chunk of orderScreenChunks(structure, screenChunks)) {
    html = injectScreenIntoShell(html, chunk.screenId, chunk.html);
    css = mergeScreenCss(css, chunk.css, chunk.screenId);
  }
  return assemblePrototypeFromChunks(structure, screenChunks, { html, css, js: shell.js });
};

const runPool = async (items, concurrency, worker) => {
  const results = new Array(items.length);
  let index = 0;

  const runNext = async () => {
    while (index < items.length) {
      const i = index;
      index += 1;
      results[i] = await worker(items[i], i);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runNext()
  );
  await Promise.all(workers);
  return results;
};

const defaultPrototypeName = (stories, projectName, customName) => {
  if (customName?.trim()) return customName.trim();
  if (stories.length === 1) {
    return truncate(stories[0].correctedText || stories[0].originalText, 48);
  }
  return `${projectName} — ${stories.length} stories`;
};

const isWeakScreenHtml = (html, css = "") =>
  isAmateurScreenOutput(sanitizePrototypeCode(html || ""), css);

const generateScreenHtml = async (screen, screenIndex, stories, structure, brief, projectName, domain = "general", theme = null, aiSelection = null) => {
  const screenStories = stories.filter((s) =>
    (screen.mappedStoryIds || []).includes(s._id.toString())
  );
  const relevantStories = screenStories.length > 0 ? screenStories : stories.slice(0, 3);
  const storySummary = summarizeStoriesForAI(relevantStories);
  const acceptanceCriteria = screenStories.flatMap((s) => s.acceptanceCriteria || []).slice(0, 6);
  const screenFields = collectStoryFields(relevantStories);
  const businessRules = collectStoryList(relevantStories, "businessRules", 6);
  const validations = collectStoryList(relevantStories, "validations", 6);
  const constraints = collectStoryList(relevantStories, "constraints", 4);
  const screenType = screen.screenType || detectScreenType(screen);
  const screenRole = screen.role || detectScreenRole(screen);
  const scaffoldHtml = buildRichScreenScaffold(screen, screenIndex, { domain });
  const designGuide = getDesignSystemPrompt(screenType, screenRole, domain, theme);

  const systemPrompt = `You are a world-class product designer and frontend engineer — think Lovable / v0 quality.
You design distinctive, brand-specific interfaces from a creative brief. Each app should look uniquely tailored to its brand and domain, NOT a generic template.
Return ONLY valid JSON with keys: html, css, js. No markdown, no code fences.`;

  const userPrompt = `Application: "${structure.appName || projectName}"
Domain: ${domain}
Screen (${screenIndex + 1}/${structure.screens?.length || "?"}): "${screen.title}"
Screen ID: ${screen.id}
Screen type: ${screenType}
Screen role: ${screenRole} (customer=end-user top-nav shell, admin=sidebar console, public=fullscreen auth)
Description: ${screen.description || ""}
Features to implement: ${JSON.stringify(screen.features || [])}
Acceptance criteria: ${JSON.stringify(acceptanceCriteria)}${screenFields.length > 0 ? `
Data fields to render (use the given input type for each): ${JSON.stringify(screenFields)}` : ""}${businessRules.length > 0 ? `
Business rules to honor: ${JSON.stringify(businessRules)}` : ""}${validations.length > 0 ? `
Validation rules (required markers, inline errors, formats): ${JSON.stringify(validations)}` : ""}${constraints.length > 0 ? `
Constraints: ${JSON.stringify(constraints)}` : ""}
${brief}

${designGuide}

STRUCTURAL HINT ONLY (use loosely for which regions to include — do NOT copy its styling, colors, or content; design fresh UI that expresses the PROJECT VISUAL THEME above):
${truncateCodeForAI(scaffoldHtml, 1600)}

Return JSON:
{
  "html": "<section class=\\"screen\\" data-screen=\\"${screen.id}\\">...</section>",
  "css": "[data-screen=\\"${screen.id}\\"] { ... theme-expressing styles ... }",
  "js": ""
}

QUALITY BAR (reject-level if violated):
- DISTINCTIVE design that expresses the project theme — different briefs MUST yield visibly different layouts, colors, and typography. Do NOT produce a generic blue-and-Inter SaaS look unless the theme says so.${screenFields.length > 0 ? `
- Render a real, correctly-typed input control for EVERY listed data field, wire up the listed validation rules (required markers, inline error text, input patterns), and reflect the business rules/constraints in the UI.` : ""}
- Production-grade UI appropriate for the ${domain} domain — realistic labels, data, and workflows
- NO gray empty placeholder divs for images — use <img> (Unsplash for photos) or inline SVG where visuals are needed
- NO raw user story text ("As a customer I want…") — only polished UI labels and content
- NO lorem ipsum, NO emoji icons for UI chrome (use inline SVG)
- Include interactive-looking controls appropriate to this screen type (filters, steppers, tables, forms, galleries, etc.)
- Return ONLY one <section class="screen" data-screen="${screen.id}" data-role="${screenRole}"> element
- Do NOT include sidebar, top navbar, role switcher, <html>, <head>, or outer app shell — the platform adds those per role
- Auth (public role): fullscreen split layout filling the viewport — NOT a small card inside a content area
- All <button> elements must have type="button"
- css: WRITE scoped css under [data-screen="${screen.id}"] using the theme palette/fonts — this is how the design becomes distinctive. Never redefine .btn/.badge/.step at GLOBAL scope.
- js: only for simple tab/toggle interactions on this screen, or empty string`;

  // Up to 2 full generation attempts: a weak/empty result triggers a regenerate
  // before we fall back to the scaffold (which carries generic placeholder content).
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const prompt = attempt === 1
        ? userPrompt
        : `${userPrompt}\n\nNOTE: A previous attempt was rejected for being too sparse/generic. Produce a richer, fully fleshed-out, theme-specific screen with real domain content.`;
      const parsed = await parseAIWithRetries(systemPrompt, prompt, withJobSelection(aiSelection, getScreenAIOptions), 2);
      const html = parsed.html || parsed.prototype?.html || "";
      const css = parsed.css || parsed.prototype?.css || "";
      const js = parsed.js || parsed.prototype?.js || "";

      if ((html.includes("data-screen") || html.includes("<section")) && !isWeakScreenHtml(html, css)) {
        return { screenId: screen.id, html, css, js, usedScaffold: false };
      }
      console.warn(`Screen ${screen.id} AI output weak/empty (attempt ${attempt}/2)`);
    } catch (err) {
      console.warn(`Screen ${screen.id} AI failed (attempt ${attempt}/2):`, err.message);
    }
  }

  console.warn(`Screen ${screen.id} falling back to scaffold after AI attempts`);
  return {
    screenId: screen.id,
    html: scaffoldHtml,
    css: "",
    js: "",
    usedScaffold: true,
  };
};

export const runGenerateJob = async (jobId) => {
  if (activeJobs.has(jobId)) return;
  activeJobs.add(jobId);

  try {
    const job = await PrototypeJob.findById(jobId);
    if (!job || job.cancelled) return;

    await updateJob(jobId, { status: "running", "progress.phase": "scaffold", "progress.message": "Building scaffold…" });

    const project = await Project.findById(job.projectId);
    if (!project) throw new Error("Project not found");

    const stories = await Story.find({
      _id: { $in: job.storyIds },
      projectId: job.projectId,
    }).sort({ createdAt: -1 });

    if (stories.length === 0) throw new Error("No user stories found");

    const brief = buildCustomPromptBlock(job.prototypePrompt);
    const domain = inferApplicationDomain(job.prototypePrompt, stories, project.name);
    const theme = await generateDesignTheme(job.prototypePrompt, stories, project.name, domain, job.aiSelection);
    const { structure: initialStructure, chunks } = planPrototypeChunks(
      stories,
      project.name,
      job.prototypePrompt
    );
    initialStructure.theme = theme;

    await updateJob(jobId, {
      chunks: chunks.map((c) => ({ ...c, status: "pending" })),
      structure: initialStructure,
      "progress.totalChunks": chunks.length,
      "progress.percent": 0,
      "progress.currentChunk": 0,
    });

    let jobDoc = await PrototypeJob.findById(jobId);
    if (await isJobCancelled(jobId)) return;

    const scaffold = buildScaffoldFromStructure(initialStructure, { domain, theme });
    await setChunkStatus(jobDoc, "scaffold", "running");
    await updateJob(jobId, {
      partialPrototype: scaffold,
      "progress.message": "Scaffold preview ready",
      "progress.phase": "scaffold",
    });
    jobDoc = await setChunkStatus(jobDoc, "scaffold", "done");

    if (await isJobCancelled(jobId)) return;

    let structure = initialStructure;
    let structureFromFallback = true;
    let structureParsed = {};

    const skipStructureAI = stories.length <= STRUCTURE_SKIP_THRESHOLD && !job.prototypePrompt?.trim();
    if (!skipStructureAI) {
      await setChunkStatus(jobDoc, "structure", "running", {
        progressPatch: { "progress.phase": "structure", "progress.message": "Refining screen map…" },
      });

      const storySummary = summarizeStoriesForAI(stories);
      const storyDerived = isStoryDerivedStructure(initialStructure);
      const structureSystemPrompt = `You are a senior UX architect. Design an appropriate screen map for a multi-screen application. Return ONLY valid JSON.`;
      const structureRules = storyDerived
        ? `Rules:
- Design 3-12 logical screens for this ${domain} application — merge related user stories into cohesive screens. Prefer grouping stories that share the same "feature" value into the same screen or feature area.
- Create meaningful screen ids (e.g. "screen-dashboard", "screen-patient-intake") and short nav labels.
- Map ALL user stories. Use exact story id strings in mappedStoryIds.
- Screen titles MUST be polished product screen names — NEVER raw user story text ("As a customer I want…").
- Each screen MUST include a features array (2-5 short capability bullets).
- Match the application domain (${domain}) and product brief.
- Do NOT include html, css, or js.`
        : `Rules:
- Keep the same ${initialStructure.screens?.length || 0} screens with the SAME ids from the current screen map.
- Map ALL user stories. Use exact story id strings in mappedStoryIds.
- navigation MUST be an array of objects with screenId and short label — NEVER user story text.
- Screen titles MUST match the product brief — NOT "As a customer I want…".
- Each screen MUST include a features array (2-5 short capability bullets, NOT full user story sentences).
- Match the application domain (${domain}).
- Do NOT include html, css, or js.`;

      const structureUserPrompt = `Project: "${project.name}"
Application domain: ${domain}
User Stories (${stories.length}):
${JSON.stringify(storySummary)}
${brief}

Current screen map:
${JSON.stringify(compactStructureForAI(initialStructure))}

Return JSON:
{
  "name": "Application name",
  "description": "Brief description",
  "structure": {
    "appName": "...",
    "summary": "...",
    "userFlow": "...",
    "navigation": [{ "id": "nav-screen-home", "label": "Home", "screenId": "screen-home" }],
    "screens": [{
      "id": "screen-home",
      "title": "Screen title",
      "description": "What this screen does",
      "features": ["Feature one", "Feature two"],
      "mappedStoryIds": ["exact-story-id"]
    }]
  }
}

${structureRules}`;

      try {
        structureParsed = await parseAIWithRetries(
          structureSystemPrompt,
          structureUserPrompt,
          withJobSelection(jobDoc.aiSelection, getStructureAIOptions),
          1
        );
        if (isValidStructure(structureParsed.structure) && !isStoryDerivedStructure(structureParsed.structure)) {
          structure = normalizeStructureAfterAI(structureParsed.structure, initialStructure, stories);
          structure.theme = theme;
          structureFromFallback = false;
          const screens = structure.screens || [];
          const preserved = (jobDoc.chunks || []).filter(
            (c) => c.phase === "scaffold" || c.phase === "structure"
          );
          const screenChunkEntries = screens.map((screen, index) => ({
            id: `screen-${screen.id}`,
            label: `Screen ${index + 1}: ${screen.title || screen.id}`,
            phase: "screen",
            screenId: screen.id,
            screenIndex: index,
            status: "pending",
          }));
          const updatedChunks = [
            ...preserved.map((c) => (c.toObject ? c.toObject() : c)),
            ...screenChunkEntries,
            { id: "assemble", label: "Assembling final prototype", phase: "assemble", status: "pending" },
          ];
          await updateJob(jobId, {
            structure,
            chunks: updatedChunks,
            "progress.totalChunks": updatedChunks.length,
          });
          jobDoc = await PrototypeJob.findById(jobId);
        }
      } catch (err) {
        console.warn("Structure refine failed, keeping deterministic map:", err.message);
      }

      jobDoc = await setChunkStatus(jobDoc, "structure", "done");
    } else {
      jobDoc = await setChunkStatus(jobDoc, "structure", "skipped", {
        progressPatch: { "progress.message": "Using deterministic screen map" },
      });
    }

    if (await isJobCancelled(jobId)) return;

    structure = normalizeStructureAfterAI(structure, initialStructure, stories);
    structure.theme = theme;

    let shell = buildScaffoldFromStructure(structure, { domain, theme });
    await updateJob(jobId, {
      partialPrototype: shell,
      structure,
      structureFromFallback,
    });
    jobDoc = await PrototypeJob.findById(jobId);

    const screenChunks = [];
    const concurrency = getPrototypeScreenConcurrency();

    const screenChunkDefs = (jobDoc.chunks || []).filter((c) => c.phase === "screen");

    await runPool(screenChunkDefs, concurrency, async (chunkDef) => {
      if (await isJobCancelled(jobId)) return null;

      const screenId = resolveScreenId(chunkDef);
      const screen = structure.screens.find((s) => s.id === screenId);
      if (!screen) {
        const freshJob = await PrototypeJob.findById(jobId);
        await setChunkStatus(freshJob, chunkDef.id, "failed", { error: `Screen not found: ${screenId}` });
        return null;
      }

      const freshJob = await PrototypeJob.findById(jobId);
      await setChunkStatus(freshJob, chunkDef.id, "running", {
        progressPatch: {
          "progress.phase": "screen",
          "progress.message": `Enriching: ${screen.title}`,
        },
      });

      const screenIndex = structure.screens.indexOf(screen);
      const result = await generateScreenHtml(
        screen, screenIndex, stories, structure, brief, project.name, domain, theme, job.aiSelection
      );

      screenChunks.push(result);

      const ordered = orderScreenChunks(structure, screenChunks);
      const partialPrototype = rebuildPartialFromChunks(structure, ordered, shell);

      const updated = await PrototypeJob.findById(jobId);
      await setChunkStatus(updated, chunkDef.id, "done", {
        usedScaffold: result.usedScaffold,
        progressPatch: {
          "progress.message": `Completed: ${screen.title}`,
        },
      });

      await updateJob(jobId, {
        screenChunks: ordered,
        partialPrototype,
      });

      return result;
    });

    if (await isJobCancelled(jobId)) return;

    const latestJob = await PrototypeJob.findById(jobId);
    await setChunkStatus(latestJob, "assemble", "running", {
      progressPatch: { "progress.phase": "assemble", "progress.message": "Assembling final prototype…" },
    });

    const finalJob = await PrototypeJob.findById(jobId);
    const orderedChunks = orderScreenChunks(
      structure,
      finalJob?.screenChunks?.length ? finalJob.screenChunks : screenChunks
    );
    const assembled = assemblePrototypeFromChunks(structure, orderedChunks, shell, theme);
    const usedScaffold = assembled.usedScaffold || structureFromFallback;
    const name = defaultPrototypeName(stories, project.name, job.customName);

    const appPrototype = {
      html: assembled.html,
      css: assembled.css,
      js: assembled.js,
      fullDocument: assembled.fullDocument,
    };

    const result = {
      projectId: project._id,
      name: structureParsed.name || name,
      description: structureParsed.description || structure.summary || "",
      storyIds: stories.map((s) => s._id),
      structure,
      appPrototype,
      prototypePrompt: job.prototypePrompt?.trim() || "",
      usedScaffold,
      structureFromFallback,
      isMerged: false,
    };

    await setChunkStatus(finalJob, "assemble", "done");
    await updateJob(jobId, {
      status: "completed",
      result,
      partialPrototype: appPrototype,
      usedScaffold,
      structureFromFallback,
      "progress.percent": 100,
      "progress.phase": "completed",
      "progress.message": "Prototype ready",
    });

    console.log(`Generate job ${jobId} completed — ${stories.length} stories, ${orderedChunks.length}/${structure.screens?.length || 0} screens enriched`);
  } catch (err) {
    console.error(`Generate job ${jobId} failed:`, err.message);
    await updateJob(jobId, {
      status: "failed",
      error: getErrorMessage(err),
      "progress.message": getErrorMessage(err),
    });
  } finally {
    activeJobs.delete(jobId);
  }
};

export const runMergeJob = async (jobId) => {
  if (activeJobs.has(jobId)) return;
  activeJobs.add(jobId);

  try {
    const job = await PrototypeJob.findById(jobId);
    if (!job || job.cancelled) return;

    await updateJob(jobId, { status: "running", "progress.phase": "scaffold", "progress.message": "Merging structures…" });

    const project = await Project.findById(job.projectId);
    if (!project) throw new Error("Project not found");

    const protos = await ApplicationPrototype.find({
      _id: { $in: job.prototypeIds },
      projectId: job.projectId,
    });

    if (protos.length < 2) throw new Error("Could not find selected prototypes");

    const mergedStructure = mergeStructures(
      protos.map((p) => p.structure),
      protos.map((p) => p.name)
    );

    const screens = mergedStructure.screens || [];
    const chunks = [
      { id: "scaffold", label: "Building merged scaffold", phase: "scaffold" },
      ...screens.map((screen, index) => ({
        id: `screen-${screen.id}`,
        label: `Merge screen ${index + 1}: ${screen.title || screen.id}`,
        phase: "screen",
        screenId: screen.id,
        screenIndex: index,
      })),
      { id: "assemble", label: "Assembling merged prototype", phase: "assemble" },
    ];

    await updateJob(jobId, {
      chunks: chunks.map((c) => ({ ...c, status: "pending" })),
      structure: mergedStructure,
      "progress.totalChunks": chunks.length,
    });

    let jobDoc = await PrototypeJob.findById(jobId);
    const domain = inferApplicationDomain(job.mergePrompt || "", [], mergedStructure.appName || project.name);
    const sourceTheme = protos.find((p) => p.structure?.theme)?.structure?.theme;
    const theme = normalizeTheme(sourceTheme || {}, heuristicTheme(job.mergePrompt || "", mergedStructure.appName || project.name));
    mergedStructure.theme = theme;
    const scaffold = buildScaffoldFromStructure(mergedStructure, { domain, theme });

    await setChunkStatus(jobDoc, "scaffold", "running");
    await updateJob(jobId, { partialPrototype: scaffold });
    jobDoc = await setChunkStatus(jobDoc, "scaffold", "done");

    if (await isJobCancelled(jobId)) return;

    const brief = buildCustomPromptBlock(job.mergePrompt);
    const shell = scaffold;
    const screenChunks = [];
    const concurrency = getPrototypeScreenConcurrency();

    const sourceByScreen = new Map();
    protos.forEach((proto, pIndex) => {
      (proto.structure?.screens || []).forEach((screen) => {
        sourceByScreen.set(`merge-p${pIndex}-${screen.id}`, {
          html: truncateCodeForAI(proto.prototype?.html, 2000),
          css: truncateCodeForAI(proto.prototype?.css, 800),
          partName: proto.name,
        });
      });
    });

    const screenChunkDefs = chunks.filter((c) => c.phase === "screen");

    await runPool(screenChunkDefs, concurrency, async (chunkDef) => {
      if (await isJobCancelled(jobId)) return null;

      const screenId = resolveScreenId(chunkDef);
      const screen = screens.find((s) => s.id === screenId);
      if (!screen) return null;

      const freshJob = await PrototypeJob.findById(jobId);
      await setChunkStatus(freshJob, chunkDef.id, "running", {
        progressPatch: {
          "progress.phase": "screen",
          "progress.message": `Merging: ${screen.title}`,
        },
      });

      const source = sourceByScreen.get(screen.id) || {};
      const screenIndex = screens.indexOf(screen);

      const systemPrompt = `You are a senior frontend developer. Refactor existing prototype HTML into ONE screen section for a unified merged app. Return ONLY valid JSON: html, css, js.`;
      const userPrompt = `Merged app screen: "${screen.title}"
Screen id: ${screen.id}
${brief}

Source HTML snippet from "${source.partName || "part"}":
${source.html || "(no source)"}

Return JSON:
{
  "html": "<section class=\\"screen\\" data-screen=\\"${screen.id}\\">...</section>",
  "css": "",
  "js": ""
}

Rules:
- Return ONLY one <section data-screen="${screen.id}"> element.
- Reuse UI patterns from source code. Unify styling with a modern cohesive look.`;

      let result;
      try {
        const parsed = await parseAIWithRetries(systemPrompt, userPrompt, withJobSelection(job.aiSelection, getScreenAIOptions), 1);
        const html = parsed.html || "";
        if (html.includes("section") || html.includes("data-screen")) {
          result = { screenId: screen.id, html, css: parsed.css || "", js: parsed.js || "", usedScaffold: false };
        } else {
          throw new Error("Invalid screen HTML");
        }
      } catch {
        result = {
          screenId: screen.id,
          html: buildRichScreenScaffold(screen, screenIndex, { domain }),
          css: "",
          js: "",
          usedScaffold: true,
        };
      }

      screenChunks.push(result);

      const ordered = orderScreenChunks(mergedStructure, screenChunks);
      const partialPrototype = rebuildPartialFromChunks(mergedStructure, ordered, shell);

      const updated = await PrototypeJob.findById(jobId);
      await setChunkStatus(updated, chunkDef.id, "done", { usedScaffold: result.usedScaffold });
      await updateJob(jobId, { screenChunks: ordered, partialPrototype });

      return result;
    });

    if (await isJobCancelled(jobId)) return;

    const latestJob = await PrototypeJob.findById(jobId);
    await setChunkStatus(latestJob, "assemble", "running");

    const mergeFinalJob = await PrototypeJob.findById(jobId);
    const orderedMergeChunks = orderScreenChunks(
      mergedStructure,
      mergeFinalJob?.screenChunks?.length ? mergeFinalJob.screenChunks : screenChunks
    );
    const assembled = assemblePrototypeFromChunks(mergedStructure, orderedMergeChunks, shell, theme);
    const allStoryIds = [...new Set(protos.flatMap((p) => (p.storyIds || []).map(String)))];

    const appPrototype = {
      html: assembled.html,
      css: assembled.css,
      js: assembled.js,
      fullDocument: assembled.fullDocument,
    };

    const result = {
      projectId: project._id,
      name: job.customName?.trim() || `${project.name} — Merged App`,
      description: `Merged from: ${protos.map((p) => p.name).join(", ")}`,
      storyIds: allStoryIds,
      structure: mergedStructure,
      appPrototype,
      prototypePrompt: job.mergePrompt?.trim() || "",
      usedScaffold: assembled.usedScaffold,
      structureFromFallback: false,
      isMerged: true,
      mergedFromIds: protos.map((p) => p._id),
    };

    const finalJob = await PrototypeJob.findById(jobId);
    await setChunkStatus(finalJob, "assemble", "done");
    await updateJob(jobId, {
      status: "completed",
      result,
      partialPrototype: appPrototype,
      usedScaffold: assembled.usedScaffold,
      "progress.percent": 100,
      "progress.phase": "completed",
      "progress.message": "Merge complete",
    });
  } catch (err) {
    console.error(`Merge job ${jobId} failed:`, err.message);
    await updateJob(jobId, {
      status: "failed",
      error: getErrorMessage(err),
      "progress.message": getErrorMessage(err),
    });
  } finally {
    activeJobs.delete(jobId);
  }
};

export const startGenerateJob = (jobId) => {
  setImmediate(() => runGenerateJob(jobId));
};

const buildUpdatePromptBlock = (prompt) => {
  const text = String(prompt || "").trim();
  if (!text) return "";
  return `

=== USER UPDATE REQUEST (apply these changes to the prototype) ===
${text}
=== END UPDATE REQUEST ===`;
};

const updateScreenHtml = async (screen, screenIndex, existingHtml, structure, updateBrief, originalBrief, domain = "general", theme = null, aiSelection = null) => {
  const screenType = screen.screenType || detectScreenType(screen);
  const screenRole = screen.role || detectScreenRole(screen);
  const designGuide = getDesignSystemPrompt(screenType, screenRole, domain, theme);

  const systemPrompt = `You are a senior product designer updating a production-quality HTML prototype screen.
Return ONLY valid JSON with keys: html, css, js. No markdown.`;

  const userPrompt = `Application: "${structure.appName || "Application"}"
Domain: ${domain}
Screen: "${screen.title}" (${screen.id})
Screen type: ${screenType}
${originalBrief}
${updateBrief}

${designGuide}

Current screen HTML:
${truncateCodeForAI(existingHtml, 4500) || "(empty — build a polished screen from scratch)"}

Return JSON:
{
  "html": "<section class=\\"screen\\" data-screen=\\"${screen.id}\\">...</section>",
  "css": "",
  "js": ""
}

Rules:
- Apply the user's update request while keeping investor-demo quality UI appropriate for the ${domain} domain.
- Use inline SVG icons and realistic domain-specific sample data.
- Return ONLY one <section data-screen="${screen.id}"> element${screenIndex === 0 ? ' with class "active"' : ""}.
- NEVER show raw user story text — only real UI components (forms, grids, tables, wizards).
- Preserve screen id and navigation compatibility.
- css: prefer empty; if needed, scope under [data-screen="${screen.id}"] only.`;

  try {
    const parsed = await parseAIWithRetries(systemPrompt, userPrompt, withJobSelection(aiSelection, getScreenAIOptions), 2);
    const html = parsed.html || "";
    const css = parsed.css || "";
    const js = parsed.js || "";
    if ((html.includes("data-screen") || html.includes("<section")) && !isWeakScreenHtml(html, css)) {
      return { screenId: screen.id, html, css, js, usedScaffold: false };
    }
  } catch (err) {
    console.warn(`Update screen ${screen.id} AI failed:`, err.message);
  }

  if (existingHtml && !isWeakScreenHtml(existingHtml)) {
    return { screenId: screen.id, html: existingHtml, css: "", js: "", usedScaffold: true };
  }

  return {
    screenId: screen.id,
    html: buildRichScreenScaffold(screen, screenIndex, { domain }),
    css: "",
    js: "",
    usedScaffold: true,
  };
};

export const runUpdateJob = async (jobId) => {
  if (activeJobs.has(jobId)) return;
  activeJobs.add(jobId);

  try {
    const job = await PrototypeJob.findById(jobId);
    if (!job || job.cancelled) return;

    const source = job.sourceSnapshot || {};
    const normalized = normalizeSavedPrototype(source.prototype);
    if (!normalized.html && !normalized.fullDocument) {
      throw new Error("Source prototype has no preview code");
    }

    const structure = source.structure || {};
    const screens = structure.screens || [];
    if (screens.length === 0) throw new Error("Source prototype has no screen map");

    const shellHtml = normalized.html || normalized.fullDocument;
    const shell = {
      html: shellHtml,
      css: normalized.css || "",
      js: normalized.js || "",
      fullDocument: normalized.fullDocument || "",
    };

    const chunks = [
      { id: "scaffold", label: "Loading saved prototype", phase: "scaffold" },
      ...screens.map((screen, index) => ({
        id: `screen-${screen.id}`,
        label: `Updating: ${screen.title || screen.id}`,
        phase: "screen",
        screenId: screen.id,
        screenIndex: index,
      })),
      { id: "assemble", label: "Assembling updated prototype", phase: "assemble" },
    ];

    await updateJob(jobId, {
      status: "running",
      structure,
      chunks: chunks.map((c) => ({ ...c, status: "pending" })),
      partialPrototype: shell,
      "progress.totalChunks": chunks.length,
      "progress.phase": "scaffold",
      "progress.message": "Applying your changes…",
    });

    let jobDoc = await PrototypeJob.findById(jobId);
    await setChunkStatus(jobDoc, "scaffold", "done");

    if (await isJobCancelled(jobId)) return;

    const updateBrief = buildUpdatePromptBlock(job.updatePrompt);
    const originalBrief = buildCustomPromptBlock(source.prototypePrompt);
    const domain = inferApplicationDomain(source.prototypePrompt || "", [], structure.appName || "");
    const theme = normalizeTheme(structure.theme || {}, heuristicTheme(source.prototypePrompt || "", structure.appName || ""));
    structure.theme = theme;
    const screenChunks = [];
    const concurrency = getPrototypeScreenConcurrency();
    const screenChunkDefs = chunks.filter((c) => c.phase === "screen");

    await runPool(screenChunkDefs, concurrency, async (chunkDef) => {
      if (await isJobCancelled(jobId)) return null;

      const screenId = resolveScreenId(chunkDef);
      const screen = screens.find((s) => s.id === screenId);
      if (!screen) return null;

      const freshJob = await PrototypeJob.findById(jobId);
      await setChunkStatus(freshJob, chunkDef.id, "running", {
        progressPatch: {
          "progress.phase": "screen",
          "progress.message": `Updating: ${screen.title}`,
        },
      });

      const screenIndex = screens.indexOf(screen);
      const existingHtml = extractScreenHtml(shellHtml, screen.id)
        || buildRichScreenScaffold(screen, screenIndex, { domain });

      const result = await updateScreenHtml(
        screen,
        screenIndex,
        existingHtml,
        structure,
        updateBrief,
        originalBrief,
        domain,
        theme,
        job.aiSelection
      );

      screenChunks.push(result);

      const ordered = orderScreenChunks(structure, screenChunks);
      const partialPrototype = rebuildPartialFromChunks(structure, ordered, shell);

      const updated = await PrototypeJob.findById(jobId);
      await setChunkStatus(updated, chunkDef.id, "done", {
        usedScaffold: result.usedScaffold,
        progressPatch: { "progress.message": `Updated: ${screen.title}` },
      });
      await updateJob(jobId, { screenChunks: ordered, partialPrototype });

      return result;
    });

    if (await isJobCancelled(jobId)) return;

    const latestJob = await PrototypeJob.findById(jobId);
    await setChunkStatus(latestJob, "assemble", "running", {
      progressPatch: { "progress.phase": "assemble", "progress.message": "Assembling updated prototype…" },
    });

    const finalJob = await PrototypeJob.findById(jobId);
    const orderedChunks = orderScreenChunks(
      structure,
      finalJob?.screenChunks?.length ? finalJob.screenChunks : screenChunks
    );
    const assembled = assemblePrototypeFromChunks(structure, orderedChunks, shell, theme);

    const appPrototype = {
      html: assembled.html,
      css: assembled.css,
      js: assembled.js,
      fullDocument: assembled.fullDocument,
    };

    const result = {
      projectId: job.projectId,
      _id: job.sourcePrototypeId,
      name: job.customName?.trim() || source.name || "Updated Prototype",
      description: source.description || structure.summary || "",
      storyIds: source.storyIds || [],
      structure,
      appPrototype,
      prototypePrompt: source.prototypePrompt || "",
      usedScaffold: assembled.usedScaffold,
      structureFromFallback: Boolean(source.structureFromFallback),
      isMerged: Boolean(source.isMerged),
      mergedFromIds: source.mergedFromIds || [],
    };

    await setChunkStatus(finalJob, "assemble", "done");
    await updateJob(jobId, {
      status: "completed",
      result,
      partialPrototype: appPrototype,
      usedScaffold: assembled.usedScaffold,
      "progress.percent": 100,
      "progress.phase": "completed",
      "progress.message": "Prototype updated",
    });
  } catch (err) {
    console.error(`Update job ${jobId} failed:`, err.message);
    await updateJob(jobId, {
      status: "failed",
      error: getErrorMessage(err),
      "progress.message": getErrorMessage(err),
    });
  } finally {
    activeJobs.delete(jobId);
  }
};

export const startMergeJob = (jobId) => {
  setImmediate(() => runMergeJob(jobId));
};

export const startUpdateJob = (jobId) => {
  setImmediate(() => runUpdateJob(jobId));
};

export const markStaleJobsFailed = async () => {
  const stale = await PrototypeJob.updateMany(
    { status: { $in: ["queued", "running"] }, updatedAt: { $lt: new Date(Date.now() - 3600000) } },
    { status: "failed", error: "Job interrupted — server restarted or timed out" }
  );
  if (stale.modifiedCount > 0) {
    console.log(`Marked ${stale.modifiedCount} stale prototype jobs as failed`);
  }
};
