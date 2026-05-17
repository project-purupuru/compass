/**
 * HudOverlay — composes the HUD zones from the operator fence brief
 * (2026-05-14): the Ribbon (F2, replaces the old top-strip), the EnemyCorner
 * (F14), and the CaretakerCorner (F12).
 *
 * The WorldFocusRail (F4) was removed 2026-05-14 — it duplicated EntityPanel's
 * hovered-zone display. EntityPanel (mounted in BattleV2) is now the single
 * world-focus panel. `hoveredZoneId` is still accepted on the props (BattleV2
 * passes it) but no longer consumed here.
 *
 * The StonesColumn (F6) was unmounted 2026-05-14 — the active tide is the
 * only signal, and the Ribbon carries it as a single breathing stone. The
 * StonesColumn component file is left untouched, recoverable.
 *
 * Mounted as a direct sibling in BattleV2 — alongside EntityPanel / VfxLayer.
 * Each zone is fixed-position and edge-anchored, so this overlay is a thin
 * composition shell with `pointer-events: none`; the panels opt back in.
 *
 * Spec: grimoires/loa/context/14-battle-v2-hud-zone-map.md
 */

"use client";

import type { GameState } from "@/lib/purupuru/contracts/types";

import { DragGhost } from "../drag/DragGhost";
import { DragLayer } from "../drag/DragLayer";
import { CaretakerCorner } from "./CaretakerCorner";
import { EnemyCorner } from "./EnemyCorner";
import { ProfileAvatar } from "./ProfileAvatar";
import "./hud-zones.css";

interface HudOverlayProps {
  readonly state: GameState;
  /** Retained for the BattleV2 prop contract; the rail that consumed it was removed. */
  readonly hoveredZoneId: string | null;
}

export function HudOverlay({ state }: HudOverlayProps) {
  return (
    <div className="hud-overlay">
      {/* Top-left player profile pic (replaces the old Ribbon username strip
       * per operator 2026-05-16 — "no username for now, big PFP circle"). */}
      <ProfileAvatar />
      <EnemyCorner />
      <CaretakerCorner activeElement={state.weather.activeElement} />
      {/* Card drag-to-region: window pointer tracking + the cursor-following
          ghost. Map-side drop wiring is the coordination step — see
          grimoires/loa/context/16-battle-v2-card-drag-to-region.md */}
      <DragLayer />
      <DragGhost />
    </div>
  );
}
