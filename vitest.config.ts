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
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

