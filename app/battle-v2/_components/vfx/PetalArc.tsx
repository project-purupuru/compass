/**
 * PetalArc — the travel. Intent made visible.
 *
 * Per build doc step 3. Beat: `launch_petal_arc`.
 *
 * ~11 petals tinted `--wood-glow` — this exact glow appears ONLY here, mid-
 * flight: it means "energy in transit". They ride a rise-then-fall bezier
 * from `anchor.hand.card.center` toward `anchor.wood_grove.seedling_center`,
 * each driven by its own real spring (mass 0.6 · stiffness 220 · damping 18)
 * — a thrown object, not an ease. ~36ms stagger makes a trail, not a clump.
 *
 * The seedling endpoint is re-read EVERY FRAME. CameraRig leans while the
 * petals fly, so a frozen path would land them where the box *was*. They
 * chase the live anchor — a thrown thing tracks where it's going.
 *
 * Lifecycle note (the load-bearing one): the rAF loop is owned by `rafRef`,
 * NOT by the beat effect's cleanup. `activeBeat` changes on every beat —
 * `play_launch_audio` fires ~20ms after `launch_petal_arc` — so a cleanup
 * tied to `[activeBeat]` would cancel the flight almost immediately. The beat
 * effect therefore returns NO cleanup; the loop is stopped only by the
 * `unlock_input` beat, by self-settle, or by unmount.
 *
 * Exit contract:
 *   - starts on:    the `launch_petal_arc` beat
 *   - owned by:     this component (self-clears once every petal has settled)
 *   - interrupted by: the `unlock_input` beat (force-clear)
 *   - fails soft:   if either anchor is unbound, nothing flies
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import { ANCHOR, type AnchorStore } from "../anchors/anchorStore";
import { SPRING_PETAL, stepSpring } from "./springs";

const PETAL_COUNT = 11;

interface PetalSpec {
  /** ms after launch before this petal starts moving — the stagger. */
  readonly delay: number;
  /** how high the arc rises before it falls — gravity is felt. */
  readonly apexLift: number;
  /** sideways control-point offset — fans the trail out. */
  readonly lateral: number;
  /** terminal scatter so petals don't all stack on one pixel. */
  readonly drift: number;
  /** px — varied so the trail has texture, not a clone-stamp. */
  readonly size: number;
}

function buildSpecs(distance: number): PetalSpec[] {
  const baseLift = Math.max(120, distance * 0.36);
  return Array.from({ length: PETAL_COUNT }, (_, i) => {
    const t = i / (PETAL_COUNT - 1);
    return {
      delay: i * 36,
      apexLift: baseLift * (0.78 + t * 0.44),
      lateral: (i - (PETAL_COUNT - 1) / 2) * 10,
      drift: (i - (PETAL_COUNT - 1) / 2) * 4.5,
      size: 12 + ((i * 5) % 7), // 12..18, deterministic varied
    };
  });
}

interface PetalArcProps {
  readonly anchorStore: AnchorStore;
  readonly activeBeat: BeatFireRecord | null;
}

export function PetalArc({ anchorStore, activeBeat }: PetalArcProps) {
  const [active, setActive] = useState(false);
  const specsRef = useRef<PetalSpec[]>([]);
  const petalEls = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => {
    if (!activeBeat) return;

    // The clean exit — when input unlocks, the ritual is over.
    if (activeBeat.beatId === "unlock_input") {
      stop();
      setActive(false);
      return;
    }

    if (activeBeat.beatId !== "launch_petal_arc") return;

    const from = anchorStore.get(ANCHOR.handCardCenter);
    const to = anchorStore.get(ANCHOR.seedlingCenter);
    if (!from || !to) {
      // Fail soft: a beat fired against an unbound anchor has nowhere to land.
      setActive(false);
      return;
    }

    // Restart cleanly if a prior flight is somehow still running.
    stop();

    // The hand is a fixed bottom strip — its anchor is frozen at launch. Only
    // the seedling moves (the camera leans), so only `to` is re-read per frame.
    const origin = from;
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    specsRef.current = buildSpecs(distance);

    const springs = specsRef.current.map(() => ({ value: 0, velocity: 0 }));
    let lastTo = to;
    const startedAt = performance.now();
    let prev = startedAt;
    setActive(true);

    const tick = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      const elapsed = now - startedAt;

      // Re-read the live seedling position — chase the box as the camera leans.
      const liveTo = anchorStore.get(ANCHOR.seedlingCenter) ?? lastTo;
      lastTo = liveTo;

      let allSettled = true;
      for (let i = 0; i < specsRef.current.length; i++) {
        const el = petalEls.current[i];
        if (!el) {
          allSettled = false;
          continue;
        }
        const spec = specsRef.current[i];
        const s = springs[i];
        if (elapsed >= spec.delay) stepSpring(s, 1, SPRING_PETAL, dt);
        if (s.value < 0.999 || Math.abs(s.velocity) > 0.01) allSettled = false;
        // Clamp absorbs the spring's overshoot at the box — the petal lands
        // and settles, it doesn't fly past and come back.
        const t = Math.min(1, Math.max(0, s.value));

        const endX = liveTo.x + spec.drift;
        const endY = liveTo.y + spec.drift * 0.4;
        const ctrlX = (origin.x + endX) / 2 + spec.lateral;
        const ctrlY = Math.min(origin.y, endY) - spec.apexLift;

        // Quadratic bezier — position + tangent (for travel-facing rotation).
        const mt = 1 - t;
        const x = mt * mt * origin.x + 2 * mt * t * ctrlX + t * t * endX;
        const y = mt * mt * origin.y + 2 * mt * t * ctrlY + t * t * endY;
        const dx = 2 * mt * (ctrlX - origin.x) + 2 * t * (endX - ctrlX);
        const dy = 2 * mt * (ctrlY - origin.y) + 2 * t * (endY - ctrlY);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        const opacity =
          t < 0.14 ? t / 0.14 : t > 0.82 ? Math.max(0, (1 - t) / 0.18) : 1;

        // Corner-translate so rotation pivots on the petal's center.
        el.style.transform = `translate(${x - spec.size / 2}px, ${y - spec.size / 2}px) rotate(${angle}deg)`;
        el.style.opacity = String(opacity);
      }

      if (allSettled) {
        rafRef.current = null;
        setActive(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // NO cleanup returned — the loop must survive the next beat firing.
  }, [activeBeat, anchorStore, stop]);

  // Cancel only on unmount — never on a mere beat change.
  useEffect(() => stop, [stop]);

  if (!active) return null;

  return (
    <div className="petal-arc" aria-hidden="true">
      {specsRef.current.map((spec, i) => (
        <span
          key={i}
          ref={(el) => {
            petalEls.current[i] = el;
          }}
          className="petal-arc__petal"
          style={{ width: spec.size, height: spec.size, opacity: 0 }}
        />
      ))}
    </div>
  );
}
