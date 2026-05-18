/**
 * @deprecated Import directly from `@/lib/assets/manifest` instead.
 *
 * This shim re-exports the typed manifest's element-keyed shortcuts so
 * existing imports keep working for one cycle. Will be removed once all
 * consumers migrate to `getAsset(id)` / `cardArtChain(type, element)`.
 *
 * See lib/assets/manifest.ts for the canonical source of truth.
 */

export {
  CDN_BASE,
  cdn,
  BRAND,
  CARD_ART_PANELS,
  CARD_PASTEL,
  CARD_SATURATED,
  CARETAKER_FULL,
  JANI_CARDS,
  JANI_VARIANT,
  WORLD_MAP_TEXTURE,
  WORLD_SCENES,
  WORLD_SCENE_LABELS,
  cardArtChain,
} from "./assets/manifest";
