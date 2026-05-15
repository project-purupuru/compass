/**
 * CaretakerCorner — companion presence (operator fence F12).
 *
 * The puruhani stands alone at the bottom-left. The caretaker render and the
 * speech bubble were removed 2026-05-14 — per operator vault note, the
 * puruhani is the load-bearing companion (pokemon-like, customisable,
 * expressive); the caretaker becomes a "visit-point" figure that may return
 * in another form later. Component name kept for import stability.
 *
 * Substrate note: companion identity keys off the active tide — cycle-1
 * GameState has no dedicated player-companion field yet (see
 * grimoires/loa/context/14-battle-v2-hud-zone-map.md, gap #3).
 */

"use client";

import type { ElementId } from "@/lib/purupuru/contracts/types";

interface CaretakerCornerProps {
  readonly activeElement: ElementId;
}

export function CaretakerCorner({ activeElement }: CaretakerCornerProps) {
  return (
    <aside className="hud-caretaker" aria-label="Companion">
      <div className="hud-caretaker__stage">
        <img
          className="hud-caretaker__puruhani"
          src={`/art/puruhani/puruhani-${activeElement}.png`}
          alt="Companion"
          loading="lazy"
        />
      </div>
    </aside>
  );
}
