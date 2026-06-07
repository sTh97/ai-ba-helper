// import { useState } from "react";

// const TestCaseEditor = ({
//   aiResult,
//   setAiResult,
//   storyText,
//   setStoryText,
//   editingStoryId,
//   setShowAIOutput,
//   setEditingStoryId,
//   fetchStories,
//   handleAccept,
//   handleDiscard
// }) => {
//   const updateList = (listName, index, value) => {
//     const updated = [...aiResult[listName]];
//     updated[index] = value;
//     setAiResult({ ...aiResult, [listName]: updated });
//   };

//   const deleteItem = (listName, index) => {
//     const updated = aiResult[listName].filter((_, i) => i !== index);
//     setAiResult({ ...aiResult, [listName]: updated });
//   };

//   const addTestCase = (type) => {
//     const key = type === "positive" ? "happyTests" : "negativeTests";
//     const updated = [...aiResult[key], ""];
//     setAiResult({ ...aiResult, [key]: updated });
//   };

//   return (
//     <div className="bg-gray-100 border-l-4 border-blue-500 p-4 mt-6 rounded">
//       <h3 className="text-lg font-semibold text-blue-700 mb-4">Enhance with AI</h3>

//       <div className="mb-4">
//         <label className="font-medium text-gray-700">Corrected Story:</label>
//         <textarea
//           className="w-full mt-1 p-2 border rounded"
//           rows="3"
//           value={aiResult.correctedText}
//           onChange={(e) =>
//             setAiResult({ ...aiResult, correctedText: e.target.value })
//           }
//         />
//       </div>

//       <div className="mb-6">
//         <label className="font-medium text-gray-700">Acceptance Criteria:</label>
//         {aiResult.acceptanceCriteria.map((item, index) => (
//           <div key={index} className="flex gap-2 mb-2">
//             <input
//               className="flex-grow p-2 border rounded"
//               value={item}
//               onChange={(e) => updateList("acceptanceCriteria", index, e.target.value)}
//             />
//             <button
//               onClick={() => deleteItem("acceptanceCriteria", index)}
//               className="text-red-600 hover:text-red-800"
//             >
//               ❌
//             </button>
//           </div>
//         ))}
//         <button
//           onClick={() => setAiResult({ ...aiResult, acceptanceCriteria: [...aiResult.acceptanceCriteria, ""] })}
//           className="mt-1 text-sm text-blue-600 hover:underline"
//         >
//           ➕ Add Acceptance Criteria
//         </button>
//       </div>

//       <div className="mb-6">
//         <label className="font-medium text-gray-700">Test Cases:</label>
//         <table className="w-full text-sm mt-2">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="border px-2 py-1">S.No</th>
//               <th className="border px-2 py-1 text-left">Test Case</th>
//               <th className="border px-2 py-1">Type</th>
//               <th className="border px-2 py-1">Actions</th>
//             </tr>
//           </thead>
//          <tbody>
//   {[...aiResult.happyTests || [], ...aiResult.negativeTests || []].map((test, index) => (
//     <tr key={`${index}`}>
//       <td className="border px-2 py-1text-center">{index + 1}</td>
//       <td className="border px-2 py-1">
//         <textarea
//           className="w-full border px-2 py-1"
//           value={test}
//           onChange={(e) => {
//             const key = index < aiResult.happyTests.length ? "happyTests" : "negativeTests";
//             const idx = index < aiResult.happyTests.length ? index : index - aiResult.happyTests.length;
//             updateList(key, idx, e.target.value);
//           }}
//         />
//       </td>
//       <td className={`border px-2 py-1 text-center ${index < aiResult.happyTests.length ? "text-green-600" : "text-red-600"}`}>
//         {index < aiResult.happyTests.length ? "Positive" : "Negative"}
//       </td>
//       <td className="border px-2 py-1 text-center">
//         <button
//           onClick={() => {
//             const key = index < aiResult.happyTests.length ? "happyTests" : "negativeTests";
//             const idx = index < aiResult.happyTests.length ? index : index - aiResult.happyTests.length;
//             deleteItem(key, idx);
//           }}
//           className="text-red-600"
//         >
//           ❌
//         </button>
//       </td>
//     </tr>
//   ))}
// </tbody>

//         </table>

//         <div className="mt-2 flex gap-4">
//           <button onClick={() => addTestCase("positive")} className="text-sm text-green-700 hover:underline">
//             ➕ Add Positive Test
//           </button>
//           <button onClick={() => addTestCase("negative")} className="text-sm text-red-700 hover:underline">
//             ➕ Add Negative Test
//           </button>
//         </div>
//       </div>
//       <div className="flex gap-3 mt-4">
//   <button
//     onClick={handleAccept}
//     className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
//   >
//     Accept
//   </button>
//   <button
//     onClick={handleDiscard}
//     className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
//   >
//     Discard
//   </button>
// </div>

//     </div>
//   );
// };

// export default TestCaseEditor;


import { useState } from "react";

const inputStyle = {
  width: "100%", padding: "8px 12px",
  background: "var(--bg-base)", border: "1px solid var(--border)",
  borderRadius: 7, color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s", resize: "vertical",
  boxSizing: "border-box",
};

const TestCaseEditor = ({ aiResult, setAiResult, handleAccept, handleDiscard }) => {
  const updateList = (listName, index, value) => {
    const updated = [...aiResult[listName]];
    updated[index] = value;
    setAiResult({ ...aiResult, [listName]: updated });
  };

  const deleteItem = (listName, index) => {
    const updated = aiResult[listName].filter((_, i) => i !== index);
    setAiResult({ ...aiResult, [listName]: updated });
  };

  const addTestCase = (type) => {
    const key = type === "positive" ? "happyTests" : "negativeTests";
    setAiResult({ ...aiResult, [key]: [...aiResult[key], ""] });
  };

  const allTests = [
    ...(aiResult.happyTests || []).map((t, i) => ({ text: t, type: "positive", key: "happyTests", idx: i })),
    ...(aiResult.negativeTests || []).map((t, i) => ({ text: t, type: "negative", key: "negativeTests", idx: i })),
  ];

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderLeft: "3px solid var(--accent)",
      borderRadius: "var(--radius-lg)", marginTop: 20, overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--bg-elevated)",
      }}>
        <span style={{ fontSize: 14 }}>✨</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
          AI Enhanced Output
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 11, padding: "2px 8px",
          background: "var(--accent-soft)", borderRadius: 99, color: "var(--accent)", fontWeight: 500,
        }}>Review & Edit</span>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Corrected Story */}
        <Section title="Corrected Story" icon="📝">
          <textarea
            style={{ ...inputStyle, minHeight: 80 }}
            value={aiResult.correctedText}
            onChange={e => setAiResult({ ...aiResult, correctedText: e.target.value })}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </Section>

        {/* Acceptance Criteria */}
        <Section title="Acceptance Criteria" icon="✅">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {aiResult.acceptanceCriteria.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 9, flexShrink: 0, minWidth: 20, textAlign: "right" }}>
                  {index + 1}.
                </span>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={item}
                  onChange={e => updateList("acceptanceCriteria", index, e.target.value)}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  onClick={() => deleteItem("acceptanceCriteria", index)}
                  style={{ marginTop: 6, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}
                >✕</button>
              </div>
            ))}
            <button
              onClick={() => setAiResult({ ...aiResult, acceptanceCriteria: [...aiResult.acceptanceCriteria, ""] })}
              style={{
                marginTop: 4, padding: "7px 12px", borderRadius: 7,
                background: "var(--accent-soft)", border: "1px dashed var(--accent)44",
                color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >+ Add Criteria</button>
          </div>
        </Section>

        {/* Test Cases */}
        <Section title="Test Cases" icon="🧪">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {allTests.map((tc, index) => (
              <div key={`${tc.key}-${tc.idx}`} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{
                  marginTop: 8, fontSize: 10, fontWeight: 600, padding: "3px 7px",
                  borderRadius: 99, flexShrink: 0, letterSpacing: "0.3px",
                  background: tc.type === "positive" ? "var(--green-soft)" : "var(--red-soft)",
                  color: tc.type === "positive" ? "var(--green)" : "var(--red)",
                }}>
                  {tc.type === "positive" ? "POS" : "NEG"}
                </span>
                <textarea
                  style={{ ...inputStyle, flex: 1, minHeight: 40 }}
                  value={tc.text}
                  onChange={e => updateList(tc.key, tc.idx, e.target.value)}
                  onFocus={e => (e.target.style.borderColor = tc.type === "positive" ? "var(--green)" : "var(--red)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  onClick={() => deleteItem(tc.key, tc.idx)}
                  style={{ marginTop: 8, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, flexShrink: 0 }}
                >✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                onClick={() => addTestCase("positive")}
                style={{
                  padding: "7px 12px", borderRadius: 7,
                  background: "var(--green-soft)", border: "1px dashed var(--green)44",
                  color: "var(--green)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >+ Positive Test</button>
              <button
                onClick={() => addTestCase("negative")}
                style={{
                  padding: "7px 12px", borderRadius: 7,
                  background: "var(--red-soft)", border: "1px dashed var(--red)44",
                  color: "var(--red)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >+ Negative Test</button>
            </div>
          </div>
        </Section>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
          <button
            onClick={handleAccept}
            style={{
              padding: "9px 22px", borderRadius: "var(--radius)",
              background: "var(--green)", border: "none", color: "#0a0b0f",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >Accept & Save</button>
          <button
            onClick={handleDiscard}
            style={{
              padding: "9px 16px", borderRadius: "var(--radius)",
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontWeight: 500, fontSize: 13, cursor: "pointer",
            }}
          >Discard</button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {title}
      </span>
    </div>
    {children}
  </div>
);

export default TestCaseEditor;