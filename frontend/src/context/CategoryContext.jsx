// src/context/CategoryContext.jsx
// Global category state. Fetched once after login and kept in sync
// so every page (TaskForm dropdowns, CategoryPage, Sidebar) reads the
// same list without extra API calls.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { categoriesAPI } from "../api";
import { useAuth } from "./AuthContext";

const CategoryContext = createContext({
  categories: [],
  loading: false,
  refresh: async () => {},
  addCategory: () => {},
  updateCategory: () => {},
  removeCategory: () => {},
});

export function CategoryProvider({ children }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);

  // Fetch all categories for the current user
  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data.data);
    } catch (err) {
      console.error("[CategoryContext] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load on mount and whenever the logged-in user changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Optimistic helpers so callers can update local state without waiting
  // for a full re-fetch (reduces flicker on CRUD)

  const addCategory = useCallback((cat) => {
    setCategories((prev) => [cat, ...prev]);
  }, []);

  const updateCategory = useCallback((updated) => {
    setCategories((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );
  }, []);

  const removeCategory = useCallback((id) => {
    setCategories((prev) => prev.filter((c) => c._id !== id));
  }, []);

  return (
    <CategoryContext.Provider
      value={{ categories, loading, refresh, addCategory, updateCategory, removeCategory }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoryContext);
}
