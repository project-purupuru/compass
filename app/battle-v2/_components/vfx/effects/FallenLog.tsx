/**
 * FallenLog — horizontal mossy log. Ambient stone/forest-floor accent.
 *
 * Per session 14 (2026-05-16). Cylinder laid on its side + 2-3 moss tufts
 * scattered along the top. Trunk hue from PALETTE.trunk; moss tufts use
 * flavor "moss" for the cooler darker green.
 */

"use client";

import { useMemo } from "react";

import { Outlines } from "@react-three/drei";

import { mulberry32 } from "../../world/Foliage";
import { PALETTE } from "../../world/palette";
import { DEFAULT_TOON_GRADIENT, INK, pickFlavorHue } from "../celVocab";
import { LeafPuff } from "./LeafPuff";

interface MossSpec {
  readonly offset: readonly [number, number, number];
  readonly radius: number;
}

function buildMoss(seed: number, scale: number, length: number): MossSpec[] {
  const rand = mulberry32(seed);
  const count = 2 + Math.floor(rand() * 2);
  const out: MossSpec[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count; // distribute along the log
    out.push({
      offset: [(t - 0.5) * length, scale * 0.45, (rand() - 0.5) * scale * 0.2],
      radius: scale * (0.16 + rand() * 0.08),
    });
  }
  return out;
}

interface FallenLogProps {
  readonly position?: readonly [number, number, number];
  readonly scale?: number;
  readonly seed?: number;
  /** Rotation around Y axis (radians) — which way the log lies. */
  readonly facing?: number;
}

export function FallenLog({
  position = [0, 0, 0],
  scale = 0.6,
  seed = 0x106,
  facing = 0,
}: FallenLogProps) {
  const length = scale * 2.5;
  const radius = scale * 0.35;
  const moss = useMemo(() => buildMoss(seed + 3, scale, length), [seed, scale, length]);
  const mossHue = pickFlavorHue("moss", seed);

  return (
    <group position={position} rotation={[0, facing, 0]}>
      {/* Log — cylinder rotated so its long axis runs along world X. */}
      <mesh
        position={[0, radius, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[radius, radius, length, 8]} />
        <meshToonMaterial
          color={PALETTE.trunk}
          gradientMap={DEFAULT_TOON_GRADIENT}
        />
        <Outlines color={INK.color} thickness={INK.heavy} />
      </mesh>

      {/* Moss tufts scattered along the top. */}
      {moss.map((m, i) => (
        <LeafPuff
          key={i}
          position={m.offset}
          color={mossHue}
          radius={m.radius}
          inkThickness={INK.fine}
          swaySeed={seed + i * 13}
          swayAmplitude={0.03}
          swayFrequency={0.4}
          flavor="moss"
        />
      ))}
    </group>
  );
}
