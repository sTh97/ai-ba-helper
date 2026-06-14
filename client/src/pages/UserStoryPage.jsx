import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import TestCaseEditor from "../pages/components/TestCaseEditor";
import UIWireframeGenerator from "../pages/components/UIWireframeGenerator";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s", boxSizing: "border-box",
};

const focusOn = (e) => (e.target.style.borderColor = "var(--accent)");
const focusOff = (e) => (e.target.style.borderColor = "var(--border)");

const Sparkle = ({ spinning }) => (
  <span className={`ba-sparkle${spinning ? " spinning" : ""}`} aria-hidden>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c.5 4.5 3 7 7.5 7.5-4.5.5-7 3-7.5 7.5-.5-4.5-3-7-7.5-7.5C9 9 11.5 6.5 12 2z" />
    </svg>
  </span>
);

const AIEnhanceButton = ({ loading, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      alignSelf: "flex-start", padding: "10px 20px",
      borderRadius: "var(--radius)",
      border: "1px solid transparent",
      borderImage: "linear-gradient(135deg, #4f8ef7, #38b2b2) 1",
      background: "var(--bg-elevated)",
      color: "var(--text-primary)",
      fontWeight: 600, fontSize: 13,
      cursor: loading ? "wait" : disabled ? "not-allowed" : "pointer",
      display: "inline-flex", alignItems: "center", gap: 8,
      opacity: disabled && !loading ? 0.5 : 1,
    }}
  >
    <span style={{ color: "var(--ai-accent)", display: "flex" }}>
      <Sparkle spinning={loading} />
    </span>
    {loading ? (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        Analyzing content
        <span className="ba-dots" style={{ color: "var(--ai-accent)" }}><span /><span /><span /></span>
      </span>
    ) : "Enhance with AI"}
  </button>
);

const UserStoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [contentText, setContentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [aiStories, setAiStories] = useState([]);
  const [showAIOutput, setShowAIOutput] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1400);

  const isEditMode = Boolean(editingStoryId);
  const isMultiStory = !isEditMode && aiStories.length > 1;
  const twoPanel = width >= 1200 && showAIOutput && aiStories.length > 0;

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/projects");
      setProjects(res.data);
    } catch (e) {
      console.error("Failed to fetch projects:", e);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const loadStoryForEdit = (story) => {
    setContentText(story.originalText);
    setFeatureInput(story.feature || "");
    setAiStories([{
      title: "User Story",
      correctedText: story.correctedText || story.originalText || "",
      feature: story.feature || "",
      acceptanceCriteria: story.acceptanceCriteria || [],
      happyTests: story.happyTests || [],
      negativeTests: story.negativeTests || [],
      fields: story.fields || [],
      businessRules: story.businessRules || [],
      validations: story.validations || [],
      edgeCases: story.edgeCases || [],
      constraints: story.constraints || [],
      dependencies: story.dependencies || [],
      businessImpact: story.businessImpact || "",
      definitionOfReady: story.definitionOfReady || [],
      definitionOfDone: story.definitionOfDone || [],
      wireframeApplicable: story.wireframeApplicable !== false,
      wireframe: story.wireframe || null,
    }]);
    setEditingStoryId(story._id);
    setSelectedProjectId(story.projectId?._id || story.projectId || "");
    setShowAIOutput(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const story = location.state?.story;
    if (story) {
      loadStoryForEdit(story);
      navigate("/add-user-story", { replace: true, state: null });
    }
  }, [location.state]);

  const updateStory = (index, updated) => {
    setAiStories((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  const removeStory = (index) => {
    setAiStories((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setShowAIOutput(false);
      return next;
    });
  };

  const buildPayload = (story) => ({
    originalText: story.correctedText,
    correctedText: story.correctedText,
    feature: (story.feature || featureInput || "").trim(),
    acceptanceCriteria: story.acceptanceCriteria,
    happyTests: story.happyTests,
    negativeTests: story.negativeTests,
    fields: story.fields || [],
    businessRules: story.businessRules || [],
    validations: story.validations || [],
    edgeCases: story.edgeCases || [],
    constraints: story.constraints || [],
    dependencies: story.dependencies || [],
    businessImpact: story.businessImpact || "",
    definitionOfReady: story.definitionOfReady || [],
    definitionOfDone: story.definitionOfDone || [],
    status: "reviewed",
    projectId: selectedProjectId,
    wireframeApplicable: story.wireframeApplicable !== false,
    wireframe: story.wireframe || null,
  });

  const handleWireframeChange = (index, wireframe) => {
    setAiStories((prev) => prev.map((s, i) => (i === index ? { ...s, wireframe } : s)));
  };

  const handleSubmit = async () => {
    if (!contentText.trim()) return;
    setLoading(true);
    setShowAIOutput(false);
    setAiStories([]);
    try {
      const aiRes = await axios.post("/ai/enhance", { content: contentText });
      const stories = aiRes.data.stories || [];

      if (stories.length === 0) {
        showToast("AI did not generate any user stories. Please try again.", "error");
        return;
      }

      const typedFeature = featureInput.trim();
      const withFeature = stories.map((s) => ({ ...s, feature: typedFeature || s.feature || "" }));

      setAiStories(withFeature);
      setShowAIOutput(true);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error
        || (err.code === "ECONNABORTED"
          ? "AI analysis timed out. Large documents take longer on local models — restart Ollama if stuck, then try again."
          : null)
        || (Array.isArray(data?.detail) ? data.detail.join("\n") : data?.detail)
        || "AI analysis failed. Please try again.";
      showToast(typeof msg === "string" ? msg : "AI analysis failed. Please try again.", "error");
      console.error("AI enhance error:", data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStory = async (index) => {
    if (!selectedProjectId) {
      showToast("Please select a project", "error");
      return;
    }
    const story = aiStories[index];
    if (!story) return;

    setSaving(true);
    try {
      const payload = buildPayload(story);
      if (isEditMode && index === 0) {
        await axios.put(`/stories/${editingStoryId}`, payload);
      } else {
        await axios.post("/stories", payload);
      }
      showToast(isEditMode ? "Story updated successfully" : "Story saved successfully");
      if (isEditMode) resetForm();
      else removeStory(index);
    } catch {
      showToast("Failed to save story", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedProjectId) {
      showToast("Please select a project", "error");
      return;
    }
    if (aiStories.length === 0) return;

    setSaving(true);
    try {
      await Promise.all(aiStories.map((story) => axios.post("/stories", buildPayload(story))));
      showToast(`Saved ${aiStories.length} stories`);
      resetForm();
    } catch {
      showToast("Failed to save stories", "error");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowAIOutput(false);
    setAiStories([]);
    setContentText("");
    setFeatureInput("");
    setEditingStoryId(null);
    setSelectedProjectId("");
  };

  const handleDiscardAll = () => {
    if (isEditMode) resetForm();
    else { setShowAIOutput(false); setAiStories([]); }
  };

  const inputPanel = (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", padding: "22px 24px",
      position: twoPanel ? "sticky" : "static", top: 84, alignSelf: "start",
    }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", margin: "0 0 16px" }}>
        {isEditMode ? "Edit Story" : "Content Input"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          onFocus={focusOn} onBlur={focusOff}
        >
          <option value="">— Select Project —</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        {!isEditMode && (
          <input
            style={inputStyle}
            placeholder="Feature / module (e.g. Leave Management)"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
          />
        )}

        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: twoPanel ? 220 : 120 }}
          placeholder="Write any paragraph, requirements, meeting notes, or feature description. AI will analyze it and generate properly formatted user stories…"
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          onFocus={focusOn} onBlur={focusOff}
          disabled={isEditMode}
        />

        {!isEditMode && (
          <AIEnhanceButton
            loading={loading}
            disabled={loading || !contentText.trim()}
            onClick={handleSubmit}
          />
        )}
        {!isEditMode && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
            Local model — generation may take 1–2 minutes for longer documents.
          </p>
        )}
      </div>
    </div>
  );

  const outputPanel = showAIOutput && aiStories.length > 0 && (
    <div style={{
      border: "1px solid var(--ai-border)", borderLeft: "2px solid var(--ai-border)",
      background: "var(--ai-soft)", borderRadius: "var(--radius-lg)",
      padding: "18px 18px 0", position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 11, fontWeight: 700, color: "var(--ai-accent)", letterSpacing: "0.4px", textTransform: "uppercase",
        }}>
          <span aria-hidden>✦</span> AI Generated
        </span>
        {!isEditMode && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {aiStories.length} user {aiStories.length === 1 ? "story" : "stories"} identified
          </span>
        )}
      </div>

      <div style={{ paddingBottom: 16 }}>
        {aiStories.map((story, index) => (
          <div key={index}>
            <TestCaseEditor
              aiResult={story}
              setAiResult={(updated) => updateStory(index, updated)}
              handleAccept={() => handleSaveStory(index)}
              handleDiscard={() => (isMultiStory ? removeStory(index) : handleDiscardAll())}
              storyIndex={index}
              title={story.title}
              showActions={false}
              acceptLabel={isEditMode ? "Accept & Save" : "Save This Story"}
            />
            <UIWireframeGenerator
              correctedText={story.correctedText}
              acceptanceCriteria={story.acceptanceCriteria}
              feature={story.feature}
              fields={story.fields}
              businessRules={story.businessRules}
              validations={story.validations}
              edgeCases={story.edgeCases}
              constraints={story.constraints}
              dependencies={story.dependencies}
              businessImpact={story.businessImpact}
              definitionOfReady={story.definitionOfReady}
              definitionOfDone={story.definitionOfDone}
              wireframeApplicable={story.wireframeApplicable}
              savedWireframe={story.wireframe}
              onWireframeChange={(wf) => handleWireframeChange(index, wf)}
              storyIndex={index}
              autoGenerate={
                !isEditMode
                && !story.wireframe?.fullDocument
                && story.wireframe?.applicable !== false
              }
            />
          </div>
        ))}
      </div>

      {/* Sticky save bar */}
      <div style={{
        position: "sticky", bottom: 0, marginLeft: -18, marginRight: -18,
        padding: "12px 18px", background: "var(--bg-overlay)",
        borderTop: "1px solid var(--ai-border)",
        display: "flex", gap: 8, alignItems: "center",
        borderBottomLeftRadius: "var(--radius-lg)", borderBottomRightRadius: "var(--radius-lg)",
      }}>
        <button
          onClick={isMultiStory ? handleSaveAll : () => handleSaveStory(0)}
          disabled={saving}
          style={{
            padding: "10px 22px", borderRadius: "var(--radius)",
            background: "var(--green)", border: "none", color: "#0a0b0f",
            fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving
            ? "Saving…"
            : isMultiStory
              ? `Save All ${aiStories.length} Stories`
              : isEditMode ? "Accept & Save" : "Save Story"}
        </button>
        <button
          onClick={handleDiscardAll}
          style={{
            padding: "10px 16px", borderRadius: "var(--radius)",
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", fontWeight: 500, fontSize: 13, cursor: "pointer",
          }}
        >
          {isMultiStory ? "Discard All" : "Discard"}
        </button>
        {!selectedProjectId && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--yellow)" }}>
            Select a project to save
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="ba-page" style={{ maxWidth: twoPanel ? 1280 : 820, margin: "0 auto" }}>
      <PageHeader
        title={isEditMode ? "Edit Story" : "Add User Story"}
        subtitle={isEditMode
          ? "Update the story, acceptance criteria, and test cases"
          : "Write any content — requirements, notes, or a paragraph — and AI will generate structured user stories"}
      />

      {twoPanel ? (
        <div style={{ display: "grid", gridTemplateColumns: "38% 1fr", gap: 18, alignItems: "start" }}>
          {inputPanel}
          {outputPanel}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {inputPanel}
          {outputPanel}
        </div>
      )}
    </div>
  );
};

export default UserStoryPage;
