/**
 * Discovery ledger tests.
 *
 * Mocks localStorage via vitest's jsdom env. Tests round-trip persistence,
 * idempotent recording, isFirstTime semantics, all 4 combo kinds have
 * unique meta.
 *
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDiscovery,
  COMBO_META,
  getComboMeta,
  isFirstTime,
  loadDiscovery,
  recordDiscovery,
} from "./discovery";
import type { ComboKind } from "./combos";

const ALL_KINDS: readonly ComboKind[] = [
  "sheng-chain",
  "setup-strike",
  "elemental-surge",
  "weather-blessing",
];

describe("discovery ledger", () => {
  beforeEach(() => {
    clearDiscovery();
  });

  it("starts with empty seen set", () => {
    const state = loadDiscovery();
    expect(state.seen.size).toBe(0);
  });

  it("isFirstTime returns true for unseen kinds", () => {
    const state = loadDiscovery();
    for (const k of ALL_KINDS) {
      expect(isFirstTime(k, state), k).toBe(true);
    }
  });

  it("recordDiscovery marks a kind as seen", () => {
    const next = recordDiscovery("sheng-chain");
    expect(next.seen.has("sheng-chain")).toBe(true);
  });

  it("isFirstTime returns false after record", () => {
    recordDiscovery("setup-strike");
    const state = loadDiscovery();
    expect(isFirstTime("setup-strike", state)).toBe(false);
  });

  it("persists across loads", () => {
    recordDiscovery("elemental-surge");
    const state = loadDiscovery();
    expect(state.seen.has("elemental-surge")).toBe(true);
  });

  it("recording the same kind twice is idempotent", () => {
    recordDiscovery("weather-blessing");
    const second = recordDiscovery("weather-blessing");
    expect(second.seen.size).toBe(1);
  });

  it("clearDiscovery resets state", () => {
    recordDiscovery("sheng-chain");
    recordDiscovery("setup-strike");
    clearDiscovery();
    expect(loadDiscovery().seen.size).toBe(0);
  });

  it("recovers from corrupt JSON", () => {
    window.localStorage.setItem("puru-combo-discoveries-v1", "{not json");
    const state = loadDiscovery();
    expect(state.seen.size).toBe(0);
  });

  it("recovers from unknown shape", () => {
    window.localStorage.setItem("puru-combo-discoveries-v1", JSON.stringify({ v: 99, seen: ["?"] }));
    const state = loadDiscovery();
    expect(state.seen.size).toBe(0);
  });

  it("filters unknown combo kinds from persisted set", () => {
    window.localStorage.setItem(
      "puru-combo-discoveries-v1",
      JSON.stringify({ v: 1, seen: ["sheng-chain", "fake-kind"] }),
    );
    const state = loadDiscovery();
    expect(state.seen.has("sheng-chain")).toBe(true);
    expect(state.seen.size).toBe(1);
  });
});

describe("COMBO_META — AC-10: all 4 kinds have unique meta", () => {
  it("has an entry for each kind", () => {
    for (const k of ALL_KINDS) {
      expect(COMBO_META[k], k).toBeDefined();
    }
  });

  it("titles are unique", () => {
    const titles = ALL_KINDS.map((k) => COMBO_META[k].title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("icons are unique", () => {
    const icons = ALL_KINDS.map((k) => COMBO_META[k].icon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it("every meta has non-empty title/icon/subtitle/tooltip", () => {
    for (const k of ALL_KINDS) {
      const m = COMBO_META[k];
      expect(m.title.length, k).toBeGreaterThan(0);
      expect(m.icon.length, k).toBeGreaterThan(0);
      expect(m.subtitle.length, k).toBeGreaterThan(0);
      expect(m.tooltip.length, k).toBeGreaterThan(0);
    }
  });

  it("getComboMeta agrees with COMBO_META", () => {
    expect(getComboMeta("sheng-chain")).toBe(COMBO_META["sheng-chain"]);
  });
});
