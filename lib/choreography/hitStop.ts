/**
 * hitStop — global frame-freeze on impact.
 *
 * Per Sakurai's "Creating Games" hit-stop frame timing + Gemini's STARDUST
 * breakdown (2026-05-17). The single most effective way to make a 2D
 * sprite hit feel heavy: pause the entire game for 2-4 frames at the
 * exact moment of contact.
 *
 * This module is FRAMEWORK-AGNOSTIC. The hook delegates to a `clock` the
 * caller supplies — typically the r3f `useFrame` callback's elapsed time,
 * but a DOM/CSS caller could pass `performance.now() / 1000`. We don't
 * import three.js so the substrate stays composable across renderers.
 *
 * Operator-locked (2026-05-17): freeze on EVERY hit (not just final).
 * Duration scales with combo tier:
 *
 *   - solo hit    : 0.05s (3 frames @ 60fps · Sakurai-canonical)
 *   - 2-chain     : 0.08s (5 frames)
 *   - 3-chain     : 0.12s (7 frames)
 *   - 4-chain     : 0.16s (10 frames)
 *   - 5-chain     : full freeze · hands off to UltimateScreen takeover
 *
 * Use `freezeDurationFor(tier)` to get the canonical duration; callers
 * MAY override per-impact.
 */

export type ComboTier = 1 | 2 | 3 | 4 | 5;

/** Canonical hit-stop durations in seconds, indexed by combo tier. */
export const HIT_STOP_DURATION: Record<ComboTier, number> = {
  1: 0.05,
  2: 0.08,
  3: 0.12,
  4: 0.16,
  5: 0.20, // soft cap — 5-chain triggers ultimate screen takeover beyond this
};

export function freezeDurationFor(tier: number): number {
  const clamped = Math.max(1, Math.min(5, Math.round(tier))) as ComboTier;
  return HIT_STOP_DURATION[clamped];
}

// ── Freeze state ──────────────────────────────────────────────────────────

export interface HitStopState {
  /** Remaining freeze time in seconds. 0 = not frozen. */
  remainingSec: number;
  /** Tier that triggered the current freeze (for analytics + cascading). */
  activeTier: ComboTier | 0;
}

export function makeHitStopState(): HitStopState {
  return { remainingSec: 0, activeTier: 0 };
}

/** Trigger a fresh freeze. If already frozen, the longer of the two wins. */
export function fireHitStop(
  state: HitStopState,
  tier: number,
  overrideSec?: number,
): void {
  const duration = overrideSec ?? freezeDurationFor(tier);
  if (duration > state.remainingSec) {
    state.remainingSec = duration;
    state.activeTier = Math.max(1, Math.min(5, Math.round(tier))) as ComboTier;
  }
}

/**
 * Step the freeze clock forward by `dt`. Returns the EFFECTIVE dt the
 * caller should use for downstream animation — 0 if frozen, the raw dt
 * otherwise. Mutates state in place.
 *
 * Usage pattern (in useFrame):
 *   ```
 *   const effectiveDt = stepHitStop(stateRef.current, rawDt);
 *   if (effectiveDt > 0) { advanceAnimations(effectiveDt); }
 *   ```
 *
 * This naturally chains so the whole sequence pauses, then resumes.
 */
export function stepHitStop(state: HitStopState, dt: number): number {
  if (state.remainingSec <= 0) return dt;
  state.remainingSec -= dt;
  if (state.remainingSec <= 0) {
    state.remainingSec = 0;
    state.activeTier = 0;
  }
  return 0;
}

export function isHitStopActive(state: HitStopState): boolean {
  return state.remainingSec > 0;
}
