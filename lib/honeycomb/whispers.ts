/**
 * Caretaker whispers — Persona/Futaba navigator pattern.
 *
 * The player's caretaker ALWAYS speaks. Opponent caretaker is voiceless.
 * Strategic information carried through personality, not dashboards.
 *
 * Each line must be unmistakably THAT character.
 *
 * Lifted from world-purupuru/sites/world/src/lib/battle/state.svelte.ts
 * (Session 75 Gumi alignment). Lines are short, in-character, present-tense.
 * They are NOT mechanic explanations — they're emotional weather.
 */

import type { Element } from "./wuxing";

export type WhisperMood = "win" | "lose" | "draw" | "anticipate" | "stillness";

export interface WhisperBank {
  readonly win: readonly string[];
  readonly lose: readonly string[];
  readonly draw: readonly string[];
  readonly anticipate: readonly string[];
  readonly stillness: readonly string[];
}

const WHISPERS: Record<Element, WhisperBank> = {
  wood: {
    win: [
      "The garden blooms.",
      "Oh — it worked!",
      "Kaori and Puru, unstoppable.",
      "See? The seeds knew.",
      "One more row to tend.",
    ],
    lose: [
      "The seeds are still there.",
      "Even the flowers take a while.",
      "We water it again tomorrow.",
    ],
    draw: ["The roots held."],
    anticipate: ["Listen for the soil.", "The hopeful path is patient."],
    stillness: ["Spring is waiting."],
  },
  fire: {
    win: [
      "NOW.",
      "Did you see that?",
      "That was the good kind of reckless.",
      "Told you.",
      "Puru is literally on fire.",
    ],
    lose: [
      "Okay. That was actually interesting.",
      "...I already know what I did wrong.",
      "Fine. But I saw an opening.",
    ],
    draw: ["We both felt that."],
    anticipate: ["I don't wait. I move.", "Strike where they don't expect."],
    stillness: ["Embers don't stay still."],
  },
  earth: {
    win: ["Still here.", "Oh. We did okay.", "Puru seemed happy about that.", "Mm. Yes."],
    lose: ["That's alright.", "Nothing fell over.", "Empty bowls fill again."],
    draw: ["Even ground."],
    anticipate: ["Wait with me.", "The center holds."],
    stillness: ["The earth doesn't hurry."],
  },
  metal: {
    win: ["Clean.", "As intended.", "The cut was honest.", "Loyal Puru sees it through."],
    lose: [
      "A duller blade today.",
      "We will sharpen what we have.",
      "The mistake was named — that's enough.",
    ],
    draw: ["Balanced edges."],
    anticipate: ["Measure once.", "The cut comes when it must."],
    stillness: ["Metal rests cold."],
  },
  water: {
    win: [
      "Of course.",
      "I felt that one coming.",
      "Too much, but the right way.",
      "Ruan saw it. Puru followed.",
    ],
    lose: [
      "Everything sounded so loud.",
      "I tried, I tried — okay, again.",
      "The wave broke wrong.",
    ],
    draw: ["The tide and the tide."],
    anticipate: ["Everything is signal.", "Let the current move us."],
    stillness: ["Deep water is quiet."],
  },
};

/**
 * Sample a whisper line by element + mood + deterministic seed.
 * Same (element, mood, seed) → same line. Drives replayable matches.
 */
export function whisper(element: Element, mood: WhisperMood, seed: number): string {
  const bank = WHISPERS[element][mood];
  if (bank.length === 0) return "";
  // Hash seed into index without floating-point drift.
  const idx = ((seed % bank.length) + bank.length) % bank.length;
  return bank[idx];
}

export const WHISPER_BANKS = WHISPERS;
