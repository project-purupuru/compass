// Bazi Resolver · derive archetype Element from quiz answers
// SDD r2 §3.4 · ECS system per Codex's awareness model §7
//
// Pure function · counts element votes across answers · returns dominant element.
// Tie-break: WOOD > FIRE > EARTH > METAL > WATER (canonical wuxing order).
//
// S1-T7 result route uses this · S2-T2 wires HMAC validation upstream.

import { createHash } from "node:crypto";

import type { Element } from "./world-event";

// 8 questions × 3 hand-curated answers per Q (operator + Gumi · 2026-05-08).
// Caller passes the ELEMENT each answer maps to (looked up from medium-blink corpus).
// Per-Q element distribution is curated for narrative tension · over 8 Qs each
// element appears 4-5 times (Wood/Fire/Metal/Water=5 · Earth=4) so cumulative
// vote totals stably resolve a single archetype.
// Tie-break: canonical wuxing order WOOD > FIRE > EARTH > METAL > WATER ·
// always one definitive element (no blended outcomes per operator decision).
export const archetypeFromAnswers = (elementVotes: ReadonlyArray<Element>): Element => {
  if (elementVotes.length === 0) {
    return "WOOD"; // sentinel · empty quiz fallback (should not occur in practice)
  }

  const tallies: Record<Element, number> = {
    WOOD: 0,
    FIRE: 0,
    EARTH: 0,
    METAL: 0,
    WATER: 0,
  };
  for (const e of elementVotes) {
    tallies[e]++;
  }

  // Canonical wuxing tie-break order.
  const canonicalOrder: Element[] = ["WOOD", "FIRE", "EARTH", "METAL", "WATER"];
  let dominant: Element = "WOOD";
  let highest = -1;
  for (const e of canonicalOrder) {
    if (tallies[e] > highest) {
      highest = tallies[e];
      dominant = e;
    }
  }
  return dominant;
};

// Hash quiz state (answers) for ClaimMessage's quizStateHash field.
// Server recomputes this at mint time · ClaimMessage binds claim to validated answers.
//
// Synchronous · Node crypto · same approach as event-id.ts. peripheral-events
// is server-only by design (SDD §1 L2 substrate) so node:crypto is in scope.
export const quizStateHashOf = (answers: ReadonlyArray<0 | 1 | 2 | 3>): string => {
  return createHash("sha256").update(answers.join(",")).digest("hex");
};
