import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
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

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const resolveAssetUrl = (url) => {
  if (!url || url.startsWith("http") || url.startsWith("blob:")) {
    return url || "";
  }
  if (url.startsWith("/api/")) {
    return `${apiBaseUrl.replace(/\/api$/, "")}${url}`;
  }
  // Older records were persisted before the API context path was included.
  // Keep those URLs working while all new uploads use /api/uploads/.
  if (url.startsWith("/uploads/")) {
    return `${apiBaseUrl}${url}`;
  }
  return url;
};

export default api;
