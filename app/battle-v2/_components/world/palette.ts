/**
 * World palette — the cozy-management-sim colour vocabulary.
 *
 * Per build doc "Session 8 — The Playing Field". Hex strings (Three.js
 * materials want hex, not oklch). Every world module reads from here so the
 * field stays one coherent painting — change a colour once, the whole world
 * shifts with it.
 *
 * The look is warm, saturated, hand-painted-feeling. Greens lean yellow (sunlit
 * grass), not blue. Shadows are soft and warm, never neutral-grey.
 */

import type { ElementId } from "@/lib/purupuru/contracts/types";

export const PALETTE = {
  // ── Ground ──────────────────────────────────────────────────────────────
  grass: "#7cb24a", // sunlit grass — the dominant note
  grassLight: "#93c45e", // raised humps catching light
  grassDark: "#5f9439", // hollows + tree-shade patches
  dirt: "#b08a5a", // worn paths
  dirtDark: "#8f6c42", // plot soil, path ruts
  sand: "#d8c48f", // path edges where grass thins

  // ── Sky + atmosphere ────────────────────────────────────────────────────
  sky: "#bfe3f0", // soft warm daytime blue
  skyGround: "#9ab86a", // hemisphere light's ground bounce
  fog: "#cfe8ee", // matches sky, softens the field edge
  sunWarm: "#fff2d4", // the key light — warm afternoon sun
  sea: "#6ba8c9", // the calm sea the Tsuheji continent floats in
  seaDeep: "#5793b8", // deeper water at the continent's edge

  // ── Foliage ─────────────────────────────────────────────────────────────
  // Trees vary across these — green canopies dominate, autumn accents ring in.
  canopyGreen: ["#6fae3e", "#82bd52", "#5a9836"],
  canopyAutumn: ["#e0913a", "#d6a14a", "#c9722e", "#e6b340"],
  trunk: "#7a5536",
  bush: ["#5f9b3a", "#74ad4c"],

  // ── Structures ──────────────────────────────────────────────────────────
  wall: "#efe2c4", // warm plaster / daub walls
  wallShade: "#d8c79f",
  wood: "#9a6b40", // structural timber, fences
  woodDark: "#7c5532",
  thatch: "#c9a866", // thatched roof base

  // ── Ink / labels ────────────────────────────────────────────────────────
  ink: "#3a2e22", // warm near-black for label text
  parchment: "#f3e9d2", // sign boards, label backings
} as const;

/**
 * Per-element roof + accent tint. The structure body stays warm plaster; the
 * ROOF carries the element identity — the eye reads the village by its roofs,
 * the way the reference reads by its striped awnings and thatch.
 */
export const ELEMENT_ROOF: Record<ElementId, string> = {
  wood: "#6fae3e", // jade-green shingle
  fire: "#d9602f", // warm terracotta
  water: "#4f86b8", // slate blue
  metal: "#9a93a8", // weathered pewter
  earth: "#c08a3e", // ochre tile
};

/** Per-element glow colour — used for Active / hover emissive on a zone. */
export const ELEMENT_GLOW: Record<ElementId, string> = {
  wood: "#9bc77a",
  fire: "#e85a4a",
  water: "#5b8cd9",
  metal: "#b3a8c7",
  earth: "#c69f5e",
};

export const ELEMENT_KANJI: Record<ElementId, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};
