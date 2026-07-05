// src/pages/LoginPage.jsx — Premium animated login page

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiLogIn, FiCheckSquare } from "react-icons/fi";
import { useAuth }  from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function LoginPage() {
  const { login }     = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();
  const location      = useLocation();
  const from          = location.state?.from?.pathname || "/dashboard";

  const [form,    setForm]    = useState({ email: "", password: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim())                    e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = "Enter a valid email";
    if (!form.password)                        e.password = "Password is required";
    return e;
  };

  const change = (f) => (ev) => {
    setForm((p) => ({ ...p, [f]: ev.target.value }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      showToast("Welcome back!", "success");
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      showToast(msg, "error");
      setErrors({ form: msg });
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        <div className="auth-card__brand">
          <FiCheckSquare />
          <span>TaskFlow</span>
        </div>
        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to continue to your workspace</p>

        {errors.form && <div className="alert alert--error">{errors.form}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {[
            { id: "email",    type: "email",    label: "Email",    Icon: FiMail, auto: "email",            ph: "you@example.com", field: "email"    },
            { id: "password", type: "password", label: "Password", Icon: FiLock, auto: "current-password", ph: "••••••••",         field: "password" },
          ].map(({ id, type, label, Icon, auto, ph, field }) => (
            <div key={id} className={`form-group ${errors[field] ? "form-group--error" : ""}`}>
              <label className="form-label" htmlFor={id}>{label}</label>
              <div className="input-icon-wrapper">
                <Icon className="input-icon" />
                <input
                  id={id} type={type} name={field}
                  className="input input--icon"
                  placeholder={ph}
                  value={form[field]}
                  onChange={change(field)}
                  disabled={loading}
                  autoComplete={auto}
                  autoFocus={field === "email"}
                />
              </div>
              {errors[field] && <span className="form-error">{errors[field]}</span>}
            </div>
          ))}

          <motion.button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <span className="spinner spinner--sm" /> : <><FiLogIn /> Sign In</>}
          </motion.button>
        </form>

        <p className="auth-card__footer">
          Don't have an account?{" "}
          <Link to="/register" className="link">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
