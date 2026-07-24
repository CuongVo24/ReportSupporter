import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

// Self-managed `@/` alias (no vite-tsconfig-paths) to keep the W1 install matrix lean.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    testTimeout: 30000,
    setupFiles: ["./src/test/setup.ts"],
    update: false,
    onConsoleLog(_log, type) {
      if (type === "stderr") {
        throw new Error("Unexpected stderr. Mock the expected error/warning in this test.");
      }
      return true;
    },
    coverage: {
      provider: "v8",
      enabled: false,
      // `test:coverage` is a single `vitest run` invocation (not split into
      // subsystem batches like `test:subsystems`): an earlier version tried
      // merging coverage across 5 sequential CLI invocations with
      // clean:false, but that silently dropped some files' coverage down to
      // 0% (confirmed reproducible — see W25-K evidence) even though they
      // were genuinely exercised. A single invocation needs no merge.
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/test/**",
        "src/**/__fixtures__/**",
        "src/**/__security__/**",
      ],
      // W25-K: baseline measured 2026-07-24 via `npm run test:coverage`
      // (single restricted vitest invocation — see reporter comment above),
      // AFTER the new src/**/__security__/* fuzz suites were added. Measured
      // totals: lines 66.89%, statements 64.56%, functions 53.13%, branches
      // 57.34%. Thresholds below are set a few points under measured as a
      // floor to ratchet from — never raised to invented numbers, and never
      // silently lowered without a new measured baseline in this comment.
      // Critical modules (routes/rate-limit/config/sanitizer/import policy)
      // get their own, tighter floor per contract S1; measured values noted
      // per entry.
      thresholds: {
        lines: 60,
        functions: 48,
        branches: 50,
        statements: 58,
        // measured: lines 91.95 / branches 80.00 / functions 94.12 / statements 91.58
        "src/lib/server/**": { branches: 70, lines: 85, functions: 85, statements: 85 },
        // measured: 100/100/100/100 — regex sanitizer, ThreatModel T3 residual risk
        "src/app/api/pdf/sanitize-pdf-html.ts": { branches: 90, lines: 90, functions: 90, statements: 90 },
        // measured: lines 96 / branches 85.29 / functions 100 / statements 96
        "src/lib/markdown-pipeline.ts": { branches: 75, lines: 85, functions: 90, statements: 85 },
        // measured: lines 96.15 / branches 88.88 / functions 88.88 / statements 96.29
        "src/modules/import/directory-reader.ts": { branches: 75, lines: 85, functions: 75, statements: 85 },
        // measured: lines 100 / branches 76.47 / functions 100 / statements 100
        "src/modules/import/extract-assets.ts": { branches: 65, lines: 90, functions: 90, statements: 90 },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

