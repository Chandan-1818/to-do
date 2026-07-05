// src/utils/categoryIcons.js
// Shared icon-id → component map so every place that renders a category
// (dropdown options, task badges, category cards) shows the same icon.

import {
  FiFolder, FiBriefcase, FiHome, FiBook, FiHeart,
  FiShoppingCart, FiMusic, FiCamera, FiCode, FiStar,
  FiZap, FiGlobe, FiAward, FiTool, FiCoffee,
  FiTrello, FiFeather, FiSun,
} from "react-icons/fi";

export const CATEGORY_ICON_MAP = {
  FiFolder, FiBriefcase, FiHome, FiBook, FiHeart,
  FiShoppingCart, FiMusic, FiCamera, FiCode, FiStar,
  FiZap, FiGlobe, FiAward, FiTool, FiCoffee,
  FiTrello, FiFeather, FiSun,
};

// Returns the icon component for a category icon id, falling back to FiFolder.
export function getCategoryIcon(iconId) {
  return CATEGORY_ICON_MAP[iconId] || FiFolder;
}
