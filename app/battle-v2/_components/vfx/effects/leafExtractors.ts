/**
 * leafExtractors — pure functions that compute world-space leaf placement for
 * each fixture kind. Used by HexScene when `useInstancedLeaves` is ON to
 * collect all leaf data into one `<InstancedLeafField>` archetype instead of
 * mounting per-fixture `<LeafPuff>` components.
 *
 * Each extractor mirrors the same math that the fixture's JSX uses to position
 * its `<LeafPuff>` children, so the instanced path is visually equivalent at
 * static frames. The sway behavior matches `app/battle-v2/_components/vfx/celVocab.ts:swayAngle`
 * — phase is precomputed from each LeafPuff's swaySeed via mulberry32, then
 * the substrate's `swayLeafSystem` runs the sin loop per frame.
 *
 * Outline regression: drei `<Outlines>` does not natively instance, so the
 * instanced leaves render without ink outlines. Accepted per sprint plan
 * (sprint-2 §Documented regression).
 */

import { Euler, Matrix4, Vector3 } from "three";

import type { FixtureRefT, PlotT } from "@/lib/hex/plot";

type FixtureKindT = FixtureRefT["kind"];

import { pickFlavorHue, type Flavor } from "../celVocab";
import { mulberry32 } from "../../world/Foliage";
import { buildBranches } from "./Tree";

// ── Shared types ───────────────────────────────────────────────────────────

/**
 * A single leaf instance — one row of the LeafArchetype. World-space.
 */
export interface LeafSpec {
  readonly worldPosition: readonly [number, number, number];
  /** Per-instance non-uniform scale (icosphere base radius = 1). */
  readonly scale: readonly [number, number, number];
  /** Hex color string (e.g., "#a8b8c4"). */
  readonly color: string;
  /** Pre-computed phase in radians from mulberry32(swaySeed) * 2π. */
  readonly swayPhase: number;
  /** Sway amplitude in radians. */
  readonly swayAmplitude: number;
  /** Sway frequency in Hz. */
  readonly swayFrequency: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const TWO_PI = Math.PI * 2;

/** Computes the same phase value swayAngle() would, given the same seed. */
function phaseFromSeed(seed: number): number {
  return mulberry32(seed)() * TWO_PI;
}

// Reusable scratch objects — extractors are called at mount only, so per-call
// allocation is acceptable, but recycling these keeps GC pressure low when
// rebuilding the whole scene (e.g., scatter-seed regen).
const _m = new Matrix4();
const _v = new Vector3();
const _euler = new Euler();

// ── Tree leaves ────────────────────────────────────────────────────────────

interface TreeExtractorProps {
  readonly worldPosition: readonly [number, number, number];
  readonly flavor: Flavor;
  readonly scale: number;
  readonly seed: number;
  readonly branchCount?: number;
}

/**
 * Tree's leaves mirror the JSX:
 *
 *   <group position={worldPos}>                              // tree root
 *     {branches.map(b => (
 *       <group position={[0, branchOriginY, 0]} rotation={[0, b.yaw, 0]}>
 *         <group rotation={[0, 0, -b.pitch]}>
 *           <LeafPuff position={[0, blen + leafR * 0.6, 0]} ... />
 *         </group>
 *       </group>
 *     ))}
 *   </group>
 *
 * Per branch: 1 primary leaf at the branch tip + 1 secondary leaf at
 * branch.leafOffset (relative to LeafPuff). Both share the same swaySeed
 * (= seed + i*31) so they sway in sync — matches the JSX where the
 * LeafPuff group rotates as a whole.
 */
export function treeLeafSpecs(p: TreeExtractorProps): LeafSpec[] {
  const branchCount = p.branchCount ?? 4;
  const branches = buildBranches(p.seed + 7, branchCount);
  const trunkHeight = p.scale * 1.05;
  const branchOriginY = trunkHeight * 0.7;
  const color = pickFlavorHue(p.flavor, p.seed);

  const specs: LeafSpec[] = [];

  for (let i = 0; i < branches.length; i++) {
    const b = branches[i];
    const blen = b.length * p.scale;
    const leafR = b.leafSize * p.scale;
    const yLocal = blen + leafR * 0.6;
    const swaySeed = p.seed + i * 31;
    const swayPhase = phaseFromSeed(swaySeed);

    // Compose the branch outer + inner transform.
    _m.identity();
    _euler.set(0, b.yaw, 0, "XYZ");
    _m.makeRotationFromEuler(_euler);
    _m.setPosition(0, branchOriginY, 0);

    // Branch inner: rotateZ(-pitch). Multiply onto branch outer.
    const inner = new Matrix4();
    _euler.set(0, 0, -b.pitch, "XYZ");
    inner.makeRotationFromEuler(_euler);
    _m.multiply(inner);

    // Primary leaf at branch-inner-local [0, yLocal, 0].
    _v.set(0, yLocal, 0).applyMatrix4(_m);
    const primaryWorld: [number, number, number] = [
      p.worldPosition[0] + _v.x,
      p.worldPosition[1] + _v.y,
      p.worldPosition[2] + _v.z,
    ];

    specs.push({
      worldPosition: primaryWorld,
      scale: [leafR, leafR, leafR],
      color,
      swayPhase,
      swayAmplitude: 0.06,
      swayFrequency: 0.45,
    });

    // Secondary leaf at LeafPuff-local b.leafOffset (scaled by p.scale).
    // LeafPuff itself sits at branch-inner-local [0, yLocal, 0], so the
    // secondary is at branch-inner-local [yLocal_offset.x, yLocal + offset.y, offset.z].
    const offX = b.leafOffset[0] * p.scale;
    const offY = b.leafOffset[1] * p.scale;
    const offZ = b.leafOffset[2] * p.scale;
    _v.set(offX, yLocal + offY, offZ).applyMatrix4(_m);
    const secondaryWorld: [number, number, number] = [
      p.worldPosition[0] + _v.x,
      p.worldPosition[1] + _v.y,
      p.worldPosition[2] + _v.z,
    ];

    specs.push({
      worldPosition: secondaryWorld,
      scale: [leafR * 0.7, leafR * 0.7, leafR * 0.7],
      color,
      swayPhase, // same phase — sway as a pair, matches LeafPuff group rotation
      swayAmplitude: 0.06,
      swayFrequency: 0.45,
    });
  }

  return specs;
}

// ── Mushroom leaves ────────────────────────────────────────────────────────

interface MushroomExtractorProps {
  readonly worldPosition: readonly [number, number, number];
  readonly flavor: Flavor;
  readonly scale: number;
  readonly seed: number;
}

/**
 * Mushroom JSX:
 *   <group position={worldPos}>
 *     <mesh position={[0, stemHeight/2, 0]} ...>...stem...</mesh>
 *     <group position={[0, stemHeight, 0]} scale={[1, 0.6, 1]}>
 *       <LeafPuff radius={capRadius} swaySeed={seed+5} amp=0.025 freq=0.3 ... />
 *     </group>
 *   </group>
 *
 * The cap group's scale [1, 0.6, 1] flattens the leaf vertically — bake into
 * the instance scale.
 */
export function mushroomLeafSpecs(p: MushroomExtractorProps): LeafSpec[] {
  const stemHeight = p.scale * 1.1;
  const capRadius = p.scale * 0.42;
  const color = pickFlavorHue(p.flavor, p.seed);
  const swayPhase = phaseFromSeed(p.seed + 5);

  return [
    {
      worldPosition: [p.worldPosition[0], p.worldPosition[1] + stemHeight, p.worldPosition[2]],
      scale: [capRadius, capRadius * 0.6, capRadius], // flatten Y per the cap group
      color,
      swayPhase,
      swayAmplitude: 0.025,
      swayFrequency: 0.3,
    },
  ];
}

// ── Wildflower leaves ──────────────────────────────────────────────────────

interface WildflowerExtractorProps {
  readonly worldPosition: readonly [number, number, number];
  readonly flavor: Flavor;
  readonly scale: number;
  readonly seed: number;
}

/**
 * Wildflower JSX:
 *   <group position={worldPos}>
 *     <mesh position={[0, stemHeight/2, 0]} ...>...stem...</mesh>
 *     <LeafPuff position={[0, stemHeight + bloomRadius * 0.5, 0]}
 *               radius={bloomRadius} swaySeed={seed+11} amp=0.08 freq=0.7 ... />
 *   </group>
 */
export function wildflowerLeafSpecs(p: WildflowerExtractorProps): LeafSpec[] {
  const stemHeight = p.scale;
  const bloomRadius = p.scale * 0.18;
  const color = pickFlavorHue(p.flavor, p.seed);
  const swayPhase = phaseFromSeed(p.seed + 11);

  return [
    {
      worldPosition: [
        p.worldPosition[0],
        p.worldPosition[1] + stemHeight + bloomRadius * 0.5,
        p.worldPosition[2],
      ],
      scale: [bloomRadius, bloomRadius, bloomRadius],
      color,
      swayPhase,
      swayAmplitude: 0.08,
      swayFrequency: 0.7,
    },
  ];
}

// ── Rock moss leaves ───────────────────────────────────────────────────────

interface RockMossExtractorProps {
  readonly worldPosition: readonly [number, number, number];
  readonly scale: number;
  readonly seed: number;
  readonly shape?: "boulder" | "slab" | "pebble";
  /** If provided, overrides the 32% moss-chance gate. */
  readonly moss?: boolean;
}

/**
 * Rock moss JSX:
 *   <group position={[wx, wy + yOffset, wz]}>   // rock wraps Y by yOffset
 *     ...rock geometry...
 *     {showMoss && (
 *       <LeafPuff position={[eff*0.12, mossY, eff*0.06]}
 *                 radius={eff*0.45}
 *                 secondary={{ offset: [eff*0.25, eff*0.1, eff*-0.15], scale: 0.7 }}
 *                 swaySeed={seed+47} amp=0.03 freq=0.4 flavor="moss" />
 *     )}
 *   </group>
 *
 * Where:
 *   isPebble = shape === "pebble"
 *   isSlab   = shape === "slab"
 *   eff = scale * (isPebble ? 0.45 : 1)
 *   yOffset = eff * (isPebble ? 0.18 : isSlab ? 0.22 : 0.4)
 *   mossY = isSlab ? eff * 0.5 : eff * 0.92
 *   showMoss = props.moss ?? (!isPebble && mulberry32(seed+17)() < 0.32)
 */
export function rockMossLeafSpecs(p: RockMossExtractorProps): LeafSpec[] {
  const isPebble = p.shape === "pebble";
  const isSlab = p.shape === "slab";
  const eff = isPebble ? p.scale * 0.45 : p.scale;
  const yOffset = eff * (isPebble ? 0.18 : isSlab ? 0.22 : 0.4);

  // Moss gate matches Rock.tsx:117-122.
  const showMoss =
    p.moss !== undefined ? p.moss : isPebble ? false : mulberry32(p.seed + 17)() < 0.32;

  if (!showMoss) return [];

  const mossY = isSlab ? eff * 0.5 : eff * 0.92;
  const primaryRadius = eff * 0.45;
  const color = pickFlavorHue("moss", p.seed + 31);
  const swayPhase = phaseFromSeed(p.seed + 47);

  // Primary moss puff (LeafPuff origin).
  const primaryLocal: [number, number, number] = [eff * 0.12, yOffset + mossY, eff * 0.06];

  // Secondary puff at LeafPuff-local offset.
  const secondaryOffset: [number, number, number] = [eff * 0.25, eff * 0.1, eff * -0.15];

  const specs: LeafSpec[] = [
    {
      worldPosition: [
        p.worldPosition[0] + primaryLocal[0],
        p.worldPosition[1] + primaryLocal[1],
        p.worldPosition[2] + primaryLocal[2],
      ],
      scale: [primaryRadius, primaryRadius, primaryRadius],
      color,
      swayPhase,
      swayAmplitude: 0.03,
      swayFrequency: 0.4,
    },
    {
      worldPosition: [
        p.worldPosition[0] + primaryLocal[0] + secondaryOffset[0],
        p.worldPosition[1] + primaryLocal[1] + secondaryOffset[1],
        p.worldPosition[2] + primaryLocal[2] + secondaryOffset[2],
      ],
      scale: [primaryRadius * 0.7, primaryRadius * 0.7, primaryRadius * 0.7],
      color,
      swayPhase, // same phase as primary — sway as a pair
      swayAmplitude: 0.03,
      swayFrequency: 0.4,
    },
  ];

  return specs;
}

// ── Dispatch ───────────────────────────────────────────────────────────────

interface FixtureExtractParams {
  readonly worldPosition: readonly [number, number, number];
  readonly seed: number;
  readonly scale: number;
  readonly flavor?: string;
  readonly variant?: string;
}

/**
 * Dispatch a fixture by kind to its extractor. Returns empty array for fixture
 * kinds that don't have a LeafPuff (bush, fallen-log, grass-field, character,
 * structure) or that are otherwise out of the leaf-instancing scope.
 *
 * Caller: HexScene, when `useInstancedLeaves` is ON, walks `plot.fixtures` and
 * resolves the world position of each fixture (worldX + offset.x, elev,
 * worldZ + offset.y), then calls this dispatch.
 */
export function fixtureLeafSpecs(kind: FixtureKindT, params: FixtureExtractParams): LeafSpec[] {
  switch (kind) {
    case "tree":
      return treeLeafSpecs({
        worldPosition: params.worldPosition,
        flavor: (params.flavor as Flavor | undefined) ?? "green",
        scale: params.scale,
        seed: params.seed,
      });
    case "mushroom":
      return mushroomLeafSpecs({
        worldPosition: params.worldPosition,
        flavor: (params.flavor as Flavor | undefined) ?? "honey",
        scale: params.scale,
        seed: params.seed,
      });
    case "wildflower":
      return wildflowerLeafSpecs({
        worldPosition: params.worldPosition,
        flavor: (params.flavor as Flavor | undefined) ?? "sakura",
        scale: params.scale,
        seed: params.seed,
      });
    case "rock":
      return rockMossLeafSpecs({
        worldPosition: params.worldPosition,
        scale: params.scale,
        seed: params.seed,
        shape:
          params.variant === "slab" ? "slab" : params.variant === "pebble" ? "pebble" : "boulder",
      });
    // Bush has internal sub-puffs (not LeafPuff) + its own useFrame — out of scope
    // this cycle per build doc.
    default:
      return [];
  }
}

/** Convenience: gather all leaves across an array of plots in world-space. */
export function gatherLeavesFromPlots(
  plots: ReadonlyArray<PlotT>,
  plotWorldPositions: ReadonlyArray<readonly [number, number]>,
): LeafSpec[] {
  const out: LeafSpec[] = [];
  for (let p = 0; p < plots.length; p++) {
    const plot = plots[p];
    const [worldX, worldZ] = plotWorldPositions[p];
    const elev = plot.elevation;
    for (const fix of plot.fixtures) {
      const fixWorld: [number, number, number] = [
        worldX + fix.offset[0],
        elev,
        worldZ + fix.offset[1],
      ];
      const specs = fixtureLeafSpecs(fix.kind, {
        worldPosition: fixWorld,
        seed: fix.seed,
        scale: fix.scale,
        flavor: fix.variant,
        variant: fix.variant,
      });
      for (const s of specs) out.push(s);
    }
  }
  return out;
}
