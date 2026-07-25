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
        // W25-K additions, baseline measured 2026-07-25 via `npm run test:coverage`
        // (single restricted vitest invocation) after this session's A-K fixes.
        // measured: lines 87.27 / branches 83.33 / functions 100 / statements 87.27
        "src/modules/import/resource-policy.ts": { branches: 75, lines: 80, functions: 90, statements: 80 },
        // measured: lines 51.88 / branches 37.87 / functions 80 / statements 51.3 — hand-rolled
        // binary ZIP64/Central-Directory parser; happy path + core rejection branches covered,
        // ZIP64 extra-field success path still untested (needs a hand-crafted >4GiB-style fixture).
        "src/modules/import/zip-central-directory.ts": { branches: 30, lines: 45, functions: 70, statements: 45 },
        // measured: lines 100 / branches 88.23 / functions 100 / statements 93.18
        "src/lib/sink-style-narrowing.ts": { branches: 80, lines: 95, functions: 95, statements: 90 },
        // measured: lines 90.9 / branches 75 / functions 100 / statements 90.9
        "src/modules/format/toc-renderer.ts": { branches: 65, lines: 85, functions: 90, statements: 85 },
        // measured: lines 79.76 / branches 66.33 / functions 84 / statements 77.58
        "src/app/api/ai/route.ts": { branches: 55, lines: 70, functions: 75, statements: 70 },
        // measured: lines 73.68 / branches 61.94 / functions 38.09 / statements 67.45 — many
        // renderer-response error branches (401/400/413/oversized-PDF-cap) still uncovered.
        "src/app/api/pdf/route.ts": { branches: 50, lines: 65, functions: 30, statements: 60 },
        // measured: lines 83.33 / branches 75 / functions 100 / statements 83.33
        "src/app/api/pdf/ticket/route.ts": { branches: 65, lines: 75, functions: 90, statements: 75 },
        // measured: lines 100 / branches 100 / functions 100 / statements 100 — small,
        // fully covered file. Was silently 0% until this same change added
        // src/middleware.test.ts to the test:coverage/test:subsystems script file lists
        // (it lives outside src/lib|components|app|modules, so it was never actually run).
        "src/middleware.ts": { branches: 90, lines: 95, functions: 95, statements: 95 },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

