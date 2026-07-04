// src/pages/RegisterPage.jsx
// Registration form with name, email, password, and confirm-password.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiUserPlus, FiCheckSquare } from "react-icons/fi";
import { useAuth }  from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function RegisterPage() {
  const { register }  = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim())                       errs.name     = "Name is required";
    else if (form.name.trim().length < 2)        errs.name     = "Name must be at least 2 characters";
    if (!form.email.trim())                      errs.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))  errs.email    = "Enter a valid email";
    if (!form.password)                          errs.password = "Password is required";
    else if (form.password.length < 6)           errs.password = "Password must be at least 6 characters";
    if (!form.confirm)                           errs.confirm  = "Please confirm your password";
    else if (form.confirm !== form.password)     errs.confirm  = "Passwords do not match";
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
      await register(form.name, form.email, form.password);
      showToast("Account created! Welcome to TaskFlow 🎉", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
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

        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">Start organising your tasks today</p>

        {errors.form && (
          <div className="alert alert--error" role="alert">{errors.form}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className={`form-group ${errors.name ? "form-group--error" : ""}`}>
            <label className="form-label" htmlFor="name">Full Name</label>
            <div className="input-icon-wrapper">
              <FiUser className="input-icon" />
              <input
                id="name"
                type="text"
                name="name"
                className="input input--icon"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                autoComplete="name"
                autoFocus
              />
            </div>
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

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
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className={`form-group ${errors.confirm ? "form-group--error" : ""}`}>
            <label className="form-label" htmlFor="confirm">Confirm Password</label>
            <div className="input-icon-wrapper">
              <FiLock className="input-icon" />
              <input
                id="confirm"
                type="password"
                name="confirm"
                className="input input--icon"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={handleChange}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            {errors.confirm && <span className="form-error">{errors.confirm}</span>}
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? <span className="spinner spinner--sm" /> : <><FiUserPlus /> Create Account</>}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{" "}
          <Link to="/login" className="link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
