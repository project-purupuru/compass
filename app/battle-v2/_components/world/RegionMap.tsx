/**
 * RegionMap — the elemental territories, made visible. Sky-eyes' read of the world.
 *
 * Per build doc Session 11 (operator: "look into the eyes more ... understand
 * the different elements that revolve around each specific area").
 *
 * Two layers, drawn just above the continent:
 *   - the REGION TINT — a canvas texture sampling `regionAt(x,z)` per texel,
 *     each elemental territory washed in its colour. The continent reads as
 *     five elemental states, not one olive blob. The ACTIVE element's
 *     territory is washed brighter — the raptor's eye is drawn to where the
 *     element is in flow.
 *   - the COASTLINE — the traced continent outline, a soft drawn edge.
 *
 * The tint is generated once per active-element change; it's a translucent
 * read-layer, not the ground itself.
 */

"use client";

import { useMemo } from "react";

import { Line } from "@react-three/drei";
import { CanvasTexture, Color } from "three";

import type { ElementId } from "@/lib/purupuru/contracts/types";

import { COASTLINE } from "./landmass";
import { ELEMENT_GLOW, PALETTE } from "./palette";
import { regionAt } from "./regions";
import { MAP_SIZE } from "./zones";

const TINT_RES = 256;
const IDLE_ALPHA = 78;
const ACTIVE_ALPHA = 150;

function elementRgb(el: ElementId): [number, number, number] {
  const c = new Color(ELEMENT_GLOW[el]);
  return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)];
}

interface RegionMapProps {
  readonly activeElement: ElementId;
}

export function RegionMap({ activeElement }: RegionMapProps) {
  // The territory tint — one canvas texture, regenerated only when the active
  // element changes (rare). Each texel: regionAt → element colour → alpha.
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = TINT_RES;
    canvas.height = TINT_RES;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const img = ctx.createImageData(TINT_RES, TINT_RES);
    const rgbCache: Partial<Record<ElementId, [number, number, number]>> = {};

    for (let gz = 0; gz < TINT_RES; gz++) {
      for (let gx = 0; gx < TINT_RES; gx++) {
        const nx = (gx + 0.5) / TINT_RES;
        const nz = (gz + 0.5) / TINT_RES;
        const wx = (nx - 0.5) * MAP_SIZE;
        const wz = (nz - 0.5) * MAP_SIZE;
        const el = regionAt(wx, wz);
        const idx = (gz * TINT_RES + gx) * 4;
        if (!el) {
          img.data[idx + 3] = 0; // sea — transparent
          continue;
        }
        const rgb = (rgbCache[el] ??= elementRgb(el));
        img.data[idx] = rgb[0];
        img.data[idx + 1] = rgb[1];
        img.data[idx + 2] = rgb[2];
        img.data[idx + 3] = el === activeElement ? ACTIVE_ALPHA : IDLE_ALPHA;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [activeElement]);

  const coastPoints = useMemo<[number, number, number][]>(
    () => COASTLINE.map(([x, z]) => [x, 0.06, z]),
    [],
  );

  return (
    <group name="region-map">
      {texture ? (
        <mesh
          name="region-map.territory-tint"
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.03, 0]}
        >
          <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
          <meshBasicMaterial map={texture} transparent depthWrite={false} />
        </mesh>
      ) : null}
      {coastPoints.length > 1 ? (
        <Line
          points={coastPoints}
          color={PALETTE.parchment}
          lineWidth={2}
          transparent
          opacity={0.5}
        />
      ) : null}
    </group>
  );
}
