/**
 * Resolve.ts — 120-combo exhaustive coverage.
 *
 * 5 elements × 4 rarities × 3 reveal stages × 2 faces = 120 combos.
 * Each combo must:
 *   - not throw
 *   - return a queue sorted by zIndex (low → high)
 *   - obey face filter (back face → only card_back layer)
 *   - obey revealStage gate (frame ↔ frame_pot exclusivity)
 *   - emit behavioral layer (front face) with resonance bucket "awakening"
 *     at the default resonance of 50
 *   - interpolate {element} / {caretaker} placeholders correctly
 */

import { describe, expect, it } from "vitest";

import { resolve } from "../resolve";
import {
  cardTypeToRarity,
  type Face,
  type LayerElement,
  type LayerRarity,
  type LayerRegistry,
  type RevealStage,
} from "../types";
import registryJson from "../registry.json";
import type { CardType } from "@/lib/honeycomb/cards";

const REGISTRY = registryJson as LayerRegistry;

const ELEMENTS: readonly LayerElement[] = ["wood", "fire", "earth", "metal", "water"] as const;
const RARITIES: readonly LayerRarity[] = ["common", "mid", "rare", "rarest"] as const;
const REVEAL_STAGES: readonly RevealStage[] = [1, 2, 3] as const;
const FACES: readonly Face[] = ["front", "back"] as const;

const CARETAKER_BY_ELEMENT: Record<LayerElement, string> = {
  wood: "kaori",
  fire: "akane",
  earth: "nemu",
  metal: "ren",
  water: "ruan",
  harmony: "kaori",
};

function combos() {
  const out: {
    element: LayerElement;
    rarity: LayerRarity;
    revealStage: RevealStage;
    face: Face;
  }[] = [];
  for (const element of ELEMENTS) {
    for (const rarity of RARITIES) {
      for (const revealStage of REVEAL_STAGES) {
        for (const face of FACES) {
          out.push({ element, rarity, revealStage, face });
        }
      }
    }
  }
  return out;
}

describe("resolve · 120-combo coverage matrix", () => {
  it("enumerates exactly 120 combinations", () => {
    expect(combos()).toHaveLength(120);
  });

  for (const combo of combos()) {
    const tag = `${combo.element}/${combo.rarity}/r${combo.revealStage}/${combo.face}`;

    it(`${tag} — does not throw`, () => {
      expect(() =>
        resolve({
          registry: REGISTRY,
          element: combo.element,
          cardType: "caretaker_a",
          rarity: combo.rarity,
          revealStage: combo.revealStage,
          face: combo.face,
        }),
      ).not.toThrow();
    });

    it(`${tag} — queue is sorted by zIndex ascending`, () => {
      const q = resolve({
        registry: REGISTRY,
        element: combo.element,
        cardType: "caretaker_a",
        rarity: combo.rarity,
        revealStage: combo.revealStage,
        face: combo.face,
      });
      for (let i = 1; i < q.length; i++) {
        expect(q[i].zIndex).toBeGreaterThanOrEqual(q[i - 1].zIndex);
      }
    });

    it(`${tag} — face filter ${combo.face === "back" ? "isolates card_back" : "excludes card_back"}`, () => {
      const q = resolve({
        registry: REGISTRY,
        element: combo.element,
        cardType: "caretaker_a",
        rarity: combo.rarity,
        revealStage: combo.revealStage,
        face: combo.face,
      });
      const names = q.map((l) => l.layerName);
      if (combo.face === "back") {
        expect(names).toEqual(["card_back"]);
      } else {
        expect(names).not.toContain("card_back");
      }
    });

    if (combo.face === "front") {
      it(`${tag} — frame ↔ frame_pot reveal-stage exclusivity`, () => {
        const q = resolve({
          registry: REGISTRY,
          element: combo.element,
          cardType: "caretaker_a",
          rarity: combo.rarity,
          revealStage: combo.revealStage,
          face: combo.face,
        });
        const names = q.map((l) => l.layerName);
        if (combo.revealStage === 3) {
          expect(names).toContain("frame");
          expect(names).not.toContain("frame_pot");
        } else {
          expect(names).not.toContain("frame");
          expect(names).toContain("frame_pot");
        }
      });
    }
  }
});

describe("resolve · placeholder interpolation", () => {
  it("interpolates {element} + {caretaker} for the character layer", () => {
    for (const element of ELEMENTS) {
      const q = resolve({
        registry: REGISTRY,
        element,
        cardType: "caretaker_a",
        rarity: "common",
        revealStage: 3,
        face: "front",
      });
      const character = q.find((l) => l.layerName === "character");
      expect(character).toBeDefined();
      const expectedSegment = `${CARETAKER_BY_ELEMENT[element]}-${element}.png`;
      expect(character!.url).toContain(expectedSegment);
    }
  });

  it("emits element-specific behavioral path when bucket is resonant or harmonized", () => {
    for (const element of ELEMENTS) {
      const qResonant = resolve({
        registry: REGISTRY,
        element,
        cardType: "caretaker_a",
        rarity: "rare",
        revealStage: 3,
        face: "front",
        resonance: 65,
      });
      const behavioralResonant = qResonant.find((l) => l.layerName === "behavioral");
      expect(behavioralResonant?.url).toContain(`resonant_${element}.svg`);

      const qHarmonized = resolve({
        registry: REGISTRY,
        element,
        cardType: "caretaker_a",
        rarity: "rare",
        revealStage: 3,
        face: "front",
        resonance: 90,
      });
      const behavioralHarmonized = qHarmonized.find((l) => l.layerName === "behavioral");
      expect(behavioralHarmonized?.url).toContain(`harmonized_${element}.svg`);
    }
  });

  it("does NOT interpolate element into non-element-specific behavioral buckets", () => {
    const q = resolve({
      registry: REGISTRY,
      element: "fire",
      cardType: "caretaker_a",
      rarity: "common",
      revealStage: 3,
      face: "front",
      resonance: 10,
    });
    const behavioral = q.find((l) => l.layerName === "behavioral");
    expect(behavioral?.url).toContain("behavioral/dormant.svg");
    expect(behavioral?.url).not.toContain("{element}");
  });

  it("prepends cdnBase for relative paths and respects absolute paths", () => {
    const q = resolve({
      registry: REGISTRY,
      element: "fire",
      cardType: "caretaker_a",
      rarity: "common",
      revealStage: 3,
      face: "front",
    });
    const background = q.find((l) => l.layerName === "background");
    expect(background?.url).toBe("/art/cards/backgrounds/fire.svg");
    const effects = q.find((l) => l.layerName === "element_effects");
    expect(effects?.url).toBe("/art/element-effects/fire_glow.svg");
  });
});

describe("resolve · cardType → rarity bridge", () => {
  const expected: ReadonlyArray<{ ct: CardType; rar: LayerRarity }> = [
    { ct: "jani", rar: "common" },
    { ct: "caretaker_a", rar: "mid" },
    { ct: "caretaker_b", rar: "rare" },
    { ct: "transcendence", rar: "rarest" },
  ];

  for (const { ct, rar } of expected) {
    it(`${ct} → ${rar}`, () => {
      expect(cardTypeToRarity(ct)).toBe(rar);
    });
  }
});
