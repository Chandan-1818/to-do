// src/pages/LoginPage.jsx
// Login form. Redirects to the page the user tried to visit (or /dashboard).

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMail, FiLock, FiLogIn, FiCheckSquare } from "react-icons/fi";
import { useAuth }  from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function LoginPage() {
  const { login }     = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();
  const location      = useLocation();

  // Redirect back to the page that sent them here, default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm]       = useState({ email: "", password: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.email.trim())    errs.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password)        errs.password = "Password is required";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await login(form.email, form.password);
      showToast("Welcome back!", "success");
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      showToast(msg, "error");
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card card">
        {/* Brand */}
        <div className="auth-card__brand">
          <FiCheckSquare className="auth-card__brand-icon" />
          <span>TaskFlow</span>
        </div>

        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to continue to your tasks</p>

        {/* Form-level error */}
        {errors.form && (
          <div className="alert alert--error" role="alert">{errors.form}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className={`form-group ${errors.email ? "form-group--error" : ""}`}>
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-icon-wrapper">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                name="email"
                className="input input--icon"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className={`form-group ${errors.password ? "form-group--error" : ""}`}>
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <FiLock className="input-icon" />
              <input
                id="password"
                type="password"
                name="password"
                className="input input--icon"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? <span className="spinner spinner--sm" /> : <><FiLogIn /> Sign In</>}
          </button>
        </form>

        <p className="auth-card__footer">
          Don't have an account?{" "}
          <Link to="/register" className="link">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
