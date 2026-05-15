/**
 * GroveGrowth — the grove thickens when you play a card.
 *
 * Per build doc Session 12 (D1). Tree count is `f(activationLevel)` — the
 * grove remembers what the cards did via the substrate. The trees `[0, count)`
 * stand; the rest of the pool waits.
 *
 * The felt moment: on the `impact_seedling` beat (the petals landing — THE
 * moment of the ritual), the trees the latest card just earned SPRING UP from
 * the ground, scale 0→1 with a green-stretch overshoot. You played the card;
 * the forest is visibly bigger because of it.
 *
 * Trees are individual groups (not instanced) because each grows on its own
 * spring — the pool ceiling (28) keeps that cheap. Positions come from
 * `groveLayout` so the bears (BearColony) chop the exact trees you see.
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import type { Vec2 } from "./agents/steering";
import { buildPuffCluster } from "./clusterGeometry";
import { mulberry32 } from "./Foliage";
import { buildGroveTrees, groveTreeCount, type GroveTree } from "./groveLayout";
import { groundHeight } from "./MapGround";
import { PALETTE } from "./palette";
import { type Spring, stepSpring } from "../vfx/springs";

/** A tree pushes up out of the ground and settles with a small green stretch. */
const SPRING_GROW: Spring = { mass: 0.8, stiffness: 90, damping: 13 };

/** Per-tree stagger so a 3-tree growth ripples in instead of popping at once. */
const STAGGER_MS = 130;

interface GroveGrowthProps {
  /** Read from `state.zones.wood_grove.activationLevel`. */
  readonly activationLevel: number;
  /** Grove centre — the tree pool scatters around this. */
  readonly grove: Vec2;
  /** The beat wire — `impact_seedling` triggers the spring-in. */
  readonly activeBeat: BeatFireRecord | null;
}

interface TreeVisual {
  readonly tree: GroveTree;
  readonly scale: number;
  readonly hue: string;
}

// One canopy geometry shared by every tree — two icosphere blobs MERGED with
// spherical-pivot normals from the canopy centroid. Per the painterly-cluster
// dig: the leaf-mass reads as ONE volume, not two lumps stuck together.
// Smooth-shaded; faceted silhouette comes from the low subdivision count.
const UNIT_CANOPY_GEO = buildPuffCluster(
  [
    { offset: [0, 1.05, 0], radius: 0.92, detail: 1 },
    { offset: [0.22, 1.55, 0.14], radius: 0.58, detail: 1 },
  ],
  // Pivot at the canopy's centre of mass — normals radiate outward from here.
  [0.05, 1.25, 0.03],
);

export function GroveGrowth({ activationLevel, grove, activeBeat }: GroveGrowthProps) {
  // The full candidate pool — generated once, sliced by activation level.
  const pool = useMemo<TreeVisual[]>(() => {
    const trees = buildGroveTrees(grove);
    return trees.map((tree) => {
      const rand = mulberry32(tree.seed);
      return {
        tree,
        scale: 0.7 + rand() * 0.7,
        hue: PALETTE.canopyGreen[Math.floor(rand() * PALETTE.canopyGreen.length)],
      };
    });
  }, [grove]);

  const targetCount = groveTreeCount(activationLevel);

  // Per-tree grow spring + its target. A tree is "grown" when target = 1.
  const grow = useRef<{ value: number; velocity: number }[]>([]);
  const growTarget = useRef<number[]>([]);
  const pendingDelay = useRef<number[]>([]); // ms until this tree starts growing
  const groupRefs = useRef<(Group | null)[]>([]);

  // First mount: the trees the current level already earned are simply THERE
  // (the grove exists). Only growth from here on animates.
  const initialized = useRef(false);
  if (!initialized.current) {
    for (let i = 0; i < pool.length; i++) {
      const grown = i < targetCount;
      grow.current[i] = { value: grown ? 1 : 0, velocity: 0 };
      growTarget.current[i] = grown ? 1 : 0;
      pendingDelay.current[i] = 0;
    }
    initialized.current = true;
  }

  // The beat wire: `impact_seedling` lands → any tree now within the activation
  // count but not yet growing gets scheduled in, staggered by index.
  useEffect(() => {
    if (activeBeat?.beatId !== "impact_seedling") return;
    let staggerStep = 0;
    for (let i = 0; i < pool.length; i++) {
      if (i < targetCount && growTarget.current[i] === 0) {
        growTarget.current[i] = 1;
        pendingDelay.current[i] = staggerStep * STAGGER_MS;
        staggerStep++;
      }
    }
  }, [activeBeat, targetCount, pool.length]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    for (let i = 0; i < pool.length; i++) {
      // Honour the per-tree stagger before the spring starts pulling.
      if (pendingDelay.current[i] > 0) {
        pendingDelay.current[i] -= dt * 1000;
        continue;
      }
      const s = grow.current[i];
      const target = growTarget.current[i];
      if (target === 0 && s.value === 0) continue; // dormant pool tree — skip
      stepSpring(s, target, SPRING_GROW, dt);
      const g = groupRefs.current[i];
      if (g) {
        const v = Math.max(0, s.value);
        g.scale.set(v, v, v);
        g.visible = v > 0.001;
      }
    }
  });

  const groundY = groundHeight();

  return (
    <group>
      {pool.map((tv, i) => {
        const s = tv.scale;
        return (
          <group
            key={tv.tree.index}
            ref={(el) => void (groupRefs.current[i] = el)}
            position={[tv.tree.pos.x, groundY, tv.tree.pos.z]}
            visible={grow.current[i]?.value > 0.001}
          >
            {/* trunk — base sits on the ground so the tree grows UP from y=0 */}
            <mesh position={[0, 0.5 * s, 0]} scale={[s, s, s]} castShadow receiveShadow>
              <cylinderGeometry args={[0.11, 0.17, 1, 6]} />
              <meshStandardMaterial color={PALETTE.trunk} roughness={1} />
            </mesh>
            {/* canopy — ONE merged cluster, spherical-pivot normals: light
                wraps both blobs as a single leafy mass instead of shading
                them as separate lumps. Smooth shading is REQUIRED for the
                trick to work; the low-poly icosphere subdivision gives the
                faceted silhouette without breaking the unified read. */}
            <mesh
              geometry={UNIT_CANOPY_GEO}
              scale={s}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={tv.hue} roughness={0.95} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
