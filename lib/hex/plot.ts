/**
 * Plot — what a single hex OWNS as data.
 *
 * Per session 14 (2026-05-16) — Gumi's hex-baseline substrate. A Plot is the
 * unit of environmental composition: every renderable asset belongs to its
 * Plot's hex, no free-standing geometry. This makes scenes:
 *   - Composable (a scene = a set of plots)
 *   - Scalable (any region of the world = an arbitrary plot selection)
 *   - Reusable across games (the schema is project-agnostic)
 *
 * Schema runs through `effect`'s `Schema` (substrate-consistent — same library
 * the rest of the app validates configs with).
 */

import { Schema as S } from "effect";

import { ElementId } from "../wuxing/element";

// ── Terrain class ──────────────────────────────────────────────────────────

/**
 * The "kind" of ground a plot has. Affects rendering, character pathing,
 * and which fixture classes can sit on the plot.
 *
 *   - grass  → default land · trees + rocks + grass allowed
 *   - stone  → rocky / mountainous · rocks dominate; no grass
 *   - water  → no fixtures · cards may "splash" here
 *   - sand   → coastal · sparse fixtures; warm tone
 *   - shrine → element-tinted plot · holds a building, no foliage
 *   - empty  → pure void, used for off-map / unrenderable plots
 */
export const TerrainClass = S.Literal(
  "grass",
  "stone",
  "water",
  "sand",
  "shrine",
  "empty",
);
export type TerrainClassT = S.Schema.Type<typeof TerrainClass>;

// ── Hex coord schema (mirrors lib/hex/axial.ts at the schema layer) ────────

export const HexCoordSchema = S.Struct({
  q: S.Number,
  r: S.Number,
});
export type HexCoordT = S.Schema.Type<typeof HexCoordSchema>;

// ── Fixture refs ───────────────────────────────────────────────────────────

/**
 * A fixture is an asset that lives on the plot. The plot owns the seed +
 * positioning offset; the renderer reads `kind` and dispatches to the right
 * primitive (Tree, Rock, etc.). Multiple fixtures per plot allowed.
 */
export const FixtureKind = S.Literal(
  "tree",
  "bush",
  "rock",
  "grass-field",
  "structure",
  "character",
  "mushroom",
  "wildflower",
  "fallen-log",
);

export const FixtureRef = S.Struct({
  kind: FixtureKind,
  /** Local offset within the hex (world units from hex center, xz). */
  offset: S.Tuple(S.Number, S.Number),
  /** Per-fixture random seed for jitter / hue selection. */
  seed: S.Number,
  /** Scale multiplier (1 = primitive default). */
  scale: S.Number,
  /** Optional fixture-specific variant tag (tree flavor, rock shape, ...). */
  variant: S.optional(S.String),
});
export type FixtureRefT = S.Schema.Type<typeof FixtureRef>;

// ── Edge classes (for inter-plot transitions) ──────────────────────────────

/**
 * Each of a plot's 6 edges describes its relationship to the neighboring
 * hex across that edge. Affects whether visual transitions (cliffs, water
 * shores) render. Direction index matches `HEX_DIRECTIONS` in neighbors.ts.
 *
 *   - flat   → smooth continuation
 *   - raised → small step up (this plot is higher)
 *   - cliff  → large vertical drop (this plot is significantly higher)
 *   - water  → shore line (this plot land, neighbor water)
 *   - bridge → carved walkway connecting plots
 */
export const HexEdge = S.Literal("flat", "raised", "cliff", "water", "bridge");
export type HexEdgeT = S.Schema.Type<typeof HexEdge>;

// ── Plot ───────────────────────────────────────────────────────────────────

export const Plot = S.Struct({
  /** Where the plot lives on the grid. */
  coord: HexCoordSchema,
  /** What kind of ground. */
  terrain: TerrainClass,
  /** y-offset (world units) — terrain elevation. */
  elevation: S.Number,
  /** Color override if the plot deviates from the terrain default. */
  tintHex: S.optional(S.String),
  /** Fixtures placed on the plot. */
  fixtures: S.Array(FixtureRef),
  /**
   * 6 edge classifications in direction-index order
   * (E, NE, NW, W, SW, SE — see neighbors.ts HEX_DIRECTIONS).
   */
  edges: S.Tuple(HexEdge, HexEdge, HexEdge, HexEdge, HexEdge, HexEdge),
  /**
   * Element affinity — the wuxing element this plot belongs to, when
   * relevant. Used by composers (RealmScene, BigRealmScene) to drive per-
   * element ambient VFX layering, time-of-day resonance, and palette
   * tinting. Optional: pure-terrain plots (water, ungrouped grass) can
   * omit this. Added cycle hex-composition-scale-2026-05-17.
   */
  element: S.optional(ElementId),
  /**
   * Element-ambient pools this plot contributes to. When BigRealmScene
   * mounts a shared element ambient (e.g. wood LeafSwirl), it queries
   * all plots with this binding and feeds them as the tile set. Allows a
   * single InstancedMesh layer to span many plots that may have different
   * primary `element` affinity but participate in the same ambient.
   *
   * Default behavior is consumer-side: when undefined, the composer should
   * treat it as `element` ? `[element]` : `[]`. We don't bake the default
   * into the schema because (a) Effect's `optional` returns `undefined`,
   * not a runtime default value, and (b) leaving it explicit at consumer
   * sites means the "this tile bound to wood for ambient purposes despite
   * being a stone tile" case stays opt-in.
   *
   * Added cycle hex-composition-scale-2026-05-17.
   */
  ambientBindings: S.optional(S.Array(ElementId)),
});
export type PlotT = S.Schema.Type<typeof Plot>;

// ── Plot defaults (one per terrain class) ──────────────────────────────────

/** A plot with all-flat edges (no transition rendering). */
const FLAT_EDGES: PlotT["edges"] = ["flat", "flat", "flat", "flat", "flat", "flat"];

export function emptyPlot(coord: HexCoordT): PlotT {
  return {
    coord,
    terrain: "empty",
    elevation: 0,
    fixtures: [],
    edges: FLAT_EDGES,
  };
}

export function grassPlot(
  coord: HexCoordT,
  fixtures: FixtureRefT[] = [],
): PlotT {
  return {
    coord,
    terrain: "grass",
    elevation: 0,
    fixtures,
    edges: FLAT_EDGES,
  };
}

export function stonePlot(
  coord: HexCoordT,
  fixtures: FixtureRefT[] = [],
): PlotT {
  return {
    coord,
    terrain: "stone",
    elevation: 0.1,
    fixtures,
    edges: FLAT_EDGES,
  };
}

export function waterPlot(coord: HexCoordT): PlotT {
  return {
    coord,
    terrain: "water",
    elevation: -0.06,
    fixtures: [],
    edges: FLAT_EDGES,
  };
}

export function shrinePlot(
  coord: HexCoordT,
  tintHex?: string,
): PlotT {
  return {
    coord,
    terrain: "shrine",
    elevation: 0.2,
    tintHex,
    fixtures: [],
    edges: FLAT_EDGES,
  };
}
