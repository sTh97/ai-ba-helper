import express from "express";
const router = express.Router();

import { enhanceStory } from "../controllers/ai.controller.mjs"; // ✅ named import

router.post("/enhance", enhanceStory);

router.post("/generate-ui", async (req, res) => {
  const { correctedText, acceptanceCriteria } = req.body;

  // Simulated JSX response
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

export default router;
