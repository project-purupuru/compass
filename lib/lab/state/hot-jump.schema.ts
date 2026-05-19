/**
 * Hot-jump state · cycle-2 S3.3
 *
 * Per FR-25/FR-26: serialize the operator's current /honeycomb scene state
 * into a URL query parameter so /play can seed itself to the same view.
 * Per SDD OQ-1: URL-only state (no localStorage backup) — simpler, explicit.
 *
 * Encoding:
 *   /play?state=<base64-of-canonical-JSON>
 *
 *   - canonical JSON = stable key-sorted serialization (round-trip identity
 *     under operator edits to the URL bar · prevents drift)
 *   - base64 = URL-safe encoding of the JSON bytes
 *
 * Validation: Effect Schema decode rejects malformed/wrong-shape payloads.
 * Receiver (/play) treats validation failure as "no preserved state" and
 * falls back to default scene initialization.
 *
 * NFR-3: this schema additively extends the pointer-chain v1.0 contract —
 * NOT a breaking change to InspectableNode or PointerChain. Hot-jump state
 * references things by ID (adapterId · nodeId), not by structural shape.
 */

import { Schema as S } from "effect";

/**
 * The operator's scene state at hot-jump time. Minimum viable shape for
 * cycle-2 S3 · operator can BUILD then PLAY and land in the same view.
 *
 * Fields:
 *   - schemaVersion: pin against future breaking changes
 *   - activeTab: which mode-tab was active (build | library)
 *   - selectedAdapterId: which effect adapter the operator was viewing
 *     (e.g., "big-realm-scene" · "card-composition" · ...)
 *   - selectedNodeId: optional · if a sub-node was selected within the
 *     adapter (e.g., a hex drill-in or a card layer)
 *
 * Future fields (deferred to S4+):
 *   - panelSizes (Resizable region widths · S4 dock-shell)
 *   - composition path (for S5 BigRealmScene drill-in)
 *   - inspector tab (S6 lands Inspector live)
 */
export const HotJumpState = S.Struct({
  schemaVersion: S.Literal("1.0"),
  activeTab: S.Literal("build", "library"),
  selectedAdapterId: S.optional(S.String),
  selectedNodeId: S.optional(S.String),
});

export type HotJumpState = S.Schema.Type<typeof HotJumpState>;

export const HOT_JUMP_SCHEMA_VERSION = "1.0" as const;

/**
 * Canonical-JSON serialization with stable key order (recursive sort).
 * Pure function · no side effects · output bytes are operator-edit-stable.
 */
function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj ?? null);
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalize).join(",")}]`;
  }
  const record = obj as Record<string, unknown>;
  const sorted = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort();
  return `{${sorted
    .map((k) => `${JSON.stringify(k)}:${canonicalize(record[k])}`)
    .join(",")}}`;
}

/**
 * Serialize a HotJumpState to a URL-safe base64-canonical-JSON string.
 * Operator-edit-stable: round-trip identity under whitespace + key-order
 * edits to the JSON payload (canonicalization removes both).
 */
export function serializeHotJumpState(state: HotJumpState): string {
  const canonical = canonicalize(state);
  // btoa for browser · Buffer for Node SSR/test
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    // Encode UTF-8 first · then base64 (browser btoa requires Latin-1)
    const utf8 = String.fromCharCode(...new TextEncoder().encode(canonical));
    return window.btoa(utf8);
  }
  return Buffer.from(canonical, "utf-8").toString("base64");
}

/**
 * Deserialize a base64-canonical-JSON string back to a validated
 * HotJumpState. Returns null on any failure (malformed base64 · invalid
 * JSON · schema-validation failure). Caller treats null as "no preserved
 * state · use defaults".
 */
export function deserializeHotJumpState(encoded: string): HotJumpState | null {
  try {
    let canonical: string;
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      const utf8 = window.atob(encoded);
      const bytes = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; i++) bytes[i] = utf8.charCodeAt(i);
      canonical = new TextDecoder().decode(bytes);
    } else {
      canonical = Buffer.from(encoded, "base64").toString("utf-8");
    }
    const parsed: unknown = JSON.parse(canonical);
    return S.decodeUnknownSync(HotJumpState)(parsed);
  } catch {
    return null;
  }
}
