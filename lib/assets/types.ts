/**
 * Asset manifest types.
 *
 * Every CDN URL the app touches MUST be registered as an AssetRecord in
 * lib/assets/manifest.ts. The validator (scripts/check-assets.mjs) HEADs
 * each url and exits non-zero on any 4xx/5xx so broken paths fail at
 * build time, not in the browser.
 *
 * See lib/assets/README.md for the contributor guide.
 */

export type AssetClass =
  | "scene" // bus-stop wallpapers, world art
  | "caretaker" // full-body transparent character renders
  | "card" // full pre-composed card composites (saturated, pastel, jani)
  | "card-art" // square art panels (variant or panel-only images)
  | "brand" // wordmarks, logos, card backs
  | "local"; // asset shipped with the repo (no CDN)

export type CardType = "jani" | "caretaker_a" | "caretaker_b" | "transcendence";

export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export interface AssetRecord {
  /** Stable slug, unique across the manifest. Pattern `class:variant:id`. */
  readonly id: string;
  /** Primary URL. The first one we try. */
  readonly url: string;
  /** Ordered fallback chain. Tried left-to-right on 4xx/5xx. */
  readonly fallbacks: readonly string[];
  /** Coarse classification. */
  readonly class: AssetClass;
  /** Optional measured dimensions (px). Populated by check-assets if HEADed. */
  readonly dimensions?: { readonly w: number; readonly h: number };
  /** Optional content type override. Default inferred from extension. */
  readonly contentType?: string;
  /** Human-readable label. */
  readonly label?: string;
  /** If true, the validator skips this entry (local-only assets). */
  readonly localOnly?: boolean;
  /**
   * If true, the validator reports the broken url as a WARNING instead of a
   * failure. Use only when the upstream bucket has a known gap AND the
   * fallback chain handles it gracefully. Document the reason in `label`.
   */
  readonly expectedBroken?: boolean;
}
