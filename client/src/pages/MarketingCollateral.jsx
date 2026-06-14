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

const FORMATS = [
  { value: "pdf", label: "PDF", hint: "Polished one-pager / brochure" },
  { value: "docx", label: "Word", hint: "Editable .docx document" },
  { value: "pptx", label: "PowerPoint", hint: "Slide deck .pptx" },
];

const COLLATERAL_TYPES = [
  "One-pager",
  "Brochure",
  "Pitch deck",
  "Product datasheet",
  "Case study",
  "Sales email",
  "Landing page copy",
  "Press release",
];

const PROMPT_SUGGESTIONS = [
  "Target enterprise decision-makers; emphasize ROI and time savings.",
  "Friendly, energetic tone for a consumer launch announcement.",
  "Lead with the 3 standout features and back each with a concrete benefit.",
  "Include a short customer-success angle and a strong closing CTA.",
  "Position against manual/legacy alternatives; highlight automation.",
];

const formatLabel = (value) => FORMATS.find((f) => f.value === value)?.label || "PDF";

const storyPreview = (story) => story.correctedText || story.originalText || "";

const MarketingCollateral = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const canCreate = hasPermission("marketing", "create");
  const canUpdate = hasPermission("marketing", "update");
  const canDelete = hasPermission("marketing", "delete");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [stories, setStories] = useState([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState(() => new Set());
  const [savedItems, setSavedItems] = useState([]);
  const [loadingStories, setLoadingStories] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [vision, setVision] = useState("");
  const [collateralType, setCollateralType] = useState("One-pager");
  const [format, setFormat] = useState("pdf");
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
      axios.get(`/marketing/project/${selectedProjectId}/stories`),
      axios.get(`/marketing?projectId=${selectedProjectId}`),
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
      const res = await axios.get(`/marketing?projectId=${selectedProjectId}`);
      setSavedItems(res.data || []);
    } catch {
      // non-fatal
    }
  };

  const openDialog = () => {
    if (!selectedProjectId || stories.length === 0) return;
    if (selectedCount === 0) {
      showToast("Select at least one user story to generate collateral.", "error");
      return;
    }
    setShowDialog(true);
  };

  const handleRefine = async () => {
    if (!vision.trim()) {
      showToast("Write your vision first, then refine it with AI.", "error");
      return;
    }
    setRefining(true);
    try {
      const res = await axios.post("/marketing/prompt/refine", {
        projectId: selectedProjectId,
        draftPrompt: vision,
        storyIds: Array.from(selectedStoryIds),
        collateralType,
        format,
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
      const res = await axios.post("/marketing/generate", {
        projectId: selectedProjectId,
        prompt: vision.trim(),
        storyIds: Array.from(selectedStoryIds),
        collateralType,
        format,
        name: name.trim() || undefined,
      });
      setGenerated(res.data);
      setName(res.data.name || "");
      setShowDialog(false);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to generate collateral", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated?.content) {
      showToast("Generate collateral before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        projectId: generated.projectId || selectedProjectId,
        name: (name || generated.name || "Untitled Collateral").trim(),
        description: generated.description || generated.content.subtitle || "",
        storyIds: generated.storyIds,
        collateralType: generated.collateralType,
        format: generated.format,
        prompt: generated.prompt || vision || "",
        content: generated.content,
      };
      const isUpdate = Boolean(generated._id && canUpdate);
      const res = isUpdate
        ? await axios.put(`/marketing/${generated._id}`, payload)
        : await axios.post("/marketing", payload);
      setGenerated((prev) => ({ ...prev, _id: res.data._id, previewHtml: res.data.previewHtml || prev.previewHtml }));
      await refreshSaved();
      showToast(isUpdate ? "Collateral updated" : "Collateral saved");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save collateral", "error");
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async ({ id, content, name: dlName, format: dlFormat }) => {
    setDownloading(dlFormat + (id || "current"));
    try {
      const res = await axios.post(
        "/marketing/export",
        { id, content, name: dlName, format: dlFormat },
        { responseType: "blob" }
      );
      const disposition = res.headers["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `collateral.${dlFormat === "pptx" ? "pptx" : dlFormat}`;
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

  const loadSaved = async (item) => {
    try {
      const res = await axios.get(`/marketing/${item._id}`);
      const full = res.data;
      setGenerated({
        _id: full._id,
        projectId: full.projectId?._id || full.projectId,
        name: full.name,
        description: full.description,
        storyIds: full.storyIds,
        collateralType: full.collateralType,
        format: full.format,
        prompt: full.prompt,
        content: full.content,
        previewHtml: full.previewHtml,
      });
      setName(full.name || "");
      setVision(full.prompt || "");
      setCollateralType(full.collateralType || "One-pager");
      setFormat(full.format || "pdf");
      setPromptRefined(Boolean(full.prompt));
    } catch {
      showToast("Failed to load saved collateral", "error");
    }
  };

  const handleDeleteSaved = async (id) => {
    try {
      await axios.delete(`/marketing/${id}`);
      setSavedItems((prev) => prev.filter((p) => p._id !== id));
      if (generated?._id === id) setGenerated(null);
      showToast("Collateral deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const openRegenerate = () => {
    if (!generated) return;
    setVision(generated.prompt || vision);
    setCollateralType(generated.collateralType || collateralType);
    setFormat(generated.format || format);
    setName(name || generated.name || "");
    setPromptRefined(Boolean(generated.prompt));
    setShowDialog(true);
  };

  return (
    <div className="ba-page" style={{ maxWidth: 960, margin: "0 auto" }}>
      <PageHeader
        title="Marketing Collateral"
        subtitle="Pick a project and its user stories, describe your vision, and let AI craft marketing collateral as PDF, Word, or PowerPoint"
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
                {generating ? "Generating…" : `✨ Create Collateral (${selectedCount} ${selectedCount === 1 ? "story" : "stories"})`}
              </button>
            )}

            {selectedProjectId && stories.length === 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Add user stories to this project first before generating collateral.
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
            Saved Collateral
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
                    {p.collateralType && ` · ${p.collateralType}`}
                    {p.format && ` · ${formatLabel(p.format)}`}
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
                    <ConfirmButton onConfirm={() => handleDeleteSaved(p._id)} />
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
                Collateral name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name this collateral before saving"
                style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
                {...focusHandlers}
              />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                {generated.collateralType} · primary format {formatLabel(generated.format)}
              </div>
            </div>
            {(canCreate || (canUpdate && generated._id)) && (
              <button onClick={handleSave} disabled={saving} style={{
                padding: "8px 18px", borderRadius: "var(--radius)", border: "none",
                background: "var(--green)", color: "#0a0b0f", fontWeight: 700, fontSize: 13,
                cursor: saving ? "wait" : "pointer", flexShrink: 0,
              }}>
                {saving ? "Saving…" : generated._id ? "Update Collateral" : "Save Collateral"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center" }}>
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
            {canCreate && (
              <button onClick={openRegenerate} style={dialogBtnStyle("accent")}>
                ✨ Edit & Regenerate
              </button>
            )}
          </div>

          <div style={{
            border: "1px solid var(--ai-border)", borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            <div style={{
              background: "#1e1e2e", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
              borderBottom: "1px solid #2d2d3d",
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                ))}
              </div>
              <div style={{
                flex: 1, background: "#2a2a3c", borderRadius: 6, padding: "5px 12px",
                fontSize: 11, color: "#8888a0", fontFamily: "monospace", textAlign: "center",
              }}>
                collateral preview · {formatLabel(generated.format)}
              </div>
            </div>
            <iframe
              title="Marketing Collateral Preview"
              srcDoc={generated.previewHtml}
              sandbox=""
              style={{ width: "100%", height: 560, border: "none", background: "#fff", display: "block" }}
            />
          </div>
        </div>
      )}

      {showDialog && (
        <CollateralDialog
          selectedCount={selectedCount}
          name={name}
          setName={setName}
          collateralType={collateralType}
          setCollateralType={setCollateralType}
          format={format}
          setFormat={setFormat}
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

const CollateralDialog = ({
  selectedCount, name, setName, collateralType, setCollateralType,
  format, setFormat, vision, setVision, promptRefined, refining, generating,
  onRefine, onGenerate, onClose,
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
        Marketing Collateral Brief
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
        Building from <strong style={{ color: "var(--text-secondary)" }}>{selectedCount}</strong> selected{" "}
        {selectedCount === 1 ? "story" : "stories"}. Describe your vision, refine it with AI, then generate.
      </p>

      <label style={labelStyle}>Collateral name (optional)</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Product Launch One-Pager"
        style={{ ...inputStyle, marginBottom: 14 }}
        {...focusHandlers}
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Collateral type</label>
          <select
            value={collateralType}
            onChange={(e) => setCollateralType(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
            {...focusHandlers}
          >
            {COLLATERAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Output format</label>
          <div style={{ display: "flex", gap: 6 }}>
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                title={f.hint}
                style={{
                  flex: 1, padding: "9px 6px", borderRadius: "var(--radius)", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: format === f.value ? "var(--accent-soft)" : "var(--bg-elevated)",
                  border: `1px solid ${format === f.value ? "var(--accent)" : "var(--border)"}`,
                  color: format === f.value ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label style={labelStyle}>Your vision & instructions</label>
      <textarea
        value={vision}
        onChange={(e) => setVision(e.target.value)}
        placeholder={`Example:\n- Headline the time savings and automation\n- Audience: operations managers at mid-market companies\n- Confident, modern tone\n- End with a "Book a demo" call to action`}
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
          {generating ? "Generating…" : `Generate ${formatLabel(format)}`}
        </button>
      </div>
    </div>
  </div>
);

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 };

const chipBtnStyle = {
  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
  background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)",
};

const dialogBtnStyle = (variant, disabled = false) => ({
  padding: "9px 18px", borderRadius: "var(--radius)", border: "none",
  fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
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

const smallBtnStyle = (variant) => ({
  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
  background: variant === "red" ? "var(--red-soft)" : variant === "yellow" ? "var(--yellow-soft, rgba(234,179,8,0.18))" : "var(--accent-soft)",
  border: `1px solid ${variant === "red" ? "var(--red)22" : variant === "yellow" ? "rgba(234,179,8,0.35)" : "var(--accent)22"}`,
  color: variant === "red" ? "var(--red)" : variant === "yellow" ? "var(--yellow)" : "var(--accent)",
});

export default MarketingCollateral;
