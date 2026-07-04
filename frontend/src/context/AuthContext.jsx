// src/context/AuthContext.jsx
// Global authentication state. Wraps the whole app so any component can
// read the current user or call login/logout without prop-drilling.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api";

// Create the context with a default shape (helps with IDE autocomplete)
const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true); // true until the initial /me check finishes

  // ── Restore session on mount ─────────────────────────────────────────────────
  // If a token exists in localStorage, verify it with the server and populate user
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await authAPI.getMe();
        setUser(res.data.user);
        setToken(storedToken);
      } catch {
        // Token is invalid or expired — clear it
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
    return res.data;
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
    return res.data;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  // ── Update user in state (after profile edit) ─────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom hook for easy consumption ──────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
