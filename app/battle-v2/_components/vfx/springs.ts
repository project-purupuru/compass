/**
 * Spring vocabulary — the machine-readable mirror of the motion tokens in
 * `app/battle-v2/_styles/battle-v2.css` (:root).
 *
 * CSS keyframes can't express mass. `motion` (DOM VFX) and hand-rolled
 * useFrame integrators (in-Canvas: CameraRig, the seedling mesh, DaemonReact)
 * read the real triples from here. If you change a number, change it in BOTH
 * places — the CSS comment block is the human-facing registry.
 *
 * Per ALEXANDER: "Springs are simulations of reality. CSS easing curves are
 * arbitrary mathematical functions." Every beat-driven motion is a physical
 * object with mass, responding to a force, resisted by friction.
 */

export interface Spring {
  /** Visual weight of the thing moving. */
  readonly mass: number;
  /** How hard it's pulled toward its target. */
  readonly stiffness: number;
  /** The friction resisting the motion. */
  readonly damping: number;
}

/** PetalArc — a thrown object. Light, eager, a little overshoot. */
export const SPRING_PETAL: Spring = { mass: 0.6, stiffness: 220, damping: 18 };

/** ZoneBloom seedling — heavy. The world is big; it settles, it doesn't snap. */
export const SPRING_BLOOM: Spring = { mass: 1.2, stiffness: 180, damping: 14 };

/**
 * RaptorCamera — the stoop and the climb. Critically damped (damping ≈
 * 2·√(stiffness·mass) ≈ 21.9): a heavy lens that accelerates in, decelerates
 * to the hover, and NEVER overshoots. Overshoot on a camera reads as a lurch —
 * the research's nausea driver. A raptor's dive is committed, not bouncy.
 */
export const SPRING_RAPTOR: Spring = { mass: 1.0, stiffness: 120, damping: 22 };

/** DaemonReact — a creature notices quickly. Low mass, high stiffness. */
export const SPRING_DAEMON: Spring = { mass: 0.4, stiffness: 300, damping: 20 };

/** Derived timing tokens — mirror of the CSS `--*` timing vars. */
export const TIMING = {
  /** PetalArc travel, card → grove. */
  arcTravelMs: 480,
  /** ZoneBloom — the world catching the petals before it answers. */
  bloomHitstopMs: 80,
  /** ZoneBloom — the specified stillness after the bloom. Ma is load-bearing. */
  bloomVoidMs: 400,
  /** RewardRead — the result settling in. */
  rewardRiseMs: 520,
} as const;

/**
 * A critically-aware spring integrator step for useFrame.
 *
 * Advances `value` toward `target` by `dt` seconds under spring `s`, mutating
 * and returning the {value, velocity} pair. Semi-implicit Euler — stable at
 * the frame rates R3F runs, and dt-clamped so a stalled tab doesn't explode
 * the integrator.
 */
export function stepSpring(
  state: { value: number; velocity: number },
  target: number,
  s: Spring,
  dt: number,
): { value: number; velocity: number } {
  const clampedDt = Math.min(dt, 1 / 30); // never integrate more than ~33ms at once
  const force = -s.stiffness * (state.value - target) - s.damping * state.velocity;
  const acceleration = force / s.mass;
  state.velocity += acceleration * clampedDt;
  state.value += state.velocity * clampedDt;
  return state;
}
