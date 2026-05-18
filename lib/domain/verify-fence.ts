/**
 * Compile-time verify⊥judge fence (S3-T3 · per PRD D2 + SDD §6.2 + BB-014).
 *
 * Forward-compatible with straylight Phase 23b signed-assertion API:
 * when 23b ships, `Verified<T>` becomes `RecallReceipt<T>` mechanically.
 * Today: ZERO straylight runtime imports.
 *
 * Brand pattern: `unique symbol` brand (per SDD §8.3 disambiguation
 * vs S.brand value-tagging). The brand is constructable ONLY through
 * `verify()` · `judge()` accepts only `Verified<T>` at the type level.
 */

import { Effect, Schema as S } from "effect";

declare const VerifiedBrand: unique symbol;

/**
 * Branded marker · only constructable via verify().
 * Type-level fence ensures judge() refuses unbranded T at compile time.
 */
export type Verified<T> = T & { readonly [VerifiedBrand]: true };

export class VerifyError extends S.TaggedError<VerifyError>()("VerifyError", {
  reason: S.String,
}) {}

export class JudgeError extends S.TaggedError<JudgeError>()("JudgeError", { reason: S.String }) {}

/**
 * verify is pure · substrate-anchored. Decodes raw input via the schema,
 * brands the result on success.
 */
export const verify = <T>(
  schema: S.Schema<T>,
  input: unknown,
): Effect.Effect<Verified<T>, VerifyError> =>
  S.decodeUnknown(schema)(input).pipe(
    Effect.map((decoded) => decoded as Verified<T>),
    Effect.mapError((cause) => new VerifyError({ reason: String(cause) })),
  );

/**
 * judge is LLM-bound territory · revocable. INVARIANT (compile-time):
 * signature requires Verified<T>. A raw T won't typecheck (verify-fence guard).
 *
 * Today this is structural-only: no LLM call lives in compass. When
 * future cycles add LLM-bound judgment, this fence is what prevents
 * unvalidated input from reaching it.
 */
export const judge = <T, R>(
  e: Verified<T>,
  judgmentFn: (verified: T) => Effect.Effect<R, JudgeError>,
): Effect.Effect<R, JudgeError> => judgmentFn(e);
