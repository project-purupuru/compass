"use client";

/**
 * KaironicPanel — operator tuning surface for "felt time."
 *
 * Hand-rolled v1 with 7 range sliders matching `DEFAULT_KAIRONIC_WEIGHTS`.
 * v2: swap for proper DialKit + tweakpane once feel is locked.
 */

import type { KaironicWeights } from "@/lib/honeycomb/curves";
import { battleCommand } from "@/lib/runtime/battle.client";

interface KaironicPanelProps {
  readonly weights: KaironicWeights;
}

const DIMENSIONS: readonly (keyof KaironicWeights)[] = [
  "arrival",
  "anticipation",
  "impact",
  "aftermath",
  "stillness",
  "recovery",
  "transition",
];

export function KaironicPanel({ weights }: KaironicPanelProps) {
  return (
    <section className="rounded-3xl bg-puru-cloud-bright/80 p-4 shadow-puru-tile">
      <header className="flex items-baseline justify-between mb-3">
        <h2 className="font-puru-display text-sm text-puru-ink-rich">Kaironic dial</h2>
        <p className="text-2xs font-puru-mono text-puru-ink-ghost">tune feel</p>
      </header>
      <div className="flex flex-col gap-2.5">
        {DIMENSIONS.map((dim) => {
          const value = weights[dim];
          return (
            <label key={dim} className="grid grid-cols-[80px_1fr_40px] items-center gap-3 text-xs">
              <span className="font-puru-body text-puru-ink-dim">{dim}</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={value}
                onChange={(e) =>
                  battleCommand.tuneKaironic({
                    [dim]: Number(e.target.value),
                  } as Partial<KaironicWeights>)
                }
                className="accent-puru-honey-base"
              />
              <span className="font-puru-mono text-2xs text-puru-ink-soft text-right">
                {value.toFixed(2)}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
