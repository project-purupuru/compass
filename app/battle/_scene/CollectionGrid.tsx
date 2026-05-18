"use client";

import { motion } from "motion/react";
import type { Card } from "@/lib/honeycomb/cards";
import { ELEMENT_META, type Element } from "@/lib/honeycomb/wuxing";
import { battleCommand } from "@/lib/runtime/battle.client";
import { ELEMENT_TINT_BG } from "./_element-classes";

interface CollectionGridProps {
  readonly collection: readonly Card[];
  readonly selectedIndices: readonly number[];
  readonly weather: Element;
}

export function CollectionGrid({ collection, selectedIndices, weather }: CollectionGridProps) {
  return (
    <section className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
      {collection.map((card, idx) => {
        const order = selectedIndices.indexOf(idx);
        const selected = order >= 0;
        const isWeatherBlessed = card.element === weather;
        return (
          <motion.button
            key={card.id}
            type="button"
            onClick={() =>
              selected ? battleCommand.deselectCard(idx) : battleCommand.selectCard(idx)
            }
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            whileTap={{ y: 1, scale: 0.98 }}
            animate={{
              borderColor: selected ? "var(--puru-honey-base)" : "var(--puru-cloud-deep)",
            }}
            className={[
              "relative aspect-[3/4] rounded-2xl border-2 p-3 flex flex-col justify-between",
              "bg-puru-cloud-bright shadow-puru-tile hover:shadow-puru-tile-hover transition-shadow",
              "text-left",
              selected ? "ring-2 ring-puru-honey-base" : "",
            ].join(" ")}
            data-element={card.element}
            data-selected={selected}
          >
            {/* element wash */}
            <div
              aria-hidden
              className={`absolute inset-0 rounded-2xl pointer-events-none ${ELEMENT_TINT_BG[card.element]}`}
              style={{ opacity: selected ? 0.6 : 0.35 }}
            />

            {/* content */}
            <div className="relative z-10 flex items-start justify-between">
              <span className="font-puru-display text-2xl text-puru-ink-rich leading-none">
                {ELEMENT_META[card.element].kanji}
              </span>
              {isWeatherBlessed && (
                <span
                  aria-label="weather blessing"
                  className="text-xs font-puru-mono text-puru-honey-dim"
                  title="Today's element +15%"
                >
                  ✦
                </span>
              )}
            </div>

            <div className="relative z-10 flex flex-col gap-0.5">
              <span className="text-2xs uppercase font-puru-mono tracking-wide text-puru-ink-dim">
                {card.cardType.replace("_", " · ")}
              </span>
              <span className="text-xs font-puru-display text-puru-ink-rich">
                {card.cardType === "jani"
                  ? "Jani"
                  : card.cardType === "caretaker_a"
                    ? ELEMENT_META[card.element].caretaker
                    : `${ELEMENT_META[card.element].caretaker} ·`}
              </span>
            </div>

            {order >= 0 && (
              <span className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-puru-honey-base text-puru-ink-rich text-xs font-puru-mono grid place-items-center">
                {order + 1}
              </span>
            )}
          </motion.button>
        );
      })}
    </section>
  );
}
