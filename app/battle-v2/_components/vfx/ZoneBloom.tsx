/**
 * ZoneBloom — the impact. The world answering. THE moment.
 *
 * Per build doc step 4. Beat: `impact_seedling`.
 *
 * The petals land, and the world *catches* them — an ~80ms hit-stop — then it
 * answers: a flash ring peaking at `--wood-vivid` and a local sakura swirl
 * radiating from `anchor.wood_grove.seedling_center`. The 3D seedling mesh
 * springs in-Canvas (WorldMap3D); this is the screen-space punch.
 *
 * The bloom container tracks the live seedling anchor every frame — the
 * camera is still gliding when it fires, so a frozen position would drift off
 * the box. The swirl petals animate relative to the (moving) container.
 *
 * The Void: the flash settles to nothing and ~400ms of stillness follows
 * before the daemon reacts. The pause is the impact registering — Ma is
 * load-bearing, so this component does NOTHING during that window.
 *
 * Exit contract:
 *   - starts on:    the `impact_seedling` beat (after the 80ms hit-stop)
 *   - owned by:     this component (self-clears after the swirl settles)
 *   - interrupted by: the `unlock_input` beat (force-clear)
 *   - fails soft:   if the seedling anchor is unbound, the world stays quiet
 */

"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import { ANCHOR, type AnchorStore } from "../anchors/anchorStore";
import { TIMING } from "./springs";

const SWIRL_PETALS = 12;
const SWIRL_LIFETIME_MS = 1100;

interface ZoneBloomProps {
  readonly anchorStore: AnchorStore;
  readonly activeBeat: BeatFireRecord | null;
}

interface SwirlPetal {
  readonly key: number;
  readonly turn: number;
  readonly radius: number;
  readonly delay: number;
}

// Stable per-petal swirl geometry — a swirl, not a starburst.
const SWIRL_GEOMETRY: readonly SwirlPetal[] = Array.from(
  { length: SWIRL_PETALS },
  (_, i) => {
    const t = i / SWIRL_PETALS;
    return {
      key: i,
      turn: 150 + t * 250, // each petal sweeps a different arc
      radius: 46 + (i % 4) * 20, // four radial bands
      delay: i * 0.03,
    };
  },
);

export function ZoneBloom({ anchorStore, activeBeat }: ZoneBloomProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  }, []);

  // Mount / unmount gating, driven by the beat.
  //
  // The hit-stop + self-clear timers are owned by `timersRef`, NOT by this
  // effect's cleanup. `start_local_sakura_weather` fires ~100ms after
  // `impact_seedling`, so a cleanup tied to `[activeBeat]` would cancel the
  // bloom's own self-clear. The effect therefore returns NO cleanup.
  useEffect(() => {
    if (!activeBeat) return;

    if (activeBeat.beatId === "unlock_input") {
      clearTimers();
      setMounted(false);
      return;
    }

    if (activeBeat.beatId !== "impact_seedling") return;
    if (!anchorStore.get(ANCHOR.seedlingCenter)) return; // fail soft

    clearTimers();
    // The hit-stop — the world catches the petals before it answers.
    timersRef.current.push(
      window.setTimeout(() => setMounted(true), TIMING.bloomHitstopMs),
    );
    // Self-clear once the swirl has settled. After this the component renders
    // nothing — that absence IS the specified Void.
    timersRef.current.push(
      window.setTimeout(
        () => setMounted(false),
        TIMING.bloomHitstopMs + SWIRL_LIFETIME_MS,
      ),
    );
  }, [activeBeat, anchorStore, clearTimers]);

  // Cancel timers only on unmount — never on a mere beat change.
  useEffect(() => clearTimers, [clearTimers]);

  // While mounted, track the live seedling anchor — the camera is still
  // gliding, so the bloom must follow the box.
  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    const follow = () => {
      const el = containerRef.current;
      const p = anchorStore.get(ANCHOR.seedlingCenter);
      if (el && p) {
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
      }
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [mounted, anchorStore]);

  if (!mounted) return null;

  const initial = anchorStore.get(ANCHOR.seedlingCenter);

  return (
    <div
      ref={containerRef}
      className="zone-bloom"
      style={{ left: initial?.x ?? 0, top: initial?.y ?? 0 }}
      aria-hidden="true"
    >
      <div className="zone-bloom__flash" />
      {SWIRL_GEOMETRY.map((p) => (
        <span
          key={p.key}
          className="zone-bloom__petal"
          style={
            {
              "--swirl-turn": `${p.turn}deg`,
              "--swirl-radius": `${p.radius}px`,
              animationDelay: `${p.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
