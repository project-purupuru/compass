"use client";

/**
 * `ceremony` phase — the ~6s non-skippable ritual.
 *
 * PURE PRESENTATION — NFR-4: ZERO substrate mutation here. This component
 * runs only timers and `motion` transitions. The burn mutation lives at
 * the `ceremony → reveal` transition in the parent (`page.tsx`), never in
 * this file. The `onComplete` callback at the 6s mark is what hands
 * control back to the parent — this component never touches `Collection`
 * or `executeBurn`.
 *
 * Step timing ported verbatim from canonical `+page.svelte:36-42`:
 *   step 0 → 1 (~500ms) → 2 (~2000ms) → 3 (~3500ms) → 4 (~5000ms)
 *   → onComplete (~6000ms).
 *
 * minimal-this-cycle: simple opacity/scale transitions. The ~6s timing is
 * the load-bearing part, not the polish (SDD §8.5).
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { BurnCandidate } from "@/lib/honeycomb/burn";
import { ELEMENT_META } from "@/lib/honeycomb/wuxing";

interface CeremonyPhaseProps {
  readonly candidate: BurnCandidate;
  /** Fired once at the ~6s mark — the parent does the mutation, not us. */
  readonly onComplete: () => void;
}

const STEP_TEXT = [
  "the elements gather",
  "they align",
  "they converge",
  "dissolution",
  "emergence",
] as const;

export function CeremonyPhase({ candidate, onComplete }: CeremonyPhaseProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Canonical timing (`+page.svelte:36-42`). Non-skippable: no early-exit
    // path, no cancel button. Input is soft-locked by the parent.
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 3500),
      setTimeout(() => setStep(4), 5000),
      setTimeout(() => onComplete(), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="relative h-64 w-64">
        {candidate.cards.map((card, i) => {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          // step <2: spread on a circle. step 2: converge inward + shrink.
          // step >=3: scale to nothing (dissolution).
          const radius = step < 2 ? 100 : 30;
          const x = step < 3 ? Math.cos(angle) * radius : 0;
          const y = step < 3 ? Math.sin(angle) * radius : 0;
          const scale = step < 2 ? 1 : step < 3 ? 0.8 : 0;
          return (
            <motion.div
              key={card.id}
              aria-hidden
              className="absolute left-1/2 top-1/2 grid h-16 w-12 place-items-center rounded-xl border-2 border-puru-cloud-deep bg-puru-cloud-bright font-puru-cn text-xl text-puru-ink-rich"
              style={{ marginLeft: "-1.5rem", marginTop: "-2rem" }}
              animate={{
                x,
                y,
                scale,
                opacity: step >= 3 ? 0 : step >= 1 ? 1 : 0.65,
                filter:
                  step >= 1
                    ? "drop-shadow(0 0 14px var(--puru-honey-base))"
                    : "drop-shadow(0 0 0px transparent)",
              }}
              transition={{
                duration: step >= 2 ? 1.5 : 0.5,
                ease: "easeInOut",
              }}
            >
              {ELEMENT_META[card.element].kanji}
            </motion.div>
          );
        })}

        {/* Convergence glow — peaks at step 4 (~5s). */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-24 w-24 rounded-full"
          style={{
            marginLeft: "-3rem",
            marginTop: "-3rem",
            background:
              "radial-gradient(circle, var(--puru-honey-base), transparent 70%)",
          }}
          animate={{
            scale: step < 2 ? 0 : step < 3 ? 1 : step < 4 ? 1.6 : 2.4,
            opacity: step < 2 ? 0 : step < 4 ? 0.55 : 0.85,
          }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </div>

      <motion.p
        key={step}
        initial={{ opacity: 0 }}
        animate={{ opacity: step >= 1 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="mt-10 font-puru-body text-sm text-puru-ink-dim"
      >
        {STEP_TEXT[step]}
      </motion.p>
    </div>
  );
}
