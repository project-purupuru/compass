/**
 * Pointer-chain schema · @version 1.0 (LOCKED 2026-05-19 · S3.T10)
 *
 * Schema lock validated against:
 *   - PointerBreadcrumb (S2) — reads chain · clickable segments
 *   - Inspector PointerChainTab (S2) — full chain vertical render
 *   - ComposabilityPanel Shape A (S3) — flat layers panel
 *   - ComposabilityPanel Shape B (S3) — inline chain subtitles
 *   - ComposabilityPanel Shape C (S3) — Godot tree with source-path column
 *
 * All five renderers handle the 4 segment kinds without divergent fields.
 * Schema is stable from this commit forward; additions go through
 * a new schema version + breaking-change ADR.
 *
 * Per Flatline IMP-007: single source of truth. Adapters reference it;
 * views read from adapters; NO inline duplication.
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
 * Schema version marker. LOCKED at S3.T10 (2026-05-19).
 * Future changes require new version + breaking-change ADR.
 */
export const SCHEMA_VERSION = "1.0" as const;

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
