// Quiz configuration · single source of truth for shape + behavior of the
// quiz Blink chain. Operator + Gumi can iterate UX numbers here without
// touching renderer/route/schema code.
//
// What lives here vs what lives elsewhere:
//   · Shape (how many steps · how many buttons · which selection strategy)
//   · Chain mechanics (POST inline-next vs simple GET-chain)
//
// What does NOT live here:
//   · Question + answer text → packages/medium-blink/src/voice-corpus.ts
//   · Element scoring → packages/peripheral-events/src/bazi-resolver.ts
//   · Card rendering → packages/medium-blink/src/quiz-renderer.ts

export type ButtonSelection =
  | "first-n" // deterministic · take first N from corpus answers
  | "spread-n" // even-spaced · indices [0, ⌊len/2⌋, len-1] etc · max contrast
  | "rotate-n" // varies per session · TODO sprint-3 (needs random seed)
  | "tension-pick"; // Gumi-curated · TODO when she designs per-Q index sets

export type ChainStyle =
  | "inline-post" // PRODUCTION · button POSTs href · response has next action inline
  | "external-link" // dev-only · button is a regular hyperlink (degraded · breaks Blink UX)
  | "get-chain"; // legacy sprint-1 · GET-only · buttons appear unclickable in Dialect renderer

export interface QuizConfig {
  /** Number of questions in the quiz · 1..N · drives CompletedQuizState length */
  totalSteps: number;
  /** Buttons per step · 1..5 (Blink-spec hard max) · Gumi: 3 looks better than 5 */
  buttonsPerStep: number;
  /** Strategy for picking N answers from a 5-element corpus · only matters when buttonsPerStep < 5 */
  buttonSelection: ButtonSelection;
  /** How buttons chain to next step · only "inline-post" works in real Dialect renderer */
  chainStyle: ChainStyle;
}

export const QUIZ_CONFIG: QuizConfig = {
  totalSteps: 8, // 8 questions · operator-authored corpus
  buttonsPerStep: 3, // Gumi feedback · 5 buttons looks ugly · 3 lands cleaner
  buttonSelection: "first-n", // Gumi reorders corpus to control which 3 show
  chainStyle: "inline-post", // production-correct · works in Phantom + dial.to + Dialect
};

/**
 * Apply the configured selection strategy to a corpus answer array.
 * Returns the subset of indices to render as buttons + their original positions.
 *
 * @param answers Full per-question corpus (5 element-leaning answers)
 * @param stepIndex 0-based step index · used for variation strategies (unused for "first-n")
 * @returns Array of `{ originalIndex, answer }` · length === buttonsPerStep
 */
export function selectAnswers<T>(
  answers: ReadonlyArray<T>,
  stepIndex: number,
): Array<{ originalIndex: number; answer: T }> {
  const n = Math.min(QUIZ_CONFIG.buttonsPerStep, answers.length);

  switch (QUIZ_CONFIG.buttonSelection) {
    case "first-n":
      return answers.slice(0, n).map((answer, i) => ({ originalIndex: i, answer }));

    case "spread-n": {
      // Pick n indices spread evenly across [0, length-1]
      // Example: 3 from 5 → indices [0, 2, 4]
      const indices: number[] = [];
      if (n === 1) {
        indices.push(0);
      } else {
        const step = (answers.length - 1) / (n - 1);
        for (let i = 0; i < n; i++) {
          indices.push(Math.round(i * step));
        }
      }
      return indices.map((originalIndex) => ({
        originalIndex,
        answer: answers[originalIndex] as T,
      }));
    }

    case "rotate-n":
    case "tension-pick":
      // TODO sprint-3 · for now fall through to first-n
      return answers.slice(0, n).map((answer, i) => ({ originalIndex: i, answer }));
  }
}

/** True if buttons should POST (per chainStyle) · false if simple GET-chain */
export function shouldButtonsPost(): boolean {
  return QUIZ_CONFIG.chainStyle === "inline-post";
}
