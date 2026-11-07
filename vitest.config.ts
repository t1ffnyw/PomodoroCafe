import path from "node:path";
import { defineConfig } from "vitest/config";

// Frontend tests. The Worker has its own config in workers/api/vitest.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
