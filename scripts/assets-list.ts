#!/usr/bin/env tsx
/**
 * assets-list — query the asset manifest + layer registry from the CLI.
 *
 * Per kickoff brief Pillar 4. Usage:
 *   pnpm assets:list --filter card        # only card-class manifest entries
 *   pnpm assets:list --filter layer       # only layer-registry-resolved paths
 *   pnpm assets:list --missing            # only registered-but-404 entries
 *   pnpm assets:list --orphan             # only files-on-disk-not-in-registry (under public/art/cards/)
 *   pnpm assets:list --json               # JSON output
 *
 * Exit codes:
 *   0  query succeeded, results below
 *   1  --missing returned non-zero entries (uses HEAD on remote, fs.access on local)
 *   2  --orphan returned non-zero entries
 */

import fs from "node:fs";
import path from "node:path";

import { MANIFEST, type AssetClass, type AssetRecord } from "../lib/assets/manifest";
import { resolve as resolveLayers } from "../lib/cards/layers/resolve";
import {
  type Face,
  type LayerElement,
  type LayerRarity,
  type LayerRegistry,
  type RevealStage,
} from "../lib/cards/layers/types";
import registryJson from "../lib/cards/layers/registry.json";
import { CARD_DEFINITIONS } from "../lib/honeycomb/cards";
import type { CardType } from "../lib/honeycomb/cards";

const REGISTRY = registryJson as LayerRegistry;

const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const filterArg = args.find((a) => a.startsWith("--filter="));
const filterVal = filterArg ? filterArg.split("=")[1] : args[args.indexOf("--filter") + 1];
const showMissing = args.includes("--missing");
const showOrphan = args.includes("--orphan");

const REPO_ROOT = process.cwd();
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const TIMEOUT_MS = 6000;
const ELEMENTS: readonly LayerElement[] = ["wood", "fire", "earth", "metal", "water", "harmony"] as const;
const RARITIES: readonly LayerRarity[] = ["common", "mid", "rare", "rarest"] as const;
const REVEAL_STAGES: readonly RevealStage[] = [1, 2, 3] as const;
const FACES: readonly Face[] = ["front", "back"] as const;
/** Hits all four resonance buckets (dormant/awakening/resonant/harmonized). */
const RESONANCE_PROBE: readonly number[] = [10, 35, 60, 90] as const;

function allLayerUrls(): string[] {
  const set = new Set<string>();
  const cardTypes = Array.from(new Set(CARD_DEFINITIONS.map((d) => d.cardType)));
  for (const element of ELEMENTS) {
    for (const cardType of cardTypes) {
      for (const rarity of RARITIES) {
        for (const revealStage of REVEAL_STAGES) {
          for (const face of FACES) {
            for (const resonance of RESONANCE_PROBE) {
              for (const layer of resolveLayers({
                registry: REGISTRY,
                element,
                cardType: cardType as CardType,
                rarity,
                revealStage,
                face,
                resonance,
              })) {
                set.add(layer.url);
              }
            }
          }
        }
      }
    }
  }
  return Array.from(set).sort();
}

interface LayerRowOut {
  readonly url: string;
  readonly source: "local" | "remote";
}

function layerRows(): LayerRowOut[] {
  return allLayerUrls().map((url) => ({
    url,
    source: url.startsWith("/") ? ("local" as const) : ("remote" as const),
  }));
}

interface ManifestRowOut extends AssetRecord {
  readonly source: "local" | "remote";
}

function filterManifest(filter: string | undefined): ManifestRowOut[] {
  const rows = MANIFEST.filter((r) => !filter || r.class === (filter as AssetClass));
  return rows.map((r) => ({
    ...r,
    source: r.localOnly || r.url.startsWith("/") ? ("local" as const) : ("remote" as const),
  }));
}

async function headRemote(url: string): Promise<{ url: string; ok: boolean; status: number | "ERR" }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    return { url, ok: res.ok, status: res.status };
  } catch {
    return { url, ok: false, status: "ERR" };
  } finally {
    clearTimeout(timer);
  }
}

async function checkLocal(url: string): Promise<{ url: string; ok: boolean; status: number | "ERR" }> {
  const rel = url.startsWith("/") ? url.slice(1) : url;
  const abs = path.join(PUBLIC_DIR, rel);
  try {
    await fs.promises.access(abs, fs.constants.R_OK);
    return { url, ok: true, status: 200 };
  } catch {
    return { url, ok: false, status: 404 };
  }
}

async function findMissing(): Promise<Array<{ url: string; status: number | "ERR"; from: string }>> {
  const out: Array<{ url: string; status: number | "ERR"; from: string }> = [];

  for (const r of MANIFEST) {
    if (r.localOnly || r.url.startsWith("/")) {
      const check = await checkLocal(r.url);
      if (!check.ok && !r.expectedBroken) out.push({ url: r.url, status: check.status, from: `manifest:${r.id}` });
    } else {
      const check = await headRemote(r.url);
      if (!check.ok && !r.expectedBroken) out.push({ url: r.url, status: check.status, from: `manifest:${r.id}` });
    }
  }

  for (const url of allLayerUrls()) {
    if (url.startsWith("/")) {
      const check = await checkLocal(url);
      if (!check.ok) out.push({ url, status: check.status, from: "layer-registry" });
    } else {
      const check = await headRemote(url);
      if (!check.ok) out.push({ url, status: check.status, from: "layer-registry" });
    }
  }

  return out;
}

function walkLocalArtTree(rootRel: string): string[] {
  const out: string[] = [];
  const root = path.join(PUBLIC_DIR, rootRel);
  if (!fs.existsSync(root)) return out;
  function recurse(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) recurse(full);
      else if (entry.isFile()) {
        out.push("/" + path.relative(PUBLIC_DIR, full).replace(/\\/g, "/"));
      }
    }
  }
  recurse(root);
  return out.sort();
}

function findOrphans(): string[] {
  const onDisk = new Set(walkLocalArtTree("art/cards"));
  const expected = new Set<string>();
  for (const url of allLayerUrls()) {
    if (url.startsWith("/art/cards/")) expected.add(url);
  }
  for (const r of MANIFEST) {
    if (r.url.startsWith("/art/cards/")) expected.add(r.url);
  }
  return Array.from(onDisk).filter((p) => !expected.has(p)).sort();
}

async function main(): Promise<void> {
  if (showMissing) {
    const missing = await findMissing();
    if (jsonOut) console.log(JSON.stringify({ missing }, null, 2));
    else {
      if (missing.length === 0) console.log("No missing entries. ✓");
      else {
        console.log(`\nMISSING (${missing.length}):\n`);
        for (const m of missing) console.log(`  [${m.status}]  ${m.from.padEnd(30)}  ${m.url}`);
        console.log("");
      }
    }
    process.exit(missing.length > 0 ? 1 : 0);
  }

  if (showOrphan) {
    const orphans = findOrphans();
    if (jsonOut) console.log(JSON.stringify({ orphans }, null, 2));
    else {
      if (orphans.length === 0) console.log("No orphans under public/art/cards/. ✓");
      else {
        console.log(`\nORPHANS under public/art/cards/ (${orphans.length}):\n`);
        for (const o of orphans) console.log(`  ${o}`);
        console.log("");
      }
    }
    process.exit(orphans.length > 0 ? 2 : 0);
  }

  if (filterVal === "layer") {
    const rows = layerRows();
    if (jsonOut) console.log(JSON.stringify({ layers: rows }, null, 2));
    else {
      console.log(`\nLAYER-REGISTRY URLS (${rows.length} unique):\n`);
      for (const r of rows) console.log(`  ${r.source.padEnd(6)}  ${r.url}`);
      console.log("");
    }
    process.exit(0);
  }

  const rows = filterManifest(filterVal);
  if (jsonOut) console.log(JSON.stringify({ assets: rows }, null, 2));
  else {
    const heading = filterVal ? `MANIFEST (${filterVal}, ${rows.length})` : `MANIFEST (all, ${rows.length})`;
    console.log(`\n${heading}:\n`);
    for (const r of rows) {
      const dims = r.dimensions ? `${r.dimensions.w}×${r.dimensions.h}` : "—";
      console.log(`  ${r.source.padEnd(6)}  ${r.class.padEnd(10)}  ${dims.padEnd(10)}  ${r.id.padEnd(28)}  ${r.url}`);
    }
    console.log("");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
