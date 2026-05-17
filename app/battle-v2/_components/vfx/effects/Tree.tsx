/**
 * Tree — Purupuru tree with branching silhouette + leaves at branch tips.
 *
 * Per session 14 (2026-05-16). Tapered trunk + 3-5 angled branches with
 * SMALL leaf clusters at each branch tip (silhouette gaps so bear/NPC
 * characters stay visible through the tree). Sakura flavor reserved per
 * codex (legendary moments only).
 *
 * Uses the shared celVocab + LeafPuff substrate for ink/color/sway. Leaf
 * clusters sway gently via useFrame (Genshin/BoTW-style ambient life).
 */

"use client";

import { useMemo } from "react";

import { Outlines } from "@react-three/drei";

import { mulberry32 } from "../../world/Foliage";
import { PALETTE } from "../../world/palette";
import {
  DEFAULT_TOON_GRADIENT,
  INK,
  type Flavor,
  pickFlavorHue,
} from "../celVocab";
import { LeafPuff } from "./LeafPuff";

// ── Branch generation ──────────────────────────────────────────────────────

export interface BranchSpec {
  readonly yaw: number;
  readonly pitch: number;
  readonly length: number;
  readonly thickness: number;
  readonly leafSize: number;
  readonly leafOffset: readonly [number, number, number];
}

export function buildBranches(seed: number, count: number): BranchSpec[] {
  const rand = mulberry32(seed);
  const out: BranchSpec[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      yaw: (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.55,
      pitch: Math.PI / 5 + rand() * Math.PI / 4,
      length: 0.42 + rand() * 0.28,
      thickness: 0.035 + rand() * 0.022,
      leafSize: 0.18 + rand() * 0.1,
      leafOffset: [
        (rand() - 0.5) * 0.18,
        (rand() - 0.5) * 0.1,
        (rand() - 0.5) * 0.18,
      ],
    });
  }
  return out;
}

// ── Tree renderer ──────────────────────────────────────────────────────────

interface TreeProps {
  readonly position?: readonly [number, number, number];
  readonly flavor?: Flavor;
  readonly scale?: number;
  readonly seed?: number;
  readonly branchCount?: number;
  /**
   * When true, skip rendering `<LeafPuff>` at each branch tip. Trunk and
   * branches still render. Used by the ECS instanced-leaf path (cycle
   * engine-substrate-2026-05-17 / sprint-2): HexScene aggregates all
   * fixture leaves into one `<InstancedLeafField>` when
   * `useInstancedLeaves` is ON, and tells each Tree to suppress its own
   * leaves so they're not drawn twice.
   */
  readonly suppressLeaves?: boolean;
}

export function Tree({
  position = [0, 0, 0],
  flavor = "green",
  scale = 1.2,
  seed = 0x71ee,
  branchCount = 4,
  suppressLeaves = false,
}: TreeProps) {
  const leafHue = useMemo(() => pickFlavorHue(flavor, seed), [flavor, seed]);
  const branches = useMemo(
    () => buildBranches(seed + 7, branchCount),
    [seed, branchCount],
  );

  const trunkHeight = scale * 1.05;
  const trunkBaseRadius = 0.13;
  const trunkTopRadius = 0.075;
  const branchOriginY = trunkHeight * 0.7;

  return (
    <group position={position}>
      {/* Trunk — tapered, slightly stout at base. */}
      <mesh
        position={[0, trunkHeight / 2, 0]}
        scale={[scale, 1, scale]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[trunkTopRadius, trunkBaseRadius, trunkHeight, 7]}
        />
        <meshToonMaterial color={PALETTE.trunk} gradientMap={DEFAULT_TOON_GRADIENT} />
        <Outlines color={INK.color} thickness={INK.heavy} />
      </mesh>

      {branches.map((b, i) => {
        const blen = b.length * scale;
        const bthick = b.thickness * scale;
        const leafR = b.leafSize * scale;
        return (
          <group
            key={i}
            position={[0, branchOriginY, 0]}
            rotation={[0, b.yaw, 0]}
          >
            <group rotation={[0, 0, -b.pitch]}>
              {/* Branch cylinder — base at group origin, tip at (0, blen, 0). */}
              <mesh position={[0, blen / 2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[bthick * 0.55, bthick, blen, 5]} />
                <meshToonMaterial
                  color={PALETTE.trunk}
                  gradientMap={DEFAULT_TOON_GRADIENT}
                />
                <Outlines color={INK.color} thickness={INK.mid} />
              </mesh>

              {/* Leaf cluster at tip — sways with per-branch seed.
               *  Suppressed when the ECS instanced-leaf path is active
               *  (HexScene aggregates leaves into one InstancedLeafField). */}
              {!suppressLeaves && (
                <LeafPuff
                  position={[0, blen + leafR * 0.6, 0]}
                  color={leafHue}
                  radius={leafR}
                  secondary={{
                    offset: [
                      b.leafOffset[0] * scale,
                      b.leafOffset[1] * scale,
                      b.leafOffset[2] * scale,
                    ],
                    scale: 0.7,
                  }}
                  inkThickness={INK.heavy}
                  swaySeed={seed + i * 31}
                  swayAmplitude={0.06}
                  swayFrequency={0.45}
                  flavor={flavor}
                />
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}
