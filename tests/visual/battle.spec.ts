/**
 * Visual regression baselines for /battle.
 *
 * Each test:
 *   1. Navigate to /battle?dev=1&seed=fixed-seed-visual
 *   2. Wait for the dev panel to install __PURU_DEV__
 *   3. begin-match + choose-element to populate lineups
 *   4. Inject the snapshot patch from fixtures/
 *   5. Wait for image network to settle
 *   6. Snapshot
 *
 * Run: pnpm test:visual
 * Update baselines: pnpm test:visual:update
 */

import { expect, test } from "@playwright/test";
import arrangeFixture from "./fixtures/arrange-default.json";
import clashingFixture from "./fixtures/clashing-impact.json";
import resultFixture from "./fixtures/result-player-wins.json";

const SEED = "fixed-seed-visual";

async function setupScene(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(`/battle?dev=1&seed=${SEED}`);
  // Wait for __PURU_DEV__ install (dev panel mount)
  await page.waitForFunction(
    () => (window as { __PURU_DEV__?: { enabled: boolean } }).__PURU_DEV__?.enabled === true,
    { timeout: 12000 },
  );
  // Walk the state machine into arrange so lineups are populated.
  await page.evaluate(async (seed) => {
    window.__PURU_DEV__!.beginMatch(seed);
    await new Promise((r) => setTimeout(r, 250));
    window.__PURU_DEV__!.chooseElement("wood");
    await new Promise((r) => setTimeout(r, 250));
  }, SEED);
  // Wait for the battle wrapper to mount
  await page.waitForSelector(".battle-wrapper.mounted", { timeout: 12000 });
}

test.describe("battle visual regression", () => {
  test("arrange-default", async ({ page }) => {
    await setupScene(page);
    // Inject the fixture patch
    await page.evaluate((patch) => {
      window.__PURU_DEV__!.injectSnapshot(patch as never);
    }, arrangeFixture);
    // Let images settle
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("arrange-default.png");
  });

  test("clashing-impact", async ({ page }) => {
    await setupScene(page);
    await page.evaluate((patch) => {
      window.__PURU_DEV__!.injectSnapshot(patch as never);
    }, clashingFixture);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("clashing-impact.png");
  });

  test("result-player-wins", async ({ page }) => {
    await setupScene(page);
    await page.evaluate((patch) => {
      window.__PURU_DEV__!.injectSnapshot(patch as never);
    }, resultFixture);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("result-player-wins.png");
  });
});
