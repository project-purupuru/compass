/**
 * Sparks — metal ambient VFX. Tiny bright pinpoints with short lifespans.
 *
 * Metal is evening-hour, autumn. Reads as cold fireflies / forge-light
 * glints. Same recipe — short-lived particles that fade quick.
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { InstancedMesh, Object3D } from "three";
import { Object3D as Obj3D } from "three";

import { hexToWorld, type HexCoord } from "@/lib/hex";

interface Spark {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  tileIndex: number;
  age: number;
  lifetime: number;
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

function spawnSpark(
  s: Spark,
  tileCenter: readonly [number, number],
  inradius: number,
  groundY: number,
  rand: () => number,
  tileIndex: number,
) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * inradius * 0.6;
  s.x = tileCenter[0] + Math.cos(a) * r;
  s.z = tileCenter[1] + Math.sin(a) * r;
  s.y = groundY + rand() * 1.2;
  s.vy = 0.05 + rand() * 0.15;
  s.vx = (rand() - 0.5) * 0.08;
  s.vz = (rand() - 0.5) * 0.08;
  s.tileIndex = tileIndex;
  s.age = 0;
  s.lifetime = 0.9 + rand() * 1.4;
  s.scaleJitter = 0.5 + rand() * 0.9;
}

export interface SparksProps {
  readonly tiles: readonly HexCoord[];
  readonly hexSize: number;
  readonly count?: number;
  readonly groundY?: number;
  readonly color?: string;
  readonly sparkScale?: number;
  readonly intensity?: number;
  readonly seed?: number;
}

export function Sparks({
  tiles,
  hexSize,
  count = 60,
  groundY = 0,
  color = "#f0f4ff",
  sparkScale = 0.025,
  intensity = 1,
  seed = 0x5121,
}: SparksProps) {
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

  const sparks = useMemo<Spark[]>(() => {
    if (tileCenters.length === 0 || safeCount === 0) return [];
    const rand = mulberry32(seed);
    const out: Spark[] = new Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      const tileIdx = i % tileCenters.length;
      const s: Spark = {
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, tileIndex: tileIdx,
        age: 0, lifetime: 1, scaleJitter: 1,
      };
      spawnSpark(s, tileCenters[tileIdx], inradius, groundY, rand, tileIdx);
      s.age = rand() * s.lifetime;
      out[i] = s;
    }
    return out;
  }, [safeCount, tileCenters, inradius, groundY, seed]);

  const respawnRand = useMemo(
    () => sparks.map((_, i) => mulberry32(seed + 41 + i * 4099)),
    [sparks, seed],
  );

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh || sparks.length === 0) return;
    const clampedDt = Math.min(dt, 1 / 30);

    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      s.age += clampedDt;
      s.y += s.vy * clampedDt;
      s.x += s.vx * clampedDt;
      s.z += s.vz * clampedDt;
      if (s.age >= s.lifetime) {
        const r = respawnRand[i];
        spawnSpark(s, tileCenters[s.tileIndex], inradius, groundY, r, s.tileIndex);
      }
      // Quick rise-and-fade: alpha peaks at 30% of lifetime.
      const t = s.age / s.lifetime;
      const fade = t < 0.3 ? t / 0.3 : (1 - t) / 0.7;
      const scale = sparkScale * s.scaleJitter * intensity * Math.max(0, fade);
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.set(scale, scale, scale);
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
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
