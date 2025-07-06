import axios from "axios";

export const enhanceStory = async (req, res) => {
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

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gryphe/mythomax-l2-13b", // ✅ Valid, available model
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000", // Optional but safe
        },
      }
    );

    const raw = response.data.choices[0].message.content;

    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(400).json({ error: "AI response could not be parsed", raw });
    }

    res.json(parsed);
  } catch (err) {
    console.error("AI error:", err?.response?.data || err.message);
    res.status(500).json({ error: err?.message });
  }
};
