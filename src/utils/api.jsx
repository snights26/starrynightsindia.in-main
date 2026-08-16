import axios from "axios";

const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

if (!configuredApiBaseUrl) {
  throw new Error("VITE_API_BASE_URL must be configured for the Public application.");
}

const api = axios.create({
  baseURL: configuredApiBaseUrl,
});

api.interceptors.request.use((config) => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth"));

    if (auth?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
  } catch (error) {
    console.error("Auth parse error");
  }

  return config;
});

api.interceptors.response.use((response) => response.data?.data ?? response.data);

export const apiBaseUrl = configuredApiBaseUrl;

export const resolveAssetUrl = (url) => {
  const value = typeof url === "string" ? url.trim() : "";
  if (!value || /^https?:\/\//i.test(value) || value.startsWith("blob:")) {
    return value;
  }
  if (value.startsWith("/api/")) {
    return `${apiBaseUrl.replace(/\/api$/, "")}${value}`;
  }
  // Older records were persisted before the API context path was included.
  // Keep those URLs working while all new uploads use /api/uploads/.
  if (value.startsWith("/uploads/")) {
    return `${apiBaseUrl}${value}`;
  }
  return "";
};

export default api;
