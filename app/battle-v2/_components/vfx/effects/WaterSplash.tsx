/**
 * WaterSplash — droplet plume + expanding ground-plane ripples + foam disc.
 *
 * Session-14 VFX-lab cycle-1 matchup effect (water side). Renders on the
 * ground plane (operator-locked decision — no dedicated water mesh this
 * session; that's a Sea Street Stalls cycle).
 *
 * Composition:
 *   1. Foam disc — flat ring on the ground, opacity-fades over duration
 *   2. Ripple rings — N expanding torus-flat rings, staggered, fade out
 *   3. Droplets — Points launched on ballistic arcs, splash out + arc back
 *
 * Trigger restart via `triggerKey` bump (same convention as TreeFall).
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  type Mesh,
  type Points,
  Vector3,
} from "three";

import { mulberry32 } from "../../world/Foliage";
import type { WaterSplashConfigT } from "../VfxConfig";

interface Droplet {
  readonly origin: Vector3;
  readonly velocity: Vector3;
  age: number;
  alive: boolean;
}

interface WaterSplashPreviewProps {
  readonly config: WaterSplashConfigT;
  readonly triggerKey: number;
  readonly origin?: readonly [number, number, number];
  readonly seed?: number;
}

export function WaterSplashPreview({
  config,
  triggerKey,
  origin = [0, 0, 0],
  seed = 0x5d1a,
}: WaterSplashPreviewProps) {
  const dropletsRef = useRef<Points | null>(null);
  const foamRef = useRef<Mesh | null>(null);
  const ringRefs = useRef<(Mesh | null)[]>([]);

  const dropletState = useRef<Droplet[]>([]);
  const dropletPositions = useRef<Float32Array | null>(null);
  const elapsedRef = useRef(0);
  const foamAlpha = useRef(0);

  const dropletGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(config.dropletCount * 3);
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    dropletPositions.current = positions;
    return geo;
  }, [config.dropletCount]);

  useEffect(() => {
    elapsedRef.current = 0;
    foamAlpha.current = config.foamOpacity;
    // Spawn droplets at trigger.
    const rand = mulberry32(seed + triggerKey * 13);
    const o = new Vector3(origin[0], 0.05, origin[2]);
    const drops: Droplet[] = [];
    for (let i = 0; i < config.dropletCount; i++) {
      const a = rand() * Math.PI * 2;
      // Outward speed scaled by splashRadius / flight duration to reach edge.
      const speed = (config.splashRadius * (0.7 + rand() * 0.6)) /
        (config.dropletFlightMs / 1000);
      // Vertical lift sized so droplet peaks at dropletPeakHeight.
      // Using v0 = sqrt(2*g*h) with g≈9.8, but tune softer for cartoon arc.
      const lift = Math.sqrt(2 * 6 * config.dropletPeakHeight) *
        (0.7 + rand() * 0.6);
      drops.push({
        origin: o.clone(),
        velocity: new Vector3(
          Math.cos(a) * speed,
          lift,
          Math.sin(a) * speed,
        ),
        age: 0,
        alive: true,
      });
    }
    dropletState.current = drops;
  }, [
    triggerKey,
    seed,
    config.dropletCount,
    config.dropletFlightMs,
    config.dropletPeakHeight,
    config.foamOpacity,
    config.splashRadius,
    origin,
  ]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const dtMs = dt * 1000;
    elapsedRef.current += dtMs;
    const t = elapsedRef.current;

    // ── Droplets ──────────────────────────────────────────────────────────
    const positions = dropletPositions.current;
    if (positions && dropletState.current.length > 0) {
      let anyAlive = false;
      for (let i = 0; i < dropletState.current.length; i++) {
        const d = dropletState.current[i];
        if (!d.alive) {
          positions[i * 3 + 1] = -10;
          continue;
        }
        d.age += dtMs;
        // Ballistic — soft gravity for cartoony arc.
        d.velocity.y -= 6 * dt;
        const pos = d.origin
          .clone()
          .addScaledVector(d.velocity, d.age / 1000);
        if (pos.y <= 0.02 && d.age > 60) {
          d.alive = false;
          positions[i * 3 + 0] = pos.x;
          positions[i * 3 + 1] = 0.02;
          positions[i * 3 + 2] = pos.z;
          continue;
        }
        positions[i * 3 + 0] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;
        anyAlive = true;
      }
      (dropletGeometry.attributes.position as BufferAttribute).needsUpdate =
        true;
      if (!anyAlive && t > config.dropletFlightMs * 1.5) {
        // All landed — let foam keep fading.
      }
    }

    // ── Foam disc ─────────────────────────────────────────────────────────
    const f = foamRef.current;
    if (f) {
      const foamT = Math.min(t / (config.rippleSpreadMs * 1.4), 1);
      // Grow from 0 → splashRadius * 0.7, fade simultaneously.
      const s = 0.1 + foamT * config.splashRadius * 0.7;
      f.scale.set(s, s, 1);
      foamAlpha.current = config.foamOpacity * (1 - foamT);
      const mat = (f.material as { opacity?: number }) ?? null;
      if (mat) mat.opacity = foamAlpha.current;
    }

    // ── Ripple rings ──────────────────────────────────────────────────────
    for (let i = 0; i < config.rippleRingCount; i++) {
      const ring = ringRefs.current[i];
      if (!ring) continue;
      // Stagger each ring by 1/(N+1) of the spread duration.
      const stagger = (i * config.rippleSpreadMs) / (config.rippleRingCount + 1);
      const ringT = Math.max(0, t - stagger) / config.rippleSpreadMs;
      if (ringT <= 0 || ringT >= 1) {
        ring.visible = false;
        continue;
      }
      ring.visible = true;
      const s = 0.05 + ringT * config.splashRadius;
      ring.scale.set(s, s, 1);
      const mat = (ring.material as { opacity?: number }) ?? null;
      if (mat) mat.opacity = 0.55 * (1 - ringT);
    }
  });

  return (
    <group position={origin}>
      {/* Foam disc — flat ring on the ground, fades out. */}
      <mesh
        ref={foamRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
      >
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial
          color={config.foamColor}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Ripple rings — N expanding hollow rings, staggered. */}
      {Array.from({ length: config.rippleRingCount }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => void (ringRefs.current[i] = el)}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02 + i * 0.001, 0]}
          visible={false}
        >
          <ringGeometry args={[0.95, 1.0, 64]} />
          <meshBasicMaterial
            color={config.waterColor}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Droplets — Points with arc trajectories. */}
      <points ref={dropletsRef} geometry={dropletGeometry} frustumCulled={false}>
        <pointsMaterial
          color={config.waterColor}
          size={0.14}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
