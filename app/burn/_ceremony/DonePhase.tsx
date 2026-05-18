"use client";

/**
 * `done` phase — the updated collection, and the exit.
 *
 * Every sequence needs an exit (Operator OS rule). Input was soft-locked
 * during `ceremony`; `done` returns control: burn-another (back to
 * `select`) or leave (to the home route). Reads the freshly-mutated
 * collection; writes nothing.
 */

import { motion } from "motion/react";
import Link from "next/link";
import type { Card } from "@/lib/honeycomb/cards";
import { ELEMENT_META } from "@/lib/honeycomb/wuxing";

interface DonePhaseProps {
  readonly collection: readonly Card[];
  readonly onBurnAnother: () => void;
}

export function DonePhase({ collection, onBurnAnother }: DonePhaseProps) {
  const transcendence = collection.filter(
    (c) => c.cardType === "transcendence",
  );
  const base = collection.filter((c) => c.cardType !== "transcendence");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-3xl py-10"
    >
      <header className="mb-8 text-center">
        <h2 className="font-puru-display text-2xl text-puru-ink-rich">
          what you hold
        </h2>
      </header>

      {transcendence.length > 0 && (
        <section className="mb-8">
          <p className="mb-3 text-center font-puru-body text-xs uppercase tracking-wide text-puru-honey-dim">
            transcendent
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {transcendence.map((card) => (
              <div
                key={card.id}
                className="grid h-20 w-14 place-items-center rounded-xl border-2 border-puru-honey-base bg-puru-honey-tint font-puru-cn text-2xl text-puru-ink-rich"
                title={card.defId}
              >
                {card.defId.includes("garden")
                  ? "生"
                  : card.defId.includes("forge")
                    ? "克"
                    : "無"}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        {base.length === 0 ? (
          <p className="text-center font-puru-body text-sm text-puru-ink-ghost">
            the sets are given. only what is whole remains.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {base.map((card) => (
              <div
                key={card.id}
                aria-hidden
                className="grid h-12 w-9 place-items-center rounded-lg border border-puru-cloud-deep bg-puru-cloud-bright font-puru-cn text-base text-puru-ink-soft"
              >
                {ELEMENT_META[card.element].kanji}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onBurnAnother}
          className="rounded-full bg-puru-ink-rich px-8 py-3 font-puru-body text-base text-puru-cloud-bright transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer"
        >
          burn another
        </button>
        <Link
          href="/"
          className="rounded-full bg-puru-cloud-base px-8 py-3 font-puru-body text-base text-puru-ink-soft transition-colors hover:bg-puru-cloud-dim"
        >
          leave
        </Link>
      </div>
    </motion.div>
  );
}
