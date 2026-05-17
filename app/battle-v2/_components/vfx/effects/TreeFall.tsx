/**
 * TreeFall — the canonical Purupuru tree falling onto the canonical ground.
 *
 * Per session-14 VFX-lab kickoff. Geometry is the SAME shape GroveGrowth
 * uses (trunk cylinder + buildPuffCluster canopy with spherical-pivot
 * normals) — the tree the grove grows IS the tree that falls. Stays
 * coherent with the world; tree-fall doesn't introduce a new species.
 *
 * Fall motion: the whole tree-group pivots at the trunk base (y=0), rotates
 * along an axis perpendicular to `fallDirection` from 0 → π/2 over
 * `fallDurationMs`, then dust + impact ripple emit at landing.
 *
 * Trigger pattern: bump `triggerKey` to restart the animation. Matches the
 * cycle-bump convention in puppet-3d/page.tsx.
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, Points } from "three";
import {
  BufferAttribute,
  BufferGeometry,
  Vector3,
} from "three";

import { Outlines } from "@react-three/drei";

import { buildPuffCluster } from "../../world/clusterGeometry";
import { mulberry32 } from "../../world/Foliage";
import { PALETTE } from "../../world/palette";
import { DEFAULT_TOON_GRADIENT } from "../celShading";
import type { TreeFallConfigT, TreeFlavorT } from "../VfxConfig";

const INK_COLOR = "#2a1f12";
const INK_THICKNESS = 4;

// Canonical Purupuru tree canopy — same shape as GroveGrowth.
const UNIT_CANOPY_GEO = buildPuffCluster(
  [
    { offset: [0, 1.05, 0], radius: 0.92, detail: 1 },
    { offset: [0.22, 1.55, 0.14], radius: 0.58, detail: 1 },
  ],
  [0.05, 1.25, 0.03],
);

/** Sakura is reserved for legendary moments (codex). Soft pink. */
const SAKURA_HUE = "#f3b6cf";

function pickCanopyHue(flavor: TreeFlavorT, seed: number): string {
  const rand = mulberry32(seed);
  if (flavor === "sakura") return SAKURA_HUE;
  const band =
    flavor === "autumn" ? PALETTE.canopyAutumn : PALETTE.canopyGreen;
  return band[Math.floor(rand() * band.length)];
}

interface TreeFallPreviewProps {
  readonly config: TreeFallConfigT;
  readonly triggerKey: number;
  /** Where on the ground the tree starts. */
  readonly origin?: readonly [number, number, number];
  readonly seed?: number;
}

interface DustParticle {
  readonly origin: Vector3;
  readonly velocity: Vector3;
  readonly maxLifeMs: number;
  age: number;
}

export function TreeFallPreview({
  config,
  triggerKey,
  origin = [0, 0, 0],
  seed = 0xfa11,
}: TreeFallPreviewProps) {
  const groupRef = useRef<Group | null>(null);
  const dustRef = useRef<Points | null>(null);
  const rippleRef = useRef<Mesh | null>(null);

  // Animation state — restarts when triggerKey bumps.
  const elapsedRef = useRef(0);
  const dustRef2 = useRef<DustParticle[]>([]);
  const dustPositions = useRef<Float32Array | null>(null);
  const dustAlpha = useRef(0);
  const rippleAlpha = useRef(0);
  const rippleScale = useRef(0);

  const canopyHue = useMemo(
    () => pickCanopyHue(config.treeFlavor, seed),
    [config.treeFlavor, seed],
  );

  // Fall axis: perpendicular to the fall direction, in the XZ plane.
  const fallAxis = useMemo(() => {
    const dir = new Vector3(
      Math.cos(config.fallDirection),
      0,
      Math.sin(config.fallDirection),
    );
    // Axis is dir × Y — the tree rotates around this so it tips toward dir.
    return new Vector3().crossVectors(dir, new Vector3(0, 1, 0)).normalize();
  }, [config.fallDirection]);

  // Dust geometry — fixed-size buffer, count = dustParticleCount.
  const dustGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(config.dustParticleCount * 3);
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    dustPositions.current = positions;
    return geo;
  }, [config.dustParticleCount]);

  // Restart animation on triggerKey change.
  useEffect(() => {
    elapsedRef.current = 0;
    dustRef2.current = [];
    dustAlpha.current = 0;
    rippleAlpha.current = 0;
    rippleScale.current = 0;
    // Reset rotation
    const g = groupRef.current;
    if (g) g.rotation.set(0, 0, 0);
  }, [triggerKey]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const dtMs = dt * 1000;
    elapsedRef.current += dtMs;
    const t = elapsedRef.current;

    const g = groupRef.current;
    if (!g) return;

    // ── Fall phase ────────────────────────────────────────────────────────
    const fallT = Math.min(t / config.fallDurationMs, 1);
    // Ease — quadratic accelerate (gravity-like), with tiny bounce after.
    const fallAngle = (Math.PI / 2) * Math.pow(fallT, 1.6);
    g.setRotationFromAxisAngle(fallAxis, fallAngle);

    // Optional bounce after landing — a small back-rotation oscillation.
    if (fallT >= 1 && config.bounceDamping > 0) {
      const sinceLand = t - config.fallDurationMs;
      const bounceDecay = Math.exp(-sinceLand * 0.006);
      const bounce =
        Math.sin(sinceLand * 0.022) * 0.08 * config.bounceDamping * bounceDecay;
      g.setRotationFromAxisAngle(fallAxis, Math.PI / 2 + bounce);
    }

    // ── Impact emission (dust + ripple) ───────────────────────────────────
    const impactAt = config.fallDurationMs + config.groundImpactDelayMs;
    const justImpacted =
      t >= impactAt && t - dtMs < impactAt;

    if (justImpacted) {
      // Where the trunk's top now sits (fall direction × trunk length).
      const trunkLen = config.treeScale;
      const impactPoint = new Vector3(
        origin[0] + Math.cos(config.fallDirection) * trunkLen,
        0,
        origin[2] + Math.sin(config.fallDirection) * trunkLen,
      );
      // Seed dust particles at impact point.
      const rand = mulberry32(seed + Math.floor(t));
      const particles: DustParticle[] = [];
      for (let i = 0; i < config.dustParticleCount; i++) {
        const a = rand() * Math.PI * 2;
        const speed = 1.4 + rand() * 1.6;
        const lift = 0.8 + rand() * 1.4;
        particles.push({
          origin: impactPoint.clone(),
          velocity: new Vector3(
            Math.cos(a) * speed,
            lift,
            Math.sin(a) * speed,
          ),
          maxLifeMs: 600 + rand() * 600,
          age: 0,
        });
      }
      dustRef2.current = particles;
      dustAlpha.current = 1;
      rippleAlpha.current = 0.7;
      rippleScale.current = 0.1;
    }

    // ── Dust step ─────────────────────────────────────────────────────────
    const positions = dustPositions.current;
    if (positions && dustRef2.current.length > 0) {
      let oldestAlpha = 0;
      for (let i = 0; i < dustRef2.current.length; i++) {
        const p = dustRef2.current[i];
        p.age += dtMs;
        const lifeT = Math.min(p.age / p.maxLifeMs, 1);
        // Simple ballistic — gravity 4 units/s², damping 0.92/s
        p.velocity.y -= 4 * dt;
        p.velocity.multiplyScalar(Math.pow(0.92, dt * 60));
        const pos = p.origin
          .clone()
          .addScaledVector(p.velocity, p.age / 1000);
        positions[i * 3 + 0] = pos.x;
        positions[i * 3 + 1] = Math.max(pos.y, 0.02);
        positions[i * 3 + 2] = pos.z;
        oldestAlpha = Math.max(oldestAlpha, 1 - lifeT);
      }
      dustAlpha.current = oldestAlpha;
      (dustGeometry.attributes.position as BufferAttribute).needsUpdate = true;
    }

    // ── Ripple step ───────────────────────────────────────────────────────
    if (rippleAlpha.current > 0.001) {
      const r = rippleRef.current;
      if (r) {
        const sinceLand = Math.max(0, t - impactAt);
        const rt = Math.min(sinceLand / 700, 1);
        const scale = 0.1 + rt * config.impactRippleRadius;
        r.scale.set(scale, scale, 1);
        rippleAlpha.current = 0.7 * (1 - rt);
        const mat = (r.material as { opacity?: number }) ?? null;
        if (mat) mat.opacity = rippleAlpha.current;
      }
    }
  });

  return (
    <group position={origin}>
      {/* The tree itself — pivots at trunk base (y=0). */}
      <group ref={groupRef}>
        {/* Trunk — same args as GroveGrowth: tapered cylinder. */}
        <mesh
          position={[0, 0.5 * config.treeScale, 0]}
          scale={[config.treeScale, config.treeScale, config.treeScale]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.11, 0.17, 1, 6]} />
          <meshToonMaterial color={PALETTE.trunk} gradientMap={DEFAULT_TOON_GRADIENT} />
          <Outlines color={INK_COLOR} thickness={INK_THICKNESS} />
        </mesh>
        {/* Canopy — merged puff cluster, smooth-shaded, low-poly silhouette. */}
        <mesh
          geometry={UNIT_CANOPY_GEO}
          scale={config.treeScale}
          castShadow
          receiveShadow
        >
          <meshToonMaterial color={canopyHue} gradientMap={DEFAULT_TOON_GRADIENT} />
          <Outlines color={INK_COLOR} thickness={INK_THICKNESS} />
        </mesh>
      </group>

      {/* Dust particles — Points on a buffer geometry. */}
      <points ref={dustRef} geometry={dustGeometry} frustumCulled={false}>
        <pointsMaterial
          color={config.dustColor}
          size={0.12}
          sizeAttenuation
          transparent
          opacity={dustAlpha.current}
          depthWrite={false}
        />
      </points>

      {/* Impact ripple — single ring, expands + fades. */}
      <mesh
        ref={rippleRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          Math.cos(config.fallDirection) * config.treeScale,
          0.01,
          Math.sin(config.fallDirection) * config.treeScale,
        ]}
      >
        <ringGeometry args={[0.95, 1.0, 48]} />
        <meshBasicMaterial
          color={config.dustColor}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
