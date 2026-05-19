/**
 * cardIdMap — bridge between compass gameplay cards and Gumi's codex slugs.
 *
 * Compass cards carry `id` (gameplay slug e.g. "wood_awakening"), `elementId`
 * ("wood"/"fire"/...), and `cardType` (role: "activation"/"tool"/...). The
 * codex addresses cards by character-shape slugs ("earth-jani", future
 * "wood-caretaker-a", etc.) — the layer-system CardType (jani / caretaker_a /
 * caretaker_b / transcendence) is the second token.
 *
 * Default derivation: `{element}-{layer-cardType}`. This is the convention,
 * not a fact — when Gumi authors content under different slugs, add to the
 * override map below. The resolver checks codex membership before declaring
 * a match; absent cards fall back to legacy registry render in CardFace.
 *
 * Operator wiring 2026-05-18: zero current gameplay cards derive to
 * "earth-jani" (the only codex-canonical card today). Battle visuals continue
 * to render via registry until Gumi authors more codex cards. The kitchen's
 * status footer surfaces the gap.
 */

import { cardTypeBridge } from "@/lib/cards/bridge";
import type { CardDefinition } from "@/lib/purupuru/contracts/types";

import { listCodexCards } from "./CodexCardsPort";

/**
 * Explicit slug overrides. Use when a gameplay card's slug doesn't match the
 * derived `{element}-{layerCardType}` convention.
 *
 * Key = CardDefinition.id (gameplay-side snake_case slug).
 * Value = codex slug (kebab-case).
 *
 * ─── DEMO ENTRIES (2026-05-18) ──────────────────────────────────────────
 * Operator requested universal codex render in card-lab so the kitchen
 * primitive's reach is *visible*. All current wood-pack gameplay cards
 * are pointed at `earth-jani` (the only codex-canonical card today). This
 * is INTENTIONALLY a lie about content semantics — the slug pointer is
 * the truthful element, the visual is a placeholder until Gumi authors
 * per-card-type cards in the codex.
 *
 * Remove these entries when more codex cards land. Grep for `// DEMO`.
 */
const CARD_ID_OVERRIDES: Readonly<Record<string, string>> = {
  earth_grounding: "earth-jani", // DEMO · maps to earth-caretaker-a in convention
  wood_awakening: "earth-jani", // DEMO · maps to wood-jani in convention
  water_flowing: "earth-jani", // DEMO · maps to water-jani in convention
  fire_kindling: "earth-jani", // DEMO · maps to fire-transcendence in convention
  metal_tempering: "earth-jani", // DEMO · maps to metal-caretaker-b in convention
};

/**
 * Derive the canonical codex slug for a compass gameplay card. Pure — does
 * not consult the codex. Use `resolveCodexSlug` to also check membership.
 */
export function deriveCodexSlug(card: CardDefinition): string {
  const override = CARD_ID_OVERRIDES[card.id];
  if (override) return override;
  const layerType = cardTypeBridge(card.cardType);
  // layer cardType is kebab-friendly ("jani" / "caretaker_a" / etc.). Normalize
  // underscores to dashes since codex slugs are kebab-case.
  const normalized = layerType.replace(/_/g, "-");
  return `${card.elementId}-${normalized}`;
}

/**
 * Resolve a gameplay card to a codex slug ONLY if that slug is canonical in
 * the codex index. Returns null when the card has no codex visuals authored
 * yet — the caller should fall back to a legacy render or placeholder.
 *
 * Async because it consults the codex index (cached after first fetch).
 */
export async function resolveCodexSlug(
  card: CardDefinition,
): Promise<string | null> {
  const slug = deriveCodexSlug(card);
  const index = await listCodexCards();
  return index.some((entry) => entry.slug === slug) ? slug : null;
}

/**
 * Snapshot of the pipeline gap — useful for kitchen status footer rendering.
 */
export interface CodexCoverageSnapshot {
  readonly pantrySize: number;
  readonly authoredSlugs: readonly string[];
  /** Slugs the codex has but no gameplay card consumes (yet). */
  readonly unconsumedSlugs: readonly string[];
  /** Gameplay cards with no codex match. */
  readonly uncoveredCards: readonly { id: string; expectedSlug: string }[];
}

export async function getCodexCoverage(
  cards: readonly CardDefinition[],
): Promise<CodexCoverageSnapshot> {
  const index = await listCodexCards();
  const authored = new Set(index.map((e) => e.slug));
  const consumed = new Set<string>();
  const uncoveredCards: { id: string; expectedSlug: string }[] = [];
  for (const card of cards) {
    const slug = deriveCodexSlug(card);
    if (authored.has(slug)) {
      consumed.add(slug);
    } else {
      uncoveredCards.push({ id: card.id, expectedSlug: slug });
    }
  }
  const unconsumed = [...authored].filter((s) => !consumed.has(s));
  return {
    pantrySize: authored.size,
    authoredSlugs: [...authored],
    unconsumedSlugs: unconsumed,
    uncoveredCards,
  };
}
