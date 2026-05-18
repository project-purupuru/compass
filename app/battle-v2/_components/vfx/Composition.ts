/**
 * Composition — layering primitive for chaining VFX effects.
 *
 * Session-14 v1 ships `sequence` + `parallel`. `trigger-chain` is stubbed
 * in the schema and falls back to `sequence` at runtime (operator-locked
 * decision — trigger-chain needs per-effect "done" lifecycle events which
 * land in session 15).
 *
 * Contract: `runComposition(composition, onFire)` schedules trigger pulses
 * for each step via setTimeout and returns a cleanup function. The caller
 * (lab UI) maps `onFire(effectId, stepIndex)` to a triggerKey bump on the
 * corresponding effect's PreviewProps.
 */

import type { CompositionT, CompositionModeT } from "./VfxConfig";

export type StepFireFn = (effectId: string, stepIndex: number) => void;

/** Handle returned by `runComposition` — call to cancel pending fires. */
export interface CompositionHandle {
  /** All pending step fires are cancelled. Idempotent. */
  cancel(): void;
}

/**
 * Schedule the steps of a composition. Returns a cancellable handle.
 *
 *   mode === "sequence":
 *     Each step fires at `cumulativeOffsetMs`. Offsets are accumulated:
 *     step[0] fires at offset[0], step[1] at offset[0] + offset[1], etc.
 *
 *   mode === "parallel":
 *     Each step fires at its own `offsetMs` independently from t=0.
 *
 *   mode === "trigger-chain":
 *     v2 — falls back to sequence at v1.
 */
export function runComposition(
  composition: CompositionT,
  onFire: StepFireFn,
): CompositionHandle {
  const timers: ReturnType<typeof setTimeout>[] = [];

  const schedule = (delayMs: number, effectId: string, stepIndex: number) => {
    const id = setTimeout(() => onFire(effectId, stepIndex), Math.max(0, delayMs));
    timers.push(id);
  };

  const mode: CompositionModeT = composition.mode;

  if (mode === "parallel") {
    composition.steps.forEach((s, i) => schedule(s.offsetMs, s.effectId, i));
  } else {
    // sequence + trigger-chain (fallback)
    let cumulative = 0;
    composition.steps.forEach((s, i) => {
      cumulative += s.offsetMs;
      schedule(cumulative, s.effectId, i);
    });
  }

  return {
    cancel() {
      for (const t of timers) clearTimeout(t);
      timers.length = 0;
    },
  };
}

/** A convenience preset showing the cycle-1 wood vs water matchup. */
export const COMPOSITION_WOOD_VS_WATER: CompositionT = {
  id: "wood-vs-water.sequence",
  mode: "sequence",
  steps: [
    { effectId: "tree-fall", offsetMs: 0 },
    { effectId: "water-splash", offsetMs: 600 },
  ],
};
