// src/App.jsx
// Root component. Sets up context providers and React Router routes.

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Contexts
import { AuthProvider }  from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";

// Layout components
import Navbar          from "./components/Navbar";
import Footer          from "./components/Footer";
import Toast           from "./components/Toast";
import ProtectedRoute  from "./components/ProtectedRoute";

// Pages
import LoginPage    from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage    from "./pages/TasksPage";
import ProfilePage  from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
    </>
  );
}

function App() {
  return (
    // ThemeProvider must be outermost so dark class is on <html> before render
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            {/* Global toast stack — rendered outside <Routes> so it's always visible */}
            <Toast />

            <AppLayout>
              <Routes>
                {/* Public routes */}
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <TasksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* 404 catch-all */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
