const PROMPT_LEAK_PATTERNS = [
  /^you are an?\s/i,
  /json object/i,
  /return only valid json/i,
  /business analyst ai/i,
  /the output should be/i,
  /simulate a user story/i,
  /ai assistant helping/i,
];

const repairJsonText = (text) =>
  text
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, "'");

const tryParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (firstError) {
    try {
      return JSON.parse(repairJsonText(text));
    } catch {
      throw firstError;
    }
  }
};

export const parseAIJson = (raw) => {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty AI response");
  }

  let text = raw.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    text = fenced[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  return tryParseJson(text);
};

export const isValidUserStoryText = (text) => {
  if (!text || typeof text !== "string") return false;
  const t = text.trim();
  if (t.length < 25) return false;
  if (PROMPT_LEAK_PATTERNS.some((p) => p.test(t))) return false;
  return /^as an?\s+.+\s+i want\s+.+/i.test(t);
};

const cleanStringList = (value) =>
  Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean) : [];

const normalizeFields = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((field) => {
      if (typeof field === "string") {
        return { name: field.trim(), type: "", description: "" };
      }
      if (field && typeof field === "object") {
        return {
          name: String(field.name ?? field.field ?? "").trim(),
          type: String(field.type ?? field.dataType ?? "").trim(),
          description: String(field.description ?? field.desc ?? "").trim(),
        };
      }
      return null;
    })
    .filter((field) => field && (field.name || field.type || field.description));
};

export const normalizeStory = (story, index) => ({
  title: story.title || `User Story ${index + 1}`,
  correctedText: story.correctedText || story.userStory || "",
  feature: String(story.feature ?? story.epic ?? "").trim(),
  acceptanceCriteria: cleanStringList(story.acceptanceCriteria),
  happyTests: cleanStringList(story.happyTests),
  negativeTests: cleanStringList(story.negativeTests),
  wireframeApplicable: story.wireframeApplicable !== false,
  fields: normalizeFields(story.fields),
  businessRules: cleanStringList(story.businessRules),
  validations: cleanStringList(story.validations),
  edgeCases: cleanStringList(story.edgeCases),
  constraints: cleanStringList(story.constraints),
  dependencies: cleanStringList(story.dependencies),
  businessImpact: String(story.businessImpact ?? "").trim(),
  definitionOfReady: cleanStringList(story.definitionOfReady),
  definitionOfDone: cleanStringList(story.definitionOfDone),
});

export const extractStoriesFromParsed = (parsed) => {
  if (Array.isArray(parsed.stories) && parsed.stories.length > 0) {
    return parsed.stories.map(normalizeStory);
  }

  if (parsed.correctedText && isValidUserStoryText(parsed.correctedText)) {
    return [normalizeStory(parsed, 0)];
  }

  return [];
};

export const validateStories = (stories) => {
  if (!Array.isArray(stories) || stories.length === 0) {
    return { valid: false, reason: "No user stories were generated" };
  }

  const invalid = stories.filter((s) => !isValidUserStoryText(s.correctedText));
  if (invalid.length > 0) {
    return {
      valid: false,
      reason: `${invalid.length} story/stories have invalid format (must be "As a [role], I want ... so that ...")`,
    };
  }

  const emptyCriteria = stories.filter((s) => s.acceptanceCriteria.length === 0);
  if (emptyCriteria.length === stories.length) {
    return { valid: false, reason: "Stories are missing acceptance criteria" };
  }

  return { valid: true };
};
