/**
 * HexOutline — thin wireframe overlay drawn at each hex's edges.
 *
 * Per session 14: lets the operator SEE the grid while exploring composition.
 * Optional and toggleable — the grid should be invisible in production but
 * visible during authoring so the hex baseline is legible.
 *
 * Renders as a single merged Line2 geometry — N hexes × 6 segments each,
 * with transparent material. Sits slightly above plot caps via yOffset.
 */

"use client";

import { useMemo } from "react";

import {
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
} from "three";

import { hexToWorld, hexVertices, type HexCoord } from "@/lib/hex";

interface HexOutlineProps {
  readonly coords: readonly HexCoord[];
  readonly size: number;
  readonly color: string;
  readonly opacity: number;
  readonly yOffset?: number;
}

export function HexOutline({
  coords,
  size,
  color,
  opacity,
  yOffset = 0.05,
}: HexOutlineProps) {
  const lineSegments = useMemo(() => {
    const verts = hexVertices(size);
    const positions: number[] = [];
    for (const coord of coords) {
      const [cx, cz] = hexToWorld(coord, size);
      // 6 segments, vertex[i] → vertex[i+1]
      for (let i = 0; i < 6; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % 6];
        positions.push(cx + a[0], yOffset, cz + a[1]);
        positions.push(cx + b[0], yOffset, cz + b[1]);
      }
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const mat = new LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    return new LineSegments(geo, mat);
  }, [coords, size, color, opacity, yOffset]);

  return <primitive object={lineSegments} />;
}
