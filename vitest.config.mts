import { defineConfig } from "vitest/config";

/**
 * Unit tests cover the framework-free domain layer in src/core and the pure
 * helpers in src/lib. That is deliberate: those modules hold the logic a future
 * mobile client will also depend on, so they are the ones worth pinning.
 *
 * `.mts` because the config uses ESM syntax; Vite's native config loader warns
 * when that is loaded as CommonJS. Path aliases resolve natively from
 * tsconfig.json, so no resolver plugin is needed.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
