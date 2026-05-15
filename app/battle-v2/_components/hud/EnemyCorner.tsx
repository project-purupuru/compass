/**
 * EnemyCorner — opponent companion, top-right (operator fence F14).
 *
 * The puruhani stands alone — the caretaker render was removed 2026-05-14
 * (operator vault note: puruhani is the load-bearing companion; caretaker
 * may return as a "visit-point" figure later). Mirrors the player's
 * CaretakerCorner shape, on the opposite side.
 *
 * Substrate note: cycle-1 GameState has no opponent field yet — the enemy is
 * mocked to fire. `element` is a prop so a real opponent record drives it
 * later with zero structural change.
 */

"use client";

import type { ElementId } from "@/lib/purupuru/contracts/types";

interface EnemyCornerProps {
  /** Mocked to fire until cycle-1 GameState carries an opponent record. */
  readonly element?: ElementId;
}

export function EnemyCorner({ element = "fire" }: EnemyCornerProps) {
  return (
    <aside className="hud-enemy" aria-label="Opponent companion">
      <div className="hud-enemy__stage">
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
