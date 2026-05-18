// Operator + Gumi-curated quiz corpus · 8 questions × 3 hand-picked answers each.
// Per SDD r2 §3.2 + §4.1 · GET-chained quiz · HMAC-validated state per step.
//
// Per-question element selection (curated · NOT algorithmic):
//   Q1 · Fire · Water · Metal
//   Q2 · Earth · Fire · Water
//   Q3 · Wood · Fire · Earth
//   Q4 · Water · Wood · Metal
//   Q5 · Wood · Metal · Water
//   Q6 · Earth · Fire · Wood
//   Q7 · Earth · Metal · Water
//   Q8 · Wood · Fire · Metal
//
// Coverage (24 slots = 8 Qs × 3 answers):
//   Wood  · 5 (Q3, Q4, Q5, Q6, Q8)
//   Fire  · 5 (Q1, Q2, Q3, Q6, Q8)
//   Earth · 4 (Q2, Q3, Q6, Q7)
//   Metal · 5 (Q1, Q4, Q5, Q7, Q8)
//   Water · 5 (Q1, Q2, Q4, Q5, Q7)
// All 5 elements appear 4-5x across the quiz · stable archetype resolution
// without algorithmic element selection.
//
// Scoring (per bazi-resolver.ts):
//   Each answer = +1 to its element. Highest score wins. Tie-break: canonical
//   wuxing order WOOD > FIRE > EARTH > METAL > WATER (one definitive element ·
//   no blended results per operator decision 2026-05-08).
//
// FUTURE (deferred to v1+):
//   Bazi anchor · operator's note: "+1 to birth element before tallying".
//   Requires DOB input step ahead of Q1 + bazi calculator package · this
//   would tighten the bridge between the quiz signal and traditional bazi
//   reading. Not in v0 scope (no DOB collection in the GET-chain Blink today).

import type { Element } from "@purupuru/peripheral-events";

export interface QuizQuestion {
  step: number; // 1..QUIZ_CONFIG.totalSteps
  prompt: string; // ≤ 280 chars
  answers: ReadonlyArray<{
    label: string; // ≤ 80 chars · operator/Gumi prose
    element: Element; // which element this answer leans toward
  }>;
}

// Eight questions · 3 hand-picked answers each · operator + Gumi authored.
export const QUIZ_CORPUS: ReadonlyArray<QuizQuestion> = [
  {
    step: 1,
    prompt: "Your friend cancels plans last minute. What's your first reaction?",
    answers: [
      { label: 'You text back immediately: "why"', element: "FIRE" },
      { label: "Ooh. At last, a free evening", element: "WATER" },
      { label: "Meh. Already had a backup plan anyway", element: "METAL" },
    ],
  },
  {
    step: 2,
    prompt: "I finish what I start.",
    answers: [
      { label: "Agree", element: "EARTH" },
      { label: "I kind of start a lot of things", element: "FIRE" },
      { label: "I lose interest. I don't feel bad about it", element: "WATER" },
    ],
  },
  {
    step: 3,
    prompt: "You're in a group chat and someone says something incredibly confidently wrong.",
    answers: [
      { label: "You wait to see if they figure it out on their own", element: "WOOD" },
      { label: "You correct them immediately perhaps a little too harshly", element: "FIRE" },
      { label: "You privately message them", element: "EARTH" },
    ],
  },
  {
    step: 4,
    prompt: "Pick the one that sounds most like a weekend:",
    answers: [
      { label: "Sleep in, wing it. See what happens", element: "WATER" },
      { label: "Work on something you've been building", element: "WOOD" },
      { label: "Finally organize that thing that's been bothering you", element: "METAL" },
    ],
  },
  {
    step: 5,
    prompt: "Someone you just met is telling you their whole life story. You:",
    answers: [
      { label: "Listen. People don't do this unless they need to", element: "WOOD" },
      { label: "Notice what they're not saying", element: "METAL" },
      { label: "Feel everything they're feeling", element: "WATER" },
    ],
  },
  {
    step: 6,
    prompt: "Your phone is at 3%. You have no charger. What stresses you most?",
    answers: [
      { label: "Not being reachable", element: "EARTH" },
      { label: "Missing something happening right now", element: "FIRE" },
      { label: "Not being able to check on someone", element: "WOOD" },
    ],
  },
  {
    step: 7,
    prompt: "Be honest. How messy is your room right now?",
    answers: [
      { label: "Clean. It bugs me when it's not", element: "EARTH" },
      { label: "Clean where it matters, messy where it doesn't", element: "METAL" },
      { label: "Messy but I know where everything is", element: "WATER" },
    ],
  },
  {
    step: 8,
    prompt: "Someone asks you for advice. You usually:",
    answers: [
      { label: "Ask them questions until they answer it themselves", element: "WOOD" },
      { label: "Tell them what you'd do", element: "FIRE" },
      { label: "Bluntly give them the honest answer even if it's uncomfortable", element: "METAL" },
    ],
  },
] as const;

// Archetype reveals · plain personality-test language · used as the
// description (subhead) on the reveal card. Grounded · no metaphor ·
// reads like a Buzzfeed result the user can immediately understand and
// recognize themselves in. Wuxing element name lives in the TITLE
// (operator-confirmed: element vocab is the inevitable specialized
// language · "tide" wrapped around it was extra metaphor that didn't land
// for users who haven't been initiated into the world's voice yet).
export const ARCHETYPE_REVEALS: Record<Element, string> = {
  // 2-beat structure per element · trait + consequence (the thing the trait
  // does in the world · matches "way to navigate" register operator confirmed
  // in journey-map · gives reveal length parity with the corridor questions ·
  // ARTISAN R4 spec 2026-05-11).
  WOOD: "You start things before they're ready. That's how they become real.",
  FIRE: "You move first and the room moves with you. Quiet is hard for you.",
  EARTH: "You stay when others move on. People come back to you to remember themselves.",
  METAL: "You hear what people aren't saying. The cut is the gift.",
  WATER: "You feel before you think, and you're usually right. You read the room without trying.",
};

// Step indicator · plain "Question X of Y" · rendered as the description
// subhead (under the question prompt). Operator-preferred over poetic variants.
export const QUIZ_STEP_TITLES: Record<number, string> = {
  1: "Question 1 of 8",
  2: "Question 2 of 8",
  3: "Question 3 of 8",
  4: "Question 4 of 8",
  5: "Question 5 of 8",
  6: "Question 6 of 8",
  7: "Question 7 of 8",
  8: "Question 8 of 8",
};

// (Removed 2026-05-10) AMBIENT_PROMPT used to read "the world breathes. take a
// moment with it." — replaced by observatory-aligned data subhead in
// renderAmbient (KEEPER drift report D3 + vocab-bank canonical naming).
