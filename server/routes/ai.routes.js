const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");

router.post("/enhance", aiController.enhanceStory);

router.post("/generate-ui", async (req, res) => {
  const { correctedText, acceptanceCriteria } = req.body;

  // In future: Use OpenAI or another model here
  // For now: Return hardcoded JSX string and metadata
  const sampleJSX = `
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Upload Resume</h2>
      <label className="block mb-2">Resume File</label>
      <input type="file" className="border p-2 rounded w-full mb-4" />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
    </div>
  `;

  res.json({
    correctedText,
    acceptanceCriteria,
    jsxCode: sampleJSX,
    createdAt: new Date().toISOString(),
  });
});

module.exports = router;
