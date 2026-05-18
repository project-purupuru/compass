/**
 * InstancedBushField — renders ALL hex-scene bushes through ONE
 * InstancedMesh sharing the canonical merged-puff-cluster geometry.
 *
 * Cycle-3 fixture-ecs-instancing-2026-05-17 / sprint-2-fixture / S2-T2.
 * Third architecturally novel cycle-3 archetype: introduces the merged-
 * geometry-per-fixture pattern (vs uniform-cylinder Tree + variant-baked
 * Rock). Per-instance hue varies via setColorAt.
 *
 * **Sway dropped on instanced path**: Bush.tsx had whole-bush useFrame
 * group.rotation sway. Static archetype here; if operator visual gate
 * flags missing sway, future cycle can add BushSwaySystem reading a
 * swayPhase column (mirrors cycle-1 swayLeafSystem).
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
  BUSH_COLUMN_SPECS,
  type BushCols,
  type EntityId,
} from "@/lib/engine";

import { DEFAULT_TOON_GRADIENT, INK } from "../celVocab";

import type { BushSpec } from "./fixtureExtractors";
import { BUSH_GEOMETRY } from "./fixtureGeometryVariants";

interface InstancedBushFieldProps {
  readonly specs: readonly BushSpec[];
}

export function InstancedBushField({ specs }: InstancedBushFieldProps) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const M = useMemo(() => new Matrix4(), []);
  const R = useMemo(() => new Matrix4(), []);
  const tmpColor = useMemo(() => new Color(), []);

  const { archetype, count } = useMemo(() => {
    const arch = new Archetype<BushCols>(
      BUSH_COLUMN_SPECS,
      Math.max(8, specs.length),
    );
    for (const s of specs) {
      tmpColor.set(s.hue);
      const id: EntityId = arch.add({
        posX: [s.worldPosition[0]],
        posY: [s.worldPosition[1]],
        posZ: [s.worldPosition[2]],
        rotY: [s.rotY],
        scale: [s.scale],
        hueR: [tmpColor.r],
        hueG: [tmpColor.g],
        hueB: [tmpColor.b],
      });
      void id;
    }
    return { archetype: arch, count: specs.length };
  }, [specs, tmpColor]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    const posX = archetype.columnArray("posX");
    const posY = archetype.columnArray("posY");
    const posZ = archetype.columnArray("posZ");
    const rotY = archetype.columnArray("rotY");
    const scale = archetype.columnArray("scale");
    const hueR = archetype.columnArray("hueR");
    const hueG = archetype.columnArray("hueG");
    const hueB = archetype.columnArray("hueB");

    for (let i = 0; i < count; i++) {
      M.makeTranslation(posX[i], posY[i], posZ[i]);
      R.makeRotationY(rotY[i]);
      M.multiply(R);
      R.makeScale(scale[i], scale[i], scale[i]);
      M.multiply(R);
      mesh.setMatrixAt(i, M);
      tmpColor.setRGB(hueR[i], hueG[i], hueB[i]);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [archetype, count, M, R, tmpColor]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[BUSH_GEOMETRY, undefined, count]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <meshToonMaterial
        color="#ffffff"
        gradientMap={DEFAULT_TOON_GRADIENT}
      />
      <Outlines color={INK.color} thickness={INK.heavy * 1.5} />
    </instancedMesh>
  );
}
