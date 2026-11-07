import type { D1Migration } from "@cloudflare/vitest-plugin";

declare global {
  namespace Cloudflare {
    // Lets `exports.default.fetch()` from "cloudflare:workers" type-check.
    interface GlobalProps {
      mainModule: typeof import("../src/index");
    }
    interface Env extends Omit<import("../src/env").Env, never> {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}

export {};
