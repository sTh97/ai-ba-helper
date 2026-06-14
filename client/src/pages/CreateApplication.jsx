import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios, { pollWithTimeout } from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmButton from "../components/ConfirmButton";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s", boxSizing: "border-box",
};

const focusHandlers = {
  onFocus: (e) => (e.target.style.borderColor = "var(--accent)"),
  onBlur: (e) => (e.target.style.borderColor = "var(--border)"),
};

const PROMPT_SUGGESTIONS = [
  "HR employee portal — leave requests, onboarding checklist, org directory, payroll summary dashboard.",
  "Healthcare patient app — appointment booking, medical records, provider dashboard, intake forms.",
  "Project management tool — kanban board, sprint backlog, task detail, team assignments, burndown chart.",
  "CRM sales pipeline — lead list, contact profile, deal stages, activity timeline, support tickets.",
  "Logistics fleet tracker — shipment list, live dispatch map, warehouse inventory, delivery status board.",
  "E-commerce store (only if needed) — product catalog, checkout wizard, inventory dashboard, admin product manager.",
];

const MERGE_SUGGESTIONS = [
  "Use one sidebar for all admin areas; keep end-user screens in the top nav.",
  "Keep each part's screens but unify colors, typography, and button styles.",
  "Put auth flows in the public role; tuck admin tools under a separate section.",
  "Mobile-friendly: collapse sidebar into a top hamburger menu.",
];

const UPDATE_SUGGESTIONS = [
  "Add a prominent search bar with auto-suggestions on the home screen.",
  "Make catalog filters sticky with clearer size, color, and price controls.",
  "Add multi-step progress bars to checkout and product creation wizards.",
  "Show variant-specific stock messages on the product detail page.",
  "Enhance the inventory dashboard with low-stock alert badges and override actions.",
  "Add OTP verification and password reset flows to the account hub.",
];

const storyPreview = (story) => story.correctedText || story.originalText || "";

const ensurePrototypeForSave = (proto) => {
  if (!proto) return null;
  const html = proto.html || "";
  const css = proto.css || "";
  const js = proto.js || "";
  let fullDocument = proto.fullDocument || "";
  if (!fullDocument && html) {
    fullDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Prototype</title>
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}<\/script>
</body>
</html>`;
  }
  return { html, css, js, fullDocument };
};

const normalizeLoadedPrototype = (proto) => ensurePrototypeForSave(proto) || proto;

const CreateApplication = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const canCreate = hasPermission("applications", "create");
  const canUpdate = hasPermission("applications", "update");
  const canDelete = hasPermission("applications", "delete");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [stories, setStories] = useState([]);
  const [savedPrototypes, setSavedPrototypes] = useState([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [generated, setGenerated] = useState(null);
  const [activeScreen, setActiveScreen] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [codeTab, setCodeTab] = useState("html");
  const [copied, setCopied] = useState(false);

  const [selectedStoryIds, setSelectedStoryIds] = useState(() => new Set());
  const [mergeSelectedIds, setMergeSelectedIds] = useState(() => new Set());
  const [showBriefDialog, setShowBriefDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [prototypePrompt, setPrototypePrompt] = useState("");
  const [mergePrompt, setMergePrompt] = useState("");
  const [updatePrompt, setUpdatePrompt] = useState("");
  const [refiningPrompt, setRefiningPrompt] = useState(false);
  const [merging, setMerging] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [promptRefined, setPromptRefined] = useState(false);
  const [prototypeName, setPrototypeName] = useState("");
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobProgress, setJobProgress] = useState(null);
  const [jobChunks, setJobChunks] = useState([]);
  const pollCancelledRef = useRef(false);

  useEffect(() => {
    axios.get("/projects").then((res) => setProjects(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setStories([]);
      setSavedPrototypes([]);
      setGenerated(null);
      return;
    }

    setLoadingStories(true);
    setGenerated(null);
    setPrototypePrompt("");
    setPromptRefined(false);
    setSelectedStoryIds(new Set());
    setMergeSelectedIds(new Set());
    setPrototypeName("");
    setActiveJobId(null);
    setJobProgress(null);
    setJobChunks([]);
    Promise.all([
      axios.get(`/applications/project/${selectedProjectId}/stories`),
      axios.get(`/applications?projectId=${selectedProjectId}`),
    ])
      .then(([storiesRes, prototypesRes]) => {
        const loaded = storiesRes.data.stories || [];
        setStories(loaded);
        setSelectedStoryIds(new Set(loaded.map((s) => s._id)));
        setSavedPrototypes(prototypesRes.data || []);
      })
      .catch(() => showToast("Failed to load project data", "error"))
      .finally(() => setLoadingStories(false));
  }, [selectedProjectId]);

  const selectedStories = stories.filter((s) => selectedStoryIds.has(s._id));
  const selectedCount = selectedStoryIds.size;
  const mergeableProtos = savedPrototypes.filter((p) => p.hasCode !== false);
  const mergeSelectedCount = mergeSelectedIds.size;

  const featureGroups = useMemo(() => {
    const map = new Map();
    for (const s of stories) {
      const key = (s.feature || "").trim() || "Unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s._id);
    }
    return Array.from(map.entries()).map(([feature, ids]) => ({ feature, ids }));
  }, [stories]);

  const hasFeatures = featureGroups.some((g) => g.feature !== "Unassigned");

  const toggleFeature = (ids) => {
    const allSelected = ids.every((id) => selectedStoryIds.has(id));
    setSelectedStoryIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleStory = (id) => {
    setSelectedStoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllStories = () => setSelectedStoryIds(new Set(stories.map((s) => s._id)));
  const clearStorySelection = () => setSelectedStoryIds(new Set());

  const toggleMergeSelect = (id) => {
    setMergeSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openBriefDialog = () => {
    if (!selectedProjectId || stories.length === 0) return;
    if (selectedCount === 0) {
      showToast("Select at least one user story to generate a prototype.", "error");
      return;
    }
    setShowBriefDialog(true);
  };

  const handleRefinePrompt = async () => {
    if (!prototypePrompt.trim()) {
      showToast("Write a rough description first, then refine it with AI.", "error");
      return;
    }
    setRefiningPrompt(true);
    try {
      const res = await axios.post("/applications/prompt/refine", {
        projectId: selectedProjectId,
        draftPrompt: prototypePrompt,
        storyIds: Array.from(selectedStoryIds),
      });
      setPrototypePrompt(res.data.refinedPrompt || prototypePrompt);
      setPromptRefined(true);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to refine prompt";
      showToast(msg, "error");
    } finally {
      setRefiningPrompt(false);
    }
  };

  const applyJobUpdate = useCallback((data) => {
    setJobProgress(data.progress || null);
    setJobChunks(data.chunks || []);

    if (data.partialPrototype?.fullDocument || data.partialPrototype?.html) {
      setGenerated((prev) => ({
        ...prev,
        projectId: prev?.projectId || selectedProjectId,
        name: prev?.name || prototypeName || "Building prototype…",
        structure: data.structure || prev?.structure,
        prototype: normalizeLoadedPrototype(data.partialPrototype),
        prototypePrompt: prev?.prototypePrompt || prototypePrompt,
      }));
      if (data.structure?.screens?.[0]?.id) {
        setActiveScreen((prev) => prev || data.structure.screens[0].id);
      }
    }

    if (data.status === "completed" && data.result) {
      const { usedScaffold, structureFromFallback, appPrototype, prototype: resultProto, ...result } = data.result;
      const prototype = normalizeLoadedPrototype(resultProto || appPrototype || data.partialPrototype);
      setGenerated((prev) => ({
        ...result,
        _id: result._id || prev?._id,
        prototype,
        usedScaffold,
        structureFromFallback,
      }));
      setPrototypeName(result.name || "");
      setPrototypePrompt(result.prototypePrompt || prototypePrompt);
      setActiveScreen(result.structure?.screens?.[0]?.id || null);
      setShowCode(false);
      setCodeTab("html");
      setActiveJobId(null);
      setJobChunks([]);
      setJobProgress(null);
      setGenerating(false);
      setMerging(false);
      setUpdating(false);
      if (data.type === "merge") setMergeSelectedIds(new Set());
      if (data.type === "update") {
        setShowUpdateDialog(false);
        setUpdatePrompt("");
      }
      return true;
    }

    if (data.status === "running" || data.status === "queued") {
      setGenerating(data.type === "generate");
      setMerging(data.type === "merge");
      setUpdating(data.type === "update");
    }

    if (data.status === "failed" || data.status === "cancelled") {
      showToast(data.error || `Prototype job ${data.status}`, "error");
      setActiveJobId(null);
      setGenerating(false);
      setMerging(false);
      setUpdating(false);
      return true;
    }

    return false;
  }, [selectedProjectId, prototypeName, prototypePrompt]);

  useEffect(() => {
    if (!activeJobId) return undefined;

    pollCancelledRef.current = false;

    const poll = async () => {
      if (pollCancelledRef.current) return;
      try {
        const res = await pollWithTimeout(`/applications/jobs/${activeJobId}`);
        if (pollCancelledRef.current) return;
        applyJobUpdate(res.data);
      } catch {
        if (!pollCancelledRef.current) {
          console.warn("Job poll failed, retrying…");
        }
      }
    };

    poll();
    const interval = setInterval(poll, 2000);

    return () => {
      pollCancelledRef.current = true;
      clearInterval(interval);
    };
  }, [activeJobId, applyJobUpdate]);

  const handleGenerate = async (promptOverride) => {
    if (!selectedProjectId || selectedCount === 0) return;
    const finalPrompt = (promptOverride ?? prototypePrompt).trim();

    setShowBriefDialog(false);
    setGenerating(true);
    setGenerated(null);
    setJobProgress(null);
    setJobChunks([]);
    setPrototypePrompt(finalPrompt);
    setPromptRefined(Boolean(finalPrompt));

    try {
      const res = await axios.post("/applications/generate", {
        projectId: selectedProjectId,
        prototypePrompt: finalPrompt,
        storyIds: Array.from(selectedStoryIds),
        name: prototypeName.trim() || undefined,
      }, { timeout: 15000 });

      setActiveJobId(res.data.jobId);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to start prototype generation";
      showToast(msg, "error");
      setGenerating(false);
    }
  };

  const handleUpdateApplication = async () => {
    if (!generated?.prototype || !updatePrompt.trim()) return;

    const normalized = ensurePrototypeForSave(generated.prototype);
    if (!normalized?.fullDocument && !normalized?.html) {
      showToast("Prototype preview code is missing. Generate or reload the prototype first.", "error");
      return;
    }

    setShowUpdateDialog(false);
    setUpdating(true);
    setJobProgress(null);
    setJobChunks([]);

    try {
      const res = await axios.post("/applications/update", {
        projectId: generated.projectId || selectedProjectId,
        prototypeId: generated._id || undefined,
        updatePrompt: updatePrompt.trim(),
        name: (prototypeName || generated.name || "").trim() || undefined,
        prototype: normalized,
        structure: generated.structure,
        storyIds: generated.storyIds,
        prototypePrompt: generated.prototypePrompt || prototypePrompt || "",
      }, { timeout: 15000 });

      setActiveJobId(res.data.jobId);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to start prototype update";
      showToast(msg, "error");
      setUpdating(false);
      setShowUpdateDialog(true);
    }
  };

  const handleMerge = async () => {
    if (mergeSelectedCount < 2) {
      showToast("Select at least 2 saved prototypes with code to merge.", "error");
      return;
    }
    setShowMergeDialog(false);
    setMerging(true);
    setGenerated(null);
    setJobProgress(null);
    setJobChunks([]);

    try {
      const res = await axios.post("/applications/merge", {
        projectId: selectedProjectId,
        prototypeIds: Array.from(mergeSelectedIds),
        mergePrompt: mergePrompt.trim(),
        name: prototypeName.trim() || undefined,
      }, { timeout: 15000 });

      setActiveJobId(res.data.jobId);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to start merge";
      showToast(msg, "error");
      setMerging(false);
    }
  };

  const buildSavePayload = () => ({
    projectId: generated.projectId,
    name: (prototypeName || generated.name || "Untitled Prototype").trim(),
    description: generated.description,
    storyIds: generated.storyIds,
    structure: generated.structure,
    prototype: ensurePrototypeForSave(generated.prototype),
    usedScaffold: Boolean(generated.usedScaffold),
    structureFromFallback: Boolean(generated.structureFromFallback),
    prototypePrompt: generated.prototypePrompt || prototypePrompt || "",
    isMerged: Boolean(generated.isMerged),
    mergedFromIds: generated.mergedFromIds || [],
  });

  const handleSave = async () => {
    if (!generated?.prototype) {
      showToast("Generate a prototype before saving.", "error");
      return;
    }
    if (!generated.prototype.fullDocument && !generated.prototype.html) {
      showToast("Prototype code is missing. Regenerate the prototype and try again.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = buildSavePayload();
      const isUpdate = Boolean(generated._id && canUpdate);
      let saved;

      if (isUpdate) {
        const res = await axios.put(`/applications/${generated._id}`, payload);
        saved = res.data;
      } else {
        const res = await axios.post("/applications", payload);
        saved = res.data;
      }

      setGenerated((prev) => ({
        ...prev,
        _id: saved._id,
        prototype: normalizeLoadedPrototype(saved.prototype || prev.prototype),
        structure: saved.structure || prev.structure,
        usedScaffold: saved.usedScaffold,
        structureFromFallback: saved.structureFromFallback,
      }));

      const listRes = await axios.get(`/applications?projectId=${selectedProjectId}`);
      setSavedPrototypes(listRes.data);
      showToast(isUpdate ? "Prototype updated successfully" : "Prototype saved successfully");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save prototype";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const loadSaved = async (proto) => {
    try {
      const res = await axios.get(`/applications/${proto._id}`);
      const full = res.data;
      setGenerated({
        _id: full._id,
        projectId: full.projectId?._id || full.projectId,
        name: full.name,
        description: full.description,
        storyIds: full.storyIds,
        structure: full.structure,
        prototype: normalizeLoadedPrototype(full.prototype),
        usedScaffold: full.usedScaffold,
        structureFromFallback: full.structureFromFallback,
        prototypePrompt: full.prototypePrompt || "",
        isMerged: full.isMerged,
        mergedFromIds: full.mergedFromIds,
      });
      setPrototypeName(full.name || "");
      setPrototypePrompt(full.prototypePrompt || "");
      setPromptRefined(Boolean(full.prototypePrompt));
      setActiveScreen(full.structure?.screens?.[0]?.id || null);
      setShowCode(false);
      setCodeTab("html");
    } catch {
      showToast("Failed to load saved prototype", "error");
    }
  };

  const handleDeleteSaved = async (id) => {
    try {
      await axios.delete(`/applications/${id}`);
      setSavedPrototypes((prev) => prev.filter((p) => p._id !== id));
      showToast("Prototype deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const screens = generated?.structure?.screens || [];

  const codeContent = generated?.prototype
    ? codeTab === "html"
      ? generated.prototype.html || ""
      : codeTab === "css"
        ? generated.prototype.css || ""
        : generated.prototype.js || ""
    : "";

  const copyPrototypeCode = () => {
    if (!generated?.prototype) return;
    const text = codeTab === "full"
      ? generated.prototype.fullDocument || ""
      : codeContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", margin: 0 }}>
          Create Application
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Generate a complete prototype in one click — the system builds it in chunks and shows live progress
        </p>
      </div>

      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
      }}>
        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
          Select Project *
        </label>
        <select
          style={{ ...inputStyle, cursor: "pointer", marginBottom: 16 }}
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          {...focusHandlers}
        >
          <option value="">— Choose a project —</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        {loadingStories ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading user stories…</div>
        ) : selectedProjectId && (
          <>
            <div style={{
              padding: "12px 16px", background: "var(--bg-elevated)",
              borderRadius: "var(--radius)", marginBottom: 12, fontSize: 13,
              display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>{stories.length}</strong>
                <span style={{ color: "var(--text-muted)" }}> user {stories.length === 1 ? "story" : "stories"} in project</span>
                {selectedCount > 0 && (
                  <span style={{ color: "var(--accent)", marginLeft: 8 }}>
                    · {selectedCount} selected
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={selectAllStories} style={chipBtnStyle}>Select all</button>
                <button type="button" onClick={clearStorySelection} style={chipBtnStyle}>Clear</button>
              </div>
            </div>

            {hasFeatures && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Select by feature
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {featureGroups.map(({ feature, ids }) => {
                    const allSelected = ids.length > 0 && ids.every((id) => selectedStoryIds.has(id));
                    return (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => toggleFeature(ids)}
                        style={{
                          padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: allSelected ? "var(--accent)" : "var(--bg-elevated)",
                          border: `1px solid ${allSelected ? "var(--accent)" : "var(--border)"}`,
                          color: allSelected ? "white" : "var(--text-secondary)",
                        }}
                      >
                        {feature} <span style={{ opacity: 0.7 }}>({ids.length})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {stories.length > 0 && (
              <div style={{ marginBottom: 16, maxHeight: 280, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                {stories.map((s) => {
                  const checked = selectedStoryIds.has(s._id);
                  const feature = (s.feature || "").trim();
                  return (
                    <label
                      key={s._id}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "10px 12px", borderBottom: "1px solid var(--border)",
                        fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
                        background: checked ? "var(--accent-soft)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStory(s._id)}
                        style={{ marginTop: 3, flexShrink: 0 }}
                      />
                      <span style={{ minWidth: 0 }}>
                        {feature && (
                          <span style={{
                            display: "inline-block", marginRight: 6, fontSize: 10, padding: "1px 7px",
                            borderRadius: 99, background: "var(--bg-surface)", color: "var(--accent)",
                            fontWeight: 600, verticalAlign: "middle",
                          }}>{feature}</span>
                        )}
                        {storyPreview(s)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {canCreate && stories.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <button
                  onClick={openBriefDialog}
                  disabled={generating || merging || selectedCount === 0}
                  style={{
                    padding: "10px 22px", borderRadius: "var(--radius)", border: "none",
                    background: (generating || selectedCount === 0) ? "var(--bg-elevated)" : "var(--accent)",
                    color: (generating || selectedCount === 0) ? "var(--text-muted)" : "white",
                    fontWeight: 600, fontSize: 13,
                    cursor: generating ? "wait" : selectedCount === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {generating
                    ? (jobProgress?.message || `Building prototype… (${jobProgress?.percent || 0}%)`)
                    : `✨ Generate Prototype (${selectedCount} ${selectedCount === 1 ? "story" : "stories"})`}
                </button>
                {prototypePrompt.trim() && !generating && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Brief ready{promptRefined ? " (refined)" : ""} — click to edit before generating
                  </span>
                )}
              </div>
            )}

            {selectedProjectId && stories.length === 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Add user stories to this project first before generating a prototype.
              </div>
            )}
          </>
        )}
      </div>

      {savedPrototypes.length > 0 && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, margin: 0, color: "var(--text-primary)" }}>
                Saved Prototypes
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>
                Select 2+ saved parts with code, then merge into one unified app
              </p>
            </div>
            {canCreate && mergeableProtos.length >= 2 && (
              <button
                onClick={() => {
                  if (mergeSelectedCount < 2) {
                    showToast("Check at least 2 prototypes to merge.", "error");
                    return;
                  }
                  setShowMergeDialog(true);
                }}
                disabled={merging || mergeSelectedCount < 2}
                style={{
                  padding: "8px 16px", borderRadius: "var(--radius)", border: "none",
                  background: merging || mergeSelectedCount < 2 ? "var(--bg-elevated)" : "var(--yellow)",
                  color: merging || mergeSelectedCount < 2 ? "var(--text-muted)" : "#0a0b0f",
                  fontWeight: 700, fontSize: 12, cursor: merging ? "wait" : "pointer",
                }}
              >
                {merging ? (jobProgress?.message || `Merging… (${jobProgress?.percent || 0}%)`) : `Merge ${mergeSelectedCount} selected`}
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {savedPrototypes.map((p) => {
              const canMerge = p.hasCode !== false;
              const mergeChecked = mergeSelectedIds.has(p._id);
              const storyCount = (p.storyIds || []).length;
              return (
                <div key={p._id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: "var(--radius)",
                  border: mergeChecked ? "1px solid var(--yellow)55" : "1px solid transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
                    {canCreate && canMerge && (
                      <input
                        type="checkbox"
                        checked={mergeChecked}
                        onChange={() => toggleMergeSelect(p._id)}
                        title="Select for merge"
                        style={{ marginTop: 4, flexShrink: 0 }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {new Date(p.updatedAt).toLocaleDateString()}
                        {storyCount > 0 && ` · ${storyCount} ${storyCount === 1 ? "story" : "stories"}`}
                        {p.isMerged && " · merged"}
                        {!canMerge && " · no code"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => loadSaved(p)} style={smallBtnStyle("accent")}>Open</button>
                    {canDelete && (
                      <ConfirmButton onConfirm={() => handleDeleteSaved(p._id)} label="Delete" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(generating || merging || updating) && jobChunks.length > 0 && (
        <JobProgressPanel progress={jobProgress} chunks={jobChunks} mode={updating ? "update" : merging ? "merge" : "generate"} />
      )}

      {generated && (
        <>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderLeft: "3px solid var(--accent)",
            borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Prototype name
                </label>
                <input
                  value={prototypeName || generated.name || ""}
                  onChange={(e) => setPrototypeName(e.target.value)}
                  placeholder="Name this prototype before saving"
                  style={{ ...inputStyle, fontSize: 16, fontWeight: 600, marginBottom: 8 }}
                  {...focusHandlers}
                />
                {generated.description && (
                  <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>{generated.description}</p>
                )}
                {generated.isMerged && (
                  <span style={{
                    display: "inline-block", marginTop: 8, fontSize: 11, padding: "3px 8px",
                    borderRadius: 99, background: "var(--yellow-soft)", color: "var(--yellow)",
                  }}>
                    Merged prototype
                  </span>
                )}
              </div>
              {(canCreate || (canUpdate && generated._id)) && (
                <button onClick={handleSave} disabled={saving || generating || merging || updating || activeJobId} style={{
                  padding: "8px 18px", borderRadius: "var(--radius)", border: "none",
                  background: "var(--green)", color: "#0a0b0f", fontWeight: 700, fontSize: 13,
                  cursor: saving ? "wait" : "pointer", flexShrink: 0,
                }}>
                  {saving ? "Saving…" : generated._id ? "Update Prototype" : "Save Prototype"}
                </button>
              )}
            </div>

            {generated.prototypePrompt?.trim() && (
              <div style={{
                marginBottom: 16, padding: "12px 14px", borderRadius: "var(--radius)",
                background: "var(--accent-soft)", border: "1px solid var(--accent)33",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <SectionTitle>Prototype Brief Used</SectionTitle>
                  {canCreate && (
                    <button
                      onClick={() => {
                        setPrototypePrompt(generated.prototypePrompt || "");
                        setPromptRefined(true);
                        setShowBriefDialog(true);
                      }}
                      style={smallBtnStyle("accent")}
                    >
                      Edit & Regenerate
                    </button>
                  )}
                </div>
                <pre style={{
                  margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit",
                  fontSize: 12, lineHeight: 1.55, color: "var(--text-secondary)",
                }}>
                  {generated.prototypePrompt}
                </pre>
              </div>
            )}

            {(generated.structureFromFallback || generated.usedScaffold) && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: "var(--radius)",
                background: "var(--yellow-soft, rgba(234,179,8,0.12))",
                border: "1px solid rgba(234,179,8,0.35)",
                fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
              }}>
                {generated.structureFromFallback && "Screen map was built directly from your user stories because AI structure mapping was incomplete. "}
                {generated.usedScaffold && "Prototype preview uses a reliable scaffold tied to those mapped stories. "}
                Regenerate to attempt a richer custom UI.
              </div>
            )}

            {generated.structure?.userFlow && (
              <div style={{ marginBottom: 16 }}>
                <SectionTitle>User Flow</SectionTitle>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  {generated.structure.userFlow}
                </p>
              </div>
            )}

            <SectionTitle>Screen Map — User Story Mapping</SectionTitle>
            {screens.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                No screens were mapped. Regenerate to rebuild from user stories.
              </div>
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {screens.map((screen) => (
                <div
                  key={screen.id}
                  onClick={() => setActiveScreen(screen.id)}
                  style={{
                    padding: "14px 16px", borderRadius: "var(--radius)",
                    border: `1px solid ${activeScreen === screen.id ? "var(--accent)" : "var(--border)"}`,
                    background: activeScreen === screen.id ? "var(--accent-soft)" : "var(--bg-elevated)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
                    {screen.title}
                  </div>
                  {screen.description && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{screen.description}</div>
                  )}
                  {(screen.mappedStoryTitles || []).length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Mapped Stories
                      </span>
                      <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--text-secondary)" }}>
                        {screen.mappedStoryTitles.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                  {(screen.features || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {screen.features.map((f, i) => (
                        <span key={i} style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 99,
                          background: "var(--bg-surface)", color: "var(--text-muted)",
                        }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {(generated.prototype?.fullDocument || generated.prototype?.html) && (
            <div style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderLeft: "3px solid var(--yellow)",
              borderRadius: "var(--radius-lg)", overflow: "hidden",
            }}>
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
              }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                  🧩 Interactive Prototype Preview
                </span>
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => setShowUpdateDialog(true)}
                    disabled={generating || merging || updating || activeJobId}
                    style={{
                      padding: "6px 14px", borderRadius: 7, border: "none",
                      background: updating ? "var(--bg-surface)" : "var(--accent)",
                      color: updating ? "var(--text-muted)" : "white",
                      fontSize: 12, fontWeight: 600, cursor: updating ? "wait" : "pointer",
                    }}
                  >
                    {updating ? "Updating…" : "✨ Update with AI"}
                  </button>
                )}
              </div>
              <div style={{ padding: 20 }}>
                <div style={{
                  border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
                  overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                }}>
                  <div style={{
                    background: "#1e1e2e", padding: "10px 14px",
                    display: "flex", alignItems: "center", gap: 10,
                    borderBottom: "1px solid #2d2d3d",
                  }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                        <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                      ))}
                    </div>
                    <div style={{
                      flex: 1, background: "#2a2a3c", borderRadius: 6,
                      padding: "5px 12px", fontSize: 11, color: "#8888a0",
                      fontFamily: "monospace", textAlign: "center",
                    }}>
                      prototype://{generated.name?.toLowerCase().replace(/\s+/g, "-") || "app"}
                    </div>
                  </div>
                  <iframe
                    title="Application Prototype"
                    srcDoc={generated.prototype.fullDocument || generated.prototype.html}
                    sandbox="allow-scripts"
                    style={{ width: "100%", height: 520, border: "none", background: "#fff", display: "block" }}
                  />
                </div>

                <button
                  onClick={() => setShowCode((prev) => !prev)}
                  style={{
                    marginTop: 12, padding: "6px 14px", borderRadius: 7,
                    background: "var(--yellow-soft)", border: "1px solid var(--yellow)33",
                    color: "var(--yellow)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  {showCode ? "Hide Code" : "View HTML / CSS / JS"}
                </button>

                {showCode && (
                  <div style={{ position: "relative", marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      {["html", "css", "js", "full"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setCodeTab(tab)}
                          style={{
                            padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                            textTransform: "uppercase",
                            background: codeTab === tab ? "var(--accent-soft)" : "var(--bg-elevated)",
                            border: `1px solid ${codeTab === tab ? "var(--accent)33" : "var(--border)"}`,
                            color: codeTab === tab ? "var(--accent)" : "var(--text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {tab === "full" ? "full html" : tab}
                        </button>
                      ))}
                    </div>
                    <pre style={{
                      background: "#0d1117", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", padding: "14px 16px",
                      overflowX: "auto", fontSize: 12, lineHeight: 1.6,
                      color: "#7ee787", margin: 0, maxHeight: 360,
                    }}>
                      <code>{codeTab === "full" ? generated.prototype.fullDocument : codeContent}</code>
                    </pre>
                    <button
                      onClick={copyPrototypeCode}
                      style={{
                        position: "absolute", top: 42, right: 10,
                        padding: "4px 10px", borderRadius: 6,
                        background: copied ? "var(--green-soft)" : "var(--bg-overlay)",
                        border: "1px solid var(--border)",
                        color: copied ? "var(--green)" : "var(--text-secondary)",
                        fontSize: 11, fontWeight: 500, cursor: "pointer",
                      }}
                    >
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showBriefDialog && (
        <PrototypeBriefDialog
          selectedCount={selectedCount}
          selectedStories={selectedStories}
          prototypePrompt={prototypePrompt}
          prototypeName={prototypeName}
          setPrototypeName={setPrototypeName}
          setPrototypePrompt={(value) => {
            setPrototypePrompt(value);
            setPromptRefined(false);
          }}
          promptRefined={promptRefined}
          refiningPrompt={refiningPrompt}
          generating={generating}
          onRefine={handleRefinePrompt}
          onGenerate={() => handleGenerate()}
          onClose={() => setShowBriefDialog(false)}
        />
      )}

      {showUpdateDialog && (
        <UpdatePrototypeDialog
          updatePrompt={updatePrompt}
          setUpdatePrompt={setUpdatePrompt}
          prototypeName={prototypeName || generated?.name || ""}
          updating={updating}
          onUpdate={handleUpdateApplication}
          onClose={() => !updating && setShowUpdateDialog(false)}
        />
      )}

      {showMergeDialog && (
        <MergePrototypesDialog
          mergeSelectedCount={mergeSelectedCount}
          mergePrompt={mergePrompt}
          setMergePrompt={setMergePrompt}
          prototypeName={prototypeName}
          setPrototypeName={setPrototypeName}
          merging={merging}
          onMerge={handleMerge}
          onClose={() => setShowMergeDialog(false)}
        />
      )}
    </div>
  );
};

const PrototypeBriefDialog = ({
  selectedCount,
  selectedStories,
  prototypePrompt,
  prototypeName,
  setPrototypeName,
  setPrototypePrompt,
  promptRefined,
  refiningPrompt,
  generating,
  onRefine,
  onGenerate,
  onClose,
}) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto",
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "24px 26px",
        boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
      }}
    >
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, margin: "0 0 6px", color: "var(--text-primary)" }}>
        Prototype Brief
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
        Generating from <strong style={{ color: "var(--text-secondary)" }}>{selectedCount}</strong> selected{" "}
        {selectedCount === 1 ? "story" : "stories"}. Describe layout and UI — refine with AI before generating.
      </p>

      <div style={{
        marginBottom: 14, maxHeight: 100, overflowY: "auto", padding: "10px 12px",
        background: "var(--bg-elevated)", borderRadius: "var(--radius)", fontSize: 11, color: "var(--text-muted)",
      }}>
        {selectedStories.map((s) => (
          <div key={s._id} style={{ marginBottom: 6 }}>· {storyPreview(s).slice(0, 120)}{storyPreview(s).length > 120 ? "…" : ""}</div>
        ))}
      </div>

      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
        Prototype name (optional)
      </label>
      <input
        value={prototypeName}
        onChange={(e) => setPrototypeName(e.target.value)}
        placeholder="e.g. Auth & Profile flows"
        style={{ ...inputStyle, marginBottom: 14 }}
        {...focusHandlers}
      />

      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
        Your vision & instructions
      </label>
      <textarea
        value={prototypePrompt}
        onChange={(e) => setPrototypePrompt(e.target.value)}
        placeholder={`Example:\n- Customer storefront with product grid and filters\n- Admin panel with sidebar: orders, inventory, users\n- Map checkout stories into a 3-step wizard\n- Clean modern UI, blue accent, card-based layout`}
        rows={10}
        style={{ ...inputStyle, resize: "vertical", minHeight: 180, lineHeight: 1.55, marginBottom: 12 }}
        {...focusHandlers}
      />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Quick add
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PROMPT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                const next = prototypePrompt.trim()
                  ? `${prototypePrompt.trim()}\n- ${suggestion}`
                  : suggestion;
                setPrototypePrompt(next);
              }}
              style={{
                padding: "5px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              + {suggestion.slice(0, 42)}{suggestion.length > 42 ? "…" : ""}
            </button>
          ))}
        </div>
      </div>

      {promptRefined && (
        <div style={{
          marginBottom: 14, padding: "8px 12px", borderRadius: "var(--radius)",
          background: "var(--green-soft, rgba(34,197,94,0.12))",
          border: "1px solid rgba(34,197,94,0.3)",
          fontSize: 12, color: "var(--green)",
        }}>
          Prompt refined by AI — review and edit before generating.
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={dialogBtnStyle("muted")}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onRefine}
          disabled={refiningPrompt || !prototypePrompt.trim()}
          style={dialogBtnStyle("yellow", refiningPrompt || !prototypePrompt.trim())}
        >
          {refiningPrompt ? "Refining…" : "✨ Refine with AI"}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          style={dialogBtnStyle("accent", generating)}
        >
          {generating ? `Generating ${selectedCount} ${selectedCount === 1 ? "story" : "stories"}…` : "Generate Prototype"}
        </button>
      </div>
    </div>
  </div>
);

const UpdatePrototypeDialog = ({
  updatePrompt,
  setUpdatePrompt,
  prototypeName,
  updating,
  onUpdate,
  onClose,
}) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto",
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "24px 26px",
        boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
      }}
    >
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, margin: "0 0 6px", color: "var(--text-primary)" }}>
        Update Application
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 18px", lineHeight: 1.5 }}>
        Describe what to change in <strong style={{ color: "var(--text-secondary)" }}>{prototypeName || "this prototype"}</strong>.
        AI will update each screen while keeping the interactive preview and saved code in sync.
      </p>

      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
        What should change?
      </label>
      <textarea
        value={updatePrompt}
        onChange={(e) => setUpdatePrompt(e.target.value)}
        placeholder={`Example:\n- Add a hero banner and larger product cards on Home\n- Make checkout steps more prominent with a progress bar\n- Add row actions to the inventory table for stock overrides\n- Use a darker admin sidebar to distinguish from storefront`}
        rows={9}
        style={{ ...inputStyle, resize: "vertical", minHeight: 160, lineHeight: 1.55, marginBottom: 12 }}
        {...focusHandlers}
      />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Quick add
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {UPDATE_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                const next = updatePrompt.trim()
                  ? `${updatePrompt.trim()}\n- ${suggestion}`
                  : suggestion;
                setUpdatePrompt(next);
              }}
              style={{
                padding: "5px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              + {suggestion.slice(0, 42)}{suggestion.length > 42 ? "…" : ""}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} disabled={updating} style={dialogBtnStyle("muted", updating)}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onUpdate}
          disabled={updating || !updatePrompt.trim()}
          style={dialogBtnStyle("accent", updating || !updatePrompt.trim())}
        >
          {updating ? "Updating application…" : "Apply Updates"}
        </button>
      </div>
    </div>
  </div>
);

const MergePrototypesDialog = ({
  mergeSelectedCount,
  mergePrompt,
  setMergePrompt,
  prototypeName,
  setPrototypeName,
  merging,
  onMerge,
  onClose,
}) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto",
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "24px 26px",
        boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
      }}
    >
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, margin: "0 0 6px", color: "var(--text-primary)" }}>
        Merge Prototypes
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 18px", lineHeight: 1.5 }}>
        AI will analyze the saved HTML/CSS/JS from <strong style={{ color: "var(--text-secondary)" }}>{mergeSelectedCount}</strong> parts
        and refactor them into one unified application. Describe how they should fit together.
      </p>

      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
        Merged app name (optional)
      </label>
      <input
        value={prototypeName}
        onChange={(e) => setPrototypeName(e.target.value)}
        placeholder="e.g. Tshirt Ecommerce — Full App"
        style={{ ...inputStyle, marginBottom: 14 }}
        {...focusHandlers}
      />

      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
        Merge instructions
      </label>
      <textarea
        value={mergePrompt}
        onChange={(e) => setMergePrompt(e.target.value)}
        placeholder={`Example:\n- Combine customer storefront and admin panel in one sidebar\n- Use consistent blue theme across all screens\n- Keep checkout wizard from part 1, inventory table from part 2`}
        rows={8}
        style={{ ...inputStyle, resize: "vertical", minHeight: 140, lineHeight: 1.55, marginBottom: 12 }}
        {...focusHandlers}
      />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Quick add
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MERGE_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                const next = mergePrompt.trim()
                  ? `${mergePrompt.trim()}\n- ${suggestion}`
                  : suggestion;
                setMergePrompt(next);
              }}
              style={{
                padding: "5px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              + {suggestion.slice(0, 42)}{suggestion.length > 42 ? "…" : ""}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={dialogBtnStyle("muted")}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onMerge}
          disabled={merging}
          style={dialogBtnStyle("accent", merging)}
        >
          {merging ? "Merging prototypes…" : `Merge ${mergeSelectedCount} prototypes`}
        </button>
      </div>
    </div>
  </div>
);

const chunkStatusIcon = (status) => {
  if (status === "done") return "✓";
  if (status === "running") return "◉";
  if (status === "failed") return "✕";
  if (status === "skipped") return "–";
  return "○";
};

const JobProgressPanel = ({ progress, chunks, mode = "generate" }) => {
  const title = mode === "update"
    ? "Updating application"
    : mode === "merge"
      ? "Merging prototypes"
      : "Building prototype";

  return (
  <div style={{
    background: "var(--bg-surface)", border: "1px solid var(--border)",
    borderLeft: "3px solid var(--accent)",
    borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: 20,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
        {title}
      </span>
      <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
        {progress?.percent ?? 0}%
      </span>
    </div>
    <div style={{
      height: 6, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden", marginBottom: 12,
    }}>
      <div style={{
        height: "100%", width: `${progress?.percent ?? 0}%`,
        background: "var(--accent)", borderRadius: 99, transition: "width 0.4s ease",
      }} />
    </div>
    {progress?.message && (
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{progress.message}</div>
    )}
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
      {chunks.map((chunk) => (
        <div key={chunk.id} style={{
          display: "flex", alignItems: "center", gap: 8, fontSize: 12,
          color: chunk.status === "running" ? "var(--accent)" : "var(--text-secondary)",
          fontWeight: chunk.status === "running" ? 600 : 400,
        }}>
          <span style={{ width: 16, textAlign: "center", flexShrink: 0 }}>
            {chunkStatusIcon(chunk.status)}
          </span>
          <span>{chunk.label}</span>
        </div>
      ))}
    </div>
  </div>
  );
};

const chipBtnStyle = {
  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
  background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)",
};

const dialogBtnStyle = (variant, disabled = false) => ({
  padding: "9px 18px",
  borderRadius: "var(--radius)",
  border: "none",
  fontWeight: 600,
  fontSize: 13,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  background: variant === "accent"
    ? "var(--accent)"
    : variant === "yellow"
      ? "var(--yellow-soft, rgba(234,179,8,0.2))"
      : "var(--bg-elevated)",
  color: variant === "accent"
    ? "white"
    : variant === "yellow"
      ? "var(--yellow)"
      : "var(--text-secondary)",
  borderWidth: variant === "yellow" ? 1 : 0,
  borderStyle: "solid",
  borderColor: variant === "yellow" ? "rgba(234,179,8,0.4)" : "transparent",
});

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
    {children}
  </div>
);

const smallBtnStyle = (variant) => ({
  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
  background: variant === "red" ? "var(--red-soft)" : "var(--accent-soft)",
  border: `1px solid ${variant === "red" ? "var(--red)22" : "var(--accent)22"}`,
  color: variant === "red" ? "var(--red)" : "var(--accent)",
});

export default CreateApplication;
