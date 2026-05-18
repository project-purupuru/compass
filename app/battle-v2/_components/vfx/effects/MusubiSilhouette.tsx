/**
 * MusubiSilhouette — distant landmark for the realm scene.
 *
 * Per codex `loc-musubi-station`: "Horai's central hub. Ancient timber
 * framework meets glass and steel canopies. Dozens of platforms across
 * multiple levels. The deepest levels brush against Old Horai."
 *
 * Visual stand-in: a chunky low-poly tower silhouette — main mass +
 * stepped levels + a small spire on top. NOT a faithful model; reads as
 * "tall thing in the distance" the eye anchors to. Honors operator
 * memory `[[project_art-direction-north-star]]` — perceptual affect, not
 * physics.
 *
 * Positioned at the operator-pinned `position` (typically north-back in
 * world space). Color tints by atmosphere — material picks up scene fog.
 */

"use client";

export interface MusubiSilhouetteProps {
  readonly position?: readonly [number, number, number];
  readonly color?: string;
  readonly scale?: number;
}

export function MusubiSilhouette({
  position = [0, 0, -28],
  color = "#3e3a44",
  scale = 1,
}: MusubiSilhouetteProps) {
  return (
    <group position={position} scale={scale}>
      {/* Base footprint — a wide low platform. */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[6, 1.2, 4.5]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      {/* Lower hall — wider, two-story massing. */}
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[5.2, 2.4, 3.8]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      {/* Mid section — narrowed. */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[3.8, 2.8, 2.8]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      {/* Upper hall — narrower still, the "tower" proper. */}
      <mesh position={[0, 7.8, 0]}>
        <boxGeometry args={[2.6, 2.6, 2.0]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      {/* Peaked roof — pyramid cap, the "ancient timber framework" tell. */}
      <mesh position={[0, 9.7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.9, 1.8, 4]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      {/* Small spire / chime-bell tower on top. */}
      <mesh position={[0, 11.2, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 1.0, 6]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 11.95, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.4, 0.6, 4]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      {/* Two flanking platform wings — visually anchor the "station" read. */}
      <mesh position={[-3.6, 0.35, 0]}>
        <boxGeometry args={[2.0, 0.7, 4.0]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      <mesh position={[3.6, 0.35, 0]}>
        <boxGeometry args={[2.0, 0.7, 4.0]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
    </group>
  );
}
