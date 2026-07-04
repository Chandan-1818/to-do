// src/components/Navbar.jsx
// Top navigation bar with: app logo, nav links, dark-mode toggle, and user menu.

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiCheckSquare,
  FiSun,
  FiMoon,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiHome,
  FiList,
} from "react-icons/fi";
import { useAuth }  from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

function Navbar() {
  const { user, logout }    = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast }       = useToast();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [menuOpen, setMenuOpen] = useState(false); // mobile hamburger state
  const [dropOpen, setDropOpen] = useState(false); // user dropdown state

  const handleLogout = () => {
    logout();
    showToast("Logged out successfully", "info");
    navigate("/login");
    setMenuOpen(false);
    setDropOpen(false);
  };

  // Helper to apply an active class on the current route
  const isActive = (path) => location.pathname === path ? "nav__link--active" : "";

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link to={user ? "/dashboard" : "/"} className="navbar__logo">
          <FiCheckSquare className="navbar__logo-icon" />
          <span>TaskFlow</span>
        </Link>

        {/* ── Desktop nav links ─────────────────────────────────────────── */}
        {user && (
          <ul className="navbar__links">
            <li>
              <Link to="/dashboard" className={`nav__link ${isActive("/dashboard")}`}>
                <FiHome /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/tasks" className={`nav__link ${isActive("/tasks")}`}>
                <FiList /> Tasks
              </Link>
            </li>
          </ul>
        )}

        {/* ── Right-side controls ───────────────────────────────────────── */}
        <div className="navbar__actions">
          {/* Dark / light toggle */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <FiMoon /> : <FiSun />}
          </button>

          {user ? (
            /* ── User dropdown ──────────────────────────────────────────── */
            <div className="user-menu">
              <button
                className="user-menu__trigger"
                onClick={() => setDropOpen((p) => !p)}
                aria-expanded={dropOpen}
                aria-label="User menu"
              >
                <span className="user-menu__avatar">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="user-menu__name">{user.name}</span>
              </button>

              {dropOpen && (
                <div className="user-menu__dropdown">
                  <Link
                    to="/profile"
                    className="user-menu__item"
                    onClick={() => setDropOpen(false)}
                  >
                    <FiUser /> Profile
                  </Link>
                  <button className="user-menu__item user-menu__item--danger" onClick={handleLogout}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Auth links (not logged in) ─────────────────────────────── */
            <div className="navbar__auth">
              <Link to="/login"    className="btn btn--ghost btn--sm">Login</Link>
              <Link to="/register" className="btn btn--primary btn--sm">Sign Up</Link>
            </div>
          )}

          {/* ── Mobile hamburger ─────────────────────────────────────────── */}
          <button
            className="icon-btn hamburger"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="navbar__mobile">
          {user ? (
            <>
              <Link to="/dashboard" className="mobile-nav__link" onClick={() => setMenuOpen(false)}>
                <FiHome /> Dashboard
              </Link>
              <Link to="/tasks" className="mobile-nav__link" onClick={() => setMenuOpen(false)}>
                <FiList /> Tasks
              </Link>
              <Link to="/profile" className="mobile-nav__link" onClick={() => setMenuOpen(false)}>
                <FiUser /> Profile
              </Link>
              <button className="mobile-nav__link mobile-nav__link--danger" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="mobile-nav__link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mobile-nav__link" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
