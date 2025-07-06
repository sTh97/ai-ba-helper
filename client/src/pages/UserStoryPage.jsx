// import { useState, useEffect } from "react";
// import axios from "../api/axiosInstance";
// import TestCaseEditor from "../pages/components/TestCaseEditor";
// import UIWireframeGenerator from "../pages/components/UIWireframeGenerator";
// // import MainLayout from "../pages/layout/MainLayout";

// console.log("UserStoryPage rendered");


// const UserStoryPage = () => {
//   const [storyText, setStoryText] = useState("");
//   const [stories, setStories] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [editingStoryId, setEditingStoryId] = useState(null);

//   const [aiResult, setAiResult] = useState(null);
//   const [showAIOutput, setShowAIOutput] = useState(false);

//   const fetchStories = async () => {
//     try {
//       const res = await axios.get("/stories");
//       setStories(res.data);
//     } catch (err) {
//       console.error("Error fetching stories:", err);
//     }
//   };

//   useEffect(() => {
//     fetchStories();
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

// const handleEditStory = (story) => {
//   setStoryText(story.originalText);
//   setAiResult({
//     correctedText: story.correctedText || "",
//     acceptanceCriteria: story.acceptanceCriteria || [],
//     happyTests: story.happyTests || [],
//     negativeTests: story.negativeTests || [],
//   });
//   setEditingStoryId(story._id);
//   setShowAIOutput(true);
//   window.scrollTo({ top: 0, behavior: "smooth" });
// };


//   const handleAccept = async () => {
//   try {
//     const payload = {
//       originalText: storyText,
//       correctedText: aiResult.correctedText,
//       acceptanceCriteria: aiResult.acceptanceCriteria,
//       happyTests: aiResult.happyTests,
//       negativeTests: aiResult.negativeTests,
//       status: "reviewed",
//     };

//     if (editingStoryId) {
//       await axios.put(`/stories/${editingStoryId}`, payload);
//     } else {
//       await axios.post("/stories", payload);
//     }

//     alert("✅ Story saved!");
//     setStoryText("");
//     setAiResult(null);
//     setEditingStoryId(null);
//     setShowAIOutput(false);
//     fetchStories();
//   } catch (err) {
//     console.error("Save story error:", err);
//     alert("Failed to save story");
//   }
// };

//   return (
//       <div className="max-w-3xl mx-auto">
//         <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-10">
//       <h1 className="text-2xl font-bold mb-4 text-gray-800">User Story Manager</h1>

//       <textarea
//         className="w-full border p-3 rounded mb-3 focus:outline-blue-500"
//         rows="4"
//         placeholder="e.g. As a user, I want to upload my resume so companies can view my profile."
//         value={storyText}
//         onChange={(e) => setStoryText(e.target.value)}
//       />

//       <button
//         onClick={handleSubmit}
//         disabled={loading}
//         className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//       >
//         {loading ? "Submitting..." : "Submit Story"}
//       </button>

//       {showAIOutput && aiResult && (
//          <>
//          <TestCaseEditor
//           aiResult={aiResult}
//           setAiResult={setAiResult}
//           handleAccept={handleAccept}
//           handleDiscard={() => {
//             setShowAIOutput(false);
//             setAiResult(null);
//             setEditingStoryId(null);
//           }}
//         />
//         <UIWireframeGenerator 
//         // aiResult={aiResult} 
//         correctedText={aiResult.correctedText}
//       acceptanceCriteria={aiResult.acceptanceCriteria}
//         />
//         </>
//       )}

//       <hr className="my-6" />
//       {/*Existing stories below*/}
//       <h2 className="text-xl font-semibold mb-2">📋 Existing Stories</h2>
//       <ul className="space-y-6">
//         {stories.map((story) => (
//           <li key={story._id} className="border p-4 rounded bg-gray-50">
//             <p><strong>ID:</strong> {story._id}</p>
//             <p><strong>Original Text:</strong> {story.originalText}</p>
//             <p><strong>Corrected Text:</strong> {story.correctedText || "N/A"}</p>

//             <div className="mt-4">
//               <h3 className="font-semibold mb-1">Acceptance Criteria</h3>
//               <table className="table-auto w-full border text-sm">
//                 <thead>
//                   <tr className="bg-gray-200">
//                     <th className="border px-2 py-1">S.No</th>
//                     <th className="border px-2 py-1 text-left">Criteria</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {(story.acceptanceCriteria || []).map((criteria, index) => (
//                     <tr key={index}>
//                       <td className="border px-2 py-1 text-center">{index + 1}</td>
//                       <td className="border px-2 py-1">{criteria}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="mt-4">
//               <h3 className="font-semibold mb-1">Test Cases</h3>
//               <table className="table-auto w-full border text-sm">
//                 <thead>
//                   <tr className="bg-gray-200">
//                     <th className="border px-2 py-1">S.No</th>
//                     <th className="border px-2 py-1">Test Case</th>
//                     <th className="border px-2 py-1">Type</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {[...(story.happyTests || []).map((test, index) => (
//                     <tr key={`h-${index}`}>
//                       <td className="border px-2 py-1 text-center">{index + 1}</td>
//                       <td className="border px-2 py-1">{test}</td>
//                       <td className="border px-2 py-1 text-green-700">Positive</td>
//                     </tr>
//                   )),
//                   ...(story.negativeTests || []).map((test, index) => (
//                     <tr key={`n-${index}`}>
//                       <td className="border px-2 py-1 text-center">{index + 1}</td>
//                       <td className="border px-2 py-1">{test}</td>
//                       <td className="border px-2 py-1 text-red-700">Negative</td>
//                     </tr>
//                   ))]}
//                 </tbody>
//               </table>
//             </div>

//             <p className="mt-3 text-sm text-gray-600"><strong>Created:</strong> {new Date(story.createdAt).toLocaleString()}</p>
//             <p className="text-sm text-gray-600"><strong>Updated:</strong> {new Date(story.updatedAt).toLocaleString()}</p>

//             <div className="flex space-x-2 mt-4">
//               <button
//                 onClick={() => handleEditStory(story)}
//                 className="bg-yellow-500 text-white px-3 py-1 rounded"
//               >
//                 Edit
//               </button>

//               <button
//                 onClick={async () => {
//                   const confirm = window.confirm("Are you sure you want to delete?");
//                   if (!confirm) return;
//                   await axios.delete(`/stories/${story._id}`);
//                   fetchStories();
//                 }}
//                 className="bg-red-600 text-white px-3 py-1 rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//       </div>
//   );
// };

// export default UserStoryPage;


import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import TestCaseEditor from "../pages/components/TestCaseEditor";
import UIWireframeGenerator from "../pages/components/UIWireframeGenerator";

const UserStoryPage = () => {
  const [storyText, setStoryText] = useState("");
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [showAIOutput, setShowAIOutput] = useState(false);

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const fetchStories = async () => {
    try {
      const res = await axios.get("/stories");
      setStories(res.data);
    } catch (err) {
      console.error("Error fetching stories:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/projects");
      setProjects(res.data);
      // if (res.data.length > 0) setSelectedProjectId(res.data[0]._id); // default
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  useEffect(() => {
    fetchStories();
    fetchProjects();
  }, []);

  const handleSubmit = async () => {
    if (!storyText.trim()) return;
    setLoading(true);
    setShowAIOutput(false);
    setAiResult(null);

    try {
      const aiRes = await axios.post("/ai/enhance", {
        originalText: storyText,
      });
      setAiResult(aiRes.data);
      setShowAIOutput(true);
    } catch (err) {
      console.error("AI error:", err);
      alert("AI enhancement failed.");
    } finally {
      setLoading(false);
    }
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
    if (!selectedProjectId) {
      alert("Please select a project");
      return;
    }

    try {
      const payload = {
        originalText: storyText,
        correctedText: aiResult.correctedText,
        acceptanceCriteria: aiResult.acceptanceCriteria,
        happyTests: aiResult.happyTests,
        negativeTests: aiResult.negativeTests,
        status: "reviewed",
        projectId: selectedProjectId,
      };

      if (editingStoryId) {
        await axios.put(`/stories/${editingStoryId}`, payload);
      } else {
        await axios.post("/stories", payload);
      }

      alert("✅ Story saved!");
      setStoryText("");
      setAiResult(null);
      setEditingStoryId(null);
      setShowAIOutput(false);
      fetchStories();
    } catch (err) {
      console.error("Save story error:", err);
      alert("Failed to save story");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-10">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">User Story Manager</h1>

        {/* Project Selector */}
        <select
          className="w-full border p-2 mb-3 rounded"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">-- Select Project --</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>

        <textarea
          className="w-full border p-3 rounded mb-3 focus:outline-blue-500"
          rows="4"
          placeholder="e.g. As a user, I want to upload my resume so companies can view my profile."
          value={storyText}
          onChange={(e) => setStoryText(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {loading ? "Submitting..." : "Submit Story"}
        </button>

        {showAIOutput && aiResult && (
          <>
            <TestCaseEditor
              aiResult={aiResult}
              setAiResult={setAiResult}
              handleAccept={handleAccept}
              handleDiscard={() => {
                setShowAIOutput(false);
                setAiResult(null);
                setEditingStoryId(null);
              }}
            />
            <UIWireframeGenerator
              correctedText={aiResult.correctedText}
              acceptanceCriteria={aiResult.acceptanceCriteria}
            />
          </>
        )}

        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-2">📋 Existing Stories</h2>
        <ul className="space-y-6">
          {stories.map((story) => (
            <li key={story._id} className="border p-4 rounded bg-gray-50">
              <p><strong>ID:</strong> {story._id}</p>
              {/* <p><strong>Project:</strong> {projects.find(p => p._id == story.projectId)?.name || "Unassigned"}</p> */}
              <p><strong>Project:</strong> {story.projectId?.name || "Unassigned"}</p>
              <p><strong>Original Text:</strong> {story.originalText}</p>
              <p><strong>Corrected Text:</strong> {story.correctedText || "N/A"}</p>

              {/* Acceptance Criteria */}
              <div className="mt-4">
                <h3 className="font-semibold mb-1">Acceptance Criteria</h3>
                <table className="table-auto w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border px-2 py-1">S.No</th>
                      <th className="border px-2 py-1 text-left">Criteria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(story.acceptanceCriteria || []).map((criteria, index) => (
                      <tr key={index}>
                        <td className="border px-2 py-1 text-center">{index + 1}</td>
                        <td className="border px-2 py-1">{criteria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Test Cases */}
              <div className="mt-4">
                <h3 className="font-semibold mb-1">Test Cases</h3>
                <table className="table-auto w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border px-2 py-1">S.No</th>
                      <th className="border px-2 py-1">Test Case</th>
                      <th className="border px-2 py-1">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(story.happyTests || []).map((test, index) => (
                      <tr key={`h-${index}`}>
                        <td className="border px-2 py-1 text-center">{index + 1}</td>
                        <td className="border px-2 py-1">{test}</td>
                        <td className="border px-2 py-1 text-green-700">Positive</td>
                      </tr>
                    )),
                    ...(story.negativeTests || []).map((test, index) => (
                      <tr key={`n-${index}`}>
                        <td className="border px-2 py-1 text-center">{index + 1}</td>
                        <td className="border px-2 py-1">{test}</td>
                        <td className="border px-2 py-1 text-red-700">Negative</td>
                      </tr>
                    ))]}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-sm text-gray-600"><strong>Created:</strong> {new Date(story.createdAt).toLocaleString()}</p>
              <p className="text-sm text-gray-600"><strong>Updated:</strong> {new Date(story.updatedAt).toLocaleString()}</p>

              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => handleEditStory(story)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    const confirm = window.confirm("Are you sure you want to delete?");
                    if (!confirm) return;
                    await axios.delete(`/stories/${story._id}`);
                    fetchStories();
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserStoryPage;
