import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "../api/axiosInstance";
import { useAuth } from "./AuthContext";
import { LLM_STORAGE_KEY, normalizeSelectionId } from "../constants/llm";

const LLMContext = createContext(null);

const tierStyles = {
  free: { color: "var(--green)", label: "Free" },
  freemium: { color: "var(--yellow, #e6a817)", label: "Free tier" },
  paid: { color: "var(--orange, #f97316)", label: "Paid" },
};

export const getTierStyle = (tier) => tierStyles[tier] || tierStyles.paid;

const readStoredSelection = () => normalizeSelectionId(localStorage.getItem(LLM_STORAGE_KEY) || "");

const pickDefaultSelection = (list) => {
  const defaultEntry = list.find((m) => m.isDefault && m.configured)
    || list.find((m) => m.configured);
  return defaultEntry?.id || "";
};

export const LLMProvider = ({ children }) => {
  const { user } = useAuth();
  const [models, setModels] = useState([]);
  const [configuredModels, setConfiguredModels] = useState([]);
  const [selectedId, setSelectedIdState] = useState(readStoredSelection);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/ai/models");
      const all = res.data?.models || [];
      const configured = res.data?.configuredModels || all.filter((m) => m.configured);
      setModels(all);
      setConfiguredModels(configured);

      const stored = readStoredSelection();
      if (stored !== localStorage.getItem(LLM_STORAGE_KEY)) {
        localStorage.setItem(LLM_STORAGE_KEY, stored);
      }

      const storedEntry = stored ? configured.find((m) => m.id === stored) : null;

      if (storedEntry) {
        setSelectedIdState(storedEntry.id);
        return;
      }

      const nextId = pickDefaultSelection(configured);
      if (nextId) {
        setSelectedIdState(nextId);
        localStorage.setItem(LLM_STORAGE_KEY, nextId);
      } else if (stored) {
        localStorage.removeItem(LLM_STORAGE_KEY);
        setSelectedIdState("");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not load AI models");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchModels();
  }, [user, fetchModels]);

  const setSelectedId = useCallback((id) => {
    const normalized = normalizeSelectionId(id);
    if (!normalized) return;
    localStorage.setItem(LLM_STORAGE_KEY, normalized);
    setSelectedIdState(normalized);
  }, []);

  const selectedModel = useMemo(
    () => configuredModels.find((m) => m.id === selectedId)
      || models.find((m) => m.id === selectedId)
      || null,
    [configuredModels, models, selectedId]
  );

  const value = useMemo(() => ({
    models,
    configuredModels,
    selectedModel,
    selectedId,
    setSelectedId,
    loading,
    error,
    refreshModels: fetchModels,
  }), [models, configuredModels, selectedModel, selectedId, setSelectedId, loading, error, fetchModels]);

  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>;
};

export const useLLM = () => {
  const ctx = useContext(LLMContext);
  if (!ctx) throw new Error("useLLM must be used within LLMProvider");
  return ctx;
};

export default LLMContext;
