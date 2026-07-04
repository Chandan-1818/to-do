// src/components/ProtectedRoute.jsx
// Wraps routes that require authentication.
// Redirects unauthenticated users to /login while preserving the
// originally requested URL so they can be sent back after login.

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still checking localStorage / server — show nothing to avoid flash
  if (loading) {
    return (
      <div className="full-page-loader">
        <div className="spinner spinner--lg"></div>
      </div>
    );
  }

  if (!user) {
    // Pass the current location so Login can redirect back after success
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
