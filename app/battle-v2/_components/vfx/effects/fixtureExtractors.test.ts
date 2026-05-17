/**
 * fixtureExtractors tests (cycle-3 sprint-1-fixture S1-T2).
 *
 * Pattern mirrors lib/engine/animation/sway-system.test.ts: Float32
 * precision-aware (`toBeCloseTo(..., 6)`), determinism across runs,
 * visual-parity math against Tree.tsx's published constants.
 *
 * Per SDD §9.2 / cycle-3 PRD G8 (P2 — nice-to-have). Catches regressions
 * if the extractor's math drifts from Tree.tsx's JSX (e.g., a future
 * Tree.tsx change to trunkHeight formula would surface as a test failure
 * here, not as a visual bug at runtime).
 */

import { describe, it, expect } from "vitest";

import type { PlotT, FixtureRefT } from "@/lib/hex/plot";

import {
  DEFAULT_TREE_BRANCH_COUNT,
  treeSpecsFromPlots,
  fixtureKindHasInstancedExtractor,
} from "./fixtureExtractors";

// ── Test plot helpers ──────────────────────────────────────────────────────

function treeFixture(
  seed: number,
  scale: number,
  offset: readonly [number, number] = [0, 0],
): FixtureRefT {
  return { kind: "tree", offset, seed, scale };
}

function plotWith(fixtures: FixtureRefT[]): PlotT {
  return {
    coord: { q: 0, r: 0 },
    terrain: "grass",
    elevation: 0,
    fixtures,
    edges: ["flat", "flat", "flat", "flat", "flat", "flat"],
  };
}

// ── Cardinality + dispatch ────────────────────────────────────────────────

describe("treeSpecsFromPlots — cardinality", () => {
  it("produces 1 trunk + 4 branches per tree fixture (default branch count)", () => {
    const plots = [plotWith([treeFixture(0x1234, 1.2)])];
    const positions = [[0, 0]] as const;
    const { trunks, branches } = treeSpecsFromPlots(plots, positions);

    expect(trunks).toHaveLength(1);
    expect(branches).toHaveLength(DEFAULT_TREE_BRANCH_COUNT);
  });

  it("skips non-tree fixtures", () => {
    const plots = [
      plotWith([
        { kind: "rock", offset: [0, 0], seed: 1, scale: 1 },
        { kind: "bush", offset: [0, 0], seed: 2, scale: 1 },
        { kind: "mushroom", offset: [0, 0], seed: 3, scale: 1 },
      ]),
    ];
    const positions = [[0, 0]] as const;
    const { trunks, branches } = treeSpecsFromPlots(plots, positions);

    expect(trunks).toHaveLength(0);
    expect(branches).toHaveLength(0);
  });

  it("aggregates trees across multiple plots", () => {
    const plots = [
      plotWith([treeFixture(0xa, 1.0), treeFixture(0xb, 1.2)]),
      plotWith([treeFixture(0xc, 0.8)]),
    ];
    const positions = [
      [0, 0],
      [5, 0],
    ] as const;
    const { trunks, branches } = treeSpecsFromPlots(plots, positions);

    expect(trunks).toHaveLength(3);
    expect(branches).toHaveLength(3 * DEFAULT_TREE_BRANCH_COUNT);
  });

  it("returns empty specs for an empty plot list", () => {
    const { trunks, branches } = treeSpecsFromPlots([], []);
    expect(trunks).toHaveLength(0);
    expect(branches).toHaveLength(0);
  });
});

// ── Visual-parity math ────────────────────────────────────────────────────

describe("treeSpecsFromPlots — visual parity with Tree.tsx", () => {
  it("trunk world position = plot world + fixture offset, Y = plot elevation", () => {
    const plot: PlotT = {
      coord: { q: 0, r: 0 },
      terrain: "grass",
      elevation: 0.2,
      fixtures: [treeFixture(0x1234, 1.0, [0.5, -0.3])],
      edges: ["flat", "flat", "flat", "flat", "flat", "flat"],
    };
    const { trunks } = treeSpecsFromPlots([plot], [[10, 7]]);

    expect(trunks[0].worldPosition[0]).toBeCloseTo(10 + 0.5, 6);
    expect(trunks[0].worldPosition[1]).toBeCloseTo(0.2, 6); // = plot.elevation
    expect(trunks[0].worldPosition[2]).toBeCloseTo(7 + -0.3, 6);
  });

  it("trunk rotY defaults to 0 (visual parity with Tree.tsx — no per-tree rotation)", () => {
    const plots = [plotWith([treeFixture(0xffff, 1.0)])];
    const { trunks } = treeSpecsFromPlots(plots, [[0, 0]]);
    expect(trunks[0].rotY).toBe(0);
  });

  it("trunk scale = fixture.scale (no transformation)", () => {
    const plots = [plotWith([treeFixture(0xaaaa, 1.7)])];
    const { trunks } = treeSpecsFromPlots(plots, [[0, 0]]);
    expect(trunks[0].scale).toBeCloseTo(1.7, 6);
  });

  it("branch anchor Y = treeY + branchOriginY (= treeY + scale * 1.05 * 0.7)", () => {
    const scale = 1.2;
    const plot: PlotT = {
      coord: { q: 0, r: 0 },
      terrain: "grass",
      elevation: 0.1,
      fixtures: [treeFixture(0x9999, scale)],
      edges: ["flat", "flat", "flat", "flat", "flat", "flat"],
    };
    const { branches } = treeSpecsFromPlots([plot], [[0, 0]]);

    // Per Tree.tsx:93-96:
    //   const trunkHeight = scale * 1.05;
    //   const branchOriginY = trunkHeight * 0.7;
    const expectedAnchorY = 0.1 + scale * 1.05 * 0.7;
    for (const branch of branches) {
      expect(branch.anchorPosition[1]).toBeCloseTo(expectedAnchorY, 6);
    }
  });

  it("branch length = b.length * scale (matches Tree.tsx `blen = b.length * scale`)", () => {
    const scale = 1.5;
    const plots = [plotWith([treeFixture(0xbbbb, scale)])];
    const { branches } = treeSpecsFromPlots(plots, [[0, 0]]);

    for (const branch of branches) {
      // From Tree.tsx buildBranches: b.length ∈ [0.42, 0.7]
      // So branch.length ∈ [0.63, 1.05] at scale=1.5
      expect(branch.length).toBeGreaterThanOrEqual(0.42 * scale - 1e-6);
      expect(branch.length).toBeLessThanOrEqual(0.7 * scale + 1e-6);
    }
  });

  it("branch thickness = b.thickness * scale (matches Tree.tsx `bthick = b.thickness * scale`)", () => {
    const scale = 1.0;
    const plots = [plotWith([treeFixture(0xcccc, scale)])];
    const { branches } = treeSpecsFromPlots(plots, [[0, 0]]);

    for (const branch of branches) {
      // From Tree.tsx buildBranches: b.thickness ∈ [0.035, 0.057]
      expect(branch.thickness).toBeGreaterThanOrEqual(0.035 * scale - 1e-6);
      expect(branch.thickness).toBeLessThanOrEqual(0.057 * scale + 1e-6);
    }
  });
});

// ── Determinism ───────────────────────────────────────────────────────────

describe("treeSpecsFromPlots — determinism", () => {
  it("produces byte-identical specs across runs for fixed seed", () => {
    const plots = [
      plotWith([treeFixture(0x12345678, 1.2, [0.3, -0.2])]),
      plotWith([treeFixture(0x87654321, 0.9, [-0.1, 0.4])]),
    ];
    const positions = [
      [0, 0],
      [10, 5],
    ] as const;

    const r1 = treeSpecsFromPlots(plots, positions);
    const r2 = treeSpecsFromPlots(plots, positions);

    expect(r1.trunks).toEqual(r2.trunks);
    expect(r1.branches).toEqual(r2.branches);
  });
});

// ── Pre-conditions ────────────────────────────────────────────────────────

describe("treeSpecsFromPlots — pre-conditions", () => {
  it("throws when plots.length !== plotWorldPositions.length", () => {
    expect(() => treeSpecsFromPlots([plotWith([])], [])).toThrow(
      /plot count .* !== positions count/,
    );
  });
});

// ── Dispatch utility ──────────────────────────────────────────────────────

describe("fixtureKindHasInstancedExtractor (S1 scope)", () => {
  it("returns true only for 'tree' in S1", () => {
    expect(fixtureKindHasInstancedExtractor("tree")).toBe(true);
    // S2 will flip these to true as bush/rock/mushroom/wildflower archetypes land.
    expect(fixtureKindHasInstancedExtractor("bush")).toBe(false);
    expect(fixtureKindHasInstancedExtractor("rock")).toBe(false);
    expect(fixtureKindHasInstancedExtractor("mushroom")).toBe(false);
    expect(fixtureKindHasInstancedExtractor("wildflower")).toBe(false);
    expect(fixtureKindHasInstancedExtractor("grass-field")).toBe(false);
    expect(fixtureKindHasInstancedExtractor("structure")).toBe(false);
    expect(fixtureKindHasInstancedExtractor("character")).toBe(false);
    expect(fixtureKindHasInstancedExtractor("fallen-log")).toBe(false);
  });
});
