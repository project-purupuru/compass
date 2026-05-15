/**
 * MistLayer — drifting noise-modulated ground mist.
 *
 * Per the painterly-aesthetic dig (thread #1 — "noise-injected height fog,"
 * Bierstadt / Luminist / Ghibli ground mist). Three's built-in `<fog>` is
 * linear and uniform — it can't break up into PATCHES, which is what makes
 * mist read as mist (hugging the lowlands, drifting like a living thing).
 *
 * The shipped technique: two stacked horizontal planes just above the
 * continent at y≈0.6, mapped with seamlessly-tiling multi-octave noise
 * (integer-frequency sin/cos so the texture wraps cleanly), `RepeatWrapping`,
 * UV offsets scrolled per frame at different speeds and directions. From the
 * raptor's altitude the patches read as low mist drifting through the
 * lowlands. Pure presentation, no shader hacks.
 *
 * Plays to the north star ([[project_art-direction-north-star]]): not the
 * physics of fog, the memory of it.
 */

"use client";

import { useMemo } from "react";

import { useFrame } from "@react-three/fiber";
import { CanvasTexture, RepeatWrapping, type Texture } from "three";

import { MAP_SIZE } from "./zones";

const MIST_RES = 256;

/**
 * Multi-octave value noise using INTEGER-frequency sin/cos so the texture
 * tiles seamlessly across 0..1 UV — `RepeatWrapping` + scrolling offset
 * never reveals a seam.
 */
function tileableNoise(u: number, v: number, seed: number, octaves: number): number {
  let val = 0;
  let amp = 1;
  let f = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const phase = seed * (o + 1);
    val +=
      amp *
      Math.sin(u * 2 * Math.PI * f + phase) *
      Math.cos(v * 2 * Math.PI * f + phase * 1.3);
    val +=
      amp *
      0.6 *
      Math.cos(u * 2 * Math.PI * f * 2 + phase * 0.7) *
      Math.sin(v * 2 * Math.PI * f * 3 + phase * 0.3);
    norm += amp * 1.6;
    amp *= 0.5;
    f *= 2;
  }
  return val / norm; // ~ -1 .. 1
}

/**
 * A single radial fade texture (white centre → black edge) used as an
 * `alphaMap` to feather the mist plane's edges. It does NOT tile and does NOT
 * scroll — it stays fixed at plane centre while the noise `map` drifts inside.
 * The combination kills the visible square footprint of the plane.
 */
function buildRadialFadeTexture(coreRadius = 0.32, fadeOutAt = 0.5): Texture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = MIST_RES;
  canvas.height = MIST_RES;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // Black background — outside fadeOutAt the alpha multiplier is zero.
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, MIST_RES, MIST_RES);
  // Radial gradient from white at the core out to black past fadeOutAt.
  const cx = MIST_RES / 2;
  const cy = MIST_RES / 2;
  const r = MIST_RES / 2;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(coreRadius, "#ffffff");
  g.addColorStop(fadeOutAt, "#000000");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, MIST_RES, MIST_RES);
  const tex = new CanvasTexture(canvas);
  // ClampToEdge by default — fade stays put, never tiles.
  return tex;
}

function buildMistTexture(seed: number, octaves = 3, contrast = 1.3): Texture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = MIST_RES;
  canvas.height = MIST_RES;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(MIST_RES, MIST_RES);

  for (let py = 0; py < MIST_RES; py++) {
    const v = py / MIST_RES;
    for (let px = 0; px < MIST_RES; px++) {
      const u = px / MIST_RES;
      const n = tileableNoise(u, v, seed, octaves);
      // Clip negative, lift midtones with a soft contrast curve — sparse
      // patches, not a wash.
      const lifted = Math.max(0, n) ** contrast;
      const alpha = Math.min(255, Math.floor(lifted * 255));
      const idx = (py * MIST_RES + px) * 4;
      img.data[idx] = 255;
      img.data[idx + 1] = 255;
      img.data[idx + 2] = 255;
      img.data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  return tex;
}

interface MistLayerProps {
  /** World-space height of the mist plane. Default 0.55 — just above ground. */
  readonly height?: number;
}

export function MistLayer({ height = 0.55 }: MistLayerProps = {}) {
  // Two layers — different seeds, heights, scroll speeds, tints — so the
  // mist parallaxes against itself and never reads as a single flat sheet.
  const tex1 = useMemo(() => buildMistTexture(0xa137, 3, 1.4), []);
  const tex2 = useMemo(() => buildMistTexture(0xb281, 2, 1.6), []);
  // ONE shared radial-fade alphaMap — both layers feather out at the edges.
  const fadeTex = useMemo(() => buildRadialFadeTexture(0.3, 0.5), []);

  useFrame((_, dt) => {
    if (tex1) {
      tex1.offset.x += dt * 0.006;
      tex1.offset.y += dt * 0.004;
    }
    if (tex2) {
      tex2.offset.x -= dt * 0.004;
      tex2.offset.y += dt * 0.005;
    }
  });

  // Bigger plane — its edges are now far outside the visible frame, AND
  // they're feathered to zero by the radial alphaMap, so no square footprint.
  const planeSize = MAP_SIZE * 1.95;

  return (
    <group>
      {tex1 ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, height, 0]}
          renderOrder={1}
        >
          <planeGeometry args={[planeSize, planeSize]} />
          <meshBasicMaterial
            map={tex1}
            alphaMap={fadeTex ?? undefined}
            transparent
            depthWrite={false}
            color="#f5e8c8"
            opacity={0.55}
            toneMapped={false}
          />
        </mesh>
      ) : null}
      {tex2 ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, height + 0.55, 0]}
          renderOrder={2}
        >
          <planeGeometry args={[planeSize * 0.94, planeSize * 0.94]} />
          <meshBasicMaterial
            map={tex2}
            alphaMap={fadeTex ?? undefined}
            transparent
            depthWrite={false}
            color="#e8d8b6"
            opacity={0.42}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}
