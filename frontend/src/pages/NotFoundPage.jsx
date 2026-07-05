// src/pages/NotFoundPage.jsx

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function NotFoundPage() {
  const { user } = useAuth();
  return (
    <div className="not-found-page">
      <motion.div
        className="not-found__content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="not-found__code">404</p>
        <h2 className="not-found__title">Page not found</h2>
        <p className="not-found__text">
          Looks like you wandered off the task list.
        </p>
        <Link to={user ? "/dashboard" : "/login"} className="btn btn--primary">
          <FiArrowLeft /> {user ? "Back to Dashboard" : "Back to Login"}
        </Link>
      </motion.div>
    </div>
  );
}
