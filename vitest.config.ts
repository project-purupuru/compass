import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Scope · only our app + packages · NOT .claude/ framework tests OR anchor tests.
    include: [
      "app/battle-v2/**/*.{test,spec}.{ts,tsx}",
      "lib/**/*.{test,spec}.{ts,tsx}",
      "packages/*/src/**/*.{test,spec}.{ts,tsx}",
      "packages/*/__tests__/**/*.{test,spec}.{ts,tsx}",
      // Lab evolution cycle · S1a regression substrate (ADR-1 + ADR-14)
      "tests/regression/**/*.{test,spec}.{ts,tsx}",
    ],
    setupFiles: ["tests/regression/setup.ts"],
    testTimeout: 60_000,
    exclude: ["node_modules/**", "**/.claude/**", "**/programs/**", "**/.next/**"],
  },
});
