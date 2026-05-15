/**
 * /battle-v2/hud-preview — isolated HUD zone-map preview.
 *
 * A static layout study (NOT wired to game state) that crystallizes the
 * operator's fence-brief from 2026-05-14 into a visible 6-zone embedded HUD.
 * Lives on its own route so it cannot collide with the in-flight Session-7
 * work on the real /battle-v2 components.
 *
 * The FenceLayer dev tool is inherited from app/battle-v2/layout.tsx — so
 * `/battle-v2/hud-preview?fence=1` lets the operator fence THIS mock for the
 * next round of notes. The refinement loop closes on itself.
 *
 * Spec: grimoires/loa/context/16-battle-v2-hud-zone-map.md
 */

import { HudFrame } from "./HudFrame";
import "./hud-frame.css";

export const metadata = {
  title: "Battle v2 · HUD Zone-Map Preview",
  description:
    "Static layout study — the 6-zone embedded HUD crystallized from the operator fence brief.",
};

export default function HudPreviewPage() {
  return <HudFrame />;
}
