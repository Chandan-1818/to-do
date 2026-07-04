// vite.config.js
// Vite configuration for the React frontend.
// The proxy setting forwards /api requests to the Express backend during
// development so we avoid CORS issues and don't need to hard-code the backend URL.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // frontend runs on http://localhost:3000
    proxy: {
      // Any request starting with /api is forwarded to the backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
