/**
 * PerfReadout — in-scene stats panel for measuring before optimizing.
 *
 * Per session 14 (2026-05-17): operator reported M4 overheating in the lab.
 * Likely cause: 50-100 individual useFrame hooks (one per leaf cluster +
 * water surface + cliff motion + character + etc.) all running each frame.
 *
 * This panel surfaces (live, updated 4x/sec):
 *   - FPS (frames per second over a rolling 250ms window)
 *   - Frame time in ms (1000 / FPS)
 *   - Draw calls (from renderer.info.render.calls)
 *   - Triangle count (from renderer.info.render.triangles)
 *   - Memory: geometries + textures (from renderer.info.memory)
 *   - Programs: shader program count
 *
 * Zero external deps — reads directly from the existing renderer.
 *
 * Mount inside the Canvas (uses useThree + useFrame).
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";

interface PerfStats {
  fps: number;
  ms: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
}

const INITIAL: PerfStats = {
  fps: 0,
  ms: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
};

export function PerfReadout() {
  const { gl } = useThree();
  const [stats, setStats] = useState<PerfStats>(INITIAL);

  // Rolling FPS counter — count frames in a 250ms window.
  const frameTimes = useRef<number[]>([]);
  const lastEmit = useRef<number>(0);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime * 1000; // ms
    frameTimes.current.push(now);
    // Trim window to last 250ms.
    while (
      frameTimes.current.length > 0 &&
      now - frameTimes.current[0] > 250
    ) {
      frameTimes.current.shift();
    }

    if (now - lastEmit.current > 250) {
      lastEmit.current = now;
      const framesIn250ms = frameTimes.current.length;
      const fps = (framesIn250ms / 0.25) | 0;
      const ms = fps > 0 ? +(1000 / fps).toFixed(1) : 0;
      const info = gl.info;
      setStats({
        fps,
        ms,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length ?? 0,
      });
    }
  });

  // Tint FPS based on health.
  const fpsTint =
    stats.fps >= 50
      ? "#94d36a"
      : stats.fps >= 30
        ? "#e1ad3d"
        : "#e85a4a";

  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: "fixed",
        top: 16,
        left: 240, // sit right of the EffectPicker rail
        background: "rgba(15, 10, 6, 0.92)",
        color: "var(--puru-ink-base, #d8cdae)",
        padding: "10px 14px",
        borderRadius: 6,
        fontSize: 11,
        fontFamily: "var(--font-puru-mono, monospace)",
        letterSpacing: "0.05em",
        lineHeight: 1.6,
        border: "1px solid var(--puru-surface-border, #555)",
        pointerEvents: "none",
        minWidth: 180,
        zIndex: 100,
      }}
      fullscreen={false}
      transform={false}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.6 }}>FPS</span>
        <span style={{ color: fpsTint, fontWeight: 600 }}>{stats.fps}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.6 }}>FRAME</span>
        <span>{stats.ms}ms</span>
      </div>
      <div
        style={{
          borderTop: "1px solid var(--puru-surface-border, #444)",
          marginTop: 4,
          paddingTop: 4,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.6 }}>DRAW</span>
        <span>{stats.drawCalls}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.6 }}>TRIS</span>
        <span>{stats.triangles.toLocaleString()}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.6 }}>GEO</span>
        <span>{stats.geometries}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.6 }}>TEX</span>
        <span>{stats.textures}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.6 }}>PROG</span>
        <span>{stats.programs}</span>
      </div>
    </Html>
  );
}
