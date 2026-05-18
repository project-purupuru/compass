/**
 * celVocab — the shared cel-shading + ink vocabulary.
 *
 * Per session 14 (2026-05-16) — operator: "ensure underlying is systemized."
 * Every cel primitive in compass reads from THIS module. One place to tune
 * the whole world's ink-line thickness, gradient bands, hue picker, flavor
 * enum. Mutating a constant here propagates instantly across Tree, Bush,
 * Rock, Mushroom, Wildflower, FallenLog, Character, HexPlot — anywhere the
 * cel material is used.
 *
 * Distinct from celShading.ts: celShading.ts owns the gradient TEXTURE
 * (low-level material asset); celVocab.ts owns the LANGUAGE primitives
 * use (the ink palette, the hue pickers, the flavor enum). They compose.
 */

import { mulberry32 } from "../world/Foliage";
import { PALETTE } from "../world/palette";
import {
  DEFAULT_TOON_GRADIENT,
  TOON_GRADIENT_FOUR_BAND,
  TOON_GRADIENT_THREE_BAND,
  TOON_GRADIENT_TWO_BAND,
} from "./celShading";

// ── Ink palette ────────────────────────────────────────────────────────────

/**
 * The ink-line vocabulary. Three weights for visual hierarchy:
 *
 *   - INK_HEAVY   — focal silhouettes (tree trunks, rocks, character body)
 *   - INK_MID     — secondary silhouettes (branches, smaller rocks, snouts)
 *   - INK_FINE    — accents (leaf-tip puffs, mushroom caps, distant detail)
 *
 * Thickness is the @react-three/drei `<Outlines>` thickness prop — measured
 * in screen-aware world units; ~3-5 reads as a clean ink line at our camera
 * distance. Color is a warm near-black anchored to the Old Horai palette
 * (no neutral grey — operator memory: "shadows are warm").
 */
export const INK = {
  /** Warm near-black, matches --puru-ink-rich at the dark end. */
  color: "#2a1f12",
  /** Even darker for the character (most focal element). */
  colorDeep: "#1a0f06",
  heavy: 4,
  mid: 3,
  fine: 2,
} as const;

// ── Toon gradient defaults ─────────────────────────────────────────────────

/**
 * Re-export the gradient textures so primitives only need one import
 * (`celVocab`) for the entire cel language.
 */
export {
  DEFAULT_TOON_GRADIENT,
  TOON_GRADIENT_TWO_BAND,
  TOON_GRADIENT_THREE_BAND,
  TOON_GRADIENT_FOUR_BAND,
};

// ── Flavor enum ────────────────────────────────────────────────────────────

/**
 * The canonical foliage flavor. Mirrors the TreeFlavor literal in VfxConfig
 * but lives HERE so non-config primitives (LeafPuff, Bush, Mushroom,
 * Wildflower) can carry it without importing from VfxConfig. This is the
 * SUBSTRATE for the flavor concept.
 *
 *   - green   → PALETTE.canopyGreen band (default vegetation)
 *   - autumn  → PALETTE.canopyAutumn band (warm spice)
 *   - sakura  → reserved for legendary moments (operator codex pin)
 *   - honey   → warm yellow accents (wildflowers, mushroom caps)
 *   - moss    → cool darker green (rock tufts, deep forest accents)
 */
export type Flavor = "green" | "autumn" | "sakura" | "honey" | "moss";

/** The "rare" tier — never auto-rolled, only used when explicitly invoked. */
export const RARE_FLAVORS: readonly Flavor[] = ["sakura"];

const SAKURA_HUE = "#f3b6cf";
const HONEY_HUES: readonly string[] = ["#e8b248", "#dba038", "#f0c465"];
const MOSS_HUES: readonly string[] = ["#5a8043", "#496f38", "#6b9251"];

/**
 * Pick a hue from the flavor's palette band. Seeded so the same fixture
 * picks the same hue across re-renders.
 */
export function pickFlavorHue(flavor: Flavor, seed: number): string {
  const rand = mulberry32(seed);
  switch (flavor) {
    case "sakura":
      return SAKURA_HUE;
    case "autumn":
      return PALETTE.canopyAutumn[
        Math.floor(rand() * PALETTE.canopyAutumn.length)
      ];
    case "honey":
      return HONEY_HUES[Math.floor(rand() * HONEY_HUES.length)];
    case "moss":
      return MOSS_HUES[Math.floor(rand() * MOSS_HUES.length)];
    case "green":
    default:
      return PALETTE.canopyGreen[
        Math.floor(rand() * PALETTE.canopyGreen.length)
      ];
  }
}

// ── Per-instance hue jitter ────────────────────────────────────────────────

/**
 * Apply a tiny per-seed RGB jitter to a hex color. Used by HexPlot so no two
 * tiles of the same terrain class look identical. Default ±6% per channel.
 */
export function jitterHex(
  hex: string,
  seed: number,
  range: number = 0.06,
): string {
  const rand = mulberry32(seed);
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const jr = (rand() - 0.5) * 2 * range + 1;
  const jg = (rand() - 0.5) * 2 * range + 1;
  const jb = (rand() - 0.5) * 2 * range + 1;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const nr = clamp(r * jr);
  const ng = clamp(g * jg);
  const nb = clamp(b * jb);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

// ── Sway oscillator ────────────────────────────────────────────────────────

/**
 * Returns the current sway angle (radians) for a fixture with the given seed
 * + frequency + amplitude. Each fixture gets a phase offset so a field
 * doesn't sway in unison. Caller passes `clock.elapsedTime` from useFrame.
 *
 * Default amplitude ~3°, frequency ~0.4 Hz — Genshin/BoTW ambient register.
 */
export function swayAngle(
  elapsedSeconds: number,
  seed: number,
  amplitudeRadians: number = 0.05,
  frequencyHz: number = 0.4,
): number {
  const rand = mulberry32(seed);
  const phase = rand() * Math.PI * 2;
  const omega = 2 * Math.PI * frequencyHz;
  return Math.sin(elapsedSeconds * omega + phase) * amplitudeRadians;
}
