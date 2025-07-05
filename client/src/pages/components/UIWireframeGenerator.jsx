// UIWireframeGenerator.jsx
// const UIWireframeGenerator = ({ aiResult }) => {
//   if (!aiResult) return null;

//   return (
//     <div className="mt-8 p-4 bg-white border rounded shadow">
//       <h3 className="text-lg font-bold mb-3 text-blue-600">🧩 Auto-Generated UI Wireframe</h3>
//       <p className="text-sm text-gray-600 mb-4">Based on corrected story and acceptance criteria:</p>

//       {/* Show wireframe */}
//       <div className="border p-4 bg-gray-50 rounded">
//         <p className="text-gray-500 italic">[Wireframe preview will appear here]</p>
//       </div>
//     </div>
//   );
// };

// export default UIWireframeGenerator;

import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import { Copy } from "lucide-react"; // optional icon, use any icon lib or remove

const UIWireframeGenerator = ({ correctedText, acceptanceCriteria }) => {
  const [jsxCode, setJsxCode] = useState("");
  const [uiHtml, setUiHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const generateUI = async () => {
      if (!correctedText || !acceptanceCriteria?.length) return;

      setLoading(true);
      try {
        const res = await axios.post("/ai/generate-ui", {
          correctedText,
          acceptanceCriteria,
        });

        setJsxCode(res.data.jsxCode);
        setUiHtml(res.data.jsxCode); // Rendering as raw HTML
      } catch (err) {
        console.error("Failed to generate UI:", err);
        alert("UI generation failed.");
      } finally {
        setLoading(false);
      }
    };

    generateUI();
  }, [correctedText, acceptanceCriteria]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsxCode);
    alert("✅ JSX code copied!");
  };

  return (
    <div className="mt-8 bg-white rounded border border-blue-300 p-6 shadow">
      <h3 className="text-lg font-semibold text-blue-700 mb-4">🧩 Generated Wireframe Preview</h3>

      {loading ? (
        <p className="text-gray-500">Generating UI...</p>
      ) : (
        <>
          <div
            className="border rounded p-4 bg-gray-50 mb-4"
            dangerouslySetInnerHTML={{ __html: uiHtml }}
          />

          <button
            onClick={() => setShowCode((prev) => !prev)}
            className="text-sm text-blue-600 hover:underline mb-2"
          >
            {showCode ? "Hide JSX Code" : "Show JSX Code"}
          </button>

          {showCode && (
            <div className="relative">
              <pre className="bg-gray-900 text-green-200 p-4 rounded overflow-auto text-sm">
                <code>{jsxCode}</code>
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 text-white hover:text-green-400"
                title="Copy JSX"
              >
                <Copy size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UIWireframeGenerator;

