/**
 * Juice Profile — typed knob for the game's feel.
 *
 * Substrate ships timing/intensity constants here so we can dial the
 * whole game's "feel" without chasing CSS. Same pattern as the VFX
 * vocabulary: a typed registry, dumb consumers.
 *
 * Modes:
 *   "default"  — the baseline. Tuned for first-time-player legibility.
 *   "quiet"    — Neko Atsume mode. Reduced motion, softer impacts,
 *                ambient-first. For tired or repeat play.
 *   "loud"     — Balatro mode. Big bounces, longer hitstop, more
 *                particles. For demos and "feel the win" moments.
 *
 * Caller pattern:
 *
 *   import { juiceProfile } from "@/lib/juice/profile";
 *   const ms = juiceProfile.cardDealDelayMs(index);
 *
 * Today: a single immutable default. Future: read from localStorage,
 * driven by a settings UI ("Reduce motion" / "Cinematic mode").
 */

export type JuiceMode = "quiet" | "default" | "loud";

export interface JuiceProfile {
  readonly mode: JuiceMode;
  // ── Card-deal cascade (5 cards fly in when you pick an element) ──
  readonly cardDealMs: number;
  readonly cardDealStaggerMs: number;
  readonly cardDealOvershoot: number; // springy bounce strength
  // ── Hover lift on player cards ──
  readonly hoverLiftPx: number;
  // ── Selected ring (mid-swap) ──
  readonly selectedLiftPx: number;
  // ── Lock-in commitment ritual ──
  readonly lockInPressMs: number;
  readonly lockInFanCompactMs: number;
  readonly lockInOpponentFlipStaggerMs: number;
  // ── Clash impact ──
  readonly hitstopMs: number;
  readonly orbMaxScale: number;
  readonly orbSettleScale: number;
  readonly chromaticAberrationPx: number; // 0 = off
  // ── Disintegrate ──
  readonly disintegrateMs: number;
  // ── Combo discovery ceremony ──
  readonly discoveryHoldMs: number;
}

const DEFAULT_PROFILE: JuiceProfile = {
  mode: "default",
  cardDealMs: 560,
  cardDealStaggerMs: 90,
  cardDealOvershoot: 1.04,
  hoverLiftPx: 14,
  selectedLiftPx: 16,
  lockInPressMs: 200,
  lockInFanCompactMs: 320,
  lockInOpponentFlipStaggerMs: 80,
  hitstopMs: 166,
  orbMaxScale: 1.15,
  orbSettleScale: 1.0,
  chromaticAberrationPx: 1.5,
  disintegrateMs: 700,
  discoveryHoldMs: 600,
};

const QUIET_PROFILE: JuiceProfile = {
  ...DEFAULT_PROFILE,
  mode: "quiet",
  cardDealMs: 360,
  cardDealStaggerMs: 40,
  cardDealOvershoot: 1.0,
  hoverLiftPx: 8,
  selectedLiftPx: 10,
  lockInPressMs: 120,
  lockInFanCompactMs: 200,
  lockInOpponentFlipStaggerMs: 30,
  hitstopMs: 0, // no hitstop in quiet mode
  orbMaxScale: 1.0,
  chromaticAberrationPx: 0,
  discoveryHoldMs: 360,
};

const LOUD_PROFILE: JuiceProfile = {
  ...DEFAULT_PROFILE,
  mode: "loud",
  cardDealMs: 700,
  cardDealStaggerMs: 120,
  cardDealOvershoot: 1.1,
  hoverLiftPx: 20,
  selectedLiftPx: 24,
  lockInPressMs: 280,
  lockInFanCompactMs: 420,
  lockInOpponentFlipStaggerMs: 120,
  hitstopMs: 240,
  orbMaxScale: 1.3,
  chromaticAberrationPx: 3,
  discoveryHoldMs: 900,
};

const PROFILES: Record<JuiceMode, JuiceProfile> = {
  default: DEFAULT_PROFILE,
  quiet: QUIET_PROFILE,
  loud: LOUD_PROFILE,
};

export function getJuiceProfile(mode: JuiceMode = "default"): JuiceProfile {
  return PROFILES[mode];
}

// Ergonomic helpers used at call-sites.
export const juiceProfile = {
  current: { ...DEFAULT_PROFILE } as JuiceProfile,
  cardDealDelayMs(index: number, total: number): number {
    // Edges arrive last, center first — feels like "the dealer flicks the
    // middle to you first, then sweeps outward."
    const center = (total - 1) / 2;
    const distance = Math.abs(index - center);
    return Math.round(distance * this.current.cardDealStaggerMs);
  },
  setMode(mode: JuiceMode): void {
    this.current = { ...PROFILES[mode] };
  },
  /** Override a single value at runtime (Tweakpane / dev console use this). */
  patch(values: Partial<JuiceProfile>): void {
    this.current = { ...this.current, ...values };
  },
};

// ─────────────────────────────────────────────────────────────────
// Schema — the CONTRACT layer of the hexagon, exposed for Tweakpane
// (and any future creative-direction surface) to introspect.
//
// Each axis has: { key, label, min, max, step, unit, group }
// Tweakpane reads this; substrate stays unchanged.
// ─────────────────────────────────────────────────────────────────

export interface JuiceAxisSchema {
  readonly key: keyof JuiceProfile;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit: string;
  readonly group: "card-deal" | "hover" | "lock-in" | "clash" | "discovery";
}

export const JUICE_SCHEMA: readonly JuiceAxisSchema[] = [
  // Card-deal cascade
  { key: "cardDealMs", label: "Card deal duration", min: 200, max: 1200, step: 20, unit: "ms", group: "card-deal" },
  { key: "cardDealStaggerMs", label: "Card deal stagger", min: 0, max: 250, step: 5, unit: "ms", group: "card-deal" },
  { key: "cardDealOvershoot", label: "Card deal overshoot", min: 1.0, max: 1.2, step: 0.01, unit: "×", group: "card-deal" },
  // Hover / select
  { key: "hoverLiftPx", label: "Hover lift", min: 0, max: 30, step: 1, unit: "px", group: "hover" },
  { key: "selectedLiftPx", label: "Selected lift", min: 0, max: 30, step: 1, unit: "px", group: "hover" },
  // Lock-in commitment
  { key: "lockInPressMs", label: "Lock-in press", min: 80, max: 400, step: 10, unit: "ms", group: "lock-in" },
  { key: "lockInFanCompactMs", label: "Fan compaction", min: 100, max: 600, step: 20, unit: "ms", group: "lock-in" },
  { key: "lockInOpponentFlipStaggerMs", label: "Opponent flip stagger", min: 0, max: 200, step: 10, unit: "ms", group: "lock-in" },
  // Clash impact
  { key: "hitstopMs", label: "Hitstop duration", min: 0, max: 400, step: 10, unit: "ms", group: "clash" },
  { key: "orbMaxScale", label: "Orb max scale", min: 0.8, max: 1.5, step: 0.02, unit: "×", group: "clash" },
  { key: "orbSettleScale", label: "Orb settle scale", min: 0.5, max: 1.2, step: 0.02, unit: "×", group: "clash" },
  { key: "chromaticAberrationPx", label: "Chromatic aberration", min: 0, max: 8, step: 0.5, unit: "px", group: "clash" },
  { key: "disintegrateMs", label: "Disintegrate duration", min: 300, max: 1200, step: 20, unit: "ms", group: "clash" },
  // Discovery
  { key: "discoveryHoldMs", label: "Discovery hold", min: 200, max: 1500, step: 50, unit: "ms", group: "discovery" },
];

/** Runtime CSS-variable axes that aren't part of JuiceProfile but the
 * operator wants to live-tune. These write directly to `:root` style. */
export interface CssVarAxisSchema {
  readonly cssVar: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit: string;
  readonly defaultValue: number;
  readonly group: "camera" | "breathing";
}

export const CSS_VAR_SCHEMA: readonly CssVarAxisSchema[] = [
  // Camera
  { cssVar: "--puru-parallax-max", label: "Parallax max", min: 0, max: 12, step: 0.5, unit: "px", defaultValue: 4, group: "camera" },
  { cssVar: "--puru-idle-drift-amplitude", label: "Idle drift amplitude", min: 0, max: 6, step: 0.5, unit: "px", defaultValue: 2, group: "camera" },
  { cssVar: "--puru-idle-drift-period", label: "Idle drift period", min: 8, max: 30, step: 1, unit: "s", defaultValue: 18, group: "camera" },
  // Breathing
  { cssVar: "--puru-breath-amp", label: "Breath amplitude", min: 0, max: 0.04, step: 0.002, unit: "×", defaultValue: 0.018, group: "breathing" },
];

