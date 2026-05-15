/**
 * CaretakerCorner — caretaker + companion presence (operator fence F12).
 *
 * Pokémon-style composition: the caretaker stands large and unboxed in the
 * bottom-left corner (full-body transparent render), with Puruhani smaller and
 * in front of them. The dialogue floats free, outside the character — the
 * artwork is the subject and gets room to breathe; no panel chrome contains it.
 *
 * The bubble is the clash's voice: the caretaker speaks the match's current
 * line — the arrange instruction, the live clash narration, the result verdict
 * — phased per beat (operator note 2026-05-14). The helper text lives WITH the
 * character, not floating over the world. Reads off the MatchEngine via
 * `useMatch()`; before the engine's first emit, a quiet default holds.
 *
 * Substrate note: caretaker identity keys off the active tide — cycle-1
 * GameState has no dedicated player-caretaker field yet (see
 * grimoires/loa/context/14-battle-v2-hud-zone-map.md, gap #3).
 */

"use client";

import { AnimatePresence, motion } from "motion/react";

import { clashMessage } from "@/lib/cards/battle";
import type { ElementId } from "@/lib/purupuru/contracts/types";
import { useMatch } from "@/lib/runtime/react";

const CARETAKER: Record<ElementId, { readonly name: string; readonly img: string }> = {
  wood: { name: "Kaori", img: "/art/caretakers/caretaker-kaori-fullbody.png" },
  fire: { name: "Akane", img: "/art/caretakers/caretaker-akane-fullbody.png" },
  earth: { name: "Nemu", img: "/art/caretakers/caretaker-nemu-fullbody.png" },
  metal: { name: "Ren", img: "/art/caretakers/caretaker-ren-fullbody.png" },
  water: { name: "Ruan", img: "/art/caretakers/caretaker-ruan-fullbody.png" },
};

const DEFAULT_COMMENT = "The grove stirs. Plant with intent — the world is listening.";

interface CaretakerCornerProps {
  readonly activeElement: ElementId;
}

export function CaretakerCorner({ activeElement }: CaretakerCornerProps) {
  const caretaker = CARETAKER[activeElement];
  const match = useMatch();

  // The caretaker speaks the match's current line. `bubbleKey` is the precise
  // beat — phase · round · revealed clash — so AnimatePresence phases the
  // bubble text exactly when the moment changes.
  const comment = match ? clashMessage(match) : DEFAULT_COMMENT;
  const bubbleKey = match
    ? `${match.phase}-${match.round}-${match.revealedClashes}`
    : "idle";

  return (
    <aside className="hud-caretaker" aria-label="Caretaker and companion">
      <div className="hud-caretaker__bubble">
        <span className="hud-caretaker__speaker">{caretaker.name}</span>
        <AnimatePresence mode="wait">
          <motion.p
            key={bubbleKey}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            {comment}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="hud-caretaker__stage">
        <img
          className="hud-caretaker__caretaker"
          src={caretaker.img}
          alt={`${caretaker.name}, the caretaker`}
          loading="lazy"
        />
        <img
          className="hud-caretaker__puruhani"
          src={`/art/puruhani/puruhani-${activeElement}.png`}
          alt={`${caretaker.name}'s puruhani`}
          loading="lazy"
        />
      </div>
    </aside>
  );
}
