const hasKey = (name) => Boolean(process.env[name]?.trim());

const ollamaModel = () =>
  process.env.OLLAMA_MODEL?.trim() || "gemma4:31b-cloud";

const groqModel = () =>
  process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

const anthropicModel = () =>
  process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

/** Map retired catalog IDs saved in browser localStorage to current entries. */
export const LEGACY_SELECTION_IDS = {
  "anthropic:claude-haiku-3-5": "anthropic:claude-haiku-4-5",
  "anthropic:claude-sonnet-4": "anthropic:claude-sonnet-4-6",
  "anthropic:claude-opus-4": "anthropic:claude-opus-4-8",
};

export const normalizeSelectionId = (id) => LEGACY_SELECTION_IDS[id] || id;

export const LLM_CATALOG = [
  {
    id: "ollama:local",
    provider: "ollama",
    model: null,
    label: "Ollama (Local)",
    description: "Runs on your machine via Ollama — best for privacy and no API cost.",
    tier: "free",
    tierLabel: "Free",
    tierDetail: "No API charges; requires Ollama installed locally.",
    requiresKey: null,
  },
  {
    id: "ollama:cloud-gemma",
    provider: "ollama",
    model: "gemma4:31b-cloud",
    label: "Ollama Cloud — Gemma 4",
    description: "Ollama cloud-hosted model — faster than local on weaker hardware.",
    tier: "freemium",
    tierLabel: "Freemium",
    tierDetail: "Ollama account may be required; cloud usage limits apply.",
    requiresKey: null,
  },
  {
    id: "groq:llama-3.3-70b",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    label: "Groq — Llama 3.3 70B",
    description: "Fast inference on Groq's free tier — good for prototypes and structure.",
    tier: "freemium",
    tierLabel: "Free tier",
    tierDetail: "Free with rate limits; paid plans available on Groq.",
    requiresKey: "GROQ_API_KEY",
  },
  {
    id: "openrouter:free",
    provider: "openrouter",
    model: "openrouter/free",
    label: "OpenRouter — Free Router",
    description: "Auto-selects an available free model on OpenRouter.",
    tier: "free",
    tierLabel: "Free",
    tierDetail: "Daily free quota; may rate-limit when exhausted.",
    requiresKey: "OPENROUTER_API_KEY",
  },
  {
    id: "openrouter:hermes-405b",
    provider: "openrouter",
    model: "nousresearch/hermes-3-llama-3.1-405b:free",
    label: "OpenRouter — Hermes 405B (Free)",
    description: "Large free model for complex reasoning tasks.",
    tier: "free",
    tierLabel: "Free",
    tierDetail: "Free tier; subject to OpenRouter daily limits.",
    requiresKey: "OPENROUTER_API_KEY",
  },
  {
    id: "openrouter:nemotron-nano",
    provider: "openrouter",
    model: "nvidia/nemotron-3-nano-30b-a3b:free",
    label: "OpenRouter — Nemotron Nano (Free)",
    description: "Compact free model with reasoning support.",
    tier: "free",
    tierLabel: "Free",
    tierDetail: "Free tier; subject to OpenRouter daily limits.",
    requiresKey: "OPENROUTER_API_KEY",
  },
  {
    id: "openrouter:gpt-codex",
    provider: "openrouter",
    model: "openai/gpt-5.3-codex",
    label: "OpenRouter — GPT Codex",
    description: "Premium coding model via OpenRouter — best UI/code quality.",
    tier: "paid",
    tierLabel: "Paid",
    tierDetail: "Billed per token through your OpenRouter credits.",
    requiresKey: "OPENROUTER_API_KEY",
  },
  {
    id: "anthropic:claude-sonnet-4-6",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    description: "Anthropic's balanced model — strong reasoning and writing.",
    tier: "paid",
    tierLabel: "Paid",
    tierDetail: "Billed per token via Anthropic API.",
    requiresKey: "ANTHROPIC_API_KEY",
  },
  {
    id: "anthropic:claude-haiku-4-5",
    provider: "anthropic",
    model: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    description: "Fast, lower-cost Claude model for lighter tasks.",
    tier: "paid",
    tierLabel: "Paid",
    tierDetail: "Lower cost than Sonnet; still billed per token.",
    requiresKey: "ANTHROPIC_API_KEY",
  },
  {
    id: "anthropic:claude-opus-4-8",
    provider: "anthropic",
    model: "claude-opus-4-8",
    label: "Claude Opus 4.8",
    description: "Anthropic's most capable model — highest quality, highest cost.",
    tier: "paid",
    tierLabel: "Paid",
    tierDetail: "Premium pricing via Anthropic API.",
    requiresKey: "ANTHROPIC_API_KEY",
  },
];

export const getCatalogEntry = (id) => {
  const normalized = normalizeSelectionId(id);
  return LLM_CATALOG.find((entry) => entry.id === normalized) || null;
};

export const isEntryConfigured = (entry) => {
  if (!entry) return false;
  if (!entry.requiresKey) return true;
  return hasKey(entry.requiresKey);
};

export const resolveModelForEntry = (entry) => {
  if (!entry) return null;
  if (entry.model) return entry.model;
  if (entry.provider === "ollama") return ollamaModel();
  if (entry.provider === "groq") return groqModel();
  if (entry.provider === "anthropic") return anthropicModel();
  return null;
};

export const resolveAISelection = (selectionId) => {
  const entry = getCatalogEntry(selectionId);
  if (!entry || !isEntryConfigured(entry)) return null;

  const model = resolveModelForEntry(entry);
  return {
    id: entry.id,
    provider: entry.provider,
    models: model ? [model] : [],
    label: entry.label,
    tier: entry.tier,
  };
};

export const getDefaultSelectionId = () => {
  const envProvider = (process.env.AI_PROVIDER || "ollama").toLowerCase();

  const envMatch = LLM_CATALOG.find((entry) => {
    if (entry.provider !== envProvider) return false;
    if (envProvider === "ollama" && !/cloud/i.test(ollamaModel()) && entry.id === "ollama:local") return true;
    if (envProvider === "ollama" && /cloud/i.test(ollamaModel()) && entry.id === "ollama:cloud-gemma") return true;
    if (envProvider === "groq" && entry.id.startsWith("groq:")) return true;
    if (envProvider === "openrouter" && entry.id === "openrouter:free") return true;
    if (envProvider === "anthropic" && entry.id === "anthropic:claude-sonnet-4-6") return true;
    return false;
  });

  if (envMatch && isEntryConfigured(envMatch)) return envMatch.id;

  const firstConfigured = LLM_CATALOG.find(isEntryConfigured);
  return firstConfigured?.id || "ollama:local";
};

export const listAvailableModels = () => {
  const defaultId = getDefaultSelectionId();
  const all = LLM_CATALOG.map((entry) => ({
    id: entry.id,
    provider: entry.provider,
    model: resolveModelForEntry(entry),
    label: entry.label,
    description: entry.description,
    tier: entry.tier,
    tierLabel: entry.tierLabel,
    tierDetail: entry.tierDetail,
    configured: isEntryConfigured(entry),
    isDefault: entry.id === defaultId,
    envHint: entry.requiresKey ? `Set ${entry.requiresKey} in server/.env` : null,
  }));

  const configured = all.filter((m) => m.configured);
  return {
    models: all,
    configuredModels: configured,
    configuredCount: configured.length,
    totalCount: all.length,
  };
};
