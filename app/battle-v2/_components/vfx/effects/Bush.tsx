/**
 * Bush — merged puff cluster (canonical Purupuru recipe).
 *
 * Per session 14 (2026-05-16) — operator: "bushes look oddly constructed,
 * doesn't match the toon register of trees + rocks." Rebuilt using the
 * same canonical recipe Tree's canopy uses: `buildPuffCluster` MERGES
 * N icospheres with spherical-pivot normals into ONE BufferGeometry +
 * ONE toon material + ONE Outlines.
 *
 * Why this reads cel-correct (vs the old per-puff approach):
 *   - One mesh = one outline = no overlapping ink lines
 *   - Spherical-pivot normals = light wraps the whole cluster as one volume
 *     (instead of each puff shading independently)
 *   - One toon-band per pixel = clear 3-band separation across the form
 *
 * Same vocabulary as Tree's canopy, just smaller and with more puffs for
 * the lower, wider, denser silhouette a bush has.
 */

"use client";

import { useMemo } from "react";

import { Outlines } from "@react-three/drei";

import { buildPuffCluster } from "../../world/clusterGeometry";
import { mulberry32 } from "../../world/Foliage";
import {
  DEFAULT_TOON_GRADIENT,
  type Flavor,
  INK,
  pickFlavorHue,
  swayAngle,
} from "../celVocab";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

/** Build the puff layout for a bush — varies by seed for shape variety. */
function buildBushPuffs(seed: number, scale: number) {
  const rand = mulberry32(seed);
  const count = 4 + Math.floor(rand() * 3); // 4..6
  const puffs: { offset: [number, number, number]; radius: number; detail?: 1 }[] = [];

  // Anchor puff — large, centered, slightly above ground.
  puffs.push({
    offset: [0, scale * 0.42, 0],
    radius: scale * 0.55,
    detail: 1,
  });

  // Surrounding puffs — slightly smaller, scattered at varied heights/radii.
  for (let i = 1; i < count; i++) {
    const a = ((i - 1) / (count - 1)) * Math.PI * 2 + (rand() - 0.5) * 0.7;
    const r = scale * (0.22 + rand() * 0.18);
    const y = scale * (0.3 + rand() * 0.4);
    puffs.push({
      offset: [Math.cos(a) * r, y, Math.sin(a) * r],
      radius: scale * (0.32 + rand() * 0.16),
      detail: 1,
    });
  }
  return puffs;
}

interface BushProps {
  readonly position?: readonly [number, number, number];
  readonly flavor?: Flavor;
  readonly scale?: number;
  readonly seed?: number;
}

export function Bush({
  position = [0, 0, 0],
  flavor = "green",
  scale = 0.6,
  seed = 0xb115,
}: BushProps) {
  const hue = useMemo(() => pickFlavorHue(flavor, seed), [flavor, seed]);

  // Merged cluster geometry — single mesh, single outline, single toon band.
  const geometry = useMemo(() => {
    const puffs = buildBushPuffs(seed + 3, scale);
    // Pivot at the cluster's center of mass — normals wrap the whole bush
    // as one volume.
    const avgX = puffs.reduce((s, p) => s + p.offset[0], 0) / puffs.length;
    const avgY = puffs.reduce((s, p) => s + p.offset[1], 0) / puffs.length;
    const avgZ = puffs.reduce((s, p) => s + p.offset[2], 0) / puffs.length;
    return buildPuffCluster(puffs, [avgX, avgY, avgZ]);
  }, [seed, scale]);

  // Gentle ambient sway via useFrame on the whole bush.
  const groupRef = useRef<Group | null>(null);
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y = swayAngle(clock.elapsedTime, seed + 11, 0.03, 0.45);
    g.rotation.z = swayAngle(clock.elapsedTime, seed + 13, 0.02, 0.6);
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshToonMaterial color={hue} gradientMap={DEFAULT_TOON_GRADIENT} />
        <Outlines color={INK.color} thickness={INK.heavy} />
      </mesh>
    </group>
  );
}
