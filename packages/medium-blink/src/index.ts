// @purupuru/medium-blink · Blink medium renderer
// SDD r2 §1+§4 · per Codex's awareness model §4

export const PACKAGE_VERSION = "0.0.1" as const;

// Renderers · pure functions · ActionGetResponse shape per Solana Actions spec.
export {
  renderAmbient,
  renderQuizResult,
  renderQuizStart,
  renderQuizStep,
  validateActionResponse,
} from "./quiz-renderer";

export type { RendererConfig } from "./quiz-renderer";

// Voice corpus · operator + Gumi-authored copy.
export { ARCHETYPE_REVEALS, QUIZ_CORPUS, QUIZ_STEP_TITLES } from "./voice-corpus";

export type { QuizQuestion } from "./voice-corpus";

// Solana Actions types + BLINK_DESCRIPTOR constants.
export { BLINK_DESCRIPTOR } from "./solana-actions-types";

export type {
  ActionGetResponse,
  ActionPostResponse,
  BlinkDescriptor,
  LinkedAction,
  LinkedActionType,
  NextActionLink,
  PostResponse,
} from "./solana-actions-types";

// Quiz config · single source of truth for shape (steps, buttons-per-step,
// chain style). Operator + Gumi tune these without touching renderer code.
export { QUIZ_CONFIG, selectAnswers, shouldButtonsPost } from "./quiz-config";

export type { ButtonSelection, ChainStyle, QuizConfig } from "./quiz-config";
