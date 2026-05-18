/**
 * Wuxing tide-flow vector field.
 *
 * Replaces the old random ambient impulse (which read as flies) with a
 * coherent slow drift along the 生 generation cycle:
 *   wood → fire → earth → metal → water → wood
 *
 * Each element's cluster gets a unit-vector pointing toward its
 * "downstream" element, rotated ~25° tangent so the visual reads as a
 * slow circulation around the diagram rather than a straight diagonal
 * crossing the pentagon. Magnitude ebbs and flows on a polyrhythmic
 * sine so the tide breathes.
 *
 * Plus a tiny per-sprite orbital wobble that keeps each individual
 * feeling alive without re-introducing the buggy-fly look.
 */

import type { Element } from "@/lib/score";
import type { PentagramGeometry, Vec2 } from "./types";

export const NEXT_IN_GENERATION: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

const TANGENT_ROT_DEG = 25; // rotate flow tangent to the pentagon edge

function rotate(v: Vec2, deg: number): Vec2 {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/**
 * Per-element unit-vector pointing toward the next-in-generation
 * vertex, with a small tangent rotation so the flow curves around
 * the diagram. Returns a frozen lookup safe to share across frames.
 */
export function tideUnitVectorsFor(geometry: PentagramGeometry): Record<Element, Vec2> {
  const out = {} as Record<Element, Vec2>;
  const elements = Object.keys(NEXT_IN_GENERATION) as Element[];
  for (const el of elements) {
    const from = geometry.vertex(el);
    const to = geometry.vertex(NEXT_IN_GENERATION[el]);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      out[el] = { x: 0, y: 0 };
      continue;
    }
    const unit = { x: dx / len, y: dy / len };
    out[el] = rotate(unit, TANGENT_ROT_DEG);
  }
  return out;
}

// Per-element ebb-flow phase offsets so all 5 currents are not
// synchronized — keeps the diagram visually polyrhythmic.
const TIDE_PHASE_OFFSET: Record<Element, number> = {
  wood: 0,
  fire: 1.2,
  earth: 2.7,
  metal: 4.1,
  water: 5.5,
};

/**
 * Slow ebb-flow magnitude in [0.6, 1.4]. Period ~14s with a subtle
 * 6.7s overtone — looks alive without obvious cycling.
 */
export function tideMagnitude(element: Element, tMs: number): number {
  const t = tMs / 1000;
  const phase = TIDE_PHASE_OFFSET[element];
  const base = Math.sin(t / 14 + phase) * 0.3; // ±0.3
  const overtone = Math.sin(t / 6.7 + phase * 0.7) * 0.1; // ±0.1
  return 1 + base + overtone;
}

/**
 * Tiny orbital wobble — absolute position offset (not a per-frame delta).
 * Caller adds this to `entity.position` at render time to draw the
 * sprite slightly off its physics anchor; physics state is unaffected.
 *
 * ~1.6px radius, ~2.7s period. Per-sprite phase keeps neighbours
 * out of lockstep.
 */
export function orbitalWobble(phase01: number, tMs: number): Vec2 {
  const r = 1.6;
  const period = 2700;
  const omega = (2 * Math.PI * tMs) / period + phase01 * Math.PI * 2;
  return { x: r * Math.cos(omega), y: r * Math.sin(omega) };
}
