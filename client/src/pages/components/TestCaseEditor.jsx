import { useState } from "react";

const TestCaseEditor = ({
  aiResult,
  setAiResult,
  storyText,
  setStoryText,
  editingStoryId,
  setShowAIOutput,
  setEditingStoryId,
  fetchStories,
  handleAccept,
  handleDiscard
}) => {
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
    const updated = [...aiResult[key], ""];
    setAiResult({ ...aiResult, [key]: updated });
  };

  return (
    <div className="bg-gray-100 border-l-4 border-blue-500 p-4 mt-6 rounded">
      <h3 className="text-lg font-semibold text-blue-700 mb-4">Enhance with AI</h3>

      <div className="mb-4">
        <label className="font-medium text-gray-700">Corrected Story:</label>
        <textarea
          className="w-full mt-1 p-2 border rounded"
          rows="3"
          value={aiResult.correctedText}
          onChange={(e) =>
            setAiResult({ ...aiResult, correctedText: e.target.value })
          }
        />
      </div>

      <div className="mb-6">
        <label className="font-medium text-gray-700">Acceptance Criteria:</label>
        {aiResult.acceptanceCriteria.map((item, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              className="flex-grow p-2 border rounded"
              value={item}
              onChange={(e) => updateList("acceptanceCriteria", index, e.target.value)}
            />
            <button
              onClick={() => deleteItem("acceptanceCriteria", index)}
              className="text-red-600 hover:text-red-800"
            >
              ❌
            </button>
          </div>
        ))}
        <button
          onClick={() => setAiResult({ ...aiResult, acceptanceCriteria: [...aiResult.acceptanceCriteria, ""] })}
          className="mt-1 text-sm text-blue-600 hover:underline"
        >
          ➕ Add Acceptance Criteria
        </button>
      </div>

      <div className="mb-6">
        <label className="font-medium text-gray-700">Test Cases:</label>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">S.No</th>
              <th className="border px-2 py-1 text-left">Test Case</th>
              <th className="border px-2 py-1">Type</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
         <tbody>
  {[...aiResult.happyTests || [], ...aiResult.negativeTests || []].map((test, index) => (
    <tr key={`${index}`}>
      <td className="border px-2 py-1text-center">{index + 1}</td>
      <td className="border px-2 py-1">
        <textarea
          className="w-full border px-2 py-1"
          value={test}
          onChange={(e) => {
            const key = index < aiResult.happyTests.length ? "happyTests" : "negativeTests";
            const idx = index < aiResult.happyTests.length ? index : index - aiResult.happyTests.length;
            updateList(key, idx, e.target.value);
          }}
        />
      </td>
      <td className={`border px-2 py-1 text-center ${index < aiResult.happyTests.length ? "text-green-600" : "text-red-600"}`}>
        {index < aiResult.happyTests.length ? "Positive" : "Negative"}
      </td>
      <td className="border px-2 py-1 text-center">
        <button
          onClick={() => {
            const key = index < aiResult.happyTests.length ? "happyTests" : "negativeTests";
            const idx = index < aiResult.happyTests.length ? index : index - aiResult.happyTests.length;
            deleteItem(key, idx);
          }}
          className="text-red-600"
        >
          ❌
        </button>
      </td>
    </tr>
  ))}
</tbody>

        </table>

        <div className="mt-2 flex gap-4">
          <button onClick={() => addTestCase("positive")} className="text-sm text-green-700 hover:underline">
            ➕ Add Positive Test
          </button>
          <button onClick={() => addTestCase("negative")} className="text-sm text-red-700 hover:underline">
            ➕ Add Negative Test
          </button>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
  <button
    onClick={handleAccept}
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
  >
    Accept
  </button>
  <button
    onClick={handleDiscard}
    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
  >
    Discard
  </button>
</div>

    </div>
  );
};

export default TestCaseEditor;
