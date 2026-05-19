/**
 * Regression substrate · Effect Context.Tag port
 *
 * Per ADR-1: Playwright is the snapshot backend (locked, NOT optional).
 * Per ADR-9: production AppLayer uses RegressionCheckNoop · dev/test uses RegressionCheckLive.
 *
 * Single Effect.provide site is `lib/runtime/runtime.ts`. The env-gating
 * decision happens THERE, not here — the port itself is environment-agnostic.
 */

import { Context, type Effect } from "effect";
import type { Baseline, DiffResult, RenderTarget, Snapshot } from "./schema";

export class RegressionError {
  readonly _tag = "RegressionError";
  constructor(readonly reason: string, readonly cause?: unknown) {}
}

export interface RegressionCheck {
  /**
   * Capture a snapshot of the render target.
   * Returns geometry (boundingBox), PNG bytes, sha256 identity, metadata.
   */
  readonly capture: (target: RenderTarget) => Effect.Effect<Snapshot, RegressionError>;

  /**
   * Diff a fresh snapshot against the stored baseline.
   * Per SDD §3.1 hierarchy:
   *   - boundingBox match (±0.5px) is the PRIMARY gate
   *   - sha256 identity is SECONDARY
   *   - pixelmatch diff is ADVISORY (never blocks)
   */
  readonly diff: (snap: Snapshot) => Effect.Effect<DiffResult, RegressionError>;

  /**
   * Approve a fresh snapshot as the new baseline.
   * REQUIRES a reason per IMP-010 governance.
   * Audited to `.run/audit.jsonl`.
   */
  readonly approve: (snap: Snapshot, reason: string) => Effect.Effect<Baseline, RegressionError>;

  /**
   * Read the current baseline for a target (if any).
   */
  readonly getBaseline: (target: RenderTarget) => Effect.Effect<Baseline | null, RegressionError>;
}

export const RegressionCheck = Context.GenericTag<RegressionCheck>(
  "@compass/regression/RegressionCheck",
);
