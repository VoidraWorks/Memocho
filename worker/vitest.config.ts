// ─── Vitest config for Cloudflare Workers ────────────────────────────────────
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    pool: "@cloudflare/vitest-pool-workers",
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          d1Databases: ["DB"],
        },
      },
    },
  },
});
