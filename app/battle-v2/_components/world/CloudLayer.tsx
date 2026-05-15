/**
 * CloudLayer — the raptor flies above the clouds.
 *
 * Per the operator + Gumi's reference pass (2026-05-14): For The King +
 * Island Beekeeper aesthetic — mid-poly painterly, warm sunset lighting,
 * drifting clouds at altitude. The camera is a hawk; therefore the camera is
 * ABOVE the clouds. A halo of soft cumulus around the continent's edges (with
 * a few wandering over the map) gives the soar view its atmosphere AND the
 * stoop view a sky.
 *
 * Each cloud is a small cluster of flat-shaded icospheres — the same
 * procedural-blob vocabulary as `Foliage` and `GroveGrowth`, scaled up and
 * lifted into the sky. Material is warm cream so the directional key paints
 * sunlit tops while the hemisphere bounce shades the undersides — a real-cloud
 * gradient for free.
 *
 * Drift: each cloud rides a slow per-cloud Lissajous (cos/sin with its own
 * amplitude, phase, speed) plus a gentle yaw. Deterministic seed so two
 * renders agree. Cloud shadows fall on the continent inside the directional
 * light's shadow camera (±24); perimeter clouds outside that just paint the
 * horizon.
 */

"use client";

import { useMemo, useRef } from "react";

import type { Group } from "three";

import { buildPuffCluster } from "./clusterGeometry";
import { mulberry32 } from "./Foliage";
import { useThrottledFrame } from "./useThrottledFrame";
import { MAP_SIZE } from "./zones";

interface CloudPuff {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly r: number;
}

interface CloudData {
  readonly base: { readonly x: number; readonly y: number; readonly z: number };
  readonly rotY: number;
  readonly puffs: readonly CloudPuff[];
  readonly drift: {
    readonly ax: number;
    readonly az: number;
    readonly phase: number;
    readonly speed: number;
    readonly rotSpeed: number;
  };
}

const CLOUD_COUNT = 22;
const CLOUD_Y = 22; // raptor soars at y=46, the world breathes at y=0
const CLOUD_Y_JITTER = 4.5;
const CLOUD_DRIFT_AMP = 2.0;
const PERIMETER_SHARE = 0.75; // weight toward the halo; few wander over the map
const CLOUD_COLOR = "#f6f1e6"; // warm cream — sunlit cumulus

function buildClouds(): CloudData[] {
  const rand = mulberry32(0xc10d);
  const clouds: CloudData[] = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const onPerimeter = rand() < PERIMETER_SHARE;
    let x: number;
    let z: number;
    if (onPerimeter) {
      // A halo around the continent — annulus radius 0.55..0.9 × MAP_SIZE.
      const a = rand() * Math.PI * 2;
      const r = MAP_SIZE * (0.55 + rand() * 0.35);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
    } else {
      // A few wanderers over the map — sparse so they don't crowd the action.
      x = (rand() - 0.5) * MAP_SIZE * 0.85;
      z = (rand() - 0.5) * MAP_SIZE * 0.85;
    }
    const y = CLOUD_Y + (rand() - 0.5) * CLOUD_Y_JITTER;
    const nPuffs = 3 + Math.floor(rand() * 3); // 3..5 puffs per cluster
    const puffs: CloudPuff[] = [];
    for (let p = 0; p < nPuffs; p++) {
      puffs.push({
        x: (rand() - 0.5) * 2.4,
        y: (rand() - 0.5) * 0.7,
        z: (rand() - 0.5) * 1.9,
        r: 0.9 + rand() * 0.7, // 0.9..1.6 — varying lobe sizes for cumulus shape
      });
    }
    clouds.push({
      base: { x, y, z },
      rotY: rand() * Math.PI * 2,
      puffs,
      drift: {
        ax: CLOUD_DRIFT_AMP * (0.6 + rand() * 0.8),
        az: CLOUD_DRIFT_AMP * (0.6 + rand() * 0.8),
        phase: rand() * Math.PI * 2,
        speed: 0.05 + rand() * 0.06, // very slow — clouds barely move
        rotSpeed: (rand() - 0.5) * 0.025, // a gentle yaw, like wind shear
      },
    });
  }
  return clouds;
}

export function CloudLayer() {
  const clouds = useMemo(buildClouds, []);
  const groupRefs = useRef<(Group | null)[]>([]);

  // One merged BufferGeometry per cloud with spherical-pivot normals — the
  // cluster reads as ONE cumulus instead of separate lumps. Per the dig.
  const cloudGeos = useMemo(
    () =>
      clouds.map((c) =>
        buildPuffCluster(
          c.puffs.map((p) => ({
            offset: [p.x, p.y, p.z] as const,
            radius: p.r,
            detail: 1,
          })),
        ),
      ),
    [clouds],
  );

  useThrottledFrame(12, (frame) => {
    const t = frame.clock.getElapsedTime();
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const g = groupRefs.current[i];
      if (!g) continue;
      g.position.x = c.base.x + Math.cos(t * c.drift.speed + c.drift.phase) * c.drift.ax;
      g.position.z = c.base.z + Math.sin(t * c.drift.speed + c.drift.phase) * c.drift.az;
      g.rotation.y = c.rotY + t * c.drift.rotSpeed;
    }
  });

  return (
    <group>
      {clouds.map((c, i) => (
        <group
          key={i}
          ref={(el) => void (groupRefs.current[i] = el)}
          position={[c.base.x, c.base.y, c.base.z]}
        >
          {/* ONE mesh, ONE merged geometry, spherical-pivot normals — the
              dig's painterly-cluster trick. Smooth shading is required;
              flatShading would discard the normal override and re-fragment
              the cluster. The faceted SILHOUETTE still reads because the
              icosphere is low-poly; the LIGHTING flows across the cluster
              as one organic volume. */}
          <mesh geometry={cloudGeos[i]} castShadow>
            <meshStandardMaterial color={CLOUD_COLOR} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
