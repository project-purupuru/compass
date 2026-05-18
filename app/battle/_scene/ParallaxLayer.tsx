"use client";

/**
 * ParallaxLayer — thin React wrapper over the CameraEngine.
 *
 * The engine owns the RAF loop, all state, all CSS-var writes. This
 * component just wires the mouse → engine.setTarget() and starts/stops
 * the loop on mount/unmount.
 *
 * Tweakpane in app/battle/_inspect/CameraTweakpane.tsx binds to
 * cameraEngine().config to live-tune smoothing, drift, shake.
 */

import { useEffect } from "react";
import { cameraEngine } from "@/lib/camera/parallax-engine";

export function ParallaxLayer() {
  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const root = document.querySelector<HTMLElement>(".battle-scene");
    if (!root) return;

    const engine = cameraEngine();
    engine.start(); // writes to <html>

    const onMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      engine.setTarget(nx, ny);
    };
    const onLeave = () => {
      engine.setTarget(0, 0);
    };

    root.addEventListener("mousemove", onMove);
    root.addEventListener("mouseleave", onLeave);
    return () => {
      root.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
      engine.stop();
    };
  }, []);

  return null;
}
