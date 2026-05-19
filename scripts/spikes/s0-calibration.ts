/**
 * S0 Calibration Spike — Playwright + Docker delta-check
 *
 * Validates that the regression substrate's snapshot backend (Playwright)
 * produces identical output for a known fixture across:
 *   - local execution (developer machine: macOS likely)
 *   - Docker execution (Linux container, matches CI)
 *
 * Per cycle-1 doctrine (CLAUDE.md §"Calibration spike"): this script lives
 * for one half-day, surfaces integration costs before S1a commits, and
 * SELF-DELETES post-audit (S0.T7 / FR-0 contract).
 *
 * Self-deletion: this file MUST be removed after S0 closes. The
 * `s0-calibration-report.md` artifact stays on record.
 *
 * Invocation:
 *   pnpm exec tsx scripts/spikes/s0-calibration.ts --mode local
 *   pnpm exec tsx scripts/spikes/s0-calibration.ts --mode docker
 *   pnpm exec tsx scripts/spikes/s0-calibration.ts --mode diff
 */

import { chromium, type Browser } from "playwright";
import { createHash } from "node:crypto";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("spike-output");
const FIXTURE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>S0 Fixture</title>
<style>
  html, body { margin: 0; padding: 0; background: #1a1a1a; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .fixture {
    width: 100px;
    height: 50px;
    background: #ffaa00;
    border: 2px solid #ffffff;
    box-sizing: border-box;
    border-radius: 4px;
    color: #000;
    font-family: -apple-system, "Segoe UI", sans-serif;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Fonts may differ across OS — geometry MUST stay identical */
  }
</style>
</head>
<body>
  <div class="fixture" data-mounted>S0 fixture</div>
</body>
</html>`;

type CaptureResult = {
  mode: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  pngSha256: string;
  pngBytes: number;
  durationMs: number;
  capturedAt: string;
};

async function capture(mode: "local" | "docker"): Promise<CaptureResult> {
  const t0 = Date.now();
  await mkdir(OUT_DIR, { recursive: true });
  const htmlPath = path.join(OUT_DIR, "fixture.html");
  await writeFile(htmlPath, FIXTURE_HTML, "utf8");

  const browser: Browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("file://" + htmlPath);
  await page.waitForSelector("[data-mounted]");
  await page.evaluate(() => document.fonts.ready);

  const handle = page.locator("[data-mounted]").first();
  const boundingBox = (await handle.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
  const pngBuffer = await handle.screenshot({ type: "png" });
  const pngSha256 = createHash("sha256").update(pngBuffer).digest("hex");

  await browser.close();

  const result: CaptureResult = {
    mode,
    boundingBox,
    pngSha256,
    pngBytes: pngBuffer.length,
    durationMs: Date.now() - t0,
    capturedAt: new Date().toISOString(),
  };

  const pngPath = path.join(OUT_DIR, `${mode}-fixture.png`);
  const jsonPath = path.join(OUT_DIR, `${mode}-fixture.json`);
  await writeFile(pngPath, pngBuffer);
  await writeFile(jsonPath, JSON.stringify(result, null, 2));

  console.log(`[${mode}] captured: ${pngPath}`);
  console.log(`[${mode}] boundingBox: ${JSON.stringify(boundingBox)}`);
  console.log(`[${mode}] sha256: ${pngSha256}`);
  console.log(`[${mode}] bytes: ${pngBuffer.length}, duration: ${result.durationMs}ms`);

  return result;
}

async function diff(): Promise<void> {
  const localPath = path.join(OUT_DIR, "local-fixture.json");
  const dockerPath = path.join(OUT_DIR, "docker-fixture.json");

  if (!existsSync(localPath) || !existsSync(dockerPath)) {
    console.error("Need both local-fixture.json and docker-fixture.json. Run --mode local then --mode docker first.");
    process.exit(1);
  }

  const local: CaptureResult = JSON.parse(await readFile(localPath, "utf8"));
  const docker: CaptureResult = JSON.parse(await readFile(dockerPath, "utf8"));

  const geomMatch =
    local.boundingBox.width === docker.boundingBox.width &&
    local.boundingBox.height === docker.boundingBox.height &&
    local.boundingBox.x === docker.boundingBox.x &&
    local.boundingBox.y === docker.boundingBox.y;

  const pngIdentical = local.pngSha256 === docker.pngSha256;

  let pixelDeltaPx = 0;
  if (!pngIdentical) {
    try {
      const pixelmatch = (await import("pixelmatch")).default;
      const { PNG } = await import("pngjs");
      const localBuf = await readFile(path.join(OUT_DIR, "local-fixture.png"));
      const dockerBuf = await readFile(path.join(OUT_DIR, "docker-fixture.png"));
      const localPng = PNG.sync.read(localBuf);
      const dockerPng = PNG.sync.read(dockerBuf);
      if (localPng.width === dockerPng.width && localPng.height === dockerPng.height) {
        const diffPng = new PNG({ width: localPng.width, height: localPng.height });
        pixelDeltaPx = pixelmatch(
          localPng.data,
          dockerPng.data,
          diffPng.data,
          localPng.width,
          localPng.height,
          { threshold: 0.1 },
        );
        await writeFile(path.join(OUT_DIR, "diff-fixture.png"), PNG.sync.write(diffPng));
      } else {
        pixelDeltaPx = -1;
        console.error("Cannot pixel-diff: image dimensions differ.");
      }
    } catch (err) {
      console.error("pixelmatch unavailable:", err);
    }
  }

  const report = {
    geometryMatch: geomMatch,
    pngIdentical,
    pixelDeltaPx,
    local: { boundingBox: local.boundingBox, sha256: local.pngSha256, bytes: local.pngBytes },
    docker: { boundingBox: docker.boundingBox, sha256: docker.pngSha256, bytes: docker.pngBytes },
    verdict:
      geomMatch && pngIdentical
        ? "PASS — local and docker identical"
        : geomMatch && pixelDeltaPx >= 0 && pixelDeltaPx < 100
          ? "PASS_ADVISORY — geometry identical, pixel diff < 100 (acceptable, see ADR-8)"
          : geomMatch
            ? "GEOMETRY_OK_PIXEL_DRIFT — geometry identical; pixel drift > 100 (review)"
            : "FAIL — geometry mismatch (ADR-1 backend revision required)",
  };

  const reportPath = path.join(OUT_DIR, "delta-report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log("\n=== S0 Calibration Delta Report ===");
  console.log(`Geometry match: ${report.geometryMatch}`);
  console.log(`PNG identical : ${report.pngIdentical}`);
  console.log(`Pixel delta   : ${report.pixelDeltaPx} pixels`);
  console.log(`Verdict       : ${report.verdict}`);
  console.log(`Report        : ${reportPath}`);
}

async function main() {
  const mode = process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1]
    ?? process.argv[process.argv.indexOf("--mode") + 1];

  if (mode === "local" || mode === "docker") {
    await capture(mode);
  } else if (mode === "diff") {
    await diff();
  } else {
    console.error("Usage: s0-calibration.ts --mode <local|docker|diff>");
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("S0 calibration spike failed:", err);
  process.exit(1);
});
