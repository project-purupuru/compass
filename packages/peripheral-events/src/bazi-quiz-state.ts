// BaziQuizState · HMAC-validated quiz state for GET-chain endpoints
// SDD r2 §3.2 · post-flatline-r4 walletAwareGet:false fix
//
// HMAC over (step, answers) ONLY · NO account.
// Wallet binds at mint POST (per Solana Actions spec · GET is anonymous).
//
// HMAC-SHA256 (untruncated · 32 bytes · 64 hex chars in mac field).
// Length-extension safe by virtue of HMAC construction (NOT raw SHA-256).
// Constant-time compare via crypto.timingSafeEqual.

import { createHmac, timingSafeEqual } from "node:crypto";
import { Schema as S } from "effect";

// 5-button multichoice answer · one per element (Wood/Fire/Earth/Metal/Water).
// Each answer's element mapping lives in medium-blink/voice-corpus.ts.
export const Answer = S.Literal(0, 1, 2, 3, 4);
export type Answer = S.Schema.Type<typeof Answer>;

// Quiz step (1..9 · 1-8 = active step · 9 = completed sentinel).
// step=9 → answers.length=8 (all questions answered) · used at result + mint
// routes as the canonical "completed" HMAC state. The verifyQuizState
// invariant `answers.length === step - 1` holds across the full range.
export const QuizStep = S.Number.pipe(S.between(1, 9));
export type QuizStep = S.Schema.Type<typeof QuizStep>;

// "All answers in" · the step value used at /result + /mint endpoints.
// Importing this constant avoids magic numbers at call sites and makes the
// "completed" semantics explicit in the type system.
export const QUIZ_COMPLETED_STEP = 9 as const;

// Quiz state · URL-encoded between Q1-Q5 GET requests.
//
// Invariant: answers.length === step - 1 (answers from PREVIOUS steps).
// Server validates HMAC at every step transition.
export const BaziQuizState = S.Struct({
  step: QuizStep,
  answers: S.Array(Answer),
  mac: S.String, // hex HMAC-SHA256 · S2-T2 fills implementation
});
export type BaziQuizState = S.Schema.Type<typeof BaziQuizState>;

// Final quiz state at result endpoint · all 8 answers present.
export const CompletedQuizState = S.Struct({
  answers: S.Tuple(Answer, Answer, Answer, Answer, Answer, Answer, Answer, Answer),
  mac: S.String,
});
export type CompletedQuizState = S.Schema.Type<typeof CompletedQuizState>;

// ---------------------------------------------------------------------------
// HMAC encoding · sign · verify
// ---------------------------------------------------------------------------

// Canonical encoding version. Bump if the byte layout below ever changes ·
// existing macs become unverifiable, forcing a clean upgrade.
const CANONICAL_VERSION = 1;

// HMAC key length: SHA-256 block size · NIST SP 800-107 recommends ≥ digest size.
const HMAC_KEY_BYTES = 32;

// Canonical encoding of {step, answers} for HMAC input.
// Format: [version:1B][step:1B][answers.length:1B][...answers:1B each]
// Length-prefixed · forbids ambiguous concatenation (different (step, answers)
// pairs map to distinct byte sequences). SDD §3.2 line 214 specifies CBOR ·
// this custom encoder fulfills the same intent (deterministic, length-prefixed,
// concat-unambiguous) without an external dependency. If quiz state ever grows
// new fields, bump CANONICAL_VERSION rather than overlaying offsets.
function canonicalEncode(step: number, answers: ReadonlyArray<number>): Uint8Array {
  const buf = new Uint8Array(3 + answers.length);
  buf[0] = CANONICAL_VERSION;
  buf[1] = step;
  buf[2] = answers.length;
  for (let i = 0; i < answers.length; i++) buf[3 + i] = answers[i];
  return buf;
}

// Resolve the HMAC key. Production: env QUIZ_HMAC_KEY (64 hex chars = 32 bytes).
// Tests: pass `opts.key` directly to avoid env coupling.
function resolveHmacKey(opts?: { key?: Buffer }): Buffer {
  if (opts?.key !== undefined) {
    if (opts.key.length !== HMAC_KEY_BYTES) {
      throw new Error(`QUIZ_HMAC key must be ${HMAC_KEY_BYTES} bytes, got ${opts.key.length}`);
    }
    return opts.key;
  }
  const hex = process.env.QUIZ_HMAC_KEY;
  if (!hex) {
    throw new Error("QUIZ_HMAC_KEY env var not set · generate with: openssl rand -hex 32");
  }
  if (hex.length !== HMAC_KEY_BYTES * 2) {
    throw new Error(
      `QUIZ_HMAC_KEY must be ${HMAC_KEY_BYTES * 2} hex chars (${HMAC_KEY_BYTES} bytes), got ${hex.length}`,
    );
  }
  return Buffer.from(hex, "hex");
}

// Sign a quiz state · returns the BaziQuizState shape with a valid mac field.
// Caller MUST provide step + answers; mac is computed.
export function signQuizState(
  state: { step: QuizStep; answers: ReadonlyArray<Answer> },
  opts?: { key?: Buffer },
): BaziQuizState {
  const key = resolveHmacKey(opts);
  const tag = createHmac("sha256", key)
    .update(canonicalEncode(state.step, state.answers))
    .digest("hex");
  return {
    step: state.step,
    answers: [...state.answers],
    mac: tag,
  };
}

// Verify a quiz state's mac · returns true ONLY if both invariants and HMAC pass.
// Defense-in-depth: invariant checks (step ∈ [1,8] · answers.length === step-1 ·
// each answer ∈ [0,4]) run BEFORE the HMAC compare so a malformed-but-correctly-
// macced state from a buggy producer does not slip through. Constant-time HMAC
// compare via timingSafeEqual.
export function verifyQuizState(state: BaziQuizState, opts?: { key?: Buffer }): boolean {
  // Invariants — would also be caught by Effect Schema decode at the API layer,
  // duplicated here so this function is safe to call on raw inputs.
  if (!Number.isInteger(state.step) || state.step < 1 || state.step > 9) {
    return false;
  }
  if (state.answers.length !== state.step - 1) return false;
  for (const a of state.answers) {
    if (!Number.isInteger(a) || a < 0 || a > 4) return false;
  }

  const key = resolveHmacKey(opts);
  const expected = createHmac("sha256", key)
    .update(canonicalEncode(state.step, state.answers))
    .digest();

  let actual: Buffer;
  try {
    actual = Buffer.from(state.mac, "hex");
  } catch {
    return false;
  }
  // Reject malformed mac (wrong length OR contained non-hex chars · Buffer.from
  // silently truncates on bad hex, so length check catches both cases).
  if (actual.length !== expected.length || actual.length * 2 !== state.mac.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
