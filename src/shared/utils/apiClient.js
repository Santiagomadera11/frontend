import axios from "axios";

const DEFAULT_BASE_URL = "https://syspharma-backend.onrender.com";

const normalizeBaseUrl = (value) => {
  if (!value) return DEFAULT_BASE_URL;
  return String(value).trim().replace(/\/+$/, "").replace(/\/api$/i, "");
};

const normalizeApiUrl = (url) => {
  if (!url) return url;

  const trimmed = String(url).trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/api")) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  if (trimmed.startsWith("api/")) {
    return `/${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    return `/api${trimmed}`;
  }

  return `/api/${trimmed}`;
};

export const apiClient = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL || DEFAULT_BASE_URL),
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("syspharma_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.url) {
      config.url = normalizeApiUrl(config.url);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status !== 409) {
      if (error.response?.data) {
        console.error("API Error Details:", {
          status: error.response.status,
          message: error.response.data.message,
          innerException: error.response.data.innerException,
          detail: error.response.data.detail,
          stackTrace: error.response.data.stackTrace,
          fullData: error.response.data,
        });
      } else {
        console.error("API Error:", error.message);
      }
    }

    if (error.response?.status === 401) {
      sessionStorage.removeItem("syspharma_token");
      sessionStorage.removeItem("syspharma_user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export const buildUrl = (resource) => normalizeApiUrl(resource);

export const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem("syspharma_token")}`,
  },
});