/**
 * EnemyCorner — the opponent's caretaker + companion, top-right (operator
 * fence F14). The true mirror of the player's CaretakerCorner (bottom-left):
 * unboxed, full-body caretaker render + the puruhani, no labels, no name —
 * just the artwork, anchored top-right.
 *
 * Substrate note: cycle-1 GameState has no opponent field yet — the enemy is
 * mocked to fire (Akane). `element` is a prop so a real opponent record drives
 * it later with zero structural change.
 */

"use client";

import type { ElementId } from "@/lib/purupuru/contracts/types";

const CARETAKER: Record<ElementId, { readonly name: string; readonly img: string }> = {
  wood: { name: "Kaori", img: "/art/caretakers/caretaker-kaori-fullbody.png" },
  fire: { name: "Akane", img: "/art/caretakers/caretaker-akane-fullbody.png" },
  earth: { name: "Nemu", img: "/art/caretakers/caretaker-nemu-fullbody.png" },
  metal: { name: "Ren", img: "/art/caretakers/caretaker-ren-fullbody.png" },
  water: { name: "Ruan", img: "/art/caretakers/caretaker-ruan-fullbody.png" },
};

interface EnemyCornerProps {
  /** Mocked to fire until cycle-1 GameState carries an opponent record. */
  readonly element?: ElementId;
}

export function EnemyCorner({ element = "fire" }: EnemyCornerProps) {
  const caretaker = CARETAKER[element];
  return (
    <aside className="hud-enemy" aria-label="Opponent caretaker and companion">
      <div className="hud-enemy__stage">
        <img
          className="hud-enemy__caretaker"
          src={caretaker.img}
          alt={`${caretaker.name}, opponent caretaker`}
          loading="lazy"
        />
        <img
          className="hud-enemy__puruhani"
          src={`/art/puruhani/puruhani-${element}.png`}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
      </div>
    </aside>
  );
}
