/**
 * Juice profile tests.
 */

import { afterEach, describe, expect, it } from "vitest";
import { getJuiceProfile, juiceProfile } from "./profile";

describe("JuiceProfile", () => {
  afterEach(() => juiceProfile.setMode("default"));

  it("has all three modes", () => {
    expect(getJuiceProfile("quiet").mode).toBe("quiet");
    expect(getJuiceProfile("default").mode).toBe("default");
    expect(getJuiceProfile("loud").mode).toBe("loud");
  });

  it("quiet mode disables hitstop and chromatic aberration", () => {
    const p = getJuiceProfile("quiet");
    expect(p.hitstopMs).toBe(0);
    expect(p.chromaticAberrationPx).toBe(0);
  });

  it("loud mode increases hitstop above default", () => {
    expect(getJuiceProfile("loud").hitstopMs).toBeGreaterThan(
      getJuiceProfile("default").hitstopMs,
    );
  });

  it("cardDealDelayMs: center cards arrive first, edges last", () => {
    const total = 5;
    const delays = Array.from({ length: total }, (_, i) =>
      juiceProfile.cardDealDelayMs(i, total),
    );
    // Center (index 2) → 0; edges (0 and 4) → max
    expect(delays[2]).toBe(0);
    expect(delays[0]).toBe(delays[4]); // symmetric
    expect(delays[0]).toBeGreaterThan(delays[1]!);
  });

  it("setMode swaps the active profile", () => {
    juiceProfile.setMode("loud");
    expect(juiceProfile.current.mode).toBe("loud");
    juiceProfile.setMode("default");
    expect(juiceProfile.current.mode).toBe("default");
  });
});
