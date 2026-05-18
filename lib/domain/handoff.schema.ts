/**
 * ConstructHandoff envelope · Effect Schema mirror of vendored
 * `lib/domain/schemas/construct-handoff.schema.json` from
 * `construct-rooms-substrate@8259a765`.
 *
 * Five typed-stream output_type values (Signal/Verdict/Artifact/Intent/
 * Operator-Model) match the canonical 5-stream taxonomy.
 *
 * verdict starts as Unknown per PRD D6 envelope-shell-first ordering.
 * S2 narrows to discriminated union of hand-ported hounfour types.
 */

import { Schema as S } from "effect";
// Plain JSON import per S0-T8 finding · TS 5.0.2 doesn't support `with { type: "json" }` (needs 5.3+)
// resolveJsonModule: true in tsconfig handles the rest.
import handoffSchemaJson from "./schemas/construct-handoff.schema.json";
import { DomainEventPort } from "./domain-event.hounfour-port";
import { AuditTrailEntryPort } from "./audit-trail-entry.hounfour-port";

export const OutputType = S.Literal("Signal", "Verdict", "Artifact", "Intent", "Operator-Model");
export type OutputType = S.Schema.Type<typeof OutputType>;

export const InvocationMode = S.Literal("room", "studio", "headless");
export type InvocationMode = S.Schema.Type<typeof InvocationMode>;

// S2-T10: verdict narrowed from S.Unknown to discriminated union of hand-ported types.
// Plus a structural fallback for envelope shapes that don't fit hounfour types yet
// (e.g., compass-specific WorldEvent variants). The fallback is `S.Record<string, unknown>`
// rather than full S.Unknown so we still get a structural baseline.
export const VerdictPayload = S.Union(
  DomainEventPort,
  AuditTrailEntryPort,
  S.Record({ key: S.String, value: S.Unknown }),
);
export type VerdictPayload = S.Schema.Type<typeof VerdictPayload>;

export const ConstructHandoff = S.Struct({
  // Required tier (per upstream JSON Schema)
  construct_slug: S.String.pipe(S.pattern(/^[a-z][a-z0-9-]*$/), S.minLength(1), S.maxLength(64)),
  output_type: OutputType,
  // S2-T10: narrowed to VerdictPayload union (was S.Unknown placeholder · D6).
  verdict: VerdictPayload,
  invocation_mode: InvocationMode,
  cycle_id: S.String.pipe(S.minLength(1), S.maxLength(128)),

  // Recommended tier
  persona: S.optional(S.NullOr(S.String.pipe(S.maxLength(64)))),
  output_refs: S.optional(S.Array(S.String)),
  evidence: S.optional(
    S.Array(S.String.pipe(S.minLength(1), S.maxLength(1024))).pipe(S.maxItems(256)),
  ),

  // Optional tier
  domain: S.optional(S.NullOr(S.String.pipe(S.maxLength(64)))),
  agent_id: S.optional(S.NullOr(S.String)),
  transcript_path: S.optional(S.NullOr(S.String)),
  transcript_excerpt: S.optional(S.NullOr(S.String.pipe(S.maxLength(4096)))),
});

export type ConstructHandoff = S.Schema.Type<typeof ConstructHandoff>;

// Vendored JSON Schema for runtime AJV validation (validate-envelope.ts)
export const ConstructHandoffJsonSchema = handoffSchemaJson;
