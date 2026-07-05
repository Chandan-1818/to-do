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

    // Allow preview hosts such as v0.app, Vercel preview URLs,
    // GitHub imports, StackBlitz, etc.
    allowedHosts: true,

    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },

  build: {
    // Suppress the warning — our split chunks are all well under 600 kB
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks: {
          // React
          "vendor-react": [
            "react",
            "react-dom",
            "react-router-dom",
          ],

          // Animations
          "vendor-motion": [
            "framer-motion",
          ],

          // Charts
          "vendor-recharts": [
            "recharts",
          ],

          // Icons
          "vendor-icons": [
            "react-icons",
          ],

          // HTTP
          "vendor-axios": [
            "axios",
          ],
        },
      },
    },
  },
});
