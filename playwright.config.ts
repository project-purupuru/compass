import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

/**
 * Playwright config supports two test suites:
 *   tests/e2e/     — black-box flow tests (existing)
 *   tests/visual/  — visual regression snapshots (this cycle)
 *
 * Visual tests run with prefers-reduced-motion: reduce so element
 * breathing / fan animations land instantly. Baselines under
 * tests/visual/__snapshots__/ are committed; CI compares with a
 * generous maxDiffPixels tolerance per test.
 */
export default defineConfig({
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "visual",
      testDir: "./tests/visual",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        // Force reduced motion so animations land instantly
        contextOptions: { reducedMotion: "reduce", colorScheme: "light" },
      },
      // Visual snapshots stored under tests/visual/__snapshots__/
      snapshotPathTemplate:
        "{testDir}/__snapshots__/{testFilePath}/{arg}{ext}",
      expect: {
        toHaveScreenshot: { maxDiffPixels: 200 },
      },
    },
    {
      name: "performance",
      testDir: "./tests/performance",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI && process.env.PLAYWRIGHT_FORCE_SERVER !== "1",
    timeout: 120_000,
  },
});
