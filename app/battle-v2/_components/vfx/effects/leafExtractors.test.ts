/**
 * leafExtractors — determinism + math-parity tests.
 *
 * Sprint-2 (cycle engine-substrate-2026-05-17) S2-T2 AC: vitest snapshot of
 * stable scatter for one seed. We don't use vitest's `toMatchSnapshot` here —
 * we just lock in specific expected values from a chosen seed so any drift
 * between the extractor math and the JSX render is caught immediately.
 *
 * The math we're locking is the world-position composition for Tree leaves
 * (the most complex extractor: it walks the branch outer + inner rotation
 * chain). Mushroom, Wildflower, Rock are straight offsets — covered by
 * shape + determinism tests.
 */

import { describe, expect, it } from "vitest";

import {
  mushroomLeafSpecs,
  rockMossLeafSpecs,
  treeLeafSpecs,
  wildflowerLeafSpecs,
} from "./leafExtractors";

describe("treeLeafSpecs", () => {
  it("produces 2 leaves per branch (primary + secondary)", () => {
    const specs = treeLeafSpecs({
      worldPosition: [0, 0, 0],
      flavor: "green",
      scale: 1.2,
      seed: 0x71ee,
      branchCount: 4,
    });
    expect(specs.length).toBe(8); // 4 branches × 2 leaves
  });

  it("is deterministic for the same seed", () => {
    const a = treeLeafSpecs({
      worldPosition: [10, 5, -3],
      flavor: "green",
      scale: 1.0,
      seed: 0xc0ffee,
      branchCount: 4,
    });
    const b = treeLeafSpecs({
      worldPosition: [10, 5, -3],
      flavor: "green",
      scale: 1.0,
      seed: 0xc0ffee,
      branchCount: 4,
    });
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].worldPosition[0]).toBeCloseTo(b[i].worldPosition[0], 10);
      expect(a[i].worldPosition[1]).toBeCloseTo(b[i].worldPosition[1], 10);
      expect(a[i].worldPosition[2]).toBeCloseTo(b[i].worldPosition[2], 10);
      expect(a[i].swayPhase).toBeCloseTo(b[i].swayPhase, 10);
    }
  });

  it("primary + secondary in a branch share the same swayPhase (group-rotation parity)", () => {
    const specs = treeLeafSpecs({
      worldPosition: [0, 0, 0],
      flavor: "green",
      scale: 1.0,
      seed: 0x71ee,
      branchCount: 4,
    });
    // Pairs are (primary[0], secondary[1]), (primary[2], secondary[3]), ...
    for (let i = 0; i < specs.length; i += 2) {
      expect(specs[i].swayPhase).toBe(specs[i + 1].swayPhase);
    }
  });

  it("uses 0.06 amplitude + 0.45 frequency to match Tree.tsx LeafPuff props", () => {
    const specs = treeLeafSpecs({
      worldPosition: [0, 0, 0],
      flavor: "green",
      scale: 1.0,
      seed: 0x71ee,
      branchCount: 4,
    });
    for (const s of specs) {
      expect(s.swayAmplitude).toBeCloseTo(0.06, 12);
      expect(s.swayFrequency).toBeCloseTo(0.45, 12);
    }
  });

  it("anchors world position at the fixture world-position offset", () => {
    const at0 = treeLeafSpecs({
      worldPosition: [0, 0, 0],
      flavor: "green",
      scale: 1.0,
      seed: 0xdead,
      branchCount: 4,
    });
    const at100 = treeLeafSpecs({
      worldPosition: [100, 0, 0],
      flavor: "green",
      scale: 1.0,
      seed: 0xdead,
      branchCount: 4,
    });
    // Translating worldPosition by +100 in X translates every leaf by +100 in X.
    for (let i = 0; i < at0.length; i++) {
      expect(at100[i].worldPosition[0]).toBeCloseTo(at0[i].worldPosition[0] + 100, 6);
      expect(at100[i].worldPosition[1]).toBeCloseTo(at0[i].worldPosition[1], 6);
      expect(at100[i].worldPosition[2]).toBeCloseTo(at0[i].worldPosition[2], 6);
    }
  });
});

describe("mushroomLeafSpecs", () => {
  it("produces exactly one leaf at the cap (stemHeight above fixture origin)", () => {
    const specs = mushroomLeafSpecs({
      worldPosition: [0, 0, 0],
      flavor: "honey",
      scale: 0.25,
      seed: 0x7777,
    });
    expect(specs.length).toBe(1);
    // stemHeight = scale * 1.1 = 0.25 * 1.1 = 0.275
    expect(specs[0].worldPosition[1]).toBeCloseTo(0.275, 6);
  });

  it("bakes the cap [1, 0.6, 1] scale flatten into the instance scale", () => {
    const specs = mushroomLeafSpecs({
      worldPosition: [0, 0, 0],
      flavor: "honey",
      scale: 0.25,
      seed: 0x7777,
    });
    // capRadius = scale * 0.42 = 0.105. Y-scale = capRadius * 0.6 = 0.063.
    expect(specs[0].scale[0]).toBeCloseTo(0.105, 6);
    expect(specs[0].scale[1]).toBeCloseTo(0.105 * 0.6, 6);
    expect(specs[0].scale[2]).toBeCloseTo(0.105, 6);
  });
});

describe("wildflowerLeafSpecs", () => {
  it("places the bloom above the stem", () => {
    const specs = wildflowerLeafSpecs({
      worldPosition: [0, 0, 0],
      flavor: "sakura",
      scale: 0.4,
      seed: 0xf10,
    });
    expect(specs.length).toBe(1);
    // stemHeight = scale = 0.4. bloomRadius = scale * 0.18 = 0.072.
    // worldY = stemHeight + bloomRadius * 0.5 = 0.4 + 0.036 = 0.436
    expect(specs[0].worldPosition[1]).toBeCloseTo(0.436, 6);
  });
});

describe("rockMossLeafSpecs", () => {
  it("returns 0 leaves when shape is pebble (no moss on pebbles)", () => {
    const specs = rockMossLeafSpecs({
      worldPosition: [0, 0, 0],
      scale: 0.5,
      seed: 0x70cc,
      shape: "pebble",
    });
    expect(specs).toEqual([]);
  });

  it("returns 2 leaves (primary + secondary) when moss is force-enabled", () => {
    const specs = rockMossLeafSpecs({
      worldPosition: [0, 0, 0],
      scale: 0.5,
      seed: 0x70cc,
      shape: "boulder",
      moss: true,
    });
    expect(specs.length).toBe(2);
    // Both share the same phase (group-rotation parity).
    expect(specs[0].swayPhase).toBe(specs[1].swayPhase);
  });

  it("returns 0 leaves when moss is force-disabled", () => {
    const specs = rockMossLeafSpecs({
      worldPosition: [0, 0, 0],
      scale: 0.5,
      seed: 0x70cc,
      shape: "boulder",
      moss: false,
    });
    expect(specs.length).toBe(0);
  });
});
