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

import { Outlines } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  Color,
  IcosahedronGeometry,
  type InstancedMesh,
  Object3D,
} from "three";

import {
  Archetype,
  type ColumnSpec,
  type EntityId,
  swayLeafSystem,
  type SwayLeafCols,
} from "@/lib/engine";

import { DEFAULT_TOON_GRADIENT, INK } from "../celVocab";

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

  /*
   * BLACK-leaves fix (cycle-3 sprint-1-fixture S1-T1, second attempt):
   *
   * The root cause is NOT the material's shader chunk — cycle-1's analysis
   * was wrong on that. Three.js 0.184's color_vertex chunk runs:
   *   vColor = vec4(1.0);
   *   #ifdef USE_COLOR — vColor.rgb *= color;
   *   #ifdef USE_INSTANCING_COLOR — vColor.rgb *= instanceColor.rgb;
   *
   * `vertexColors=true` on the material forces USE_COLOR to be defined,
   * which makes the vertex shader declare `attribute vec3 color;` AND
   * multiply `vColor.rgb *= color`. The IcosahedronGeometry primitive
   * does NOT ship a `color` attribute, so WebGL's unbound-attribute
   * default (vec3(0)) zeros vColor BEFORE the instanceColor multiplication
   * ever runs. Result: every leaf renders pure black.
   *
   * The fix: bake a per-vertex `color` attribute on the icosphere with
   * all-1 values, so `vColor.rgb *= color` becomes a no-op. The subsequent
   * `vColor.rgb *= instanceColor.rgb` then carries the per-instance color
   * through to the fragment shader's `diffuseColor.rgb *= vColor.rgb`.
   *
   * meshToonMaterial works correctly with this fix (cel-band gradient
   * preserved on leaves — the cycle-1 craft signal is intact).
   */
  const geometry = useMemo(() => {
    const geo = new IcosahedronGeometry(baseRadius, detail);
    const vertexCount = geo.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3).fill(1);
    geo.setAttribute("color", new BufferAttribute(colors, 3));
    return geo;
  }, [baseRadius, detail]);

  // GPU memory cleanup when geometry deps change or component unmounts.
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

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
      args={[geometry, undefined, count]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <meshToonMaterial
        gradientMap={DEFAULT_TOON_GRADIENT}
        // `vertexColors` enables the shader path that consumes the
        // per-vertex `color` attribute AND `InstancedMesh.instanceColor`.
        // The icosphere geometry above bakes all-1 colors so the per-vertex
        // multiplication is a no-op; the per-instance multiplication then
        // produces the final color. See the long comment above the
        // `geometry` useMemo for the full chain.
        vertexColors
        // Base color stays white (identity multiplier) so the per-instance
        // color uploaded via setColorAt() is the final rendered color.
        // First-frame fallback before useEffect uploads: white. Visually
        // acceptable for one frame.
        color="#ffffff"
      />
      {/*
       * Drei <Outlines> on InstancedMesh (cycle-3 sprint-1-fixture
       * S1-T1 outline spike, 2026-05-17). The cycle-1 distillation
       * claimed drei did not support InstancedMesh outlines — codex
       * flatline a7a6d61722ba465c8 verified that's stale for the
       * installed drei 10.7.7 at node_modules/@react-three/drei/core/
       * Outlines.js, which has an explicit `parent.isInstancedMesh`
       * branch creating a second InstancedMesh that shares
       * parent.instanceMatrix.
       *
       * Thickness 1.5× INK weight (operator visual gate iteration 2,
       * 2026-05-17): drei's outline shader applies
       * `tNormal = instanceMatrix * tNormal` then normalizes in clip
       * space; instanced outlines render at slightly less than per-mesh
       * outline thickness. 1× read "thinner by half" to operator at
       * 10×10; 2× was "too thick" at 25×25; 1.5× is the compromise.
       * Tune further if a single multiplier doesn't work at all scales.
       */}
      <Outlines color={INK.color} thickness={INK.fine * 1.5} />
    </instancedMesh>
  );
}
