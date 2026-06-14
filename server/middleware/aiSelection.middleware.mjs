import {
  getCatalogEntry,
  normalizeSelectionId,
  resolveAISelection,
  getDefaultSelectionId,
} from "../constants/llmCatalog.mjs";
import { isSelectionAllowed, resolveAllowedSelection } from "../utils/llmAccess.mjs";

export const attachAISelection = (req, _res, next) => {
  const header = req.headers["x-ai-selection"];
  const requestedId = normalizeSelectionId(
    typeof header === "string" && header.trim() ? header.trim() : getDefaultSelectionId()
  );

  const effectiveId = req.user
    ? resolveAllowedSelection(req.user, requestedId) || getDefaultSelectionId()
    : requestedId;

  const resolved = resolveAISelection(effectiveId);
  if (resolved) {
    req.aiSelection = resolved;
  } else {
    req.aiSelection = resolveAISelection(getDefaultSelectionId());
    if (header?.trim() && getCatalogEntry(requestedId)) {
      console.warn(`AI selection "${requestedId}" is not configured — using default "${req.aiSelection?.id}"`);
    }
  }

  if (req.user && header?.trim() && !isSelectionAllowed(req.user, requestedId)) {
    console.warn(
      `User ${req.user.email} requested disallowed AI model "${requestedId}" — using "${req.aiSelection?.id}"`
    );
  }

  next();
};
