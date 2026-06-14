export const LLM_STORAGE_KEY = "requify-ai-selection";

/** Must stay in sync with server/constants/llmCatalog.mjs */
export const LEGACY_SELECTION_IDS = {
  "anthropic:claude-haiku-3-5": "anthropic:claude-haiku-4-5",
  "anthropic:claude-sonnet-4": "anthropic:claude-sonnet-4-6",
  "anthropic:claude-opus-4": "anthropic:claude-opus-4-8",
};

export const normalizeSelectionId = (id) => LEGACY_SELECTION_IDS[id] || id;
