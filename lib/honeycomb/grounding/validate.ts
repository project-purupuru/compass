/**
 * Grounding Envelope Validator · cycle-4 honeycomb runtime
 *
 * Two-pass validation:
 *  1. Structural — Effect Schema decode (shape, types, formats)
 *  2. Cross-field — discipline rules from envelope.constraints.json
 *
 * Mode is implicit in the return shape: `errors` blocks integration; `warnings`
 * surfaces concerns without blocking (caller picks behavior).
 *
 * Source doctrine: construct-effect-substrate/patterns/grounding-ladder-as-substrate-primitive.md
 */

import { Effect, Either, Schema } from "effect";
import { GroundingEnvelope, type GroundingEnvelope as GE } from "./envelope";

export class GroundingValidationError {
  readonly _tag = "GroundingValidationError";
  constructor(
    readonly rule: string,
    readonly message: string,
    readonly path?: string,
  ) {}
}

export type ValidationResult = {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<GroundingValidationError>;
  readonly warnings: ReadonlyArray<string>;
  readonly envelope?: GE;
};

/**
 * Decode an unknown input as a GroundingEnvelope and apply cross-field constraints.
 *
 * Return shape mirrors loa-hounfour's `validate()` contract.
 */
export const validate = (input: unknown): Effect.Effect<ValidationResult> =>
  Effect.sync(() => {
    const decoded = Schema.decodeUnknownEither(GroundingEnvelope)(input);
    if (Either.isLeft(decoded)) {
      return {
        valid: false,
        errors: [
          new GroundingValidationError(
            "schema-decode",
            `structural decode failed: ${String(decoded.left)}`,
          ),
        ],
        warnings: [],
      };
    }
    const envelope = decoded.right;
    const { errors, warnings } = applyCrossFieldConstraints(envelope);
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      envelope,
    };
  });

/**
 * Cross-field constraint pass.
 * Mirrors construct-effect-substrate/constraints/GroundingEnvelope.constraints.json.
 */
function applyCrossFieldConstraints(e: GE): {
  errors: GroundingValidationError[];
  warnings: string[];
} {
  const errors: GroundingValidationError[] = [];
  const warnings: string[] = [];

  if (e.tier === "gold" && (!e.linked_utcs || e.linked_utcs.length === 0)) {
    errors.push(
      new GroundingValidationError(
        "gold-requires-utc-linked",
        "tier=gold requires at least one linked UTC (anti-spiral tether)",
      ),
    );
  }

  if (e.tier === "gold" && e.grounding_status !== "grounded") {
    errors.push(
      new GroundingValidationError(
        "gold-requires-grounded",
        "tier=gold requires grounding_status=grounded",
      ),
    );
  }

  if (e.tier === "gold" && e.linked_utcs && e.linked_utcs.length > 0) {
    const hasValid = e.linked_utcs.some(
      (lu) =>
        lu.learning_status === "strongly-validated" ||
        lu.learning_status === "directionally-correct",
    );
    if (!hasValid) {
      errors.push(
        new GroundingValidationError(
          "gold-utc-learning-valid",
          "tier=gold requires at least one UTC with learning_status in [strongly-validated, directionally-correct]",
        ),
      );
    }
  }

  if (e.tier === "silver") {
    const hasSig = e.operator_signed === true;
    const consensusVoices = (e.metadata as Record<string, unknown> | undefined)
      ?.consensus_voices;
    const hasConsensus =
      e.blessed_by === "construct-consensus" &&
      Array.isArray(consensusVoices) &&
      (consensusVoices as unknown[]).length >= 2;
    if (!hasSig && !hasConsensus) {
      errors.push(
        new GroundingValidationError(
          "silver-requires-signature-or-consensus",
          "tier=silver requires operator_signed=true OR construct-consensus with >=2 voices",
        ),
      );
    }
  }

  if (e.operator_signed === true && e.blessed_by !== "operator") {
    errors.push(
      new GroundingValidationError(
        "operator-signed-needs-blessed-by-operator",
        "operator_signed=true requires blessed_by=operator (non-transferability)",
      ),
    );
  }

  if (e.grounding_status === "refuted" && !e.refuted_at) {
    errors.push(
      new GroundingValidationError(
        "refuted-requires-timestamp",
        "grounding_status=refuted requires refuted_at timestamp",
      ),
    );
  }

  if (e.refuted_at && e.grounding_status !== "refuted") {
    errors.push(
      new GroundingValidationError(
        "refuted-at-only-with-refuted-status",
        "refuted_at present requires grounding_status=refuted",
      ),
    );
  }

  if (e.grounding_status === "refuted" && e.tier === "gold") {
    warnings.push(
      "tier=gold with grounding_status=refuted preserves history but integrators MUST treat as ungated",
    );
  }

  if (e.tier === "bronze" && e.operator_signed === true) {
    warnings.push(
      "tier=bronze with operator_signed=true suggests forgotten silver promotion",
    );
  }

  if (e.contract_version !== "1.0.0") {
    warnings.push(
      `contract_version=${e.contract_version} != 1.0.0 (this validator authored against 1.0.0)`,
    );
  }

  return { errors, warnings };
}
