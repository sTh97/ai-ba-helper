export const extractMessageContent = (data) => {
  const choice = data?.choices?.[0];
  const message = choice?.message;
  if (!message) return null;

  const pick = (...values) => {
    for (const v of values) {
      if (v == null) continue;
      const text = typeof v === "string" ? v : JSON.stringify(v);
      if (text.trim()) return text;
    }
    return null;
  };

  return pick(
    message.content,
    message.reasoning,
    choice.reasoning,
    data?.output_text
  );
};
