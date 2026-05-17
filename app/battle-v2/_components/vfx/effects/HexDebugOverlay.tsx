/**
 * HexDebugOverlay — visual debug surface for the hex terrain renderer.
 *
 * Per session 14 (2026-05-17). Operator needs to SEE what's actually being
 * rendered to diagnose the elevation/cliff/water bugs. This overlay layers:
 *
 *   - Per-tile floating LABELS: coord (q,r) + biome + elevation
 *   - WIREFRAME OUTLINE per tile cap (showing actual cap geometry, not the
 *     plot-perimeter HexOutline overlay)
 *   - Corner Y dots: small spheres at each blended corner position so the
 *     operator can see exactly where caps and walls meet
 *   - World axes at scene origin (red/green/blue = x/y/z)
 *
 * Toggleable via DebugConfig knobs in PostPane.
 */

"use client";

import { useMemo } from "react";

import { Html, Line } from "@react-three/drei";
import {
  BufferGeometry,
  Float32BufferAttribute,
  type Vector3Tuple,
} from "three";

import { hexToWorld, hexVertices, type HexCoord } from "@/lib/hex";

interface CapDebugInfo {
  readonly coord: HexCoord;
  readonly biomeLabel: string;
  readonly elevation: number;
  readonly cornerYs: readonly number[];
}

interface HexDebugOverlayProps {
  readonly caps: readonly CapDebugInfo[];
  readonly size: number;
  readonly showLabels?: boolean;
  readonly showCornerDots?: boolean;
  readonly showCapWireframe?: boolean;
  readonly showAxes?: boolean;
}

/** Small RGB axes at scene origin. */
function WorldAxes({ length }: { length: number }) {
  const xGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute([0, 0, 0, length, 0, 0], 3));
    return g;
  }, [length]);
  const yGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute([0, 0, 0, 0, length, 0], 3));
    return g;
  }, [length]);
  const zGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute([0, 0, 0, 0, 0, length], 3));
    return g;
  }, [length]);
  return (
    <group>
      <lineSegments geometry={xGeo}>
        <lineBasicMaterial color="#ff4040" linewidth={2} depthTest={false} />
      </lineSegments>
      <lineSegments geometry={yGeo}>
        <lineBasicMaterial color="#40ff40" linewidth={2} depthTest={false} />
      </lineSegments>
      <lineSegments geometry={zGeo}>
        <lineBasicMaterial color="#4080ff" linewidth={2} depthTest={false} />
      </lineSegments>
    </group>
  );
}

/** Wireframe outline of a tile's actual cap triangle fan. */
function CapWireframe({
  position,
  size,
  elev,
  cornerYs,
}: {
  position: Vector3Tuple;
  size: number;
  elev: number;
  cornerYs: readonly number[];
}) {
  const verts = useMemo(() => hexVertices(size), [size]);
  const points = useMemo(() => {
    // Build line segments for cap triangle fan: center → each corner,
    // plus each corner → next corner.
    const pts: Vector3Tuple[] = [];
    for (let i = 0; i < verts.length; i++) {
      const next = (i + 1) % verts.length;
      // center to corner
      pts.push([0, elev, 0]);
      pts.push([verts[i][0], cornerYs[i], verts[i][1]]);
      // corner to next corner (perimeter)
      pts.push([verts[i][0], cornerYs[i], verts[i][1]]);
      pts.push([verts[next][0], cornerYs[next], verts[next][1]]);
    }
    return pts;
  }, [verts, elev, cornerYs]);

  return (
    <group position={position}>
      {points.length > 0 && (
        <Line
          points={points.map((p) => p as [number, number, number])}
          color="#ff00ff"
          lineWidth={1}
          segments
          transparent
          opacity={0.6}
          depthTest={false}
        />
      )}
    </group>
  );
}

/** Floating label above a tile showing coord + biome + elev. */
function TileLabel({
  position,
  text,
}: {
  position: Vector3Tuple;
  text: string;
}) {
  return (
    <Html
      position={position}
      center
      style={{
        background: "rgba(15, 10, 6, 0.85)",
        color: "#f3e9d2",
        padding: "3px 6px",
        borderRadius: 4,
        fontSize: 10,
        fontFamily: "var(--font-puru-mono, monospace)",
        whiteSpace: "nowrap",
        border: "1px solid var(--puru-surface-border, #555)",
        pointerEvents: "none",
        transform: "translate3d(0, -50%, 0)",
      }}
    >
      {text}
    </Html>
  );
}

/** Small colored dot at each corner showing its blended Y. */
function CornerDots({
  position,
  size,
  cornerYs,
}: {
  position: Vector3Tuple;
  size: number;
  cornerYs: readonly number[];
}) {
  const verts = useMemo(() => hexVertices(size), [size]);
  return (
    <group position={position}>
      {verts.map((v, i) => (
        <mesh key={i} position={[v[0], cornerYs[i], v[1]]}>
          <sphereGeometry args={[size * 0.04, 8, 8]} />
          <meshBasicMaterial color="#ffd700" depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

export function HexDebugOverlay({
  caps,
  size,
  showLabels = true,
  showCornerDots = true,
  showCapWireframe = true,
  showAxes = true,
}: HexDebugOverlayProps) {
  return (
    <group>
      {showAxes && <WorldAxes length={size * 0.5} />}
      {caps.map((cap) => {
        const [wx, wz] = hexToWorld(cap.coord, size);
        const pos: Vector3Tuple = [wx, 0, wz];
        // Label sits above the max corner.
        const labelY =
          Math.max(...cap.cornerYs, cap.elevation) + size * 0.4;
        return (
          <group key={`${cap.coord.q},${cap.coord.r}`}>
            {showLabels && (
              <TileLabel
                position={[wx, labelY, wz]}
                text={`(${cap.coord.q},${cap.coord.r}) ${cap.biomeLabel}\nelev=${cap.elevation.toFixed(2)}`}
              />
            )}
            {showCapWireframe && (
              <CapWireframe
                position={pos}
                size={size}
                elev={cap.elevation}
                cornerYs={cap.cornerYs}
              />
            )}
            {showCornerDots && (
              <CornerDots position={pos} size={size} cornerYs={cap.cornerYs} />
            )}
          </group>
        );
      })}
    </group>
  );
}
