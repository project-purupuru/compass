"use client";

/**
 * useCardTilt — React port of world-purupuru's pokemon-cards-css physics
 * (Card.svelte:78-145, simplified to a single rAF lerp instead of spring/motion).
 *
 * Writes CSS custom properties directly to the target node — zero React
 * re-render per frame, the visual update lives in the compositor.
 *
 * Variables consumed by .petal / .petal-glare / .petal-shine in
 * app/battle/_styles/CardPetal.css:
 *
 *   --pointer-x, --pointer-y           — 0–100%, where the pointer is
 *   --pointer-from-center              — 0–1, normalized distance
 *   --pointer-from-top, *-from-left    — 0–1, raw axis
 *   --rotate-x, --rotate-y             — degrees, max ~ ±12°
 *   --background-x, --background-y     — 33–67%, gentle holo drift
 *   --card-opacity                     — 0–1, glare strength
 *   --holo-hue                         — element-specific hue (deg)
 *
 * Touch + pointer covered; gyro (DeviceOrientation) is intentionally
 * out of scope for the first pass — petal opens fullscreen on mobile
 * anyway, the tilt-to-look-at-the-stars cycle can come next.
 */

import { useEffect, useRef } from "react";
import type { Element } from "@/lib/honeycomb/wuxing";

const HOLO_HUE: Record<Element, number> = {
  wood: 120,
  fire: 15,
  earth: 45,
  metal: 280,
  water: 220,
};

const ROTATION_DAMP = 3.5;
const ROTATION_MAX = 14;
const LERP = 0.18;

interface TiltState {
  px: number;
  py: number;
  rx: number;
  ry: number;
  bx: number;
  by: number;
  opacity: number;
}

const REST: TiltState = {
  px: 50,
  py: 50,
  rx: 0,
  ry: 0,
  bx: 50,
  by: 50,
  opacity: 0,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number) => Math.round(v * 100) / 100;
const adjust = (v: number, fromLo: number, fromHi: number, toLo: number, toHi: number) =>
  toLo + ((toHi - toLo) * (v - fromLo)) / (fromHi - fromLo);

function applyVars(el: HTMLElement, s: TiltState, hue: number) {
  const fromCenter = clamp(
    Math.sqrt((s.py - 50) ** 2 + (s.px - 50) ** 2) / 50,
    0,
    1,
  );
  el.style.setProperty("--pointer-x", `${s.px}%`);
  el.style.setProperty("--pointer-y", `${s.py}%`);
  el.style.setProperty("--pointer-from-center", `${fromCenter}`);
  el.style.setProperty("--pointer-from-top", `${s.py / 100}`);
  el.style.setProperty("--pointer-from-left", `${s.px / 100}`);
  el.style.setProperty("--rotate-x", `${s.rx}deg`);
  el.style.setProperty("--rotate-y", `${s.ry}deg`);
  el.style.setProperty("--background-x", `${s.bx}%`);
  el.style.setProperty("--background-y", `${s.by}%`);
  el.style.setProperty("--card-opacity", `${s.opacity}`);
  el.style.setProperty("--holo-hue", `${hue}`);
}

export function useCardTilt<T extends HTMLElement>(element: Element | null | undefined) {
  const ref = useRef<T | null>(null);
  const stateRef = useRef<TiltState>({ ...REST });
  const targetRef = useRef<TiltState>({ ...REST });
  const rafRef = useRef<number | null>(null);
  const interactingRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hue = element ? HOLO_HUE[element] : 45;

    applyVars(node, REST, hue);
    if (reduceMotion) return;

    const tick = () => {
      const s = stateRef.current;
      const t = targetRef.current;
      s.px += (t.px - s.px) * LERP;
      s.py += (t.py - s.py) * LERP;
      s.rx += (t.rx - s.rx) * LERP;
      s.ry += (t.ry - s.ry) * LERP;
      s.bx += (t.bx - s.bx) * LERP;
      s.by += (t.by - s.by) * LERP;
      s.opacity += (t.opacity - s.opacity) * LERP;
      applyVars(node, s, hue);
      const settled =
        Math.abs(s.rx - t.rx) < 0.05 &&
        Math.abs(s.ry - t.ry) < 0.05 &&
        Math.abs(s.opacity - t.opacity) < 0.005 &&
        !interactingRef.current;
      if (settled) {
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const startLoop = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const handlePointer = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = clamp(round(((e.clientX - rect.left) / rect.width) * 100), 0, 100);
      const py = clamp(round(((e.clientY - rect.top) / rect.height) * 100), 0, 100);
      const cx = px - 50;
      const cy = py - 50;
      interactingRef.current = true;
      targetRef.current = {
        px,
        py,
        rx: clamp(round(cy / ROTATION_DAMP), -ROTATION_MAX, ROTATION_MAX),
        ry: clamp(round(-cx / ROTATION_DAMP), -ROTATION_MAX, ROTATION_MAX),
        bx: adjust(px, 0, 100, 37, 63),
        by: adjust(py, 0, 100, 33, 67),
        opacity: 1,
      };
      startLoop();
    };

    const handleLeave = () => {
      interactingRef.current = false;
      targetRef.current = { ...REST };
      startLoop();
    };

    node.addEventListener("pointermove", handlePointer);
    node.addEventListener("pointerleave", handleLeave);
    node.addEventListener("pointerdown", handlePointer);
    node.addEventListener("pointerup", handleLeave);

    return () => {
      node.removeEventListener("pointermove", handlePointer);
      node.removeEventListener("pointerleave", handleLeave);
      node.removeEventListener("pointerdown", handlePointer);
      node.removeEventListener("pointerup", handleLeave);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [element]);

  return ref;
}
