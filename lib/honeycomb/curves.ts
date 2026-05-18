/**
 * Honeycomb motion vocabulary — springs, easings, timing budgets, kaironic weights.
 *
 * Ported from world-purupuru/sites/world/src/lib/game/puru-curves/ into
 * compass's Next.js + Tailwind 4 world. Zero rendering imports. The values
 * are the *vocabulary* — what gets used and how is the surface's call.
 *
 * Use these via:
 *   - Tailwind utilities (`transition-[transform] ease-puru-flow`) for CSS
 *   - Framer-motion / R3F spring configs for canvas / interaction
 *   - DialKit / tweakpane for runtime tuning (see `app/battle/_panel.tsx`)
 *
 * The Reliquary-specific curves are kept for parity even though the
 * Reliquary surface isn't ported yet — burn ceremony is in scope for cycle 2.
 */

export interface PuroCurve {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass?: number;
  readonly durationBudgetMs?: number;
}

export const PURU_SPRINGS = {
  /** Quiet · settle. UI focus rings, subtle position locks. */
  whisper: { stiffness: 220, damping: 30, mass: 1 },
  /** The default · breathing rhythm. Card hover, panel reveal. */
  breath: { stiffness: 180, damping: 22, mass: 1 },
  /** Card pop, button press release. */
  bounce: { stiffness: 320, damping: 18, mass: 1 },
  /** Clash impact, transcendence flare. */
  impact: { stiffness: 480, damping: 14, mass: 1.2 },
  /** Slow tide. Weather change, daily rotate. */
  tide: { stiffness: 120, damping: 28, mass: 1.4 },
} as const satisfies Record<string, PuroCurve>;

export const PURU_EASINGS = {
  /** purupuru-flow — the default exit/enter ease. cubic-bezier(0.32, 0.72, 0.32, 1) */
  flow: [0.32, 0.72, 0.32, 1] as const,
  /** purupuru-emit — bursting outward (transcendence, burn). cubic-bezier(0.16, 1, 0.3, 1) */
  emit: [0.16, 1, 0.3, 1] as const,
  /** purupuru-crack — sharp break (敗 stamp, clash loss). cubic-bezier(0.65, 0, 0.35, 1) */
  crack: [0.65, 0, 0.35, 1] as const,
} as const;

export const RELIQUARY_SPRINGS = {
  /** Petal unfurl in burn ceremony. */
  petal: { stiffness: 200, damping: 24, mass: 1 },
  /** Sacred dissolve — the burn moment itself. */
  dissolve: { stiffness: 90, damping: 32, mass: 1.6 },
} as const satisfies Record<string, PuroCurve>;

/**
 * Default timing budgets for the battle phase machine. Reference values, not
 * ship criteria — actual durations come from DialKit at runtime so the
 * operator can tune feel without code edits.
 */
export const DEFAULT_TIMING_BUDGETS = {
  /** Lineup arrange → lock-in cinematic. */
  arrangeTransition: 380,
  /** Each clash reveal beat. */
  clashBeat: 520,
  /** 敗 stamp duration. */
  disintegrateStamp: 360,
  /** Card death dissolve. */
  disintegrateDissolve: 720,
  /** Between rounds — survivors slide, lineup re-centers. */
  interRound: 480,
  /** Result screen entrance. */
  resultEntrance: 640,
} as const;

/**
 * Kaironic weights — the "felt time" tuning surface. Higher weight = the
 * moment dilates. These are the DialKit-exposed knobs that let the operator
 * tune *when the game breathes*. Default to 1.0; the operator should rarely
 * need values outside [0.5, 2.0].
 */
export interface KaironicWeights {
  readonly arrival: number;
  readonly anticipation: number;
  readonly impact: number;
  readonly aftermath: number;
  readonly stillness: number;
  readonly recovery: number;
  readonly transition: number;
}

export const DEFAULT_KAIRONIC_WEIGHTS: KaironicWeights = {
  arrival: 1.0,
  anticipation: 1.2,
  impact: 0.9,
  aftermath: 1.4,
  stillness: 1.6,
  recovery: 1.0,
  transition: 1.0,
};

/**
 * Apply kaironic weights to a timing budget. Returns a milliseconds duration.
 * Each phase maps to one of the 7 kaironic dimensions.
 */
export function weighted(
  budget: number,
  weights: KaironicWeights,
  dimension: keyof KaironicWeights,
): number {
  return Math.round(budget * weights[dimension]);
}
