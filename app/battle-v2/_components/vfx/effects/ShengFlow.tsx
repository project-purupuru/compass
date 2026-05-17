/**
 * ShengFlow — animated connection lines tracing the sheng (generative)
 * cycle through a set of anchors.
 *
 * Makes the wuxing substrate VISUALLY READABLE in the realm-scene: the
 * eye walks wood→fire→earth→metal→water→wood through faint glowing arcs.
 * Honors `[[honeycomb-substrate]]` framing — substrate as visible
 * infrastructure, not invisible plumbing.
 *
 * Cheap implementation:
 *   - For each adjacent sheng-pair, render a thin tube (cylinderGeometry)
 *     stretched along the segment between the two anchors
 *   - A slow per-segment hue oscillation reads as "current flowing"
 *   - Y-elevation low (just above ground) so it doesn't crowd the air-
 *     borne particles
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

import { SHENG_SEQUENCE, ELEMENT_META, type ElementIdT } from "@/lib/wuxing/element";

interface PentagonAnchor {
  readonly element: ElementIdT;
  readonly center: readonly [number, number];
}

export interface ShengFlowProps {
  readonly anchors: readonly PentagonAnchor[];
  /** Y offset above ground. */
  readonly yOffset?: number;
  /** Tube radius. */
  readonly tubeRadius?: number;
  /** Master intensity (0..1). */
  readonly intensity?: number;
}

export function ShengFlow({
  anchors,
  yOffset = 0.04,
  tubeRadius = 0.12,
  intensity = 1,
}: ShengFlowProps) {
  // Build the 5 sheng-adjacent segments. For each pair (a, b) in
  // SHENG_SEQUENCE order, find the corresponding anchors.
  const segments = useMemo(() => {
    const byElement = new Map(anchors.map((a) => [a.element, a]));
    const out: {
      from: ElementIdT;
      to: ElementIdT;
      mid: readonly [number, number];
      length: number;
      yaw: number;
      color: string;
    }[] = [];
    for (let i = 0; i < SHENG_SEQUENCE.length; i++) {
      const from = SHENG_SEQUENCE[i];
      const to = SHENG_SEQUENCE[(i + 1) % SHENG_SEQUENCE.length];
      const a = byElement.get(from);
      const b = byElement.get(to);
      if (!a || !b) continue;
      const dx = b.center[0] - a.center[0];
      const dz = b.center[1] - a.center[1];
      const length = Math.sqrt(dx * dx + dz * dz);
      const yaw = Math.atan2(dz, dx);
      const mid: readonly [number, number] = [
        (a.center[0] + b.center[0]) / 2,
        (a.center[1] + b.center[1]) / 2,
      ];
      // Blend from-element hue toward to-element hue (mid-point color).
      const color = blendHex(
        ELEMENT_META[from].canonicalHue,
        ELEMENT_META[to].canonicalHue,
        0.5,
      );
      out.push({ from, to, mid, length, yaw, color });
    }
    return out;
  }, [anchors]);

  const meshRefs = useRef<(Mesh | null)[]>([]);
  meshRefs.current = new Array(segments.length).fill(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < segments.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      // Subtle pulse, offset per-segment so they shimmer in sequence.
      const pulse = 0.85 + 0.15 * Math.sin(t * 1.4 + i * 0.6);
      mesh.scale.set(1, 1, pulse);
    }
  });

  if (segments.length === 0 || intensity <= 0.01) return null;

  return (
    <group>
      {segments.map((seg, i) => (
        <mesh
          key={`sheng-${seg.from}-${seg.to}`}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[seg.mid[0], yOffset, seg.mid[1]]}
          rotation={[0, -seg.yaw, Math.PI / 2]}
        >
          {/* Cylinder along Y axis (default). Rotation Z=π/2 then rotates
              it to lie along the X axis; rotation Y=-yaw aligns to segment. */}
          <cylinderGeometry args={[tubeRadius, tubeRadius, seg.length, 8]} />
          <meshBasicMaterial
            color={seg.color}
            transparent
            opacity={0.38 * intensity}
          />
        </mesh>
      ))}
    </group>
  );
}

function blendHex(a: string, b: string, t: number): string {
  const ma = a.match(/^#([0-9a-f]{6})$/i);
  const mb = b.match(/^#([0-9a-f]{6})$/i);
  if (!ma || !mb) return a;
  const ar = parseInt(ma[1].slice(0, 2), 16);
  const ag = parseInt(ma[1].slice(2, 4), 16);
  const ab = parseInt(ma[1].slice(4, 6), 16);
  const br = parseInt(mb[1].slice(0, 2), 16);
  const bg = parseInt(mb[1].slice(2, 4), 16);
  const bb = parseInt(mb[1].slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}
