import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Self-managed `@/` alias (no vite-tsconfig-paths) to keep the W1 install matrix lean.
export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
