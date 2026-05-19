/**
 * /play — Server route shell for the cycle-1 vertical slice.
 *
 * Renamed from /battle-v2 in cycle-2 S0 (route taxonomy /play + /honeycomb).
 * Server-side pack load + ContentDatabase delegation unchanged.
 *
 * Per cycle-1 PRD r2 FR-19 + SDD r1 §5 · cycle-2 PRD FR-1.
 */

import { resolve } from "node:path";

import { loadPack } from "@/lib/purupuru/content/loader";
import type {
  CardDefinition,
  ElementDefinition,
  PresentationSequence,
  UiScreenDefinition,
  ZoneDefinition,
  ZoneEventDefinition,
} from "@/lib/purupuru/contracts/types";

import { BattleV2 } from "@/app/battle-v2/_components/BattleV2";
import "@/app/battle-v2/_styles/battle-v2.css";

export const metadata = {
  title: "Battle v2 · Wood Vertical Slice (Purupuru Cycle 1)",
  description:
    "Cycle-1 vertical slice: harness contracts wired end-to-end. Hover the wood card, click the wood grove, watch the 11-beat activation sequence.",
};

export interface PackPayload {
  readonly cards: readonly CardDefinition[];
  readonly zones: readonly ZoneDefinition[];
  readonly events: readonly ZoneEventDefinition[];
  readonly sequences: readonly PresentationSequence[];
  readonly elements: readonly ElementDefinition[];
  readonly uiScreens: readonly UiScreenDefinition[];
}

export default function BattleV2Page() {
  const packDir = resolve(process.cwd(), "lib/purupuru/content/wood");
  const pack = loadPack(packDir);

  // Pass plain data arrays only — functions can't cross server→client boundary.
  // BattleV2 client component rebuilds ContentDatabase locally.
  const payload: PackPayload = {
    cards: pack.cards.map((c) => c.data),
    zones: pack.zones.map((z) => z.data),
    events: pack.events.map((e) => e.data),
    sequences: pack.sequences.map((s) => s.data),
    elements: pack.elements.map((e) => e.data),
    uiScreens: pack.uiScreens.map((u) => u.data),
  };

  if (payload.uiScreens.length === 0) {
    throw new Error("[battle-v2] No UI screen found in wood content pack.");
  }

  return (
    <main className="battle-v2-shell">
      <BattleV2 pack={payload} />
    </main>
  );
}
