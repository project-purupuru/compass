"use client";

/**
 * PixiClashVfx — procedural shader-style burst for clash impacts.
 *
 * MVP scope: water-only proof. Sits BESIDE ClashVfx so the CSS layer
 * still renders for non-water clashes; flip elements over to Pixi
 * one at a time as we audition them.
 *
 * Same trigger contract as ClashVfx: spawn on activeClashPhase ===
 * "impact", auto-destruct after the burst's `durationMs`. Per-burst
 * instances stack so back-to-back clashes don't fight each other.
 */

import { useEffect, useRef, useState } from "react";
import type { Element } from "@/lib/honeycomb/wuxing";
import { spawnWaterBurst } from "@/lib/vfx/pixi-water-burst";
import { vfxScheduler } from "@/lib/vfx/scheduler";

interface PixiClashVfxProps {
  readonly element: Element | null;
  readonly visibleClashIdx: number;
  readonly activeClashPhase: "approach" | "impact" | "settle" | null;
}

interface PixiBurstSlot {
  readonly id: number;
  readonly element: Element;
}

export function PixiClashVfx({ element, visibleClashIdx, activeClashPhase }: PixiClashVfxProps) {
  const [bursts, setBursts] = useState<readonly PixiBurstSlot[]>([]);

  // Symmetric to ClashVfx: skip if config routes this element to CSS.
  useEffect(() => {
    if (activeClashPhase !== "impact") return;
    if (!element || visibleClashIdx < 0) return;
    const sched = vfxScheduler();
    if (sched.config.particleRenderer[element] !== "pixi") return;

    const admitted = sched.request({
      family: "particle",
      element,
      renderer: "pixi",
      currentPhase: "clashing",
      expectedDurationMs: 900,
    });
    if (!admitted) return;
    setBursts((prev) => [...prev, { id: admitted.startedAt, element }]);
  }, [activeClashPhase, element, visibleClashIdx]);

  // Hard reset when phase ends — same shape as ClashVfx so residue
  // can't bleed into between-rounds.
  useEffect(() => {
    if (activeClashPhase !== null) return;
    setBursts([]);
  }, [activeClashPhase]);

  return (
    <>
      {bursts.map((b) => (
        <PixiBurstHost
          key={b.id}
          element={b.element}
          seed={b.id}
          onDone={() => setBursts((prev) => prev.filter((p) => p.id !== b.id))}
        />
      ))}
    </>
  );
}

/**
 * Host div that mounts a Pixi Application via spawnWaterBurst and tears
 * it down on unmount or onDone callback.
 *
 * FAGAN C2: onDone is a fresh closure every parent render, so including
 * it in the effect deps caused the burst to remount on every re-render —
 * leaking Pixi Applications + droplets. We capture onDone in a ref and
 * keep deps to the truly-stable identifiers (element + seed). Same fix
 * shape as React's "stale closure" idiom.
 */
function PixiBurstHost({
  element,
  seed,
  onDone,
}: {
  readonly element: Element;
  readonly seed: number;
  readonly onDone: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  // Always read the latest onDone but never trigger re-mount on its identity
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!hostRef.current) return;
    if (element !== "water") return; // MVP scope
    const handle = spawnWaterBurst({
      host: hostRef.current,
      seed,
      onDone: () => onDoneRef.current(),
    });
    return () => handle.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDone is intentionally accessed via ref to avoid burst remount
  }, [element, seed]);

  return (
    <div
      ref={hostRef}
      className="pixi-clash-vfx"
      data-element={element}
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "min(360px, 60vw)",
        height: "min(360px, 60vw)",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 27,
      }}
    />
  );
}
