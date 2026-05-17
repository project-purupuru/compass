/**
 * sequence — keyframe stagger primitive for choreographed beats.
 *
 * Per Disney's "overlapping action" + Jonasson/Purho "Juice It or Lose It"
 * + Gemini's STARDUST analysis (2026-05-17): NEVER fire simultaneous
 * keyframes. Stagger every beat by 2-3 frames. The 0.03s offset between
 * card-lift, dashed-trail, and character-dash is what separates "robotic"
 * from "physically tethered."
 *
 * This module is a TIMING substrate. Caller defines `Beat`s with start/
 * duration/easing/onValue. `runSequence(state, dt)` returns per-beat
 * progress so callers can drive their animation directly off it.
 *
 * Composes with `spring.ts` (caller can set spring target inside `onValue`)
 * and `hitStop.ts` (caller passes `effectiveDt` from stepHitStop so the
 * whole sequence pauses during freeze).
 */

// ── Easing curves ─────────────────────────────────────────────────────────

export type Easing = (t: number) => number;

export const linear: Easing = (t) => t;

export const easeInQuad: Easing = (t) => t * t;
export const easeOutQuad: Easing = (t) => 1 - (1 - t) * (1 - t);
export const easeInOutQuad: Easing = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeInCubic: Easing = (t) => t * t * t;
export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic: Easing = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutQuart: Easing = (t) => 1 - Math.pow(1 - t, 4);
export const easeOutQuint: Easing = (t) => 1 - Math.pow(1 - t, 5);

export const easeInOutSine: Easing = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * easeOutBack — Gemini's canonical UI-entrance curve. Overshoots target
 * by ~10% before settling. The tactile "pop" that makes paper-puppet UI
 * feel physical.
 */
export const easeOutBack: Easing = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * easeInBack — discard-exit curve. Pulls back slightly before flying out.
 */
export const easeInBack: Easing = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
};

// ── Beat + sequence ───────────────────────────────────────────────────────

export interface Beat<T = void> {
  readonly name: string;
  /** Start time in seconds, relative to sequence start. */
  readonly startSec: number;
  /** Duration in seconds. After this, beat is "settled." */
  readonly durationSec: number;
  /** Easing curve applied to progress 0..1. */
  readonly easing: Easing;
  /** Optional payload for the caller to attach (target value, color, etc.). */
  readonly payload?: T;
}

export interface SequenceState<T = void> {
  /** Total elapsed time in seconds. */
  elapsed: number;
  /** Cached beats — caller-supplied. */
  readonly beats: readonly Beat<T>[];
}

export function makeSequence<T = void>(beats: readonly Beat<T>[]): SequenceState<T> {
  return { elapsed: 0, beats };
}

export interface BeatSample<T = void> {
  readonly beat: Beat<T>;
  /** Linear progress 0..1, or null if beat hasn't started. */
  readonly tLinear: number | null;
  /** Eased progress 0..1 (after applying beat.easing), or null. */
  readonly tEased: number | null;
  /** True when this beat has settled (passed its end). */
  readonly settled: boolean;
}

/**
 * Step the sequence forward and return a sample per beat. Caller iterates
 * the samples and drives their animations off `tEased` for active beats.
 */
export function stepSequence<T = void>(
  state: SequenceState<T>,
  dt: number,
): readonly BeatSample<T>[] {
  state.elapsed += dt;
  return state.beats.map((beat) => {
    const relative = state.elapsed - beat.startSec;
    if (relative < 0) {
      return { beat, tLinear: null, tEased: null, settled: false };
    }
    if (relative >= beat.durationSec) {
      return { beat, tLinear: 1, tEased: beat.easing(1), settled: true };
    }
    const tLinear = relative / Math.max(beat.durationSec, 1e-3);
    return { beat, tLinear, tEased: beat.easing(tLinear), settled: false };
  });
}

/** Total duration of the sequence (last beat's end). */
export function sequenceDuration<T = void>(state: SequenceState<T>): number {
  let max = 0;
  for (const b of state.beats) max = Math.max(max, b.startSec + b.durationSec);
  return max;
}

export function isSequenceDone<T = void>(state: SequenceState<T>): boolean {
  return state.elapsed >= sequenceDuration(state);
}

// ── Canonical STARDUST-spec sequence template ─────────────────────────────

/**
 * The operator-locked single-card playback template per
 * `grimoires/loa/specs/enhance-card-to-map-choreography.md`. Returns a
 * beat list you can pass to `makeSequence`. Caller wires `payload` per
 * beat to whatever they're driving (sprite frame, opacity, scale, etc.).
 */
export function canonicalCardPlaybackBeats(): readonly Beat<string>[] {
  return [
    {
      name: "ui-drop",
      startSec: 0.0,
      durationSec: 0.2,
      easing: easeInCubic,
      payload: "hand UI Y-translates +150px off-screen",
    },
    {
      name: "breath",
      startSec: 0.2,
      durationSec: 0.3,
      easing: linear,
      payload: "0.3s palette cleanser before action",
    },
    {
      name: "caster-anticipation",
      startSec: 0.5,
      durationSec: 0.2,
      easing: easeOutQuad,
      payload: "cast frame · charge VFX scale 0.5→1.0",
    },
    {
      name: "trail-draw-in",
      startSec: 0.55,
      durationSec: 0.18,
      easing: easeOutQuart,
      payload: "dashed line trim-path 0→1",
    },
    {
      name: "projectile-or-dash",
      startSec: 0.7,
      durationSec: 0.3,
      easing: easeInQuad,
      payload: "character slides toward target · capped 0.3s",
    },
    {
      name: "impact-hit-stop",
      startSec: 1.0,
      durationSec: 0.05,
      easing: linear,
      payload: "FREEZE · white-flash target · fire HitText + CardShowcase",
    },
    {
      name: "card-showcase-stamp",
      startSec: 1.05,
      durationSec: 0.15,
      easing: easeOutBack,
      payload: "RIGHT-side card showcase · scale 1.5→1.0 spring",
    },
    {
      name: "settle",
      startSec: 1.5,
      durationSec: 0.2,
      easing: linear,
      payload: "side card + text fade",
    },
    {
      name: "buffer",
      startSec: 1.7,
      durationSec: 0.2,
      easing: linear,
      payload: "empty beat before next card",
    },
  ];
}
