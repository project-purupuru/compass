/**
 * Asset manifest tests.
 *
 * Verifies the static invariants the validator can't catch:
 *   - id uniqueness
 *   - cardArtChain returns the right fallback order
 *   - every chain has ≥1 entry
 *   - element-keyed shortcuts agree with the manifest
 */

import { describe, expect, it } from "vitest";
import {
  MANIFEST,
  cardArtChain,
  getAsset,
  getChain,
  WORLD_SCENES,
  CARD_SATURATED,
  CARD_PASTEL,
  JANI_CARDS,
} from "./manifest";
import type { Element } from "./types";

const ELEMENTS: readonly Element[] = ["wood", "fire", "earth", "metal", "water"];

describe("MANIFEST", () => {
  it("has no duplicate ids", () => {
    const ids = MANIFEST.map((r) => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every record has a non-empty url", () => {
    for (const r of MANIFEST) {
      expect(r.url, `record ${r.id} url`).toBeTruthy();
    }
  });

  it("every CDN url uses an https scheme (except local)", () => {
    for (const r of MANIFEST) {
      if (r.localOnly) continue;
      expect(r.url, r.id).toMatch(/^https:\/\//);
    }
  });

  it("covers every element across scene/caretaker/saturated/pastel/jani", () => {
    for (const el of ELEMENTS) {
      for (const family of ["scene", "caretaker:full", "card:saturated", "card:pastel", "card:jani"]) {
        const id = `${family}:${el}`;
        expect(getAsset(id), id).toBeDefined();
      }
    }
  });
});

describe("getAsset / getChain", () => {
  it("returns undefined for unknown id", () => {
    expect(getAsset("nope")).toBeUndefined();
    expect(getChain("nope")).toEqual([]);
  });

  it("chain places primary first, fallbacks in declared order", () => {
    const chain = getChain("card:jani:earth");
    expect(chain[0]).toMatch(/jani-trading-card-earth/);
    expect(chain[1]).toMatch(/jani-earth-variant/);
    expect(chain[2]).toMatch(/earth-caretaker-nemu-card-saturated/);
  });
});

describe("cardArtChain", () => {
  it("jani returns [trading-card, variant, saturated]", () => {
    const chain = cardArtChain("jani", "fire");
    expect(chain).toHaveLength(3);
    expect(chain[0]).toMatch(/jani-trading-card-fire/);
    expect(chain[1]).toMatch(/jani-fire-variant/);
    expect(chain[2]).toMatch(/fire-caretaker-akane-card-saturated/);
  });

  it("caretaker_a returns [saturated, pastel]", () => {
    const chain = cardArtChain("caretaker_a", "water");
    expect(chain).toHaveLength(2);
    expect(chain[0]).toMatch(/water-caretaker-ruan-card-saturated/);
    expect(chain[1]).toMatch(/water-caretaker-ruan-card-pastel/);
  });

  it("caretaker_b returns [pastel, saturated]", () => {
    const chain = cardArtChain("caretaker_b", "metal");
    expect(chain).toHaveLength(2);
    expect(chain[0]).toMatch(/metal-caretaker-ren-card-pastel/);
    expect(chain[1]).toMatch(/metal-caretaker-ren-card-saturated/);
  });

  it("transcendence falls back to saturated chain", () => {
    const chain = cardArtChain("transcendence", "wood");
    expect(chain[0]).toMatch(/wood-caretaker-kaori-card-saturated/);
  });

  it("returns non-empty for every (cardType, element) pair", () => {
    const types = ["jani", "caretaker_a", "caretaker_b", "transcendence"] as const;
    for (const t of types) {
      for (const el of ELEMENTS) {
        const chain = cardArtChain(t, el);
        expect(chain.length, `${t}:${el}`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("element-keyed shortcuts", () => {
  it("WORLD_SCENES agrees with MANIFEST", () => {
    for (const el of ELEMENTS) {
      expect(WORLD_SCENES[el]).toBe(getAsset(`scene:${el}`)?.url);
    }
  });

  it("CARD_SATURATED / CARD_PASTEL / JANI_CARDS agree with MANIFEST", () => {
    for (const el of ELEMENTS) {
      expect(CARD_SATURATED[el]).toBe(getAsset(`card:saturated:${el}`)?.url);
      expect(CARD_PASTEL[el]).toBe(getAsset(`card:pastel:${el}`)?.url);
      expect(JANI_CARDS[el]).toBe(getAsset(`card:jani:${el}`)?.url);
    }
  });
});
