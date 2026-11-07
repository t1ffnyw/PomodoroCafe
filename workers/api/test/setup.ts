import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeEach } from "vitest";

// Runs before each test file: create the schema from the real migrations.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// D1 rows are not reset between tests automatically, so start each test from empty
// tables. Child tables go first; they reference users.
beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM todos"),
    env.DB.prepare("DELETE FROM settings"),
    env.DB.prepare("DELETE FROM daily_progress"),
    env.DB.prepare("DELETE FROM users"),
  ]);
});
