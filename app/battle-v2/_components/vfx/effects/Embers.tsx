/**
 * Embers — fire ambient VFX. Rising sparks with flicker.
 *
 * Same recipe (single InstancedMesh + single useFrame, hex-tile confined).
 * Fire is canonically noon-hour, so resonance peaks at noon — embers rise
 * hot at midday, simmer at midnight. Hue: warm orange→red, per wuxing.
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { InstancedMesh, Object3D } from "three";
import { Object3D as Obj3D } from "three";

import { hexToWorld, type HexCoord } from "@/lib/hex";

import { DEFAULT_TOON_GRADIENT } from "../celShading";

interface Ember {
  x: number;
  y: number;
  z: number;
  vy: number;
  vx: number;
  vz: number;
  tileIndex: number;
  flickerPhase: number;
  flickerRate: number;
  scaleJitter: number;
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spawnEmber(
  e: Ember,
  tileCenter: readonly [number, number],
  inradius: number,
  groundY: number,
  rand: () => number,
  tileIndex: number,
) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * inradius * 0.55;
  e.x = tileCenter[0] + Math.cos(a) * r;
  e.z = tileCenter[1] + Math.sin(a) * r;
  e.y = groundY + rand() * 0.2;
  e.vy = 0.55 + rand() * 0.65;
  const ja = rand() * Math.PI * 2;
  const js = 0.1 + rand() * 0.16;
  e.vx = Math.cos(ja) * js;
  e.vz = Math.sin(ja) * js;
  e.tileIndex = tileIndex;
  e.flickerPhase = rand();
  e.flickerRate = 1.2 + rand() * 1.8;
  e.scaleJitter = 0.6 + rand() * 0.9;
}

export interface EmbersProps {
  readonly tiles: readonly HexCoord[];
  readonly hexSize: number;
  readonly count?: number;
  readonly ceilingY?: number;
  readonly groundY?: number;
  readonly color?: string;
  readonly emberScale?: number;
  readonly intensity?: number;
  readonly seed?: number;
}

export function Embers({
  tiles,
  hexSize,
  count = 50,
  ceilingY = 2.6,
  groundY = 0,
  color = "#ff7a3a",
  emberScale = 0.05,
  intensity = 1,
  seed = 0xf12e,
}: EmbersProps) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const dummy = useMemo<Object3D>(() => new Obj3D(), []);
  const inradius = useMemo(() => (Math.sqrt(3) / 2) * hexSize, [hexSize]);
  const tileCenters = useMemo(
    () => tiles.map((c) => hexToWorld(c, hexSize)),
    [tiles, hexSize],
  );
  const safeCount = useMemo(
    () => Math.max(0, Math.floor(Number.isFinite(count) ? count : 0)),
    [count],
  );

  const embers = useMemo<Ember[]>(() => {
    if (tileCenters.length === 0 || safeCount === 0) return [];
    const rand = mulberry32(seed);
    const out: Ember[] = new Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      const tileIdx = i % tileCenters.length;
      const e: Ember = {
        x: 0, y: 0, z: 0, vy: 0, vx: 0, vz: 0, tileIndex: tileIdx,
        flickerPhase: 0, flickerRate: 1.5, scaleJitter: 1,
      };
      spawnEmber(e, tileCenters[tileIdx], inradius, groundY, rand, tileIdx);
      e.y = groundY + rand() * (ceilingY - groundY);
      out[i] = e;
    }
    return out;
  }, [safeCount, tileCenters, inradius, ceilingY, groundY, seed]);

  const respawnRand = useMemo(
    () => embers.map((_, i) => mulberry32(seed + 23 + i * 1879)),
    [embers, seed],
  );

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh || embers.length === 0) return;
    const clampedDt = Math.min(dt, 1 / 30);

    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.y += e.vy * clampedDt;
      e.x += e.vx * clampedDt;
      e.z += e.vz * clampedDt;
      e.flickerPhase += e.flickerRate * clampedDt;
      if (e.flickerPhase > 1) e.flickerPhase -= 1;
      if (e.y >= ceilingY) {
        const r = respawnRand[i];
        spawnEmber(e, tileCenters[e.tileIndex], inradius, groundY, r, e.tileIndex);
      }
      const flicker = 0.55 + 0.45 * Math.abs(Math.sin(e.flickerPhase * Math.PI * 2));
      const s = emberScale * e.scaleJitter * intensity * flicker;
      dummy.position.set(e.x, e.y, e.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (tiles.length === 0 || safeCount === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, safeCount]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshToonMaterial
        color={color}
        gradientMap={DEFAULT_TOON_GRADIENT}
        transparent
        opacity={0.92}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
