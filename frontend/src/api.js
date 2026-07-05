// src/api.js — Centralised Axios instance. JWT attached via request interceptor.

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle expired tokens ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register:      (data) => api.post("/auth/register", data),
  login:         (data) => api.post("/auth/login",    data),
  getMe:         ()     => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile",   data),
};

// ── Tasks API ─────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll:   (params)   => api.get("/tasks",       { params }),
  getStats: (params)   => api.get("/tasks/stats", { params }),
  getById:  (id)       => api.get(`/tasks/${id}`),
  create:   (data)     => api.post("/tasks",       data),
  update:   (id, data) => api.put(`/tasks/${id}`,  data),
  delete:   (id)       => api.delete(`/tasks/${id}`),
};

// ── Categories API ────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll:  (params)        => api.get("/categories",         { params }),
  getById: (id)            => api.get(`/categories/${id}`),
  create:  (data)          => api.post("/categories",         data),
  update:  (id, data)      => api.put(`/categories/${id}`,    data),
  delete:  (id, params)    => api.delete(`/categories/${id}`, { params }),
};

// ── Notifications API ─────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:      (params) => api.get("/notifications",           { params }),
  markRead:    (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead: ()       => api.patch("/notifications/read-all"),
  deleteOne:   (id)     => api.delete(`/notifications/${id}`),
  clearAll:    ()       => api.delete("/notifications"),
};

export default api;
