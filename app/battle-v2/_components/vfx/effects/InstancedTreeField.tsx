/**
 * InstancedTreeField — renders ALL hex-scene trees through TWO InstancedMesh
 * layers (trunks + branches), driven by TWO Float32 archetype tables.
 *
 * Cycle-3 fixture-ecs-instancing-2026-05-17 / sprint-1-fixture / S1-T3.
 * The first non-leaf cycle-3 archetype renderer; sets the pattern that
 * Bush / Rock / Mushroom / Wildflower (S2-T1..T4) will follow.
 *
 * Wiring:
 *   BigRealmScene.tsx
 *     ↓ gathers per-tree data from plots
 *   treeSpecsFromPlots(plots, worldPositions)        // fixtureExtractors.ts
 *     ↓ produces { trunks: TreeTrunkSpec[], branches: TreeBranchSpec[] }
 *   <InstancedTreeField specs={...} />
 *     ↓ allocates TreeTrunkArchetype + TreeBranchArchetype (lib/engine)
 *     ↓ composes per-instance matrix per row (useEffect, no useFrame)
 *     ↓ renders 2 InstancedMesh with drei <Outlines> children
 *   HexPlot receives suppressFixtures={Set(["tree"])} and skips its <Tree>
 *   JSX dispatch — no duplicate rendering.
 *
 * Material + outline pattern (per SDD §8.3, codex flatline a7a6d61722ba465c8):
 *   - meshToonMaterial WITHOUT vertexColors prop. All trees share PALETTE.trunk.
 *     No per-instance color → no USE_COLOR define → no `vColor.rgb *= color`
 *     in the shader → no baked color attribute needed on the geometry.
 *   - drei <Outlines> as JSX child of each <instancedMesh>. drei 10.7.7's
 *     Outlines.js has an `isInstancedMesh` branch that creates a sibling
 *     InstancedMesh sharing the parent's instanceMatrix. Outlines on
 *     instanced trees work out-of-the-box. INK.heavy for trunks (matches
 *     Tree.tsx), INK.mid for branches (matches Tree.tsx).
 *
 * Static archetypes (no useFrame): trees don't sway in the non-instanced
 * path either. Leaves at branch tips sway separately via the cycle-1
 * InstancedLeafField (the leaf path is opt-in via the SAME suppressLeaves
 * mechanism that suppresses Tree-internal LeafPuffs).
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { Outlines } from "@react-three/drei";
import {
  CylinderGeometry,
  type InstancedMesh,
  Matrix4,
} from "three";

import {
  Archetype,
  type EntityId,
  TREE_BRANCH_COLUMN_SPECS,
  type TreeBranchCols,
  TREE_TRUNK_COLUMN_SPECS,
  type TreeTrunkCols,
} from "@/lib/engine";

import { PALETTE } from "../../world/palette";
import { DEFAULT_TOON_GRADIENT, INK } from "../celVocab";

import type { TreeBranchSpec, TreeTrunkSpec, TreeSpecs } from "./fixtureExtractors";

// ── Canonical source geometries (baked at module load) ─────────────────────

/**
 * Trunk canonical geometry: tapered cylinder with the EXACT proportions
 * Tree.tsx uses (trunkTopRadius=0.075, trunkBaseRadius=0.13, height=1.05,
 * 7 radial segments). Origin TRANSLATED to the BASE (default Three.js
 * cylinder has origin at center; we shift up by height/2 so per-instance
 * matrices can place base directly at tree fixture position).
 *
 * Per-instance scale (s, s, s) produces final dimensions:
 *   top radius   = 0.075 * s
 *   base radius  = 0.13 * s
 *   height       = 1.05 * s
 *
 * Matches Tree.tsx's `trunkHeight = scale * 1.05; <mesh scale={[scale, 1, scale]}>`
 * — Tree.tsx scales XZ by scale and keeps Y at 1 because trunkHeight is already
 * scaled into the geometry args. Instancing collapses that into one
 * uniform-scale per instance.
 */
const TRUNK_GEOMETRY_CACHE: CylinderGeometry = (() => {
  const geo = new CylinderGeometry(0.075, 0.13, 1.05, 7);
  geo.translate(0, 0.525, 0); // shift origin from center to base (height / 2)
  return geo;
})();

/**
 * Branch canonical geometry: unit cylinder (top=0.55, base=1, height=1, 5
 * radial segments). Origin at BASE. Per-instance scale (thickness, length,
 * thickness) produces:
 *   top radius  = 0.55 * thickness
 *   base radius = 1 * thickness = thickness
 *   height      = length
 * Matches Tree.tsx's `cylinderGeometry args={[bthick * 0.55, bthick, blen, 5]}`.
 */
const BRANCH_GEOMETRY_CACHE: CylinderGeometry = (() => {
  const geo = new CylinderGeometry(0.55, 1, 1, 5);
  geo.translate(0, 0.5, 0); // shift origin from center to base
  return geo;
})();

// ── Component ──────────────────────────────────────────────────────────────

interface InstancedTreeFieldProps {
  readonly specs: TreeSpecs;
}

export function InstancedTreeField({ specs }: InstancedTreeFieldProps) {
  const trunkMeshRef = useRef<InstancedMesh | null>(null);
  const branchMeshRef = useRef<InstancedMesh | null>(null);

  // Scratch matrices reused across all setMatrixAt calls (no per-frame
  // allocation; useEffect runs once per specs change).
  const M = useMemo(() => new Matrix4(), []);
  const R = useMemo(() => new Matrix4(), []);

  // Populate archetypes from specs.
  const { trunkArchetype, branchArchetype, trunkCount, branchCount } = useMemo(() => {
    const trunks = specs.trunks;
    const branches = specs.branches;

    const trunkArch = new Archetype<TreeTrunkCols>(
      TREE_TRUNK_COLUMN_SPECS,
      Math.max(8, trunks.length),
    );
    for (const t of trunks) {
      const id: EntityId = trunkArch.add({
        posX: [t.worldPosition[0]],
        posY: [t.worldPosition[1]],
        posZ: [t.worldPosition[2]],
        rotY: [t.rotY],
        scale: [t.scale],
      });
      void id;
    }

    const branchArch = new Archetype<TreeBranchCols>(
      TREE_BRANCH_COLUMN_SPECS,
      Math.max(8, branches.length),
    );
    for (const b of branches) {
      const id: EntityId = branchArch.add({
        anchorX: [b.anchorPosition[0]],
        anchorY: [b.anchorPosition[1]],
        anchorZ: [b.anchorPosition[2]],
        parentRotY: [b.parentRotY],
        yaw: [b.yaw],
        pitch: [b.pitch],
        length: [b.length],
        thickness: [b.thickness],
      });
      void id;
    }

    return {
      trunkArchetype: trunkArch,
      branchArchetype: branchArch,
      trunkCount: trunks.length,
      branchCount: branches.length,
    };
  }, [specs]);

  // Compose trunk matrices: T(pos) * R_Y(rotY) * S(scale uniform).
  // Static — runs once after mount + whenever specs change.
  useEffect(() => {
    const mesh = trunkMeshRef.current;
    if (!mesh || trunkCount === 0) return;

    const posX = trunkArchetype.columnArray("posX");
    const posY = trunkArchetype.columnArray("posY");
    const posZ = trunkArchetype.columnArray("posZ");
    const rotY = trunkArchetype.columnArray("rotY");
    const scale = trunkArchetype.columnArray("scale");

    for (let i = 0; i < trunkCount; i++) {
      M.makeTranslation(posX[i], posY[i], posZ[i]);
      R.makeRotationY(rotY[i]);
      M.multiply(R);
      R.makeScale(scale[i], scale[i], scale[i]);
      M.multiply(R);
      mesh.setMatrixAt(i, M);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [trunkArchetype, trunkCount, M, R]);

  // Compose branch matrices:
  //   T(anchor) * R_Y(parentRotY + yaw) * R_Z(-pitch) * S(thickness, length, thickness)
  // Static — runs once after mount + whenever specs change.
  useEffect(() => {
    const mesh = branchMeshRef.current;
    if (!mesh || branchCount === 0) return;

    const anchorX = branchArchetype.columnArray("anchorX");
    const anchorY = branchArchetype.columnArray("anchorY");
    const anchorZ = branchArchetype.columnArray("anchorZ");
    const parentRotY = branchArchetype.columnArray("parentRotY");
    const yaw = branchArchetype.columnArray("yaw");
    const pitch = branchArchetype.columnArray("pitch");
    const length = branchArchetype.columnArray("length");
    const thickness = branchArchetype.columnArray("thickness");

    for (let i = 0; i < branchCount; i++) {
      M.makeTranslation(anchorX[i], anchorY[i], anchorZ[i]);
      R.makeRotationY(parentRotY[i] + yaw[i]);
      M.multiply(R);
      R.makeRotationZ(-pitch[i]);
      M.multiply(R);
      R.makeScale(thickness[i], length[i], thickness[i]);
      M.multiply(R);
      mesh.setMatrixAt(i, M);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [branchArchetype, branchCount, M, R]);

  if (trunkCount === 0 && branchCount === 0) return null;

  return (
    <group>
      {/* TRUNKS — one InstancedMesh, one per tree. */}
      {trunkCount > 0 && (
        <instancedMesh
          ref={trunkMeshRef}
          args={[TRUNK_GEOMETRY_CACHE, undefined, trunkCount]}
          castShadow
          receiveShadow
          frustumCulled={false}
        >
          <meshToonMaterial
            color={PALETTE.trunk}
            gradientMap={DEFAULT_TOON_GRADIENT}
          />
          {/* drei Outlines on InstancedMesh — verified via codex flatline
              against node_modules/@react-three/drei/core/Outlines.js's
              `parent.isInstancedMesh` branch. Outlines instance alongside
              the trunks, sharing the parent's instanceMatrix. */}
          <Outlines color={INK.color} thickness={INK.heavy} />
        </instancedMesh>
      )}

      {/* BRANCHES — one InstancedMesh, ~4 per tree (DEFAULT_TREE_BRANCH_COUNT). */}
      {branchCount > 0 && (
        <instancedMesh
          ref={branchMeshRef}
          args={[BRANCH_GEOMETRY_CACHE, undefined, branchCount]}
          castShadow
          receiveShadow
          frustumCulled={false}
        >
          <meshToonMaterial
            color={PALETTE.trunk}
            gradientMap={DEFAULT_TOON_GRADIENT}
          />
          <Outlines color={INK.color} thickness={INK.mid} />
        </instancedMesh>
      )}
    </group>
  );
}
