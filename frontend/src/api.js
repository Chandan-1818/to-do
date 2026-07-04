// src/api.js
// Centralised Axios configuration.
// Automatically attaches the JWT from localStorage to every request
// and handles 401 responses by clearing the stale token.

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Single Axios instance shared across the whole app
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle expired tokens ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — force a fresh login
      localStorage.removeItem("token");
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ───────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)   => api.post("/auth/register", data),
  login:    (data)   => api.post("/auth/login",    data),
  getMe:    ()       => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
};

// ── Tasks API ──────────────────────────────────────────────────────────────────
export const tasksAPI = {
  // params: { search, status, sort, priority, category, page, limit }
  getAll:    (params) => api.get("/tasks",       { params }),
  getStats:  ()       => api.get("/tasks/stats"),
  getById:   (id)     => api.get(`/tasks/${id}`),
  create:    (data)   => api.post("/tasks",       data),
  update:    (id, data) => api.put(`/tasks/${id}`, data),
  delete:    (id)     => api.delete(`/tasks/${id}`),
};

export default api;
