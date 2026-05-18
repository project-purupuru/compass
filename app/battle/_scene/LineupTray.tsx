"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { BattlePhase } from "@/lib/honeycomb/battle.port";
import type { Card } from "@/lib/honeycomb/cards";
import { ELEMENT_META, type Element } from "@/lib/honeycomb/wuxing";
import { battleCommand } from "@/lib/runtime/battle.client";
import { ELEMENT_TINT_BG } from "./_element-classes";

interface LineupTrayProps {
  readonly lineup: readonly Card[];
  readonly phase: BattlePhase;
  readonly weather: Element;
}

export function LineupTray({ lineup, phase, weather }: LineupTrayProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const interactive = phase === "arrange";

  return (
    <section className="rounded-3xl bg-puru-cloud-bright/80 p-4 shadow-puru-tile">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-puru-display text-base text-puru-ink-rich">Your line</h2>
        <p className="text-2xs font-puru-mono text-puru-ink-ghost uppercase tracking-wide">
          {interactive ? "drag to reorder · left strikes first" : "set"}
        </p>
      </div>
      <ol className="grid grid-cols-5 gap-2">
        {lineup.map((card, idx) => {
          const isWeather = card.element === weather;
          return (
            <motion.li
              key={card.id}
              layout
              draggable={interactive}
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => {
                if (!interactive) return;
                e.preventDefault();
                setOverIdx(idx);
              }}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== idx) {
                  battleCommand.rearrange(dragIdx, idx);
                }
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDragEnd={() => {
                setDragIdx(null);
                setOverIdx(null);
              }}
              animate={{
                scale: overIdx === idx ? 1.04 : 1,
                opacity: dragIdx === idx ? 0.45 : 1,
              }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className={[
                "relative aspect-[3/4] rounded-2xl p-2.5 flex flex-col justify-between",
                "bg-puru-cloud-bright shadow-puru-tile",
                interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default",
              ].join(" ")}
              data-element={card.element}
              data-position={idx}
            >
              <div
                aria-hidden
                className={`absolute inset-0 rounded-2xl pointer-events-none ${ELEMENT_TINT_BG[card.element]}`}
                style={{ opacity: 0.5 }}
              />
              <div className="relative z-10 flex items-start justify-between">
                <span className="font-puru-display text-xl text-puru-ink-rich leading-none">
                  {ELEMENT_META[card.element].kanji}
                </span>
                <span className="text-2xs font-puru-mono text-puru-ink-soft">{idx + 1}</span>
              </div>
              <div className="relative z-10 text-2xs font-puru-mono uppercase tracking-wide text-puru-ink-dim">
                {card.cardType.split("_").join(" · ")}
                {isWeather && <span className="ml-1 text-puru-honey-dim">✦</span>}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
