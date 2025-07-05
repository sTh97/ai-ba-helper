// server/controllers/ai.controller.js
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.enhanceStory = async (req, res) => {
  const { originalText } = req.body;

  try {
    const prompt = `
You are a Business Analyst assistant. Given the user story below:

"${originalText}"

1. Correct the vocabulary and grammar.
2. Generate all possible clear acceptance criteria.
3. Provide all possible happy path test cases and negative test cases.

Respond in this JSON format:
{
  "correctedText": "...",
  "acceptanceCriteria": ["...", "..."],
  "happyTests": ["...", "..."],
  "negativeTests": ["...", "..."]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content;

    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(400).json({ error: "AI response could not be parsed", raw });
    }

    res.json(parsed);
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: err.message });
  }
};
