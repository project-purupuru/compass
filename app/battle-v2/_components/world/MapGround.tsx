/**
 * MapGround — the Tsuheji continent, floating in its sea.
 *
 * Per build doc Session 10. Operator: "the floor is all green, I can no
 * longer see the map." `tsuheji-map.png` is the canonical continent SHAPE — a
 * landmass silhouette on transparent (the same asset world-purupuru's rooms
 * index uses). Rendered naively it was a black-surrounded blob; rendered right
 * it's a continent you can read:
 *
 *   - a calm SEA plane (wide, soft blue) — the world has edges now
 *   - the CONTINENT plane on top — `alphaTest` discards the transparent
 *     surround cleanly, so the canonical landmass shape floats in the sea
 *
 * The texture's UVs align with `zones.ts` `pctToWorld` by construction:
 * canonical 50% = plane centre = texture centre. A district's canonical
 * position lands on the matching pixel of the painted landmass.
 *
 * `groundHeight()` stays a function (foliage + structures plant on it) — the
 * continent is flat, so it returns 0.
 *
 * Must render inside the Canvas's <Suspense> (useTexture suspends).
 */

"use client";

import { useTexture } from "@react-three/drei";
import { SRGBColorSpace } from "three";

import { PALETTE } from "./palette";
import { MAP_SIZE } from "./zones";

/** Ground height anywhere on the flat continent. */
export function groundHeight(): number {
  return 0;
}

export function MapGround() {
  const map = useTexture("/art/tsuheji-map.png");
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;

  return (
    <group name="map-ground">
      {/* The sea — a wide calm plane the continent floats in. */}
      <mesh
        name="map-ground.sea-plane"
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
      >
        <planeGeometry args={[MAP_SIZE * 2.6, MAP_SIZE * 2.6]} />
        <meshStandardMaterial color={PALETTE.sea} roughness={0.55} metalness={0.04} />
      </mesh>
      {/* The Tsuheji continent — canonical landmass shape. alphaTest discards
          the transparent surround so the sea reads cleanly underneath. */}
      <mesh
        name="map-ground.continent-plane"
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
        <meshStandardMaterial
          map={map}
          transparent
          alphaTest={0.5}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
