import express from "express";
import axios from "axios";
const router = express.Router();

import { enhanceStory } from "../controllers/ai.controller.mjs"; // ✅ named import

router.post("/enhance", enhanceStory);

// router.post("/generate-ui", async (req, res) => {
//   const { correctedText, acceptanceCriteria } = req.body;

//   // Simulated JSX response
//   // const sampleJSX = `
//   //   <div className="p-4">
//   //     <h2 className="text-xl font-bold mb-4">Upload Resume</h2>
//   //     <label className="block mb-2">Resume File</label>
//   //     <input type="file" className="border p-2 rounded w-full mb-4" />
//   //     <button className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
//   //   </div>
//   // `;
//   const sampleJSX = `
//   <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600">
//     <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
//       <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Welcome Back</h2>
      
//       <div className="mb-4">
//         <label className="block text-gray-700 mb-1">Username</label>
//         <input
//           type="text"
//           placeholder="Enter your username"
//           className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//       </div>
      
//       <div className="mb-6">
//         <label className="block text-gray-700 mb-1">Password</label>
//         <input
//           type="password"
//           placeholder="Enter your password"
//           className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//       </div>
      
//       <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
//         Login
//       </button>

//       <div className="mt-6 text-center text-gray-500">or continue with</div>

//       <div className="flex justify-between mt-4 gap-4">
//         <button className="w-1/2 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition">
//           Google
//         </button>
//         <button className="w-1/2 bg-blue-800 text-white py-2 rounded-lg font-medium hover:bg-blue-900 transition">
//           Facebook
//         </button>
//       </div>
//     </div>
//   </div>
// `;


//   res.json({
//     correctedText,
//     acceptanceCriteria,
//     jsxCode: sampleJSX,
//     createdAt: new Date().toISOString(),
//   });
// });

router.post("/generate-ui", async (req, res) => {
  const { correctedText, acceptanceCriteria } = req.body;

  try {
    const prompt = `
You are a professional frontend UI engineer.

Based on the following user story and its acceptance criteria, generate a clean, responsive, and functional UI.
Using HTML, CSS and Javascript generate a complete code which I can also run on any IDE. 

- User Story: "${correctedText}"
- Acceptance Criteria: ${JSON.stringify(acceptanceCriteria, null, 2)}

Ensure:
1. The component has form inputs, buttons, and layout according to the use case.
2. All inputs should be labeled clearly.
3. Use semantic and accessible markup.
4. Add Tailwind classes for styling.
5. Return ONLY the JSX (no Markdown or extra text), wrapped in \`<div>...</div>\`.
`;

    const aiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gryphe/mythomax-l2-13b",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000",
        },
      }
    );

    const raw = aiRes.data.choices[0].message.content.trim();

    res.json({
      correctedText,
      acceptanceCriteria,
      jsxCode: raw,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("JSX AI error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate UI", detail: err?.message });
  }
});

export default router;
