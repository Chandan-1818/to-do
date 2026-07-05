// src/pages/CategoryPage.jsx
// Category management grid with enhanced cards: completion progress bar,
// analytics chips, and a "View Details" link on each card.

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link }                    from "react-router-dom";
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiTag, FiX,
  FiExternalLink, FiCheckCircle, FiClock,
  FiFolder, FiBriefcase, FiHome, FiBook, FiHeart,
  FiShoppingCart, FiMusic, FiCamera, FiCode, FiStar,
  FiZap, FiGlobe, FiAward, FiTool, FiCoffee,
  FiTrello, FiFeather, FiSun,
} from "react-icons/fi";
import { useCategories }   from "../context/CategoryContext";
import { useToast }        from "../context/ToastContext";
import { categoriesAPI }   from "../api";
import CategoryFormModal   from "../components/CategoryFormModal";
import ConfirmDialog       from "../components/ConfirmDialog";
import { SkeletonCategoryCard } from "../components/Skeleton";

// Icon map for dynamic rendering
const ICON_MAP = {
  FiFolder, FiBriefcase, FiHome, FiBook, FiHeart,
  FiShoppingCart, FiMusic, FiCamera, FiCode, FiStar,
  FiZap, FiGlobe, FiAward, FiTool, FiCoffee,
  FiTrello, FiFeather, FiSun,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.065 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 22, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1    },
};

export default function CategoryPage() {
  const { categories, loading, refresh, removeCategory } = useCategories();
  const { showToast } = useToast();

  // Re-fetch on mount so task counts / completion stats reflect any task
  // CRUD that happened on other pages since the last fetch.
  useEffect(() => { refresh(); }, [refresh]);

  const [search,       setSearch]       = useState("");
  const [formOpen,     setFormOpen]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMode,   setDeleteMode]   = useState("unassign");
  const [moveToId,     setMoveToId]     = useState("");
  const [deleting,     setDeleting]     = useState(false);

  const filtered = useMemo(
    () => categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    ),
    [categories, search]
  );

  const openDelete = (cat) => {
    setDeleteTarget(cat);
    setDeleteMode("unassign");
    setMoveToId("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const params = {};
      if (deleteMode === "deleteAll") {
        params.action = "deleteAll";
      } else if (deleteMode === "moveTo") {
        if (!moveToId) {
          showToast("Select a category to move tasks into", "warning");
          setDeleting(false);
          return;
        }
        params.action = "moveTo";
        params.moveTo = moveToId;
      }
      await categoriesAPI.delete(deleteTarget._id, params);
      removeCategory(deleteTarget._id);
      showToast(`"${deleteTarget.name}" deleted`, "info");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  const otherCategories = deleteTarget
    ? categories.filter((c) => c._id !== deleteTarget._id)
    : [];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Colour-coded workspaces for your tasks.</p>
        </div>
        <motion.button
          className="btn btn--primary"
          onClick={() => { setEditTarget(null); setFormOpen(true); }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        >
          <FiPlus /> New Category
        </motion.button>
      </div>

      {/* Search */}
      <div className="cat-search glass-card">
        <FiSearch className="cat-search__icon" />
        <input
          className="cat-search__input"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search categories"
        />
        {search && (
          <button className="icon-btn" onClick={() => setSearch("")} aria-label="Clear search">
            <FiX />
          </button>
        )}
      </div>

      {!loading && (
        <p className="tl-count">
          {filtered.length} {filtered.length === 1 ? "category" : "categories"}
          {categories.length > 0 && ` · ${categories.reduce((s, c) => s + (c.taskCount || 0), 0)} total tasks`}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="cat-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCategoryCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div className="empty-state glass-card"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <FiTag className="empty-state__icon" />
          <h3 className="empty-state__title">No categories yet</h3>
          <p className="empty-state__text">
            {search ? "No categories match your search." : "Create your first category to organise your tasks."}
          </p>
          {!search && (
            <button className="btn btn--primary" onClick={() => { setEditTarget(null); setFormOpen(true); }}>
              <FiPlus /> Create category
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div className="cat-grid" variants={container} initial="hidden" animate="show">
          <AnimatePresence mode="popLayout">
            {filtered.map((cat) => {
              const CatIcon      = ICON_MAP[cat.icon] || FiFolder;
              const completionPct = cat.completionPct ?? (
                cat.taskCount > 0
                  ? Math.round(((cat.completedCount ?? 0) / cat.taskCount) * 100)
                  : 0
              );

              return (
                <motion.div
                  key={cat._id}
                  className="cat-card glass-card"
                  variants={cardVariant}
                  layout
                  exit={{ opacity: 0, scale: 0.88 }}
                  whileHover={{ y: -5, boxShadow: "var(--shadow-lg)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                >
                  {/* Colour accent top bar */}
                  <div className="cat-card__accent" style={{ background: cat.color }} />

                  {/* Icon bubble */}
                  <div className="cat-card__icon" style={{ background: cat.color + "22", color: cat.color }}>
                    <CatIcon />
                  </div>

                  {/* Info */}
                  <div className="cat-card__body">
                    <h3 className="cat-card__name">{cat.name}</h3>
                    {cat.description && (
                      <p className="cat-card__desc">{cat.description}</p>
                    )}

                    {/* Stats chips */}
                    <div className="cat-card__chips">
                      <span className="cat-chip cat-chip--total">
                        <FiClock /> {cat.taskCount ?? 0} tasks
                      </span>
                      {(cat.completedCount ?? 0) > 0 && (
                        <span className="cat-chip cat-chip--done">
                          <FiCheckCircle /> {cat.completedCount} done
                        </span>
                      )}
                    </div>

                    {/* Completion progress bar */}
                    {cat.taskCount > 0 && (
                      <div className="cat-card__progress-wrap">
                        <div className="cat-card__progress-track">
                          <motion.div
                            className="cat-card__progress-fill"
                            style={{ background: cat.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
                          />
                        </div>
                        <span className="cat-card__progress-label">{completionPct}%</span>
                      </div>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="cat-card__footer">
                    <Link
                      to={`/categories/${cat._id}`}
                      className="cat-card__view-link"
                      style={{ color: cat.color }}
                      aria-label={`View ${cat.name} analytics`}
                    >
                      <FiExternalLink /> View details
                    </Link>

                    <div className="cat-card__actions">
                      <motion.button
                        className="icon-btn icon-btn--edit"
                        onClick={() => { setEditTarget(cat); setFormOpen(true); }}
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        aria-label={`Edit ${cat.name}`} title="Edit"
                      >
                        <FiEdit2 />
                      </motion.button>
                      <motion.button
                        className="icon-btn icon-btn--delete"
                        onClick={() => openDelete(cat)}
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        aria-label={`Delete ${cat.name}`} title="Delete"
                      >
                        <FiTrash2 />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create / edit modal */}
      <CategoryFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        editData={editTarget}
      />

      {/* Delete confirmation with options */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message={
          deleteTarget?.taskCount > 0
            ? `This category has ${deleteTarget.taskCount} task${deleteTarget.taskCount !== 1 ? "s" : ""}. Choose what to do with them:`
            : "This category has no tasks. It will be permanently removed."
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        {deleteTarget?.taskCount > 0 && (
          <div className="delete-options">
            {[
              { value: "unassign",  label: "Remove category tag (keep tasks)" },
              { value: "deleteAll", label: "Delete category and all its tasks" },
              { value: "moveTo",    label: "Move tasks to another category"    },
            ].map(({ value, label }) => (
              <label key={value} className={`delete-option${deleteMode === value ? " delete-option--active" : ""}`}>
                <input type="radio" name="deleteMode" value={value}
                  checked={deleteMode === value} onChange={() => setDeleteMode(value)} />
                {label}
              </label>
            ))}
            {deleteMode === "moveTo" && (
              <select className="input select" value={moveToId}
                onChange={(e) => setMoveToId(e.target.value)} style={{ marginTop: "0.5rem" }}>
                <option value="">— select category —</option>
                {otherCategories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
