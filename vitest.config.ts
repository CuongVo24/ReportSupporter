import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

// Self-managed `@/` alias (no vite-tsconfig-paths) to keep the W1 install matrix lean.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

