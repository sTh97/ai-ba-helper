// import { useState, useEffect } from "react";
// import axios from "../api/axiosInstance";
// import TestCaseEditor from "../pages/components/TestCaseEditor";
// import UIWireframeGenerator from "../pages/components/UIWireframeGenerator";

// const UserStoryPage = () => {
//   const [storyText, setStoryText] = useState("");
//   const [stories, setStories] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [editingStoryId, setEditingStoryId] = useState(null);
//   const [aiResult, setAiResult] = useState(null);
//   const [showAIOutput, setShowAIOutput] = useState(false);
//   const [searchId, setSearchId] = useState("");

//   const [projects, setProjects] = useState([]);
//   const [selectedProjectId, setSelectedProjectId] = useState("");

//   const fetchStories = async () => {
//     try {
//       const res = await axios.get("/stories");
//       setStories(res.data);
//     } catch (err) {
//       console.error("Error fetching stories:", err);
//     }
//   };

//   const fetchProjects = async () => {
//     try {
//       const res = await axios.get("/projects");
//       setProjects(res.data);
//       // if (res.data.length > 0) setSelectedProjectId(res.data[0]._id); // default
//     } catch (err) {
//       console.error("Failed to fetch projects:", err);
//     }
//   };

//   useEffect(() => {
//     fetchStories();
//     fetchProjects();
//   }, []);

//   const handleSubmit = async () => {
//     if (!storyText.trim()) return;
//     setLoading(true);
//     setShowAIOutput(false);
//     setAiResult(null);

//     try {
//       const aiRes = await axios.post("/ai/enhance", {
//         originalText: storyText,
//       });
//       setAiResult(aiRes.data);
//       setShowAIOutput(true);
//     } catch (err) {
//       console.error("AI error:", err);
//       alert("AI enhancement failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEditStory = (story) => {
//     setStoryText(story.originalText);
//     setAiResult({
//       correctedText: story.correctedText || "",
//       acceptanceCriteria: story.acceptanceCriteria || [],
//       happyTests: story.happyTests || [],
//       negativeTests: story.negativeTests || [],
//     });
//     setEditingStoryId(story._id);
//     setSelectedProjectId(story.projectId || "");
//     setShowAIOutput(true);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleAccept = async () => {
//     if (!selectedProjectId) {
//       alert("Please select a project");
//       return;
//     }

//     try {
//       const payload = {
//         originalText: storyText,
//         correctedText: aiResult.correctedText,
//         acceptanceCriteria: aiResult.acceptanceCriteria,
//         happyTests: aiResult.happyTests,
//         negativeTests: aiResult.negativeTests,
//         status: "reviewed",
//         projectId: selectedProjectId,
//       };

//       if (editingStoryId) {
//         await axios.put(`/stories/${editingStoryId}`, payload);
//       } else {
//         await axios.post("/stories", payload);
//       }

//       alert("✅ Story saved!");
//       setStoryText("");
//       setAiResult(null);
//       setEditingStoryId(null);
//       setShowAIOutput(false);
//       fetchStories();
//     } catch (err) {
//       console.error("Save story error:", err);
//       alert("Failed to save story");
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto">
//       <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-10">
//         <h1 className="text-2xl font-bold mb-4 text-gray-800">User Story Manager</h1>

//         {/* Project Selector */}
//         <select
//           className="w-full border p-2 mb-3 rounded"
//           value={selectedProjectId}
//           onChange={(e) => setSelectedProjectId(e.target.value)}
//         >
//           <option value="">-- Select Project --</option>
//           {projects.map((project) => (
//             <option key={project._id} value={project._id}>
//               {project.name}
//             </option>
//           ))}
//         </select>

//         <textarea
//           className="w-full border p-3 rounded mb-3 focus:outline-blue-500"
//           rows="4"
//           placeholder="e.g. As a user, I want to upload my resume so companies can view my profile."
//           value={storyText}
//           onChange={(e) => setStoryText(e.target.value)}
//         />

//         <button
//           onClick={handleSubmit}
//           disabled={loading}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//         >
//           {loading ? "Submitting..." : "Submit Story"}
//         </button>

//         {showAIOutput && aiResult && (
//           <>
//             <TestCaseEditor
//               aiResult={aiResult}
//               setAiResult={setAiResult}
//               handleAccept={handleAccept}
//               handleDiscard={() => {
//                 setShowAIOutput(false);
//                 setAiResult(null);
//                 setEditingStoryId(null);
//               }}
//             />
//             <UIWireframeGenerator
//               correctedText={aiResult.correctedText}
//               acceptanceCriteria={aiResult.acceptanceCriteria}
//             />
//           </>
//         )}

//         <hr className="my-6" />
//         <h2 className="text-xl font-semibold mb-2">📋 Existing Stories</h2>
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="🔍 Search by Story ID..."
//             value={searchId}
//             onChange={(e) => setSearchId(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 rounded"
//           />
//         </div>
//         <ul className="space-y-6">
//           {
//           // stories.map((story) 
//           stories
//             .filter((story) => story._id.toLowerCase().includes(searchId.toLowerCase()))
//             .map((story) => (
//             <li key={story._id} className="border p-4 rounded bg-gray-50">
//               <p><strong>ID:</strong> {story._id}</p>
//               {/* <p><strong>Project:</strong> {projects.find(p => p._id == story.projectId)?.name || "Unassigned"}</p> */}
//               <p><strong>Project:</strong> {story.projectId?.name || "Unassigned"}</p>
//               <p><strong>Original Text:</strong> {story.originalText}</p>
//               <p><strong>Corrected Text:</strong> {story.correctedText || "N/A"}</p>

//               {/* Acceptance Criteria */}
//               <div className="mt-4">
//                 <h3 className="font-semibold mb-1">Acceptance Criteria</h3>
//                 <table className="table-auto w-full border text-sm">
//                   <thead>
//                     <tr className="bg-gray-200">
//                       <th className="border px-2 py-1">S.No</th>
//                       <th className="border px-2 py-1 text-left">Criteria</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {(story.acceptanceCriteria || []).map((criteria, index) => (
//                       <tr key={index}>
//                         <td className="border px-2 py-1 text-center">{index + 1}</td>
//                         <td className="border px-2 py-1">{criteria}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Test Cases */}
//               <div className="mt-4">
//                 <h3 className="font-semibold mb-1">Test Cases</h3>
//                 <table className="table-auto w-full border text-sm">
//                   <thead>
//                     <tr className="bg-gray-200">
//                       <th className="border px-2 py-1">S.No</th>
//                       <th className="border px-2 py-1">Test Case</th>
//                       <th className="border px-2 py-1">Type</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {[...(story.happyTests || []).map((test, index) => (
//                       <tr key={`h-${index}`}>
//                         <td className="border px-2 py-1 text-center">{index + 1}</td>
//                         <td className="border px-2 py-1">{test}</td>
//                         <td className="border px-2 py-1 text-green-700">Positive</td>
//                       </tr>
//                     )),
//                     ...(story.negativeTests || []).map((test, index) => (
//                       <tr key={`n-${index}`}>
//                         <td className="border px-2 py-1 text-center">{index + 1}</td>
//                         <td className="border px-2 py-1">{test}</td>
//                         <td className="border px-2 py-1 text-red-700">Negative</td>
//                       </tr>
//                     ))]}
//                   </tbody>
//                 </table>
//               </div>

//               <p className="mt-3 text-sm text-gray-600"><strong>Created:</strong> {new Date(story.createdAt).toLocaleString()}</p>
//               <p className="text-sm text-gray-600"><strong>Updated:</strong> {new Date(story.updatedAt).toLocaleString()}</p>

//               <div className="flex space-x-2 mt-4">
//                 <button
//                   onClick={() => handleEditStory(story)}
//                   className="bg-yellow-500 text-white px-3 py-1 rounded"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={async () => {
//                     const confirm = window.confirm("Are you sure you want to delete?");
//                     if (!confirm) return;
//                     await axios.delete(`/stories/${story._id}`);
//                     fetchStories();
//                   }}
//                   className="bg-red-600 text-white px-3 py-1 rounded"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default UserStoryPage;


import { useState, useEffect } from "react";
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
  const [storyText, setStoryText] = useState("");
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [showAIOutput, setShowAIOutput] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [expandedStory, setExpandedStory] = useState(null);

  const fetchStories = async () => {
    try { const res = await axios.get("/stories"); setStories(res.data); } catch (e) {}
  };
  const fetchProjects = async () => {
    try { const res = await axios.get("/projects"); setProjects(res.data); } catch (e) {}
  };

  useEffect(() => { fetchStories(); fetchProjects(); }, []);

  const handleSubmit = async () => {
    if (!storyText.trim()) return;
    setLoading(true); setShowAIOutput(false); setAiResult(null);
    try {
      const aiRes = await axios.post("/ai/enhance", { originalText: storyText });
      setAiResult(aiRes.data); setShowAIOutput(true);
    } catch { alert("AI enhancement failed."); }
    finally { setLoading(false); }
  };

  const handleEditStory = (story) => {
    setStoryText(story.originalText);
    setAiResult({
      correctedText: story.correctedText || "",
      acceptanceCriteria: story.acceptanceCriteria || [],
      happyTests: story.happyTests || [],
      negativeTests: story.negativeTests || [],
    });
    setEditingStoryId(story._id);
    setSelectedProjectId(story.projectId || "");
    setShowAIOutput(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAccept = async () => {
    if (!selectedProjectId) { alert("Please select a project"); return; }
    try {
      const payload = {
        originalText: storyText, correctedText: aiResult.correctedText,
        acceptanceCriteria: aiResult.acceptanceCriteria,
        happyTests: aiResult.happyTests, negativeTests: aiResult.negativeTests,
        status: "reviewed", projectId: selectedProjectId,
      };
      if (editingStoryId) { await axios.put(`/stories/${editingStoryId}`, payload); }
      else { await axios.post("/stories", payload); }
      setStoryText(""); setAiResult(null); setEditingStoryId(null); setShowAIOutput(false);
      fetchStories();
    } catch { alert("Failed to save story"); }
  };

  const filteredStories = stories.filter(s =>
    s._id.toLowerCase().includes(searchId.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", margin: 0 }}>
          User Stories
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          AI-enhanced user story management with acceptance criteria and test cases
        </p>
      </div>

      {/* Input Card */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
      }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", margin: "0 0 16px" }}>
          {editingStoryId ? "Edit Story" : "New User Story"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          >
            <option value="">— Select Project —</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 90 }}
            placeholder='e.g. "As a user, I want to upload my resume so companies can view my profile."'
            value={storyText}
            onChange={e => setStoryText(e.target.value)}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />

          <button
            onClick={handleSubmit}
            disabled={loading || !storyText.trim()}
            style={{
              alignSelf: "flex-start", padding: "9px 20px",
              borderRadius: "var(--radius)", border: "none",
              background: loading ? "var(--bg-elevated)" : "var(--accent)",
              color: loading ? "var(--text-muted)" : "white",
              fontWeight: 600, fontSize: 13, cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 8, opacity: !storyText.trim() ? 0.5 : 1,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: "inline-block", width: 12, height: 12,
                  border: "2px solid var(--accent)44", borderTopColor: "var(--accent)",
                  borderRadius: "50%", animation: "spin 0.7s linear infinite",
                }} />
                Enhancing with AI…
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </>
            ) : "✨ Enhance with AI"}
          </button>
        </div>

        {showAIOutput && aiResult && (
          <>
            <TestCaseEditor
              aiResult={aiResult}
              setAiResult={setAiResult}
              handleAccept={handleAccept}
              handleDiscard={() => { setShowAIOutput(false); setAiResult(null); setEditingStoryId(null); }}
            />
            <UIWireframeGenerator
              correctedText={aiResult.correctedText}
              acceptanceCriteria={aiResult.acceptanceCriteria}
            />
          </>
        )}
      </div>

      {/* Story List */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
            Existing Stories
            <span style={{
              marginLeft: 8, fontSize: 11, padding: "2px 8px",
              background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)",
            }}>{stories.length}</span>
          </span>
          <input
            type="text"
            style={{ ...inputStyle, width: 200, fontSize: 12, padding: "7px 12px" }}
            placeholder="Search by ID…"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {filteredStories.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            {searchId ? "No stories match your search." : "No stories yet."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredStories.map((story, i) => (
              <StoryCard
                key={story._id}
                story={story}
                isLast={i === filteredStories.length - 1}
                expanded={expandedStory === story._id}
                onToggle={() => setExpandedStory(expandedStory === story._id ? null : story._id)}
                onEdit={() => handleEditStory(story)}
                onDelete={async () => {
                  if (!window.confirm("Delete this story?")) return;
                  await axios.delete(`/stories/${story._id}`);
                  fetchStories();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StoryCard = ({ story, isLast, expanded, onToggle, onEdit, onDelete }) => (
  <div style={{ borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
    <div
      onClick={onToggle}
      style={{
        padding: "14px 20px", cursor: "pointer",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        transition: "background 0.12s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 99,
            background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600,
            letterSpacing: "0.3px",
          }}>Story</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {story._id.slice(-8)}
          </span>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 99,
            background: "var(--bg-elevated)", color: "var(--text-muted)",
          }}>{story.projectId?.name || "Unassigned"}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {story.originalText}
        </p>
      </div>
      <span style={{ color: "var(--text-muted)", fontSize: 12, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.18s", flexShrink: 0 }}>▾</span>
    </div>

    {expanded && (
      <div style={{ padding: "0 20px 16px", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        {story.correctedText && (
          <div style={{ marginBottom: 14 }}>
            <Label>Corrected Story</Label>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{story.correctedText}</p>
          </div>
        )}
        <MiniTable title="Acceptance Criteria" rows={(story.acceptanceCriteria || []).map((c, i) => [i + 1, c])} colTypes={["num", "text"]} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <MiniTable title="Positive Tests" rows={(story.happyTests || []).map((t, i) => [t])} type="positive" />
          <MiniTable title="Negative Tests" rows={(story.negativeTests || []).map((t, i) => [t])} type="negative" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
          <button
            onClick={onEdit}
            style={{
              padding: "6px 14px", borderRadius: 7,
              background: "var(--accent-soft)", border: "1px solid var(--accent)22",
              color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}
          >Edit</button>
          <button
            onClick={onDelete}
            style={{
              padding: "6px 14px", borderRadius: 7,
              background: "var(--red-soft)", border: "1px solid var(--red)22",
              color: "var(--red)", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}
          >Delete</button>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
            Updated {new Date(story.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    )}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
    {children}
  </div>
);

const MiniTable = ({ title, rows, type }) => (
  <div>
    <Label>{title}</Label>
    {rows.length === 0 ? (
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>None</div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            padding: "7px 10px", borderRadius: 7, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4,
            background: type === "positive" ? "var(--green-soft)" : type === "negative" ? "var(--red-soft)" : "var(--bg-elevated)",
            border: `1px solid ${type === "positive" ? "var(--green)" : type === "negative" ? "var(--red)" : "var(--border)"}22`,
          }}>
            {row.length > 1 ? <><strong style={{ color: "var(--text-muted)" }}>{row[0]}.</strong> {row[1]}</> : row[0]}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default UserStoryPage;