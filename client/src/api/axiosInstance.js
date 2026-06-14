import axios from "axios";
import { LLM_STORAGE_KEY } from "../constants/llm";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 600000, // 10 min — local Ollama + large docs processed in sections
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const aiSelection = localStorage.getItem(LLM_STORAGE_KEY);
  if (aiSelection) {
    config.headers["X-AI-Selection"] = aiSelection;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const pollWithTimeout = (url, timeoutMs = 10000) =>
  axiosInstance.get(url, { timeout: timeoutMs });

export default axiosInstance;
