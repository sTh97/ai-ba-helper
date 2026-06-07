// import { useState, useEffect } from "react";
// import axios from "../../api/axiosInstance";
// import { Copy } from "lucide-react"; // optional icon, use any icon lib or remove

// const UIWireframeGenerator = ({ correctedText, acceptanceCriteria }) => {
//   const [jsxCode, setJsxCode] = useState("");
//   const [uiHtml, setUiHtml] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showCode, setShowCode] = useState(false);

//   useEffect(() => {
//     const generateUI = async () => {
//       if (!correctedText || !acceptanceCriteria?.length) return;

//       setLoading(true);
//       try {
//         const res = await axios.post("/ai/generate-ui", {
//           correctedText,
//           acceptanceCriteria,
//         });

//         setJsxCode(res.data.jsxCode);
//         setUiHtml(res.data.jsxCode); // Rendering as raw HTML
//       } catch (err) {
//         console.error("Failed to generate UI:", err);
//         alert("UI generation failed.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     generateUI();
//   }, [correctedText, acceptanceCriteria]);

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(jsxCode);
//     alert("✅ JSX code copied!");
//   };

//   return (
//     <div className="mt-8 bg-white rounded border border-blue-300 p-6 shadow">
//       <h3 className="text-lg font-semibold text-blue-700 mb-4">🧩 Generated Wireframe Preview</h3>

//       {loading ? (
//         <p className="text-gray-500">Generating UI...</p>
//       ) : (
//         <>
//           <div
//             className="border rounded p-4 bg-gray-50 mb-4"
//             dangerouslySetInnerHTML={{ __html: uiHtml }}
//           />

//           <button
//             onClick={() => setShowCode((prev) => !prev)}
//             className="text-sm text-blue-600 hover:underline mb-2"
//           >
//             {showCode ? "Hide JSX Code" : "Show JSX Code"}
//           </button>

//           {showCode && (
//             <div className="relative">
//               <pre className="bg-gray-900 text-green-200 p-4 rounded overflow-auto text-sm">
//                 <code>{jsxCode}</code>
//               </pre>
//               <button
//                 onClick={copyToClipboard}
//                 className="absolute top-2 right-2 text-white hover:text-green-400"
//                 title="Copy JSX"
//               >
//                 <Copy size={16} />
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default UIWireframeGenerator;



import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";

const UIWireframeGenerator = ({ correctedText, acceptanceCriteria }) => {
  const [jsxCode, setJsxCode] = useState("");
  const [uiHtml, setUiHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generateUI = async () => {
      if (!correctedText || !acceptanceCriteria?.length) return;
      setLoading(true);
      try {
        const res = await axios.post("/ai/generate-ui", { correctedText, acceptanceCriteria });
        setJsxCode(res.data.jsxCode);
        setUiHtml(res.data.jsxCode);
      } catch {
        console.error("UI generation failed.");
      } finally { setLoading(false); }
    };
    generateUI();
  }, [correctedText, acceptanceCriteria]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsxCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            Generating UI wireframe…
          </div>
        ) : jsxCode ? (
          <>
            <div style={{
              border: "1px solid var(--border)", borderRadius: "var(--radius)",
              padding: 16, background: "var(--bg-base)", marginBottom: 12,
              minHeight: 80,
            }}
              dangerouslySetInnerHTML={{ __html: uiHtml }}
            />

            <button
              onClick={() => setShowCode(p => !p)}
              style={{
                padding: "6px 14px", borderRadius: 7,
                background: "var(--yellow-soft)", border: "1px solid var(--yellow)33",
                color: "var(--yellow)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                marginBottom: showCode ? 10 : 0,
              }}
            >{showCode ? "Hide Code" : "View JSX Code"}</button>

            {showCode && (
              <div style={{ position: "relative" }}>
                <pre style={{
                  background: "#0d1117", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "14px 16px",
                  overflowX: "auto", fontSize: 12, lineHeight: 1.6,
                  color: "#7ee787", margin: 0, maxHeight: 320,
                }}>
                  <code>{jsxCode}</code>
                </pre>
                <button
                  onClick={copyToClipboard}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    padding: "4px 10px", borderRadius: 6,
                    background: copied ? "var(--green-soft)" : "var(--bg-overlay)",
                    border: "1px solid var(--border)",
                    color: copied ? "var(--green)" : "var(--text-secondary)",
                    fontSize: 11, fontWeight: 500, cursor: "pointer",
                  }}
                >{copied ? "✓ Copied" : "Copy"}</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            No wireframe generated yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default UIWireframeGenerator;