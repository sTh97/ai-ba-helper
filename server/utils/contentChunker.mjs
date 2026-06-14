const LARGE_THRESHOLD = 3500;
const MAX_CHUNK_SIZE = 2800;

export const isLargeContent = (content) => (content?.trim().length || 0) > LARGE_THRESHOLD;

export const splitContentForAI = (content) => {
  const text = content.trim();
  if (text.length <= LARGE_THRESHOLD) return [text];

  const sections = text.split(/(?=^#{1,3}\s)/m).map((s) => s.trim()).filter(Boolean);

  if (sections.length <= 1) {
    const chunks = [];
    for (let i = 0; i < text.length; i += MAX_CHUNK_SIZE) {
      chunks.push(text.slice(i, i + MAX_CHUNK_SIZE));
    }
    return chunks;
  }

  const chunks = [];
  let buffer = "";

  for (const section of sections) {
    if (buffer && buffer.length + section.length + 2 > MAX_CHUNK_SIZE) {
      chunks.push(buffer);
      buffer = section;
    } else {
      buffer = buffer ? `${buffer}\n\n${section}` : section;
    }
  }

  if (buffer) chunks.push(buffer);
  return chunks;
};
