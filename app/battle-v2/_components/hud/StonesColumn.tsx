/**
 * StonesColumn — the element stones, now a horizontal row in the navbar
 * (operator fence F2, FEEL note 2026-05-14: elements matter, put them in the
 * navbar; remove the box; drop the "Saved" label).
 *
 * The 5 wuxing element stones, rendered with the real transparent stone art
 * from /art/stones/transparent. Unboxed — the art floats directly. The stone
 * matching the active tide is full-colour + breathing; the rest are dimmed.
 *
 * (Component name kept for import stability; it's a row now, not a column.)
 *
 * Substrate note: the "saved" set has no source in lib/purupuru yet — all 5
 * elements render, the active one is the real signal.
 */

"use client";

import type { ElementId } from "@/lib/purupuru/contracts/types";

const ELEMENTS: readonly ElementId[] = ["wood", "fire", "earth", "metal", "water"];

interface StonesColumnProps {
  readonly activeElement: ElementId;
}

export function StonesColumn({ activeElement }: StonesColumnProps) {
  return (
    <aside className="hud-stones" aria-label="Elements">
      <div className="hud-stones__row">
        {ELEMENTS.map((el) => {
          const isActive = el === activeElement;
          return (
            <div
              key={el}
              className={`hud-stone hud-stone--${el}${isActive ? " is-active" : ""}`}
              title={isActive ? `${el} — active tide` : el}
              data-element={el}
            >
              <img
                className="hud-stone__img"
                src={`/art/stones/transparent/${el}.png`}
                alt={`${el} stone`}
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
