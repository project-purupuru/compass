"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Compact KPI card used in the right-rail panels (Activity / Weather).
 *
 * Renders a small uppercase mono label, a primary value, an optional
 * inline "aside" (typically a glyph or kanji), and an optional sub-line
 * for a secondary detail. Tab-stable layout via tabular-nums on the
 * value so consecutive numeric reads don't shift the row.
 *
 * `asideStyle` accepts inline CSS for cases that need a runtime token
 * lookup (e.g. element-tinted color via `var(--puru-${el}-vivid)`) —
 * Tailwind's JIT can't resolve those at build time.
 */
export function KpiCell({
  label,
  value,
  aside,
  sub,
  asideStyle,
  cellStyle,
  flush,
}: {
  label: string;
  value: ReactNode;
  /** Inline element shown next to the value — glyph, kanji, or units. */
  aside?: ReactNode;
  /** Secondary detail line under the primary value (precipitation, factor, etc). */
  sub?: ReactNode;
  /** Inline style applied to the aside slot — typically used for element color. */
  asideStyle?: CSSProperties;
  /** Inline style applied to the cell wrapper — for element-tinted bleed gradients. */
  cellStyle?: CSSProperties;
  /** When true, drops the rounded corners + tile shadow so cells can sit
   * flush against each other inside a divider-grid (mobile bottom panel). */
  flush?: boolean;
}) {
  // Flush mode (mobile bottom panel): cells sit on cloud-base, one step
  // recessed from the header's cloud-bright surface, so the header reads
  // as a raised lid with the cell field below it. Keeps the tile shadow
  // for adjacent-cell depth across the 1px divider but drops the rounded
  // corners that would clash against the gap-px grid.
  //
  // Default mode (desktop sidebar): cells sit on cloud-bright tiles
  // with rounded corners + tile shadow — the existing card vocab.
  const surfaceClass = flush ? "bg-puru-cloud-base" : "bg-puru-cloud-bright";
  const chromeClass = flush ? "h-full shadow-puru-tile" : "rounded-puru-sm shadow-puru-tile";
  return (
    <div
      className={`relative flex min-w-0 flex-col gap-1 overflow-hidden px-3 py-2 transition-[background-image] duration-700 ease-out ${surfaceClass} ${chromeClass}`}
      style={cellStyle}
    >
      <span className="relative z-10 truncate font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-soft">
        {label}
      </span>
      <span className="relative z-10 truncate font-puru-mono text-xl leading-none tabular-nums text-puru-ink-rich">
        {value}
      </span>
      {sub !== undefined && sub !== null ? (
        <span className="relative z-10 truncate font-puru-mono text-2xs text-puru-ink-soft">
          {sub}
        </span>
      ) : null}
      {aside !== undefined && aside !== null ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-2 -right-1 select-none font-puru-display text-5xl leading-none opacity-10"
          style={asideStyle}
        >
          {aside}
        </span>
      ) : null}
    </div>
  );
}
