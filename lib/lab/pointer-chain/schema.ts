/**
 * Pointer-chain schema · @version draft-S1
 *
 * Per ADR-13 + Flatline SKP-005 (720): the schema is marked DRAFT in S1b
 * to defer locking until S3.T9 validates it against three composability
 * shape renderers + the breadcrumb + the Inspector.
 *
 * TODO: lock after S3.T9 by:
 *   1. Removing the @version draft-S1 marker
 *   2. Bumping to @version 1.0
 *   3. Committing as a separate "schema lock" commit on the S3 PR
 *
 * Per Flatline IMP-007: this schema is the single source of truth for
 * pointer-chain segments. Adapters reference it; views read from adapters;
 * NO inline duplication.
 *
 * Per ADR-3: aligned with InspectableNode + EntityTreeNode for shared
 * rendering primitives across breadcrumb · inspector · composability.
 */

import { Schema as S } from "effect";

/**
 * Discriminated union of pointer segment kinds.
 * Each kind carries its kind-specific payload.
 *
 * Adding a kind requires: schema update + breadcrumb/inspector/composability
 * renderer updates. Done at schema-lock time in S3.
 */
export const PointerSegment = S.Union(
  /** A pantry/codex entry (e.g., `/codex/cards/earth-jani`). */
  S.TaggedStruct("Pantry", {
    slug: S.String,
    path: S.String,
    /** Optional human label override. */
    label: S.optional(S.String),
  }),
  /** A render primitive (e.g., `effects/CardComposition`). */
  S.TaggedStruct("Primitive", {
    name: S.String,
    path: S.String,
    label: S.optional(S.String),
  }),
  /** Consumers of the active entity (e.g., `["card-lab", "battle"]`). */
  S.TaggedStruct("Consumer", {
    consumers: S.Array(S.String),
  }),
  /** A scene reference (future: scene composition primitive in cycle 23+). */
  S.TaggedStruct("Scene", {
    name: S.String,
    path: S.String,
    label: S.optional(S.String),
  }),
);
export type PointerSegment = S.Schema.Type<typeof PointerSegment>;

export const PointerChain = S.Array(PointerSegment);
export type PointerChain = S.Schema.Type<typeof PointerChain>;

/**
 * Schema version marker. DRAFT for S1b/S2; locks at S3.T9.
 */
export const SCHEMA_VERSION = "draft-S1" as const;

/**
 * Helper: extract the human-readable label from a segment (uses label
 * override if present, else falls back to slug/name).
 */
export function segmentLabel(seg: PointerSegment): string {
  switch (seg._tag) {
    case "Pantry":
      return seg.label ?? seg.slug;
    case "Primitive":
      return seg.label ?? seg.name;
    case "Consumer":
      return `consumers: [${seg.consumers.join(" · ")}]`;
    case "Scene":
      return seg.label ?? seg.name;
  }
}
