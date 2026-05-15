#!/usr/bin/env node
/**
 * scan-media.mjs — builds the FenceLayer media index.
 *
 * Scans purupuru-assets, world-purupuru's curated static library, and
 * compass's public/ dir, then emits media-index.generated.ts: the typed catalog
 * the annotation tool uses to answer "what media exists for this region?".
 *
 * Run from the cycle-1 worktree root:
 *   node app/battle-v2/_devtools/scripts/scan-media.mjs
 *
 * Overrides:
 *   PURUPURU_ASSETS_ROOT=<path>
 *   WORLD_PURUPURU_STATIC=<path>
 *   node .../scan-media.mjs --json
 */

import { readdirSync, statSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

const PURUPURU_ASSETS_ROOT =
  process.env.PURUPURU_ASSETS_ROOT ??
  "/Users/zksoju/Documents/GitHub/purupuru-assets";
const WP_STATIC =
  process.env.WORLD_PURUPURU_STATIC ??
  "/Users/zksoju/Documents/GitHub/world-purupuru/sites/world/static";
const COMPASS_PUBLIC = join(process.cwd(), "public");
const OUT = join(process.cwd(), "app/battle-v2/_devtools/media-index.generated.ts");
const EMIT_JSON = process.argv.includes("--json");
const CONSUMER_LABEL = "purupuru:battle-v2-devtools:v1";

const MEDIA_EXT = new Set([".png", ".webp", ".jpg", ".jpeg", ".svg"]);
const ELEMENTS = ["wood", "fire", "earth", "metal", "water"];
const CARETAKER_ELEMENT = {
  kaori: "wood",
  akane: "fire",
  nemu: "earth",
  ren: "metal",
  ruan: "water",
};
const KNOWN_CATEGORIES = [
  "banners",
  "bear-costumes",
  "bear-faces",
  "bear-pfps",
  "bears",
  "boarding-passes",
  "caretakers",
  "puruhani",
  "jani",
  "icons",
  "scenes",
  "scenes-hd",
  "stones",
  "cards",
  "characters",
  "characters-hd",
  "stickers",
  "element-effects",
  "elements",
  "brand",
  "quiz",
  "skills",
  "patterns",
  "og",
  "weather",
  "maps",
];

const ROLE_TAGS = {
  caretaker: ["caretaker"],
  puruhani: ["puruhani"],
  jani: ["jani"],
  chibi: ["chibi"],
  bear: ["bear"],
  bears: ["bear"],
  card: ["card"],
  cards: ["card"],
  scene: ["scene"],
  scenes: ["scene"],
  stone: ["stone"],
  stones: ["stone"],
  logo: ["brand", "logo"],
  wordmark: ["brand", "wordmark"],
  map: ["map"],
};

function walk(dir, root, acc) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, root, acc);
    else if (MEDIA_EXT.has(extname(name).toLowerCase())) {
      acc.push(relative(root, full));
    }
  }
  return acc;
}

function categorize(rel) {
  const low = rel.toLowerCase();
  if (low.includes("tsuheji-map") || low.includes("/map")) return "maps";
  if (low.includes("/og/weather/")) return "weather";
  for (const seg of rel.split("/")) {
    if (KNOWN_CATEGORIES.includes(seg)) return seg;
  }
  return "misc";
}

function inferElement(name) {
  const low = name.toLowerCase();
  for (const el of ELEMENTS) if (low.includes(el)) return el;
  for (const [person, el] of Object.entries(CARETAKER_ELEMENT)) {
    if (low.includes(person)) return el;
  }
  return null;
}

function readAssetsManifest() {
  const manifestPath = join(PURUPURU_ASSETS_ROOT, "MANIFEST.json");
  if (!existsSync(manifestPath)) return new Map();
  const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  const map = new Map();
  for (const file of parsed.files ?? []) {
    if (file?.path) map.set(file.path, { sha256: file.sha256 ?? null, bytes: file.bytes ?? null });
  }
  return map;
}

function tokensFor(rel, category, element) {
  const tokens = new Set([category]);
  const low = rel.toLowerCase();
  for (const part of low.split(/[^a-z0-9]+/g)) {
    if (
      !part ||
      /^\d+$/.test(part) ||
      part === "public" ||
      part === "art" ||
      MEDIA_EXT.has(`.${part}`)
    ) {
      continue;
    }
    tokens.add(part);
    if (ROLE_TAGS[part]) ROLE_TAGS[part].forEach((tag) => tokens.add(tag));
  }
  if (element) tokens.add(element);
  for (const person of Object.keys(CARETAKER_ELEMENT)) {
    if (low.includes(person)) tokens.add(person);
  }
  return [...tokens].sort();
}

function labelQuality(rel, id, element) {
  if (/^\d+$/.test(id)) return "numeric-id";
  const low = rel.toLowerCase();
  if (element || Object.keys(CARETAKER_ELEMENT).some((name) => low.includes(name))) return "semantic";
  if (Object.keys(ROLE_TAGS).some((role) => low.includes(role))) return "semantic";
  return "path-inferred";
}

function migrationStatus(source, id, publicUrl, nonCompassIds) {
  if (source === "compass" && !nonCompassIds.has(id)) return "compass-only";
  if (publicUrl) return "available-in-compass";
  return "source-only";
}

function storageHint(source, rel, publicUrl) {
  const cleanRel = rel.replace(/^public\//, "");
  const delivery = publicUrl
    ? "compass-public"
    : source === "world-purupuru"
      ? "world-static"
      : "source-repo";

  return {
    consumerLabel: CONSUMER_LABEL,
    storageKey: `Purupuru/${source}/${cleanRel}`,
    delivery,
    bucketEnv: "FREESIDE_STORAGE_BUCKET",
    cdnBaseUrlEnv: "FREESIDE_STORAGE_CDN_BASE_URL",
  };
}

function entryFor({ rel, source, publicUrl, manifest, nonCompassIds }) {
  const file = basename(rel);
  const id = basename(rel, extname(rel));
  const category = categorize(rel);
  const element = inferElement(rel);
  const manifestRow = manifest.get(rel) ?? manifest.get(`public/${rel}`) ?? null;

  return {
    id,
    file,
    category,
    element,
    source,
    sourcePath: rel,
    semanticTags: tokensFor(rel, category, element),
    labelQuality: labelQuality(rel, id, element),
    migrationStatus: migrationStatus(source, id, publicUrl, nonCompassIds),
    sha256: manifestRow?.sha256 ?? null,
    bytes: manifestRow?.bytes ?? null,
    storage: storageHint(source, rel, publicUrl),
    publicUrl,
    inCompass: publicUrl !== null,
  };
}

// ── scan libraries ────────────────────────────────────────────────
const assetsManifest = readAssetsManifest();
const assetFiles = existsSync(join(PURUPURU_ASSETS_ROOT, "public"))
  ? walk(join(PURUPURU_ASSETS_ROOT, "public"), PURUPURU_ASSETS_ROOT, [])
  : [];
const wpFiles = existsSync(WP_STATIC) ? walk(WP_STATIC, WP_STATIC, []) : [];
const compassFiles = existsSync(COMPASS_PUBLIC) ? walk(COMPASS_PUBLIC, COMPASS_PUBLIC, []) : [];

// id (basename sans ext) → compass public url, for cross-referencing
const compassById = new Map();
for (const rel of compassFiles) {
  compassById.set(basename(rel, extname(rel)), "/" + rel);
}

const nonCompassIds = new Set(
  [...assetFiles, ...wpFiles].map((rel) => basename(rel, extname(rel))),
);
const entries = [];
const seen = new Set();

for (const rel of assetFiles) {
  const id = basename(rel, extname(rel));
  seen.add(`purupuru-assets:${rel}`);
  entries.push(
    entryFor({
      rel,
      source: "purupuru-assets",
      publicUrl: compassById.get(id) ?? null,
      manifest: assetsManifest,
      nonCompassIds,
    }),
  );
}

for (const rel of wpFiles) {
  const id = basename(rel, extname(rel));
  seen.add(`world-purupuru:${rel}`);
  entries.push(
    entryFor({
      rel,
      source: "world-purupuru",
      publicUrl: compassById.get(id) ?? null,
      manifest: assetsManifest,
      nonCompassIds,
    }),
  );
}

// compass-only assets (no source/deployed twin at the same relative path)
for (const rel of compassFiles) {
  const id = basename(rel, extname(rel));
  if (seen.has(`compass:${rel}`)) continue;
  entries.push(
    entryFor({
      rel,
      source: "compass",
      publicUrl: "/" + rel,
      manifest: assetsManifest,
      nonCompassIds,
    }),
  );
}

entries.sort((a, b) => (a.category + a.id).localeCompare(b.category + b.id));

const header = `/**
 * media-index.generated.ts — AUTO-GENERATED by scripts/scan-media.mjs.
 * Do NOT edit by hand. Re-run the scanner to refresh.
 *
 * The FenceLayer annotation tool's awareness of available media: every curated
 * asset across purupuru-assets, world-purupuru's static library, and compass's
 * public/ dir.
 * Generated ${new Date().toISOString()} · ${entries.length} entries.
 */

import type { MediaEntry } from "./media-types";

export const MEDIA_INDEX: readonly MediaEntry[] = ${JSON.stringify(entries, null, 2)};
`;

writeFileSync(OUT, header);
const summary = {
  entries: entries.length,
  sources: {
    "purupuru-assets": assetFiles.length,
    "world-purupuru": wpFiles.length,
    compass: compassFiles.length,
  },
  output: relative(process.cwd(), OUT),
  consumerLabel: CONSUMER_LABEL,
};

if (EMIT_JSON) console.log(JSON.stringify(summary, null, 2));
else {
  console.log(
    `[scan-media] ${entries.length} entries ` +
      `(${assetFiles.length} purupuru-assets, ${wpFiles.length} world-purupuru, ` +
      `${compassFiles.length} compass) → ${relative(process.cwd(), OUT)}`,
  );
}
