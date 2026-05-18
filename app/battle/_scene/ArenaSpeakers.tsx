"use client";

/**
 * ArenaSpeakers — 1:1 port of world-purupuru ArenaSpeakers.svelte.
 * Player caretaker anchored bottom-left; opponent ambient top-right.
 * CSS: app/battle/_styles/ArenaSpeakers.css
 *
 * CARETAKER_FULL paths from world-purupuru's CDN are mirrored locally
 * under /thumbs/caretakers/ (synced from world-purupuru/static/thumbs).
 */

import { AnimatePresence, motion } from "motion/react";
import { ELEMENT_META, type Element } from "@/lib/honeycomb/wuxing";
import type { MatchPhase } from "@/lib/honeycomb/match.port";
import { CARETAKER_FULL } from "@/lib/cdn";

interface ArenaSpeakersProps {
  readonly playerElement: Element;
  readonly opponentElement: Element;
  readonly whisper: string | null;
  readonly phase: MatchPhase;
  readonly playerWins?: number;
  readonly opponentWins?: number;
  readonly activeClashPhase?: "approach" | "impact" | "settle" | null;
}

export function ArenaSpeakers({
  playerElement,
  opponentElement,
  whisper,
  phase,
  playerWins = 0,
  opponentWins = 0,
  activeClashPhase = null,
}: ArenaSpeakersProps) {
  const isEntry = phase === "entry" || phase === "idle" || phase === "quiz";
  const isArrange = phase === "arrange" || phase === "committed" || phase === "between-rounds";
  const isClashing = phase === "clashing";
  const isDisintegrating = phase === "disintegrating";
  const isResult = phase === "result";
  const playerWon = isResult && playerWins > opponentWins;
  const opponentWon = isResult && opponentWins > playerWins;

  if (isEntry) return null;

  const wrapperCls = [
    "arena-speakers",
    isArrange && "arena-speakers--idle",
    isResult && "arena-speakers--result",
    playerWon && "arena-speakers--player-won",
    opponentWon && "arena-speakers--opponent-won",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperCls}>
      <div
        className={`speaker speaker--player${whisper && (isClashing || isDisintegrating) ? " speaking" : ""}`}
      >
        <AnimatePresence>
          {whisper && (isClashing || isDisintegrating) && (
            <motion.p
              className="speaker-bubble speaker-bubble--player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {whisper}
            </motion.p>
          )}
        </AnimatePresence>
        <img
          className="speaker-face speaker-face--player"
          src={CARETAKER_FULL[playerElement]}
          alt={ELEMENT_META[playerElement].caretaker}
          data-element={playerElement}
        />
      </div>
      <div
        className={`speaker speaker--opponent${activeClashPhase === "impact" ? " reacting" : ""}`}
      >
        <img
          className="speaker-face speaker-face--opponent"
          src={CARETAKER_FULL[opponentElement]}
          alt={ELEMENT_META[opponentElement].caretaker}
          data-element={opponentElement}
        />
      </div>
    </div>
  );
}
