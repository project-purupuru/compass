// @purupuru/peripheral-events · L2 sealed substrate
// Public API per SDD r2 §1+§3
//
// Schema validation at every boundary · effect-schema decode/encode roundtrip
// tested in tests/. Canonical eventId stable across re-encodes per AC-1.1.

export const PACKAGE_VERSION = "0.0.1" as const;

// World events · sealed discriminated union (4 v0 variants)
export {
  Element,
  ElementAffinity,
  ElementShiftEvent,
  MintEvent,
  OracleSource,
  QuizCompletedEvent,
  SolanaPubkey,
  WeatherEvent,
  WorldEvent,
  eventReferencesPuruhani,
  eventTagOf,
} from "./world-event";

// Bazi quiz state · HMAC-validated · GET-chain URL state shape
export {
  Answer,
  BaziQuizState,
  CompletedQuizState,
  QUIZ_COMPLETED_STEP,
  QuizStep,
  signQuizState,
  verifyQuizState,
} from "./bazi-quiz-state";

// Claim message · server-signed payload for genesis-stone mint
export {
  buildClaimMessage,
  byteToElement,
  CLAIM_MESSAGE_SIGNED_BYTES,
  ClaimMessage,
  ClaimNonce,
  elementToByte,
  encodeClaimMessage,
  QuizStateHash,
  signClaimMessage,
  SolanaCluster,
  verifyClaimSignature,
} from "./claim-message";
export type { SignedClaimMessage } from "./claim-message";

// Canonical eventId derivation · stable hash across re-encodes
export { CURRENT_SCHEMA_VERSION, eventIdOf, verifyEventId } from "./event-id";
export type { SourceTag } from "./event-id";

// Bazi resolver · derives archetype from quiz answer element votes
export { archetypeFromAnswers, quizStateHashOf } from "./bazi-resolver";

// StoneClaimed · on-chain Anchor event mirror · indexer consumption (zerker)
export {
  ElementByte,
  StoneClaimedIndexedFields,
  StoneClaimedRaw,
  StoneClaimedSchema,
} from "./stone-claimed";
export type { StoneClaimed } from "./stone-claimed";
