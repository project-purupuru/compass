/**
 * Rain — bespoke particle primitive for environmental rain VFX.
 *
 * Per session-14-followup PRD (Lane 2 VFX iteration). K-hole dig
 * 2026-05-17-three-quarks-vfx verdict: do NOT adopt three.quarks at our
 * cel-shaded register and 100k+ scale. Roll a small bespoke primitive
 * that:
 *
 *   - Uses ONE BufferGeometry (positions + velocities) + InstancedMesh
 *     for the drop visuals → single draw call
 *   - Single useFrame loop updates ALL drops (this is the engine-substrate
 *     pattern: one system, N entities in a tight loop)
 *   - Confined to a set of HEX TILES (operator spec: "weather can affect
 *     4-7 hexes") — drops only spawn within those tiles' inradii
 *   - Drop lifecycle: spawn at top → fall → wrap when hitting ground →
 *     re-spawn at top with new x,z. Continuous loop, no per-frame allocs.
 *   - Composes with the cel material register: drops use meshToonMaterial
 *     so they band correctly under the same gradient
 *
 * Future: thunder strike (flash + particle burst), tile displacement
 * (drops splash on hit), wind direction. All same recipe: bespoke
 * primitive that fits the visual register.
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { InstancedMesh, Object3D } from "three";
import { Matrix4, Object3D as Obj3D, Vector3 } from "three";

import { hexToWorld, type HexCoord } from "@/lib/hex";

import { DEFAULT_TOON_GRADIENT } from "../celShading";

// ── Drop state ─────────────────────────────────────────────────────────────

interface Drop {
  /** Local position (relative to scene origin). */
  x: number;
  y: number;
  z: number;
  /** Vertical fall speed (world units per second). */
  vy: number;
  /** Random horizontal drift (very small). */
  drift: number;
  /** Which tile this drop "belongs to" — used for respawn pool. */
  tileIndex: number;
  /** Per-drop streak length multiplier (0.6..1.6) — varies thickness. */
  streakLen: number;
  /** Per-drop alpha falloff seed (0..1) — fades drop fronts/tails. */
  alphaPhase: number;
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

/**
 * Spawn a drop within a hex tile's inradius. Polar sampling for even areal
 * density. Y is the spawn ceiling (drops fall from there).
 */
function spawnDrop(
  drop: Drop,
  tileCenter: readonly [number, number],
  inradius: number,
  ceilingY: number,
  rand: () => number,
  tileIndex: number,
) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * inradius * 0.92;
  drop.x = tileCenter[0] + Math.cos(a) * r;
  drop.z = tileCenter[1] + Math.sin(a) * r;
  drop.y = ceilingY + rand() * 0.5;
  drop.vy = -(3.2 + rand() * 1.6); // slightly faster fall = more streak feel
  drop.drift = (rand() - 0.5) * 0.18;
  drop.tileIndex = tileIndex;
  // Varied streak length so the field feels organic, not uniform.
  drop.streakLen = 0.55 + rand() * 1.1; // 0.55..1.65
  drop.alphaPhase = rand();
}

// ── Rain component ────────────────────────────────────────────────────────

interface RainProps {
  /** Hex tiles to rain over. Each spawns its share of drops. */
  readonly tiles: readonly HexCoord[];
  /** Hex circumradius (matches the hex grid). */
  readonly hexSize: number;
  /** Total drop count across all tiles. */
  readonly count?: number;
  /** Spawn ceiling above ground (world units). */
  readonly ceilingY?: number;
  /** Ground Y where drops wrap. */
  readonly groundY?: number;
  /** Drop color (cel-toon). */
  readonly color?: string;
  /** Drop scale. */
  readonly dropScale?: number;
  /** Seed for stable layout. */
  readonly seed?: number;
}

export function Rain({
  tiles,
  hexSize,
  count = 300,
  ceilingY = 4,
  groundY = 0,
  // Warmer grey-blue, closer to the Ghibli palette than the prior cold teal.
  color = "#a8b8c4",
  dropScale = 1,
  seed = 0xa1ce,
  /** Wind tilt in radians around Z — drops fall at slight angle, not straight. */
  windTilt = 0.18,
  /** Material opacity. Lower = softer rain feel. */
  opacity = 0.42,
}: RainProps & { windTilt?: number; opacity?: number }) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const dummy = useMemo<Object3D>(() => new Obj3D(), []);
  const inradius = useMemo(
    () => (Math.sqrt(3) / 2) * hexSize,
    [hexSize],
  );

  // Per-tile world centers — precomputed.
  const tileCenters = useMemo(
    () => tiles.map((c) => hexToWorld(c, hexSize)),
    [tiles, hexSize],
  );

  // Initialize drops: distribute evenly across tiles.
  const drops = useMemo<Drop[]>(() => {
    if (tileCenters.length === 0) return [];
    const rand = mulberry32(seed);
    const out: Drop[] = new Array(count);
    for (let i = 0; i < count; i++) {
      const tileIdx = i % tileCenters.length;
      const drop: Drop = {
        x: 0, y: 0, z: 0, vy: 0, drift: 0, tileIndex: tileIdx,
        streakLen: 1, alphaPhase: 0,
      };
      spawnDrop(drop, tileCenters[tileIdx], inradius, ceilingY, rand, tileIdx);
      drop.y = groundY + rand() * (ceilingY - groundY);
      out[i] = drop;
    }
    return out;
  }, [count, tileCenters, inradius, ceilingY, groundY, seed]);

  // Per-drop respawn rand (one stream per drop for determinism). Stored
  // alongside the drop so per-frame respawns are deterministic.
  const respawnRand = useMemo(
    () => drops.map((_, i) => mulberry32(seed + 1 + i * 7919)),
    [drops, seed],
  );

  // The single update system — one useFrame for ALL drops.
  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh || drops.length === 0) return;
    const clampedDt = Math.min(dt, 1 / 30);

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y += d.vy * clampedDt;
      d.x += d.drift * clampedDt * 0.3;
      d.z += d.drift * clampedDt * 0.5;

      // Wrap when hitting the ground — respawn at top within owning tile.
      if (d.y <= groundY) {
        const r = respawnRand[i];
        spawnDrop(d, tileCenters[d.tileIndex], inradius, ceilingY, r, d.tileIndex);
      }

      // Update the instance transform: streak with slight wind tilt + varied
      // length per drop for organic feel (operator: "too uniform/intense").
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(0, 0, windTilt);
      dummy.scale.set(
        0.018 * dropScale,
        0.22 * dropScale * d.streakLen,
        0.018 * dropScale,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (tiles.length === 0 || count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      {/* Tall thin cylinder = water streak. Few segments for perf. */}
      <cylinderGeometry args={[1, 1, 1, 4]} />
      <meshToonMaterial
        color={color}
        gradientMap={DEFAULT_TOON_GRADIENT}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
