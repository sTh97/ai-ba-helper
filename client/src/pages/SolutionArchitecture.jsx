import { useState, useEffect, useMemo } from "react";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
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
  "Cloud-native, must scale to 100k users; prefer managed services.",
  "Keep it cost-effective for an early-stage startup MVP.",
  "Enterprise: strict security, audit logging, role-based access, on-prem option.",
  "Real-time features needed (websockets/notifications).",
  "Mobile-first with an API consumed by web and native clients.",
  "Prefer a TypeScript stack with PostgreSQL.",
];

const FORMATS = [
  { value: "pdf", label: "PDF", hint: "Formatted architecture document" },
  { value: "docx", label: "Word", hint: "Editable .docx document" },
];

const storyPreview = (story) => story.correctedText || story.originalText || "";

const SolutionArchitecture = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const canCreate = hasPermission("solution", "create");
  const canUpdate = hasPermission("solution", "update");
  const canDelete = hasPermission("solution", "delete");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [stories, setStories] = useState([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState(() => new Set());
  const [savedItems, setSavedItems] = useState([]);
  const [loadingStories, setLoadingStories] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [vision, setVision] = useState("");
  const [name, setName] = useState("");
  const [promptRefined, setPromptRefined] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState("");

  const [generated, setGenerated] = useState(null);

  useEffect(() => {
    axios.get("/projects").then((res) => setProjects(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setStories([]);
      setSavedItems([]);
      setGenerated(null);
      return;
    }
    setLoadingStories(true);
    setGenerated(null);
    setVision("");
    setPromptRefined(false);
    setName("");
    setSelectedStoryIds(new Set());
    Promise.all([
      axios.get(`/solutions/project/${selectedProjectId}/stories`),
      axios.get(`/solutions?projectId=${selectedProjectId}`),
    ])
      .then(([storiesRes, itemsRes]) => {
        const loaded = storiesRes.data.stories || [];
        setStories(loaded);
        setSelectedStoryIds(new Set(loaded.map((s) => s._id)));
        setSavedItems(itemsRes.data || []);
      })
      .catch(() => showToast("Failed to load project data", "error"))
      .finally(() => setLoadingStories(false));
  }, [selectedProjectId]);

  const selectedCount = selectedStoryIds.size;

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

  const refreshSaved = async () => {
    try {
      const res = await axios.get(`/solutions?projectId=${selectedProjectId}`);
      setSavedItems(res.data || []);
    } catch {
      // non-fatal
    }
  };

  const openDialog = () => {
    if (!selectedProjectId || stories.length === 0) return;
    if (selectedCount === 0) {
      showToast("Select at least one user story to generate an architecture.", "error");
      return;
    }
    setShowDialog(true);
  };

  const handleRefine = async () => {
    if (!vision.trim()) {
      showToast("Write your constraints first, then refine with AI.", "error");
      return;
    }
    setRefining(true);
    try {
      const res = await axios.post("/solutions/prompt/refine", {
        projectId: selectedProjectId,
        draftPrompt: vision,
        storyIds: Array.from(selectedStoryIds),
      });
      setVision(res.data.refinedPrompt || vision);
      setPromptRefined(true);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to refine prompt", "error");
    } finally {
      setRefining(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProjectId || selectedCount === 0) return;
    setGenerating(true);
    try {
      const res = await axios.post("/solutions/generate", {
        projectId: selectedProjectId,
        prompt: vision.trim(),
        storyIds: Array.from(selectedStoryIds),
      });
      setGenerated(res.data);
      setName(res.data.name || "");
      setShowDialog(false);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to generate solution architecture", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated?.content) {
      showToast("Generate an architecture before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        projectId: generated.projectId || selectedProjectId,
        name: (name || generated.name || "Untitled Architecture").trim(),
        description: generated.description || generated.content.summary || "",
        storyIds: generated.storyIds,
        prompt: generated.prompt || vision || "",
        content: generated.content,
      };
      const isUpdate = Boolean(generated._id && canUpdate);
      const res = isUpdate
        ? await axios.put(`/solutions/${generated._id}`, payload)
        : await axios.post("/solutions", payload);
      setGenerated((prev) => ({ ...prev, _id: res.data._id }));
      await refreshSaved();
      showToast(isUpdate ? "Architecture updated" : "Architecture saved");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save architecture", "error");
    } finally {
      setSaving(false);
    }
  };

  const loadSaved = async (item) => {
    try {
      const res = await axios.get(`/solutions/${item._id}`);
      const full = res.data;
      setGenerated({
        _id: full._id,
        projectId: full.projectId?._id || full.projectId,
        name: full.name,
        description: full.description,
        storyIds: full.storyIds,
        prompt: full.prompt,
        content: full.content,
      });
      setName(full.name || "");
      setVision(full.prompt || "");
      setPromptRefined(Boolean(full.prompt));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      showToast("Failed to load saved architecture", "error");
    }
  };

  const handleDeleteSaved = async (id) => {
    try {
      await axios.delete(`/solutions/${id}`);
      setSavedItems((prev) => prev.filter((p) => p._id !== id));
      if (generated?._id === id) setGenerated(null);
      showToast("Architecture deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const openRegenerate = () => {
    if (!generated) return;
    setVision(generated.prompt || vision);
    setName(name || generated.name || "");
    setPromptRefined(Boolean(generated.prompt));
    setShowDialog(true);
  };

  const downloadFile = async ({ id, content, name: dlName, format: dlFormat }) => {
    setDownloading(dlFormat + (id || "current"));
    try {
      const res = await axios.post(
        "/solutions/export",
        { id, content, name: dlName, format: dlFormat },
        { responseType: "blob" }
      );
      const disposition = res.headers["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `solution-architecture.${dlFormat}`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast("Failed to download file", "error");
    } finally {
      setDownloading("");
    }
  };

  const downloadGenerated = (fmt) =>
    downloadFile({
      id: generated?._id || undefined,
      content: generated?._id ? undefined : generated?.content,
      name: name || generated?.name,
      format: fmt,
    });

  return (
    <div className="ba-page" style={{ maxWidth: 980, margin: "0 auto" }}>
      <PageHeader
        title="Solution Architecture"
        subtitle="Pick a project and its user stories, describe constraints, and let AI design the tech stack, technical viability, feature linkage, schemas, ERD, and project workflow — export as PDF or Word"
      />

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
                  <span style={{ color: "var(--accent)", marginLeft: 8 }}>· {selectedCount} selected</span>
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
                        background: checked ? "var(--accent-soft)" : "transparent", cursor: "pointer",
                      }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleStory(s._id)} style={{ marginTop: 3, flexShrink: 0 }} />
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
              <button
                onClick={openDialog}
                disabled={generating || selectedCount === 0}
                style={{
                  padding: "10px 22px", borderRadius: "var(--radius)", border: "none",
                  background: (generating || selectedCount === 0) ? "var(--bg-elevated)" : "var(--accent)",
                  color: (generating || selectedCount === 0) ? "var(--text-muted)" : "white",
                  fontWeight: 600, fontSize: 13,
                  cursor: generating ? "wait" : selectedCount === 0 ? "not-allowed" : "pointer",
                }}
              >
                {generating ? "Designing architecture… (may take 1-2 min)" : `✨ Generate Architecture (${selectedCount} ${selectedCount === 1 ? "story" : "stories"})`}
              </button>
            )}

            {selectedProjectId && stories.length === 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Add user stories to this project first before generating an architecture.
              </div>
            )}
          </>
        )}
      </div>

      {savedItems.length > 0 && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: 20,
        }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, margin: "0 0 12px", color: "var(--text-primary)" }}>
            Saved Architectures
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {savedItems.map((p) => (
              <div key={p._id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: "var(--radius)",
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {new Date(p.updatedAt).toLocaleDateString()}
                    {(p.storyIds || []).length > 0 && ` · ${p.storyIds.length} ${p.storyIds.length === 1 ? "story" : "stories"}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => downloadFile({ id: p._id, name: p.name, format: f.value })}
                      disabled={downloading === f.value + p._id}
                      style={smallBtnStyle("yellow")}
                      title={`Download as ${f.label}`}
                    >
                      {downloading === f.value + p._id ? "…" : f.label}
                    </button>
                  ))}
                  <button onClick={() => loadSaved(p)} style={smallBtnStyle("accent")}>Open</button>
                  {canDelete && (
                    <ConfirmButton onConfirm={() => handleDeleteSaved(p._id)} label="Delete" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {generated && (
        <div style={{
          background: "var(--ai-soft)", border: "1px solid var(--ai-border)",
          borderLeft: "2px solid var(--ai-border)",
          borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20, position: "relative",
        }}>
          <span style={{
            position: "absolute", top: 14, right: 16,
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, color: "var(--ai-accent)", letterSpacing: "0.3px",
          }}><span aria-hidden>✦</span> AI Generated</span>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap", paddingTop: 8 }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Architecture name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name this architecture before saving"
                style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
                {...focusHandlers}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Download:</span>
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => downloadGenerated(f.value)}
                    disabled={Boolean(downloading)}
                    style={dialogBtnStyle("yellow", Boolean(downloading))}
                    title={f.hint}
                  >
                    {downloading.startsWith(f.value) ? "Preparing…" : `⬇ ${f.label}`}
                  </button>
                ))}
              </div>
              {canCreate && (
                <button onClick={openRegenerate} style={dialogBtnStyle("accentSoft")}>
                  ✨ Edit & Regenerate
                </button>
              )}
              {(canCreate || (canUpdate && generated._id)) && (
                <button onClick={handleSave} disabled={saving} style={{
                  padding: "9px 18px", borderRadius: "var(--radius)", border: "none",
                  background: "var(--green)", color: "#0a0b0f", fontWeight: 700, fontSize: 13,
                  cursor: saving ? "wait" : "pointer",
                }}>
                  {saving ? "Saving…" : generated._id ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>

          <ArchitectureView content={generated.content} />
        </div>
      )}

      {showDialog && (
        <SolutionBriefDialog
          selectedCount={selectedCount}
          name={name}
          setName={setName}
          vision={vision}
          setVision={(v) => { setVision(v); setPromptRefined(false); }}
          promptRefined={promptRefined}
          refining={refining}
          generating={generating}
          onRefine={handleRefine}
          onGenerate={handleGenerate}
          onClose={() => !generating && setShowDialog(false)}
        />
      )}
    </div>
  );
};

/* ---------------- Architecture renderer ---------------- */

const ArchitectureView = ({ content }) => {
  if (!content) return null;
  const {
    summary,
    techStack = [],
    technicalViability = {},
    featureLinkages = [],
    schemas = [],
    erd = {},
    workflow = {},
  } = content;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {summary && (
        <div>
          <SectionTitle icon="📋">Executive Summary</SectionTitle>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{summary}</p>
        </div>
      )}

      {techStack.length > 0 && (
        <div>
          <SectionTitle icon="🧱">Technology Stack</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {techStack.map((t, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "var(--accent-soft)", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {t.layer || "Layer"}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.technology}</span>
                </div>
                {t.rationale && <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{t.rationale}</div>}
                {t.alternatives && (
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                    Alternatives: {t.alternatives}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(technicalViability.assessment || technicalViability.rating || (technicalViability.risks || []).length > 0) && (
        <div>
          <SectionTitle icon="✅">Technical Viability</SectionTitle>
          {technicalViability.rating && (
            <span style={{
              display: "inline-block", marginBottom: 10, fontSize: 11, fontWeight: 700, padding: "3px 10px",
              borderRadius: 99, ...ratingStyle(technicalViability.rating),
            }}>
              Feasibility: {technicalViability.rating}
            </span>
          )}
          {technicalViability.assessment && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 10px" }}>{technicalViability.assessment}</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {technicalViability.scalability && <InfoBlock label="Scalability">{technicalViability.scalability}</InfoBlock>}
            {technicalViability.security && <InfoBlock label="Security">{technicalViability.security}</InfoBlock>}
          </div>
          {((technicalViability.risks || []).length > 0 || (technicalViability.mitigations || []).length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <BulletList title="Risks" items={technicalViability.risks} tone="red" />
              <BulletList title="Mitigations" items={technicalViability.mitigations} tone="green" />
            </div>
          )}
        </div>
      )}

      {featureLinkages.length > 0 && (
        <div>
          <SectionTitle icon="🔗">Feature Linkage</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {featureLinkages.map((f, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{f.feature}</div>
                {f.description && <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 6 }}>{f.description}</div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(f.components || []).map((c, j) => (
                    <span key={`c${j}`} style={chipTag("var(--accent-soft)", "var(--accent)")}>{c}</span>
                  ))}
                  {(f.dependsOn || []).map((d, j) => (
                    <span key={`d${j}`} style={chipTag("var(--bg-elevated)", "var(--text-muted)")}>↳ depends on {d}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {schemas.length > 0 && (
        <div>
          <SectionTitle icon="🗄️">Data Schemas</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {schemas.map((sch, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{sch.name}</div>
                {sch.description && <div style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 8px" }}>{sch.description}</div>}
                {(sch.fields || []).length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr>
                          <Th>Field</Th><Th>Type</Th><Th>Description</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {sch.fields.map((fl, j) => (
                          <tr key={j}>
                            <Td><code style={{ color: "var(--accent)" }}>{fl.name}</code></Td>
                            <Td style={{ color: "var(--text-muted)" }}>{fl.type}</Td>
                            <Td style={{ color: "var(--text-secondary)" }}>{fl.description}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(erd.mermaid || (erd.entities || []).length > 0) && (
        <div>
          <SectionTitle icon="🧩">Entity Relationship Diagram (ERD)</SectionTitle>
          {erd.mermaid
            ? <MermaidDiagram code={erd.mermaid} height={420} />
            : <ErdFallback erd={erd} />}
          {(erd.relationships || []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
              {erd.relationships.map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{r.from}</strong>
                  <span style={{ color: "var(--accent)", margin: "0 6px" }}>{r.cardinality || "—"}</span>
                  <strong style={{ color: "var(--text-primary)" }}>{r.to}</strong>
                  {r.label && <span style={{ color: "var(--text-muted)" }}> · {r.label}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(workflow.mermaid || (workflow.steps || []).length > 0) && (
        <div>
          <SectionTitle icon="🔀">Project Workflow</SectionTitle>
          {workflow.description && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 10px" }}>{workflow.description}</p>
          )}
          {workflow.mermaid && <MermaidDiagram code={workflow.mermaid} height={460} />}
          {(workflow.steps || []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {workflow.steps.map((st, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", ...cardStyle }}>
                  <span style={{
                    flexShrink: 0, width: 24, height: 24, borderRadius: 99, background: "var(--accent)", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                  }}>{st.step ?? i + 1}</span>
                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {st.actor && <strong style={{ color: "var(--text-primary)" }}>{st.actor}: </strong>}
                    {st.action}
                    {st.outcome && <span style={{ color: "var(--text-muted)" }}> → {st.outcome}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ErdFallback = ({ erd }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
    {(erd.entities || []).map((e, i) => (
      <div key={i} style={{ ...cardStyle, minWidth: 180 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{e.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {(e.attributes || []).map((a, j) => (
            <code key={j} style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{a}</code>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const buildMermaidDoc = (code) => {
  const safe = JSON.stringify(String(code || "")).replace(/<\//g, "<\\/");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script>
<style>
  html,body{margin:0;background:#ffffff;}
  body{padding:16px;font-family:system-ui,-apple-system,sans-serif;}
  #d{display:flex;justify-content:center;}
  #err{color:#b00020;font-size:13px;white-space:pre-wrap;}
</style></head><body>
<div class="mermaid" id="d"></div>
<pre id="err"></pre>
<script>
  try {
    var code = ${safe};
    document.getElementById('d').textContent = code;
    mermaid.initialize({ startOnLoad:false, securityLevel:'loose', theme:'default' });
    mermaid.run().catch(function(e){ document.getElementById('err').textContent = 'Diagram error: ' + e.message; });
  } catch (e) {
    document.getElementById('err').textContent = 'Diagram error: ' + e.message;
  }
<\/script>
</body></html>`;
};

const MermaidDiagram = ({ code, height = 400 }) => {
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const doc = useMemo(() => buildMermaidDoc(code), [code]);

  const copy = () => {
    navigator.clipboard.writeText(code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", background: "#fff" }}>
        <iframe
          title="diagram"
          srcDoc={doc}
          sandbox="allow-scripts"
          style={{ width: "100%", height, border: "none", display: "block", background: "#fff" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button onClick={() => setShowSource((s) => !s)} style={smallBtnStyle("muted")}>
          {showSource ? "Hide source" : "View Mermaid source"}
        </button>
        {showSource && (
          <button onClick={copy} style={smallBtnStyle("accent")}>{copied ? "✓ Copied" : "Copy"}</button>
        )}
      </div>
      {showSource && (
        <pre style={{
          marginTop: 8, background: "#0d1117", border: "1px solid var(--border)", borderRadius: "var(--radius)",
          padding: "12px 14px", overflowX: "auto", fontSize: 12, lineHeight: 1.5, color: "#7ee787",
        }}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};

/* ---------------- Brief dialog ---------------- */

const SolutionBriefDialog = ({
  selectedCount, name, setName, vision, setVision,
  promptRefined, refining, generating, onRefine, onGenerate, onClose,
}) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%", maxWidth: 660, maxHeight: "90vh", overflow: "auto",
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "24px 26px",
        boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
      }}
    >
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, margin: "0 0 6px", color: "var(--text-primary)" }}>
        Architecture Brief
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
        Designing from <strong style={{ color: "var(--text-secondary)" }}>{selectedCount}</strong> selected{" "}
        {selectedCount === 1 ? "story" : "stories"}. Describe constraints and preferences, refine with AI, then generate.
      </p>

      <label style={labelStyle}>Architecture name (optional)</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Leave Portal — Cloud Architecture"
        style={{ ...inputStyle, marginBottom: 14 }}
        {...focusHandlers}
      />

      <label style={labelStyle}>Constraints & preferences</label>
      <textarea
        value={vision}
        onChange={(e) => setVision(e.target.value)}
        placeholder={`Example:\n- Prefer a TypeScript stack with PostgreSQL\n- Must scale to 50k users, cloud-hosted\n- Strict security & audit logging\n- Integrate with existing SSO`}
        rows={9}
        style={{ ...inputStyle, resize: "vertical", minHeight: 170, lineHeight: 1.55, marginBottom: 12 }}
        {...focusHandlers}
      />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Quick add
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PROMPT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setVision(vision.trim() ? `${vision.trim()}\n- ${s}` : s)}
              style={{
                padding: "5px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
                background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)",
              }}
            >
              + {s.slice(0, 44)}{s.length > 44 ? "…" : ""}
            </button>
          ))}
        </div>
      </div>

      {promptRefined && (
        <div style={{
          marginBottom: 14, padding: "8px 12px", borderRadius: "var(--radius)",
          background: "var(--green-soft, rgba(34,197,94,0.12))", border: "1px solid rgba(34,197,94,0.3)",
          fontSize: 12, color: "var(--green)",
        }}>
          Brief refined by AI — review and edit before generating.
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} disabled={generating} style={dialogBtnStyle("muted", generating)}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onRefine}
          disabled={refining || generating || !vision.trim()}
          style={dialogBtnStyle("yellow", refining || generating || !vision.trim())}
        >
          {refining ? "Refining…" : "✨ Refine with AI"}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          style={dialogBtnStyle("accent", generating)}
        >
          {generating ? "Designing…" : "Generate Architecture"}
        </button>
      </div>
    </div>
  </div>
);

/* ---------------- Small presentational helpers ---------------- */

const SectionTitle = ({ icon, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
    <span style={{ fontSize: 15 }}>{icon}</span>
    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{children}</span>
  </div>
);

const InfoBlock = ({ label, children }) => (
  <div style={cardStyle}>
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{children}</div>
  </div>
);

const BulletList = ({ title, items, tone }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{title}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {(items || []).map((it, i) => (
        <div key={i} style={{
          padding: "7px 10px", borderRadius: 7, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45,
          background: tone === "red" ? "var(--red-soft)" : tone === "green" ? "var(--green-soft)" : "var(--bg-elevated)",
          border: `1px solid ${tone === "red" ? "var(--red)" : tone === "green" ? "var(--green)" : "var(--border)"}22`,
        }}>{it}</div>
      ))}
    </div>
  </div>
);

const Th = ({ children }) => (
  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.4px" }}>{children}</th>
);
const Td = ({ children, style }) => (
  <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", verticalAlign: "top", ...style }}>{children}</td>
);

const ratingStyle = (rating) => {
  const r = String(rating).toLowerCase();
  if (r.includes("high")) return { background: "var(--green-soft)", color: "var(--green)" };
  if (r.includes("low")) return { background: "var(--red-soft)", color: "var(--red)" };
  return { background: "var(--yellow-soft, rgba(234,179,8,0.18))", color: "var(--yellow)" };
};

const chipTag = (bg, color) => ({
  fontSize: 11, padding: "3px 9px", borderRadius: 99, background: bg, color, fontWeight: 600,
});

const cardStyle = {
  padding: "12px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
};

const chipBtnStyle = {
  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
  background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)",
};

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 };

const dialogBtnStyle = (variant, disabled = false) => ({
  padding: "9px 18px", borderRadius: "var(--radius)", border: "none",
  fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  background: variant === "accent"
    ? "var(--accent)"
    : variant === "accentSoft"
      ? "var(--accent-soft)"
      : variant === "yellow"
        ? "var(--yellow-soft, rgba(234,179,8,0.2))"
        : "var(--bg-elevated)",
  color: variant === "accent"
    ? "white"
    : variant === "accentSoft"
      ? "var(--accent)"
      : variant === "yellow"
        ? "var(--yellow)"
        : "var(--text-secondary)",
  borderWidth: variant === "yellow" || variant === "accentSoft" ? 1 : 0,
  borderStyle: "solid",
  borderColor: variant === "yellow" ? "rgba(234,179,8,0.4)" : variant === "accentSoft" ? "var(--accent)22" : "transparent",
});

const smallBtnStyle = (variant) => ({
  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
  background: variant === "red"
    ? "var(--red-soft)"
    : variant === "yellow"
      ? "var(--yellow-soft, rgba(234,179,8,0.18))"
      : variant === "muted"
        ? "var(--bg-elevated)"
        : "var(--accent-soft)",
  border: `1px solid ${
    variant === "red"
      ? "var(--red)22"
      : variant === "yellow"
        ? "rgba(234,179,8,0.35)"
        : variant === "muted"
          ? "var(--border)"
          : "var(--accent)22"
  }`,
  color: variant === "red"
    ? "var(--red)"
    : variant === "yellow"
      ? "var(--yellow)"
      : variant === "muted"
        ? "var(--text-secondary)"
        : "var(--accent)",
});

export default SolutionArchitecture;
