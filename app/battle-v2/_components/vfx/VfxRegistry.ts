/**
 * VfxRegistry — single source of truth for the VFX lab's effect catalogue.
 *
 * Each entry pairs:
 *   - schema (validate / type-check)
 *   - defaults (initial knob values)
 *   - Preview (r3f component the PreviewPane mounts)
 *   - registerKnobs (HAND-MAPPED tweakpane binding registration)
 *
 * Hand-mapped knobs are an OPERATOR-LOCKED DECISION (session-14 kickoff):
 * @effect/schema introspection → tweakpane bindings is an AST rabbit hole
 * that would block ship. v1 = one function per effect, explicit ranges.
 * v2+ can replace with introspection once we have 5+ effects to justify it.
 */

import type { Schema as S } from "effect";
import type { ComponentType } from "react";

import {
  CARD_COMPOSITION_DEFAULTS,
  CardCompositionConfig,
  CARD_LAB_DEFAULTS,
  CardLabConfig,
  HEX_SCENE_DEFAULTS,
  HexSceneConfig,
  MINI_SCENE_DEFAULTS,
  MiniSceneConfig,
  TREE_FALL_DEFAULTS,
  TreeFallConfig,
  WATER_SPLASH_DEFAULTS,
  WaterSplashConfig,
  BIG_REALM_SCENE_DEFAULTS,
  BigRealmSceneConfig,
  REALM_SCENE_DEFAULTS,
  RealmSceneConfig,
  ZONE_SCENE_DEFAULTS,
  ZoneSceneConfig,
  type CardCompositionConfigT,
  type CardLabConfigT,
  type HexSceneConfigT,
  type MiniSceneConfigT,
  type BigRealmSceneConfigT,
  type RealmSceneConfigT,
  type TreeFallConfigT,
  type WaterSplashConfigT,
  type ZoneSceneConfigT,
} from "./VfxConfig";
import { CardCompositionPreview } from "./effects/CardComposition";
import { CardLabPreview } from "./effects/CardLab";
import { HexScenePreview } from "./effects/HexScene";
import { MiniScenePreview } from "./effects/MiniScene";
import { BigRealmScenePreview } from "./effects/BigRealmScene";
import { RealmScenePreview } from "./effects/RealmScene";
import { TreeFallPreview } from "./effects/TreeFall";
import { WaterSplashPreview } from "./effects/WaterSplash";
import { ZoneScenePreview } from "./effects/ZoneScene";

/**
 * Structural type for the tweakpane FolderApi surface we use. Keeps the
 * registry independent of the tweakpane runtime — the KnobPane imports
 * the real Pane and asserts compatibility at call time.
 */
export interface TpFolderLike {
  addBinding(
    obj: Record<string, unknown>,
    key: string,
    opts?: Record<string, unknown>,
  ): unknown;
  addButton(opts: { title: string }): { on(ev: "click", fn: () => void): unknown };
  addBlade(opts: Record<string, unknown>): {
    on(ev: "change", fn: (e: { value: unknown }) => void): unknown;
  };
  addFolder(opts: { title: string; expanded?: boolean }): TpFolderLike;
  /** Refresh all bindings — re-read bound object values. */
  refresh(): void;
}

/**
 * Tweakpane v4 doesn't auto-detect a list controller from `addBinding` with
 * `options:{...}` for string values — it throws "No matching controller".
 * The reliable v4 path is `addBlade({ view: 'list', ... })` + an on('change')
 * handler that mutates the bound object. This helper wraps that.
 */
export function addEnumBinding<T extends string>(
  pane: TpFolderLike,
  config: Record<string, unknown>,
  key: string,
  label: string,
  options: readonly { text: string; value: T }[],
) {
  const blade = pane.addBlade({
    view: "list",
    label,
    options: options as unknown as Record<string, unknown>[],
    value: config[key],
  });
  blade.on("change", (e) => {
    config[key] = e.value;
  });
}

export interface PreviewProps<TConfig> {
  readonly config: TConfig;
  readonly triggerKey: number;
}

/**
 * The registry entry. Generic over the effect's config type. The runtime
 * `getDefinition` lookup widens to a discriminated union; callers narrow
 * via `kind`.
 */
export interface VfxEffectDefinition<TConfig> {
  /** Stable identifier — also used as the slug for preset filenames. */
  readonly id: string;
  /** Operator-facing label for the EffectPicker. */
  readonly label: string;
  /** Short subline shown under the label in the picker. */
  readonly sub: string;
  /** Effect schema (validation + JSON encode/decode). */
  readonly schema: S.Schema<TConfig>;
  /** Initial config when the effect is first selected. */
  readonly defaults: TConfig;
  /** R3F preview component mounted in the PreviewPane. */
  readonly Preview: ComponentType<PreviewProps<TConfig>>;
  /**
   * Register knobs onto a tweakpane folder. Bindings MUST mutate the passed
   * `config` object in place (tweakpane writes back to the same reference).
   * Each call returns nothing — the pane retains the bindings until disposed.
   */
  readonly registerKnobs: (pane: TpFolderLike, config: TConfig) => void;
}

// ── tree-fall ──────────────────────────────────────────────────────────────

const TREE_FALL_DEF: VfxEffectDefinition<TreeFallConfigT> = {
  id: "tree-fall",
  label: "tree-fall",
  sub: "canonical tree · pivots at base",
  schema: TreeFallConfig,
  defaults: TREE_FALL_DEFAULTS,
  Preview: TreeFallPreview,
  registerKnobs(pane, config) {
    const motion = pane.addFolder({ title: "motion", expanded: true });
    motion.addBinding(config as unknown as Record<string, unknown>, "fallDirection", {
      label: "direction (rad)",
      min: 0,
      max: Math.PI * 2,
      step: 0.01,
    });
    motion.addBinding(config as unknown as Record<string, unknown>, "fallDurationMs", {
      label: "fall (ms)",
      min: 200,
      max: 3000,
      step: 10,
    });
    motion.addBinding(config as unknown as Record<string, unknown>, "bounceDamping", {
      label: "bounce",
      min: 0,
      max: 1,
      step: 0.01,
    });
    motion.addBinding(config as unknown as Record<string, unknown>, "groundImpactDelayMs", {
      label: "impact delay (ms)",
      min: 0,
      max: 600,
      step: 10,
    });

    const shape = pane.addFolder({ title: "shape", expanded: true });
    addEnumBinding(shape, config as unknown as Record<string, unknown>, "treeFlavor", "flavor", [
      { text: "green", value: "green" },
      { text: "autumn", value: "autumn" },
      { text: "sakura", value: "sakura" },
    ]);
    shape.addBinding(config as unknown as Record<string, unknown>, "treeScale", {
      label: "scale",
      min: 0.4,
      max: 3.0,
      step: 0.05,
    });

    const dust = pane.addFolder({ title: "dust + impact", expanded: false });
    dust.addBinding(config as unknown as Record<string, unknown>, "dustParticleCount", {
      label: "particles",
      min: 0,
      max: 200,
      step: 1,
    });
    dust.addBinding(config as unknown as Record<string, unknown>, "dustColor", {
      label: "dust hue",
      view: "color",
    });
    dust.addBinding(config as unknown as Record<string, unknown>, "impactRippleRadius", {
      label: "ripple radius",
      min: 0.2,
      max: 4.0,
      step: 0.05,
    });
  },
};

// ── water-splash ───────────────────────────────────────────────────────────

const WATER_SPLASH_DEF: VfxEffectDefinition<WaterSplashConfigT> = {
  id: "water-splash",
  label: "water-splash",
  sub: "ground-plane · droplets + rings",
  schema: WaterSplashConfig,
  defaults: WATER_SPLASH_DEFAULTS,
  Preview: WaterSplashPreview,
  registerKnobs(pane, config) {
    const spread = pane.addFolder({ title: "spread", expanded: true });
    spread.addBinding(config as unknown as Record<string, unknown>, "splashRadius", {
      label: "radius",
      min: 0.2,
      max: 5,
      step: 0.05,
    });
    spread.addBinding(config as unknown as Record<string, unknown>, "rippleRingCount", {
      label: "rings",
      min: 1,
      max: 8,
      step: 1,
    });
    spread.addBinding(config as unknown as Record<string, unknown>, "rippleSpreadMs", {
      label: "ring (ms)",
      min: 200,
      max: 3000,
      step: 10,
    });

    const droplets = pane.addFolder({ title: "droplets", expanded: true });
    droplets.addBinding(config as unknown as Record<string, unknown>, "dropletCount", {
      label: "count",
      min: 0,
      max: 120,
      step: 1,
    });
    droplets.addBinding(config as unknown as Record<string, unknown>, "dropletFlightMs", {
      label: "flight (ms)",
      min: 200,
      max: 3000,
      step: 10,
    });
    droplets.addBinding(config as unknown as Record<string, unknown>, "dropletPeakHeight", {
      label: "peak (units)",
      min: 0.1,
      max: 4,
      step: 0.05,
    });

    const foam = pane.addFolder({ title: "foam + color", expanded: false });
    foam.addBinding(config as unknown as Record<string, unknown>, "foamOpacity", {
      label: "foam α",
      min: 0,
      max: 1,
      step: 0.01,
    });
    foam.addBinding(config as unknown as Record<string, unknown>, "waterColor", {
      label: "water hue",
      view: "color",
    });
    foam.addBinding(config as unknown as Record<string, unknown>, "foamColor", {
      label: "foam hue",
      view: "color",
    });
  },
};

// ── mini-scene (T3 + T4 visible test surface) ──────────────────────────────

const MINI_SCENE_DEF: VfxEffectDefinition<MiniSceneConfigT> = {
  id: "mini-scene",
  label: "mini-scene",
  sub: "tree + grass + rock · authored normals",
  schema: MiniSceneConfig,
  defaults: MINI_SCENE_DEFAULTS,
  Preview: MiniScenePreview,
  registerKnobs(pane, config) {
    const tree = pane.addFolder({ title: "tree", expanded: true });
    addEnumBinding(tree, config as unknown as Record<string, unknown>, "treeFlavor", "flavor", [
      { text: "green", value: "green" },
      { text: "autumn", value: "autumn" },
      { text: "sakura", value: "sakura" },
    ]);
    tree.addBinding(config as unknown as Record<string, unknown>, "treeScale", {
      label: "scale",
      min: 0.6,
      max: 3.0,
      step: 0.05,
    });

    const grass = pane.addFolder({ title: "grass · up-trick", expanded: true });
    grass.addBinding(config as unknown as Record<string, unknown>, "grassCount", {
      label: "count",
      min: 0,
      max: 240,
      step: 1,
    });
    grass.addBinding(config as unknown as Record<string, unknown>, "grassRadius", {
      label: "radius",
      min: 0.4,
      max: 4.5,
      step: 0.05,
    });
    grass.addBinding(config as unknown as Record<string, unknown>, "grassHeight", {
      label: "height",
      min: 0.08,
      max: 0.8,
      step: 0.01,
    });

    const rocks = pane.addFolder({ title: "rocks · motomura", expanded: true });
    rocks.addBinding(config as unknown as Record<string, unknown>, "rockCount", {
      label: "count",
      min: 0,
      max: 6,
      step: 1,
    });
    rocks.addBinding(config as unknown as Record<string, unknown>, "rockScaleMin", {
      label: "scale min",
      min: 0.15,
      max: 1.5,
      step: 0.01,
    });
    rocks.addBinding(config as unknown as Record<string, unknown>, "rockScaleMax", {
      label: "scale max",
      min: 0.15,
      max: 2.0,
      step: 0.01,
    });
    rocks.addBinding(config as unknown as Record<string, unknown>, "rockUpBias", {
      label: "up-bias",
      min: 0,
      max: 0.5,
      step: 0.01,
    });
  },
};

// ── hex-scene (T6 + T7 substrate-tier composition surface) ─────────────────

const HEX_SCENE_DEF: VfxEffectDefinition<HexSceneConfigT> = {
  id: "hex-scene",
  label: "hex-scene",
  sub: "7 plots · hex baseline substrate",
  schema: HexSceneConfig,
  defaults: HEX_SCENE_DEFAULTS,
  Preview: HexScenePreview,
  registerKnobs(pane, config) {
    // World — seed + reroll (Minecraft-style). Top of pane, prominent.
    const world = pane.addFolder({ title: "world", expanded: true });
    world.addBinding(
      config as unknown as Record<string, unknown>,
      "scatterSeed",
      {
        label: "seed",
        format: (v: number) => `0x${(v >>> 0).toString(16).padStart(6, "0")}`,
      },
    );
    world.addButton({ title: "reroll world ↻" }).on("click", () => {
      (config as unknown as Record<string, unknown>).scatterSeed = Math.floor(
        Math.random() * 0xffffff,
      );
      // tweakpane refreshes bound values on next change broadcast — caller
      // sees the new seed reflected via the pane's `change` event listener.
      pane.refresh();
    });

    const grid = pane.addFolder({ title: "grid", expanded: true });
    grid.addBinding(config as unknown as Record<string, unknown>, "hexSize", {
      label: "hex size",
      min: 0.8,
      max: 4.0,
      step: 0.05,
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "showOutline", {
      label: "outline",
    });
    grid.addBinding(
      config as unknown as Record<string, unknown>,
      "outlineOpacity",
      {
        label: "outline α",
        min: 0,
        max: 1,
        step: 0.01,
      },
    );
    grid.addBinding(
      config as unknown as Record<string, unknown>,
      "outlineColor",
      {
        label: "outline hue",
        view: "color",
      },
    );

    // Debug overlay knobs (telemetry surface per operator 2026-05-17).
    const debug = pane.addFolder({ title: "debug", expanded: false });
    debug.addBinding(config as unknown as Record<string, unknown>, "debugLabels", {
      label: "tile labels",
    });
    debug.addBinding(config as unknown as Record<string, unknown>, "debugCornerDots", {
      label: "corner Ys",
    });
    debug.addBinding(config as unknown as Record<string, unknown>, "debugCapWireframe", {
      label: "cap wireframe",
    });
    debug.addBinding(config as unknown as Record<string, unknown>, "debugAxes", {
      label: "world axes",
    });
    debug.addBinding(config as unknown as Record<string, unknown>, "debugWireframeMode", {
      label: "all wireframe",
    });
    debug.addBinding(config as unknown as Record<string, unknown>, "debugPerf", {
      label: "perf readout",
    });
    // ECS instanced-leaf path (cycle engine-substrate-2026-05-17 / sprint-2).
    // When ON: fixtures skip <LeafPuff>; HexScene mounts one <InstancedLeafField>
    // aggregating all leaves into one InstancedMesh + one useFrame.
    debug.addBinding(config as unknown as Record<string, unknown>, "useInstancedLeaves", {
      label: "instanced leaves",
    });

    // Weather VFX (Lane 2 — environmental effects).
    const weather = pane.addFolder({ title: "weather", expanded: true });
    weather.addBinding(config as unknown as Record<string, unknown>, "rainEnabled", {
      label: "rain",
    });
    weather.addBinding(config as unknown as Record<string, unknown>, "rainDropCount", {
      label: "drop count",
      min: 100,
      max: 5000,
      step: 100,
    });
    weather.addBinding(config as unknown as Record<string, unknown>, "rainTileCount", {
      label: "tiles affected",
      min: 1,
      max: 7,
      step: 1,
    });
  },
};

// ── zone-scene (Session 17 — two-side elemental composition) ──────────────

const ELEMENT_LIST_OPTIONS: readonly { text: string; value: "wood" | "fire" | "earth" | "metal" | "water" }[] = [
  { text: "wood",  value: "wood" },
  { text: "fire",  value: "fire" },
  { text: "earth", value: "earth" },
  { text: "metal", value: "metal" },
  { text: "water", value: "water" },
];

const PHASE_LIST_OPTIONS: readonly { text: string; value: "morning" | "noon" | "afternoon" | "evening" | "night" }[] = [
  { text: "morning",   value: "morning" },
  { text: "noon",      value: "noon" },
  { text: "afternoon", value: "afternoon" },
  { text: "evening",   value: "evening" },
  { text: "night",     value: "night" },
];

const CLUSTER_LIST_OPTIONS: readonly { text: string; value: "triangle" | "patch-5" | "hexring" | "star" }[] = [
  { text: "triangle (3)", value: "triangle" },
  { text: "patch-5",      value: "patch-5" },
  { text: "hexring (7)",  value: "hexring" },
  { text: "star (7)",     value: "star" },
];

const ZONE_SCENE_DEF: VfxEffectDefinition<ZoneSceneConfigT> = {
  id: "zone-scene",
  label: "zone-scene",
  sub: "two-side elemental · time-of-day aware",
  schema: ZoneSceneConfig,
  defaults: ZONE_SCENE_DEFAULTS,
  Preview: ZoneScenePreview,
  registerKnobs(pane, config) {
    const time = pane.addFolder({ title: "time-of-day", expanded: true });
    time.addBinding(config as unknown as Record<string, unknown>, "useRealTime", {
      label: "use local clock",
    });
    addEnumBinding(
      time,
      config as unknown as Record<string, unknown>,
      "phaseOverride",
      "override phase",
      PHASE_LIST_OPTIONS,
    );
    time.addBinding(config as unknown as Record<string, unknown>, "fogDensity", {
      label: "fog density",
      min: 0.4,
      max: 3.0,
      step: 0.05,
    });

    const player = pane.addFolder({ title: "player side", expanded: true });
    addEnumBinding(
      player,
      config as unknown as Record<string, unknown>,
      "playerElement",
      "element",
      ELEMENT_LIST_OPTIONS,
    );
    player.addButton({ title: "trigger ↑ player" }).on("click", () => {
      (config as unknown as Record<string, unknown>).playerRampCounter =
        ((config as unknown as Record<string, number>).playerRampCounter || 0) + 1;
      pane.refresh();
    });

    const opponent = pane.addFolder({ title: "opponent side", expanded: true });
    addEnumBinding(
      opponent,
      config as unknown as Record<string, unknown>,
      "opponentElement",
      "element",
      ELEMENT_LIST_OPTIONS,
    );
    opponent.addButton({ title: "trigger ↑ opponent" }).on("click", () => {
      (config as unknown as Record<string, unknown>).opponentRampCounter =
        ((config as unknown as Record<string, number>).opponentRampCounter || 0) + 1;
      pane.refresh();
    });

    const ramp = pane.addFolder({ title: "ramp curve", expanded: false });
    ramp.addBinding(config as unknown as Record<string, unknown>, "rampUpSec", {
      label: "ramp up (s)",
      min: 0.2,
      max: 4,
      step: 0.05,
    });
    ramp.addBinding(config as unknown as Record<string, unknown>, "rampDecaySec", {
      label: "decay (s)",
      min: 0.5,
      max: 10,
      step: 0.05,
    });

    const ambient = pane.addFolder({ title: "ambient vfx", expanded: true });
    ambient.addBinding(config as unknown as Record<string, unknown>, "ambientBase", {
      label: "base intensity",
      min: 0,
      max: 1.5,
      step: 0.01,
    });

    const wood = pane.addFolder({ title: "wood · konka", expanded: true });
    addEnumBinding(
      wood,
      config as unknown as Record<string, unknown>,
      "woodFlavor",
      "leaf flavor",
      [
        { text: "green",  value: "green" },
        { text: "autumn", value: "autumn" },
      ],
    );
    wood.addBinding(config as unknown as Record<string, unknown>, "woodLeafCount", {
      label: "leaves",
      min: 0,
      max: 240,
      step: 1,
    });
    wood.addBinding(config as unknown as Record<string, unknown>, "woodPollenCount", {
      label: "pollen",
      min: 0,
      max: 120,
      step: 1,
    });

    const water = pane.addFolder({ title: "water · sunken shrine", expanded: true });
    water.addBinding(config as unknown as Record<string, unknown>, "waterMistCount", {
      label: "mist sheets",
      min: 0,
      max: 60,
      step: 1,
    });
    water.addBinding(config as unknown as Record<string, unknown>, "waterRippleCount", {
      label: "ripples",
      min: 0,
      max: 80,
      step: 1,
    });
    water.addBinding(config as unknown as Record<string, unknown>, "waterMistColor", {
      label: "mist hue",
      view: "color",
    });
    water.addBinding(config as unknown as Record<string, unknown>, "waterRippleColor", {
      label: "ripple hue",
      view: "color",
    });

    const fire = pane.addFolder({ title: "fire · hearth", expanded: false });
    fire.addBinding(config as unknown as Record<string, unknown>, "fireEmberCount", {
      label: "embers",
      min: 0,
      max: 180,
      step: 1,
    });
    fire.addBinding(config as unknown as Record<string, unknown>, "fireEmberColor", {
      label: "ember hue",
      view: "color",
    });
    fire.addBinding(config as unknown as Record<string, unknown>, "fireGlowColor", {
      label: "glow hue",
      view: "color",
    });

    const earth = pane.addFolder({ title: "earth · amber", expanded: false });
    earth.addBinding(config as unknown as Record<string, unknown>, "earthDustCount", {
      label: "dust",
      min: 0,
      max: 180,
      step: 1,
    });
    earth.addBinding(config as unknown as Record<string, unknown>, "earthDustColor", {
      label: "dust hue",
      view: "color",
    });
    earth.addBinding(config as unknown as Record<string, unknown>, "earthGlowColor", {
      label: "glow hue",
      view: "color",
    });

    const metal = pane.addFolder({ title: "metal · sky-eyes", expanded: false });
    metal.addBinding(config as unknown as Record<string, unknown>, "metalSparkCount", {
      label: "sparks",
      min: 0,
      max: 200,
      step: 1,
    });
    metal.addBinding(config as unknown as Record<string, unknown>, "metalSparkColor", {
      label: "spark hue",
      view: "color",
    });
    metal.addBinding(config as unknown as Record<string, unknown>, "metalGlowColor", {
      label: "glow hue",
      view: "color",
    });

    const grid = pane.addFolder({ title: "grid", expanded: false });
    addEnumBinding(
      grid,
      config as unknown as Record<string, unknown>,
      "clusterShape",
      "shape",
      CLUSTER_LIST_OPTIONS,
    );
    grid.addBinding(config as unknown as Record<string, unknown>, "hexSize", {
      label: "hex size",
      min: 0.8,
      max: 3.5,
      step: 0.05,
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "sideOffset", {
      label: "side offset",
      min: 3,
      max: 14,
      step: 0.1,
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "showOutline", {
      label: "outline",
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "outlineOpacity", {
      label: "outline α",
      min: 0,
      max: 1,
      step: 0.01,
    });

    const debug = pane.addFolder({ title: "debug", expanded: false });
    debug.addBinding(config as unknown as Record<string, unknown>, "debugPerf", {
      label: "perf readout",
    });
  },
};

// ── realm-scene (Session 17 latitude — 5-element composed realm) ─────────

const REALM_SCENE_DEF: VfxEffectDefinition<RealmSceneConfigT> = {
  id: "realm-scene",
  label: "realm-scene",
  sub: "5-element pentagon · mountains · landmark",
  schema: RealmSceneConfig,
  defaults: REALM_SCENE_DEFAULTS,
  Preview: RealmScenePreview,
  registerKnobs(pane, config) {
    const time = pane.addFolder({ title: "time-of-day", expanded: true });
    time.addBinding(config as unknown as Record<string, unknown>, "useRealTime", {
      label: "use local clock",
    });
    addEnumBinding(
      time,
      config as unknown as Record<string, unknown>,
      "phaseOverride",
      "override phase",
      PHASE_LIST_OPTIONS,
    );
    time.addBinding(config as unknown as Record<string, unknown>, "fogDensity", {
      label: "fog density",
      min: 0.4,
      max: 3.0,
      step: 0.05,
    });

    const layout = pane.addFolder({ title: "layout", expanded: true });
    layout.addBinding(config as unknown as Record<string, unknown>, "pentagonRadius", {
      label: "pentagon r",
      min: 6,
      max: 24,
      step: 0.25,
    });
    layout.addBinding(config as unknown as Record<string, unknown>, "hexSize", {
      label: "hex size",
      min: 0.8,
      max: 3.0,
      step: 0.05,
    });
    layout.addBinding(config as unknown as Record<string, unknown>, "showOutlines", {
      label: "outlines",
    });
    layout.addBinding(config as unknown as Record<string, unknown>, "outlineOpacity", {
      label: "outline α",
      min: 0,
      max: 1,
      step: 0.01,
    });

    const backdrop = pane.addFolder({ title: "backdrop", expanded: true });
    backdrop.addBinding(config as unknown as Record<string, unknown>, "showMountains", {
      label: "mountains",
    });
    backdrop.addBinding(config as unknown as Record<string, unknown>, "mountainRadius", {
      label: "ring radius",
      min: 20,
      max: 80,
      step: 0.5,
    });
    backdrop.addBinding(config as unknown as Record<string, unknown>, "mountainHeight", {
      label: "peak height",
      min: 2,
      max: 24,
      step: 0.25,
    });
    backdrop.addBinding(config as unknown as Record<string, unknown>, "showLandmark", {
      label: "musubi landmark",
    });
    backdrop.addBinding(config as unknown as Record<string, unknown>, "showShengFlow", {
      label: "sheng-flow lines",
    });

    const ambient = pane.addFolder({ title: "ambient vfx", expanded: true });
    ambient.addBinding(config as unknown as Record<string, unknown>, "ambientBase", {
      label: "base intensity",
      min: 0,
      max: 1.5,
      step: 0.01,
    });
    ambient.addBinding(config as unknown as Record<string, unknown>, "zoneLeafCount", {
      label: "wood leaves",
      min: 0,
      max: 200,
      step: 1,
    });
    ambient.addBinding(config as unknown as Record<string, unknown>, "zonePollenCount", {
      label: "wood pollen",
      min: 0,
      max: 120,
      step: 1,
    });
    ambient.addBinding(config as unknown as Record<string, unknown>, "zoneEmberCount", {
      label: "fire embers",
      min: 0,
      max: 200,
      step: 1,
    });
    ambient.addBinding(config as unknown as Record<string, unknown>, "zoneDustCount", {
      label: "earth dust",
      min: 0,
      max: 200,
      step: 1,
    });
    ambient.addBinding(config as unknown as Record<string, unknown>, "zoneSparkCount", {
      label: "metal sparks",
      min: 0,
      max: 200,
      step: 1,
    });

    const puruhani = pane.addFolder({ title: "puruhani · inhabitants", expanded: true });
    puruhani.addBinding(config as unknown as Record<string, unknown>, "showPuruhani", {
      label: "show puruhani",
    });
    puruhani.addBinding(config as unknown as Record<string, unknown>, "puruhaniScale", {
      label: "scale",
      min: 0.5,
      max: 3.0,
      step: 0.05,
    });

    const monuments = pane.addFolder({ title: "monuments · identity", expanded: true });
    monuments.addBinding(config as unknown as Record<string, unknown>, "showMonuments", {
      label: "show monuments",
    });
    monuments.addBinding(config as unknown as Record<string, unknown>, "monumentScale", {
      label: "scale",
      min: 0.4,
      max: 2.5,
      step: 0.05,
    });

    const debug = pane.addFolder({ title: "debug", expanded: false });
    debug.addBinding(config as unknown as Record<string, unknown>, "debugPerf", {
      label: "perf readout",
    });
  },
};

// ── big-realm-scene (Cycle hex-composition-scale-2026-05-17, Session 18) ──

const BIG_REALM_SCENE_DEF: VfxEffectDefinition<BigRealmSceneConfigT> = {
  id: "big-realm-scene",
  label: "big-realm-scene",
  sub: "N×N hex grid · Voronoi elements · scale-test target",
  schema: BigRealmSceneConfig,
  defaults: BIG_REALM_SCENE_DEFAULTS,
  Preview: BigRealmScenePreview,
  registerKnobs(pane, config) {
    // Defensive: HMR preserves useRef across hot-reloads, so when this
    // schema grows new fields the operator's existing ref still has the
    // OLD shape. Backfill defaults at registerKnobs time so tweakpane's
    // addBinding doesn't throw "No matching controller" on missing keys.
    // Operator-caught regression class (session-18 2026-05-17).
    const cfg = config as unknown as Record<string, unknown>;
    const defaults = BIG_REALM_SCENE_DEFAULTS as unknown as Record<string, unknown>;
    for (const key of Object.keys(defaults)) {
      if (cfg[key] === undefined) cfg[key] = defaults[key];
    }

    const grid = pane.addFolder({ title: "grid", expanded: true });
    grid.addBinding(config as unknown as Record<string, unknown>, "gridCols", {
      label: "cols",
      min: 1,
      max: 25,
      step: 1,
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "gridRows", {
      label: "rows",
      min: 1,
      max: 25,
      step: 1,
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "hexSize", {
      label: "hex size",
      min: 0.6,
      max: 3.0,
      step: 0.05,
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "scatterSeed", {
      label: "seed",
      min: 0,
      max: 0xffffffff,
      step: 1,
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "showOutlines", {
      label: "outlines",
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "outlineOpacity", {
      label: "outline α",
      min: 0,
      max: 1,
      step: 0.05,
    });
    grid.addBinding(config as unknown as Record<string, unknown>, "showTileContent", {
      label: "tile content (fixtures)",
    });

    const atmos = pane.addFolder({ title: "atmosphere", expanded: false });
    atmos.addBinding(config as unknown as Record<string, unknown>, "useRealTime", {
      label: "local clock",
    });
    addEnumBinding(
      atmos,
      config as unknown as Record<string, unknown>,
      "phaseOverride",
      "phase override",
      [
        { text: "morning", value: "morning" },
        { text: "noon", value: "noon" },
        { text: "afternoon", value: "afternoon" },
        { text: "evening", value: "evening" },
        { text: "night", value: "night" },
      ],
    );
    atmos.addBinding(config as unknown as Record<string, unknown>, "fogDensity", {
      label: "fog density",
      min: 0.1,
      max: 5.0,
      step: 0.1,
    });

    const amb = pane.addFolder({ title: "ambients (shared per element)", expanded: true });
    amb.addBinding(config as unknown as Record<string, unknown>, "showAmbients", {
      label: "show ambients",
    });
    amb.addBinding(config as unknown as Record<string, unknown>, "ambientBase", {
      label: "ambient base",
      min: 0,
      max: 1,
      step: 0.05,
    });
    amb.addBinding(config as unknown as Record<string, unknown>, "woodLeafCount", {
      label: "wood leaves/tile",
      min: 0,
      max: 24,
      step: 1,
    });
    amb.addBinding(config as unknown as Record<string, unknown>, "woodPollenCount", {
      label: "wood pollen/tile",
      min: 0,
      max: 24,
      step: 1,
    });
    amb.addBinding(config as unknown as Record<string, unknown>, "waterMistCount", {
      label: "water mist/tile",
      min: 0,
      max: 12,
      step: 1,
    });
    amb.addBinding(config as unknown as Record<string, unknown>, "waterRippleCount", {
      label: "water ripple/tile",
      min: 0,
      max: 16,
      step: 1,
    });
    amb.addBinding(config as unknown as Record<string, unknown>, "fireEmberCount", {
      label: "fire embers/tile",
      min: 0,
      max: 32,
      step: 1,
    });
    amb.addBinding(config as unknown as Record<string, unknown>, "earthDustCount", {
      label: "earth dust/tile",
      min: 0,
      max: 24,
      step: 1,
    });
    amb.addBinding(config as unknown as Record<string, unknown>, "metalSparkCount", {
      label: "metal sparks/tile",
      min: 0,
      max: 24,
      step: 1,
    });

    const walkers = pane.addFolder({ title: "walkers · operator dial", expanded: true });
    walkers.addBinding(config as unknown as Record<string, unknown>, "showWalkers", {
      label: "show walkers",
    });
    walkers.addBinding(config as unknown as Record<string, unknown>, "walkerCount", {
      label: "walker count",
      min: 0,
      max: 100,
      step: 1,
    });
    walkers.addBinding(config as unknown as Record<string, unknown>, "walkerScale", {
      label: "walker scale",
      min: 0.4,
      max: 2.0,
      step: 0.05,
    });

    const mon = pane.addFolder({ title: "monuments", expanded: false });
    mon.addBinding(config as unknown as Record<string, unknown>, "showMonuments", {
      label: "show monuments",
    });
    mon.addBinding(config as unknown as Record<string, unknown>, "monumentScale", {
      label: "scale",
      min: 0.4,
      max: 2.5,
      step: 0.05,
    });

    const debug = pane.addFolder({ title: "debug", expanded: true });
    debug.addBinding(config as unknown as Record<string, unknown>, "debugPerf", {
      label: "perf readout",
    });
    debug.addBinding(
      config as unknown as Record<string, unknown>,
      "useInstancedLeaves",
      {
        // Cycle-3 fixture-ecs-instancing S1-T1 test surface. ON: aggregate
        // all leaves across the grid into ONE InstancedLeafField (cycle-1
        // substrate), each HexPlot's fixtures suppress their own LeafPuff
        // mounts. Outlines on instanced leaves NOW WORK (codex flatline
        // verified drei 10.7.7 Outlines.js has isInstancedMesh branch).
        label: "instanced leaves",
      },
    );
    debug.addBinding(
      config as unknown as Record<string, unknown>,
      "useInstancedTrees",
      {
        // Cycle-3 fixture-ecs-instancing S1-T3 test surface. ON: aggregate
        // all "tree" fixtures into ONE InstancedTreeField (2 InstancedMeshes:
        // trunk + branch cylinders, each with drei <Outlines>). HexPlot
        // receives suppressFixtures: Set(["tree"]) and skips Tree JSX. Use
        // alongside "instanced leaves" to also send branch-tip leaves
        // through the leaf field.
        label: "instanced trees",
      },
    );
    debug.addBinding(
      config as unknown as Record<string, unknown>,
      "useInstancedRocks",
      {
        // Cycle-3 fixture-ecs-instancing S2-T1 test surface. ON: aggregate
        // all "rock" fixtures (primaries + chunks) into ONE
        // InstancedRockField (2 InstancedMeshes: boulder pool + pebble
        // pool, each with drei <Outlines> + per-instance hue). HexPlot
        // receives suppressFixtures with "rock" added.
        label: "instanced rocks",
      },
    );
    debug.addBinding(
      config as unknown as Record<string, unknown>,
      "useInstancedBushes",
      { label: "instanced bushes" },
    );
    debug.addBinding(
      config as unknown as Record<string, unknown>,
      "useInstancedMushrooms",
      { label: "instanced mushrooms" },
    );
    debug.addBinding(
      config as unknown as Record<string, unknown>,
      "useInstancedWildflowers",
      { label: "instanced wildflowers" },
    );
    debug.addBinding(
      config as unknown as Record<string, unknown>,
      "useInstancedFallenLogs",
      { label: "instanced fallen-logs" },
    );
    debug.addBinding(
      config as unknown as Record<string, unknown>,
      "useStatsPanel",
      {
        // Cycle-3 S2 perf-investigation toggle. ON: mount drei <Stats />
        // panel in the canvas — shows MS (vsync-independent) alongside
        // FPS, revealing actual frame-render-time even when PerfReadout's
        // FPS reads 60-capped. Use this to measure optimization gains
        // that PerfReadout would otherwise hide behind the vsync ceiling.
        label: "stats panel (uncapped ms)",
      },
    );
  },
};

// ── card-lab (Session 18 — card-to-map choreography substrate) ─────────────

const CARD_LAB_DEF: VfxEffectDefinition<CardLabConfigT> = {
  id: "card-lab",
  label: "card-lab",
  sub: "5-card hand · juice substrate",
  schema: CardLabConfig,
  defaults: CARD_LAB_DEFAULTS,
  Preview: CardLabPreview,
  registerKnobs(pane, config) {
    // Defensive: HMR + persisted localStorage configs preserve old shape
    // across schema evolution. Backfill defaults at registerKnobs time so
    // tweakpane's addBinding doesn't throw "No matching controller" on
    // missing keys. Same pattern as BIG_REALM_SCENE_DEF (session-18 fix
    // d3c411fa). Extended to CARD_LAB_DEF 2026-05-17 after operator hit
    // "No matching controller for 'hoverLiftPx'" in production.
    const cfg = config as unknown as Record<string, unknown>;
    const defaults = CARD_LAB_DEFAULTS as unknown as Record<string, unknown>;
    for (const key of Object.keys(defaults)) {
      if (cfg[key] === undefined) cfg[key] = defaults[key];
    }

    const hover = pane.addFolder({ title: "hover", expanded: true });
    hover.addBinding(config as unknown as Record<string, unknown>, "hoverLiftPx", {
      label: "lift (px)", min: 0, max: 60, step: 1,
    });
    hover.addBinding(config as unknown as Record<string, unknown>, "hoverScaleMul", {
      label: "scale", min: 1.0, max: 1.5, step: 0.01,
    });
    hover.addBinding(config as unknown as Record<string, unknown>, "hoverDurationSec", {
      label: "duration (s)", min: 0.05, max: 0.5, step: 0.01,
    });

    const keybind = pane.addFolder({ title: "keybind haptic", expanded: true });
    keybind.addBinding(config as unknown as Record<string, unknown>, "keybindFlashDurationSec", {
      label: "pulse (s)", min: 0.02, max: 0.3, step: 0.01,
    });
    keybind.addBinding(config as unknown as Record<string, unknown>, "keybindFlashOpacity", {
      label: "opacity", min: 0, max: 1, step: 0.01,
    });

    const discard = pane.addFolder({ title: "discard", expanded: true });
    discard.addBinding(config as unknown as Record<string, unknown>, "discardDurationSec", {
      label: "fly-out (s)", min: 0.1, max: 0.8, step: 0.01,
    });

    const draw = pane.addFolder({ title: "replacement draw", expanded: true });
    draw.addBinding(config as unknown as Record<string, unknown>, "replacementDurationSec", {
      label: "slide-in (s)", min: 0.1, max: 0.8, step: 0.01,
    });
    draw.addBinding(config as unknown as Record<string, unknown>, "replacementOvershoot", {
      label: "overshoot", min: 1.0, max: 1.4, step: 0.01,
    });

    const layout = pane.addFolder({ title: "layout", expanded: false });
    layout.addBinding(config as unknown as Record<string, unknown>, "cardWidthPx", {
      label: "card w (px)", min: 80, max: 220, step: 1,
    });
    layout.addBinding(config as unknown as Record<string, unknown>, "cardHeightPx", {
      label: "card h (px)", min: 110, max: 320, step: 1,
    });
    layout.addBinding(config as unknown as Record<string, unknown>, "cardGapPx", {
      label: "gap (px)", min: 0, max: 60, step: 1,
    });
    layout.addBinding(config as unknown as Record<string, unknown>, "bottomPx", {
      label: "bottom (px)", min: 0, max: 120, step: 1,
    });
  },
};

// ── card-composition (Session 2026-05-18 — kitchen primitive) ──────────────
//
// The kitchen surface for codex-authored cards. Reads from
// /codex/cards.jsonl + /codex/cards/<slug>/layers.json (vendored from
// purupuru-codex PR #1 until pack sync delivers them natively). Sits beside
// CARD_LAB — does NOT replace it. CARD_LAB is choreography substrate;
// CARD_COMPOSITION is composition substrate.

const CARD_COMPOSITION_DEF: VfxEffectDefinition<CardCompositionConfigT> = {
  id: "card-composition",
  label: "card-composition",
  sub: "codex layer stack · gumi kitchen",
  schema: CardCompositionConfig,
  defaults: CARD_COMPOSITION_DEFAULTS,
  Preview: CardCompositionPreview,
  registerKnobs(pane, config) {
    // Defensive backfill — same shape as CARD_LAB_DEF / BIG_REALM_SCENE_DEF.
    const cfg = config as unknown as Record<string, unknown>;
    const defaults = CARD_COMPOSITION_DEFAULTS as unknown as Record<string, unknown>;
    for (const key of Object.keys(defaults)) {
      if (cfg[key] === undefined) cfg[key] = defaults[key];
    }

    const ingredient = pane.addFolder({ title: "ingredient", expanded: true });
    // Card picker — V0 hardcodes the known slugs. Future: populate from listCodexCards().
    addEnumBinding(ingredient, config as unknown as Record<string, unknown>, "cardSlug", "card", [
      { text: "earth-jani", value: "earth-jani" },
    ]);

    const view = pane.addFolder({ title: "view", expanded: true });
    view.addBinding(config as unknown as Record<string, unknown>, "previewScale", {
      label: "scale",
      min: 0.2,
      max: 1.0,
      step: 0.01,
    });
    view.addBinding(config as unknown as Record<string, unknown>, "showComposite", {
      label: "show composite",
    });
    view.addBinding(config as unknown as Record<string, unknown>, "showStatus", {
      label: "show status",
    });

    const depth = pane.addFolder({ title: "depth (V1 preview)", expanded: false });
    depth.addBinding(config as unknown as Record<string, unknown>, "depthStub", {
      label: "pop-up tilt",
      min: 0,
      max: 1,
      step: 0.01,
    });

    const dbg = pane.addFolder({ title: "debug", expanded: false });
    dbg.addBinding(config as unknown as Record<string, unknown>, "debug", {
      label: "outline layers + bboxes",
    });
  },
};

// ── Registry ───────────────────────────────────────────────────────────────

/** Discriminated by `kind` on the underlying config. */
export type AnyVfxDefinition =
  | VfxEffectDefinition<TreeFallConfigT>
  | VfxEffectDefinition<WaterSplashConfigT>
  | VfxEffectDefinition<MiniSceneConfigT>
  | VfxEffectDefinition<HexSceneConfigT>
  | VfxEffectDefinition<ZoneSceneConfigT>
  | VfxEffectDefinition<RealmSceneConfigT>
  | VfxEffectDefinition<BigRealmSceneConfigT>
  | VfxEffectDefinition<CardLabConfigT>
  | VfxEffectDefinition<CardCompositionConfigT>;

export const VFX_REGISTRY: readonly AnyVfxDefinition[] = [
  CARD_COMPOSITION_DEF,
  CARD_LAB_DEF,
  BIG_REALM_SCENE_DEF,
  REALM_SCENE_DEF,
  ZONE_SCENE_DEF,
  HEX_SCENE_DEF,
  MINI_SCENE_DEF,
  TREE_FALL_DEF,
  WATER_SPLASH_DEF,
];

export function getDefinition(id: string): AnyVfxDefinition | undefined {
  return VFX_REGISTRY.find((d) => d.id === id);
}
