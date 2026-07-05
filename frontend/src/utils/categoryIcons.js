// src/utils/categoryIcons.js
// Single source of truth for mapping stored icon id strings (e.g. "FiBriefcase")
// to their react-icons components. Used by the task form category dropdown,
// task cards, and category pages.

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

// Safe lookup — always returns a component
export function getCategoryIcon(iconId) {
  return CATEGORY_ICON_MAP[iconId] || FiFolder;
}
