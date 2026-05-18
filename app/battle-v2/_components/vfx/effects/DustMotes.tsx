/**
 * DustMotes — earth ambient VFX. Slow brown specks drifting low.
 *
 * Earth is afternoon-hour, late-summer. Reads as warm dust kicked up at
 * golden-hour. Same recipe as PollenMotes but heavier (lower ceiling,
 * slower drift, earthier hues).
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { InstancedMesh, Object3D } from "three";
import { Object3D as Obj3D } from "three";

import { hexToWorld, type HexCoord } from "@/lib/hex";

import { DEFAULT_TOON_GRADIENT } from "../celShading";

interface Speck {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  tileIndex: number;
  phase: number; rate: number;
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

function spawnSpeck(
  m: Speck,
  tileCenter: readonly [number, number],
  inradius: number,
  groundY: number,
  rand: () => number,
  tileIndex: number,
) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * inradius * 0.7;
  m.x = tileCenter[0] + Math.cos(a) * r;
  m.z = tileCenter[1] + Math.sin(a) * r;
  m.y = groundY + rand() * 0.1;
  // Earth dust rises slowly + sideways more than up.
  m.vy = 0.08 + rand() * 0.18;
  const ja = rand() * Math.PI * 2;
  const js = 0.18 + rand() * 0.22;
  m.vx = Math.cos(ja) * js;
  m.vz = Math.sin(ja) * js;
  m.tileIndex = tileIndex;
  m.phase = rand();
  m.rate = 0.3 + rand() * 0.4;
  m.scaleJitter = 0.6 + rand() * 0.9;
}

export interface DustMotesProps {
  readonly tiles: readonly HexCoord[];
  readonly hexSize: number;
  readonly count?: number;
  readonly ceilingY?: number;
  readonly groundY?: number;
  readonly color?: string;
  readonly moteScale?: number;
  readonly intensity?: number;
  readonly seed?: number;
}

export function DustMotes({
  tiles,
  hexSize,
  count = 44,
  ceilingY = 1.4,
  groundY = 0,
  color = "#c09060",
  moteScale = 0.04,
  intensity = 1,
  seed = 0xea7138,
}: DustMotesProps) {
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

  const motes = useMemo<Speck[]>(() => {
    if (tileCenters.length === 0 || safeCount === 0) return [];
    const rand = mulberry32(seed);
    const out: Speck[] = new Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      const tileIdx = i % tileCenters.length;
      const m: Speck = {
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, tileIndex: tileIdx,
        phase: 0, rate: 0.4, scaleJitter: 1,
      };
      spawnSpeck(m, tileCenters[tileIdx], inradius, groundY, rand, tileIdx);
      m.y = groundY + rand() * (ceilingY - groundY);
      out[i] = m;
    }
    return out;
  }, [safeCount, tileCenters, inradius, ceilingY, groundY, seed]);

  const respawnRand = useMemo(
    () => motes.map((_, i) => mulberry32(seed + 19 + i * 2087)),
    [motes, seed],
  );

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh || motes.length === 0) return;
    const clampedDt = Math.min(dt, 1 / 30);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y += m.vy * clampedDt;
      m.x += m.vx * clampedDt;
      m.z += m.vz * clampedDt;
      m.phase += m.rate * clampedDt;
      if (m.phase > 1) m.phase -= 1;
      if (m.y >= ceilingY) {
        const r = respawnRand[i];
        spawnSpeck(m, tileCenters[m.tileIndex], inradius, groundY, r, m.tileIndex);
      }
      const fade = 0.55 + 0.45 * Math.sin(m.phase * Math.PI * 2);
      const s = moteScale * m.scaleJitter * intensity * fade;
      dummy.position.set(m.x, m.y, m.z);
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
      <sphereGeometry args={[1, 5, 5]} />
      <meshToonMaterial
        color={color}
        gradientMap={DEFAULT_TOON_GRADIENT}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
