/**
 * LeafSwirl — wood ambient VFX. Drifting leaves over a hex cluster.
 *
 * Session 17 Stage B primitive. Follows Rain.tsx's pattern verbatim:
 *   - ONE BufferGeometry (small flat quad) + InstancedMesh → single draw call
 *   - ONE useFrame loop updates ALL leaves
 *   - Confined to a set of HEX TILES via the tile inradius
 *   - No per-frame allocations
 *
 * Visual register:
 *   - Cel-toon meshToonMaterial under DEFAULT_TOON_GRADIENT (same as Rain)
 *   - Color palette: canopyGreen for spring-summer flavors, canopyAutumn
 *     for warm flavors. Operator can flavor-swap via the `palette` prop.
 *   - Leaves rotate slowly while drifting + falling — reads as alive but
 *     never busy (operator: "if you can't see the bear, you've overdone it").
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { InstancedMesh, Object3D } from "three";
import { Object3D as Obj3D } from "three";

import { hexToWorld, type HexCoord } from "@/lib/hex";

import { DEFAULT_TOON_GRADIENT } from "../celShading";

// ── Leaf state ─────────────────────────────────────────────────────────────

interface Leaf {
  x: number;
  y: number;
  z: number;
  /** Horizontal drift velocities (xz units/s). */
  vx: number;
  vz: number;
  /** Fall speed (negative y velocity, units/s). */
  vy: number;
  /** Spin rate (rad/s). */
  spin: number;
  /** Current rotation (rad). */
  rot: number;
  /** Owning tile index (for respawn). */
  tileIndex: number;
  /** Per-leaf color index. */
  hueIndex: number;
  /** Per-leaf scale multiplier (0.6..1.4). */
  scaleJitter: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spawnLeaf(
  leaf: Leaf,
  tileCenter: readonly [number, number],
  inradius: number,
  ceilingY: number,
  rand: () => number,
  tileIndex: number,
) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * inradius * 0.85;
  leaf.x = tileCenter[0] + Math.cos(a) * r;
  leaf.z = tileCenter[1] + Math.sin(a) * r;
  leaf.y = ceilingY + rand() * 0.4;
  // Gentle horizontal swirl + slow fall.
  const driftAngle = rand() * Math.PI * 2;
  const driftSpeed = 0.25 + rand() * 0.35;
  leaf.vx = Math.cos(driftAngle) * driftSpeed;
  leaf.vz = Math.sin(driftAngle) * driftSpeed;
  leaf.vy = -(0.35 + rand() * 0.45);
  leaf.spin = (rand() - 0.5) * 2.0;
  leaf.rot = rand() * Math.PI * 2;
  leaf.tileIndex = tileIndex;
  leaf.hueIndex = Math.floor(rand() * 1024);
  leaf.scaleJitter = 0.65 + rand() * 0.75;
}

// ── Component ──────────────────────────────────────────────────────────────

export interface LeafSwirlProps {
  readonly tiles: readonly HexCoord[];
  readonly hexSize: number;
  /** Total leaves across all tiles. */
  readonly count?: number;
  readonly ceilingY?: number;
  readonly groundY?: number;
  /**
   * Hue palette — leaf picks one index per spawn. Use canopyGreen for
   * spring/summer, canopyAutumn for warm flavor.
   */
  readonly palette?: readonly string[];
  /**
   * 0..1 visibility multiplier. Multiplies each leaf's scale. At 0, leaves
   * are invisible (scale 0); at 1, full size. Lets the composer modulate
   * intensity by element-resonance × trigger ramp without re-allocating.
   */
  readonly intensity?: number;
  /** Base leaf scale (world units of the long axis). */
  readonly leafScale?: number;
  readonly seed?: number;
}

const DEFAULT_PALETTE = ["#6fae3e", "#82bd52", "#5a9836", "#9bc77a"];

export function LeafSwirl({
  tiles,
  hexSize,
  count = 80,
  ceilingY = 3.2,
  groundY = 0,
  palette = DEFAULT_PALETTE,
  intensity = 1,
  leafScale = 0.14,
  seed = 0x1ea1,
}: LeafSwirlProps) {
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

  const leaves = useMemo<Leaf[]>(() => {
    if (tileCenters.length === 0 || safeCount === 0) return [];
    const rand = mulberry32(seed);
    const out: Leaf[] = new Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      const tileIdx = i % tileCenters.length;
      const leaf: Leaf = {
        x: 0, y: 0, z: 0, vx: 0, vz: 0, vy: 0,
        spin: 0, rot: 0, tileIndex: tileIdx,
        hueIndex: 0, scaleJitter: 1,
      };
      spawnLeaf(leaf, tileCenters[tileIdx], inradius, ceilingY, rand, tileIdx);
      // Spread initial y across the whole column so the field is full at t=0.
      leaf.y = groundY + rand() * (ceilingY - groundY);
      out[i] = leaf;
    }
    return out;
  }, [safeCount, tileCenters, inradius, ceilingY, groundY, seed]);

  const respawnRand = useMemo(
    () => leaves.map((_, i) => mulberry32(seed + 11 + i * 2731)),
    [leaves, seed],
  );

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh || leaves.length === 0) return;
    const clampedDt = Math.min(dt, 1 / 30);

    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      l.y += l.vy * clampedDt;
      l.x += l.vx * clampedDt;
      l.z += l.vz * clampedDt;
      l.rot += l.spin * clampedDt;

      // Hit ground → respawn at ceiling within owning tile.
      if (l.y <= groundY) {
        const r = respawnRand[i];
        spawnLeaf(l, tileCenters[l.tileIndex], inradius, ceilingY, r, l.tileIndex);
      }

      // Drift confinement — if a leaf wanders past 1.2 * inradius from its
      // tile center on the xz plane, gently nudge its velocity back. Cheaper
      // than a strict clamp, reads as "wind shape" not a fence.
      const cx = tileCenters[l.tileIndex][0];
      const cz = tileCenters[l.tileIndex][1];
      const dx = l.x - cx;
      const dz = l.z - cz;
      const dist2 = dx * dx + dz * dz;
      const maxDist = inradius * 1.2;
      if (dist2 > maxDist * maxDist) {
        l.vx -= (dx / Math.sqrt(dist2)) * 0.4 * clampedDt;
        l.vz -= (dz / Math.sqrt(dist2)) * 0.4 * clampedDt;
      }

      const s = leafScale * l.scaleJitter * intensity;
      dummy.position.set(l.x, l.y, l.z);
      // Tilt to a face-on read with slight Z spin for tumble feel.
      dummy.rotation.set(Math.PI / 3, l.rot * 0.6, l.rot);
      dummy.scale.set(s, s * 0.7, s * 0.3);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (tiles.length === 0 || safeCount === 0) return null;

  // Average palette color for the material — per-leaf hue variance would
  // require an InstancedBufferAttribute + custom shader; we keep one color
  // for Stage B and let palette index drive that color externally.
  const meshColor = palette[0] ?? "#6fae3e";

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, safeCount]}
      frustumCulled={false}
    >
      {/* Thin elongated box reads as a leaf in cel-toon at small scales. */}
      <boxGeometry args={[1, 1, 0.18]} />
      <meshToonMaterial
        color={meshColor}
        gradientMap={DEFAULT_TOON_GRADIENT}
        transparent
        opacity={0.88}
      />
    </instancedMesh>
  );
}
