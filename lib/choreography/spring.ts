/**
 * spring — mass/stiffness/damping solver for UI motion.
 *
 * Per Emil Kowalski's spatial-UI doctrine + Gemini's STARDUST breakdown
 * (2026-05-17): UI motion driven by physics, not Bezier curves. The card
 * stamp, hand-rack hover, lock-in drop — every motion gains "physical
 * momentum that matches the pixel art it commands" by being spring-driven.
 *
 * Implementation: a simple Hooke-spring solver tuned by three params.
 * Caller drives it per-frame with `step(dt)` and reads `current`. When
 * `current` is within epsilon of `target` AND velocity is near zero,
 * `isSettled()` returns true → the animation can stop.
 *
 * Tunings (presets in `SPRING_PRESETS`):
 *   - `gentle`  — soft settle · UI dropdown
 *   - `snappy`  — fast attack, light overshoot · button press
 *   - `bouncy`  — clear overshoot · card stamp entry
 *   - `firm`    — tight, no overshoot · keybind flash
 *
 * Operator-locked decision (2026-05-17): NEVER replace this with cubic-
 * bezier curves for UI motion. Linear/Bezier reads as robotic; spring
 * reads as alive.
 */

export interface SpringTuning {
  /** Effective mass — higher = slower acceleration. Default 1. */
  readonly mass: number;
  /** Hooke stiffness — higher = pulls harder toward target. */
  readonly stiffness: number;
  /** Damping — higher = less overshoot. Critical damping ~= 2*sqrt(stiff*mass). */
  readonly damping: number;
}

export interface SpringState {
  current: number;
  velocity: number;
  target: number;
}

export const SPRING_PRESETS: Record<string, SpringTuning> = {
  gentle: { mass: 1.0, stiffness: 120, damping: 18 },
  snappy: { mass: 1.0, stiffness: 280, damping: 22 },
  bouncy: { mass: 1.0, stiffness: 320, damping: 16 }, // card-stamp default
  firm:   { mass: 1.0, stiffness: 480, damping: 32 },
};

/** Create a spring state initialized at `start`. */
export function makeSpring(start: number, target: number = start): SpringState {
  return { current: start, velocity: 0, target };
}

/**
 * Step the spring forward by `dt` seconds, using the supplied tuning.
 * Mutates `state` in place; returns the new `current` for convenience.
 *
 * Implementation uses semi-implicit Euler — stable for typical UI ranges
 * (stiffness ~100..1000, dt ~1/60..1/30). Caller should clamp dt to
 * 1/30s in their useFrame loop to prevent blow-up after long pauses.
 */
export function stepSpring(
  state: SpringState,
  tuning: SpringTuning,
  dt: number,
): number {
  const { mass, stiffness, damping } = tuning;
  const displacement = state.current - state.target;
  const springForce = -stiffness * displacement;
  const dampingForce = -damping * state.velocity;
  const acceleration = (springForce + dampingForce) / Math.max(mass, 1e-3);
  state.velocity += acceleration * dt;
  state.current += state.velocity * dt;
  return state.current;
}

/**
 * Snap the target to `value`. The spring will accelerate toward it on
 * subsequent step()s — i.e. animates, doesn't teleport.
 */
export function setSpringTarget(state: SpringState, target: number): void {
  state.target = target;
}

/** Settled = close to target AND velocity near zero. */
export function isSpringSettled(
  state: SpringState,
  positionEpsilon: number = 0.001,
  velocityEpsilon: number = 0.001,
): boolean {
  return (
    Math.abs(state.current - state.target) < positionEpsilon &&
    Math.abs(state.velocity) < velocityEpsilon
  );
}

/**
 * Convenience — drive a spring to a target value for one frame and
 * return both the new value AND whether it has settled. Useful in
 * useFrame loops where the caller doesn't want to manage state manually.
 */
export function tickSpring(
  state: SpringState,
  tuning: SpringTuning,
  dt: number,
): { value: number; settled: boolean } {
  const clampedDt = Math.min(dt, 1 / 30);
  const value = stepSpring(state, tuning, clampedDt);
  return { value, settled: isSpringSettled(state) };
}
