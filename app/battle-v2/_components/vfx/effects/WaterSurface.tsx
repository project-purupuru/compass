/**
 * WaterSurface — cel-shaded animated water for a hex plot.
 *
 * Per session 14 (2026-05-16) operator: "refine the water surface." The
 * old water cap was a flat extruded hex disc — read as a foam-ringed
 * solid, not as water. This rebuild:
 *
 *   - Subdivided PlaneGeometry (8x8 default) clipped to the hex inradius
 *   - Per-frame vertex Y displacement via crossed sin waves
 *   - Normals recomputed per frame so cel banding shifts with the crests
 *   - Two band toon material (more aggressive separation reads as cel water)
 *
 * The hex perimeter is still covered by the foam ring (rendered by HexPlot
 * around this surface), so the slight rectangular trim of the clipped
 * plane stays hidden.
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  PlaneGeometry,
} from "three";

import { TOON_GRADIENT_TWO_BAND } from "../celShading";
import { swayAngle } from "../celVocab";

/**
 * Build a hex-inradius-clipped subdivided plane.
 *
 *   - PlaneGeometry(planeHalf*2, planeHalf*2, div, div) — covers the FULL
 *     hex with enough overdraw for clean clipping
 *   - Rotated to lay flat on XZ (y up)
 *   - Index buffer filtered: drop triangles whose centroid is outside the
 *     clipRadius. clipRadius should be the PLOT's inradius (NOT the inset
 *     plane size) so the water covers its intended visible area.
 *
 * Per FAGAN review 2026-05-17: previously this function used a single `size`
 * for both the plane half-width AND the clip radius derivation, so passing
 * `size * 0.88` from the caller shrank the water disc to ~76% of intended
 * area, producing "fragmented blue squares" at the perimeter.
 */
function buildHexClippedPlane(
  planeHalf: number,
  clipRadius: number,
  divisions: number = 12,
): BufferGeometry {
  const plane = new PlaneGeometry(planeHalf * 2, planeHalf * 2, divisions, divisions);
  plane.rotateX(-Math.PI / 2);

  const pos = plane.attributes.position as BufferAttribute;
  const idx = plane.index;
  if (!idx) return plane;

  const r2 = clipRadius * clipRadius;
  const kept: number[] = [];
  for (let t = 0; t < idx.count / 3; t++) {
    const i0 = idx.getX(t * 3);
    const i1 = idx.getX(t * 3 + 1);
    const i2 = idx.getX(t * 3 + 2);
    const cx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
    const cz = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3;
    if (cx * cx + cz * cz <= r2) {
      kept.push(i0, i1, i2);
    }
  }
  plane.setIndex(kept);

  // Stash the ORIGINAL flat positions on the geometry as a custom attribute
  // so the per-frame animator can read them without floating-point drift.
  const orig = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    orig[i * 3] = pos.getX(i);
    orig[i * 3 + 1] = pos.getY(i);
    orig[i * 3 + 2] = pos.getZ(i);
  }
  plane.setAttribute("origPosition", new Float32BufferAttribute(orig, 3));
  return plane;
}

interface WaterSurfaceProps {
  /** PLOT hex circumradius (full, not inset). Drives the clip-circle. */
  readonly size: number;
  /**
   * Optional INSET fraction (0..1) applied ONLY to the clip radius — the
   * underlying plane is built large enough to cover the hex with overdraw,
   * but the visible water disc is clipped to this fraction of the hex
   * inradius. Default 0.96 leaves a thin perimeter for the foam ring.
   */
  readonly insetFraction?: number;
  /** Y position (where the water surface sits — usually plot's elevation). */
  readonly y: number;
  /** Toon water hue (from terrain palette). */
  readonly color: string;
  /** Wave amplitude (world units, default tiny). */
  readonly amplitude?: number;
  /** Wave frequency multiplier (default 1.4). */
  readonly frequency?: number;
  /** Seed for wave phase variety per-plot. */
  readonly seed?: number;
}

export function WaterSurface({
  size,
  insetFraction = 0.96,
  y,
  color,
  amplitude = 0.025,
  frequency = 1.4,
  seed = 0x57ea,
}: WaterSurfaceProps) {
  const meshRef = useRef<Mesh | null>(null);
  const geometry = useMemo(() => {
    // Plane covers the full hex (size circumradius); clip uses inradius * inset.
    const inradius = (Math.sqrt(3) / 2) * size;
    return buildHexClippedPlane(size, inradius * insetFraction, 12);
  }, [size, insetFraction]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const pos = mesh.geometry.attributes.position as BufferAttribute;
    const orig = mesh.geometry.attributes.origPosition as BufferAttribute | undefined;
    if (!orig) return;
    const t = clock.elapsedTime;
    // Two crossed wave fields for organic motion.
    const phaseA = swayAngle(t, seed, 1, 0) + t * frequency;
    const phaseB = swayAngle(t, seed + 31, 1, 0) + t * frequency * 0.73;
    for (let i = 0; i < pos.count; i++) {
      const ox = orig.getX(i);
      const oz = orig.getZ(i);
      // Two sin fields at different angles + frequencies = subtle interference.
      const waveA = Math.sin(phaseA + ox * 2.1 + oz * 0.7) * amplitude;
      const waveB = Math.cos(phaseB - ox * 0.9 + oz * 2.4) * amplitude * 0.6;
      pos.setY(i, waveA + waveB);
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, y, 0]}
      receiveShadow={false}
    >
      <meshToonMaterial
        color={color}
        gradientMap={TOON_GRADIENT_TWO_BAND}
      />
    </mesh>
  );
}
