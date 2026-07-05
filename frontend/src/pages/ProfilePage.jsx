// src/pages/ProfilePage.jsx — View and update user name and password

import { useState } from "react";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock, FiSave, FiCalendar, FiEdit2 } from "react-icons/fi";
import { useAuth }  from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authAPI }  from "../api";

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0  },
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast }        = useToast();

  const [nameForm, setNameForm] = useState({ name: user?.name || "" });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [nameErrors, setNameErrors] = useState({});
  const [passErrors, setPassErrors] = useState({});
  const [nameLoading, setNameLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const validateName = () => {
    const errs = {};
    if (!nameForm.name.trim())              errs.name = "Name is required";
    else if (nameForm.name.trim().length < 2) errs.name = "At least 2 characters";
    return errs;
  };

  const validatePass = () => {
    const errs = {};
    if (!passForm.currentPassword)                 errs.currentPassword = "Required";
    if (!passForm.newPassword)                     errs.newPassword     = "Required";
    else if (passForm.newPassword.length < 6)      errs.newPassword     = "Min 6 characters";
    if (passForm.confirm !== passForm.newPassword) errs.confirm         = "Passwords don't match";
    return errs;
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    const errs = validateName();
    if (Object.keys(errs).length) { setNameErrors(errs); return; }
    setNameLoading(true);
    try {
      const res = await authAPI.updateProfile({ name: nameForm.name.trim() });
      updateUser(res.data.user);
      showToast("Name updated!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally { setNameLoading(false); }
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePass();
    if (Object.keys(errs).length) { setPassErrors(errs); return; }
    setPassLoading(true);
    try {
      await authAPI.updateProfile({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      showToast("Password changed!", "success");
      setPassForm({ currentPassword: "", newPassword: "", confirm: "" });
      setPassErrors({});
    } catch (err) {
      showToast(err.response?.data?.message || "Password update failed", "error");
    } finally { setPassLoading(false); }
  };

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your personal information.</p>
      </div>

      {/* Avatar card */}
      <motion.div
        className="profile-hero glass-card"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="profile-hero__avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div className="profile-hero__info">
          <h2 className="profile-hero__name">{user?.name}</h2>
          <p className="profile-hero__email"><FiMail /> {user?.email}</p>
          <p className="profile-hero__joined">
            <FiCalendar /> Member since{" "}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
              : "—"}
          </p>
        </div>
      </motion.div>

      {/* Update name */}
      <motion.div
        className="glass-card profile-section"
        variants={cardVariant} initial="hidden" animate="show"
        transition={{ delay: 0.1 }}
      >
        <h2 className="profile-section__title"><FiEdit2 /> Update Name</h2>
        <form onSubmit={handleNameSubmit} noValidate>
          <div className={`form-group ${nameErrors.name ? "form-group--error" : ""}`}>
            <label className="form-label" htmlFor="pname">Full Name</label>
            <div className="input-icon-wrapper">
              <FiUser className="input-icon" />
              <input
                id="pname" type="text" className="input input--icon"
                value={nameForm.name}
                onChange={(e) => { setNameForm({ name: e.target.value }); if (nameErrors.name) setNameErrors({}); }}
                disabled={nameLoading} maxLength={50} autoComplete="name"
              />
            </div>
            {nameErrors.name && <span className="form-error">{nameErrors.name}</span>}
          </div>
          <button type="submit" className="btn btn--primary" disabled={nameLoading}>
            {nameLoading ? <span className="spinner spinner--sm" /> : <><FiSave /> Save Name</>}
          </button>
        </form>
      </motion.div>

      {/* Change password */}
      <motion.div
        className="glass-card profile-section"
        variants={cardVariant} initial="hidden" animate="show"
        transition={{ delay: 0.18 }}
      >
        <h2 className="profile-section__title"><FiLock /> Change Password</h2>
        <form onSubmit={handlePassSubmit} noValidate>
          {[
            { id: "curPw",  label: "Current Password", field: "currentPassword", auto: "current-password" },
            { id: "newPw",  label: "New Password",      field: "newPassword",     auto: "new-password",     hint: "Min 6 characters" },
            { id: "confPw", label: "Confirm Password",  field: "confirm",         auto: "new-password" },
          ].map(({ id, label, field, auto, hint }) => (
            <div key={id} className={`form-group ${passErrors[field] ? "form-group--error" : ""}`}>
              <label className="form-label" htmlFor={id}>{label}</label>
              <div className="input-icon-wrapper">
                <FiLock className="input-icon" />
                <input
                  id={id} type="password" className="input input--icon"
                  value={passForm[field]}
                  placeholder={hint}
                  onChange={(e) => {
                    setPassForm((p) => ({ ...p, [field]: e.target.value }));
                    if (passErrors[field]) setPassErrors((p) => ({ ...p, [field]: "" }));
                  }}
                  disabled={passLoading} autoComplete={auto}
                />
              </div>
              {passErrors[field] && <span className="form-error">{passErrors[field]}</span>}
            </div>
          ))}
          <button type="submit" className="btn btn--primary" disabled={passLoading}>
            {passLoading ? <span className="spinner spinner--sm" /> : <><FiLock /> Change Password</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
