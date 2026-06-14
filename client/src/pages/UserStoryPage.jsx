import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import TestCaseEditor from "../pages/components/TestCaseEditor";
import UIWireframeGenerator from "../pages/components/UIWireframeGenerator";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s", boxSizing: "border-box",
};

const UserStoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [contentText, setContentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [aiStories, setAiStories] = useState([]);
  const [showAIOutput, setShowAIOutput] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [featureInput, setFeatureInput] = useState("");

  const isEditMode = Boolean(editingStoryId);
  const isMultiStory = !isEditMode && aiStories.length > 1;

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
      if (next.length === 0) {
        setShowAIOutput(false);
      }
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
        alert("AI did not generate any user stories. Please try again.");
        return;
      }

      const typedFeature = featureInput.trim();
      const withFeature = stories.map((s) => ({
        ...s,
        feature: typedFeature || s.feature || "",
      }));

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
      alert(typeof msg === "string" ? msg : "AI analysis failed. Please try again.");
      console.error("AI enhance error:", data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStory = async (index) => {
    if (!selectedProjectId) {
      alert("Please select a project");
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

      if (isEditMode) {
        resetForm();
      } else {
        removeStory(index);
      }
    } catch {
      alert("Failed to save story");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedProjectId) {
      alert("Please select a project");
      return;
    }
    if (aiStories.length === 0) return;

    setSaving(true);
    try {
      await Promise.all(
        aiStories.map((story) => axios.post("/stories", buildPayload(story)))
      );
      resetForm();
    } catch {
      alert("Failed to save stories");
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
    if (isEditMode) {
      resetForm();
    } else {
      setShowAIOutput(false);
      setAiStories([]);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", margin: 0 }}>
          {isEditMode ? "Edit Story" : "Add User Story"}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          {isEditMode
            ? "Update the story, acceptance criteria, and test cases"
            : "Write any content — requirements, notes, or a paragraph — and AI will analyze it and generate user stories"}
        </p>
      </div>

      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "22px 24px",
      }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", margin: "0 0 16px" }}>
          {isEditMode ? "Edit Story" : "Content Input"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          >
            <option value="">— Select Project —</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          {!isEditMode && (
            <input
              style={inputStyle}
              placeholder="Feature / module (e.g. Leave Management) — links these stories to a feature"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          )}

          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
            placeholder="Write any paragraph, requirements, meeting notes, or feature description. AI will analyze it and generate properly formatted user stories…"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            disabled={isEditMode}
          />

          {!isEditMode && (
            <button
              onClick={handleSubmit}
              disabled={loading || !contentText.trim()}
              style={{
                alignSelf: "flex-start", padding: "9px 20px",
                borderRadius: "var(--radius)", border: "none",
                background: loading ? "var(--bg-elevated)" : "var(--accent)",
                color: loading ? "var(--text-muted)" : "white",
                fontWeight: 600, fontSize: 13, cursor: loading ? "wait" : "pointer",
                display: "flex", alignItems: "center", gap: 8, opacity: !contentText.trim() ? 0.5 : 1,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    display: "inline-block", width: 12, height: 12,
                    border: "2px solid var(--accent)44", borderTopColor: "var(--accent)",
                    borderRadius: "50%", animation: "spin 0.7s linear infinite",
                  }} />
                  Analyzing content…
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </>
              ) : "✨ Analyze & Generate User Stories (may take 1-2 min)"}
            </button>
          )}
        </div>

        {showAIOutput && aiStories.length > 0 && (
          <>
            {!isEditMode && (
              <div style={{
                marginTop: 20, padding: "12px 16px",
                background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                borderRadius: "var(--radius)", fontSize: 13, color: "var(--accent)",
              }}>
                AI identified <strong>{aiStories.length}</strong> user {aiStories.length === 1 ? "story" : "stories"} from your content.
              </div>
            )}

            {aiStories.map((story, index) => (
              <div key={index}>
                <TestCaseEditor
                  aiResult={story}
                  setAiResult={(updated) => updateStory(index, updated)}
                  handleAccept={() => handleSaveStory(index)}
                  handleDiscard={() => (isMultiStory ? removeStory(index) : handleDiscardAll())}
                  storyIndex={index}
                  title={story.title}
                  showActions={!isMultiStory}
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

            {isMultiStory && (
              <div style={{
                display: "flex", gap: 8, marginTop: 20, paddingTop: 16,
                borderTop: "1px solid var(--border)",
              }}>
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  style={{
                    padding: "10px 24px", borderRadius: "var(--radius)",
                    background: "var(--green)", border: "none", color: "#0a0b0f",
                    fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving…" : `Save All ${aiStories.length} Stories`}
                </button>
                <button
                  onClick={handleDiscardAll}
                  style={{
                    padding: "10px 16px", borderRadius: "var(--radius)",
                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    color: "var(--text-secondary)", fontWeight: 500, fontSize: 13, cursor: "pointer",
                  }}
                >
                  Discard All
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserStoryPage;
