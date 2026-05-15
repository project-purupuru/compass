/**
 * media-types — the shape of a catalogued media asset.
 *
 * The FenceLayer annotation tool is "aware" of curated assets across three
 * libraries: purupuru-assets as source of truth, world-purupuru's deployed
 * static library, and compass's own public/ dir. A fence drawn over a region
 * can then surface the assets that belong there (see media-match.ts).
 */

export type MediaElement = "wood" | "fire" | "earth" | "metal" | "water";
export type MediaSource = "purupuru-assets" | "world-purupuru" | "compass";
export type MediaLabelQuality = "semantic" | "path-inferred" | "numeric-id";
export type MediaMigrationStatus = "available-in-compass" | "source-only" | "compass-only";
export type MediaDelivery = "compass-public" | "world-static" | "source-repo";

export interface MediaStorageHint {
  /** Freeside asset-pipeline consumer label reserved for this local tool surface. */
  readonly consumerLabel: "purupuru:battle-v2-devtools:v1";
  /** Deterministic object-key candidate for a future freeside-storage sync. */
  readonly storageKey: string;
  /** Current local serving mode. */
  readonly delivery: MediaDelivery;
  /** Env var an AWS-aware sync step should read for bucket selection. */
  readonly bucketEnv: "FREESIDE_STORAGE_BUCKET";
  /** Env var an AWS-aware sync step should read for CloudFront/CDN URL materialization. */
  readonly cdnBaseUrlEnv: "FREESIDE_STORAGE_CDN_BASE_URL";
}

export interface MediaEntry {
  /** basename without extension, e.g. "caretaker-kaori-pose". */
  readonly id: string;
  /** filename with extension. */
  readonly file: string;
  /** the catalog bucket: caretakers · puruhani · jani · icons · scenes · stones · … */
  readonly category: string;
  /** inferred wuxing element, or null if the asset isn't element-keyed. */
  readonly element: MediaElement | null;
  /** which library it came from. */
  readonly source: MediaSource;
  /** path relative to that library's asset root. */
  readonly sourcePath: string;
  /** deterministic labels inferred from path, name, role, and element. */
  readonly semanticTags: readonly string[];
  /** whether the label is human-readable or mostly path/id derived. */
  readonly labelQuality: MediaLabelQuality;
  /** migration state from source/deployed libraries into Compass public/. */
  readonly migrationStatus: MediaMigrationStatus;
  /** sha256 from purupuru-assets MANIFEST.json when available. */
  readonly sha256: string | null;
  /** byte count from purupuru-assets MANIFEST.json when available. */
  readonly bytes: number | null;
  /** Freeside/AWS-aware storage hint; does not imply the object is uploaded. */
  readonly storage: MediaStorageHint;
  /** servable URL in the compass app, or null if it must be copied in first. */
  readonly publicUrl: string | null;
  /** true when the asset is already reachable from compass's public/ dir. */
  readonly inCompass: boolean;
}
