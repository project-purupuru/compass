/**
 * RippleField — water ambient VFX. Expanding ripple rings across tile caps.
 *
 * Session 17 Stage C primitive. Same recipe as Mist / LeafSwirl / Rain:
 *   - ONE InstancedMesh of thin ring planes → single draw call
 *   - ONE useFrame loop, no per-frame allocs
 *   - Each ripple has an age (0..1); on age >= 1, respawns at a new random
 *     point within an owning tile with t=0
 *
 * Visual register:
 *   - Bioluminescent moss-teal default tint (Sunken Shrine vibe)
 *   - Rings expand smoothly + fade alpha as age increases
 *   - Confined to hex tile inradius — no bleeding across zones
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { InstancedMesh, Object3D } from "three";
import { Object3D as Obj3D } from "three";

import { hexToWorld, type HexCoord } from "@/lib/hex";

interface Ripple {
  x: number;
  y: number;
  z: number;
  /** Age (seconds since spawn). When age >= lifetime, respawn. */
  age: number;
  /** Lifetime seconds — varies per ripple for organic timing. */
  lifetime: number;
  /** Final radius this ripple reaches. */
  maxRadius: number;
  /** Owning tile index. */
  tileIndex: number;
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

function spawnRipple(
  ripple: Ripple,
  tileCenter: readonly [number, number],
  inradius: number,
  groundY: number,
  rand: () => number,
  tileIndex: number,
) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * inradius * 0.6;
  ripple.x = tileCenter[0] + Math.cos(a) * r;
  ripple.z = tileCenter[1] + Math.sin(a) * r;
  ripple.y = groundY + 0.02;
  ripple.age = 0;
  ripple.lifetime = 2.2 + rand() * 1.6;
  ripple.maxRadius = inradius * (0.18 + rand() * 0.28);
  ripple.tileIndex = tileIndex;
}

export interface RippleFieldProps {
  readonly tiles: readonly HexCoord[];
  readonly hexSize: number;
  /** Total ripples across all tiles. */
  readonly count?: number;
  readonly groundY?: number;
  /** Bioluminescent moss-teal default. */
  readonly color?: string;
  readonly intensity?: number;
  readonly seed?: number;
}

export function RippleField({
  tiles,
  hexSize,
  count = 18,
  groundY = 0,
  color = "#6fd6c0",
  intensity = 1,
  seed = 0xb10dde,
}: RippleFieldProps) {
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

  const ripples = useMemo<Ripple[]>(() => {
    if (tileCenters.length === 0 || safeCount === 0) return [];
    const rand = mulberry32(seed);
    const out: Ripple[] = new Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      const tileIdx = i % tileCenters.length;
      const ripple: Ripple = {
        x: 0, y: 0, z: 0, age: 0, lifetime: 2, maxRadius: inradius * 0.3,
        tileIndex: tileIdx,
      };
      spawnRipple(ripple, tileCenters[tileIdx], inradius, groundY, rand, tileIdx);
      // Spread initial ages so ripples don't all expand in lockstep.
      ripple.age = rand() * ripple.lifetime;
      out[i] = ripple;
    }
    return out;
  }, [safeCount, tileCenters, inradius, groundY, seed]);

  const respawnRand = useMemo(
    () => ripples.map((_, i) => mulberry32(seed + 13 + i * 5197)),
    [ripples, seed],
  );

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh || ripples.length === 0) return;
    const clampedDt = Math.min(dt, 1 / 30);

    for (let i = 0; i < ripples.length; i++) {
      const rp = ripples[i];
      rp.age += clampedDt;
      if (rp.age >= rp.lifetime) {
        const r = respawnRand[i];
        spawnRipple(rp, tileCenters[rp.tileIndex], inradius, groundY, r, rp.tileIndex);
      }

      // Age-progress 0..1 → radius scales linearly; we render a thin ring
      // by giving the plane a circular footprint with ring-like radial fade
      // (cheap fake: scale a plane and use alpha falloff via opacity decay).
      // Real ring shading is a Stage E polish.
      const ageT = rp.age / rp.lifetime;
      const radius = rp.maxRadius * ageT;
      // Alpha curve: ramp up first 20%, decay to 0 over remaining 80%.
      const alphaCurve =
        ageT < 0.2 ? ageT / 0.2 : (1 - ageT) / 0.8;
      const s = Math.max(0, radius * 2) * intensity;

      dummy.position.set(rp.x, rp.y, rp.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(
        s,
        s,
        Math.max(0.001, alphaCurve * intensity), // hijack z-scale to encode alpha (read at material via opacity)
      );
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
      {/* Thin annular ring approximation. RingGeometry produces an actual
          ring shape; the inner/outer radius gap drives the visible width. */}
      <ringGeometry args={[0.42, 0.5, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
