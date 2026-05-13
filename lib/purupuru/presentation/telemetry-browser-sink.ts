/**
 * Browser-side telemetry sink — console.log only (cycle-1).
 *
 * Per PRD r2 FR-26 + AC-13 (bifurcated per orchestrator SKP-001 BLOCKER-870).
 *
 * Browser code CANNOT write to the JSONL trail at grimoires/loa/a2a/trajectory/
 * (filesystem unavailable in browser). Cycle-1 ships console.log only.
 * Cycle-2 replaces this implementation with `fetch('/api/telemetry/cycle-1', ...)`
 * routing through a Next.js route handler that writes JSONL server-side.
 *
 * Both sinks consume the same `CardActivationClarity` shape; environment
 * detection chooses sink at composition time (BattleV2.tsx).
 */

import type { CardActivationClarity } from "../contracts/types";

export function emitBrowserTelemetry(event: CardActivationClarity): void {
  // Cycle-1 fallback: console.log only.
  // Cycle-2: replace with fetch('/api/telemetry/cycle-1', { method: 'POST', body: JSON.stringify(event) })
  const wrapped = {
    eventName: "CardActivationClarity",
    emittedAt: new Date().toISOString(),
    cycle: "purupuru-cycle-1-wood-vertical-2026-05-13",
    persistence: "browser-console-only-cycle-1",
    ...event,
  };
  console.log("[telemetry]", wrapped);
}

/** Environment-detected sink picker. Use this at composition time in components. */
export function pickTelemetrySink(): (event: CardActivationClarity) => void {
  if (typeof window !== "undefined") {
    return emitBrowserTelemetry;
  }
  // SSR / test path: still use browser sink (console.log) — Node sink only fired
  // explicitly from test-side code that has fs access.
  return emitBrowserTelemetry;
}
