/**
 * LeafPuff — shared composable leaf cluster.
 *
 * Per session 14 (2026-05-16) — extracted from Tree + Bush after operator's
 * "systemize underlying" instruction. The same 1-2 icosphere + outline
 * unit is the visual atom for:
 *
 *   - Tree branch tips
 *   - Bush cluster puffs
 *   - Wildflower bloom heads
 *   - Mushroom caps (with custom flavor)
 *   - Moss tufts on rocks (flavor: "moss")
 *
 * Optional sway: if `swayPhaseSeed` is set, the puff rotates gently around
 * Y via useFrame. Per-puff phase keeps a field from swaying in unison.
 */

"use client";

import { useRef } from "react";

import { Outlines } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import { INK, DEFAULT_TOON_GRADIENT, swayAngle, type Flavor } from "../celVocab";

interface LeafPuffProps {
  readonly position?: readonly [number, number, number];
  /** Color for the puff. Caller resolves via pickFlavorHue or similar. */
  readonly color: string;
  /** Radius of the primary puff. */
  readonly radius: number;
  /** Optional secondary puff for silhouette variety (offset + smaller). */
  readonly secondary?: {
    readonly offset: readonly [number, number, number];
    readonly scale: number;
  };
  /** Ink line thickness. Defaults to INK.mid. */
  readonly inkThickness?: number;
  /** Geometry detail: 0 = sharp (8 faces), 1 = softer (20 faces). */
  readonly detail?: 0 | 1;
  /** If set, enables useFrame sway with this seed (sway frequency in Hz). */
  readonly swaySeed?: number;
  /** Sway amplitude in radians (default ~3°). */
  readonly swayAmplitude?: number;
  /** Sway frequency Hz (default 0.5). */
  readonly swayFrequency?: number;
  /** Optional unused param hook for the `flavor` if caller wants record. */
  readonly flavor?: Flavor;
}

export function LeafPuff({
  position = [0, 0, 0],
  color,
  radius,
  secondary,
  inkThickness = INK.mid,
  detail = 0,
  swaySeed,
  swayAmplitude = 0.05,
  swayFrequency = 0.5,
}: LeafPuffProps) {
  const groupRef = useRef<Group | null>(null);

  useFrame(({ clock }) => {
    if (swaySeed == null) return;
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y =
      swayAngle(clock.elapsedTime, swaySeed, swayAmplitude, swayFrequency);
    // Also a tiny pitch tilt for organic feel — half amplitude, double frequency.
    g.rotation.z =
      swayAngle(clock.elapsedTime, swaySeed + 7, swayAmplitude * 0.5, swayFrequency * 1.3);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Primary puff. */}
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[radius, detail]} />
        <meshToonMaterial color={color} gradientMap={DEFAULT_TOON_GRADIENT} />
        <Outlines color={INK.color} thickness={inkThickness} />
      </mesh>

      {/* Optional secondary puff for silhouette interest. */}
      {secondary && (
        <mesh
          position={secondary.offset}
          scale={secondary.scale}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[radius, detail]} />
          <meshToonMaterial color={color} gradientMap={DEFAULT_TOON_GRADIENT} />
          <Outlines color={INK.color} thickness={Math.max(1, inkThickness - 1)} />
        </mesh>
      )}
    </group>
  );
}
