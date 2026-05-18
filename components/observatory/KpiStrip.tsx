"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Element } from "@/lib/score";
import { ELEMENT_KANJI } from "@/lib/domain/element";

// Canonical sheng-cycle display order — matches the pentagram canvas
// vertex layout and the awareness-branch's WorldEvent order. Reads left-
// to-right as wood → fire → earth → metal → water → (wood).
const DISPLAY_ORDER: readonly Element[] = ["wood", "fire", "earth", "metal", "water"] as const;

export function KpiStrip({ distribution }: { distribution: Record<Element, number> }) {
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
    <section className="relative z-10 flex shrink-0 divide-x divide-puru-surface-border border-b border-puru-surface-border bg-puru-cloud-bright shadow-puru-rim-bottom">
      <div className="flex shrink-0 items-center bg-puru-cloud-bright px-5">
        <span className="puru-wordmark-drift inline-flex">
          <Image
            src="/brand/purupuru-wordmark.svg"
            alt="purupuru"
            width={88}
            height={28}
            priority
            className="dark:hidden"
          />
          <Image
            src="/brand/purupuru-wordmark-white.svg"
            alt="purupuru"
            width={88}
            height={28}
            priority
            className="hidden dark:block"
          />
        </span>
      </div>
      {DISPLAY_ORDER.map((el) => {
        const isLeader = el === leader;
        return (
          <Stat
            key={el}
            element={el}
            value={distribution[el] ?? 0}
            icon={ELEMENT_KANJI[el]}
            isLeader={isLeader}
          />
        );
      })}
    </section>
  );
}

/**
 * Top-strip clan-count tile · one per wuxing element.
 *
 * Non-leader: cloud-bright surface · ambient ink-base kanji at opacity 0.09
 * (felt, not seen).
 *
 * Leader: element-tinted bleed gradient (right→left, mirrors the
 * ActivityRail row vocab) PLUS the kanji glyph at full element-vivid
 * with opacity bumped to 0.42 so it reads as a clear tinted mark in
 * both light and dark mode. The transition fires every 3s when the
 * score adapter's distribution refreshes — visible "the lead just
 * changed" moment.
 */
function Stat({
  element,
  value,
  icon,
  isLeader,
}: {
  element: Element;
  value: ReactNode;
  icon: ReactNode;
  isLeader: boolean;
}) {
  const cellStyle: CSSProperties = isLeader
    ? {
        backgroundImage: `linear-gradient(to left, color-mix(in oklch, var(--puru-${element}-vivid) var(--puru-bleed-mix), transparent) 0%, transparent var(--puru-bleed-stop))`,
      }
    : {};
  const iconStyle: CSSProperties = isLeader
    ? { color: `var(--puru-${element}-vivid)`, opacity: 0.42 }
    : {};
  // Non-leader cells dim to ~50% so the leading clan visibly owns the
  // strip. Whole-cell opacity carries the dim — affects label, value,
  // and kanji together — keeping the dimming uniform regardless of the
  // ink-tone the cell is drawn in. Leader stays at 100% to pop against
  // the dimmed siblings.
  return (
    <div
      className={`relative flex flex-1 flex-col gap-1 overflow-hidden bg-puru-cloud-bright px-5 py-4 transition-[background-image,opacity] duration-700 ease-out ${
        isLeader ? "opacity-100" : "opacity-60"
      }`}
      style={cellStyle}
    >
      <span
        className={`relative z-10 truncate font-puru-mono text-2xs uppercase tracking-[0.22em] transition-colors duration-700 ${
          isLeader ? "text-puru-ink-soft" : "text-puru-ink-soft"
        }`}
      >
        {element}
      </span>
      <span
        className={`relative z-10 truncate font-puru-mono text-2xl leading-none tabular-nums transition-colors duration-700 ${
          isLeader ? "text-puru-ink-rich" : "text-puru-ink-soft"
        }`}
      >
        {value}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 select-none font-puru-display text-[140px] leading-none text-puru-ink-base opacity-[0.09] transition-[color,opacity] duration-700 ease-out"
        style={{
          ...iconStyle,
          maskImage: "linear-gradient(to left, transparent 0%, black 45%, black 100%)",
          WebkitMaskImage: "linear-gradient(to left, transparent 0%, black 45%, black 100%)",
        }}
      >
        {icon}
      </span>
    </div>
  );
}
