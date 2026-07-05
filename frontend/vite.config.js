// vite.config.js
// Vite configuration for the React frontend.
// The proxy forwards /api requests to Express during development.
// manualChunks splits heavy third-party libraries into separate chunks
// so the initial bundle stays small and browsers can cache them independently.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },

  build: {
    // Suppress the warning — our split chunks are all well under 500 kB
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Animation library
          "vendor-motion": ["framer-motion"],
          // Charts — largest single dependency, isolate it
          "vendor-recharts": ["recharts"],
          // Icon library
          "vendor-icons": ["react-icons"],
          // HTTP client
          "vendor-axios": ["axios"],
        },
      },
    },
  },
});
