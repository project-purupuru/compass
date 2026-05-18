/**
 * Biome — declarative rules for how a Plot populates with fixtures.
 *
 * Per session 14 (2026-05-16) — operator: "set up boundaries and constraints
 * for our game engine so that procedural generation is clean. The best
 * experts to study from this WRT to seeding is Minecraft and i think we
 * want to lay down the substrate for that. This is load bearing."
 *
 * The shift:
 *   - BEFORE: each plot's fixtures were hand-coded in HexScene's make*Plot
 *     factories. No collision avoidance. No seed determinism beyond the
 *     scatter seed.
 *   - AFTER: each plot has a `biomeId`. The biome carries a list of
 *     `DecoratorRule`s. A placement engine (`decoratePlot`) consumes the
 *     rules + a seed + the hex size and emits Fixtures with proper
 *     spatial reservation.
 *
 * Why this matters:
 *   - DETERMINISM: same world seed + same hex coord = same fixtures.
 *     This is the Minecraft contract — worlds are seeds, not snapshots.
 *   - CONSTRAINTS: trees can't overlap each other; rocks can sit on
 *     grass-fields; mushrooms can grow under trees; characters always
 *     get center.
 *   - COMPOSABILITY: new biomes are data, not code. Adding "deep-forest"
 *     or "stone-quarry" is a Biome literal, no engine changes.
 *
 * Decorator priority: higher priority = placed first (claims best slots).
 * Lower priority decorators check collision against placed disks unless
 * the other kind is in their `permeableWith` list.
 *
 * Placement modes:
 *   - center  → radial 0..0.3 of hexSize (the focal slot)
 *   - edge    → radial 0.45..0.85 of hexSize (ring around the focal slot)
 *   - anywhere → radial 0..0.85 of hexSize
 *   - rim     → radial 0.7..0.95 of hexSize (true perimeter)
 */

import { Schema as S } from "effect";

import { TerrainClass, FixtureKind } from "./plot";

// ── Decorator rule ─────────────────────────────────────────────────────────

export const PlacementMode = S.Literal("center", "edge", "anywhere", "rim");
export type PlacementModeT = S.Schema.Type<typeof PlacementMode>;

export const DecoratorRule = S.Struct({
  kind: FixtureKind,
  /** [min, max] inclusive count per plot. */
  countRange: S.Tuple(S.Number, S.Number),
  /** [min, max] scale as a fraction of hexSize. */
  scaleRange: S.Tuple(S.Number, S.Number),
  /** Optional variant strings — picked uniformly per placement. */
  variants: S.optional(S.Array(S.String)),
  /** Collision radius as a fraction of hexSize. 0 = no spatial claim. */
  radius: S.Number,
  /** Higher priority = placed first, claims preferred slots. */
  priority: S.Number,
  /** Position-picking mode. */
  placement: PlacementMode,
  /**
   * Which fixture kinds this decorator can overlap with WITHOUT collision
   * rejection. Use for the grass-field substrate (everything sits on it)
   * and ambient details (mushrooms under trees, wildflowers in bushes).
   */
  permeableWith: S.optional(S.Array(FixtureKind)),
  /**
   * Max placement attempts before giving up on this decorator's count
   * slot. Higher = denser packing; lower = faster generation. Default 12.
   */
  maxAttempts: S.optional(S.Number),
});

export type DecoratorRuleT = S.Schema.Type<typeof DecoratorRule>;

// ── Biome ──────────────────────────────────────────────────────────────────

export const BiomeId = S.Literal(
  "meadow",
  "glade",
  "rocky-clearing",
  "wetland",
  "shrine-yard",
  "void",
);
export type BiomeIdT = S.Schema.Type<typeof BiomeId>;

export const Biome = S.Struct({
  id: BiomeId,
  terrain: TerrainClass,
  /** Display label for tooling / debug. */
  label: S.String,
  decorators: S.Array(DecoratorRule),
});

export type BiomeT = S.Schema.Type<typeof Biome>;

// ── Canonical biomes ───────────────────────────────────────────────────────

const ALL_FIXTURES_PERMEABLE_WITH_GRASS: readonly DecoratorRuleT[] = [];
void ALL_FIXTURES_PERMEABLE_WITH_GRASS; // documentation anchor

/**
 * MEADOW — the focal grass plot. Holds the character. Has trees ringing
 * the perimeter (so the character stays visible), bushes mid-ground,
 * rocks + flowers + mushrooms as accents.
 */
const MEADOW: BiomeT = {
  id: "meadow",
  terrain: "grass",
  label: "meadow",
  decorators: [
    // Character at center — highest priority, always 1, locks the focal slot.
    {
      kind: "character",
      countRange: [1, 1],
      scaleRange: [0.17, 0.2],
      variants: ["wood"],
      radius: 0.18,
      priority: 100,
      placement: "center",
    },
    // Trees at the edge — character stays visible through gaps. 1-2 trees.
    {
      kind: "tree",
      countRange: [1, 2],
      scaleRange: [0.45, 0.6],
      variants: ["green"],
      radius: 0.32,
      priority: 80,
      placement: "edge",
      permeableWith: ["grass-field"],
    },
    // Rocks at the edge — sit alongside trees, smaller silhouette.
    {
      kind: "rock",
      countRange: [1, 2],
      scaleRange: [0.18, 0.3],
      variants: ["boulder", "slab"],
      radius: 0.28,
      priority: 60,
      placement: "edge",
      permeableWith: ["grass-field"],
    },
    // Bushes in mid-ground — between center and edge.
    {
      kind: "bush",
      countRange: [2, 4],
      scaleRange: [0.3, 0.5],
      variants: ["green"],
      radius: 0.25,
      priority: 50,
      placement: "anywhere",
      permeableWith: ["grass-field"],
    },
    // Wildflowers — ambient accents.
    {
      kind: "wildflower",
      countRange: [1, 3],
      scaleRange: [0.1, 0.14],
      variants: ["sakura", "honey"],
      radius: 0.08,
      priority: 30,
      placement: "anywhere",
      permeableWith: ["grass-field", "bush"],
    },
    // Mushrooms — small, ground-level, can grow under trees.
    {
      kind: "mushroom",
      countRange: [0, 2],
      scaleRange: [0.08, 0.12],
      variants: ["honey", "moss"],
      radius: 0.08,
      priority: 25,
      placement: "anywhere",
      permeableWith: ["grass-field", "tree", "bush"],
    },
    // Grass field — base layer, always 1, no collision claim.
    {
      kind: "grass-field",
      countRange: [1, 1],
      scaleRange: [0.85, 0.95],
      radius: 0,
      priority: 1,
      placement: "center",
    },
  ],
};

/**
 * GLADE — autumn-flavored variant of meadow. Same shape, autumn flavor.
 * Slightly fewer bushes, more wildflowers for the seasonal feel.
 */
const GLADE: BiomeT = {
  id: "glade",
  terrain: "grass",
  label: "autumn glade",
  decorators: [
    {
      kind: "tree",
      countRange: [1, 2],
      scaleRange: [0.45, 0.58],
      variants: ["autumn"],
      radius: 0.32,
      priority: 80,
      placement: "edge",
      permeableWith: ["grass-field"],
    },
    {
      kind: "bush",
      countRange: [1, 3],
      scaleRange: [0.28, 0.42],
      variants: ["autumn"],
      radius: 0.22,
      priority: 50,
      placement: "anywhere",
      permeableWith: ["grass-field"],
    },
    {
      kind: "rock",
      countRange: [0, 1],
      scaleRange: [0.18, 0.28],
      variants: ["boulder"],
      radius: 0.22,
      priority: 60,
      placement: "edge",
      permeableWith: ["grass-field"],
    },
    {
      kind: "wildflower",
      countRange: [2, 4],
      scaleRange: [0.1, 0.14],
      variants: ["honey"],
      radius: 0.08,
      priority: 30,
      placement: "anywhere",
      permeableWith: ["grass-field", "bush"],
    },
    {
      kind: "mushroom",
      countRange: [1, 3],
      scaleRange: [0.08, 0.12],
      variants: ["honey", "moss"],
      radius: 0.08,
      priority: 25,
      placement: "anywhere",
      permeableWith: ["grass-field", "tree", "bush"],
    },
    {
      kind: "grass-field",
      countRange: [1, 1],
      scaleRange: [0.85, 0.92],
      radius: 0,
      priority: 1,
      placement: "center",
    },
  ],
};

/**
 * ROCKY-CLEARING — stone-terrain plot. Boulders dominate; sparse grass +
 * a fallen log + pebbles.
 */
const ROCKY_CLEARING: BiomeT = {
  id: "rocky-clearing",
  terrain: "stone",
  label: "rocky clearing",
  decorators: [
    {
      kind: "rock",
      countRange: [2, 3],
      scaleRange: [0.22, 0.35],
      variants: ["boulder", "slab"],
      radius: 0.3,
      priority: 80,
      placement: "anywhere",
    },
    {
      kind: "fallen-log",
      countRange: [0, 1],
      scaleRange: [0.18, 0.24],
      radius: 0.32,
      priority: 70,
      placement: "edge",
    },
    {
      kind: "rock",
      countRange: [3, 5],
      scaleRange: [0.1, 0.16],
      variants: ["pebble"],
      radius: 0.1,
      priority: 30,
      placement: "anywhere",
      permeableWith: [],
    },
    {
      kind: "mushroom",
      countRange: [0, 2],
      scaleRange: [0.08, 0.1],
      variants: ["moss"],
      radius: 0.06,
      priority: 20,
      placement: "anywhere",
      permeableWith: ["fallen-log"],
    },
  ],
};

/**
 * WETLAND — water plot. Empty by design. The foam ring + toon water carry
 * the read. No fixtures to clutter the surface.
 */
const WETLAND: BiomeT = {
  id: "wetland",
  terrain: "water",
  label: "wetland",
  decorators: [],
};

/**
 * SHRINE-YARD — shrine plot with a single structure at center. Element
 * variant determined per-plot (operator concern in next-up work).
 */
const SHRINE_YARD: BiomeT = {
  id: "shrine-yard",
  terrain: "shrine",
  label: "shrine yard",
  decorators: [
    {
      kind: "structure",
      countRange: [1, 1],
      scaleRange: [0.6, 0.8],
      radius: 0.4,
      priority: 100,
      placement: "center",
    },
  ],
};

/**
 * VOID — empty plot (rendered as fog tile or skipped). For off-map / null
 * positions in larger composed scenes.
 */
const VOID: BiomeT = {
  id: "void",
  terrain: "empty",
  label: "void",
  decorators: [],
};

/** Lookup by id. */
export const BIOMES: Record<BiomeIdT, BiomeT> = {
  meadow: MEADOW,
  glade: GLADE,
  "rocky-clearing": ROCKY_CLEARING,
  wetland: WETLAND,
  "shrine-yard": SHRINE_YARD,
  void: VOID,
};
