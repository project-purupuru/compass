/**
 * Time-of-day — derives a wuxing phase from a Date.
 *
 * The five day-phases ARE the five wuxing elements (per wuxing.yaml's
 * `time` field): morning=wood, noon=fire, afternoon=earth, evening=metal,
 * night=water. Sheng IS time progression.
 *
 * Operator framing (session 17):
 *   "I just don't want people to experience the game and it's too bright
 *    for them. If it's your night, then it should feel like it's nighttime.
 *    This calm awareness is what we want to have."
 *
 * → Player-local time is the SCENE'S only clock. Whole atmosphere shifts.
 *   Opponent's element still drives THEIR cluster's ambient VFX, but the
 *   skybox / ambient light are derived from the viewer's clock alone.
 *
 * "Memory of a sunset, not the physics of one" — palette per phase, not
 * a sun-disc simulation.
 */

import type { ElementIdT } from "./element";

// ── TimeOfDay phases (5 phases, one per element) ──────────────────────────

export type TimeOfDayPhase =
  | "morning"
  | "noon"
  | "afternoon"
  | "evening"
  | "night";

export const ALL_PHASES: readonly TimeOfDayPhase[] = [
  "morning",
  "noon",
  "afternoon",
  "evening",
  "night",
];

/** Maps a wuxing element to its canonical time-of-day phase. */
export const ELEMENT_PHASE: Record<ElementIdT, TimeOfDayPhase> = {
  wood: "morning",
  fire: "noon",
  earth: "afternoon",
  metal: "evening",
  water: "night",
};

/** Inverse — which element resonates at this phase. */
export const PHASE_ELEMENT: Record<TimeOfDayPhase, ElementIdT> = {
  morning: "wood",
  noon: "fire",
  afternoon: "earth",
  evening: "metal",
  night: "water",
};

// ── Hour boundaries (real-world-natural, not 5-equal-blocks) ──────────────
//
// Total covers 24h. Night wraps midnight (21:00 → 05:00 next day).
// Operator pin (2026-05-17): boundaries echo real-world dawn/dusk feel.

const PHASE_RANGES: readonly { phase: TimeOfDayPhase; start: number; end: number }[] = [
  { phase: "night",     start: 21, end: 24 },  // 21:00 → midnight
  { phase: "night",     start:  0, end:  5 },  // midnight → 05:00 (wrapped)
  { phase: "morning",   start:  5, end: 10 },
  { phase: "noon",      start: 10, end: 14 },
  { phase: "afternoon", start: 14, end: 18 },
  { phase: "evening",   start: 18, end: 21 },
];

// ── TimeOfDay state ────────────────────────────────────────────────────────

export interface TimeOfDayState {
  readonly phase: TimeOfDayPhase;
  /** Progress through current phase, 0..1. */
  readonly tFactor: number;
  /** The next phase in cycle (used for cross-fade easing). */
  readonly nextPhase: TimeOfDayPhase;
  /** Source date — for diagnostics + replayability. */
  readonly source: Date;
}

/**
 * Convert a Date to a TimeOfDayState. `tFactor` is the linear progress
 * through the current phase, useful for cross-fading sky colors near the
 * phase boundary.
 *
 * Locale-naive — uses the Date's *local* hours (so the player's machine
 * timezone is the player's time). This is intentional per operator framing.
 */
export function timeOfDayFromDate(date: Date = new Date()): TimeOfDayState {
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  for (const range of PHASE_RANGES) {
    if (hours >= range.start && hours < range.end) {
      const span = range.end - range.start;
      const tFactor = span > 0 ? (hours - range.start) / span : 0;
      return {
        phase: range.phase,
        tFactor,
        nextPhase: nextPhaseAfter(range.phase),
        source: date,
      };
    }
  }
  // Defensive fallback — should never fire if PHASE_RANGES covers 0..24.
  return {
    phase: "night",
    tFactor: 0,
    nextPhase: "morning",
    source: date,
  };
}

function nextPhaseAfter(phase: TimeOfDayPhase): TimeOfDayPhase {
  const i = ALL_PHASES.indexOf(phase);
  return ALL_PHASES[(i + 1) % ALL_PHASES.length];
}

// ── Phase-driven palette (sky + ambient light) ────────────────────────────
//
// "Memory of a sunset, not the physics of one." Five mood swatches that
// drive the scene atmosphere. Uses OKLCH-compatible hex values that play
// nicely with the existing puru palette (no new color invention).

export interface PhasePalette {
  /** Background gradient — top of sky. */
  readonly skyTop: string;
  /** Background gradient — bottom of sky. */
  readonly skyBottom: string;
  /** Ambient light hex. */
  readonly ambient: string;
  /** Directional / sun-key light. Cool-blue at night, warm at day. */
  readonly directional: string;
  /** Ambient light intensity (Three.js units). */
  readonly ambientIntensity: number;
  /** Directional light intensity. */
  readonly directionalIntensity: number;
  /** Fog tint (cel-soft atmosphere fade). */
  readonly fog: string;
}

export const PHASE_PALETTE: Record<TimeOfDayPhase, PhasePalette> = {
  morning: {
    skyTop:    "#f9d8a8",   // warm peach
    skyBottom: "#fef0d4",   // pale wheat
    ambient:   "#fff2d4",
    directional: "#fff0c0",
    ambientIntensity: 0.55,
    directionalIntensity: 1.10,
    fog: "#f5e4c2",
  },
  noon: {
    skyTop:    "#f0e8c8",   // bright bone-white
    skyBottom: "#fffaee",
    ambient:   "#fff7e0",
    directional: "#fff6d0",
    ambientIntensity: 0.65,
    directionalIntensity: 1.40,
    fog: "#f4ecd2",
  },
  afternoon: {
    skyTop:    "#e6c386",   // honey-amber
    skyBottom: "#f4dcae",
    ambient:   "#f8e2b4",
    directional: "#f8d68a",
    ambientIntensity: 0.55,
    directionalIntensity: 1.20,
    fog: "#e6cb96",
  },
  evening: {
    skyTop:    "#9b7290",   // rose-violet
    skyBottom: "#c89a82",   // dusty amber
    ambient:   "#d4b8a4",
    directional: "#e2a468",  // long warm rim
    ambientIntensity: 0.45,
    directionalIntensity: 0.85,
    fog: "#a68a92",
  },
  night: {
    skyTop:    "#1a2138",   // deep indigo
    skyBottom: "#2d3856",
    ambient:   "#7a8cb4",   // cool blue
    directional: "#a8b8d8",  // moon-key
    ambientIntensity: 0.40,
    directionalIntensity: 0.45,
    fog: "#2a3550",
  },
};
