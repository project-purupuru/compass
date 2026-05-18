/**
 * Grass — cross-fan tufts with volume.
 *
 * Per session 14 (2026-05-16) operator: "grass reads cheap, doesn't match
 * the toon register." Cards-as-flat-planes had nothing for the cel material
 * to wrap around — the bands read as paint stripes. Rebuilt as TUFTS:
 *
 *   - Each tuft = 3 multi-segment blades fanned at 60° intervals from a
 *     shared base (cross/star pattern in 3D)
 *   - Volume in 3D → cel toon bands wrap around each tuft = real cel read
 *   - Fewer tufts than the old card count (each is much more visible)
 *   - Keep BoTW up-normals + per-vertex base→tip color gradient
 *
 * The merged geometry stays a single mesh per field (one draw call) —
 * the volume comes from intra-tuft blade angles, not from per-blade meshes.
 */

"use client";

import { useMemo } from "react";

import { DoubleSide } from "three";

import { buildGrassTufts, type GrassTuftSpec } from "../authoredNormals";
import { mulberry32 } from "../../world/Foliage";
import { PALETTE } from "../../world/palette";
import { DEFAULT_TOON_GRADIENT } from "../celShading";

interface GrassFieldProps {
  /** Centre of the grass patch (world space). */
  readonly center?: readonly [number, number, number];
  /** Radius of the scatter. */
  readonly radius?: number;
  /** Number of tufts (3 blades each — total blade count = count * 3). */
  readonly count?: number;
  /** Tuft height (world units). */
  readonly height?: number;
  /** Random seed — re-bumping reseeds the layout. */
  readonly seed?: number;
}

export function GrassField({
  center = [0, 0, 0],
  radius = 1.6,
  count = 30,
  height = 0.45,
  seed = 0x6ea55,
}: GrassFieldProps) {
  const geometry = useMemo(() => {
    const rand = mulberry32(seed);
    const tufts: GrassTuftSpec[] = [];
    for (let i = 0; i < count; i++) {
      // Polar scatter (even-ish density via sqrt(rand) on radius).
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * radius;
      const x = center[0] + Math.cos(a) * r;
      const z = center[2] + Math.sin(a) * r;
      const h = height * (0.75 + rand() * 0.5); // 0.75..1.25 * height
      const w = h * (0.18 + rand() * 0.08);     // narrow blades
      tufts.push({
        position: [x, center[1], z],
        rotationY: rand() * Math.PI,
        height: h,
        width: w,
        seed: seed + i * 101,
      });
    }
    return buildGrassTufts(tufts);
  }, [center, radius, count, height, seed]);

  // Base hue picked from grass palette (slight per-field variance).
  const baseHue = useMemo(() => {
    const rand = mulberry32(seed + 1);
    const choices = [PALETTE.grass, PALETTE.grassLight, PALETTE.grassDark];
    return choices[Math.floor(rand() * choices.length)];
  }, [seed]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshToonMaterial
        color={baseHue}
        gradientMap={DEFAULT_TOON_GRADIENT}
        side={DoubleSide}
        vertexColors
      />
    </mesh>
  );
}
