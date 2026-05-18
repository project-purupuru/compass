/**
 * Rock — faceted boulder with Motomura face-flatten authored normals.
 *
 * Per dig T3: face-flatten + up-bias produces "broad clean shadow blobs"
 * (anti-Lambertian) — the GG Xrd "anti-photon" recipe ported to r3f. Three
 * shape variants now ship:
 *
 *   - boulder → icosphere subdivision 1, jittered. Default.
 *   - slab    → flatter rectangular block.
 *   - pebble  → tiny, flatter, very low silhouette — used for clusters.
 *
 * Optional moss tuft on top (~20% chance by default) — small LeafPuff with
 * flavor "moss" that sways gently. Adds organic life without breaking the
 * stone-cold read.
 */

"use client";

import { useMemo } from "react";

import { Outlines } from "@react-three/drei";

import { buildRockGeometry } from "../authoredNormals";
import { mulberry32 } from "../../world/Foliage";
import { PALETTE } from "../../world/palette";
import { DEFAULT_TOON_GRADIENT, INK, pickFlavorHue } from "../celVocab";
import { LeafPuff } from "./LeafPuff";

export type RockShape = "boulder" | "slab" | "pebble";

interface RockProps {
  readonly position?: readonly [number, number, number];
  readonly scale?: number;
  readonly shape?: RockShape;
  readonly seed?: number;
  readonly upBias?: number;
  /** Force moss-tuft on or off; default = seeded ~25% chance. */
  readonly moss?: boolean;
  /**
   * When true, skip rendering the moss `<LeafPuff>` even if showMoss is true.
   * Rock geometry + chunks still render. Used by the ECS instanced-leaf path
   * (sprint-2 / HexScene aggregation) — the moss tuft is collected into the
   * single `<InstancedLeafField>` along with all other hex-plot leaves.
   */
  readonly suppressLeaves?: boolean;
}

export function Rock({
  position = [0, 0, 0],
  scale = 0.5,
  shape = "boulder",
  seed = 0x70cc,
  upBias = 0.18,
  moss,
  suppressLeaves = false,
}: RockProps) {
  const isPebble = shape === "pebble";
  const isSlab = shape === "slab";
  const effectiveScale = isPebble ? scale * 0.45 : scale;

  // Primary rock geometry.
  const geometry = useMemo(
    () =>
      buildRockGeometry({
        shape: "boulder",
        seed,
        upBias,
        jitter: isPebble ? 0.1 : 0.18,
      }),
    [seed, upBias, isPebble],
  );

  // Subordinate chunks — 1-2 small companions attached to most boulders/slabs
  // for silhouette interest (the rock reads as a CLUSTER, not a single object).
  const showChunks = !isPebble;
  const chunkCount = useMemo(() => {
    if (!showChunks) return 0;
    const rand = mulberry32(seed + 222);
    return 1 + Math.floor(rand() * 2); // 1 or 2 chunks
  }, [showChunks, seed]);

  const chunks = useMemo(() => {
    const rand = mulberry32(seed + 4444);
    return Array.from({ length: chunkCount }, (_, idx) => {
      const angle = rand() * Math.PI * 2;
      const dist = effectiveScale * (0.55 + rand() * 0.25);
      // Chunks are noticeably smaller than the primary — cluster reads as
      // ONE main rock with companions, not two rocks of equal weight.
      const chunkScale = effectiveScale * (0.22 + rand() * 0.18);
      return {
        geometry: buildRockGeometry({
          shape: "boulder",
          seed: seed + 9999 + idx * 7777,
          upBias: 0.12,
          jitter: 0.16,
        }),
        position: [Math.cos(angle) * dist, chunkScale * 0.3, Math.sin(angle) * dist] as [
          number,
          number,
          number,
        ],
        scale: chunkScale,
        seed: seed + 333 * (idx + 1),
      };
    });
  }, [chunkCount, effectiveScale, seed]);

  // Per-rock hue.
  const hue = useMemo(() => {
    const rand = mulberry32(seed + 2);
    if (rand() < 0.2) {
      return PALETTE.stoneLichen[Math.floor(rand() * PALETTE.stoneLichen.length)];
    }
    return PALETTE.stone[Math.floor(rand() * PALETTE.stone.length)];
  }, [seed]);

  // Slight hue shift on the chunk so the cluster reads as TWO stones, not one.
  const chunkHue = useMemo(() => {
    const rand = mulberry32(seed + 333);
    const altStones = PALETTE.stone.filter((s) => s !== hue);
    return altStones[Math.floor(rand() * altStones.length)] ?? hue;
  }, [seed, hue]);

  const showMoss = useMemo(() => {
    if (moss !== undefined) return moss;
    if (isPebble) return false;
    const rand = mulberry32(seed + 17);
    return rand() < 0.32;
  }, [moss, seed, isPebble]);

  const mossHue = useMemo(() => pickFlavorHue("moss", seed + 31), [seed]);

  const yOffset = effectiveScale * (isPebble ? 0.18 : isSlab ? 0.22 : 0.4);

  // Slab squash: flatter vertical scale, wider horizontal.
  const primaryScale: [number, number, number] = isPebble
    ? [effectiveScale, effectiveScale * 0.4, effectiveScale]
    : isSlab
      ? [effectiveScale * 1.25, effectiveScale * 0.55, effectiveScale * 1.15]
      : [effectiveScale, effectiveScale, effectiveScale];

  return (
    <group position={[position[0], position[1] + yOffset, position[2]]}>
      {/* Primary rock. */}
      <mesh geometry={geometry} scale={primaryScale} castShadow receiveShadow>
        <meshToonMaterial color={hue} gradientMap={DEFAULT_TOON_GRADIENT} />
        <Outlines color={INK.color} thickness={isPebble ? INK.fine : INK.heavy} />
      </mesh>

      {/* Subordinate chunks — adds cluster silhouette. */}
      {chunks.map((chunk, idx) => (
        <mesh
          key={idx}
          geometry={chunk.geometry}
          position={chunk.position}
          scale={chunk.scale}
          castShadow
          receiveShadow
        >
          <meshToonMaterial color={chunkHue} gradientMap={DEFAULT_TOON_GRADIENT} />
          <Outlines color={INK.color} thickness={INK.mid} />
        </mesh>
      ))}

      {/* Moss tuft on top — cel-shaded green LeafPuff. Larger + more
       *  visible than the previous tiny patch; uses a secondary puff for
       *  cluster shape. Suppressed when the ECS instanced-leaf path is
       *  active (the moss tuft gets aggregated into InstancedLeafField). */}
      {showMoss && !suppressLeaves && (
        <LeafPuff
          position={[
            effectiveScale * 0.12,
            isSlab ? effectiveScale * 0.5 : effectiveScale * 0.92,
            effectiveScale * 0.06,
          ]}
          color={mossHue}
          radius={effectiveScale * 0.45}
          secondary={{
            offset: [effectiveScale * 0.25, effectiveScale * 0.1, effectiveScale * -0.15],
            scale: 0.7,
          }}
          inkThickness={INK.mid}
          detail={0}
          swaySeed={seed + 47}
          swayAmplitude={0.03}
          swayFrequency={0.4}
          flavor="moss"
        />
      )}
    </group>
  );
}
