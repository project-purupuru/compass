/**
 * Card Layer System — Types
 *
 * Ported from `purupuru/lib/card-system/` with the compass-specific
 * `face: "front" | "back"` axis so card backs are first-class layers
 * (not patched filenames).
 *
 * Render model: DOM-stacked `<img>` layers (NOT canvas) — mobile-first,
 * hit-testable, motion-compatible.
 *
 * Doctrine pointer: kickoff brief Pillar 1
 *   grimoires/loa/proposals/kickoff-next-session-2026-05-12.md
 */

import type { CardType } from "@/lib/honeycomb/cards";
import type { Element } from "@/lib/honeycomb/wuxing";

export type LayerElement = Element | "harmony";

export type LayerRarity = "common" | "mid" | "rare" | "rarest";

export type RevealStage = 1 | 2 | 3;

export type LayerSource = "immutable" | "adaptive";

export type Face = "front" | "back";

export type ResonanceBucket = "dormant" | "awakening" | "resonant" | "harmonized";

export type SelectionLogic =
  | { readonly type: "element"; readonly variants: Readonly<Record<string, string>> }
  | { readonly type: "rarity"; readonly variants: Readonly<Record<LayerRarity, string>> }
  | { readonly type: "cardType"; readonly variants: Readonly<Record<CardType, string>> }
  | {
      readonly type: "resonance";
      readonly thresholds: Readonly<Record<ResonanceBucket, readonly [number, number]>>;
      readonly paths: Readonly<Record<ResonanceBucket, string>>;
      readonly elementSpecific: readonly ResonanceBucket[];
    }
  | { readonly type: "static"; readonly path: string };

export interface LayerDefinition {
  readonly name: string;
  readonly zIndex: number;
  readonly source: LayerSource;
  readonly selectionLogic: SelectionLogic;
  /** If absent, layer applies to all reveal stages. */
  readonly revealStages?: readonly RevealStage[];
  /** If absent, layer applies to all faces. Compass extension. */
  readonly faces?: readonly Face[];
  readonly description?: string;
}

export interface LayerRegistry {
  readonly version: number;
  readonly canvas: { readonly width: number; readonly height: number };
  /** Prepended to non-absolute paths. Local repo paths start with `/`. */
  readonly cdnBase: string;
  readonly layers: readonly LayerDefinition[];
}

export interface ResolvedLayer {
  readonly url: string;
  readonly zIndex: number;
  readonly layerName: string;
  readonly source: LayerSource;
}

export interface ResolveInput {
  readonly registry: LayerRegistry;
  readonly element: LayerElement;
  readonly cardType: CardType;
  readonly rarity: LayerRarity;
  readonly revealStage: RevealStage;
  readonly face: Face;
  /** 0-100, drives behavioral layer bucket. Defaults to 50 ("awakening"). */
  readonly resonance?: number;
  /** Adaptive element affinity from score API. Defaults to `element`. */
  readonly elementAffinity?: LayerElement;
}

/**
 * Coarse mapping from compass cardType → layer rarity for callers that
 * don't have an explicit rarity value yet. Lifted at the boundary so
 * the registry remains rarity-keyed and decoupled from cardType taxonomy.
 *   jani         → common  (base striker)
 *   caretaker_a  → mid     (support character)
 *   caretaker_b  → rare    (utility character)
 *   transcendence → rarest (transcendence)
 */
export function cardTypeToRarity(t: CardType): LayerRarity {
  switch (t) {
    case "jani":
      return "common";
    case "caretaker_a":
      return "mid";
    case "caretaker_b":
      return "rare";
    case "transcendence":
      return "rarest";
  }
}

/** Bucket a 0-100 resonance value into the behavioral layer's keys. */
export function bucketResonance(
  r: number,
  thresholds: Readonly<Record<ResonanceBucket, readonly [number, number]>>,
): ResonanceBucket {
  const order: readonly ResonanceBucket[] = ["dormant", "awakening", "resonant", "harmonized"];
  for (const bucket of order) {
    const range = thresholds[bucket];
    if (range && r >= range[0] && r <= range[1]) return bucket;
  }
  return "dormant";
}
