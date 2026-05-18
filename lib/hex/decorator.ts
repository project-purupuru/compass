/**
 * decoratePlot — turns a Biome + seed + hex size into a list of Fixtures.
 *
 * Per session 14 (2026-05-16). The PLACEMENT engine of the substrate.
 * Priority-sorted decorators claim spots; lower-priority ones check
 * collision against placed disks (with permeability list for "this kind
 * can overlap that kind").
 *
 * Determinism contract: identical (biome, seed, hexSize) → identical
 * Fixture[] output, every time. Same as Minecraft chunk generation.
 *
 * Spatial reservation algorithm:
 *   1. Sort decorators by priority desc.
 *   2. For each decorator:
 *      a. Seed-roll count from countRange.
 *      b. For each placement:
 *         - Pick candidate (x, z) via placement-mode polar sampling.
 *         - Check collision: any placed disk D where
 *             D.kind ∉ this.permeableWith
 *             AND distance(candidate, D) < (this.radius + D.radius)
 *         - If collision: retry up to maxAttempts.
 *         - If exhausted: skip this placement slot.
 *         - Else: place fixture + register disk.
 *   3. Return fixtures.
 */

import {
  type BiomeT,
  type DecoratorRuleT,
  type PlacementModeT,
} from "./biome";
import {
  type FixtureRefT,
  type HexCoordT,
} from "./plot";

// ── Deterministic RNG (mulberry32) ─────────────────────────────────────────
// Inlined to keep lib/hex free of external dependencies.

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Placement sampling ─────────────────────────────────────────────────────

/** Polar sample within the hex's inscribed disk for a given placement mode. */
function samplePosition(
  mode: PlacementModeT,
  hexSize: number,
  rand: () => number,
): [number, number] {
  // Inscribed-disk radius for a flat-top hex = (sqrt(3)/2) * size.
  const inradius = (Math.sqrt(3) / 2) * hexSize;
  let rMin: number;
  let rMax: number;
  switch (mode) {
    case "center":
      rMin = 0;
      rMax = inradius * 0.3;
      break;
    case "edge":
      rMin = inradius * 0.45;
      rMax = inradius * 0.85;
      break;
    case "rim":
      rMin = inradius * 0.7;
      rMax = inradius * 0.92;
      break;
    case "anywhere":
    default:
      rMin = 0;
      rMax = inradius * 0.85;
      break;
  }
  // sqrt(rand) for even areal density.
  const r = rMin + Math.sqrt(rand()) * (rMax - rMin);
  const a = rand() * Math.PI * 2;
  return [Math.cos(a) * r, Math.sin(a) * r];
}

// ── Collision check ────────────────────────────────────────────────────────

interface PlacedDisk {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly kind: FixtureRefT["kind"];
}

function collides(
  rule: DecoratorRuleT,
  candidate: { x: number; z: number; radius: number },
  placed: readonly PlacedDisk[],
): boolean {
  const permeable = new Set(rule.permeableWith ?? []);
  for (const d of placed) {
    if (permeable.has(d.kind)) continue;
    const dx = candidate.x - d.x;
    const dz = candidate.z - d.z;
    const minDist = candidate.radius + d.radius;
    if (dx * dx + dz * dz < minDist * minDist) return true;
  }
  return false;
}

// ── Seed mixing ────────────────────────────────────────────────────────────

/**
 * Mix the world seed with the plot's coord + decorator kind so that adding a
 * new decorator rule doesn't disturb the seeds of unrelated placements.
 * Independent streams per decorator kind = stable seed semantics.
 */
function mixSeed(worldSeed: number, coord: HexCoordT, salt: number): number {
  const q = coord.q | 0;
  const r = coord.r | 0;
  // FNV-1a style mix — fast, decent distribution for our small inputs.
  let h = (worldSeed ^ 0x811c9dc5) | 0;
  h = Math.imul(h ^ q, 0x01000193) | 0;
  h = Math.imul(h ^ r, 0x01000193) | 0;
  h = Math.imul(h ^ salt, 0x01000193) | 0;
  return h | 0;
}

function kindSalt(kind: FixtureRefT["kind"]): number {
  // Stable hash for kind strings. Add new kinds to the end so existing
  // generators stay deterministic.
  const KINDS: Record<FixtureRefT["kind"], number> = {
    tree: 1,
    bush: 2,
    rock: 3,
    "grass-field": 4,
    structure: 5,
    character: 6,
    mushroom: 7,
    wildflower: 8,
    "fallen-log": 9,
  };
  return KINDS[kind] ?? 0;
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface DecorateOpts {
  /** World seed — same as Minecraft's world.seed. */
  readonly worldSeed: number;
  /** Hex coord of the plot being decorated. */
  readonly coord: HexCoordT;
  /** Hex circumradius (matches lib/hex DEFAULT_HEX_SIZE convention). */
  readonly hexSize: number;
  /** Biome whose rules to apply. */
  readonly biome: BiomeT;
}

export function decoratePlot(opts: DecorateOpts): FixtureRefT[] {
  const { worldSeed, coord, hexSize, biome } = opts;
  const fixtures: FixtureRefT[] = [];
  const placed: PlacedDisk[] = [];

  // Priority desc — highest claims first.
  const sorted = [...biome.decorators].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    const ruleSeed = mixSeed(worldSeed, coord, kindSalt(rule.kind) * 1009);
    const rand = mulberry32(ruleSeed);

    // Roll a deterministic count within the range.
    const [cMin, cMax] = rule.countRange;
    const count = cMin + Math.floor(rand() * (cMax - cMin + 1));
    const maxAttempts = rule.maxAttempts ?? 12;
    const collisionRadius = rule.radius * hexSize;

    for (let i = 0; i < count; i++) {
      let placedThisSlot = false;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const [x, z] = samplePosition(rule.placement, hexSize, rand);
        const candidate = { x, z, radius: collisionRadius };
        if (!collides(rule, candidate, placed)) {
          // Place it.
          const [sMin, sMax] = rule.scaleRange;
          const scale = (sMin + rand() * (sMax - sMin)) * hexSize;
          const variant = rule.variants
            ? rule.variants[Math.floor(rand() * rule.variants.length)]
            : undefined;
          const fixtureSeed = mixSeed(
            worldSeed,
            coord,
            kindSalt(rule.kind) * 1009 + i * 31,
          );
          fixtures.push({
            kind: rule.kind,
            offset: [x, z],
            seed: fixtureSeed,
            scale,
            variant,
          });
          // Register disk only if it has a real collision radius.
          if (collisionRadius > 0) {
            placed.push({ x, z, radius: collisionRadius, kind: rule.kind });
          }
          placedThisSlot = true;
          break;
        }
      }
      // If we exhausted attempts, silently skip this slot (the field is
      // legitimately too crowded for one more — that's the constraint
      // working, not a bug).
      void placedThisSlot;
    }
  }

  return fixtures;
}
