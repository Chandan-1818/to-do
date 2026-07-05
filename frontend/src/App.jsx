// src/App.jsx — Root: providers, layout, routes.

import { useState }                               from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence, motion }                from "framer-motion";
import { useLocation }                            from "react-router-dom";

import { AuthProvider }          from "./context/AuthContext";
import { ThemeProvider }         from "./context/ThemeContext";
import { ToastProvider }         from "./context/ToastContext";
import { CategoryProvider }      from "./context/CategoryContext";
import { NotificationProvider }  from "./context/NotificationContext";

import Sidebar        from "./components/Sidebar";
import Topbar         from "./components/Topbar";
import Toast          from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage          from "./pages/LoginPage";
import RegisterPage       from "./pages/RegisterPage";
import DashboardPage      from "./pages/DashboardPage";
import TasksPage          from "./pages/TasksPage";
import CategoryPage       from "./pages/CategoryPage";
import CategoryDetailPage from "./pages/CategoryDetailPage";
import ProfilePage        from "./pages/ProfilePage";
import SettingsPage       from "./pages/SettingsPage";
import NotFoundPage       from "./pages/NotFoundPage";

import { useAuth } from "./context/AuthContext";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0  }}
        exit={{    opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Routes location={location}>
          <Route path="/login"    element={<LoginPage />}    />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard"        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/tasks"            element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
          <Route path="/categories"       element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
          <Route path="/categories/:id"   element={<ProtectedRoute><CategoryDetailPage /></ProtectedRoute>} />
          <Route path="/profile"          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings"         element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const AUTH_PATHS = ["/login", "/register"];

function AppShell() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAuth   = AUTH_PATHS.includes(location.pathname);

  if (!user || isAuth) {
    return (
      <>
        <Toast />
        <AnimatedRoutes />
      </>
    );
  }

  return (
    <>
      <Toast />
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="app-layout">
        <div className={`sidebar-wrapper${mobileMenuOpen ? " sidebar-wrapper--open" : ""}`}>
          <Sidebar />
        </div>
        <div className="app-main">
          <Topbar onMobileMenuToggle={() => setMobileMenuOpen((p) => !p)} />
          <div className="app-content">
            <AnimatedRoutes />
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CategoryProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AppShell />
              </BrowserRouter>
            </NotificationProvider>
          </CategoryProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
