"use client";

import { useMemo } from "react";
import type { Element } from "@/lib/score";
import { ELEMENT_KANJI } from "@/lib/domain/element";
import { KpiCell } from "./KpiCell";

const DISPLAY_ORDER: readonly Element[] = ["wood", "fire", "earth", "metal", "water"] as const;

/**
 * Mobile mirror of the desktop KpiStrip — five wuxing clan cells in
 * sheng-cycle order. The leading clan's kanji lifts to its element's
 * vivid color; the others stay at the ambient ink-base wash. Layout:
 * two rows of two + a wider "water" cell spanning row 3 so all five
 * fit in the 2-column grid without orphaning a half-empty cell.
 */
export function StatsTile({ distribution }: { distribution: Record<Element, number> }) {
  const leader = useMemo(() => {
    let best: Element = "wood";
    let bestVal = -Infinity;
    for (const el of DISPLAY_ORDER) {
      if (distribution[el] > bestVal) {
        bestVal = distribution[el];
        best = el;
      }
    }
    return best;
  }, [distribution]);

  return (
    <section className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden bg-puru-cloud-bright shadow-puru-rim-left">
      <header className="relative z-10 shrink-0 bg-puru-cloud-bright px-6 py-4 shadow-[0_1px_0_0_var(--puru-surface-border),0_2px_4px_var(--puru-surface-shadow-sm)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <h3 className="font-puru-display text-xl text-puru-ink-rich">Stats</h3>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2.5 font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-dim">
            <span
              className="puru-live-dot inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--puru-wood-vivid)" }}
              aria-hidden
            />
            <span>live</span>
          </span>
        </div>
      </header>
      <div className="grid flex-1 grid-cols-2 auto-rows-fr gap-px overflow-y-auto bg-puru-surface-border">
        {DISPLAY_ORDER.map((el, idx) => {
          const isLeader = el === leader;
          // Last cell (water) spans both columns so the 5-element
          // sequence fits cleanly in a 2-col grid without an empty slot.
          const spanFull = idx === DISPLAY_ORDER.length - 1;
          // Non-leader cells dim to ~50% so the leading clan visibly
          // owns the panel — same treatment as the desktop KpiStrip.
          const dimClass = isLeader ? "opacity-100" : "opacity-60";
          return (
            <div
              key={el}
              className={`${dimClass} h-full transition-opacity duration-700 ${
                spanFull ? "col-span-2" : ""
              }`}
            >
              <KpiCell
                label={el}
                value={distribution[el] ?? 0}
                aside={ELEMENT_KANJI[el]}
                flush
                cellStyle={
                  isLeader
                    ? {
                        backgroundImage: `linear-gradient(to left, color-mix(in oklch, var(--puru-${el}-vivid) var(--puru-bleed-mix), transparent) 0%, transparent var(--puru-bleed-stop))`,
                      }
                    : undefined
                }
                asideStyle={
                  isLeader ? { color: `var(--puru-${el}-vivid)`, opacity: 0.42 } : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
