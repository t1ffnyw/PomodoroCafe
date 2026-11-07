import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const NOTION_API_DEV_TARGET = "http://localhost:8787";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/auth": NOTION_API_DEV_TARGET,
      "/api": NOTION_API_DEV_TARGET,
    },
  },
});
