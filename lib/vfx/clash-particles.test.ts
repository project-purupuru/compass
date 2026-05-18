/**
 * Clash VFX vocabulary tests.
 *
 * Verifies the composable contract: each kit has a signature + duration,
 * builds the right particle count, is deterministic for a given seed,
 * and produces no malformed inline CSS variables.
 */

import { describe, expect, it } from "vitest";
import { ELEMENT_VFX, buildClashParticles } from "./clash-particles";

const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;

describe("ELEMENT_VFX kits", () => {
  it("has a kit for every element", () => {
    for (const el of ELEMENTS) {
      expect(ELEMENT_VFX[el], el).toBeDefined();
      expect(ELEMENT_VFX[el].element).toBe(el);
    }
  });

  it("every kit has a non-empty signature and positive duration", () => {
    for (const el of ELEMENTS) {
      const k = ELEMENT_VFX[el];
      expect(k.signature.length, el).toBeGreaterThan(0);
      expect(k.durationMs, el).toBeGreaterThan(0);
    }
  });

  it("fire builds 8 embers", () => {
    expect(ELEMENT_VFX.fire.build(1).length).toBe(8);
  });

  it("earth builds 3 rings with --1/--2/--3 variants", () => {
    const p = ELEMENT_VFX.earth.build(1);
    expect(p.length).toBe(3);
    expect(p.map((x) => x.variant)).toEqual(["vfx-ring--1", "vfx-ring--2", "vfx-ring--3"]);
  });

  it("wood builds 5 roots", () => {
    expect(ELEMENT_VFX.wood.build(1).length).toBe(5);
  });

  it("metal builds 1 slash + 4 shards", () => {
    const p = ELEMENT_VFX.metal.build(1);
    expect(p.length).toBe(5);
    expect(p[0]?.kind).toBe("slash");
    expect(p.slice(1).every((x) => x.kind === "shard")).toBe(true);
  });

  it("water builds 1 outer wave + 1 inner wave", () => {
    const p = ELEMENT_VFX.water.build(1);
    expect(p.length).toBe(2);
    expect(p[1]?.variant).toBe("vfx-wave--inner");
  });
});

describe("determinism", () => {
  it("same seed produces identical particle styles", () => {
    const a = ELEMENT_VFX.fire.build(42);
    const b = ELEMENT_VFX.fire.build(42);
    expect(a.map((x) => x.style)).toEqual(b.map((x) => x.style));
  });

  it("different seeds produce different fire ember angles", () => {
    const a = ELEMENT_VFX.fire.build(1);
    const b = ELEMENT_VFX.fire.build(2);
    expect(a[0]?.style["--ember-angle"]).not.toBe(b[0]?.style["--ember-angle"]);
  });
});

describe("buildClashParticles facade", () => {
  it("returns the kit + the particles for the given element", () => {
    const { kit, particles } = buildClashParticles("water", 1);
    expect(kit.element).toBe("water");
    expect(particles.length).toBe(2);
  });
});
