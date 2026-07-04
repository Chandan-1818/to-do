// src/pages/NotFoundPage.jsx
// 404 page shown for any unmatched route.

import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheckSquare } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

function NotFoundPage() {
  const { user } = useAuth();

  return (
    <div className="not-found-page">
      <div className="not-found__content">
        <FiCheckSquare className="not-found__icon" />
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Page not found</h2>
        <p className="not-found__text">
          Looks like you've wandered off the task list. Let's get you back on track.
        </p>
        <Link
          to={user ? "/dashboard" : "/login"}
          className="btn btn--primary"
        >
          <FiArrowLeft />
          {user ? "Back to Dashboard" : "Back to Login"}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
