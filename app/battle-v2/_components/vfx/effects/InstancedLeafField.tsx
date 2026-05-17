/**
 * InstancedLeafField — one `<InstancedMesh>` that renders ALL hex-scene
 * leaves through a single draw call, driven by ONE `useFrame` loop.
 *
 * Wiring:
 *   - HexScene resolves world-space leaf data via leafExtractors → LeafSpec[]
 *   - This component allocates a LeafArchetype (lib/engine substrate) sized
 *     to the spec count, copies static columns (position/scale/color/phase/
 *     amplitude/frequency) into it, and renders a single InstancedMesh.
 *   - Per-frame: swayLeafSystem writes the rotY column; the React loop
 *     composes each instance matrix from (position, sway-rotation, scale)
 *     into mesh.instanceMatrix.
 *
 * The substrate (lib/engine) does not import Three.js — composition with
 * Object3D happens here, in the app layer. This is the renderer-plugin
 * seam the PRD names; future WebGPU / roll-your-own paths swap this file
 * without touching the substrate.
 *
 * Outline regression (documented in sprint plan): drei `<Outlines>` builds
 * an inverted-hull mesh that does not natively support `InstancedMesh`.
 * Leaves on this path render WITHOUT ink outlines. Trunks / branches /
 * mushroom caps / wildflower stems / rocks keep their outlines.
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import { Color, type InstancedMesh, Object3D } from "three";

import {
  Archetype,
  type ColumnSpec,
  type EntityId,
  swayLeafSystem,
  type SwayLeafCols,
} from "@/lib/engine";

import type { LeafSpec } from "./leafExtractors";

const LEAF_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "phase", itemSize: 1 },
  { name: "amplitude", itemSize: 1 },
  { name: "frequency", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
];

interface InstancedLeafFieldProps {
  readonly specs: readonly LeafSpec[];
  /** Toon material color is per-instance; this is the icosphere base radius. Keep at 1 unless tuning. */
  readonly baseRadius?: number;
  /** Optional override for icosphere detail. 0 = sharp (8 faces), 1 = softer. */
  readonly detail?: 0 | 1;
}

export function InstancedLeafField({
  specs,
  baseRadius = 1,
  detail = 0,
}: InstancedLeafFieldProps) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const dummy = useMemo<Object3D>(() => new Object3D(), []);
  const tmpColor = useMemo(() => new Color(), []);

  // Build the substrate archetype + side arrays for static per-instance data.
  // The substrate only stores the dynamic columns (phase/amplitude/frequency/
  // rotY); position, scale, and color stay in plain Float32Arrays because the
  // renderer is the only consumer.
  const { archetype, positions, scales, colorsHex, count } = useMemo(() => {
    const n = specs.length;
    const arch = new Archetype<SwayLeafCols>(LEAF_COLUMN_SPECS, Math.max(8, n));
    const pos = new Float32Array(n * 3);
    const sc = new Float32Array(n * 3);
    const cols: string[] = new Array(n);

    for (let i = 0; i < n; i++) {
      const s = specs[i];
      const id: EntityId = arch.add({
        phase: [s.swayPhase],
        amplitude: [s.swayAmplitude],
        frequency: [s.swayFrequency],
        rotY: [0],
      });
      // EntityId is just the dense slot. Use `i` and `id` interchangeably for
      // the freshly-built archetype (no destroys yet).
      void id;

      pos[i * 3 + 0] = s.worldPosition[0];
      pos[i * 3 + 1] = s.worldPosition[1];
      pos[i * 3 + 2] = s.worldPosition[2];

      sc[i * 3 + 0] = s.scale[0];
      sc[i * 3 + 1] = s.scale[1];
      sc[i * 3 + 2] = s.scale[2];

      cols[i] = s.color;
    }

    return { archetype: arch, positions: pos, scales: sc, colorsHex: cols, count: n };
  }, [specs]);

  // Upload per-instance colors once after mount (and whenever specs change).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      tmpColor.set(colorsHex[i]);
      mesh.setColorAt(i, tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, colorsHex, tmpColor]);

  // The ONE useFrame — runs swayLeafSystem then writes per-instance matrices.
  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;
    const t = state.clock.elapsedTime;

    // Substrate writes rotY column.
    swayLeafSystem(archetype, dt, t);

    const rotY = archetype.columnArray("rotY");
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3 + 0],
        positions[i * 3 + 1],
        positions[i * 3 + 2],
      );
      dummy.rotation.set(0, rotY[i], 0);
      dummy.scale.set(
        scales[i * 3 + 0],
        scales[i * 3 + 1],
        scales[i * 3 + 2],
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <icosahedronGeometry args={[baseRadius, detail]} />
      {/*
       * meshLambertMaterial (cycle-3 sprint-1-fixture S1-T1): replaces the
       * cycle-1 meshToonMaterial path. The toon material's shader did NOT
       * include the `<instancing_color>` chunk that translates
       * `InstancedMesh.instanceColor` into the `vColor` varying, so per-
       * instance colors uploaded via `setColorAt()` rendered as pure black
       * (white * vec3(0) = black). Lambert includes the chunk natively.
       *
       * Trade-off: leaves lose the 2-band toon gradient on this path.
       * Operator visual gate (FR-1.2): if cel-band loss is unacceptable,
       * pivot to option-a (onBeforeCompile chunk injection into
       * meshToonMaterial) or option-c (custom ShaderMaterial) per cycle-1
       * distillation §4-options. Other fixtures (Tree trunk/branches, Bush,
       * Rock, etc.) continue using meshToonMaterial on their non-instanced
       * paths; this swap is scoped to the leaf field only.
       *
       * `vertexColors` stays on — required to consume `instanceColor`.
       * `color="#ffffff"` is the identity multiplier so per-instance color
       * uploaded via setColorAt() is the final rendered color.
       */}
      <meshLambertMaterial
        vertexColors
        color="#ffffff"
      />
    </instancedMesh>
  );
}
