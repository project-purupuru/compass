/**
 * Hand-port of hounfour `capability-scoped-trust` schema as Effect Schema.
 *
 * Source: hounfour@ec5024938339121dbb25d3b72f8b67fdb0432cad:schemas/capability-scoped-trust.schema.json
 *
 * REFERENCE-ONLY in this cycle (per S0-T2 conformance map). Compass S3 force-
 * chain mapping references this contract conceptually but does NOT yet wire
 * it to runtime decisions. When verify⊥judge fence (S3) needs trust-level
 * gating per capability scope, this port is the source of truth.
 */

import { Schema as S } from "effect";
import upstreamSchema from "./schemas/hounfour-capability-scoped-trust.schema.json";

export const TrustLevel = S.Literal("untrusted", "basic", "verified", "trusted", "sovereign");
export type TrustLevel = S.Schema.Type<typeof TrustLevel>;

export const CapabilityScopedTrustPort = S.Struct({
  scopes: S.Struct({
    billing: S.optional(TrustLevel),
    governance: S.optional(TrustLevel),
    audit: S.optional(TrustLevel),
    composition: S.optional(TrustLevel),
  }),
  default_level: TrustLevel,
});

export type CapabilityScopedTrustPort = S.Schema.Type<typeof CapabilityScopedTrustPort>;

export const CapabilityScopedTrustUpstreamSchema = upstreamSchema;
