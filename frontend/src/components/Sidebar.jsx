// src/components/Sidebar.jsx
// Animated collapsible sidebar — desktop stays visible, mobile overlays.
// Uses Framer Motion for expand/collapse and active-item glow.

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckSquare, FiHome, FiList, FiTag, FiUser,
  FiSettings, FiLogOut, FiChevronLeft, FiChevronRight,
  FiSun, FiMoon,
} from "react-icons/fi";
import { useAuth }       from "../context/AuthContext";
import { useTheme }      from "../context/ThemeContext";
import { useToast }      from "../context/ToastContext";
import { useCategories } from "../context/CategoryContext";

const NAV_ITEMS = [
  { to: "/dashboard",  icon: FiHome,     label: "Dashboard" },
  { to: "/tasks",      icon: FiList,     label: "Tasks"     },
  { to: "/categories", icon: FiTag,      label: "Categories"},
  { to: "/profile",    icon: FiUser,     label: "Profile"   },
  { to: "/settings",   icon: FiSettings, label: "Settings"  },
];

const sidebarVariants = {
  expanded: { width: 220 },
  collapsed: { width: 64 },
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout }          = useAuth();
  const { theme, toggleTheme }    = useTheme();
  const { showToast }             = useToast();
  const { categories }            = useCategories();
  const navigate                  = useNavigate();

  const handleLogout = () => {
    logout();
    showToast("Logged out", "info");
    navigate("/login");
  };

  return (
    <motion.aside
      className="sidebar"
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* ── Brand ──────────────────────────────────────────────────────────── */}
      <div className="sidebar__brand">
        <FiCheckSquare className="sidebar__brand-icon" />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              className="sidebar__brand-name"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              TaskFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav items ──────────────────────────────────────────────────────── */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__item${isActive ? " sidebar__item--active" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="sidebar__active-bg"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <span className="sidebar__item-icon">
                  <Icon />
                </span>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      className="sidebar__item-label"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.16 }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Category count badge */}
                {to === "/categories" && categories.length > 0 && !collapsed && (
                  <span className="sidebar__badge">{categories.length}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom actions ──────────────────────────────────────────────────── */}
      <div className="sidebar__footer">
        {/* Theme toggle */}
        <button
          className="sidebar__item sidebar__item--action"
          onClick={toggleTheme}
          title={collapsed ? (theme === "light" ? "Dark mode" : "Light mode") : undefined}
          aria-label="Toggle theme"
        >
          <span className="sidebar__item-icon">
            {theme === "light" ? <FiMoon /> : <FiSun />}
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                className="sidebar__item-label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
              >
                {theme === "light" ? "Dark mode" : "Light mode"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User row */}
        {user && (
          <div className="sidebar__user" title={collapsed ? user.name : undefined}>
            <div className="sidebar__avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  className="sidebar__user-info"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.16 }}
                >
                  <span className="sidebar__user-name">{user.name}</span>
                  <span className="sidebar__user-email">{user.email}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Logout */}
        <button
          className="sidebar__item sidebar__item--danger"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          aria-label="Logout"
        >
          <span className="sidebar__item-icon"><FiLogOut /></span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                className="sidebar__item-label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          className="sidebar__collapse-btn"
          onClick={() => setCollapsed((p) => !p)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
    </motion.aside>
  );
}
