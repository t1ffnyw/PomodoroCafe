import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.join(import.meta.dirname, "migrations"));

  return {
    plugins: [
      cloudflareTest({
        main: "./src/index.ts",
        // Bindings are declared here instead of read from wrangler.toml so the tests
        // don't need the built `dist/` assets directory or any real secrets.
        miniflare: {
          compatibilityDate: "2026-10-01",
          kvNamespaces: ["SESSIONS"],
          d1Databases: ["DB"],
          bindings: {
            TEST_MIGRATIONS: migrations,
            APP_ORIGIN: "http://localhost:5173",
            SESSION_SIGNING_SECRET: "test-signing-secret",
            GOOGLE_CLIENT_ID: "test-google-client-id",
            GOOGLE_CLIENT_SECRET: "test-google-client-secret",
            GOOGLE_REDIRECT_URI: "http://localhost:5173/auth/login/google/callback",
            NOTION_CLIENT_ID: "test-notion-client-id",
            NOTION_CLIENT_SECRET: "test-notion-client-secret",
            NOTION_REDIRECT_URI: "http://localhost:8787/auth/notion/callback",
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/setup.ts"],
      include: ["test/**/*.test.ts"],
    },
  };
});
