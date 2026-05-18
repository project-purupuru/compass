#!/usr/bin/env node
/**
 * assert-lighthouse.mjs — parses Lighthouse JSON output and asserts
 * AC-15 thresholds. Per SDD §9.1.
 *
 * Usage: node scripts/assert-lighthouse.mjs ./lh.json
 *
 * Exits non-zero with diagnostic on threshold breach.
 */

import { readFileSync } from "node:fs";
import { argv, exit } from "node:process";

const THRESHOLDS = {
  performance: 0.8, // Performance score >= 0.8 (80/100)
  lcp_ms: 2500, // LCP < 2.5s
  inp_ms: 200, // INP < 200ms
  cls: 0.1, // CLS < 0.1
};

const path = argv[2];
if (!path) {
  console.error("usage: node scripts/assert-lighthouse.mjs <lighthouse-output.json>");
  exit(2);
}

const raw = readFileSync(path, "utf-8");
const report = JSON.parse(raw);

const score = report.categories?.performance?.score ?? 0;
const audits = report.audits ?? {};
const lcp = audits["largest-contentful-paint"]?.numericValue ?? Infinity;
const inp = audits["interaction-to-next-paint"]?.numericValue ?? Infinity;
const cls = audits["cumulative-layout-shift"]?.numericValue ?? Infinity;

const failures = [];
if (score < THRESHOLDS.performance) {
  failures.push(`Performance score ${(score * 100).toFixed(0)} < ${THRESHOLDS.performance * 100}`);
}
if (lcp >= THRESHOLDS.lcp_ms) {
  failures.push(`LCP ${lcp.toFixed(0)}ms >= ${THRESHOLDS.lcp_ms}ms`);
}
if (inp >= THRESHOLDS.inp_ms) {
  failures.push(`INP ${inp.toFixed(0)}ms >= ${THRESHOLDS.inp_ms}ms`);
}
if (cls >= THRESHOLDS.cls) {
  failures.push(`CLS ${cls.toFixed(3)} >= ${THRESHOLDS.cls}`);
}

if (failures.length > 0) {
  console.error("[lighthouse-assert] FAIL");
  for (const f of failures) console.error(`  · ${f}`);
  exit(1);
}

console.log(
  `[lighthouse-assert] OK · Performance ${(score * 100).toFixed(0)} · LCP ${lcp.toFixed(0)}ms · INP ${inp.toFixed(0)}ms · CLS ${cls.toFixed(3)}`,
);
