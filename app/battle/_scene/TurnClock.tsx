"use client";

/**
 * TurnClock — 1:1 port of world-purupuru TurnClock.svelte.
 * 5 pips (one per element). Active pip pulses. Weather has a small dot.
 * CSS: app/battle/_styles/TurnClock.css
 */

import { ELEMENT_META, ELEMENT_ORDER, type Element } from "@/lib/honeycomb/wuxing";

interface TurnClockProps {
  readonly turnElement: Element;
  readonly weather: Element;
}

export function TurnClock({ turnElement, weather }: TurnClockProps) {
  const currentIdx = ELEMENT_ORDER.indexOf(turnElement);
  return (
    <div className="turn-clock" role="list" aria-label="Battle turns">
      {ELEMENT_ORDER.map((el, i) => {
        const cls = ["pip"];
        if (i === currentIdx) cls.push("active");
        if (i < currentIdx) cls.push("past");
        if (i > currentIdx) cls.push("future");
        return (
          <div key={el} className={cls.join(" ")} data-element={el} role="listitem">
            <span className="pip-kanji">{ELEMENT_META[el].kanji}</span>
            {i === currentIdx && <span className="pip-ring" />}
            {el === weather && <span className="weather-dot" />}
          </div>
        );
      })}
    </div>
  );
}
