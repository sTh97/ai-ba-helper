import {
  LLM_CATALOG,
  normalizeSelectionId,
  listAvailableModels,
} from "../constants/llmCatalog.mjs";

const catalogIds = new Set(LLM_CATALOG.map((entry) => entry.id));

export const validateAllowedLlms = (allowedLlms) => {
  if (allowedLlms === undefined || allowedLlms === null) return [];
  if (!Array.isArray(allowedLlms)) {
    throw new Error("allowedLlms must be an array");
  }

  const normalized = [...new Set(allowedLlms.map((id) => normalizeSelectionId(String(id).trim())).filter(Boolean))];
  for (const id of normalized) {
    if (!catalogIds.has(id)) {
      throw new Error(`Invalid LLM: ${id}`);
    }
  }
  return normalized;
};

/** null = unrestricted (all configured models) */
export const getEffectiveAllowedLlms = (user) => {
  const userLlms = user?.allowedLlms || [];
  const roleLlms = user?.role?.allowedLlms || [];

  if (userLlms.length > 0) return userLlms.map(normalizeSelectionId);
  if (roleLlms.length > 0) return roleLlms.map(normalizeSelectionId);
  return null;
};

export const isSelectionAllowed = (user, selectionId) => {
  const allowed = getEffectiveAllowedLlms(user);
  if (!allowed) return true;
  return allowed.includes(normalizeSelectionId(selectionId));
};

export const filterModelsForUser = (listResult, user) => {
  const allowed = getEffectiveAllowedLlms(user);
  if (!allowed) return listResult;

  const allowedSet = new Set(allowed);
  const filter = (model) => allowedSet.has(model.id);
  const configuredModels = listResult.configuredModels.filter(filter);

  return {
    ...listResult,
    models: listResult.models.filter(filter),
    configuredModels,
    configuredCount: configuredModels.length,
  };
};

export const resolveAllowedSelection = (user, requestedId) => {
  const normalized = normalizeSelectionId(requestedId);
  if (isSelectionAllowed(user, normalized)) return normalized;

  const { configuredModels } = filterModelsForUser(listAvailableModels(), user);
  return configuredModels[0]?.id || null;
};
