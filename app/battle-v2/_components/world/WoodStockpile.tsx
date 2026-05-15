/**
 * WoodStockpile — the bears' haul, made visible at Musubi Station.
 *
 * Per build doc Session 12 (D2). The destination of the supply loop: every
 * time a bear completes a delivery (`BearColony` → `onDeliver`), one more log
 * drops onto the woodpile here. It's the legible payoff — you watch a bear
 * carry a log across the map, and the pile at the station grows by exactly
 * that log.
 *
 * The count is pure presentation (live deliveries this session), not a
 * substrate truth channel — it's juice, the visible trace of the colony
 * working. The grove's *memory* is `activationLevel` (D1); the pile is the
 * heartbeat.
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import type { Vec2 } from "./agents/steering";
import { groundHeight } from "./MapGround";
import { PALETTE } from "./palette";
import { type Spring, stepSpring } from "../vfx/springs";

const LOGS_PER_ROW = 4;
const MAX_LOGS = 24; // 6 rows — the pile ceiling
const LOG_LEN = 0.62;
const LOG_GAP = 0.2;
const ROW_HEIGHT = 0.17;

/** A log dropping onto the pile — light, a small settling bounce. */
const SPRING_DROP: Spring = { mass: 0.5, stiffness: 200, damping: 16 };

interface LogSlot {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Precomputed pile geometry — logs fill row by row, bottom to top. */
const LOG_SLOTS: readonly LogSlot[] = Array.from({ length: MAX_LOGS }, (_, i) => {
  const row = Math.floor(i / LOGS_PER_ROW);
  const col = i % LOGS_PER_ROW;
  // Alternate rows nudge half a gap — logs nestle instead of stacking in a grid.
  const offset = row % 2 === 0 ? 0 : LOG_GAP * 0.5;
  return {
    x: (col - (LOGS_PER_ROW - 1) / 2) * LOG_GAP + offset,
    y: 0.1 + row * ROW_HEIGHT,
    z: (row % 2 === 0 ? 0 : 0.04),
  };
});

interface WoodStockpileProps {
  /** Completed deliveries this session — drives how many logs are on the pile. */
  readonly delivered: number;
  /** Musubi Station position. */
  readonly hub: Vec2;
}

export function WoodStockpile({ delivered, hub }: WoodStockpileProps) {
  const count = Math.min(delivered, MAX_LOGS);

  // Per-log drop spring — 0 = falling/absent, 1 = settled on the pile.
  const drop = useRef<{ value: number; velocity: number }[]>([]);
  const dropTarget = useRef<number[]>([]);
  const logRefs = useRef<(Group | null)[]>([]);
  const hasActiveDrop = useRef(false);

  // Lazy init the spring pool.
  if (drop.current.length === 0) {
    for (let i = 0; i < MAX_LOGS; i++) {
      drop.current[i] = { value: 0, velocity: 0 };
      dropTarget.current[i] = 0;
    }
  }

  // A delivery landed → the next log starts its drop-in.
  useEffect(() => {
    for (let i = 0; i < MAX_LOGS; i++) {
      dropTarget.current[i] = i < count ? 1 : 0;
    }
    hasActiveDrop.current = true;
  }, [count]);

  useFrame((_, delta) => {
    if (!hasActiveDrop.current) return;
    const dt = Math.min(delta, 1 / 30);
    let stillAnimating = false;
    for (let i = 0; i < MAX_LOGS; i++) {
      const s = drop.current[i];
      const target = dropTarget.current[i];
      if (target === 0 && s.value === 0) continue;
      stepSpring(s, target, SPRING_DROP, dt);
      if (Math.abs(s.value - target) > 0.001 || Math.abs(s.velocity) > 0.01) {
        stillAnimating = true;
      }
      const g = logRefs.current[i];
      if (g) {
        const v = Math.max(0, Math.min(1.05, s.value));
        const slot = LOG_SLOTS[i];
        // Drops from ~0.7 units up, settling onto its slot.
        g.position.y = slot.y + (1 - v) * 0.7;
        g.scale.setScalar(v);
        g.visible = v > 0.01;
      }
    }
    hasActiveDrop.current = stillAnimating;
  });

  const groundY = groundHeight();
  const platformR = useMemo(() => LOGS_PER_ROW * LOG_GAP * 0.62, []);

  return (
    <group position={[hub.x, groundY, hub.z]}>
      {/* A low timber platform — Musubi Station gets a visible footprint. */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[platformR, platformR + 0.06, 0.08, 16]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={1} />
      </mesh>

      {LOG_SLOTS.map((slot, i) => (
        <group
          key={i}
          ref={(el) => void (logRefs.current[i] = el)}
          position={[slot.x, slot.y, slot.z]}
          rotation={[0, 0, Math.PI / 2]}
          visible={false}
        >
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.082, 0.092, LOG_LEN, 7]} />
            <meshStandardMaterial color={PALETTE.trunk} roughness={1} />
          </mesh>
          {/* pale cut-end — the woodpile reads as cut timber, not branches */}
          <mesh position={[0, LOG_LEN / 2 + 0.001, 0]}>
            <cylinderGeometry args={[0.082, 0.082, 0.012, 7]} />
            <meshStandardMaterial color={PALETTE.thatch} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
