/**
 * Foliage — the forest that rings the field and the bushes that dress it.
 *
 * Per build doc Session 8. Procedural, instanced — no asset dependency.
 *
 * A tree is a tapered trunk + two faceted icosphere canopy blobs. Greens
 * dominate; autumn oranges accent ~30% — the reference's forest is mostly
 * green with warm spice ringing in. Everything is seeded so the forest is
 * stable across renders (no shuffle-per-frame), and instanced so ~70 trees
 * cost three draw calls, not 210.
 *
 * Trees ring OUTSIDE the play area (radius 7–19); bushes scatter closer in,
 * filling the gaps between the zone plots.
 */

"use client";

import { useMemo } from "react";

import { Instance, Instances } from "@react-three/drei";

import { groundHeight } from "./MapGround";
import { isOnLand } from "./landmass";
import { PALETTE } from "./palette";

// ── Seeded RNG — deterministic forest (shared with other world generators) ───
export function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface FoliageConfig {
  /** Trees ring OUTSIDE this radius — keep it clear of the play area. */
  readonly innerRadius: number;
  /** How deep the forest ring extends past innerRadius. */
  readonly ringDepth: number;
  readonly treeCount: number;
  readonly bushCount: number;
  readonly seed: number;
}

// Defaults size the overview map's forest; a ZoneScene passes tighter values.
const DEFAULTS: FoliageConfig = {
  innerRadius: 14,
  ringDepth: 16,
  treeCount: 120,
  bushCount: 54,
  seed: 0x5eed,
};

interface CanopySpec {
  readonly position: [number, number, number];
  readonly scale: number;
  readonly color: string;
}
interface TrunkSpec {
  readonly position: [number, number, number];
  readonly scale: [number, number, number];
}

interface FoliageData {
  readonly trunks: TrunkSpec[];
  readonly canopies: CanopySpec[];
  readonly bushes: CanopySpec[];
}

function buildFoliage(cfg: FoliageConfig): FoliageData {
  const rand = mulberry32(cfg.seed);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

  const trunks: TrunkSpec[] = [];
  const canopies: CanopySpec[] = [];
  const bushes: CanopySpec[] = [];

  // Rejection-sample a scatter point that lands ON the continent — no trees in
  // the sea (per the operator's collision ask). Null if no land found.
  const landPoint = (
    minR: number,
    maxR: number,
  ): readonly [number, number] | null => {
    for (let t = 0; t < 18; t++) {
      const a = rand() * Math.PI * 2;
      const r = minR + rand() * (maxR - minR);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (isOnLand(x, z)) return [x, z];
    }
    return null;
  };

  // Trees — a ring of forest framing the field, kept on-land.
  for (let i = 0; i < cfg.treeCount; i++) {
    const p = landPoint(cfg.innerRadius + 0.8, cfg.innerRadius + 0.8 + cfg.ringDepth);
    if (!p) continue;
    const [x, z] = p;
    const gy = groundHeight();
    const s = 0.85 + rand() * 0.95; // 0.85..1.8
    // Autumn accents ring in ~30% of the time.
    const autumn = rand() < 0.3;
    const hue = autumn ? pick(PALETTE.canopyAutumn) : pick(PALETTE.canopyGreen);

    trunks.push({ position: [x, gy + 0.5 * s, z], scale: [s, s, s] });
    // Main canopy
    canopies.push({ position: [x, gy + 1.05 * s, z], scale: 0.92 * s, color: hue });
    // Smaller offset top blob — gives the canopy a lumpy, hand-made silhouette.
    canopies.push({
      position: [
        x + (rand() - 0.5) * 0.5 * s,
        gy + 1.6 * s,
        z + (rand() - 0.5) * 0.5 * s,
      ],
      scale: 0.58 * s,
      color: hue,
    });
  }

  // Bushes — small canopy-only blobs, filling the mid-ground, kept on-land.
  for (let i = 0; i < cfg.bushCount; i++) {
    const inner = Math.max(1.5, cfg.innerRadius - 3.5);
    const p = landPoint(inner, inner + cfg.ringDepth * 0.6 + 4);
    if (!p) continue;
    const [x, z] = p;
    const gy = groundHeight();
    const s = 0.45 + rand() * 0.5;
    bushes.push({
      position: [x, gy + 0.28 * s, z],
      scale: s,
      color: pick(PALETTE.bush),
    });
  }

  return { trunks, canopies, bushes };
}

interface FoliageProps {
  readonly innerRadius?: number;
  readonly ringDepth?: number;
  readonly treeCount?: number;
  readonly bushCount?: number;
  readonly seed?: number;
}

export function Foliage(props: FoliageProps) {
  const cfg: FoliageConfig = {
    innerRadius: props.innerRadius ?? DEFAULTS.innerRadius,
    ringDepth: props.ringDepth ?? DEFAULTS.ringDepth,
    treeCount: props.treeCount ?? DEFAULTS.treeCount,
    bushCount: props.bushCount ?? DEFAULTS.bushCount,
    seed: props.seed ?? DEFAULTS.seed,
  };
  const { trunks, canopies, bushes } = useMemo(
    () => buildFoliage(cfg),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg.innerRadius, cfg.ringDepth, cfg.treeCount, cfg.bushCount, cfg.seed],
  );

  return (
    <group name="foliage">
      {/* Trunks — one shared tapered cylinder, brown. */}
      <Instances name="foliage.trunks" limit={trunks.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.17, 1, 6]} />
        <meshStandardMaterial color={PALETTE.trunk} roughness={1} />
        {trunks.map((t, i) => (
          <Instance key={i} position={t.position} scale={t.scale} />
        ))}
      </Instances>

      {/* Canopies — faceted icosphere blobs, per-instance colour. */}
      <Instances name="foliage.canopies" limit={canopies.length} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
        {canopies.map((c, i) => (
          <Instance key={i} position={c.position} scale={c.scale} color={c.color} />
        ))}
      </Instances>

      {/* Bushes — the same blob, smaller, no trunk. */}
      <Instances name="foliage.bushes" limit={bushes.length} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
        {bushes.map((b, i) => (
          <Instance key={i} position={b.position} scale={b.scale} color={b.color} />
        ))}
      </Instances>
    </group>
  );
}
