// src/pages/SettingsPage.jsx — App preferences and account settings

import { motion } from "framer-motion";
import {
  FiSun, FiMoon, FiTrash2, FiShield,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { useAuth }  from "../context/AuthContext";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: FiSun  },
  { value: "dark",  label: "Dark",  icon: FiMoon },
];

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0  },
};

function SettingCard({ title, description, children, delay = 0 }) {
  return (
    <motion.div
      className="settings-card glass-card"
      variants={cardVariant}
      initial="hidden"
      animate="show"
      transition={{ delay, type: "spring", stiffness: 280, damping: 26 }}
    >
      <div className="settings-card__header">
        <div>
          <h2 className="settings-card__title">{title}</h2>
          {description && (
            <p className="settings-card__desc">{description}</p>
          )}
        </div>
      </div>
      <div className="settings-card__body">{children}</div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user }               = useAuth();

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customise your TaskFlow experience.</p>
      </div>

      {/* Appearance */}
      <SettingCard
        title="Appearance"
        description="Choose how TaskFlow looks on this device."
        delay={0.05}
      >
        <div className="settings-theme-row">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <motion.button
              key={value}
              className={`settings-theme-btn${theme === value ? " settings-theme-btn--active" : ""}`}
              onClick={() => { if (theme !== value) toggleTheme(); }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              aria-pressed={theme === value}
            >
              <Icon className="settings-theme-btn__icon" />
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </SettingCard>

      {/* Notifications (UI-only placeholder) */}
      <SettingCard
        title="Notifications"
        description="Manage reminders and alerts."
        delay={0.10}
      >
        {[
          { label: "Due date reminders",      desc: "Get notified when a task is due soon" },
          { label: "Weekly digest",           desc: "Summary of your productivity every Monday" },
          { label: "Task completion streak",  desc: "Celebrate completing all daily tasks" },
        ].map(({ label, desc }) => (
          <div key={label} className="settings-toggle-row">
            <div>
              <p className="settings-toggle-row__label">{label}</p>
              <p className="settings-toggle-row__desc">{desc}</p>
            </div>
            <label className="toggle" aria-label={label}>
              <input type="checkbox" defaultChecked={label === "Due date reminders"} />
              <span className="toggle__track">
                <span className="toggle__thumb" />
              </span>
            </label>
          </div>
        ))}
      </SettingCard>

      {/* Account info (read-only summary, edits are on /profile) */}
      <SettingCard
        title="Account"
        description="Your account details. Edit on the Profile page."
        delay={0.15}
      >
        <div className="settings-info-row">
          <span className="settings-info-row__key">Name</span>
          <span className="settings-info-row__val">{user?.name}</span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-row__key">Email</span>
          <span className="settings-info-row__val">{user?.email}</span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-row__key">Member since</span>
          <span className="settings-info-row__val">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                  month: "long", year: "numeric",
                })
              : "—"}
          </span>
        </div>
      </SettingCard>

      {/* Danger zone (UI-only) */}
      <SettingCard
        title="Danger Zone"
        description="Irreversible actions — proceed with caution."
        delay={0.20}
      >
        <div className="settings-danger-row">
          <div>
            <p className="settings-danger-row__label">Delete all tasks</p>
            <p className="settings-danger-row__desc">Permanently removes every task in your account.</p>
          </div>
          <button className="btn btn--danger btn--sm" disabled title="Contact support to proceed">
            <FiTrash2 /> Delete all tasks
          </button>
        </div>
        <div className="settings-danger-row">
          <div>
            <p className="settings-danger-row__label">Delete account</p>
            <p className="settings-danger-row__desc">All data will be permanently erased.</p>
          </div>
          <button className="btn btn--danger btn--sm" disabled title="Contact support to proceed">
            <FiShield /> Delete account
          </button>
        </div>
      </SettingCard>
    </div>
  );
}
