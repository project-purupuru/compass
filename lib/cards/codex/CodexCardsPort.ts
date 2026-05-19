/**
 * CodexCardsPort — kitchen read-port for ingredients sourced from the codex.
 *
 * V0 reads from /public/codex/ (vendored from purupuru-codex PR #1). When the
 * codex pack sync delivers the same content into
 * .claude/constructs/packs/purupuru-codex/cards/, swap the fetch URLs to a
 * pack-sourced symlink/build-step (no shape change in this port).
 *
 * Plain async fns. Game-state lives in Effect substrate elsewhere; the kitchen
 * UI is allowed to call these directly (per substrate-not-ui-islands: ports
 * are the seam, this IS the port, Effect.gen isn't required for the read).
 */

import { Schema as S } from "effect";

import {
  CodexCardIndexEntry,
  CodexLayersManifest,
  type CodexCardIndexEntryT,
  type CodexLayersManifestT,
  type CodexImageLayerT,
} from "./layers.schema";

const decodeIndexEntry = S.decodeUnknownSync(CodexCardIndexEntry);
const decodeManifest = S.decodeUnknownSync(CodexLayersManifest);

// In-memory caches. When >1 CardFace in a hand renders the same codex card,
// we want one fetch. The index cache also seeds the slug-presence check in
// cardIdMap without a roundtrip.
let _indexCache: Promise<CodexCardIndexEntryT[]> | null = null;
const _manifestCache = new Map<string, Promise<CodexLayersManifestT>>();

/** Forget cached values — call after HMR or content rotation. */
export function invalidateCodexCache(): void {
  _indexCache = null;
  _manifestCache.clear();
}

/**
 * V0 asset-file inventory per card slug. The card-meker's `image.assetRef`
 * field is a nickname (e.g. "earth.png") that can repeat across layers in
 * one card — so it does not map 1:1 to a filename. The actual files use a
 * `layer-{N}-{slugified-name}.{ext}` convention where N is creation order.
 * Until the card-meker exports a proper file-name field per layer, V0
 * resolves by slug-matching `layer.name` against the file list.
 *
 * Surface to operator + Gumi as a card-meker spec gap.
 */
export const KNOWN_CARD_FILES: Readonly<Record<string, readonly string[]>> = {
  "earth-jani": [
    "composite.webp",
    "layer-0-earth-png.png",
    "layer-2-earth-icon.png",
  ],
};

export async function listCodexCards(): Promise<CodexCardIndexEntryT[]> {
  if (_indexCache) return _indexCache;
  _indexCache = (async () => {
    const text = await fetch("/codex/cards.jsonl", { cache: "no-cache" }).then(
      (r) => r.text(),
    );
    const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
    const out: CodexCardIndexEntryT[] = [];
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        out.push(decodeIndexEntry(json));
      } catch (e) {
        console.warn("[codex] index entry parse failed:", e, line.slice(0, 80));
      }
    }
    return out;
  })();
  return _indexCache;
}

export async function getCodexCardLayers(
  slug: string,
): Promise<CodexLayersManifestT> {
  const existing = _manifestCache.get(slug);
  if (existing) return existing;
  const promise = fetch(`/codex/cards/${slug}/layers.json`, { cache: "no-cache" })
    .then((r) => r.json())
    .then((json) => decodeManifest(json));
  _manifestCache.set(slug, promise);
  // If the fetch rejects, drop the cache so a retry can happen.
  promise.catch(() => _manifestCache.delete(slug));
  return promise;
}

/**
 * Slug-match the layer's `name` against known files in the card directory.
 * Returns the URL to use as <img src> or null when no match is found.
 */
export function resolveCodexLayerAssetUrl(
  slug: string,
  layer: CodexImageLayerT,
): string | null {
  const files = KNOWN_CARD_FILES[slug] ?? [];
  if (files.length === 0) return null;
  const slugName = layer.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\./g, "-");
  // exact-token first (find files containing the slugified name)
  const match =
    files.find((f) => f.toLowerCase().includes(slugName)) ??
    // fallback: assetRef token (often shared across layers — pick first)
    files.find((f) =>
      f.toLowerCase().includes(layer.image.assetRef.toLowerCase().replace(/\./g, "-")),
    );
  return match ? `/codex/cards/${slug}/${match}` : null;
}

export function getCompositeUrl(slug: string): string {
  return `/codex/cards/${slug}/composite.webp`;
}
