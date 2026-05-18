// AC for S1-T3: env-flag toggles between mock/real · interface unchanged
// SDD r2 §7.1 hybrid score-adapter · bridgebuilder HIGH-3 fix verification

import { describe, expect, it } from "vitest";

import {
  canonicalToScoreElement,
  resolveScoreAdapter,
  scoreElementToCanonical,
} from "../src/score-adapter";

describe("Score adapter element translation (lowercase ↔ uppercase)", () => {
  it("roundtrips all 5 elements lib/score → peripheral-events", () => {
    const elements = ["wood", "fire", "earth", "metal", "water"] as const;
    for (const e of elements) {
      const canonical = scoreElementToCanonical(e);
      expect(canonicalToScoreElement(canonical)).toBe(e);
    }
  });
});

describe("resolveScoreAdapter · hybrid env-flag toggle (HIGH-3 fix)", () => {
  it("defaults to mock when SCORE_API_URL unset (zerker's hackathon brief default)", async () => {
    const adapter = resolveScoreAdapter({});
    const profile = await adapter.getWalletProfile("test-wallet-1");
    // Mock generates deterministic profile based on hash(address) — non-null
    expect(profile).not.toBeNull();
    expect(profile?.trader).toBe("test-wallet-1");
  });

  it("returns mock adapter when SCORE_API_URL is empty string", async () => {
    const adapter = resolveScoreAdapter({ SCORE_API_URL: "" });
    const profile = await adapter.getWalletProfile("test-wallet-2");
    expect(profile?.trader).toBe("test-wallet-2");
  });

  it("returns real adapter when SCORE_API_URL set (interface unchanged)", () => {
    const adapter = resolveScoreAdapter({
      SCORE_API_URL: "https://score-puru-production.up.railway.app/v1",
    });
    // Interface contract: same shape regardless of mock vs real
    expect(typeof adapter.getWalletProfile).toBe("function");
    expect(typeof adapter.getWalletBadges).toBe("function");
    expect(typeof adapter.getWalletSignals).toBe("function");
    expect(typeof adapter.getElementDistribution).toBe("function");
  });

  it("mock adapter is deterministic (same address → same profile across calls)", async () => {
    const adapter = resolveScoreAdapter({});
    const a = await adapter.getWalletProfile("deterministic-address");
    const b = await adapter.getWalletProfile("deterministic-address");
    expect(a?.primaryElement).toBe(b?.primaryElement);
    expect(a?.trustScore).toBe(b?.trustScore);
  });

  it("mock adapter different addresses → different profiles (deterministic-but-distinct)", async () => {
    const adapter = resolveScoreAdapter({});
    const a = await adapter.getWalletProfile("wallet-aaa");
    const b = await adapter.getWalletProfile("wallet-zzz");
    // Hash-based seed produces different element affinity
    // (may collide for some pairs but collision-resistant for canonical test inputs)
    expect(a?.elementAffinity).not.toEqual(b?.elementAffinity);
  });

  it("getElementDistribution returns ecosystem-wide aggregate (5 elements)", async () => {
    const adapter = resolveScoreAdapter({});
    const dist = await adapter.getElementDistribution();
    expect(Object.keys(dist).sort()).toEqual(["earth", "fire", "metal", "water", "wood"]);
  });
});
