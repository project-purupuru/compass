/**
 * Mushroom — thin stem + flat cap. Small ambient ground accent.
 *
 * Per session 14 (2026-05-16). Same cel + ink vocabulary. Cap rotates very
 * gently via LeafPuff sway. Flavors:
 *   - default "honey" — warm yellow cap (default)
 *   - "sakura" — rare pink (legendary patches)
 *   - "moss" — dark olive cap (forest floor)
 */

"use client";

import { Outlines } from "@react-three/drei";

import { PALETTE } from "../../world/palette";
import { DEFAULT_TOON_GRADIENT, type Flavor, INK, pickFlavorHue } from "../celVocab";
import { LeafPuff } from "./LeafPuff";

interface MushroomProps {
  readonly position?: readonly [number, number, number];
  readonly flavor?: Flavor;
  readonly scale?: number;
  readonly seed?: number;
  /**
   * When true, skip rendering the cap `<LeafPuff>`. Stem still renders.
   * Used by the ECS instanced-leaf path (sprint-2 / HexScene aggregation).
   */
  readonly suppressLeaves?: boolean;
}

export function Mushroom({
  position = [0, 0, 0],
  flavor = "honey",
  scale = 0.25,
  seed = 0x7777,
  suppressLeaves = false,
}: MushroomProps) {
  const capHue = pickFlavorHue(flavor, seed);
  const stemHeight = scale * 1.1;
  const stemRadius = scale * 0.14;
  const capRadius = scale * 0.42;

  return (
    <group position={position}>
      {/* Stem — short tapered cylinder, off-white. */}
      <mesh
        position={[0, stemHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[stemRadius * 0.85, stemRadius, stemHeight, 6]} />
        <meshToonMaterial
          color={PALETTE.parchment}
          gradientMap={DEFAULT_TOON_GRADIENT}
        />
        <Outlines color={INK.color} thickness={INK.fine} />
      </mesh>

      {/* Cap — slightly flattened puff using LeafPuff for ink + sway.
       *  Suppressed when the ECS instanced-leaf path is active. */}
      {!suppressLeaves && (
        <group position={[0, stemHeight, 0]} scale={[1, 0.6, 1]}>
          <LeafPuff
            color={capHue}
            radius={capRadius}
            inkThickness={INK.mid}
            detail={1}
            swaySeed={seed + 5}
            swayAmplitude={0.025}
            swayFrequency={0.3}
            flavor={flavor}
          />
        </group>
      )}
    </group>
  );
}
