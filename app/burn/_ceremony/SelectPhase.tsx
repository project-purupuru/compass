"use client";

/**
 * `select` phase — the collection, with eligible sets FELT (NFR-2).
 *
 * No count. No "4/5". No "complete". An eligible set breathes and glows;
 * an incomplete set sits quiet and dim. Eligibility is read off the pure
 * `getBurnCandidates` result — `candidate.complete` drives the *feel*, but
 * the number 5 never reaches the DOM.
 *
 * Reads only — the mutation lives in `reveal` (SDD §8.3).
 */

import { motion } from "motion/react";
import type { BurnCandidate } from "@/lib/honeycomb/burn";
import { ELEMENT_META, ELEMENT_ORDER } from "@/lib/honeycomb/wuxing";

interface SelectPhaseProps {
  readonly candidates: readonly BurnCandidate[];
  readonly onSelect: (candidate: BurnCandidate) => void;
}

export function SelectPhase({ candidates, onSelect }: SelectPhaseProps) {
  const anyComplete = candidates.some((c) => c.complete);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10 text-center">
        <h1 className="font-puru-display text-3xl text-puru-ink-rich">
          the burn
        </h1>
        <p className="mt-2 font-puru-body text-sm text-puru-ink-dim">
          a complete set, given back — and something whole returns
        </p>
      </header>

      {!anyComplete && (
        <p className="mb-8 text-center font-puru-body text-sm text-puru-ink-ghost">
          nothing is ready to give yet. tend your sets.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {candidates.map((candidate) => {
          const ready = candidate.complete;
          // Which elements the player holds for this set — drives the felt
          // dot row. Presence/absence is felt; no tally is shown.
          const held = new Set(candidate.cards.map((c) => c.element));
          return (
            <motion.button
              key={candidate.setType}
              type="button"
              disabled={!ready}
              onClick={() => ready && onSelect(candidate)}
              aria-disabled={!ready}
              aria-label={
                ready
                  ? `Burn ${candidate.setLabel} — ready`
                  : `${candidate.setLabel} — not ready`
              }
              // The "breath" — eligible sets pulse slowly, like the
              // element breathing rhythms in globals.css.
              animate={
                ready
                  ? {
                      boxShadow: [
                        "0 0 0px 0px var(--puru-honey-tint)",
                        "0 0 28px 2px var(--puru-honey-base)",
                        "0 0 0px 0px var(--puru-honey-tint)",
                      ],
                    }
                  : { boxShadow: "0 0 0px 0px transparent" }
              }
              transition={
                ready
                  ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
              whileHover={ready ? { y: -3 } : undefined}
              whileTap={ready ? { scale: 0.99 } : undefined}
              className={[
                "rounded-3xl border-2 p-6 text-left transition-colors",
                ready
                  ? "border-puru-honey-base bg-puru-honey-tint cursor-pointer"
                  : "border-puru-cloud-deep bg-puru-cloud-base opacity-50 cursor-not-allowed",
              ].join(" ")}
            >
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-puru-display text-lg text-puru-ink-rich">
                  {candidate.setLabel}
                </span>
                <span
                  className={[
                    "font-puru-body text-sm",
                    ready ? "text-puru-honey-dim" : "text-puru-ink-ghost",
                  ].join(" ")}
                >
                  {ready ? `becomes ${candidate.transcendenceName}` : "incomplete"}
                </span>
              </div>

              {/* Felt dot row — held elements glow, absent ones are ghosts.
                  No count, no fraction. The eye reads readiness. */}
              <div className="flex justify-center gap-3">
                {ELEMENT_ORDER.map((el) => {
                  const has = held.has(el);
                  return (
                    <div
                      key={el}
                      aria-hidden
                      className={[
                        "grid h-9 w-9 place-items-center rounded-full font-puru-cn text-base transition-all",
                        has
                          ? "bg-puru-ink-rich text-puru-cloud-bright"
                          : "bg-puru-cloud-dim text-puru-ink-ghost opacity-40",
                      ].join(" ")}
                    >
                      {ELEMENT_META[el].kanji}
                    </div>
                  );
                })}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
