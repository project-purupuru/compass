/**
 * MiniScene — Tree + Grass + Rocks composed in one r3f scene.
 *
 * The visible test surface for dig-session-2026-05-16-T3/T4. Each element
 * carries its canonical authored-normal algorithm:
 *   - Tree    → spherical-pivot canopy (buildPuffCluster) ← existing
 *   - Grass   → all-up normals (BoTW)                     ← buildGrassFieldUpBias
 *   - Rock    → face-flatten + up-bias (Motomura)          ← buildRockGeometry
 *
 * Triggering re-randomizes scatter — operator A/Bs layouts. Tweakpane knobs
 * adjust tree species/scale, grass density/radius/height, rock count + scales.
 * The global Scheimpflug DoF (PostPane) sits on top.
 */

"use client";

import { useMemo } from "react";

import { mulberry32 } from "../../world/Foliage";
import type { MiniSceneConfigT } from "../VfxConfig";
import { GrassField } from "./Grass";
import { Rock } from "./Rock";
import { Tree } from "./Tree";

interface MiniScenePreviewProps {
  readonly config: MiniSceneConfigT;
  /** Bumping reseeds the scatter (rocks reshuffle position + jitter). */
  readonly triggerKey: number;
}

interface RockSpec {
  readonly key: number;
  readonly position: [number, number, number];
  readonly scale: number;
  readonly shape: "boulder" | "slab";
  readonly seed: number;
}

export function MiniScenePreview({
  config,
  triggerKey,
}: MiniScenePreviewProps) {
  // Bump triggerKey contributes to seed so trigger re-rolls layout.
  const effectiveSeed = config.scatterSeed + triggerKey * 7919;

  const rocks = useMemo<RockSpec[]>(() => {
    const rand = mulberry32(effectiveSeed);
    const count = Math.max(0, Math.min(6, Math.round(config.rockCount)));
    const specs: RockSpec[] = [];
    for (let i = 0; i < count; i++) {
      // Scatter outside the tree's footprint, inside the grass radius.
      const a = rand() * Math.PI * 2;
      const r = 0.9 + rand() * (config.grassRadius - 0.3);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const scale =
        config.rockScaleMin +
        rand() * Math.max(0, config.rockScaleMax - config.rockScaleMin);
      specs.push({
        key: i,
        position: [x, 0, z],
        scale,
        shape: rand() > 0.7 ? "slab" : "boulder",
        seed: effectiveSeed + i * 131,
      });
    }
    return specs;
  }, [
    effectiveSeed,
    config.rockCount,
    config.grassRadius,
    config.rockScaleMin,
    config.rockScaleMax,
  ]);

  return (
    <group>
      {/* Grass first (under the tree + rocks). */}
      <GrassField
        center={[0, 0, 0]}
        radius={config.grassRadius}
        count={config.grassCount}
        height={config.grassHeight}
        seed={effectiveSeed + 1}
      />

      {/* Tree at center. */}
      <Tree
        position={[0, 0, 0]}
        flavor={config.treeFlavor}
        scale={config.treeScale}
        seed={effectiveSeed + 2}
      />

      {/* Rocks scattered around. */}
      {rocks.map((r) => (
        <Rock
          key={r.key}
          position={r.position}
          scale={r.scale}
          shape={r.shape}
          seed={r.seed}
          upBias={config.rockUpBias}
        />
      ))}
    </group>
  );
}
