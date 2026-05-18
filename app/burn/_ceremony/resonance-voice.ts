/**
 * Resonance as a FELT state — never a numeral (NFR-2).
 *
 * The canonical Svelte ceremony prints "resonance {n}". compass renders
 * the bond as emotional weather instead: the numeral never appears on the
 * burn surface. The caretaker's narrative voice is sampled from the
 * existing `whispers.ts` bank (the player's element, contemplative moods)
 * so the route reuses the substrate's voice rather than inventing one.
 *
 * Q-2 (FEEL-mode micro-decision, SDD §13) is resolved here: the felt-state
 * copy for R1/R2/R3+.
 */

import type { Element } from "@/lib/honeycomb/wuxing";
import { whisper } from "@/lib/honeycomb/whispers";

/**
 * The bond's felt name. R1 = a quiet bond. R2 = the bond deepens.
 * R3+ = the bond is unbreakable. No numeral — the level is *felt*.
 */
export function bondState(resonance: number): string {
  if (resonance >= 3) return "the bond is unbreakable";
  if (resonance === 2) return "the bond deepens";
  return "a quiet bond";
}

/**
 * The caretaker's whisper for the reveal. First burn = "all rivers find
 * the sea" feeling (a stillness whisper); a level-up = "the bond deepens"
 * (an anticipate whisper — the relationship growing). Element-keyed so the
 * voice matches the player's caretaker; seed keeps it deterministic.
 */
export function revealWhisper(
  element: Element,
  isLevelUp: boolean,
  seed: number,
): string {
  return whisper(element, isLevelUp ? "anticipate" : "stillness", seed);
}
