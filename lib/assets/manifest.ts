/**
 * Asset manifest — typed registry of every image source the app uses.
 *
 * Replaces ad-hoc CDN exports in lib/cdn.ts. lib/cdn.ts keeps a thin
 * re-export shim for one cycle so we don't shotgun every import site.
 *
 * Validator: `pnpm assets:check` (scripts/check-assets.mjs) HEADs each
 * AssetRecord.url and exits non-zero on any 4xx/5xx.
 *
 * Add new assets here. The validator is the test.
 */

import type { AssetClass, AssetRecord, CardType, Element } from "./types";
export type { AssetClass, AssetRecord, CardType, Element } from "./types";

export const CDN_BASE =
  process.env.NEXT_PUBLIC_CDN_BASE ??
  "https://thj-assets.s3.us-west-2.amazonaws.com/Purupuru";

function safe(path: string): string {
  return path.replace(/^\/+/, "").replace(/\.\./g, "");
}

export function cdn(path: string): string {
  return `${CDN_BASE}/${safe(path)}`;
}

const ELEMENTS: readonly Element[] = ["wood", "fire", "earth", "metal", "water"];

// ─────────────────────────────────────────────────────────────────
// Scene wallpapers — bus-stop atmosphere per element + time of day
// ─────────────────────────────────────────────────────────────────
const SCENES_BY_ELEMENT: Record<Element, { url: string; label: string }> = {
  wood: { url: cdn("scenes/bus-stop-spring-day.png"), label: "Tsuheji bus stop · spring" },
  fire: { url: cdn("scenes/tsuheji-bus-stop-sunset.png"), label: "Tsuheji bus stop · sunset" },
  earth: { url: cdn("scenes/tsuheji-bus-stop-bright-day.png"), label: "Tsuheji bus stop · daylight" },
  metal: { url: cdn("scenes/tsuheji-bus-stop-night.png"), label: "Tsuheji bus stop · night" },
  water: { url: cdn("scenes/bus-stop-rainy-day.png"), label: "Tsuheji bus stop · rain" },
};

// ─────────────────────────────────────────────────────────────────
// Full-body caretaker renders (transparent PNG)
// ─────────────────────────────────────────────────────────────────
const CARETAKER_FULL_BY_ELEMENT: Record<Element, string> = {
  wood: cdn("caretakers/caretaker-kaori-fullbody.png"),
  fire: cdn("caretakers/caretaker-akane-fullbody.png"),
  earth: cdn("caretakers/caretaker-nemu-fullbody.png"),
  metal: cdn("caretakers/caretaker-ren-fullbody.png"),
  water: cdn("caretakers/caretaker-ruan-fullbody.png"),
};

// ─────────────────────────────────────────────────────────────────
// Card composites — three variants per element
// ─────────────────────────────────────────────────────────────────
const SATURATED_BY_ELEMENT: Record<Element, string> = {
  wood: cdn("cards/wood-caretaker-kaori-card-saturated.png"),
  fire: cdn("cards/fire-caretaker-akane-card-saturated.png"),
  earth: cdn("cards/earth-caretaker-nemu-card-saturated.png"),
  metal: cdn("cards/metal-caretaker-ren-card-saturated.png"),
  water: cdn("cards/water-caretaker-ruan-card-saturated.png"),
};

const PASTEL_BY_ELEMENT: Record<Element, string> = {
  wood: cdn("cards/wood-caretaker-kaori-card-pastel.png"),
  fire: cdn("cards/fire-caretaker-akane-card-pastel.png"),
  earth: cdn("cards/earth-caretaker-nemu-card-pastel.png"),
  metal: cdn("cards/metal-caretaker-ren-card-pastel.png"),
  water: cdn("cards/water-caretaker-ruan-card-pastel.png"),
};

const JANI_CARD_BY_ELEMENT: Record<Element, string> = {
  wood: cdn("cards/jani-trading-card-wood.png"),
  fire: cdn("cards/jani-trading-card-fire.png"),
  // NOTE 2026-05-12: jani-trading-card-earth returns 403 from the bucket.
  // The validator catches this and the fallback chain resolves earth→variant.
  earth: cdn("cards/jani-trading-card-earth.png"),
  metal: cdn("cards/jani-trading-card-metal.png"),
  water: cdn("cards/jani-trading-card-water.png"),
};

const JANI_VARIANT_BY_ELEMENT: Record<Element, string> = {
  wood: cdn("jani/jani-wood-variant.png"),
  fire: cdn("jani/jani-fire-variant.png"),
  earth: cdn("jani/jani-earth-variant.png"),
  metal: cdn("jani/jani-metal-variant.png"),
  water: cdn("jani/jani-water-variant.png"),
};

const CARD_ART_PANEL_BY_ELEMENT: Record<Element, string> = {
  wood: cdn("cards/caretaker-kaori-wood-card.png"),
  fire: cdn("cards/caretaker-akane-fire-card.png"),
  earth: cdn("cards/caretaker-nemu-earth-card.png"),
  metal: cdn("cards/caretaker-ren-metal-card.png"),
  water: cdn("cards/caretaker-ruan-water-card.png"),
};

// ─────────────────────────────────────────────────────────────────
// Brand assets
// ─────────────────────────────────────────────────────────────────
const BRAND_URLS = {
  wordmark: cdn("brand/purupuru-wordmark.svg"),
  logo: cdn("brand/project-purupuru-logo.png"),
  logoCardBack: cdn("brand/project-purupuru-logo-card-back.png"),
} as const;

// ─────────────────────────────────────────────────────────────────
// MANIFEST — the canonical AssetRecord list
// ─────────────────────────────────────────────────────────────────
export const MANIFEST: readonly AssetRecord[] = [
  // Scenes
  ...ELEMENTS.map<AssetRecord>((el) => ({
    id: `scene:${el}`,
    url: SCENES_BY_ELEMENT[el].url,
    fallbacks: [],
    class: "scene" satisfies AssetClass,
    label: SCENES_BY_ELEMENT[el].label,
  })),

  // Caretakers (full-body)
  ...ELEMENTS.map<AssetRecord>((el) => ({
    id: `caretaker:full:${el}`,
    url: CARETAKER_FULL_BY_ELEMENT[el],
    fallbacks: [],
    class: "caretaker" satisfies AssetClass,
  })),

  // Card composites — saturated (caretaker_a + transcendence)
  ...ELEMENTS.map<AssetRecord>((el) => ({
    id: `card:saturated:${el}`,
    url: SATURATED_BY_ELEMENT[el],
    fallbacks: [PASTEL_BY_ELEMENT[el]],
    class: "card" satisfies AssetClass,
    dimensions: { w: 733, h: 1024 },
    contentType: "image/png",
  })),

  // Card composites — pastel (caretaker_b)
  ...ELEMENTS.map<AssetRecord>((el) => ({
    id: `card:pastel:${el}`,
    url: PASTEL_BY_ELEMENT[el],
    fallbacks: [SATURATED_BY_ELEMENT[el]],
    class: "card" satisfies AssetClass,
    dimensions: { w: 733, h: 1024 },
    contentType: "image/png",
  })),

  // Card composites — jani trading cards (with variant + saturated fallback)
  ...ELEMENTS.map<AssetRecord>((el) => ({
    id: `card:jani:${el}`,
    url: JANI_CARD_BY_ELEMENT[el],
    fallbacks: [JANI_VARIANT_BY_ELEMENT[el], SATURATED_BY_ELEMENT[el]],
    class: "card" satisfies AssetClass,
    dimensions: { w: 733, h: 1024 },
    contentType: "image/png",
    // NOTE: jani-trading-card-earth returns 403 on the bucket as of 2026-05-12.
    // Fallback chain (variant + saturated) handles it; CI treats as warning.
    // Remove this flag when upstream is fixed.
    expectedBroken: el === "earth",
    label: el === "earth" ? "upstream gap; fallback to variant works" : undefined,
  })),

  // Card art panels (alt source for ComposedCard art window)
  ...ELEMENTS.map<AssetRecord>((el) => ({
    id: `card-art:panel:${el}`,
    url: CARD_ART_PANEL_BY_ELEMENT[el],
    fallbacks: [],
    class: "card-art" satisfies AssetClass,
    dimensions: { w: 500, h: 700 },
  })),

  // Jani variants (square art, no card chrome)
  ...ELEMENTS.map<AssetRecord>((el) => ({
    id: `card-art:variant:${el}`,
    url: JANI_VARIANT_BY_ELEMENT[el],
    fallbacks: [],
    class: "card-art" satisfies AssetClass,
  })),

  // Brand
  { id: "brand:wordmark", url: BRAND_URLS.wordmark, fallbacks: [], class: "brand", contentType: "image/svg+xml" },
  { id: "brand:logo", url: BRAND_URLS.logo, fallbacks: [], class: "brand" },
  { id: "brand:card-back", url: BRAND_URLS.logoCardBack, fallbacks: [], class: "brand", dimensions: { w: 733, h: 1024 } },

  // Local (validator skips these)
  {
    id: "local:tsuheji-map",
    url: "/art/tsuheji-map.png",
    fallbacks: [],
    class: "local",
    localOnly: true,
    label: "Tsuheji continent texture (ships with repo)",
  },
];

// ─────────────────────────────────────────────────────────────────
// Public lookup helpers
// ─────────────────────────────────────────────────────────────────

const ID_INDEX: ReadonlyMap<string, AssetRecord> = new Map(
  MANIFEST.map((r) => [r.id, r] as const),
);

/** Resolve a single AssetRecord by id. Returns undefined if not found. */
export function getAsset(id: string): AssetRecord | undefined {
  return ID_INDEX.get(id);
}

/** Resolve the ordered fallback chain for an asset (primary first). */
export function getChain(id: string): readonly string[] {
  const r = ID_INDEX.get(id);
  if (!r) return [];
  return [r.url, ...r.fallbacks];
}

/**
 * Resolve a card art source chain given (cardType, element).
 *
 *   jani         → [trading-card, variant, saturated]
 *   caretaker_b  → [pastel, saturated]
 *   caretaker_a  → [saturated, pastel]
 *   transcendence → [saturated, pastel]
 *
 * Always returns ≥1 entry. Pair with `<CdnImage>` to walk on error.
 */
export function cardArtChain(cardType: CardType, element: Element): readonly string[] {
  if (cardType === "jani") return getChain(`card:jani:${element}`);
  if (cardType === "caretaker_b") return getChain(`card:pastel:${element}`);
  // caretaker_a + transcendence
  return getChain(`card:saturated:${element}`);
}

// ─────────────────────────────────────────────────────────────────
// Convenience element-keyed records (kept for backward compatibility
// with lib/cdn.ts shim consumers). Prefer getAsset() / cardArtChain()
// in new code.
// ─────────────────────────────────────────────────────────────────
export const WORLD_SCENES: Record<Element, string> = {
  wood: SCENES_BY_ELEMENT.wood.url,
  fire: SCENES_BY_ELEMENT.fire.url,
  earth: SCENES_BY_ELEMENT.earth.url,
  metal: SCENES_BY_ELEMENT.metal.url,
  water: SCENES_BY_ELEMENT.water.url,
};

export const WORLD_SCENE_LABELS: Record<Element, string> = {
  wood: SCENES_BY_ELEMENT.wood.label,
  fire: SCENES_BY_ELEMENT.fire.label,
  earth: SCENES_BY_ELEMENT.earth.label,
  metal: SCENES_BY_ELEMENT.metal.label,
  water: SCENES_BY_ELEMENT.water.label,
};

export const CARETAKER_FULL: Record<Element, string> = CARETAKER_FULL_BY_ELEMENT;
export const CARD_SATURATED: Record<Element, string> = SATURATED_BY_ELEMENT;
export const CARD_PASTEL: Record<Element, string> = PASTEL_BY_ELEMENT;
export const CARD_ART_PANELS: Record<Element, string> = CARD_ART_PANEL_BY_ELEMENT;
export const JANI_CARDS: Record<Element, string> = JANI_CARD_BY_ELEMENT;
export const JANI_VARIANT: Record<Element, string> = JANI_VARIANT_BY_ELEMENT;

export const BRAND = BRAND_URLS;
export const WORLD_MAP_TEXTURE = "/art/tsuheji-map.png";
