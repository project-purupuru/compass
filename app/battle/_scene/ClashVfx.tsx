"use client";

/**
 * ClashVfx — element-specific impact particles at the clash midpoint.
 *
 * Mounts inside the .clash-zone. Fires when activeClashPhase is "impact".
 * Reads element from snap.lastPlayed (the most recently surfaced player
 * card during the staggered reveal).
 *
 * Same cleanup pattern as ClashOrb: per-burst removal timers live in a
 * ref so they survive impact→settle re-renders, and a hard reset fires
 * when the clashing phase ends so residue doesn't bleed into
 * between-rounds.
 *
 * The component is dumb — all the per-element variation lives in the
 * `lib/vfx/clash-particles.ts` config. (Composability doctrine, see
 * grimoires/loa/proposals/composable-vfx-vocabulary.md.)
 *
 * CSS: app/battle/_styles/ClashVfx.css
 */

import { useEffect, useRef, useState } from "react";
import { buildClashParticles, type ParticleInstance } from "@/lib/vfx/clash-particles";
import { vfxScheduler } from "@/lib/vfx/scheduler";
import type { Element } from "@/lib/honeycomb/wuxing";

interface ClashVfxProps {
  readonly element: Element | null;
  readonly visibleClashIdx: number;
  readonly activeClashPhase: "approach" | "impact" | "settle" | null;
}

interface ActiveBurst {
  readonly id: number;
  readonly element: Element;
  readonly particles: readonly ParticleInstance[];
}

export function ClashVfx({ element, visibleClashIdx, activeClashPhase }: ClashVfxProps) {
  const [bursts, setBursts] = useState<readonly ActiveBurst[]>([]);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    if (activeClashPhase !== "impact") return;
    if (!element || visibleClashIdx < 0) return;

    // Per-element renderer config: skip if this element routes to Pixi
    // (PixiClashVfx will own the spawn). The two renderers share family
    // capacity but defer to whichever the config picks for the element.
    const sched = vfxScheduler();
    if (sched.config.particleRenderer[element] !== "css") return;

    const admitted = sched.request({
      family: "particle",
      element,
      renderer: "css",
      currentPhase: "clashing",
      expectedDurationMs: 700,
    });
    if (!admitted) return;

    const { kit, particles } = buildClashParticles(element, visibleClashIdx + 1);
    const id = admitted.startedAt + visibleClashIdx;
    setBursts((prev) => [...prev, { id, element, particles }]);
    const t = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
      timersRef.current.delete(t);
    }, kit.durationMs + 50);
    timersRef.current.add(t);
  }, [activeClashPhase, element, visibleClashIdx]);

  // Hard reset on phase exit — clears any in-flight bursts so residue
  // doesn't bleed into between-rounds.
  useEffect(() => {
    if (activeClashPhase !== null) return;
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current.clear();
    setBursts([]);
  }, [activeClashPhase]);

  useEffect(
    () => () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current.clear();
    },
    [],
  );

  return (
    <>
      {bursts.map((b) => (
        <div key={b.id} className={`clash-vfx clash-vfx--${b.element}`} aria-hidden>
          {b.particles.map((p, i) => (
            <span
              key={i}
              className={`vfx-${p.kind}${p.variant ? ` ${p.variant}` : ""}`}
              style={p.style as React.CSSProperties}
            />
          ))}
        </div>
      ))}
    </>
  );
}
