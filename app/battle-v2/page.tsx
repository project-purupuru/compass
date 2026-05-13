/**
 * /battle-v2 — Server route shell for the cycle-1 vertical slice.
 *
 * Per PRD r2 FR-19 + SDD r1 §5.
 *
 * Loads the wood content pack server-side, then passes ContentDatabase + the
 * initial card hand + UI screen definition to the BattleV2 client component.
 */

import { resolve } from "node:path";

import { buildContentDatabase, loadPack } from "@/lib/purupuru/content/loader";
import type { CardDefinition, PresentationSequence } from "@/lib/purupuru/contracts/types";

import { BattleV2 } from "./_components/BattleV2";
import "./_styles/battle-v2.css";

export const metadata = {
  title: "Battle v2 · Wood Vertical Slice (Purupuru Cycle 1)",
  description:
    "Cycle-1 vertical slice: harness contracts wired end-to-end. Hover the wood card, click the wood grove, watch the 11-beat activation sequence.",
};

export default function BattleV2Page() {
  const packDir = resolve(process.cwd(), "lib/purupuru/content/wood");
  const pack = loadPack(packDir);
  const content = buildContentDatabase(pack);

  const initialCardDefinitions: readonly CardDefinition[] = pack.cards.map((c) => c.data);
  const initialSequenceMap: Record<string, PresentationSequence> = Object.fromEntries(
    pack.sequences.map((s) => [s.data.id, s.data]),
  );
  const uiScreen = pack.uiScreens[0]?.data;

  if (!uiScreen) {
    throw new Error("[battle-v2] No UI screen found in wood content pack.");
  }

  return (
    <main className="battle-v2-shell">
      <BattleV2
        content={content}
        uiScreen={uiScreen}
        initialCardDefinitions={initialCardDefinitions}
        initialSequenceMap={initialSequenceMap}
      />
    </main>
  );
}
