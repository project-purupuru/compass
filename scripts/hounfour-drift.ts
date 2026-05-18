/**
 * Drift detection: compare vendored hounfour schemas to upstream main.
 * Per SDD §9.1 (post-BB-004 hardening) · GITHUB_TOKEN auth · 404=red ·
 * diff vs upstream-current-main (NOT vendored-SHA vs upstream-SHA).
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

interface DriftReport {
  schema: string;
  pinnedSha: string;
  diffSummary: string;
  upstreamMainSha?: string;
}

interface DriftFailure {
  schema: string;
  reason: string;
}

async function fetchUpstream(path: string, ref: string): Promise<unknown> {
  const url = `https://api.github.com/repos/0xHoneyJar/loa-hounfour/contents/${path}?ref=${ref}`;
  const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (res.status === 404) {
    throw new Error(`404 · path ${path} at ref ${ref} not found`);
  }
  if (!res.ok) {
    throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { content: string };
  return JSON.parse(Buffer.from(body.content, "base64").toString());
}

function structuralKeys(schema: unknown): string[] {
  if (typeof schema !== "object" || schema === null) return [];
  const obj = schema as Record<string, unknown>;
  const keys: string[] = [];
  if (obj.required) keys.push(...(obj.required as string[]).map((k) => `required:${k}`));
  if (obj.properties) keys.push(...Object.keys(obj.properties as object).map((k) => `prop:${k}`));
  if (obj.type) keys.push(`type:${String(obj.type)}`);
  return keys.sort();
}

function structuralDiff(vendored: unknown, upstream: unknown): { changes: string[] } {
  const vKeys = new Set(structuralKeys(vendored));
  const uKeys = new Set(structuralKeys(upstream));
  const changes: string[] = [];
  for (const k of uKeys) if (!vKeys.has(k)) changes.push(`+ ${k} (upstream added)`);
  for (const k of vKeys) if (!uKeys.has(k)) changes.push(`- ${k} (upstream removed)`);
  return { changes };
}

async function main() {
  const portFiles = readdirSync("lib/domain").filter((f) => f.endsWith(".hounfour-port.ts"));

  const reports: DriftReport[] = [];
  const failures: DriftFailure[] = [];

  for (const file of portFiles) {
    const content = readFileSync(join("lib/domain", file), "utf-8");
    // BB-PR-001 fix: capture the FULL upstream path including `schemas/` prefix,
    // not just the filename. Source header format is
    // `Source: hounfour@<sha>:schemas/<name>.schema.json` and fetchUpstream
    // builds `https://api.github.com/.../contents/<path>` directly.
    const sourceMatch = content.match(/Source: hounfour@([a-f0-9]+):(schemas\/\S+\.schema\.json)/);
    if (!sourceMatch) {
      failures.push({ schema: file, reason: "no Source: header" });
      continue;
    }
    const [, pinnedSha, schemaPath] = sourceMatch;
    if (!pinnedSha || !schemaPath) {
      failures.push({ schema: file, reason: "Source: header malformed" });
      continue;
    }

    try {
      // Verify pinned SHA still resolves (BB-004 hardening 2)
      await fetchUpstream(schemaPath, pinnedSha);
    } catch (e) {
      failures.push({
        schema: file,
        reason: `pinned SHA ${pinnedSha} unreachable: ${(e as Error).message}`,
      });
      continue;
    }

    let upstreamMain: unknown;
    try {
      upstreamMain = await fetchUpstream(schemaPath, "main");
    } catch (e) {
      failures.push({ schema: file, reason: `main fetch failed: ${(e as Error).message}` });
      continue;
    }

    const vendoredFile = `lib/domain/schemas/hounfour-${file.replace(".hounfour-port.ts", ".schema.json")}`;
    if (!existsSync(vendoredFile)) {
      failures.push({ schema: file, reason: `vendored file ${vendoredFile} missing` });
      continue;
    }
    const vendored = JSON.parse(readFileSync(vendoredFile, "utf-8"));

    const diff = structuralDiff(vendored, upstreamMain);
    if (diff.changes.length > 0) {
      reports.push({
        schema: file,
        pinnedSha,
        diffSummary: diff.changes.join("\n"),
      });
    }
  }

  mkdirSync("grimoires/loa/drift-reports", { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = `grimoires/loa/drift-reports/${stamp}.md`;
  let body = `# Hounfour drift report · ${stamp}\n\n`;
  if (failures.length > 0) {
    body += `## Failures (CI red)\n\n`;
    for (const f of failures) body += `- ${f.schema}: ${f.reason}\n`;
    body += `\n`;
  }
  if (reports.length > 0) {
    body += `## Drift detected (vendored vs upstream main)\n\n`;
    for (const r of reports) {
      body += `### ${r.schema}\n\nPinned: \`${r.pinnedSha}\`\n\n\`\`\`\n${r.diffSummary}\n\`\`\`\n\n`;
    }
  }
  if (failures.length === 0 && reports.length === 0) {
    body += `No drift detected. All vendored copies match upstream main.\n`;
  }
  writeFileSync(outPath, body);
  writeFileSync("grimoires/loa/drift-reports/latest.md", body);

  console.log(`Wrote ${outPath}`);
  if (failures.length > 0) {
    console.error(`FAILURES: ${failures.length}`);
    process.exit(1);
  }
  if (reports.length > 0) {
    console.warn(`DRIFT: ${reports.length} schemas drifted from upstream main`);
    process.exit(2);
  }
  console.log("OK: no drift");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
