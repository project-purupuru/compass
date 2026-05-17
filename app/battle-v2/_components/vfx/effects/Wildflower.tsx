/**
 * Wildflower — tall thin stem + small bloom puff. Ambient ground accent.
 *
 * Per session 14 (2026-05-16). The smallest cel primitive — a single
 * decorative bloom. Bloom sways more energetically than tree leaves
 * (it's a flower, it's springy). Flavors:
 *   - "sakura" — pink (default)
 *   - "honey"  — warm yellow
 *   - "green"  — green bud
 *   - "autumn" — warm spice
 */

"use client";

import { Outlines } from "@react-three/drei";

import { DEFAULT_TOON_GRADIENT, type Flavor, INK, pickFlavorHue } from "../celVocab";
import { LeafPuff } from "./LeafPuff";

interface WildflowerProps {
  readonly position?: readonly [number, number, number];
  readonly flavor?: Flavor;
  readonly scale?: number;
  readonly seed?: number;
  /**
   * When true, skip rendering the bloom `<LeafPuff>`. Stem still renders.
   * Used by the ECS instanced-leaf path (sprint-2 / HexScene aggregation).
   */
  readonly suppressLeaves?: boolean;
}

export function Wildflower({
  position = [0, 0, 0],
  flavor = "sakura",
  scale = 0.4,
  seed = 0xf10,
  suppressLeaves = false,
}: WildflowerProps) {
  const bloomHue = pickFlavorHue(flavor, seed);
  const stemHeight = scale;
  const stemRadius = scale * 0.04;
  const bloomRadius = scale * 0.18;

  return (
    <group position={position}>
      {/* Stem — thin cylinder, leafy green. */}
      <mesh
        position={[0, stemHeight / 2, 0]}
        castShadow
      >
        <cylinderGeometry args={[stemRadius * 0.7, stemRadius, stemHeight, 5]} />
        <meshToonMaterial
          color="#6b8f4a"
          gradientMap={DEFAULT_TOON_GRADIENT}
        />
        <Outlines color={INK.color} thickness={1} />
      </mesh>

      {/* Bloom — small bright puff at the top, sways with springy energy.
       *  Suppressed when the ECS instanced-leaf path is active. */}
      {!suppressLeaves && (
        <LeafPuff
          position={[0, stemHeight + bloomRadius * 0.5, 0]}
          color={bloomHue}
          radius={bloomRadius}
          inkThickness={INK.fine}
          swaySeed={seed + 11}
          swayAmplitude={0.08}
          swayFrequency={0.7}
          flavor={flavor}
        />
      )}
    </group>
  );
}
