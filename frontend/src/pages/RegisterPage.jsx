// src/pages/RegisterPage.jsx — Premium animated registration page

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock, FiUserPlus, FiCheckSquare } from "react-icons/fi";
import { useAuth }  from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function RegisterPage() {
  const { register }  = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  const [form,    setForm]    = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())                      e.name     = "Name is required";
    else if (form.name.trim().length < 2)       e.name     = "At least 2 characters";
    if (!form.email.trim())                     e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = "Enter a valid email";
    if (!form.password)                         e.password = "Password is required";
    else if (form.password.length < 6)          e.password = "At least 6 characters";
    if (form.confirm !== form.password)         e.confirm  = "Passwords don't match";
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
      await register(form.name, form.email, form.password);
      showToast("Welcome to TaskFlow 🎉", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      showToast(msg, "error");
      setErrors({ form: msg });
    } finally { setLoading(false); }
  };

  const fields = [
    { id: "name",     type: "text",     label: "Full Name",        Icon: FiUser, auto: "name",            ph: "Jane Doe",          field: "name"     },
    { id: "email",    type: "email",    label: "Email",            Icon: FiMail, auto: "email",           ph: "you@example.com",   field: "email"    },
    { id: "password", type: "password", label: "Password",         Icon: FiLock, auto: "new-password",   ph: "At least 6 chars",  field: "password" },
    { id: "confirm",  type: "password", label: "Confirm Password", Icon: FiLock, auto: "new-password",   ph: "Repeat password",   field: "confirm"  },
  ];

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
        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">Start organising your life, one task at a time</p>

        {errors.form && <div className="alert alert--error">{errors.form}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {fields.map(({ id, type, label, Icon, auto, ph, field }, i) => (
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
                  autoFocus={i === 0}
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
            {loading ? <span className="spinner spinner--sm" /> : <><FiUserPlus /> Create Account</>}
          </motion.button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{" "}
          <Link to="/login" className="link">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
