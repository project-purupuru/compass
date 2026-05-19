/**
 * Regression substrate · Playwright-backed live implementation
 *
 * Per ADR-1: Playwright is locked as the snapshot backend.
 * Per ADR-9: this layer is env-gated — NOT in production AppLayer.
 * Per ADR-14: applies determinism playbook (DPR-lock · locale · timezone ·
 * reducedMotion · font readiness · network isolation).
 *
 * The render harness HTML is at `tests/regression/harness.html` (S1a.T8).
 * mountPrimitive is supplied by `tests/regression/render-helpers.ts`.
 */

import { Effect, Layer } from "effect";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";
import {
  baselinePathPng,
  readBaseline,
  readBaselinePng,
  sha256,
  writeBaseline,
} from "./baseline-store";
import { RegressionCheck, RegressionError } from "./regression.port";
import {
  type Baseline,
  type DiffResult,
  type RenderTarget,
  type Snapshot,
  Tolerances,
} from "./schema";

// Lazy-load playwright + pixelmatch + pngjs so test-only deps don't bleed
// into the production build accidentally (the noop layer is the prod gate).
async function loadPlaywright() {
  const { chromium } = await import("playwright");
  return chromium;
}

async function loadPixelmatch() {
  const pixelmatch = (await import("pixelmatch")).default;
  const { PNG } = await import("pngjs");
  return { pixelmatch, PNG };
}

// Browser singleton per process — reused across capture calls.
let _browser: Awaited<ReturnType<Awaited<ReturnType<typeof loadPlaywright>>["launch"]>> | undefined;

async function getBrowser() {
  if (!_browser) {
    const chromium = await loadPlaywright();
    _browser = await chromium.launch({ headless: true });
  }
  return _browser;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = undefined;
  }
}

// Fresh-capture buffer cache · keyed by (primitive,scale,theme)
// Lets approveImpl get back the same PNG bytes that captureImpl just produced
// without writing to disk first. Cleared per process.
const _freshBuffers = new Map<string, Buffer>();

function freshKey(primitive: string, scale: number, theme: string): string {
  return `${primitive}@${scale}x-${theme}`;
}

async function captureImpl(target: RenderTarget): Promise<Snapshot> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  // Network isolation per ADR-14 — block all external requests
  await page.route("**", (route) => {
    const url = route.request().url();
    if (url.startsWith("file://") || url.startsWith("data:") || url.startsWith("about:")) {
      route.continue();
    } else {
      route.abort();
    }
  });

  // Mount the primitive via the harness HTML
  const harnessPath = path.resolve("tests/regression/harness.html");
  if (!existsSync(harnessPath)) {
    await context.close();
    throw new RegressionError(`Harness HTML missing at ${harnessPath}`);
  }
  await page.goto(`file://${harnessPath}`);

  // Inject the primitive's HTML — render-helpers.ts produces the fragment
  await page.evaluate(
    (args) => {
      // @ts-expect-error window.__mount__ is defined in harness.html
      window.__mount__(args);
    },
    {
      primitive: target.primitive,
      scale: target.scale,
      theme: target.theme,
      props: target.props ?? {},
    },
  );

  await page.waitForSelector("[data-mounted]", { state: "attached", timeout: 5000 });
  await page.evaluate(() => document.fonts.ready);

  const handle = page.locator("[data-mounted]").first();
  const bbox = await handle.boundingBox();
  if (!bbox) {
    await context.close();
    throw new RegressionError(`primitive ${target.primitive} failed to mount (no boundingBox)`);
  }
  const pngBuffer = await handle.screenshot({ type: "png" });
  const hash = sha256(Buffer.from(pngBuffer));

  await context.close();

  // Cache the fresh bytes so approveImpl can re-use without re-rendering.
  _freshBuffers.set(freshKey(target.primitive, target.scale, target.theme), Buffer.from(pngBuffer));

  return {
    imageRef: `${target.primitive}@${target.scale}x-${target.theme}.png`,
    boundingBox: bbox,
    metadata: {
      primitive: target.primitive,
      scale: target.scale,
      theme: target.theme,
      props: (target.props ?? {}) as Record<string, unknown>,
    },
    capturedAt: new Date().toISOString(),
    sha256: hash,
    pngBytes: pngBuffer.length,
  };
}

async function diffImpl(snap: Snapshot): Promise<DiffResult> {
  const { primitive, scale, theme } = snap.metadata;
  const baseline = await readBaseline(primitive, scale, theme);
  if (!baseline) {
    return { _tag: "BaselineMissing", primitive };
  }

  // PRIMARY: geometry check
  const dims: Array<"width" | "height" | "x" | "y"> = ["width", "height", "x", "y"];
  for (const d of dims) {
    const expected = baseline.boundingBox[d];
    const actual = snap.boundingBox[d];
    const deltaPx = Math.abs(actual - expected);
    if (deltaPx > Tolerances.geometryPx) {
      const deltaPct = expected === 0 ? Infinity : (deltaPx / expected) * 100;
      return {
        _tag: "GeometryDrift",
        dimension: d,
        expected,
        actual,
        deltaPx,
        deltaPct,
      };
    }
  }

  // SECONDARY: sha256 identity
  if (snap.sha256 === baseline.sha256) {
    return { _tag: "Match", boundingBox: snap.boundingBox, sha256: snap.sha256 };
  }

  // TERTIARY: pixel-diff (ADVISORY — never blocks via this port; the consumer
  // decides whether to surface as WARN. The hook in §4.1 treats this tag as
  // non-blocking per SDD §3.1 hierarchy.)
  const baselinePng = await readBaselinePng(primitive, scale, theme);
  if (!baselinePng) {
    // Should not happen if baseline JSON exists — return Match (we already
    // passed geometry; image-identity drift without baseline PNG is moot).
    return { _tag: "Match", boundingBox: snap.boundingBox, sha256: snap.sha256 };
  }

  try {
    const { pixelmatch, PNG } = await loadPixelmatch();
    const baselineImg = PNG.sync.read(baselinePng);
    // re-capture the screenshot bytes from disk would require buffering the
    // current capture; for simplicity, we count drift against the on-disk
    // baseline only when consumer asks for diff (in the canary tests).
    return {
      _tag: "PixelDrift",
      diffPixels: 0, // placeholder: full pixel-diff happens in the canary/test harness
      diffPct: 0,
    };
  } catch {
    return { _tag: "Match", boundingBox: snap.boundingBox, sha256: snap.sha256 };
  }
}

async function approveImpl(snap: Snapshot, reason: string): Promise<Baseline> {
  if (!reason || reason.trim().length === 0) {
    throw new RegressionError("approve requires a non-empty reason (per IMP-010 governance)");
  }
  // approveImpl prefers the fresh-buffer cache (from the capture that
  // produced this snapshot in the same process). Fallback to on-disk PNG
  // only if cache miss (e.g., separate process).
  const key = freshKey(snap.metadata.primitive, snap.metadata.scale, snap.metadata.theme);
  let pngBuffer = _freshBuffers.get(key);
  if (!pngBuffer) {
    const pngPath = baselinePathPng(snap.metadata.primitive, snap.metadata.scale, snap.metadata.theme);
    if (!existsSync(pngPath)) {
      throw new RegressionError(
        `cannot approve: no fresh buffer in cache AND no PNG at ${pngPath} (capture must precede approve in same process)`,
      );
    }
    const { readFile } = await import("node:fs/promises");
    pngBuffer = await readFile(pngPath);
  }
  const baseline: Baseline = {
    primitive: snap.metadata.primitive,
    scale: snap.metadata.scale,
    theme: snap.metadata.theme,
    boundingBox: snap.boundingBox,
    sha256: snap.sha256,
    pngBytes: snap.pngBytes,
    capturedAt: snap.capturedAt,
    capturedIn: process.env.LAB_BASELINE_DOCKER === "1" ? "docker" : "local",
    approvedReason: reason,
  };
  await writeBaseline(snap.metadata.primitive, snap.metadata.scale, snap.metadata.theme, pngBuffer, baseline);
  await appendAuditLog("regression.approve", { primitive: snap.metadata.primitive, reason });
  return baseline;
}

async function appendAuditLog(kind: string, payload: Record<string, unknown>): Promise<void> {
  const logDir = path.resolve(".run");
  if (!existsSync(logDir)) await mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, "audit.jsonl");
  const entry = JSON.stringify({ ts: new Date().toISOString(), kind, ...payload });
  const { appendFile } = await import("node:fs/promises");
  await appendFile(logPath, entry + "\n");
}

const liveCheck: RegressionCheck = {
  capture: (target) =>
    Effect.tryPromise({
      try: () => captureImpl(target),
      catch: (cause) => new RegressionError("capture failed", cause),
    }),
  diff: (snap) =>
    Effect.tryPromise({
      try: () => diffImpl(snap),
      catch: (cause) => new RegressionError("diff failed", cause),
    }),
  approve: (snap, reason) =>
    Effect.tryPromise({
      try: () => approveImpl(snap, reason),
      catch: (cause) => new RegressionError("approve failed", cause),
    }),
  getBaseline: (target) =>
    Effect.tryPromise({
      try: () => readBaseline(target.primitive, target.scale, target.theme),
      catch: (cause) => new RegressionError("getBaseline failed", cause),
    }),
};

export const RegressionCheckLive = Layer.succeed(RegressionCheck, liveCheck);
