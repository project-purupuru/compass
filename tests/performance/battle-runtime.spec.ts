/**
 * Browser-side performance guard for the battle surface.
 *
 * This is intentionally a Playwright eval, not a unit test: overheating and
 * lag show up as long tasks, frame stalls, and leaked canvases in the browser.
 * The dev harness drives a deterministic clashing snapshot so the test can
 * stress the Pixi/CSS VFX path without waiting for the full match timeline.
 */

import { expect, test } from "@playwright/test";
import clashingFixture from "../visual/fixtures/clashing-impact.json";

declare global {
  interface Window {
    __BATTLE_PERF__?: {
      readonly frames: number[];
      readonly ticks: number[];
      readonly longTasks: number[];
    };
  }
}

const SEED = "fixed-seed-performance";

test.describe("battle runtime performance", () => {
  test("clashing VFX stays within frame and long-task budgets", async ({ page }) => {
    await page.addInitScript(() => {
      const perf = {
        frames: [] as number[],
        ticks: [] as number[],
        longTasks: [] as number[],
      };
      window.__BATTLE_PERF__ = perf;

      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            perf.longTasks.push(entry.duration);
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        // WebKit and older Chromium channels may not expose longtask.
      }

      let last = performance.now();
      const sample = (now: number) => {
        perf.frames.push(now - last);
        if (perf.frames.length > 240) perf.frames.shift();
        last = now;
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);

      let lastTick = performance.now();
      window.setInterval(() => {
        const now = performance.now();
        perf.ticks.push(now - lastTick);
        if (perf.ticks.length > 120) perf.ticks.shift();
        lastTick = now;
      }, 50);
    });

    await page.goto(`/battle?dev=1&seed=${SEED}`);
    await page.waitForFunction(
      () => (window as { __PURU_DEV__?: { enabled: boolean } }).__PURU_DEV__?.enabled === true,
      { timeout: 12000 },
    );

    await page.evaluate(async ({ seed, patch }) => {
      window.__PURU_DEV__!.beginMatch(seed);
      await new Promise((resolve) => setTimeout(resolve, 250));
      window.__PURU_DEV__!.chooseElement("wood");
      await new Promise((resolve) => setTimeout(resolve, 250));
      window.__PURU_DEV__!.injectSnapshot(patch as never);
    }, { seed: SEED, patch: clashingFixture });

    await page.waitForSelector(".battle-wrapper.mounted", { timeout: 12000 });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      if (!window.__BATTLE_PERF__) return;
      window.__BATTLE_PERF__.frames.length = 0;
      window.__BATTLE_PERF__.ticks.length = 0;
      window.__BATTLE_PERF__.longTasks.length = 0;
    });
    await page.waitForTimeout(2500);

    const metrics = await page.evaluate(() => {
      const perf = window.__BATTLE_PERF__ ?? { frames: [], ticks: [], longTasks: [] };
      const frames = perf.frames.slice(10);
      const sortedFrames = [...frames].sort((a, b) => a - b);
      const ticks = perf.ticks.slice(2);
      const sortedTicks = [...ticks].sort((a, b) => a - b);
      const p95Frame = sortedFrames[Math.floor(sortedFrames.length * 0.95)] ?? 0;
      const p95Tick = sortedTicks[Math.floor(sortedTicks.length * 0.95)] ?? 0;
      const droppedFrames = frames.filter((frame) => frame > 50).length;
      const delayedTicks = ticks.filter((tick) => tick > 120).length;
      const longTaskTotal = perf.longTasks.reduce((sum, duration) => sum + duration, 0);
      const pixiCanvasCount = document.querySelectorAll(".pixi-clash-vfx canvas").length;
      return {
        frameCount: frames.length,
        p95FrameMs: p95Frame,
        droppedFrames,
        tickCount: ticks.length,
        p95EventLoopMs: p95Tick,
        delayedTicks,
        longTaskCount: perf.longTasks.length,
        longTaskTotal,
        pixiCanvasCount,
      };
    });

    test.info().annotations.push({
      type: "battle-performance",
      description: JSON.stringify(metrics),
    });
    console.log(`[battle-performance] ${JSON.stringify(metrics)}`);

    expect(metrics.tickCount).toBeGreaterThan(30);
    expect(metrics.p95EventLoopMs).toBeLessThan(120);
    expect(metrics.delayedTicks).toBeLessThanOrEqual(2);
    expect(metrics.longTaskTotal).toBeLessThan(750);
    expect(metrics.pixiCanvasCount).toBeLessThanOrEqual(1);
  });
});
