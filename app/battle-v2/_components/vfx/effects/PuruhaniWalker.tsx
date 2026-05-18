/**
 * PuruhaniWalker — element-bound paper-puppet companion wandering a zone.
 *
 * PAPER-PUPPET DOCTRINE LOCKED ([[feedback_paper-puppet-doctrine-locked]]).
 * Characters are 2D billboard sprites — NEVER 3D geometry. This walker
 * uses the actual canonical Puruhani PNG asset (one per element) plus
 * <Billboard> + <SpriteSheetPlane> from the existing puppet substrate.
 *
 * Walk semantics per [[feedback_walking-not-flipping]]:
 *   - Walk locomotion = position interpolation toward a target tile (no
 *     rotation; the sprite is a billboard always facing camera).
 *   - Direction change = horizontal scale flip (scaleX 1 ↔ -1) when the
 *     walker's x-velocity changes sign — the asset is 2D, so we mirror
 *     it via scale rather than the DOM's rotateY hinge.
 *
 * Per-element gait profile sourced from codex puruhani trait pairs:
 *   - Wood: Happy        — steady, hums softly
 *   - Fire: Nefarious    — quicker, jittery
 *   - Earth: Exhausted   — slow, naps often
 *   - Metal: Loving      — careful, deliberate
 *   - Water: Overwhelmed — gentle drift, longer pauses
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Billboard, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, Texture } from "three";
import { SRGBColorSpace } from "three";

import { hexToWorld, type HexCoord } from "@/lib/hex";
import { type ElementIdT } from "@/lib/wuxing/element";

interface WalkerState {
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  /** Last x-velocity sign — drives the mirror flip. */
  lastVxSign: number;
  facingFlipped: boolean;
  idleRemaining: number;
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

const PURUHANI_ASSET: Record<ElementIdT, string> = {
  wood: "/art/puruhani/puruhani-wood.png",
  fire: "/art/puruhani/puruhani-fire.png",
  earth: "/art/puruhani/puruhani-earth.png",
  metal: "/art/puruhani/puruhani-metal.png",
  water: "/art/puruhani/puruhani-water.png",
};

interface Gait {
  readonly speed: number;
  readonly idleMs: readonly [number, number];
  readonly bobHz: number;
  readonly bobAmp: number;
}
const GAITS: Record<ElementIdT, Gait> = {
  wood:  { speed: 0.6,  idleMs: [600, 1800], bobHz: 1.8, bobAmp: 0.04 },
  fire:  { speed: 0.95, idleMs: [200, 900],  bobHz: 3.0, bobAmp: 0.07 },
  earth: { speed: 0.35, idleMs: [1800, 4200], bobHz: 0.9, bobAmp: 0.02 },
  metal: { speed: 0.5,  idleMs: [900, 2200], bobHz: 1.4, bobAmp: 0.025 },
  water: { speed: 0.45, idleMs: [1200, 2800], bobHz: 1.2, bobAmp: 0.05 },
};

export interface PuruhaniWalkerProps {
  readonly tiles: readonly HexCoord[];
  readonly hexSize: number;
  readonly element: ElementIdT;
  /** Sprite height in world units (default ~hexSize/3). */
  readonly heightWorld?: number;
  readonly seed?: number;
}

export function PuruhaniWalker({
  tiles,
  hexSize,
  element,
  heightWorld,
  seed = 0x5eed,
}: PuruhaniWalkerProps) {
  const groupRef = useRef<Group | null>(null);
  const spriteRef = useRef<Mesh | null>(null);
  const gait = GAITS[element];

  // Load the actual puruhani sprite via drei's useTexture (Suspense-aware).
  const texture = useTexture(PURUHANI_ASSET[element]) as Texture;
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    // Crisp pixel-ish read while keeping smooth scale-down.
    texture.anisotropy = 4;
  }, [texture]);

  // Derive aspect from texture dimensions for honest planeGeometry sizing.
  const aspect = useMemo(() => {
    const img = texture.image as
      | { width?: number; height?: number; videoWidth?: number; videoHeight?: number }
      | undefined;
    const w = img?.width ?? img?.videoWidth ?? 1;
    const h = img?.height ?? img?.videoHeight ?? 1;
    return w > 0 && h > 0 ? w / h : 1;
  }, [texture]);

  const spriteHeight = heightWorld ?? hexSize * 0.55;
  const spriteWidth = spriteHeight * aspect;

  const tileCenters = useMemo(
    () => tiles.map((c) => hexToWorld(c, hexSize)),
    [tiles, hexSize],
  );

  const rand = useMemo(() => mulberry32(seed), [seed]);

  const stateRef = useRef<WalkerState>(
    (() => {
      const startTile = tileCenters[0] ?? [0, 0];
      return {
        x: startTile[0],
        z: startTile[1],
        targetX: startTile[0],
        targetZ: startTile[1],
        lastVxSign: 0,
        facingFlipped: false,
        idleRemaining: 1.0,
      };
    })(),
  );

  const [, setBump] = useState(0);
  useMemo(() => {
    if (tileCenters.length === 0) return;
    const s = stateRef.current;
    s.x = tileCenters[0][0];
    s.z = tileCenters[0][1];
    s.targetX = s.x;
    s.targetZ = s.z;
    s.idleRemaining = 1.0;
    setBump((b) => b + 1);
  }, [tileCenters]);

  function pickNextTarget(s: WalkerState) {
    if (tileCenters.length === 0) return;
    let attempts = 0;
    while (attempts++ < 6) {
      const idx = Math.floor(rand() * tileCenters.length);
      const [tx, tz] = tileCenters[idx];
      if (Math.hypot(tx - s.x, tz - s.z) > hexSize * 0.5) {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand()) * hexSize * 0.35;
        s.targetX = tx + Math.cos(a) * r;
        s.targetZ = tz + Math.sin(a) * r;
        return;
      }
    }
    const [tx, tz] = tileCenters[Math.floor(rand() * tileCenters.length)];
    s.targetX = tx;
    s.targetZ = tz;
  }

  useFrame((_, dt) => {
    const group = groupRef.current;
    const sprite = spriteRef.current;
    if (!group || !sprite || tileCenters.length === 0) return;
    const s = stateRef.current;
    const clampedDt = Math.min(dt, 1 / 30);

    if (s.idleRemaining > 0) {
      s.idleRemaining -= clampedDt;
      if (s.idleRemaining <= 0) pickNextTarget(s);
    } else {
      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.04) {
        const [minMs, maxMs] = gait.idleMs;
        s.idleRemaining = (minMs + rand() * (maxMs - minMs)) / 1000;
      } else {
        const step = Math.min(dist, gait.speed * clampedDt);
        const nx = dx / dist;
        const nz = dz / dist;
        s.x += nx * step;
        s.z += nz * step;

        // Direction-flip: mirror sprite horizontally when x-velocity sign
        // changes. The flip is a SCALE mirror (sx 1 ↔ -1), not a rotateY
        // hinge — this is a 2D billboard so mirroring is the right tool.
        const vxSign = nx > 0.05 ? 1 : nx < -0.05 ? -1 : s.lastVxSign;
        if (vxSign !== 0 && vxSign !== s.lastVxSign) {
          s.lastVxSign = vxSign;
          // Convention: PNG art faces RIGHT by default. When walking left
          // (vxSign < 0), flip to face left.
          s.facingFlipped = vxSign < 0;
        }
      }
    }

    const t = performance.now() / 1000;
    const bob = Math.sin(t * gait.bobHz * Math.PI * 2) * gait.bobAmp;

    // Plant feet on ground (Y=0 = bottom of sprite). The plane's local
    // origin is at center, so we lift by half-height.
    group.position.set(s.x, bob + spriteHeight / 2, s.z);
    sprite.scale.set(
      spriteWidth * (s.facingFlipped ? -1 : 1),
      spriteHeight,
      1,
    );
  });

  if (tiles.length === 0) return null;

  return (
    <group ref={groupRef}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh ref={spriteRef}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.5}
            depthWrite={false}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
