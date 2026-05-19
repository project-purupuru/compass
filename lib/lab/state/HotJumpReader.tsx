/**
 * HotJumpReader · cycle-2 S3.5 · /play seeds from URL state
 *
 * Mounted at /play (FR-26): reads the ?state=<base64> URL query parameter,
 * deserializes via the hot-jump schema, and exposes the validated state to
 * /play's runtime. Per SDD OQ-1: URL-only state (no localStorage backup).
 *
 * Cycle-2 minimum: this reader captures the state and logs it. The BattleV2
 * runtime doesn't yet have a "selection" or "activeTab" concept to seed
 * from (/play is the player surface · /honeycomb is the editor). Cycle-3+
 * adds the /play state architecture that consumes this hook fully.
 *
 * Current cycle-2 behavior:
 *   - Read URL state on mount · validate against schema · log to console
 *     (and to a data-attribute on the wrapper for E2E test verification)
 *   - Invalid/missing state → no-op · /play uses defaults
 *   - back-button to /honeycomb re-reads its own state via cycle-1
 *     sessionStorage persistence (no /honeycomb URL state for now)
 *
 * Per FR-26: "/play reads URL state on mount and initializes runtime view
 * to match operator's last-seen state in /honeycomb." Cycle-2 wires the
 * READ path · cycle-3+ wires the seed-to-runtime path.
 */

"use client";

import { useEffect, useState } from "react";

import {
  deserializeHotJumpState,
  type HotJumpState,
} from "./hot-jump.schema";

interface HotJumpReaderProps {
  children?: React.ReactNode;
  onStateLoaded?: (state: HotJumpState) => void;
}

export function HotJumpReader({ children, onStateLoaded }: HotJumpReaderProps) {
  const [hotJumpState, setHotJumpState] = useState<HotJumpState | null>(null);
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("state");
    if (!encoded) return;
    const decoded = deserializeHotJumpState(encoded);
    if (decoded === null) {
      setParseError(true);
      // eslint-disable-next-line no-console
      console.warn("[HotJumpReader] state param failed schema validation");
      return;
    }
    setHotJumpState(decoded);
    onStateLoaded?.(decoded);
    // eslint-disable-next-line no-console
    console.log("[HotJumpReader] loaded hot-jump state:", decoded);
  }, [onStateLoaded]);

  return (
    <div
      data-hot-jump-reader
      data-hot-jump-loaded={hotJumpState !== null ? "true" : "false"}
      data-hot-jump-parse-error={parseError ? "true" : "false"}
      data-hot-jump-active-tab={hotJumpState?.activeTab ?? ""}
      data-hot-jump-selected-adapter={hotJumpState?.selectedAdapterId ?? ""}
    >
      {children}
    </div>
  );
}
