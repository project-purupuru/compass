#!/usr/bin/env tsx
/**
 * check-assets — HEAD every asset url in lib/assets/manifest.ts and exit
 * non-zero on any 4xx/5xx response. Run via `pnpm assets:check`.
 *
 * Usage:
 *   pnpm assets:check                # full audit, fail on any bad path
 *   pnpm assets:check --json         # JSON output (for CI parsing)
 *   pnpm assets:check --concurrency=4 # tune parallelism (default 8)
 *
 * Exit codes:
 *   0  all green
 *   1  one or more 4xx/5xx
 *   69 EX_UNAVAILABLE — network down, treat as warning in CI
 */

import { MANIFEST, type AssetRecord } from "../lib/assets/manifest";

interface CheckResult {
  readonly id: string;
  readonly url: string;
  readonly status: number | "ERR";
  readonly ok: boolean;
  readonly ms: number;
  readonly error?: string;
}

const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
const CONCURRENCY = concurrencyArg ? Number(concurrencyArg.split("=")[1]) : 8;
const TIMEOUT_MS = 8000;

async function checkOne(rec: AssetRecord): Promise<CheckResult> {
  if (rec.localOnly) {
    return { id: rec.id, url: rec.url, status: 200, ok: true, ms: 0 };
  }
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(rec.url, { method: "HEAD", signal: controller.signal });
    return {
      id: rec.id,
      url: rec.url,
      status: res.status,
      ok: res.ok,
      ms: Date.now() - start,
    };
  } catch (e) {
    return {
      id: rec.id,
      url: rec.url,
      status: "ERR",
      ok: false,
      ms: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runWithConcurrency(
  items: readonly AssetRecord[],
  limit: number,
): Promise<CheckResult[]> {
  const out: CheckResult[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      out[i] = await checkOne(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function main(): Promise<void> {
  const results = await runWithConcurrency(MANIFEST, CONCURRENCY);

  const recordById = new Map(MANIFEST.map((r) => [r.id, r] as const));
  // Bad = NEW breakage. expectedBroken entries are reported separately.
  const bad = results.filter((r) => !r.ok && !recordById.get(r.id)?.expectedBroken);
  const expected = results.filter((r) => !r.ok && recordById.get(r.id)?.expectedBroken);
  const networkErrors = results.filter((r) => r.status === "ERR");

  if (jsonOut) {
    console.log(
      JSON.stringify(
        {
          total: results.length,
          good: results.length - bad.length,
          bad: bad.length,
          networkErrors: networkErrors.length,
          results,
        },
        null,
        2,
      ),
    );
  } else {
    for (const r of results) {
      const isExpected = recordById.get(r.id)?.expectedBroken && !r.ok;
      const icon = r.ok ? "✓" : isExpected ? "·" : r.status === "ERR" ? "✗" : "⚠";
      const note = isExpected ? " [expected-broken, fallback ok]" : "";
      console.log(
        `${icon}  [${String(r.status).padEnd(3)}]  ${r.id.padEnd(28)}  ${r.ms}ms  ${r.url}${r.error ? ` (${r.error})` : ""}${note}`,
      );
    }
    console.log("");
    console.log(
      `${results.length} assets · ${results.length - bad.length - expected.length} good · ${bad.length} bad · ${expected.length} expected-broken · ${networkErrors.length} net errors`,
    );
  }

  if (networkErrors.length === results.length) process.exit(69); // EX_UNAVAILABLE
  if (bad.length > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
