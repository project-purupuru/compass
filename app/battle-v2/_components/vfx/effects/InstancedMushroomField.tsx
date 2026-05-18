/**
 * InstancedMushroomField — renders all mushroom STEMS through ONE
 * InstancedMesh. Cap continues through cycle-1 leaf field
 * (mushroomLeafSpecs in leafExtractors.ts — unchanged).
 *
 * Cycle-3 fixture-ecs-instancing-2026-05-17 / sprint-2-fixture / S2-T3.
 * Trivial pattern (single-cylinder, no per-instance color); kept separate
 * from Wildflower for code clarity even though shapes are identical.
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { Outlines } from "@react-three/drei";
import {
  type InstancedMesh,
  Matrix4,
} from "three";

import {
  Archetype,
  type EntityId,
  MUSHROOM_COLUMN_SPECS,
  type MushroomCols,
} from "@/lib/engine";

import { PALETTE } from "../../world/palette";
import { DEFAULT_TOON_GRADIENT, INK } from "../celVocab";

import type { MushroomStemSpec } from "./fixtureExtractors";
import { MUSHROOM_STEM_GEOMETRY } from "./fixtureGeometryVariants";

interface InstancedMushroomFieldProps {
  readonly specs: readonly MushroomStemSpec[];
}

export function InstancedMushroomField({ specs }: InstancedMushroomFieldProps) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const M = useMemo(() => new Matrix4(), []);
  const R = useMemo(() => new Matrix4(), []);

  const { archetype, count } = useMemo(() => {
    const arch = new Archetype<MushroomCols>(
      MUSHROOM_COLUMN_SPECS,
      Math.max(8, specs.length),
    );
    for (const s of specs) {
      const id: EntityId = arch.add({
        posX: [s.worldPosition[0]],
        posY: [s.worldPosition[1]],
        posZ: [s.worldPosition[2]],
        rotY: [s.rotY],
        scale: [s.scale],
      });
      void id;
    }
    return { archetype: arch, count: specs.length };
  }, [specs]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    const posX = archetype.columnArray("posX");
    const posY = archetype.columnArray("posY");
    const posZ = archetype.columnArray("posZ");
    const rotY = archetype.columnArray("rotY");
    const scale = archetype.columnArray("scale");

    for (let i = 0; i < count; i++) {
      M.makeTranslation(posX[i], posY[i], posZ[i]);
      R.makeRotationY(rotY[i]);
      M.multiply(R);
      R.makeScale(scale[i], scale[i], scale[i]);
      M.multiply(R);
      mesh.setMatrixAt(i, M);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [archetype, count, M, R]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[MUSHROOM_STEM_GEOMETRY, undefined, count]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <meshToonMaterial
        color={PALETTE.parchment}
        gradientMap={DEFAULT_TOON_GRADIENT}
      />
      <Outlines color={INK.color} thickness={INK.fine * 1.5} />
    </instancedMesh>
  );
}
