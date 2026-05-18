// Canonical eventId derivation · stable hash across re-encodes
// SDD r2 §3.1 · per flatline IMP-003 (875)
//
// eventId = sha256(canonicalEncode(event without eventId) || schema_version || source_tag)
//
// Properties:
//   1. Deterministic across reorderings (canonical encoding sorts keys)
//   2. Stable across schema additive bumps (additive-only A7 contract)
//   3. Cross-source collision-resistant (same payload from score vs sonar →
//      different eventIds via source_tag)
//   4. Length-prefixed canonical encoding to forbid ambiguous concatenation

import { createHash } from "node:crypto";

import type { WorldEvent } from "./world-event";

// Source tags · prevents cross-source eventId collision per AC-1.4.
export type SourceTag = "score" | "sonar" | "weather" | "test";

// Schema version · increments on additive schema bump · same struct → same eventId.
export const CURRENT_SCHEMA_VERSION = 1 as const;

// Recursively sort object keys for deterministic JSON encoding.
//
// Length-prefixed semantics (per flatline r3 SKP-001 fix):
//   - Object keys are sorted alphabetically · no whitespace
//   - Arrays preserve order (semantic)
//   - Date objects serialize to ISO strings (deterministic)
//   - Primitives use JSON.stringify defaults
const canonicalEncode = (value: unknown): string => {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }
  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalEncode).join(",") + "]";
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const parts = sortedKeys.map((k) => `${JSON.stringify(k)}:${canonicalEncode(obj[k])}`);
    return "{" + parts.join(",") + "}";
  }
  return JSON.stringify(value);
};

// Derive canonical eventId for a WorldEvent.
//
// `event` should be the WorldEvent shape EXCLUDING eventId itself · since
// eventId is the OUTPUT of this function (chicken-and-egg circumvention).
export const eventIdOf = (
  event: Omit<WorldEvent, "eventId">,
  source: SourceTag = "score",
  schemaVersion: number = CURRENT_SCHEMA_VERSION,
): string => {
  const canonical = canonicalEncode(event);
  return createHash("sha256")
    .update(canonical)
    .update("|") // length-prefix delimiter (forbids concatenation ambiguity)
    .update(String(schemaVersion))
    .update("|")
    .update(source)
    .digest("hex");
};

// Verify a stored eventId matches what would be derived from the event payload.
// Useful for integrity checks at substrate boundaries.
export const verifyEventId = (event: WorldEvent, source: SourceTag = "score"): boolean => {
  const { eventId, ...rest } = event;
  const derived = eventIdOf(rest as Omit<WorldEvent, "eventId">, source);
  return derived === eventId;
};
