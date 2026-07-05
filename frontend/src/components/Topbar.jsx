// src/components/Topbar.jsx — Sticky top bar with search, theme, notifications, user chip.

import { useState, useRef, useEffect } from "react";
import { useLocation, Link }           from "react-router-dom";
import { motion, AnimatePresence }     from "framer-motion";
import { FiSearch, FiX, FiMenu, FiSun, FiMoon } from "react-icons/fi";
import { useAuth }              from "../context/AuthContext";
import { useTheme }             from "../context/ThemeContext";
import NotificationCenter       from "./NotificationCenter";

const TITLES = {
  "/dashboard":  "Dashboard",
  "/tasks":      "My Tasks",
  "/categories": "Categories",
  "/profile":    "Profile",
  "/settings":   "Settings",
};

export default function Topbar({ onMobileMenuToggle }) {
  const location               = useLocation();
  const { user }               = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal,  setSearchVal]  = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  const pageTitle = TITLES[location.pathname] ?? "TaskFlow";

  return (
    <header className="topbar">
      {/* ── Left ──────────────────────────────────────────────────── */}
      <div className="topbar__left">
        <button className="topbar__menu-btn icon-btn" onClick={onMobileMenuToggle} aria-label="Toggle menu">
          <FiMenu />
        </button>
        <AnimatePresence mode="wait">
          <motion.h1
            key={pageTitle}
            className="topbar__title"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
          >
            {pageTitle}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* ── Right ─────────────────────────────────────────────────── */}
      <div className="topbar__right">
        {/* Expandable search */}
        <div className="topbar__search-wrap">
          <AnimatePresence initial={false}>
            {searchOpen && (
              <motion.input
                ref={inputRef}
                className="topbar__search-input"
                placeholder="Search anything…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
            )}
          </AnimatePresence>
          <button className="icon-btn" onClick={() => setSearchOpen((p) => !p)} aria-label={searchOpen ? "Close search" : "Open search"}>
            {searchOpen ? <FiX /> : <FiSearch />}
          </button>
        </div>

        {/* Theme toggle */}
        <button className="icon-btn topbar__theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "light" ? <FiMoon /> : <FiSun />}
        </button>

        {/* ── Notification Center (fully functional) ────────────── */}
        <NotificationCenter />

        {/* User chip */}
        {user && (
          <Link to="/profile" className="topbar__user-chip" aria-label="Profile">
            <span className="topbar__avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="topbar__user-name">{user.name.split(" ")[0]}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
