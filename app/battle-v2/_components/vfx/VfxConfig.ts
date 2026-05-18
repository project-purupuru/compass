/**
 * VfxConfig — Effect-schema vocabulary for the VFX lab.
 *
 * Session 14 substrate piece. Every effect carries a `VfxEffectBase` shape
 * plus its kind-specific extension. Schemas are the source of truth — the
 * tweakpane knob registration in `KnobPane` hand-maps from these defaults
 * (no AST introspection — operator-locked decision, per session-14 kickoff).
 *
 * Tree species follow PURUPURU CODEX, not generic taxonomy:
 *   `treeFlavor: green | autumn | sakura`  (PALETTE.canopyGreen /
 *    canopyAutumn / sakura — sakura RESERVED for special triggers)
 *
 * Schema import is `effect` v3+ (`Schema as S` from "effect") — matches the
 * existing substrate convention (lib/test/judge-fence.test.ts pattern).
 */

import { Schema as S } from "effect";

// ── Base ──────────────────────────────────────────────────────────────────

/** The trigger surface — manual fires from the lab, others wire later. */
export const VfxTriggerKind = S.Literal(
  "manual",
  "card-played",
  "combo",
  "hit",
  "ambient",
);

/** Render surface — r3f is the only one this session ships. */
export const VfxSurface = S.Literal("r3f", "dom");

/** Duration — either bounded ms OR `infinite` (for ambient effects). */
export const VfxDuration = S.Union(
  S.Struct({ ms: S.Number }),
  S.Literal("infinite"),
);

export const VfxEffectBase = S.Struct({
  /** Stable identifier, e.g. "tree-fall.green". */
  id: S.String,
  surface: VfxSurface,
  duration: VfxDuration,
  trigger: VfxTriggerKind,
});

export type VfxEffectBaseT = S.Schema.Type<typeof VfxEffectBase>;

// ── Tree-fall ─────────────────────────────────────────────────────────────

/**
 * Tree species, PURUPURU CODEX-grounded:
 *   - `green`  = PALETTE.canopyGreen band (default, ~70% of world trees)
 *   - `autumn` = PALETTE.canopyAutumn band (warm spice, ~30%)
 *   - `sakura` = SPECIAL — legendary card moments only; reserved.
 */
export const TreeFlavor = S.Literal("green", "autumn", "sakura");
export type TreeFlavorT = S.Schema.Type<typeof TreeFlavor>;

export const TreeFallConfig = S.extend(
  VfxEffectBase,
  S.Struct({
    kind: S.Literal("tree-fall"),
    treeFlavor: TreeFlavor,
    /** Trunk scale multiplier — 1.0 = canonical GroveGrowth size. */
    treeScale: S.Number,
    /** Fall direction, radians around world Y. 0 = +X. */
    fallDirection: S.Number,
    /** How long the trunk takes to hit the ground. */
    fallDurationMs: S.Number,
    /** Dust particle count on impact. */
    dustParticleCount: S.Number,
    /** Dust hue — hex string. */
    dustColor: S.String,
    /** How much the trunk bounces on impact (0 = no bounce, 1 = lively). */
    bounceDamping: S.Number,
    /** Delay between trunk landing and impact ripple/dust emission. */
    groundImpactDelayMs: S.Number,
    /** Ripple ring max radius (world units). */
    impactRippleRadius: S.Number,
  }),
);

export type TreeFallConfigT = S.Schema.Type<typeof TreeFallConfig>;

// ── Water-splash ──────────────────────────────────────────────────────────

export const WaterSplashConfig = S.extend(
  VfxEffectBase,
  S.Struct({
    kind: S.Literal("water-splash"),
    /** How far the splash spreads (world units). */
    splashRadius: S.Number,
    /** Number of droplet particles launched on trigger. */
    dropletCount: S.Number,
    /** How long droplets are in flight. */
    dropletFlightMs: S.Number,
    /** Initial vertical velocity of droplets. */
    dropletPeakHeight: S.Number,
    /** Number of expanding ripple rings on the ground plane. */
    rippleRingCount: S.Number,
    /** How long a ripple ring takes to expand and fade. */
    rippleSpreadMs: S.Number,
    /** Foam disc starting opacity. */
    foamOpacity: S.Number,
    /** Water hue — hex string. */
    waterColor: S.String,
    /** Foam hue — hex string. */
    foamColor: S.String,
  }),
);

export type WaterSplashConfigT = S.Schema.Type<typeof WaterSplashConfig>;

// ── Mini-scene (T3 + T4 visible test surface) ─────────────────────────────

/**
 * Mini-scene config — composes Tree + GrassField + Rock(s) under the
 * Scheimpflug DoF for evaluating the authored-normal technique stack from
 * dig-session-2026-05-16-T3/T4 in a coherent scene.
 *
 * "Trigger" re-randomizes scatterSeed → new grass + rock layout.
 */
export const MiniSceneConfig = S.extend(
  VfxEffectBase,
  S.Struct({
    kind: S.Literal("mini-scene"),
    /** Tree species + scale. */
    treeFlavor: TreeFlavor,
    treeScale: S.Number,
    /** Grass field params (BoTW up-normal trick). */
    grassCount: S.Number,
    grassRadius: S.Number,
    grassHeight: S.Number,
    /** Rock count (1..4) + Motomura face-flatten params. */
    rockCount: S.Number,
    rockScaleMin: S.Number,
    rockScaleMax: S.Number,
    /** Bias rock face normals toward world-up (0..0.5). */
    rockUpBias: S.Number,
    /** Random seed driving grass + rock scatter. Bumped by trigger. */
    scatterSeed: S.Number,
  }),
);

export type MiniSceneConfigT = S.Schema.Type<typeof MiniSceneConfig>;

export const MINI_SCENE_DEFAULTS: MiniSceneConfigT = {
  id: "mini-scene.default",
  surface: "r3f",
  duration: "infinite",
  trigger: "manual",
  kind: "mini-scene",
  treeFlavor: "green",
  treeScale: 1.4,
  grassCount: 90,
  grassRadius: 2.0,
  grassHeight: 0.32,
  rockCount: 2,
  rockScaleMin: 0.35,
  rockScaleMax: 0.7,
  rockUpBias: 0.18,
  scatterSeed: 0xa551e7,
};

// ── Hex-scene (T6 + T7 substrate-tier test surface) ───────────────────────

/**
 * HexScene config — composes 7 hex plots (1 center + 6 neighbors) to
 * demonstrate the hex-baseline substrate from session 14 (2026-05-16).
 * Authored after operator + Gumi alignment on hex grids as composable
 * scene unit. The whole scene = ring radius 1; future scenes will scale
 * to larger rings.
 *
 * "Trigger" re-seeds fixture jitter within each plot.
 */
export const HexSceneConfig = S.extend(
  VfxEffectBase,
  S.Struct({
    kind: S.Literal("hex-scene"),
    /** Hex circumradius (center-to-vertex). 1.75 = operator pin. */
    hexSize: S.Number,
    /** Render the grid outline as a wireframe overlay. */
    showOutline: S.Boolean,
    outlineOpacity: S.Number,
    outlineColor: S.String,
    /** Random seed driving fixture scatter inside plots. */
    scatterSeed: S.Number,
    /** Debug overlay toggles — operator-facing diagnostics. */
    debugLabels: S.Boolean,
    debugCornerDots: S.Boolean,
    debugCapWireframe: S.Boolean,
    debugAxes: S.Boolean,
    debugWireframeMode: S.Boolean,
    /** Perf readout panel — FPS, draw calls, tris, geometries. */
    debugPerf: S.Boolean,
    /** Rain VFX — environmental layer (Lane 2 demo). */
    rainEnabled: S.Boolean,
    rainDropCount: S.Number,
    /** Number of ring-1 tiles affected (1-7). 0 = center only. */
    rainTileCount: S.Number,
    /**
     * ECS instanced-leaf render path (cycle engine-substrate-2026-05-17 /
     * sprint-2). When ON: every fixture skips its `<LeafPuff>` JSX and
     * HexScene mounts a single `<InstancedLeafField>` aggregating all
     * hex-plot leaves into one InstancedMesh driven by one useFrame.
     * Per-frame draw calls and useFrame count drop sharply; visual parity
     * holds modulo a documented outline regression (drei `<Outlines>` does
     * not natively instance, so leaves render without ink outlines).
     * Bush is out of scope this cycle (internal sub-puff structure).
     */
    useInstancedLeaves: S.Boolean,
  }),
);

export type HexSceneConfigT = S.Schema.Type<typeof HexSceneConfig>;

export const HEX_SCENE_DEFAULTS: HexSceneConfigT = {
  id: "hex-scene.default",
  surface: "r3f",
  duration: "infinite",
  trigger: "manual",
  kind: "hex-scene",
  // Operator note 2026-05-16: reduced from 3.0 → 2.5 so elevation steps
  // between plots read proportionally larger. Still well above the
  // mini-scene threshold for asset thickness.
  hexSize: 2.5,
  // Debug overlay — defaults OFF; flip in PostPane when bug-hunting.
  debugLabels: false,
  debugCornerDots: false,
  debugCapWireframe: false,
  debugAxes: false,
  debugWireframeMode: false,
  debugPerf: false,
  rainEnabled: false,
  rainDropCount: 300, // lower default — operator: "too intense" at 800
  rainTileCount: 3,
  useInstancedLeaves: false, // OFF by default — operator A/Bs in PostPane
  showOutline: true,
  outlineOpacity: 0.32,
  outlineColor: "#f3e9d2",
  scatterSeed: 0xbabe71,
};

// ── Zone-scene (Session 17 — per-zone elemental composition) ──────────────

/**
 * ZoneScene config — composes TWO sides (player + opponent), each with an
 * element + a cluster of hex coordinates. Scene atmosphere (sky, ambient
 * light, fog) follows PLAYER-LOCAL TIME-OF-DAY only — opponent's element
 * drives their cluster's ambient VFX but does NOT split the sky.
 *
 * Stage A scope: atmosphere + cluster outlines only, no element VFX.
 * Stages B-E add LeafSwirl/PollenMotes/Mist/RippleField + per-side trigger
 * ramps + biome variants.
 */
export const ElementIdLiteral = S.Literal("wood", "fire", "earth", "metal", "water");
export type ElementIdLiteralT = S.Schema.Type<typeof ElementIdLiteral>;

export const TimeOfDayPhaseLiteral = S.Literal(
  "morning",
  "noon",
  "afternoon",
  "evening",
  "night",
);
export type TimeOfDayPhaseLiteralT = S.Schema.Type<typeof TimeOfDayPhaseLiteral>;

export const ClusterShapeLiteral = S.Literal(
  "triangle",
  "patch-5",
  "hexring",
  "star",
);
export type ClusterShapeLiteralT = S.Schema.Type<typeof ClusterShapeLiteral>;

export const ZoneSceneConfig = S.extend(
  VfxEffectBase,
  S.Struct({
    kind: S.Literal("zone-scene"),

    // ── Grid + composition ───────────────────────────────────────────────
    hexSize: S.Number,
    clusterShape: ClusterShapeLiteral,
    /** Half-distance between the two side anchors (xz units). */
    sideOffset: S.Number,
    showOutline: S.Boolean,
    outlineOpacity: S.Number,

    // ── Time-of-day ──────────────────────────────────────────────────────
    /** When true, scene phase = player's actual local clock. */
    useRealTime: S.Boolean,
    /** Used when useRealTime=false; tweakpane drives this for testing. */
    phaseOverride: TimeOfDayPhaseLiteral,
    /** Multiplier on default fog distance — higher = murkier. */
    fogDensity: S.Number,

    // ── Per-side state ───────────────────────────────────────────────────
    playerElement: ElementIdLiteral,
    opponentElement: ElementIdLiteral,

    // ── Ambient VFX (Stage B+) ───────────────────────────────────────────
    /**
     * Master ambient intensity — multiplied by element-resonance(time) per
     * cluster to get effective VFX intensity. 0 = ambient off.
     */
    ambientBase: S.Number,
    /** Wood ambient knobs (apply to whichever side carries wood). */
    woodLeafCount: S.Number,
    woodPollenCount: S.Number,
    woodFlavor: S.Literal("green", "autumn"),
    /** Water ambient knobs (apply to whichever side carries water). */
    waterMistCount: S.Number,
    waterRippleCount: S.Number,
    waterMistColor: S.String,
    waterRippleColor: S.String,
    /** Fire ambient knobs (apply to whichever side carries fire). */
    fireEmberCount: S.Number,
    fireEmberColor: S.String,
    fireGlowColor: S.String,
    /** Earth ambient knobs (apply to whichever side carries earth). */
    earthDustCount: S.Number,
    earthDustColor: S.String,
    earthGlowColor: S.String,
    /** Metal ambient knobs (apply to whichever side carries metal). */
    metalSparkCount: S.Number,
    metalSparkColor: S.String,
    metalGlowColor: S.String,

    // ── Trigger ramp (Stage D) ───────────────────────────────────────────
    /**
     * Per-side ramp counters. Each "trigger ↑" button increments the
     * counter; the ZoneScene composer detects the change and starts a
     * 1.5s ramp-up to peak (1.0) then 4s decay back to baseline.
     */
    playerRampCounter: S.Number,
    opponentRampCounter: S.Number,
    /** Ramp-up duration (seconds). */
    rampUpSec: S.Number,
    /** Decay duration (seconds). */
    rampDecaySec: S.Number,

    // ── Debug ─────────────────────────────────────────────────────────────
    debugPerf: S.Boolean,
  }),
);

export type ZoneSceneConfigT = S.Schema.Type<typeof ZoneSceneConfig>;

export const ZONE_SCENE_DEFAULTS: ZoneSceneConfigT = {
  id: "zone-scene.default",
  surface: "r3f",
  duration: "infinite",
  trigger: "manual",
  kind: "zone-scene",
  hexSize: 1.8,
  clusterShape: "patch-5",
  sideOffset: 6.5,
  showOutline: true,
  outlineOpacity: 0.55,
  useRealTime: true,
  phaseOverride: "morning",
  fogDensity: 1.0,
  playerElement: "wood",
  opponentElement: "water",
  ambientBase: 0.85,
  woodLeafCount: 80,
  woodPollenCount: 36,
  woodFlavor: "green",
  waterMistCount: 14,
  waterRippleCount: 18,
  waterMistColor: "#7ab8b8",
  waterRippleColor: "#6fd6c0",
  fireEmberCount: 50,
  fireEmberColor: "#ff7a3a",
  fireGlowColor: "#e85a4a",
  earthDustCount: 44,
  earthDustColor: "#c09060",
  earthGlowColor: "#c69f5e",
  metalSparkCount: 60,
  metalSparkColor: "#f0f4ff",
  metalGlowColor: "#b3a8c7",
  playerRampCounter: 0,
  opponentRampCounter: 0,
  rampUpSec: 1.5,
  rampDecaySec: 4.0,
  debugPerf: false,
};

// ── Card-lab (Session 18 — card-to-map choreography substrate) ───────────

/**
 * CardLab config — every Gemini timing pin as a tweakpane knob. The lab
 * lives as a vfx-lab effect entry so it sits alongside zone-scene,
 * realm-scene, etc. (operator-pinned 2026-05-17). Real cards via
 * `CardFace` + `CardStack` from the battle-v2 substrate. NO bespoke
 * card visuals.
 */
export const CardLabConfig = S.extend(
  VfxEffectBase,
  S.Struct({
    kind: S.Literal("card-lab"),
    hoverLiftPx: S.Number,
    hoverScaleMul: S.Number,
    hoverDurationSec: S.Number,
    keybindFlashDurationSec: S.Number,
    keybindFlashOpacity: S.Number,
    discardDurationSec: S.Number,
    replacementDurationSec: S.Number,
    replacementOvershoot: S.Number,
    cardGapPx: S.Number,
    cardWidthPx: S.Number,
    cardHeightPx: S.Number,
    bottomPx: S.Number,
  }),
);

export type CardLabConfigT = S.Schema.Type<typeof CardLabConfig>;

export const CARD_LAB_DEFAULTS: CardLabConfigT = {
  id: "card-lab.default",
  surface: "dom",
  duration: "infinite",
  trigger: "manual",
  kind: "card-lab",
  hoverLiftPx: 20,
  hoverScaleMul: 1.15,
  hoverDurationSec: 0.1,
  keybindFlashDurationSec: 0.06,
  keybindFlashOpacity: 0.32,
  discardDurationSec: 0.22,
  replacementDurationSec: 0.28,
  replacementOvershoot: 1.08,
  cardGapPx: 14,
  cardWidthPx: 130,
  cardHeightPx: 184,
  bottomPx: 28,
};

// ── Composition (layering primitive) ──────────────────────────────────────

/**
 * Composition modes — v1 ships sequence + parallel. `trigger-chain` is
 * stubbed in the schema for v2 (per operator session-14 decision); the
 * runtime in `Composition.ts` treats it as `sequence` until lifecycle
 * events land.
 */
export const CompositionMode = S.Literal("sequence", "parallel", "trigger-chain");
export type CompositionModeT = S.Schema.Type<typeof CompositionMode>;

export const CompositionStep = S.Struct({
  effectId: S.String,
  /** Delay before this step fires (ms) — meaning depends on mode. */
  offsetMs: S.Number,
  /** Reserved for trigger-chain mode (v2). */
  triggeredBy: S.optional(S.String),
});

export const Composition = S.Struct({
  id: S.String,
  mode: CompositionMode,
  steps: S.Array(CompositionStep),
});

export type CompositionT = S.Schema.Type<typeof Composition>;

// ── Discriminated union of all effect configs ─────────────────────────────

// ── Realm-scene (Session 17 latitude — 5-element composed realm) ─────────

/**
 * RealmScene config — composes ALL 5 elements as a pentagon of zones
 * around a center, with a mountain ring on the perimeter and a Musubi
 * silhouette to the north. Bigger map area than zone-scene; meant as the
 * "realm preview" surface for filling the world with nature + landmarks.
 *
 * Reuses the same ambient VFX primitives + element-resonance modulation
 * as zone-scene. This is the COMPOSITION pattern: more zones, same recipe.
 */
export const RealmSceneConfig = S.extend(
  VfxEffectBase,
  S.Struct({
    kind: S.Literal("realm-scene"),

    // ── Grid + layout ────────────────────────────────────────────────────
    hexSize: S.Number,
    /** Pentagon radius (distance from center to each element anchor). */
    pentagonRadius: S.Number,
    showOutlines: S.Boolean,
    outlineOpacity: S.Number,

    // ── Backdrop ─────────────────────────────────────────────────────────
    showMountains: S.Boolean,
    mountainRadius: S.Number,
    mountainHeight: S.Number,
    showLandmark: S.Boolean,
    /** Sheng-flow lines connecting adjacent generative-cycle elements. */
    showShengFlow: S.Boolean,

    // ── Time-of-day ──────────────────────────────────────────────────────
    useRealTime: S.Boolean,
    phaseOverride: TimeOfDayPhaseLiteral,
    fogDensity: S.Number,

    // ── Ambient VFX intensities (shared across all 5 zones) ──────────────
    ambientBase: S.Number,
    zoneLeafCount: S.Number,
    zonePollenCount: S.Number,
    zoneEmberCount: S.Number,
    zoneDustCount: S.Number,
    zoneSparkCount: S.Number,

    // ── Puruhani walkers (latitude — world is inhabited) ─────────────────
    showPuruhani: S.Boolean,
    puruhaniScale: S.Number,
    // ── Per-zone monuments (latitude — zones have identity) ──────────────
    showMonuments: S.Boolean,
    monumentScale: S.Number,

    // ── Debug ─────────────────────────────────────────────────────────────
    debugPerf: S.Boolean,
  }),
);

export type RealmSceneConfigT = S.Schema.Type<typeof RealmSceneConfig>;

export const REALM_SCENE_DEFAULTS: RealmSceneConfigT = {
  id: "realm-scene.default",
  surface: "r3f",
  duration: "infinite",
  trigger: "manual",
  kind: "realm-scene",
  hexSize: 1.5,
  pentagonRadius: 12,
  showOutlines: true,
  outlineOpacity: 0.55,
  showMountains: true,
  mountainRadius: 36,
  mountainHeight: 8.5,
  showLandmark: true,
  showShengFlow: true,
  useRealTime: true,
  phaseOverride: "morning",
  fogDensity: 1.0,
  ambientBase: 0.85,
  zoneLeafCount: 50,
  zonePollenCount: 24,
  zoneEmberCount: 35,
  zoneDustCount: 30,
  zoneSparkCount: 45,
  showPuruhani: true,
  puruhaniScale: 1.4,
  showMonuments: true,
  monumentScale: 1.0,
  debugPerf: false,
};

/** All effect configs the lab knows about — discriminated by `kind`. */
export const AnyEffectConfig = S.Union(
  TreeFallConfig,
  WaterSplashConfig,
  MiniSceneConfig,
  HexSceneConfig,
  ZoneSceneConfig,
  RealmSceneConfig,
  CardLabConfig,
);
export type AnyEffectConfigT = S.Schema.Type<typeof AnyEffectConfig>;

// ── Defaults (used by registry + tweakpane initial values) ────────────────

export const TREE_FALL_DEFAULTS: TreeFallConfigT = {
  id: "tree-fall.green",
  surface: "r3f",
  duration: { ms: 1800 },
  trigger: "manual",
  kind: "tree-fall",
  treeFlavor: "green",
  treeScale: 1.2,
  fallDirection: Math.PI / 4,
  fallDurationMs: 900,
  dustParticleCount: 48,
  dustColor: "#c9b692",
  bounceDamping: 0.35,
  groundImpactDelayMs: 0,
  impactRippleRadius: 1.4,
};

export const WATER_SPLASH_DEFAULTS: WaterSplashConfigT = {
  id: "water-splash.default",
  surface: "r3f",
  duration: { ms: 1400 },
  trigger: "manual",
  kind: "water-splash",
  splashRadius: 1.6,
  dropletCount: 32,
  dropletFlightMs: 900,
  dropletPeakHeight: 1.4,
  rippleRingCount: 3,
  rippleSpreadMs: 1100,
  foamOpacity: 0.65,
  waterColor: "#6ba8c9",
  foamColor: "#e8f4fa",
};

// ── Big-realm scene (Cycle hex-composition-scale-2026-05-17 / Session 18) ─

/**
 * BigRealmScene config — N×N hex grid composer with Voronoi-clustered
 * element assignment + shared per-element ambient VFX layers. Scale-test
 * target for the cycle (5×5 → 10×10 → 20×20). Operator-controlled walker
 * count + monument toggle so the perf signal can be isolated per
 * contribution.
 */
export const BigRealmSceneConfig = S.extend(
  VfxEffectBase,
  S.Struct({
    kind: S.Literal("big-realm-scene"),

    // Grid
    gridCols: S.Number,
    gridRows: S.Number,
    hexSize: S.Number,
    scatterSeed: S.Number,

    // Outlines (heavy at scale — default OFF)
    showOutlines: S.Boolean,
    outlineOpacity: S.Number,

    /**
     * Render full hex-content per tile (cap geometry + fixtures via the
     * biome+decorator pipeline) vs. just element-glow discs. ON surfaces
     * the substrate's real workload at hundreds of tiles. OFF is the
     * substrate-only A/B baseline.
     */
    showTileContent: S.Boolean,

    // Atmosphere
    useRealTime: S.Boolean,
    phaseOverride: TimeOfDayPhaseLiteral,
    fogDensity: S.Number,

    // Ambient master + per-element counts (multiplied by tile count internally)
    showAmbients: S.Boolean,
    ambientBase: S.Number,
    /** Wood — per-tile counts. Multiplied by number of wood tiles. */
    woodLeafCount: S.Number,
    woodPollenCount: S.Number,
    /** Water — per-tile counts. */
    waterMistCount: S.Number,
    waterRippleCount: S.Number,
    /** Fire / Earth / Metal — per-tile counts. */
    fireEmberCount: S.Number,
    earthDustCount: S.Number,
    metalSparkCount: S.Number,

    // Walkers (operator-controlled count, per-walker useFrame for this cycle)
    showWalkers: S.Boolean,
    walkerCount: S.Number,
    walkerScale: S.Number,

    // Monuments (one per element at cluster center of mass)
    showMonuments: S.Boolean,
    monumentScale: S.Number,

    // Debug
    debugPerf: S.Boolean,

    /**
     * Aggregate ALL leaves across the scene into ONE InstancedLeafField (the
     * cycle-1 leaf substrate), instead of per-fixture `<LeafPuff>` JSX.
     *
     * When ON, each HexPlot receives `suppressLeaves=true` so its Tree /
     * Mushroom / Wildflower / Rock children skip their `<LeafPuff>` mounts,
     * and BigRealmScene mounts a single `<InstancedLeafField>` fed by
     * `gatherLeavesFromPlots`. Outline regression on cycle-1 leaf path is
     * NOW RESOLVED (drei <Outlines> on InstancedMesh works per codex
     * flatline finding) — toon cel-band + ink outline both PRESERVED.
     *
     * Added cycle fixture-ecs-instancing-2026-05-17 (S1-T1 visual-test
     * preparation — operator wants to test instanced leaves AT SCALE before
     * the 5 fixture archetypes adopt the same pattern in S1-T2 onwards).
     */
    useInstancedLeaves: S.Boolean,

    /**
     * Aggregate ALL trees across the scene into ONE InstancedTreeField
     * (TreeTrunkArchetype + TreeBranchArchetype), instead of per-fixture
     * `<Tree>` JSX. When ON, each HexPlot receives `suppressFixtures: Set("tree")`
     * so its tree fixtures are skipped at the React level, and BigRealmScene
     * mounts a single `<InstancedTreeField specs={treeSpecsFromPlots(...)}>`
     * with 2 instanced meshes (trunks + branches) + drei <Outlines> children
     * preserving the ink-line craft.
     *
     * Leaves at branch tips continue to flow through the cycle-1 leaf path
     * (use `useInstancedLeaves` ALONG WITH `useInstancedTrees` for the full
     * cycle-3 collapse on the tree-kind).
     *
     * Added cycle fixture-ecs-instancing-2026-05-17 (S1-T3 — first non-leaf
     * archetype, sets the pattern for Bush/Rock/Mushroom/Wildflower in S2).
     */
    useInstancedTrees: S.Boolean,

    /**
     * Aggregate ALL rock fixtures (including their chunk companions) into
     * ONE InstancedRockField (RockArchetype + 2 InstancedMeshes — boulder
     * pool + pebble pool). Per-instance hue varies via setColorAt(); per-
     * instance non-uniform scale handles slab squish (1.25, 0.55, 1.15).
     *
     * Moss puffs on rocks continue to flow through the cycle-1 leaf path
     * (rockMossLeafSpecs in leafExtractors.ts) — unchanged by this toggle.
     *
     * Added cycle fixture-ecs-instancing-2026-05-17 (S2-T1 — second
     * architecturally novel archetype after Tree, before Bush).
     */
    useInstancedRocks: S.Boolean,

    /**
     * Show drei `<Stats />` panel (stats.js) in addition to PerfReadout.
     *
     * Why both: PerfReadout's FRAME ms is `1000 / fps`, which is vsync-
     * capped at 16.7ms (60 Hz refresh). Even when our actual per-frame
     * RENDER work is much less (say 5ms), PerfReadout shows 16.7ms because
     * rAF only fires at the display refresh rate. drei's Stats panel
     * shows the MS panel = actual JS+render time inside the rAF callback
     * (Performance.now() bracketed), which is vsync-INDEPENDENT and
     * reveals the real headroom.
     *
     * Added cycle-3 S2 perf-investigation (2026-05-17, codex flatline
     * caught: "current audit appears capped around 60 FPS … any
     * optimization beyond +4 FPS may be invisible without uncapped frame
     * timing or GPU timer data"). Use this knob to see what's actually
     * costing time, not just whether we're at vsync.
     *
     * Reads: top-left corner panel with FPS / MS / MB.
     */
    useStatsPanel: S.Boolean,
  }),
);

export type BigRealmSceneConfigT = S.Schema.Type<typeof BigRealmSceneConfig>;

export const BIG_REALM_SCENE_DEFAULTS: BigRealmSceneConfigT = {
  id: "big-realm-scene.default",
  surface: "r3f",
  duration: "infinite",
  trigger: "manual",
  kind: "big-realm-scene",
  gridCols: 5,
  gridRows: 5,
  hexSize: 1.6,
  scatterSeed: 0xb1612e41,
  showOutlines: false,
  outlineOpacity: 0.35,
  showTileContent: true,
  useRealTime: true,
  phaseOverride: "morning",
  fogDensity: 1.0,
  showAmbients: true,
  ambientBase: 0.7,
  woodLeafCount: 6,
  woodPollenCount: 4,
  waterMistCount: 2,
  waterRippleCount: 3,
  fireEmberCount: 8,
  earthDustCount: 5,
  metalSparkCount: 4,
  showWalkers: true,
  walkerCount: 5,
  walkerScale: 1.0,
  showMonuments: false,
  monumentScale: 1.0,
  debugPerf: true,
  useInstancedLeaves: false,
  useInstancedTrees: false,
  useInstancedRocks: false,
  useStatsPanel: false,
};
