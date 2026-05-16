import { afterEach, describe, expect, it, vi } from "vitest";
import { VfxScheduler } from "./scheduler";

describe("VfxScheduler", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sweeps the earliest expiring effect even when a later effect was scheduled first", () => {
    vi.useFakeTimers();
    const scheduler = new VfxScheduler();
    scheduler.config.cooldownMs.particle = 0;

    const first = scheduler.request({
      family: "particle",
      element: "water",
      renderer: "pixi",
      currentPhase: "clashing",
      expectedDurationMs: 1000,
    });
    expect(first).not.toBeNull();

    vi.advanceTimersByTime(100);

    const second = scheduler.request({
      family: "particle",
      element: "fire",
      renderer: "css",
      currentPhase: "clashing",
      expectedDurationMs: 100,
    });
    expect(second).not.toBeNull();
    expect(scheduler.snapshot()).toHaveLength(2);

    vi.advanceTimersByTime(180);

    expect(scheduler.snapshot().map((effect) => effect.element)).toEqual(["water"]);
  });

  it("clears pending gc work when disposed", () => {
    vi.useFakeTimers();
    const scheduler = new VfxScheduler();

    scheduler.request({
      family: "orb",
      element: "wood",
      currentPhase: "clashing",
      expectedDurationMs: 500,
    });

    scheduler.dispose();
    vi.advanceTimersByTime(1000);

    expect(scheduler.snapshot()).toHaveLength(0);
  });
});
