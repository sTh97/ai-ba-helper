import { useState, useEffect, useRef } from "react";
import axios from "../../api/axiosInstance";

const inputStyle = {
  width: "100%", padding: "8px 12px",
  background: "var(--bg-base)", border: "1px solid var(--border)",
  borderRadius: 7, color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
  resize: "vertical", boxSizing: "border-box",
};

const applyWireframe = (data) => ({
  applicable: data.applicable !== false,
  message: data.message || "",
  html: data.html || "",
  css: data.css || "",
  js: data.js || "",
  fullDocument: data.fullDocument || "",
});

const UIWireframeGenerator = ({
  correctedText,
  acceptanceCriteria,
  feature = "",
  fields = [],
  businessRules = [],
  validations = [],
  edgeCases = [],
  constraints = [],
  dependencies = [],
  businessImpact = "",
  definitionOfReady = [],
  definitionOfDone = [],
  wireframeApplicable = true,
  savedWireframe = null,
  onWireframeChange,
  autoGenerate = true,
  storyIndex = 0,
}) => {
  const [fullDocument, setFullDocument] = useState("");
  const [sourceCode, setSourceCode] = useState({ html: "", css: "", js: "" });
  const [loading, setLoading] = useState(false);
  const [notApplicable, setNotApplicable] = useState(false);
  const [naMessage, setNaMessage] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [codeTab, setCodeTab] = useState("html");
  const [copied, setCopied] = useState(false);
  const [regenerateNotes, setRegenerateNotes] = useState("");
  const [hasSavedWireframe, setHasSavedWireframe] = useState(false);
  const initialLoadDone = useRef(false);

  const notifyChange = (data) => {
    onWireframeChange?.(applyWireframe(data));
  };

  const loadWireframeData = (data) => {
    const wf = applyWireframe(data);
    if (!wf.applicable) {
      setNotApplicable(true);
      setNaMessage(wf.message || "View not applicable for this user story");
      setFullDocument("");
      setSourceCode({ html: "", css: "", js: "" });
    } else if (wf.fullDocument) {
      setNotApplicable(false);
      setFullDocument(wf.fullDocument);
      setSourceCode({ html: wf.html, css: wf.css, js: wf.js });
    }
    notifyChange(wf);
  };

  const generateUI = async (isRegenerate = false) => {
    if (!correctedText) return;

    if (wireframeApplicable === false) {
      loadWireframeData({
        applicable: false,
        message: "View not applicable for this user story",
      });
      return;
    }

    setLoading(true);
    setNotApplicable(false);
    setNaMessage("");
    setGenerationError("");

    try {
      const res = await axios.post("/ai/generate-ui", {
        correctedText,
        acceptanceCriteria,
        feature,
        fields,
        businessRules,
        validations,
        edgeCases,
        constraints,
        dependencies,
        businessImpact,
        definitionOfReady,
        definitionOfDone,
        wireframeApplicable,
        regenerateNotes: isRegenerate ? regenerateNotes : undefined,
        existingWireframe: isRegenerate ? sourceCode : undefined,
      });

      loadWireframeData(res.data);
      if (isRegenerate) setHasSavedWireframe(true);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to generate wireframe for this story.";
      console.error("UI generation failed:", err.response?.data || err.message);
      setGenerationError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Load saved wireframe on mount — do not auto-regenerate
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    if (savedWireframe && (savedWireframe.fullDocument || savedWireframe.applicable === false)) {
      setHasSavedWireframe(true);
      loadWireframeData(savedWireframe);
      return;
    }

    if (autoGenerate && correctedText && wireframeApplicable !== false) {
      const delayMs = storyIndex * 2500;
      const timer = setTimeout(() => generateUI(false), delayMs);
      return () => clearTimeout(timer);
    }

    if (wireframeApplicable === false) {
      loadWireframeData({
        applicable: false,
        message: "View not applicable for this user story",
      });
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeContent = codeTab === "html" ? sourceCode.html
    : codeTab === "css" ? sourceCode.css
    : sourceCode.js;

  const canRegenerate = wireframeApplicable !== false && !loading;

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderLeft: "3px solid var(--yellow)",
      borderRadius: "var(--radius-lg)", marginTop: 14, overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--bg-elevated)",
      }}>
        <span style={{ fontSize: 14 }}>🧩</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
          Generated Wireframe
        </span>
        {hasSavedWireframe && !loading && !generationError && (
          <span style={{
            marginLeft: "auto", fontSize: 10, padding: "2px 8px",
            background: "var(--green-soft)", borderRadius: 99, color: "var(--green)", fontWeight: 600,
          }}>Saved</span>
        )}
        {generationError && !loading && (
          <span style={{
            marginLeft: "auto", fontSize: 10, padding: "2px 8px",
            background: "var(--red-soft)", borderRadius: 99, color: "var(--red)", fontWeight: 600,
          }}>Failed</span>
        )}
      </div>

      <div style={{ padding: 20 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)", fontSize: 13, padding: "8px 0" }}>
            <span style={{
              display: "inline-block", width: 14, height: 14,
              border: "2px solid var(--yellow)33", borderTopColor: "var(--yellow)",
              borderRadius: "50%", animation: "spin 0.7s linear infinite",
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Generating wireframe preview…
          </div>
        ) : notApplicable ? (
          <div style={{
            padding: "28px 20px", textAlign: "center",
            background: "var(--bg-base)", border: "1px dashed var(--border)",
            borderRadius: "var(--radius)",
          }}>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.5 }}>🚫</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
              Preview Not Applicable
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{naMessage}</div>
          </div>
        ) : generationError ? (
          <div style={{
            padding: "20px 16px", background: "var(--bg-base)",
            border: "1px dashed var(--red)44", borderRadius: "var(--radius)",
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--red)", marginBottom: 6 }}>
              Wireframe generation failed for this story
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
              {generationError} Other stories will continue generating independently.
            </div>
            <button
              onClick={() => generateUI(false)}
              disabled={loading}
              style={{
                padding: "7px 16px", borderRadius: 7,
                background: "var(--accent-soft)", border: "1px solid var(--accent)33",
                color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Retry Wireframe
            </button>
          </div>
        ) : fullDocument ? (
          <>
            <div style={{
              border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
              overflow: "hidden", marginBottom: 12,
              boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
            }}>
              <div style={{
                background: "#1e1e2e", padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10,
                borderBottom: "1px solid #2d2d3d",
              }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                    <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
                  ))}
                </div>
                <div style={{
                  flex: 1, background: "#2a2a3c", borderRadius: 6,
                  padding: "5px 12px", fontSize: 11, color: "#8888a0",
                  fontFamily: "monospace", textAlign: "center",
                }}>
                  preview://wireframe.local
                </div>
              </div>

              <iframe
                title="Wireframe Preview"
                srcDoc={fullDocument}
                sandbox="allow-scripts"
                style={{
                  width: "100%", height: 420, border: "none",
                  background: "#ffffff", display: "block",
                }}
              />
            </div>

            <button
              onClick={() => setShowCode((p) => !p)}
              style={{
                padding: "6px 14px", borderRadius: 7,
                background: "var(--yellow-soft)", border: "1px solid var(--yellow)33",
                color: "var(--yellow)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                marginBottom: showCode ? 10 : 0,
              }}
            >{showCode ? "Hide Code" : "View HTML / CSS / JS"}</button>

            {showCode && (
              <div style={{ position: "relative", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {["html", "css", "js"].map((tab) => (
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
                    >{tab}</button>
                  ))}
                </div>
                <pre style={{
                  background: "#0d1117", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "14px 16px",
                  overflowX: "auto", fontSize: 12, lineHeight: 1.6,
                  color: "#7ee787", margin: 0, maxHeight: 320,
                }}>
                  <code>{codeContent}</code>
                </pre>
                <button
                  onClick={copyToClipboard}
                  style={{
                    position: "absolute", top: 42, right: 10,
                    padding: "4px 10px", borderRadius: 6,
                    background: copied ? "var(--green-soft)" : "var(--bg-overlay)",
                    border: "1px solid var(--border)",
                    color: copied ? "var(--green)" : "var(--text-secondary)",
                    fontSize: 11, fontWeight: 500, cursor: "pointer",
                  }}
                >{copied ? "✓ Copied" : "Copy Full HTML"}</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
            No wireframe generated yet.
          </div>
        )}

        {canRegenerate && (
          <div style={{
            marginTop: fullDocument || notApplicable ? 12 : 0,
            paddingTop: fullDocument || notApplicable ? 14 : 0,
            borderTop: fullDocument || notApplicable ? "1px solid var(--border)" : "none",
          }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
              Regenerate wireframe (optional details)
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 64, marginBottom: 8 }}
              placeholder="e.g. Add a sidebar navigation, use a table layout for the list, include a search bar at the top…"
              value={regenerateNotes}
              onChange={(e) => setRegenerateNotes(e.target.value)}
            />
            <button
              onClick={() => generateUI(true)}
              disabled={loading}
              style={{
                padding: "7px 16px", borderRadius: 7,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", fontSize: 12, fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {fullDocument ? "Regenerate Wireframe" : "Generate Wireframe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UIWireframeGenerator;
