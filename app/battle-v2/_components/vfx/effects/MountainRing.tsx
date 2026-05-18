/**
 * MountainRing — low-poly mountain backdrop encircling a realm.
 *
 * Cheap "memory of a mountain, not the physics of one" perceptual hack:
 *   - A ring of low-poly cone-ish prisms placed at fixed angles around a
 *     center, at radius `outerRadius`
 *   - Each prism uses meshStandardMaterial with cool flat color
 *   - Slight per-peak height jitter (mulberry-seeded) for organic spread
 *   - Heights stay BELOW the horizon-band so they don't crowd close action
 *   - Time-of-day color tinting via prop
 *
 * Composes with scene atmosphere — the mountain silhouette eats some of
 * the sky color via fog, anchoring "land extends out there."
 */

"use client";

import { useMemo } from "react";

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MountainRingProps {
  /** Ring radius (world units). */
  readonly outerRadius?: number;
  /** Peak count around the ring. */
  readonly peakCount?: number;
  /** Base color for the mountains (will be tinted by scene atmosphere). */
  readonly color?: string;
  /** Average peak height (jittered per-peak). */
  readonly peakHeight?: number;
  /** Per-peak base radius (controls "fatness"). */
  readonly peakBase?: number;
  readonly seed?: number;
}

interface Peak {
  x: number;
  z: number;
  height: number;
  base: number;
  rot: number;
}

export function MountainRing({
  outerRadius = 36,
  peakCount = 32,
  color = "#5e6b7e",
  peakHeight = 8.5,
  peakBase = 4.5,
  seed = 0xb01b,
}: MountainRingProps) {
  const peaks = useMemo<readonly Peak[]>(() => {
    const rand = mulberry32(seed);
    const out: Peak[] = [];
    for (let i = 0; i < peakCount; i++) {
      const baseAngle = (i / peakCount) * Math.PI * 2;
      // Per-peak jitter on angle (±5°) so they don't read as a perfect ring.
      const angle = baseAngle + (rand() - 0.5) * 0.18;
      // Radius jitter ±10% so the ring has depth.
      const r = outerRadius * (0.9 + rand() * 0.2);
      out.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        height: peakHeight * (0.55 + rand() * 0.9),
        base: peakBase * (0.7 + rand() * 0.7),
        rot: rand() * Math.PI * 2,
      });
    }
    return out;
  }, [outerRadius, peakCount, peakHeight, peakBase, seed]);

  return (
    <group>
      {peaks.map((p, i) => (
        <mesh
          key={`peak-${i}`}
          position={[p.x, p.height / 2 - 0.4, p.z]}
          rotation={[0, p.rot, 0]}
        >
          {/* 4-segment cone reads as a chunky low-poly peak. */}
          <coneGeometry args={[p.base, p.height, 4]} />
          <meshStandardMaterial color={color} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
