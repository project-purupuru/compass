"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Combo, ComboSummary } from "@/lib/honeycomb/combos";

interface CombosPanelProps {
  readonly combos: readonly Combo[];
  readonly summary: ComboSummary;
}

const KIND_LABEL: Record<Combo["kind"], string> = {
  "sheng-chain": "Shēng chain",
  "setup-strike": "Setup Strike",
  "elemental-surge": "Elemental Surge",
  "weather-blessing": "Weather Blessing",
  "garden-grace": "Garden Grace",
};

const KIND_DOT: Record<Combo["kind"], string> = {
  "sheng-chain": "bg-puru-wood-vivid",
  "setup-strike": "bg-puru-fire-vivid",
  "elemental-surge": "bg-puru-metal-vivid",
  "weather-blessing": "bg-puru-honey-base",
  "garden-grace": "bg-puru-wood-vivid",
};

export function CombosPanel({ combos, summary }: CombosPanelProps) {
  return (
    <section className="rounded-3xl bg-puru-cloud-bright/80 p-4 shadow-puru-tile">
      <header className="flex items-baseline justify-between mb-3">
        <h2 className="font-puru-display text-sm text-puru-ink-rich">Resonance</h2>
        <p className="text-2xs font-puru-mono text-puru-ink-soft">
          {summary.count > 0 ? `+${Math.round(summary.totalBonus * 100)}%` : "—"}
        </p>
      </header>
      <ul className="flex flex-col gap-1.5 min-h-[60px]">
        <AnimatePresence>
          {combos.length === 0 ? (
            <motion.li
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-puru-body italic text-puru-ink-ghost"
            >
              the chain is quiet. arrange differently?
            </motion.li>
          ) : (
            combos.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.32, ease: [0.32, 0.72, 0.32, 1] }}
                className="flex items-center gap-2 text-xs font-puru-body text-puru-ink-base"
              >
                <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${KIND_DOT[c.kind]}`} />
                <span className="font-puru-display">{KIND_LABEL[c.kind]}</span>
                <span className="text-puru-ink-dim">+{Math.round(c.bonus * 100)}%</span>
                <span className="text-2xs text-puru-ink-ghost ml-auto font-puru-mono">
                  {c.positions.map((p) => p + 1).join("·")}
                </span>
              </motion.li>
            ))
          )}
        </AnimatePresence>
      </ul>
    </section>
  );
}
