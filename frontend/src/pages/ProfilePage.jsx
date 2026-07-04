// src/pages/ProfilePage.jsx
// View and update user name and password.

import { useState } from "react";
import { FiUser, FiMail, FiLock, FiSave, FiCalendar } from "react-icons/fi";
import { useAuth }  from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authAPI }  from "../api";

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast }        = useToast();

  const [nameForm, setNameForm]     = useState({ name: user?.name || "" });
  const [passForm, setPassForm]     = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [nameErrors, setNameErrors] = useState({});
  const [passErrors, setPassErrors] = useState({});
  const [nameLoading, setNameLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // ── Update name ────────────────────────────────────────────────────────────
  const validateName = () => {
    const errs = {};
    if (!nameForm.name.trim())              errs.name = "Name is required";
    else if (nameForm.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    return errs;
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    const errs = validateName();
    if (Object.keys(errs).length > 0) { setNameErrors(errs); return; }

    setNameLoading(true);
    try {
      const res = await authAPI.updateProfile({ name: nameForm.name.trim() });
      updateUser(res.data.user);
      showToast("Name updated successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally {
      setNameLoading(false);
    }
  };

  // ── Update password ────────────────────────────────────────────────────────
  const validatePass = () => {
    const errs = {};
    if (!passForm.currentPassword)                  errs.currentPassword = "Current password is required";
    if (!passForm.newPassword)                      errs.newPassword     = "New password is required";
    else if (passForm.newPassword.length < 6)       errs.newPassword     = "Must be at least 6 characters";
    if (!passForm.confirm)                          errs.confirm         = "Please confirm the new password";
    else if (passForm.confirm !== passForm.newPassword) errs.confirm     = "Passwords do not match";
    return errs;
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePass();
    if (Object.keys(errs).length > 0) { setPassErrors(errs); return; }

    setPassLoading(true);
    try {
      await authAPI.updateProfile({
        currentPassword: passForm.currentPassword,
        newPassword:     passForm.newPassword,
      });
      showToast("Password changed successfully!", "success");
      setPassForm({ currentPassword: "", newPassword: "", confirm: "" });
      setPassErrors({});
    } catch (err) {
      showToast(err.response?.data?.message || "Password update failed", "error");
    } finally {
      setPassLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings.</p>
      </div>

      {/* User info banner */}
      <div className="profile-banner card">
        <div className="profile-banner__avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-banner__info">
          <h2 className="profile-banner__name">{user?.name}</h2>
          <p className="profile-banner__email">
            <FiMail /> {user?.email}
          </p>
          <p className="profile-banner__joined">
            <FiCalendar /> Member since{" "}
            {new Date(user?.createdAt).toLocaleDateString(undefined, {
              month: "long", year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* ── Update Name ───────────────────────────────────────────────── */}
      <div className="card profile-section">
        <h2 className="profile-section__title">
          <FiUser /> Update Name
        </h2>
        <form onSubmit={handleNameSubmit} noValidate>
          <div className={`form-group ${nameErrors.name ? "form-group--error" : ""}`}>
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="input"
              value={nameForm.name}
              onChange={(e) => {
                setNameForm({ name: e.target.value });
                if (nameErrors.name) setNameErrors({});
              }}
              disabled={nameLoading}
              maxLength={50}
              autoComplete="name"
            />
            {nameErrors.name && <span className="form-error">{nameErrors.name}</span>}
          </div>
          <button type="submit" className="btn btn--primary" disabled={nameLoading}>
            {nameLoading ? <span className="spinner spinner--sm" /> : <><FiSave /> Save Name</>}
          </button>
        </form>
      </div>

      {/* ── Change Password ───────────────────────────────────────────── */}
      <div className="card profile-section">
        <h2 className="profile-section__title">
          <FiLock /> Change Password
        </h2>
        <form onSubmit={handlePassSubmit} noValidate>
          {/* Current password */}
          <div className={`form-group ${passErrors.currentPassword ? "form-group--error" : ""}`}>
            <label className="form-label" htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              className="input"
              value={passForm.currentPassword}
              onChange={(e) => {
                setPassForm((p) => ({ ...p, currentPassword: e.target.value }));
                if (passErrors.currentPassword) setPassErrors((p) => ({ ...p, currentPassword: "" }));
              }}
              disabled={passLoading}
              autoComplete="current-password"
            />
            {passErrors.currentPassword && <span className="form-error">{passErrors.currentPassword}</span>}
          </div>

          {/* New password */}
          <div className={`form-group ${passErrors.newPassword ? "form-group--error" : ""}`}>
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              className="input"
              value={passForm.newPassword}
              onChange={(e) => {
                setPassForm((p) => ({ ...p, newPassword: e.target.value }));
                if (passErrors.newPassword) setPassErrors((p) => ({ ...p, newPassword: "" }));
              }}
              disabled={passLoading}
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
            {passErrors.newPassword && <span className="form-error">{passErrors.newPassword}</span>}
          </div>

          {/* Confirm new password */}
          <div className={`form-group ${passErrors.confirm ? "form-group--error" : ""}`}>
            <label className="form-label" htmlFor="confirmPass">Confirm New Password</label>
            <input
              id="confirmPass"
              type="password"
              className="input"
              value={passForm.confirm}
              onChange={(e) => {
                setPassForm((p) => ({ ...p, confirm: e.target.value }));
                if (passErrors.confirm) setPassErrors((p) => ({ ...p, confirm: "" }));
              }}
              disabled={passLoading}
              autoComplete="new-password"
            />
            {passErrors.confirm && <span className="form-error">{passErrors.confirm}</span>}
          </div>

          <button type="submit" className="btn btn--primary" disabled={passLoading}>
            {passLoading ? <span className="spinner spinner--sm" /> : <><FiLock /> Change Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
