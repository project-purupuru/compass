/**
 * typography — taste-token table for the big-text moments.
 *
 * Operator framing (2026-05-17): "refining the typography and the
 * animation of the typography rather than the actual text itself" is the
 * work. The text moments ARE the game-juice climax. This module owns the
 * canonical type tokens + animation specs so every text-overlay component
 * across the app reads from one place.
 *
 * Pitch-canon honored ([[feedback_ground-in-the-pitch]]):
 *   - NO damage numbers anywhere
 *   - "Tide favored Wood today" pattern for end-of-round
 *   - Wuxing element energy is the readability spine
 *
 * Tiers (visual hierarchy from quiet to loud):
 *   1. base-hit         — solo card lands · "HIT" overlay
 *   2. combo-2          — 2-chain · gold metallic "2 CHAIN"
 *   3. combo-3          — 3-chain · gold + element-glow
 *   4. combo-4          — 4-chain · brush-stroke entry
 *   5. ultimate-chain   — full 5-wuxing-cycle · screen takeover
 *   6. tide-banner      — end-of-round outcome · biggest + slowest
 */

import type { Easing } from "./sequence";
import { easeOutBack, easeOutQuad, linear } from "./sequence";

// ── Type tier ──────────────────────────────────────────────────────────────

export type TypoTier =
  | "base-hit"
  | "combo-2"
  | "combo-3"
  | "combo-4"
  | "ultimate-chain"
  | "tide-banner";

// ── Animation spec ─────────────────────────────────────────────────────────

export interface TypoAnimSpec {
  /** Entry: scale from this value → 1.0 over entryDurationSec. */
  readonly entryFromScale: number;
  readonly entryDurationSec: number;
  readonly entryEasing: Easing;
  /** Hold at 1.0 for this long. */
  readonly holdSec: number;
  /** Exit fade from opacity 1 → 0 over this duration (linear). */
  readonly exitDurationSec: number;
  /** Optional per-tier punch-in delay (advanced — combo tiers may pulse). */
  readonly pulseScale?: number;
  readonly pulsePeriodSec?: number;
}

// ── Style spec ─────────────────────────────────────────────────────────────

export interface TypoStyleSpec {
  /** Approximate font-size in px at the canonical viewport. Scale-multiply for hi-dpi. */
  readonly fontSizePx: number;
  /** CSS font-family — caller resolves to actual web font. */
  readonly fontFamily: string;
  /** Font weight (CSS numeric). */
  readonly fontWeight: number;
  /** Core text color (white or near-white for max contrast). */
  readonly coreColor: string;
  /** Stroke color (heavy black per Gemini's directive #5). */
  readonly strokeColor: string;
  /** Stroke width in px. */
  readonly strokeWidthPx: number;
  /** Drop-shadow color (often element-theme'd). */
  readonly shadowColor: string;
  /** Drop-shadow offset (x, y) in px. */
  readonly shadowOffsetPx: readonly [number, number];
  /** Drop-shadow blur in px. */
  readonly shadowBlurPx: number;
  /** Optional gradient (for combo/ultimate tiers). */
  readonly gradient?: {
    readonly from: string;
    readonly to: string;
    readonly angle: number; // degrees
  };
  /** Italic? */
  readonly italic: boolean;
  /** Letter spacing in em. */
  readonly letterSpacingEm: number;
  /** Use a "brush-stroke" decorative font family for ultimate/tide tiers. */
  readonly brushStroke?: boolean;
}

// ── Token table ────────────────────────────────────────────────────────────

export interface TypoToken {
  readonly tier: TypoTier;
  readonly style: TypoStyleSpec;
  readonly anim: TypoAnimSpec;
}

/**
 * Canonical type-token table. Refining these is THE WORK per operator
 * direction. Each entry pairs a visual style with an animation spec.
 */
export const TYPOGRAPHY_TOKENS: Record<TypoTier, TypoToken> = {
  "base-hit": {
    tier: "base-hit",
    style: {
      // Operator 2026-05-17: typography was too big. Tightened ~30%
      // across all tiers. Re-tune from here.
      fontSizePx: 64,
      fontFamily: "var(--font-puru-display, 'Cormorant Garamond', serif)",
      fontWeight: 800,
      coreColor: "#ffffff",
      strokeColor: "#1a0f06",
      strokeWidthPx: 3,
      shadowColor: "rgba(40, 100, 200, 0.65)",
      shadowOffsetPx: [0, 2],
      shadowBlurPx: 5,
      italic: true,
      letterSpacingEm: 0.02,
    },
    anim: {
      entryFromScale: 1.8,
      entryDurationSec: 0.1,
      entryEasing: easeOutQuad,
      holdSec: 0.45,
      exitDurationSec: 0.18,
    },
  },

  "combo-2": {
    tier: "combo-2",
    style: {
      fontSizePx: 76,
      fontFamily: "var(--font-puru-display, 'Cormorant Garamond', serif)",
      fontWeight: 900,
      coreColor: "#fff5b8",
      strokeColor: "#1a0f06",
      strokeWidthPx: 4,
      shadowColor: "rgba(200, 140, 30, 0.75)",
      shadowOffsetPx: [0, 3],
      shadowBlurPx: 7,
      gradient: { from: "#fff0a0", to: "#e0a050", angle: 180 },
      italic: true,
      letterSpacingEm: 0.04,
    },
    anim: {
      entryFromScale: 1.9,
      entryDurationSec: 0.12,
      entryEasing: easeOutBack,
      holdSec: 0.5,
      exitDurationSec: 0.2,
    },
  },

  "combo-3": {
    tier: "combo-3",
    style: {
      fontSizePx: 92,
      fontFamily: "var(--font-puru-display, 'Cormorant Garamond', serif)",
      fontWeight: 900,
      coreColor: "#fff5b8",
      strokeColor: "#1a0f06",
      strokeWidthPx: 4,
      shadowColor: "rgba(220, 140, 20, 0.85)",
      shadowOffsetPx: [0, 4],
      shadowBlurPx: 10,
      gradient: { from: "#ffe680", to: "#d68830", angle: 180 },
      italic: true,
      letterSpacingEm: 0.06,
    },
    anim: {
      entryFromScale: 2.0,
      entryDurationSec: 0.14,
      entryEasing: easeOutBack,
      holdSec: 0.55,
      exitDurationSec: 0.22,
      pulseScale: 1.04,
      pulsePeriodSec: 0.4,
    },
  },

  "combo-4": {
    tier: "combo-4",
    style: {
      fontSizePx: 112,
      fontFamily: "var(--font-puru-display, 'Cormorant Garamond', serif)",
      fontWeight: 900,
      coreColor: "#fff8c8",
      strokeColor: "#1a0f06",
      strokeWidthPx: 5,
      shadowColor: "rgba(230, 130, 10, 0.95)",
      shadowOffsetPx: [0, 4],
      shadowBlurPx: 14,
      gradient: { from: "#fff0a0", to: "#c46818", angle: 180 },
      italic: true,
      letterSpacingEm: 0.08,
      brushStroke: true,
    },
    anim: {
      entryFromScale: 2.2,
      entryDurationSec: 0.16,
      entryEasing: easeOutBack,
      holdSec: 0.65,
      exitDurationSec: 0.24,
      pulseScale: 1.06,
      pulsePeriodSec: 0.45,
    },
  },

  "ultimate-chain": {
    tier: "ultimate-chain",
    style: {
      fontSizePx: 160,
      fontFamily: "var(--font-puru-display, 'Cormorant Garamond', serif)",
      fontWeight: 900,
      coreColor: "#fffae6",
      strokeColor: "#0a0500",
      strokeWidthPx: 7,
      shadowColor: "rgba(240, 110, 0, 1.0)",
      shadowOffsetPx: [0, 6],
      shadowBlurPx: 20,
      gradient: { from: "#fff0b0", to: "#a83a08", angle: 195 },
      italic: false,
      letterSpacingEm: 0.10,
      brushStroke: true,
    },
    anim: {
      entryFromScale: 2.4,
      entryDurationSec: 0.22,
      entryEasing: easeOutBack,
      holdSec: 1.3,
      exitDurationSec: 0.42,
      pulseScale: 1.06,
      pulsePeriodSec: 0.6,
    },
  },

  "tide-banner": {
    tier: "tide-banner",
    style: {
      fontSizePx: 128,
      fontFamily: "var(--font-puru-display, 'Cormorant Garamond', serif)",
      fontWeight: 800,
      coreColor: "#fff8e6",
      strokeColor: "#1a0f06",
      strokeWidthPx: 6,
      shadowColor: "rgba(40, 80, 160, 0.85)",
      shadowOffsetPx: [0, 4],
      shadowBlurPx: 12,
      italic: false,
      letterSpacingEm: 0.16,
      brushStroke: true,
    },
    anim: {
      // Tide banner is THE biggest + slowest moment. Long entry, long hold.
      entryFromScale: 1.4,
      entryDurationSec: 0.4,
      entryEasing: easeOutBack,
      holdSec: 2.3,
      exitDurationSec: 0.55,
    },
  },
};

/** Pick a tier from a combo count. */
export function typoTierForCombo(combo: number): TypoTier {
  if (combo >= 5) return "ultimate-chain";
  if (combo >= 4) return "combo-4";
  if (combo >= 3) return "combo-3";
  if (combo >= 2) return "combo-2";
  return "base-hit";
}

// ── Animation sampler ─────────────────────────────────────────────────────

export interface TypoSample {
  /** Current scale to apply to the text element. */
  readonly scale: number;
  /** Current opacity to apply (1 during entry+hold, fades during exit). */
  readonly opacity: number;
  /** Phase the animation is in. */
  readonly phase: "entry" | "hold" | "exit" | "done";
}

/**
 * Sample the animation curve for a typo tier at elapsed seconds.
 * Caller drives elapsed in useFrame; we return scale + opacity to apply.
 */
export function sampleTypoAnim(
  tier: TypoTier,
  elapsedSec: number,
): TypoSample {
  const { anim } = TYPOGRAPHY_TOKENS[tier];
  const entryEnd = anim.entryDurationSec;
  const holdEnd = anim.entryDurationSec + anim.holdSec;
  const exitEnd = holdEnd + anim.exitDurationSec;

  if (elapsedSec < entryEnd) {
    // Entry: scale lerps from entryFromScale → 1.0, opacity = 1.
    const t = elapsedSec / Math.max(entryEnd, 1e-3);
    const eased = anim.entryEasing(t);
    const scale = anim.entryFromScale + (1.0 - anim.entryFromScale) * eased;
    return { scale, opacity: 1, phase: "entry" };
  }
  if (elapsedSec < holdEnd) {
    // Hold: scale = 1.0 + optional pulse.
    let scale = 1.0;
    if (anim.pulseScale && anim.pulsePeriodSec) {
      const pulsePhase = ((elapsedSec - entryEnd) / anim.pulsePeriodSec) * Math.PI * 2;
      scale = 1.0 + (anim.pulseScale - 1.0) * 0.5 * (Math.sin(pulsePhase) + 1);
    }
    return { scale, opacity: 1, phase: "hold" };
  }
  if (elapsedSec < exitEnd) {
    // Exit: opacity fades 1 → 0 linearly.
    const t = (elapsedSec - holdEnd) / Math.max(anim.exitDurationSec, 1e-3);
    return { scale: 1.0, opacity: 1.0 - linear(t), phase: "exit" };
  }
  return { scale: 1.0, opacity: 0, phase: "done" };
}
