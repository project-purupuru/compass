"use client";

/**
 * `confirm` phase — the deliberate, weighty choice.
 *
 * THE PRECONDITION GATE (SDD §10): the burn action is only enabled when
 * `candidate.complete === true`. The pure `executeBurn` is permissive by
 * design — it trusts its caller. This gate is what makes that trust safe:
 * a non-complete set can never reach `ceremony`. This phase-gate IS the
 * S2 audit's forward contract.
 *
 * Reads the selected candidate; writes nothing (SDD §8.3).
 */

import { motion } from "motion/react";
import type { BurnCandidate } from "@/lib/honeycomb/burn";
import { ELEMENT_META } from "@/lib/honeycomb/wuxing";

interface ConfirmPhaseProps {
  readonly candidate: BurnCandidate;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmPhase({
  candidate,
  onConfirm,
  onCancel,
}: ConfirmPhaseProps) {
  // The gate. Belt-and-braces: `select` already filters to complete sets,
  // but `confirm` re-asserts the precondition the pure function omits.
  const canBurn = candidate.complete === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto flex max-w-2xl flex-col items-center py-12 text-center"
    >
      <h2 className="font-puru-display text-2xl text-puru-ink-rich">
        give back {candidate.setLabel}?
      </h2>
      <p className="mt-3 max-w-md font-puru-body text-sm text-puru-ink-dim">
        these five are released. they do not return. in their place,{" "}
        <span className="text-puru-honey-dim">{candidate.transcendenceName}</span>{" "}
        comes whole.
      </p>

      {/* The five, laid out plainly — the weight of what is given. */}
      <div className="my-9 flex justify-center gap-3">
        {candidate.cards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
            aria-hidden
            className="grid h-16 w-12 place-items-center rounded-xl border-2 border-puru-cloud-deep bg-puru-cloud-bright font-puru-cn text-xl text-puru-ink-rich"
          >
            {ELEMENT_META[card.element].kanji}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => canBurn && onConfirm()}
          disabled={!canBurn}
          aria-disabled={!canBurn}
          className={[
            "rounded-full px-10 py-3 font-puru-body text-base transition-all",
            canBurn
              ? "bg-puru-ink-rich text-puru-cloud-bright hover:scale-[1.03] active:scale-95 cursor-pointer"
              : "bg-puru-cloud-dim text-puru-ink-ghost cursor-not-allowed",
          ].join(" ")}
        >
          burn
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-puru-cloud-base px-8 py-3 font-puru-body text-base text-puru-ink-soft transition-colors hover:bg-puru-cloud-dim cursor-pointer"
        >
          not yet
        </button>
      </div>

      {!canBurn && (
        <p className="mt-4 font-puru-body text-xs text-puru-ink-ghost">
          this set is not yet whole
        </p>
      )}
    </motion.div>
  );
}
