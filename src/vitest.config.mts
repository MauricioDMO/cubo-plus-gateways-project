import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["**/_test_/**/*.test.{ts,tsx}"] },
  resolve: {
    alias: {
      "@": import.meta.dirname,
      "server-only": path.resolve(import.meta.dirname, "_test_/support/server-only-stub.ts"),
    },
  },
});
