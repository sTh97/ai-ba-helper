import axios from "axios";
import {
  parseAIJson,
  extractStoriesFromParsed,
  validateStories,
} from "../utils/aiParser.mjs";
import { extractMessageContent } from "../utils/openrouter.mjs";
import { buildFullDocument, sanitizePrototypeCode } from "../utils/prototypeBuilder.mjs";
import { isLargeContent, splitContentForAI } from "../utils/contentChunker.mjs";
import { listAvailableModels } from "../constants/llmCatalog.mjs";
import { filterModelsForUser } from "../utils/llmAccess.mjs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_TIMEOUT_MS = Number(process.env.ANTHROPIC_TIMEOUT_MS) || 180000;
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OLLAMA_MODEL = "gemma4:31b-cloud";
const DEFAULT_OLLAMA_STRUCTURE_MODEL = "gemma4:31b-cloud";
const DEFAULT_OLLAMA_PROTOTYPE_MODEL = "gemma4:31b-cloud";
const DEFAULT_OLLAMA_PROTOTYPE_FALLBACK_MODEL = "minimax-m3:cloud";
const DEFAULT_SCREEN_CONCURRENCY = 3;
const DEFAULT_SCREEN_AI_TIMEOUT_MS = 180000;
const DEFAULT_SCREEN_MAX_TOKENS = 4096;
const MAX_VALIDATION_RETRIES = 1;
const MAX_UI_PARSE_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 90000;
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 300000;
const OLLAMA_CLOUD_TIMEOUT_MS = Number(process.env.OLLAMA_CLOUD_TIMEOUT_MS) || 180000;
const OLLAMA_ENHANCE_MAX_TOKENS = 3072;
const OLLAMA_CLOUD_MAX_TOKENS = 4096;
const OLLAMA_CLOUD_SINGLE_PASS_LIMIT = 12000;
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS) || 180000;

const getAIProvider = () => (process.env.AI_PROVIDER || "ollama").toLowerCase();
const getPrototypeAIProvider = () =>
  (process.env.PROTOTYPE_AI_PROVIDER || process.env.AI_PROVIDER || "ollama").toLowerCase();

const isOllama = (provider = getAIProvider()) => provider === "ollama";
const isGroq = (provider = getAIProvider()) => provider === "groq";
const isAnthropic = (provider = getAIProvider()) => provider === "anthropic";
const isPrototypeGroq = () => isGroq(getPrototypeAIProvider());

export const withRequestSelection = (req, options = {}) => {
  const selection = req?.aiSelection;
  if (!selection?.provider) return options;
  return {
    ...options,
    provider: selection.provider,
    models: selection.models?.length ? selection.models : options.models,
    selectionId: selection.id,
  };
};

export const selectionToOptions = (selection, options = {}) => {
  if (!selection?.provider) return options;
  return {
    ...options,
    provider: selection.provider,
    models: selection.models?.length ? selection.models : options.models,
    selectionId: selection.id,
  };
};

export const listModels = (req, res) => {
  res.json(filterModelsForUser(listAvailableModels(), req.user));
};

const getOllamaChatUrl = () => {
  const base = (process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1").replace(/\/$/, "");
  return `${base}/chat/completions`;
};

const getOllamaModel = (ui = false) => {
  if (ui) {
    return process.env.OLLAMA_UI_MODEL?.trim()
      || process.env.OLLAMA_MODEL?.trim()
      || DEFAULT_OLLAMA_MODEL;
  }
  return process.env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
};

const getOllamaStructureModel = () =>
  process.env.OLLAMA_STRUCTURE_MODEL?.trim()
  || process.env.OLLAMA_MODEL?.trim()
  || DEFAULT_OLLAMA_STRUCTURE_MODEL;

const getOllamaPrototypeModel = () =>
  process.env.OLLAMA_PROTOTYPE_MODEL?.trim() || DEFAULT_OLLAMA_PROTOTYPE_MODEL;

const getOllamaPrototypeFallbackModel = () =>
  process.env.OLLAMA_PROTOTYPE_FALLBACK_MODEL?.trim() || DEFAULT_OLLAMA_PROTOTYPE_FALLBACK_MODEL;

const getGroqModel = () => process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;

export const getPrototypeScreenConcurrency = () => {
  const explicit = Number(process.env.PROTOTYPE_SCREEN_CONCURRENCY);
  if (Number.isFinite(explicit) && explicit > 0) return Math.max(1, explicit);
  // Groq free tier is token-rate-limited — keep concurrency low to avoid 429 storms
  if (isPrototypeGroq()) return 2;
  return DEFAULT_SCREEN_CONCURRENCY;
};

const usesOllamaCloudForPrototype = () =>
  isOllama(getPrototypeAIProvider()) && isOllamaCloudModel(getOllamaPrototypeModel());

const getPrototypeTimeout = () => {
  if (isPrototypeGroq()) {
    return Number(process.env.GROQ_TIMEOUT_MS) || GROQ_TIMEOUT_MS;
  }
  if (usesOllamaCloudForPrototype()) {
    return Number(process.env.OLLAMA_PROTOTYPE_TIMEOUT_MS) || 300000;
  }
  if (isOllama()) return OLLAMA_TIMEOUT_MS;
  return 150000;
};

const getAIRequestConfig = (provider = getAIProvider()) => {
  if (isOllama(provider)) {
    return {
      url: getOllamaChatUrl(),
      headers: { "Content-Type": "application/json" },
    };
  }
  if (isGroq(provider)) {
    return {
      url: GROQ_URL,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    };
  }
  if (isAnthropic(provider)) {
    return {
      url: ANTHROPIC_URL,
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    };
  }
  return {
    url: OPENROUTER_URL,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5000",
      "X-Title": "Requify",
    },
  };
};

const isOllamaCloudModel = (model) => /(?:[:-])cloud$/i.test(model || "");

const getActiveOllamaModel = (ui = false) => getOllamaModel(ui);

const usesOllamaCloud = (ui = false) => isOllama() && isOllamaCloudModel(getActiveOllamaModel(ui));

const getDefaultTimeout = (ui = false, provider = getAIProvider()) => {
  if (isAnthropic(provider)) return ANTHROPIC_TIMEOUT_MS;
  if (usesOllamaCloud(ui)) return OLLAMA_CLOUD_TIMEOUT_MS;
  if (isOllama(provider)) return OLLAMA_TIMEOUT_MS;
  return ui ? 120000 : REQUEST_TIMEOUT_MS;
};

const extractAnthropicContent = (data) => {
  const blocks = data?.content;
  if (!Array.isArray(blocks)) return null;
  const text = blocks
    .filter((block) => block?.type === "text" && block.text)
    .map((block) => block.text)
    .join("");
  return text.trim() || null;
};

const callAnthropic = async (systemPrompt, userPrompt, useJsonMode, options) => {
  const { headers, url } = getAIRequestConfig("anthropic");
  const model = options.models?.[0] || process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  const timeout = options.timeout || ANTHROPIC_TIMEOUT_MS;
  const maxCap = /opus|sonnet/i.test(model) ? 16384 : 8192;
  let maxTokens = Math.min(options.maxTokens || 4096, maxCap);

  let system = systemPrompt;
  if (useJsonMode) {
    system += "\n\nRespond with valid JSON only. No markdown fences or extra text.";
  }

  for (let attempt = 0; attempt <= 2; attempt++) {
    const body = {
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.2,
    };

    const response = await postWithRetry(url, body, { headers, timeout });

    if (response.data?.stop_reason === "max_tokens") {
      const partial = extractAnthropicContent(response.data);
      if (attempt < 2 && maxTokens < maxCap) {
        maxTokens = Math.min(maxTokens * 2, maxCap);
        console.warn(`Anthropic truncated (${model}) — retrying with max_tokens=${maxTokens}`);
        continue;
      }
      if (partial?.trim()) {
        console.warn(`Anthropic truncated (${model}) — returning partial response`);
        return partial;
      }
      const err = new Error("Response truncated — increase max_tokens and retry");
      err.retryable = true;
      err.truncated = true;
      throw err;
    }

    const content = extractAnthropicContent(response.data);
    if (!content) {
      const err = new Error("Empty response from Anthropic");
      err.retryable = true;
      throw err;
    }
    console.log(`AI call OK — anthropic, model: ${model}${useJsonMode ? " (json)" : ""} max_tokens=${maxTokens}`);
    return content;
  }

  throw new Error("Anthropic request failed after retries");
};

const getContentChunks = (content) => {
  const text = content.trim();
  if (usesOllamaCloud() && text.length <= OLLAMA_CLOUD_SINGLE_PASS_LIMIT) {
    return [text];
  }
  return splitContentForAI(text);
};

// openrouter/free auto-picks an available free model when specific ones are down/rate-limited
const FREE_MODELS = [
  "openrouter/free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
];

const UI_MODELS = [
  "openai/gpt-5.3-codex",
  "openrouter/free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
];

const uniqueModels = (models) => [...new Set(models.filter(Boolean))];

const getModelsToTry = () => {
  if (isOllama()) {
    return [getOllamaModel()];
  }
  const configured = process.env.OPENROUTER_MODEL?.trim();
  if (configured) {
    return uniqueModels([configured, ...FREE_MODELS]);
  }
  return FREE_MODELS;
};

const supportsReasoningExclude = (model) => /nemotron|gemma/i.test(model) || isOllamaCloudModel(model);

const buildAttempts = (model, useJsonMode) => {
  if (isOllama()) {
    const cloud = isOllamaCloudModel(model);
    const thinking = supportsReasoningExclude(model);

    if (useJsonMode) {
      if (cloud) {
        return [
          { withJson: true, withReasoningExclude: thinking },
          { withJson: true, withReasoningExclude: false },
          { withJson: false, withReasoningExclude: false },
        ];
      }
      // Plain text first — faster and more reliable for local coder models
      return [
        { withJson: false, withReasoningExclude: false },
        { withJson: true, withReasoningExclude: false },
      ];
    }
    if (cloud && thinking) {
      return [
        { withJson: false, withReasoningExclude: true },
        { withJson: false, withReasoningExclude: false },
      ];
    }
    return [{ withJson: false, withReasoningExclude: false }];
  }

  const attempts = [];
  const isNemotron = supportsReasoningExclude(model);

  if (useJsonMode) {
    if (isNemotron) {
      attempts.push({ withJson: true, withReasoningExclude: true });
      attempts.push({ withJson: true, withReasoningExclude: false });
      attempts.push({ withJson: false, withReasoningExclude: false });
    } else {
      // Hermes / openrouter/free often reject json_object — try plain text first
      attempts.push({ withJson: false, withReasoningExclude: false });
      attempts.push({ withJson: true, withReasoningExclude: false });
    }
  } else if (isNemotron) {
    attempts.push({ withJson: false, withReasoningExclude: true });
    attempts.push({ withJson: false, withReasoningExclude: false });
  } else {
    attempts.push({ withJson: false, withReasoningExclude: false });
  }
  return attempts;
};

const isFatalError = (err) => {
  const status = err?.response?.status;
  return status === 401 || status === 403;
};

const isFreeQuotaExhausted = (errors) =>
  errors.length > 0
  && errors.every((entry) => /rate limit|free-models-per-day|provider returned error/i.test(entry));

export const getUIModelsToTry = () => {
  if (isOllama()) {
    return [getOllamaModel(true)];
  }
  const configured = process.env.OPENROUTER_UI_MODEL?.trim();
  if (configured) {
    return uniqueModels([configured, ...UI_MODELS]);
  }
  return UI_MODELS;
};

export const getUIAIOptions = (overrides = {}) => ({
  models: getUIModelsToTry(),
  maxTokens: 4096,
  timeout: getDefaultTimeout(true),
  ...overrides,
});

export const getEnhanceAIOptions = (overrides = {}) => ({
  models: getModelsToTry(),
  maxTokens: usesOllamaCloud() ? OLLAMA_CLOUD_MAX_TOKENS : (isOllama() ? OLLAMA_ENHANCE_MAX_TOKENS : 4096),
  timeout: getDefaultTimeout(),
  ...overrides,
});

export const getPrototypeModelsToTry = () => {
  if (isPrototypeGroq()) return [getGroqModel()];
  if (isOllama(getPrototypeAIProvider())) return [getOllamaPrototypeModel()];
  const configured = process.env.OPENROUTER_UI_MODEL?.trim() || process.env.OPENROUTER_MODEL?.trim();
  if (configured) return uniqueModels([configured, ...UI_MODELS]);
  return UI_MODELS;
};

export const getPrototypeAIOptions = (overrides = {}) => ({
  models: getPrototypeModelsToTry(),
  maxTokens: usesOllamaCloudForPrototype() ? OLLAMA_CLOUD_MAX_TOKENS : 4096,
  timeout: getPrototypeTimeout(),
  provider: getPrototypeAIProvider(),
  ...overrides,
});

export const getStructureAIOptions = (overrides = {}) => {
  const provider = getPrototypeAIProvider();
  const model = isGroq(provider)
    ? getGroqModel()
    : isOllama(provider)
      ? getOllamaStructureModel()
      : getModelsToTry()[0];
  return {
    models: [model],
    maxTokens: 4000,
    timeout: isGroq(provider)
      ? (Number(process.env.GROQ_TIMEOUT_MS) || GROQ_TIMEOUT_MS)
      : (Number(process.env.OLLAMA_CLOUD_TIMEOUT_MS) || OLLAMA_CLOUD_TIMEOUT_MS),
    fastMode: true,
    provider,
    ...overrides,
  };
};

export const getDocumentAIOptions = (selection, overrides = {}) => {
  const merged = selectionToOptions(selection, getStructureAIOptions({ fastMode: false, ...overrides }));
  const provider = merged.provider || getAIProvider();
  const model = merged.models?.[0] || "";
  let maxTokens = 8192;
  if (isAnthropic(provider)) {
    maxTokens = /opus|sonnet/i.test(model) ? 16384 : 8192;
  } else if (isGroq(provider)) {
    maxTokens = 8192;
  } else if (isOllama(provider)) {
    maxTokens = 8192;
  }
  const timeout = isAnthropic(provider)
    ? Math.max(ANTHROPIC_TIMEOUT_MS, 300000)
    : Math.max(Number(merged.timeout) || 0, 300000);
  return {
    ...merged,
    maxTokens: overrides.maxTokens ?? maxTokens,
    fastMode: false,
    timeout,
  };
};

export const getRefineAIOptions = (selection, overrides = {}) =>
  getDocumentAIOptions(selection, { maxTokens: 8192, ...overrides });

const getOllamaScreenModel = () =>
  process.env.OLLAMA_SCREEN_MODEL?.trim()
  || process.env.OLLAMA_UI_MODEL?.trim()
  || process.env.OLLAMA_MODEL?.trim()
  || DEFAULT_OLLAMA_MODEL;

export const getScreenAIOptions = (overrides = {}) => {
  const provider = getPrototypeAIProvider();
  if (isGroq(provider)) {
    return {
      models: [getGroqModel()],
      maxTokens: Number(process.env.PROTOTYPE_SCREEN_MAX_TOKENS) || DEFAULT_SCREEN_MAX_TOKENS,
      timeout: Number(process.env.GROQ_TIMEOUT_MS) || GROQ_TIMEOUT_MS,
      fastMode: false,
      provider,
      ...overrides,
    };
  }
  if (isOllama(provider)) {
    const primary = getOllamaScreenModel();
    const fallback = getOllamaPrototypeFallbackModel();
    const heavy = getOllamaPrototypeModel();
    return {
      models: uniqueModels([primary, fallback, heavy]),
      maxTokens: Number(process.env.PROTOTYPE_SCREEN_MAX_TOKENS) || DEFAULT_SCREEN_MAX_TOKENS,
      timeout: Number(process.env.PROTOTYPE_SCREEN_TIMEOUT_MS) || DEFAULT_SCREEN_AI_TIMEOUT_MS,
      fastMode: false,
      provider,
      ...overrides,
    };
  }
  return getUIAIOptions({
    maxTokens: Number(process.env.PROTOTYPE_SCREEN_MAX_TOKENS) || DEFAULT_SCREEN_MAX_TOKENS,
    timeout: Number(process.env.PROTOTYPE_SCREEN_TIMEOUT_MS) || DEFAULT_SCREEN_AI_TIMEOUT_MS,
    provider,
    ...overrides,
  });
};

export const getErrorMessage = (err) => {
  const data = err?.response?.data;
  if (typeof data?.error === "string") return data.error;
  if (data?.error?.message) return data.error.message;
  if (data?.message) return data.message;
  return err?.message || "Unknown error";
};

const isModelNotFound = (err) => {
  const msg = getErrorMessage(err);
  return err?.response?.status === 404 || /no endpoints found/i.test(msg);
};

const isJsonModeUnsupported = (err) => {
  const msg = getErrorMessage(err);
  return /response_format|json_object|not support|unsupported parameter/i.test(msg);
};

const isRateLimited = (err) => {
  const msg = getErrorMessage(err);
  const status = err?.response?.status;
  return status === 429 || /rate limit|free-models-per-day/i.test(msg);
};

const isRetryableError = (err) => {
  const msg = getErrorMessage(err);
  const status = err?.response?.status;
  return (
    err?.retryable === true
    || isModelNotFound(err)
    || isJsonModeUnsupported(err)
    || status === 429
    || status === 502
    || status === 503
    || /provider returned error|rate limit|timeout|overloaded|temporarily unavailable|empty response/i.test(msg)
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (err) => {
  const headers = err?.response?.headers || {};
  const raw = headers["retry-after"];
  if (raw != null) {
    const secs = Number(raw);
    if (Number.isFinite(secs) && secs >= 0) return Math.min(secs * 1000, 30000);
  }
  return null;
};

// Transparent retry with exponential backoff for rate limits (429) and transient 5xx.
// Honors the provider's Retry-After header (Groq free tier sends this).
const postWithRetry = async (url, body, config, { maxRetries = 4 } = {}) => {
  let attempt = 0;
  for (;;) {
    try {
      return await axios.post(url, body, config);
    } catch (err) {
      const status = err?.response?.status;
      const transient = status === 429 || status === 500 || status === 502 || status === 503;
      if (!transient || attempt >= maxRetries) throw err;
      const backoff = Math.min(1500 * 2 ** attempt, 16000);
      const waitMs = (parseRetryAfterMs(err) ?? backoff) + Math.floor(Math.random() * 400);
      attempt += 1;
      console.warn(`AI ${status} (rate/transient) — backing off ${waitMs}ms, retry ${attempt}/${maxRetries}`);
      await sleep(waitMs);
    }
  }
};

export const callAI = async (systemPrompt, userPrompt, useJsonMode = true, options = {}) => {
  const provider = options.provider || getAIProvider();
  const maxTokens = options.maxTokens || 4096;
  const timeout = options.timeout || getDefaultTimeout(false, provider);
  const models = options.models || getModelsToTry();

  if (isAnthropic(provider)) {
    try {
      return await callAnthropic(systemPrompt, userPrompt, useJsonMode, { ...options, models, maxTokens, timeout });
    } catch (err) {
      const msg = getErrorMessage(err);
      if (isFatalError(err)) throw err;
      if (/401|403|invalid.*key|authentication/i.test(msg)) {
        throw new Error("Anthropic API key is invalid or missing. Set ANTHROPIC_API_KEY in server/.env.");
      }
      if (/model|not_found|deprecated|retired/i.test(msg)) {
        const model = options.models?.[0] || "unknown";
        throw new Error(`Anthropic model "${model}" is invalid or retired. Update the model in llmCatalog.mjs or ANTHROPIC_MODEL in server/.env. Detail: ${msg}`);
      }
      throw new Error(`Anthropic request failed: ${msg}`);
    }
  }

  const { url, headers } = getAIRequestConfig(provider);
  const errors = [];

  for (const model of models) {
    let attempts = buildAttempts(model, useJsonMode);
    if (options.fastMode) {
      attempts = attempts.slice(0, 2);
    }

    for (const { withJson, withReasoningExclude } of attempts) {
      try {
        const body = {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: (isOllama(provider) || isGroq(provider)) ? 0.1 : 0.2,
          max_tokens: maxTokens,
        };

        if (withReasoningExclude) {
          body.reasoning = { exclude: true };
        }

        if (withJson) {
          body.response_format = { type: "json_object" };
          if (isOllama(provider)) {
            body.format = "json";
          }
        }

        if (isOllama(provider)) {
          body.stream = false;
          body.options = { num_predict: maxTokens };
        }

        const response = await postWithRetry(url, body, { headers, timeout });

        const content = extractMessageContent(response.data);
        if (!content) {
          console.warn(`Empty content from ${model}, raw:`, JSON.stringify(response.data).slice(0, 500));
          const err = new Error("Empty response from AI provider");
          err.retryable = true;
          throw err;
        }

        const providerLabel = isOllama(provider) ? "ollama" : isGroq(provider) ? "groq" : isAnthropic(provider) ? "anthropic" : "openrouter";
        console.log(`AI call OK — ${providerLabel}, model: ${model}${withJson ? " (json)" : ""}${withReasoningExclude ? " (no-reasoning)" : ""}`);
        return content;
      } catch (err) {
        const msg = getErrorMessage(err);
        const tag = `${model}${withJson ? " (json)" : ""}${withReasoningExclude ? " (no-reasoning)" : ""}`;
        errors.push(`${tag}: ${msg}`);
        console.warn(`AI attempt failed — ${model}: ${msg}`);

        if (isFatalError(err)) {
          throw err;
        }

        if (isRateLimited(err)) {
          console.warn(`Rate limited on ${model}, trying next model`);
          break;
        }

        if (isRetryableError(err)) {
          continue;
        }

        // Provider / format errors — try next attempt or model
        continue;
      }
    }
  }

  const providerLabel = isOllama(provider) ? "Ollama" : isGroq(provider) ? "Groq" : isAnthropic(provider) ? "Anthropic" : "OpenRouter";
  const summary = errors.length > 0
    ? `All AI models failed. ${errors.join(" | ")}`
    : `No AI models available on ${providerLabel}`;

  let message = summary;
  if (isOllama(provider) && errors.some((entry) => /ECONNREFUSED|connect ECONNREFUSED/i.test(entry))) {
    message = "Ollama is not reachable. Ensure the Ollama app is running and the model is installed (ollama list).";
  } else if (isOllama(provider) && errors.some((entry) => /timeout|ECONNABORTED/i.test(entry))) {
    message = "Ollama timed out. Large documents are processed in sections — quit and restart Ollama if it seems stuck, then try again.";
  } else if (isGroq(provider) && errors.some((entry) => /401|403|invalid api key/i.test(entry))) {
    message = "Groq API key is invalid or missing. Set GROQ_API_KEY in server/.env.";
  } else if (isGroq(provider) && errors.some((entry) => /rate limit|429/i.test(entry))) {
    message = "Groq rate limit reached. Wait a moment and try again, or reduce PROTOTYPE_SCREEN_CONCURRENCY.";
  } else if (isAnthropic(provider) && errors.some((entry) => /401|403|invalid api key/i.test(entry))) {
    message = "Anthropic API key is invalid or missing. Set ANTHROPIC_API_KEY in server/.env.";
  } else if (!isOllama(provider) && !isGroq(provider) && !isAnthropic(provider) && isFreeQuotaExhausted(errors)) {
    message = "OpenRouter free daily quota is exhausted or unavailable. Add credits at https://openrouter.ai/settings/credits or try again tomorrow.";
  }

  const err = new Error(message);
  err.attempts = errors;
  throw err;
};

const buildEnhanceSystemPrompt = ({ chunked = false, large = false } = {}) => {
  const storyLimit = chunked
    ? "- Generate 2-3 user stories for this section only."
    : large
      ? "- Generate 3-5 user stories (prioritize the most important features)."
      : "- Split into distinct user stories (1-10 based on complexity).";

  return `You are an expert Business Analyst. Analyze requirements and output detailed user stories as JSON only.

Rules:
${storyLimit}
- Format: "As a [role], I want [goal] so that [benefit]."
- feature: a short feature/epic name (2-4 words) that groups related stories (e.g. "Leave Management", "User Authentication", "Reporting"). Stories about the same capability MUST share the exact same feature name.
- Each story needs acceptanceCriteria (max 3), happyTests (max 2), negativeTests (max 2).
- fields: list the data fields the screen/feature uses. Each field is an object {name, type, description}. type is a concrete data type (e.g. text, email, number, date, dropdown, boolean, currency, file). Include 2-8 fields when the story involves a form, screen, or data; use [] for backend-only stories.
- businessRules: 1-4 concise business rules that govern the feature.
- validations: 1-4 input/field validation rules (required fields, formats, ranges).
- edgeCases: 1-3 edge cases to handle.
- constraints: 0-3 technical or business constraints.
- dependencies: 0-3 dependencies on other systems, stories, or data.
- businessImpact: one short sentence on the business value/impact.
- definitionOfReady: 2-4 bullet conditions that must be true before development can start (DoR).
- definitionOfDone: 2-4 bullet conditions that must be true for the story to be considered complete (DoD).
- wireframeApplicable: true for UI screens/forms/dashboards; false for backend-only processes.
- Output ONLY JSON with keys: storyCount, stories. No markdown.`;
};

const buildEnhanceUserPrompt = (content, opts = {}) => {
  const { chunkIndex, chunkTotal } = opts;
  const intro = chunkTotal > 1
    ? `Analyze section ${chunkIndex} of ${chunkTotal} and create user stories:`
    : "Analyze these requirements and create user stories:";

  return `${intro}

${content}

Return JSON:
{"storyCount":1,"stories":[{"title":"Short title","feature":"Leave Management","correctedText":"As a HR manager, I want ... so that ...","acceptanceCriteria":["..."],"happyTests":["..."],"negativeTests":["..."],"fields":[{"name":"Employee Name","type":"text","description":"Full name of the employee"},{"name":"Leave Type","type":"dropdown","description":"Type of leave requested"}],"businessRules":["..."],"validations":["..."],"edgeCases":["..."],"constraints":["..."],"dependencies":["..."],"businessImpact":"...","definitionOfReady":["..."],"definitionOfDone":["..."],"wireframeApplicable":true}]}`;
};

const dedupeStories = (stories) => {
  const seen = new Set();
  return stories.filter((story) => {
    const key = (story.title || story.correctedText || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const generateStoriesFromContent = async (content, opts = {}) => {
  const enhanceOptions = getEnhanceAIOptions(opts.aiOptions);
  const systemPrompt = buildEnhanceSystemPrompt({
    chunked: opts.chunked,
    large: !opts.chunked && isLargeContent(content),
  });
  let lastRaw = "";
  let lastError = "";

  for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
    const basePrompt = buildEnhanceUserPrompt(content, {
      chunkIndex: opts.chunkIndex,
      chunkTotal: opts.chunkTotal,
    });
    const userPrompt = attempt === 0
      ? basePrompt
      : `${basePrompt}\n\nFix: ${lastError}. Each correctedText must start with "As a" or "As an".`;

    lastRaw = await callAI(systemPrompt, userPrompt, true, enhanceOptions);
    let parsed;
    try {
      parsed = parseAIJson(lastRaw);
    } catch {
      lastError = "Response was not valid JSON";
      continue;
    }

    const stories = extractStoriesFromParsed(parsed);
    const validation = validateStories(stories);

    if (validation.valid) {
      return { stories, lastRaw };
    }

    lastError = validation.reason;
  }

  return { stories: [], lastRaw, lastError };
};

export const enhanceStory = async (req, res) => {
  const content = req.body.content || req.body.originalText;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    const chunks = getContentChunks(content);
    const enhanceOptions = withRequestSelection(req, getEnhanceAIOptions());
    const model = enhanceOptions.models?.[0] || getActiveOllamaModel();

    if (chunks.length > 1) {
      console.log(`Large content (${content.length} chars) — processing ${chunks.length} sections via Ollama (${model})`);
    } else if (usesOllamaCloud()) {
      console.log(`Processing ${content.length} chars in one pass via Ollama cloud (${model})`);
    }

    const mergedStories = [];
    let lastRaw = "";
    let lastError = "";

    for (let i = 0; i < chunks.length; i++) {
      const result = await generateStoriesFromContent(chunks[i], {
        chunked: chunks.length > 1,
        chunkIndex: i + 1,
        chunkTotal: chunks.length,
        aiOptions: enhanceOptions,
      });

      lastRaw = result.lastRaw || lastRaw;
      if (result.stories.length > 0) {
        mergedStories.push(...result.stories);
      } else if (result.lastError) {
        lastError = result.lastError;
      }
    }

    const stories = dedupeStories(mergedStories);

    if (stories.length > 0) {
      return res.json({
        storyCount: stories.length,
        sourceContent: content,
        stories,
        chunked: chunks.length > 1,
      });
    }

    return res.status(422).json({
      error: chunks.length > 1
        ? "AI could not generate valid user stories from the document sections. Restart Ollama if it was stuck, then try again."
        : "AI could not generate valid user stories. Please try again.",
      detail: lastError,
      raw: lastRaw?.slice?.(0, 2000),
    });
  } catch (err) {
    console.error("AI enhance error:", err?.response?.data || err.message);
    res.status(500).json({
      error: err.message || getErrorMessage(err),
      detail: err.attempts || err?.response?.data,
    });
  }
};

const buildWireframeResponse = (parsed) => {
  if (parsed.applicable === false) {
    return {
      applicable: false,
      message: parsed.message || "View not applicable for this user story",
      html: "",
      css: "",
      js: "",
      fullDocument: "",
    };
  }

  const html = sanitizePrototypeCode(parsed.html || "");
  const css = sanitizePrototypeCode(parsed.css || "");
  const js = sanitizePrototypeCode(parsed.js || "");

  if (!html.trim()) {
    return {
      applicable: false,
      message: "Wireframe could not be generated for this story",
      html: "",
      css: "",
      js: "",
      fullDocument: "",
    };
  }

  return {
    applicable: true,
    html,
    css,
    js,
    fullDocument: buildFullDocument(html, css, js),
    message: "",
  };
};

const nonEmptyList = (value) =>
  Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean) : [];

const buildFieldsSpec = (fields) => {
  if (!Array.isArray(fields)) return [];
  return fields
    .map((field) => {
      if (typeof field === "string") return { name: field.trim(), type: "", description: "" };
      if (field && typeof field === "object") {
        return {
          name: String(field.name ?? "").trim(),
          type: String(field.type ?? "").trim(),
          description: String(field.description ?? "").trim(),
        };
      }
      return null;
    })
    .filter((field) => field && (field.name || field.type || field.description));
};

export const generateUI = async (req, res) => {
  const {
    correctedText,
    acceptanceCriteria,
    feature,
    wireframeApplicable,
    regenerateNotes,
    existingWireframe,
    fields,
    businessRules,
    validations,
    edgeCases,
    constraints,
    dependencies,
    businessImpact,
    definitionOfReady,
    definitionOfDone,
  } = req.body;

  if (wireframeApplicable === false) {
    return res.json({
      applicable: false,
      message: "View not applicable for this user story",
    });
  }

  if (!correctedText?.trim()) {
    return res.status(400).json({ error: "User story text is required" });
  }

  const isRegenerate = Boolean(regenerateNotes?.trim() || existingWireframe?.html);

  const systemPrompt = `You are a frontend developer. Return JSON only.
Build a realistic, functional UI that implements EVERY listed field (with the correct input type), enforces the validation rules, and respects the business rules and constraints.
If no visual UI needed: {"applicable":false,"message":"View not applicable for this user story"}
Else: {"applicable":true,"html":"<div>...</div>","css":"...","js":"..."}`;

  const fieldSpec = buildFieldsSpec(fields);
  const rulesList = nonEmptyList(businessRules);
  const validationList = nonEmptyList(validations);
  const edgeCaseList = nonEmptyList(edgeCases);
  const constraintList = nonEmptyList(constraints);
  const dependencyList = nonEmptyList(dependencies);
  const dorList = nonEmptyList(definitionOfReady);
  const dodList = nonEmptyList(definitionOfDone);

  let userPrompt = `User Story: "${correctedText}"
${feature && String(feature).trim() ? `Feature / module: ${String(feature).trim()}\n` : ""}Acceptance Criteria: ${JSON.stringify(acceptanceCriteria || [])}
`;

  if (fieldSpec.length > 0) {
    userPrompt += `\nFields to render (build a real input for each, using the given type — text/email/number/date/dropdown/checkbox/file/etc.):\n${JSON.stringify(fieldSpec)}\n`;
  }
  if (rulesList.length > 0) {
    userPrompt += `\nBusiness rules (reflect in the UI behavior/labels/help text): ${JSON.stringify(rulesList)}\n`;
  }
  if (validationList.length > 0) {
    userPrompt += `\nValidation rules (add required markers, patterns, inline error messages): ${JSON.stringify(validationList)}\n`;
  }
  if (edgeCaseList.length > 0) {
    userPrompt += `\nEdge cases to account for in the UI: ${JSON.stringify(edgeCaseList)}\n`;
  }
  if (constraintList.length > 0) {
    userPrompt += `\nConstraints: ${JSON.stringify(constraintList)}\n`;
  }
  if (dependencyList.length > 0) {
    userPrompt += `\nDependencies: ${JSON.stringify(dependencyList)}\n`;
  }
  if (businessImpact && String(businessImpact).trim()) {
    userPrompt += `\nBusiness impact: ${String(businessImpact).trim()}\n`;
  }
  if (dorList.length > 0) {
    userPrompt += `\nDefinition of Ready: ${JSON.stringify(dorList)}\n`;
  }
  if (dodList.length > 0) {
    userPrompt += `\nDefinition of Done (the UI should make these achievable): ${JSON.stringify(dodList)}\n`;
  }

  if (isRegenerate) {
    userPrompt += `\nRegenerate the wireframe.`;
    if (existingWireframe?.html) {
      userPrompt += `\nExisting HTML to improve:\n${existingWireframe.html.slice(0, 3000)}`;
    }
    if (regenerateNotes?.trim()) {
      userPrompt += `\nAdditional UI requirements from the user:\n${regenerateNotes.trim()}`;
    }
  } else {
    userPrompt += `\nGenerate a polished web UI wireframe.`;
  }

  const uiOptions = withRequestSelection(req, getUIAIOptions());
  let lastRaw = "";
  let lastError = "Response was not valid JSON";

  try {
    for (let attempt = 0; attempt <= MAX_UI_PARSE_RETRIES; attempt++) {
      const prompt = attempt === 0
        ? userPrompt
        : `${userPrompt}\n\nYour previous response was invalid JSON (${lastError}). Return ONLY valid JSON with keys applicable, html, css, js. Do not double-escape quotes.`;

      lastRaw = await callAI(systemPrompt, prompt, true, uiOptions);
      try {
        const parsed = parseAIJson(lastRaw);
        return res.json(buildWireframeResponse(parsed));
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(422).json({
      error: "AI wireframe response could not be parsed. Other stories can still be generated.",
      detail: lastError,
      raw: lastRaw?.slice?.(0, 2000),
    });
  } catch (err) {
    console.error("UI generation error:", err?.response?.data || err.message);
    res.status(500).json({
      error: getErrorMessage(err),
      detail: err.attempts || err?.response?.data,
    });
  }
};
