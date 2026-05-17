/**
 * PollenMotes — wood ambient VFX. Small honey-gold motes rising slowly.
 *
 * Session 17 Stage B primitive. Same recipe as LeafSwirl / Rain:
 *   - ONE InstancedMesh of tiny spheres → single draw call
 *   - ONE useFrame loop, no per-frame allocs
 *   - Hex-tile-confined spawn
 *
 * Visual register:
 *   - Tiny near-emissive specks (warm honey hue) — operator memory:
 *     "Konka Market hybrid produce, blue melons, honey-veined peaches"
 *   - Rise slowly, fade in/out cyclically via per-mote alpha-phase
 *   - Density tuned for "alive but never busy" (operator-locked)
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { InstancedMesh, Object3D } from "three";
import { Object3D as Obj3D } from "three";

import { hexToWorld, type HexCoord } from "@/lib/hex";

import { DEFAULT_TOON_GRADIENT } from "../celShading";

interface Mote {
  x: number;
  y: number;
  z: number;
  /** Rise speed (units/s, positive). */
  vy: number;
  /** Horizontal jitter velocity. */
  vx: number;
  vz: number;
  /** Owning tile index. */
  tileIndex: number;
  /** Per-mote alpha phase (0..1, evolves over time). */
  alphaPhase: number;
  /** Per-mote alpha frequency. */
  alphaRate: number;
  /** Per-mote size jitter (0.6..1.4). */
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

function spawnMote(
  mote: Mote,
  tileCenter: readonly [number, number],
  inradius: number,
  groundY: number,
  rand: () => number,
  tileIndex: number,
) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * inradius * 0.7;
  mote.x = tileCenter[0] + Math.cos(a) * r;
  mote.z = tileCenter[1] + Math.sin(a) * r;
  mote.y = groundY + rand() * 0.25;
  mote.vy = 0.18 + rand() * 0.32;
  // Tiny horizontal jitter so motes don't all rise in a column.
  const ja = rand() * Math.PI * 2;
  const js = 0.05 + rand() * 0.1;
  mote.vx = Math.cos(ja) * js;
  mote.vz = Math.sin(ja) * js;
  mote.tileIndex = tileIndex;
  mote.alphaPhase = rand();
  mote.alphaRate = 0.4 + rand() * 0.5;
  mote.scaleJitter = 0.65 + rand() * 0.75;
}

export interface PollenMotesProps {
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

export function PollenMotes({
  tiles,
  hexSize,
  count = 36,
  ceilingY = 2.2,
  groundY = 0,
  color = "#e8b248",
  moteScale = 0.045,
  intensity = 1,
  seed = 0x90b6e7,
}: PollenMotesProps) {
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

  const motes = useMemo<Mote[]>(() => {
    if (tileCenters.length === 0 || safeCount === 0) return [];
    const rand = mulberry32(seed);
    const out: Mote[] = new Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      const tileIdx = i % tileCenters.length;
      const m: Mote = {
        x: 0, y: 0, z: 0, vy: 0, vx: 0, vz: 0,
        tileIndex: tileIdx, alphaPhase: 0, alphaRate: 0.5, scaleJitter: 1,
      };
      spawnMote(m, tileCenters[tileIdx], inradius, groundY, rand, tileIdx);
      m.y = groundY + rand() * (ceilingY - groundY);
      out[i] = m;
    }
    return out;
  }, [safeCount, tileCenters, inradius, ceilingY, groundY, seed]);

  const respawnRand = useMemo(
    () => motes.map((_, i) => mulberry32(seed + 7 + i * 1607)),
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
      m.alphaPhase += m.alphaRate * clampedDt;
      if (m.alphaPhase > 1) m.alphaPhase -= 1;

      // Wrap when ceiling reached → respawn near ground.
      if (m.y >= ceilingY) {
        const r = respawnRand[i];
        spawnMote(m, tileCenters[m.tileIndex], inradius, groundY, r, m.tileIndex);
      }

      // Alpha-phase → scale modulation (fade in/out as a soft sine).
      // Range 0.2..1.0 — never fully invisible, never spikes past 1.
      const fade = 0.6 + 0.4 * Math.sin(m.alphaPhase * Math.PI * 2);
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
      <sphereGeometry args={[1, 6, 6]} />
      <meshToonMaterial
        color={color}
        gradientMap={DEFAULT_TOON_GRADIENT}
        transparent
        opacity={0.72}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
