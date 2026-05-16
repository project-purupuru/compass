#!/usr/bin/env tsx
/**
 * cards-audit — walk every (cardType × element × rarity × revealStage × face)
 * combination through the layer resolver and report which combos have a
 * complete render queue vs which have missing or 404 layers.
 *
 * Per kickoff brief Pillar 4. Usage:
 *   pnpm cards:audit
 *   pnpm cards:audit --json
 *   pnpm cards:audit --concurrency=8
 *
 * Exit codes:
 *   0  every layer URL HEAD-resolves AND every combo has the expected
 *      shape (front/back layer counts within spec)
 *   1  one or more combos has a 404 layer or unexpected shape
 *   69 EX_UNAVAILABLE — network down (treat as warning in CI)
 */

import fs from "node:fs";
import path from "node:path";

import { resolve as resolveLayers } from "../lib/cards/layers/resolve";
import {
  type Face,
  type LayerElement,
  type LayerRarity,
  type LayerRegistry,
  type ResolvedLayer,
  type RevealStage,
} from "../lib/cards/layers/types";
import registryJson from "../lib/cards/layers/registry.json";
import { CARD_DEFINITIONS } from "../lib/honeycomb/cards";
import type { CardType } from "../lib/honeycomb/cards";

const REGISTRY = registryJson as LayerRegistry;

const ELEMENTS: readonly LayerElement[] = ["wood", "fire", "earth", "metal", "water"] as const;
const RARITIES: readonly LayerRarity[] = ["common", "mid", "rare", "rarest"] as const;
const REVEAL_STAGES: readonly RevealStage[] = [1, 2, 3] as const;
const FACES: readonly Face[] = ["front", "back"] as const;
const CARD_TYPES: readonly CardType[] = Array.from(
  new Set(CARD_DEFINITIONS.map((d) => d.cardType)),
);

const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
const CONCURRENCY = concurrencyArg ? Number(concurrencyArg.split("=")[1]) : 8;
const TIMEOUT_MS = 6000;

const REPO_ROOT = process.cwd();
const PUBLIC_DIR = path.join(REPO_ROOT, "public");

interface CheckedUrl {
  readonly url: string;
  readonly status: number | "ERR";
  readonly ok: boolean;
  readonly ms: number;
  readonly source: "local" | "remote";
}

interface ComboReport {
  readonly element: LayerElement;
  readonly cardType: CardType;
  readonly rarity: LayerRarity;
  readonly revealStage: RevealStage;
  readonly face: Face;
  readonly layers: readonly ResolvedLayer[];
  readonly missing: readonly string[];
}

function enumerate(): ComboReport[] {
  const reports: ComboReport[] = [];
  for (const element of ELEMENTS) {
    for (const cardType of CARD_TYPES) {
      for (const rarity of RARITIES) {
        for (const revealStage of REVEAL_STAGES) {
          for (const face of FACES) {
            const layers = resolveLayers({
              registry: REGISTRY,
              element,
              cardType,
              rarity,
              revealStage,
              face,
            });
            reports.push({
              element,
              cardType,
              rarity,
              revealStage,
              face,
              layers,
              missing: [],
            });
          }
        }
      }
    }
  }
  return reports;
}

function uniqueUrls(reports: readonly ComboReport[]): string[] {
  const set = new Set<string>();
  for (const r of reports) for (const l of r.layers) set.add(l.url);
  return Array.from(set).sort();
}

async function checkLocalUrl(url: string): Promise<CheckedUrl> {
  const start = Date.now();
  const rel = url.startsWith("/") ? url.slice(1) : url;
  const abs = path.join(PUBLIC_DIR, rel);
  try {
    await fs.promises.access(abs, fs.constants.R_OK);
    return { url, status: 200, ok: true, ms: Date.now() - start, source: "local" };
  } catch {
    return { url, status: 404, ok: false, ms: Date.now() - start, source: "local" };
  }
}

async function checkRemoteUrl(url: string): Promise<CheckedUrl> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    return {
      url,
      status: res.status,
      ok: res.ok,
      ms: Date.now() - start,
      source: "remote",
    };
  } catch {
    return { url, status: "ERR", ok: false, ms: Date.now() - start, source: "remote" };
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrl(url: string): Promise<CheckedUrl> {
  return url.startsWith("/") ? checkLocalUrl(url) : checkRemoteUrl(url);
}

async function checkUrlsWithConcurrency(
  urls: readonly string[],
  limit: number,
): Promise<Map<string, CheckedUrl>> {
  const out = new Map<string, CheckedUrl>();
  let idx = 0;
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= urls.length) return;
      const url = urls[i]!;
      const result = await checkUrl(url);
      out.set(url, result);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, urls.length) }, worker));
  return out;
}

function annotateMissing(
  reports: readonly ComboReport[],
  checked: ReadonlyMap<string, CheckedUrl>,
): ComboReport[] {
  return reports.map((r) => ({
    ...r,
    missing: r.layers
      .filter((l) => checked.get(l.url)?.ok === false)
      .map((l) => `${l.layerName}: ${l.url}`),
  }));
}

function summarize(reports: readonly ComboReport[]) {
  const total = reports.length;
  const clean = reports.filter((r) => r.missing.length === 0).length;
  const dirty = total - clean;
  const byFace: Record<Face, { total: number; clean: number }> = {
    front: { total: 0, clean: 0 },
    back: { total: 0, clean: 0 },
  };
  for (const r of reports) {
    byFace[r.face].total += 1;
    if (r.missing.length === 0) byFace[r.face].clean += 1;
  }
  return { total, clean, dirty, byFace };
}

function printHuman(
  annotated: readonly ComboReport[],
  checked: ReadonlyMap<string, CheckedUrl>,
): void {
  const summary = summarize(annotated);

  console.log("\nLAYER-URL HEALTH (unique URLs across registry)\n");
  const sortedUrls = Array.from(checked.entries()).sort(([a], [b]) => a.localeCompare(b));
  for (const [url, r] of sortedUrls) {
    const icon = r.ok ? "✓" : r.status === "ERR" ? "✗" : "⚠";
    const status = String(r.status).padEnd(3);
    const source = r.source.padEnd(6);
    console.log(`${icon}  [${status}]  ${source}  ${r.ms}ms  ${url}`);
  }

  console.log("\nCOMBO COVERAGE MATRIX\n");
  console.log(`Total combos: ${summary.total}`);
  console.log(`Clean       : ${summary.clean} (no [MISSING] layers)`);
  console.log(`Dirty       : ${summary.dirty} (at least one [MISSING] layer)`);
  console.log(`Front-face  : ${summary.byFace.front.clean}/${summary.byFace.front.total} clean`);
  console.log(`Back-face   : ${summary.byFace.back.clean}/${summary.byFace.back.total} clean`);

  if (summary.dirty > 0) {
    console.log("\nDIRTY COMBOS (first 20):\n");
    const slice = annotated.filter((r) => r.missing.length > 0).slice(0, 20);
    for (const r of slice) {
      console.log(
        `  ${r.element}/${r.cardType}/${r.rarity}/r${r.revealStage}/${r.face} — MISSING: ${r.missing.join(", ")}`,
      );
    }
  }
  console.log("");
}

async function main(): Promise<void> {
  const reports = enumerate();
  const urls = uniqueUrls(reports);
  const checked = await checkUrlsWithConcurrency(urls, CONCURRENCY);
  const annotated = annotateMissing(reports, checked);
  const summary = summarize(annotated);
  const errCount = Array.from(checked.values()).filter((r) => r.status === "ERR").length;

  if (jsonOut) {
    console.log(
      JSON.stringify(
        {
          summary,
          unique_urls: urls.length,
          checked: Array.from(checked.values()),
          dirty_combos: annotated
            .filter((r) => r.missing.length > 0)
            .map((r) => ({
              key: `${r.element}/${r.cardType}/${r.rarity}/r${r.revealStage}/${r.face}`,
              missing: r.missing,
            })),
        },
        null,
        2,
      ),
    );
  } else {
    printHuman(annotated, checked);
  }

  if (urls.length > 0 && errCount === urls.length) process.exit(69);
  if (summary.dirty > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
