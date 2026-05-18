/**
 * InstancedRockField — renders ALL hex-scene rocks (boulder/slab/pebble +
 * chunks) through TWO InstancedMesh layers driven by ONE RockArchetype.
 *
 * Cycle-3 fixture-ecs-instancing-2026-05-17 / sprint-1-fixture / S2-T1.
 * The second cycle-3 fixture archetype renderer. Mirrors InstancedTreeField
 * (S1-T3) shape, with three architectural twists that make Rock genuinely
 * NEW pattern-territory:
 *
 *   1. **Per-instance HUE** (Tree was uniform PALETTE.trunk; Rock varies
 *      per-instance via PALETTE.stone or PALETTE.stoneLichen). Carried as
 *      hueR/hueG/hueB columns in the archetype, uploaded via setColorAt()
 *      on the InstancedMesh — meshToonMaterial with NO vertexColors prop
 *      (cleaner pattern per SDD §8.3; USE_INSTANCING_COLOR auto-sets when
 *      instanceColor !== null).
 *
 *   2. **Non-uniform XYZ scale** (Tree was uniform; Rock's slab shape is
 *      (1.25, 0.55, 1.15)). Carried as scaleX/scaleY/scaleZ columns,
 *      composed per-instance. Codex flatline a7a6d61722ba465c8 flagged
 *      this as the path where drei Outlines may thicken unevenly because
 *      Three.js 0.184 doesn't provide per-instance normal matrix —
 *      operator visual gate at S2 close will confirm whether slab
 *      outlines look acceptable.
 *
 *   3. **Single archetype for primary + chunks** (operator pushback on
 *      over-optimization 2026-05-17): SDD §3.4 proposed two archetypes
 *      (RockArchetype + RockChunkArchetype). This renderer uses ONE
 *      RockArchetype — primary rocks and chunks differ only in matrix
 *      (chunks are smaller + offset-positioned); they share the boulder
 *      geometry pool. One archetype, one renderer pass.
 *
 * **Geometry pool dispatch**: 2 InstancedMesh layers:
 *   - boulder pool: handles ALL boulder + slab + chunk instances
 *     (ROCK_GEOMETRY_BOULDER baked at module load with jitter=0.18)
 *   - pebble pool: handles pebble instances only
 *     (ROCK_GEOMETRY_PEBBLE baked at module load with jitter=0.1)
 *
 * Single canonical geometry per pool (cycle-3 over-optimization pushback;
 * SDD proposed 3 variants per pool). Future cycles can add variants when
 * visual sameness is felt at closer camera scales.
 *
 * Static archetype (no useFrame): rocks don't sway in the non-instanced
 * path either. Moss tufts on rocks continue through the cycle-1 leaf field
 * (rockMossLeafSpecs in leafExtractors.ts), unchanged by this commit.
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { Outlines } from "@react-three/drei";
import {
  Color,
  type InstancedMesh,
  Matrix4,
} from "three";

import {
  Archetype,
  type EntityId,
  ROCK_COLUMN_SPECS,
  type RockCols,
  ROCK_SHAPE_PEBBLE,
} from "@/lib/engine";

import { DEFAULT_TOON_GRADIENT, INK } from "../celVocab";

import type { RockSpec } from "./fixtureExtractors";
import {
  ROCK_GEOMETRY_BOULDER,
  ROCK_GEOMETRY_PEBBLE,
} from "./fixtureGeometryVariants";

// ── Component ──────────────────────────────────────────────────────────────

interface InstancedRockFieldProps {
  readonly specs: readonly RockSpec[];
}

export function InstancedRockField({ specs }: InstancedRockFieldProps) {
  const boulderMeshRef = useRef<InstancedMesh | null>(null);
  const pebbleMeshRef = useRef<InstancedMesh | null>(null);

  // Scratch matrix + color objects reused across all setMatrixAt /
  // setColorAt calls (no per-frame allocation; useEffect runs once per
  // specs change).
  const M = useMemo(() => new Matrix4(), []);
  const R = useMemo(() => new Matrix4(), []);
  const tmpColor = useMemo(() => new Color(), []);

  // Populate RockArchetype from specs + pre-count rows per geometry pool.
  // boulder pool = boulder + slab + chunk instances; pebble pool = pebble.
  const { archetype, boulderCount, pebbleCount, total } = useMemo(() => {
    const arch = new Archetype<RockCols>(
      ROCK_COLUMN_SPECS,
      Math.max(8, specs.length),
    );
    let boulderN = 0;
    let pebbleN = 0;

    for (const s of specs) {
      // Convert RockShape string → Float32 shape tag for the archetype column.
      const shapeNum =
        s.shape === "pebble" ? 2 : s.shape === "slab" ? 1 : 0;

      // Decode hue hex string → r/g/b floats via Three.js Color.
      tmpColor.set(s.hue);

      const id: EntityId = arch.add({
        posX: [s.worldPosition[0]],
        posY: [s.worldPosition[1]],
        posZ: [s.worldPosition[2]],
        rotY: [s.rotY],
        scaleX: [s.scale[0]],
        scaleY: [s.scale[1]],
        scaleZ: [s.scale[2]],
        shape: [shapeNum],
        hueR: [tmpColor.r],
        hueG: [tmpColor.g],
        hueB: [tmpColor.b],
      });
      void id;

      if (s.shape === "pebble") pebbleN++;
      else boulderN++;
    }

    return {
      archetype: arch,
      boulderCount: boulderN,
      pebbleCount: pebbleN,
      total: specs.length,
    };
  }, [specs, tmpColor]);

  // Compose per-instance matrices + colors. Static — runs once on mount +
  // whenever specs change. Walk archetype rows, split by shape into the
  // correct InstancedMesh, track per-mesh instance index counters.
  useEffect(() => {
    const boulderMesh = boulderMeshRef.current;
    const pebbleMesh = pebbleMeshRef.current;
    if (total === 0) return;

    const posX = archetype.columnArray("posX");
    const posY = archetype.columnArray("posY");
    const posZ = archetype.columnArray("posZ");
    const rotY = archetype.columnArray("rotY");
    const scaleX = archetype.columnArray("scaleX");
    const scaleY = archetype.columnArray("scaleY");
    const scaleZ = archetype.columnArray("scaleZ");
    const shape = archetype.columnArray("shape");
    const hueR = archetype.columnArray("hueR");
    const hueG = archetype.columnArray("hueG");
    const hueB = archetype.columnArray("hueB");

    let boulderIdx = 0;
    let pebbleIdx = 0;

    for (let i = 0; i < total; i++) {
      // Compose: T(pos) * R_Y(rotY) * S(scaleX, scaleY, scaleZ).
      M.makeTranslation(posX[i], posY[i], posZ[i]);
      R.makeRotationY(rotY[i]);
      M.multiply(R);
      R.makeScale(scaleX[i], scaleY[i], scaleZ[i]);
      M.multiply(R);

      tmpColor.setRGB(hueR[i], hueG[i], hueB[i]);

      const isPebble = shape[i] === ROCK_SHAPE_PEBBLE;
      const mesh = isPebble ? pebbleMesh : boulderMesh;
      if (!mesh) continue;
      const meshIdx = isPebble ? pebbleIdx : boulderIdx;

      mesh.setMatrixAt(meshIdx, M);
      mesh.setColorAt(meshIdx, tmpColor);

      if (isPebble) pebbleIdx++;
      else boulderIdx++;
    }

    if (boulderMesh) {
      boulderMesh.instanceMatrix.needsUpdate = true;
      if (boulderMesh.instanceColor) {
        boulderMesh.instanceColor.needsUpdate = true;
      }
    }
    if (pebbleMesh) {
      pebbleMesh.instanceMatrix.needsUpdate = true;
      if (pebbleMesh.instanceColor) {
        pebbleMesh.instanceColor.needsUpdate = true;
      }
    }
  }, [archetype, total, M, R, tmpColor]);

  if (total === 0) return null;

  return (
    <group>
      {/* BOULDER + SLAB + CHUNK pool — one InstancedMesh, shared boulder geometry. */}
      {boulderCount > 0 && (
        <instancedMesh
          ref={boulderMeshRef}
          args={[ROCK_GEOMETRY_BOULDER, undefined, boulderCount]}
          castShadow
          receiveShadow
          frustumCulled={false}
        >
          <meshToonMaterial
            color="#ffffff"
            gradientMap={DEFAULT_TOON_GRADIENT}
          />
          {/* drei Outlines on InstancedMesh — Tree.tsx uses INK.heavy for
              boulders/slabs and INK.fine for pebbles (Rock.tsx:153/167).
              1.5× multiplier per S1-T4 visual calibration (the drei
              instanced-outline shader produces ~half perceived thickness
              of per-mesh Outlines at the same INK weight). */}
          <Outlines color={INK.color} thickness={INK.heavy * 1.5} />
        </instancedMesh>
      )}

      {/* PEBBLE pool — one InstancedMesh, separate pebble geometry. */}
      {pebbleCount > 0 && (
        <instancedMesh
          ref={pebbleMeshRef}
          args={[ROCK_GEOMETRY_PEBBLE, undefined, pebbleCount]}
          castShadow
          receiveShadow
          frustumCulled={false}
        >
          <meshToonMaterial
            color="#ffffff"
            gradientMap={DEFAULT_TOON_GRADIENT}
          />
          {/* Pebble outline uses INK.fine per Rock.tsx:153 — smaller +
              less focal than boulders + slabs. */}
          <Outlines color={INK.color} thickness={INK.fine * 1.5} />
        </instancedMesh>
      )}
    </group>
  );
}
