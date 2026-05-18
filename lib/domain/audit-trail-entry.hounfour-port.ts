/**
 * Hand-port of hounfour `audit-trail-entry` schema as Effect Schema.
 *
 * Source: hounfour@ec5024938339121dbb25d3b72f8b67fdb0432cad:schemas/audit-trail-entry.schema.json
 *
 * Compass uses this as the canonical shape for activity-stream events
 * crossing bounded contexts (S1 ActivityLive emits will conform once
 * compass surfaces a real audit trail beyond the synthetic JoinActivity).
 *
 * Subset port — adopting only required-tier fields. Recommended/optional
 * fields can be added incrementally without breaking consumers.
 */

import { Schema as S } from "effect";
import upstreamSchema from "./schemas/hounfour-audit-trail-entry.schema.json";

export const ConservationStatus = S.Literal("balanced", "drifted", "violated", "uncertain");
export type ConservationStatus = S.Schema.Type<typeof ConservationStatus>;

export const AuditTrailEntryPort = S.Struct({
  entry_id: S.UUID,
  completion_id: S.UUID,
  billing_entry_id: S.UUID,
  agent_id: S.String,
  provider: S.String,
  model_id: S.String,
  cost_micro: S.Number,
  timestamp: S.String,
  conservation_status: ConservationStatus,
  contract_version: S.String,
});

export type AuditTrailEntryPort = S.Schema.Type<typeof AuditTrailEntryPort>;

export const AuditTrailEntryUpstreamSchema = upstreamSchema;
