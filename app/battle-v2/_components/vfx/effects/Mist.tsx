/**
 * Mist — water ambient VFX. Low fog plates hugging the tile surface.
 *
 * Session 17 Stage C primitive. Same recipe as LeafSwirl / PollenMotes:
 *   - ONE InstancedMesh of large translucent plane sheets → single draw call
 *   - ONE useFrame loop, no per-frame allocs
 *   - Hex-tile-confined: each sheet anchors to a tile center + drifts within it
 *
 * Visual register:
 *   - Sheets are large, low-poly, near-flat — read as fog volume from a
 *     three-quarter camera angle. Per the codex Sunken Shrine: "caves lit
 *     by glowing moss" — color leans cyan-teal not pure white.
 *   - Sheets rotate slowly in xz plane and fade in/out per-sheet so the
 *     field never reads as a static texture.
 *   - Hex-tile-confined: 1-2 sheets per tile keeps draw cost low and
 *     density readable.
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { InstancedMesh, Object3D } from "three";
import { Object3D as Obj3D } from "three";

import { hexToWorld, type HexCoord } from "@/lib/hex";

interface MistSheet {
  x: number;
  y: number;
  z: number;
  /** Horizontal drift velocity. */
  vx: number;
  vz: number;
  /** Rotation around Y (sheets are mostly flat). */
  rot: number;
  /** Spin rate. */
  spin: number;
  /** Owning tile index. */
  tileIndex: number;
  /** Per-sheet alpha-phase (0..1, evolves). */
  alphaPhase: number;
  alphaRate: number;
  /** Per-sheet scale jitter (0.7..1.3). */
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

function spawnSheet(
  sheet: MistSheet,
  tileCenter: readonly [number, number],
  inradius: number,
  groundY: number,
  rand: () => number,
  tileIndex: number,
) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * inradius * 0.6;
  sheet.x = tileCenter[0] + Math.cos(a) * r;
  sheet.z = tileCenter[1] + Math.sin(a) * r;
  sheet.y = groundY + 0.08 + rand() * 0.18;
  const driftAngle = rand() * Math.PI * 2;
  const driftSpeed = 0.05 + rand() * 0.1;
  sheet.vx = Math.cos(driftAngle) * driftSpeed;
  sheet.vz = Math.sin(driftAngle) * driftSpeed;
  sheet.rot = rand() * Math.PI * 2;
  sheet.spin = (rand() - 0.5) * 0.12;
  sheet.tileIndex = tileIndex;
  sheet.alphaPhase = rand();
  sheet.alphaRate = 0.18 + rand() * 0.22;
  sheet.scaleJitter = 0.75 + rand() * 0.55;
}

export interface MistProps {
  readonly tiles: readonly HexCoord[];
  readonly hexSize: number;
  /** Total sheets across tiles. ~2 per tile reads as a soft fog layer. */
  readonly count?: number;
  readonly groundY?: number;
  /** Hue — defaults to a moss-tinted cool cyan. */
  readonly color?: string;
  readonly intensity?: number;
  /** Maximum sheet half-width (fraction of inradius). */
  readonly sheetSize?: number;
  readonly seed?: number;
}

export function Mist({
  tiles,
  hexSize,
  count = 14,
  groundY = 0,
  color = "#7ab8b8",
  intensity = 1,
  sheetSize = 1.4,
  seed = 0xa15ed,
}: MistProps) {
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

  const sheets = useMemo<MistSheet[]>(() => {
    if (tileCenters.length === 0 || safeCount === 0) return [];
    const rand = mulberry32(seed);
    const out: MistSheet[] = new Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      const tileIdx = i % tileCenters.length;
      const s: MistSheet = {
        x: 0, y: 0, z: 0, vx: 0, vz: 0, rot: 0, spin: 0,
        tileIndex: tileIdx, alphaPhase: 0, alphaRate: 0.2, scaleJitter: 1,
      };
      spawnSheet(s, tileCenters[tileIdx], inradius, groundY, rand, tileIdx);
      out[i] = s;
    }
    return out;
  }, [safeCount, tileCenters, inradius, groundY, seed]);

  const respawnRand = useMemo(
    () => sheets.map((_, i) => mulberry32(seed + 31 + i * 3637)),
    [sheets, seed],
  );

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh || sheets.length === 0) return;
    const clampedDt = Math.min(dt, 1 / 30);

    for (let i = 0; i < sheets.length; i++) {
      const s = sheets[i];
      s.x += s.vx * clampedDt;
      s.z += s.vz * clampedDt;
      s.rot += s.spin * clampedDt;
      s.alphaPhase += s.alphaRate * clampedDt;
      if (s.alphaPhase > 1) s.alphaPhase -= 1;

      // Drift confinement — keep sheets within their tile's inradius.
      const cx = tileCenters[s.tileIndex][0];
      const cz = tileCenters[s.tileIndex][1];
      const dx = s.x - cx;
      const dz = s.z - cz;
      const dist2 = dx * dx + dz * dz;
      const maxDist = inradius * 0.85;
      if (dist2 > maxDist * maxDist) {
        const r = respawnRand[i];
        spawnSheet(s, tileCenters[s.tileIndex], inradius, groundY, r, s.tileIndex);
      }

      // Smooth fade — sine on alpha-phase, range 0.25..1.0 so sheets never
      // pop in/out hard. Multiplied by intensity at the material layer
      // (here we scale the geometry instead — flat planes can't read alpha
      // gradient cheaply without a custom shader).
      const fade = 0.65 + 0.35 * Math.sin(s.alphaPhase * Math.PI * 2);
      const w = hexSize * sheetSize * s.scaleJitter * intensity * fade;
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(-Math.PI / 2, 0, s.rot);
      dummy.scale.set(w, w * 0.7, 1);
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
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.28}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
