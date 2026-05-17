/**
 * Grounding Envelope · cycle-4 honeycomb doctrine
 *
 * Cross-cutting metadata that travels WITH every artifact through the 7 ACVP
 * components (Reality, Contracts, Schemas, State machines, Events, Hashes, Tests).
 * Refines the narrative 4-state framing (bronze/silver/gold/refuted) into 2
 * orthogonal axes: tier (3-state promotion ladder per medallion architecture) +
 * grounding_status (3-state epistemic tristate per loa-hounfour discipline).
 *
 * Hand-port of construct-effect-substrate/schemas/grounding-envelope.schema.json
 * Pattern: hand-port-with-drift (cycle-2 honeycomb doctrine)
 * Source doctrine: construct-effect-substrate/patterns/grounding-ladder-as-substrate-primitive.md
 */

import { Schema } from "effect";

export const Tier = Schema.Literal("bronze", "silver", "gold");
export type Tier = Schema.Schema.Type<typeof Tier>;

export const GroundingStatus = Schema.Literal(
  "grounded",
  "refuted",
  "unverifiable",
);
export type GroundingStatus = Schema.Schema.Type<typeof GroundingStatus>;

export const LearningStatus = Schema.Literal(
  "strongly-validated",
  "directionally-correct",
  "hypothesis-failed",
  "smol-evidence",
  "cant-make-a-conclusion",
);
export type LearningStatus = Schema.Schema.Type<typeof LearningStatus>;

export const BlessedBy = Schema.Literal(
  "operator",
  "auto-derived",
  "construct-consensus",
);
export type BlessedBy = Schema.Schema.Type<typeof BlessedBy>;

const Uuid = Schema.String.pipe(
  Schema.pattern(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ),
);

const Sha256Hash = Schema.String.pipe(
  Schema.pattern(/^sha256:[0-9a-f]{64}$/),
);

const Semver = Schema.String.pipe(Schema.pattern(/^\d+\.\d+\.\d+$/));

const IsoDateString = Schema.String;

export const LinkedUtc = Schema.Struct({
  canvas_url: Schema.String.pipe(Schema.minLength(1)),
  quote_hash: Sha256Hash,
  confidence: Schema.optional(Schema.Number.pipe(Schema.between(0, 1))),
  learning_status: Schema.optional(LearningStatus),
});
export type LinkedUtc = Schema.Schema.Type<typeof LinkedUtc>;

export const GroundingEnvelope = Schema.Struct({
  envelope_id: Uuid,
  artifact_path: Schema.String.pipe(Schema.minLength(1)),
  tier: Tier,
  grounding_status: GroundingStatus,
  linked_utcs: Schema.optional(Schema.Array(LinkedUtc)),
  blessed_by: Schema.optional(BlessedBy),
  operator_signed: Schema.optional(Schema.Boolean),
  asserted_at: IsoDateString,
  refuted_at: Schema.optional(IsoDateString),
  refutation_reason: Schema.optional(Schema.String),
  contract_version: Semver,
  metadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
});
export type GroundingEnvelope = Schema.Schema.Type<typeof GroundingEnvelope>;

export const CURRENT_CONTRACT_VERSION = "1.0.0";
