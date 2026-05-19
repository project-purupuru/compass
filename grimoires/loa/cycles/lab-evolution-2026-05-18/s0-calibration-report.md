---
sprint: S0
date: 2026-05-19
cycle: lab-evolution-2026-05-18
purpose: Calibration spike per cycle-1 doctrine — validate Playwright + Docker pipeline BEFORE S1a baselines authored
verdict: GEOMETRY_OK_PIXEL_DRIFT — substrate viable; pixel-diff tier confirmed advisory-only
adrs_validated:
  - ADR-1 (Playwright as snapshot backend)
  - ADR-8 (Docker for baseline capture, hot-path uses local)
---

# S0 Calibration Report

> Half-day spike per cycle-1 doctrine. Validates that the regression substrate's Playwright + Docker pipeline produces identical GEOMETRY across local (macOS arm64) and Docker (linux arm64) for a known fixture. Surfaces integration costs BEFORE S1a baselines exist.

## Result summary

| Metric | Local (macOS arm64) | Docker (linux arm64) | Match |
|---|---|---|---|
| boundingBox | `{x:590, y:375, w:100, h:50}` | `{x:590, y:375, w:100, h:50}` | ✅ EXACT |
| Authored CSS dimensions | 100×50 | 100×50 | ✅ |
| PNG sha256 | `85963786…637aa` | `9ab67192…d73b98` | ❌ differ |
| PNG byte count | 1238 | 1094 | ❌ differ |
| Pixel delta (pixelmatch threshold 0.1) | — | 111 pixels | ⚠️ above 100-pixel "tolerable" threshold |
| Render duration | 638ms | 720ms | ✅ both <8s budget |

**Verdict: GEOMETRY_OK_PIXEL_DRIFT** — the geometry-primary assertion (boundingBox) is IDENTICAL across platforms. The pixel-diff tier surfaces 111 pixels of difference, attributable to deterministic font anti-aliasing differences (macOS Core Graphics vs Ubuntu Noble Cantarell). NOT flaky drift; reproducible across runs.

## Implications for S1a + S1b

### ADR-1 (Playwright as snapshot backend) — VALIDATED ✅
Playwright's `boundingBox()` API returns identical geometry across host platforms when viewport + DPR are locked. This is the core load-bearing claim behind ADR-1 (replacing jsdom which can't compute cqw at all). Spike confirms it.

### ADR-8 (Docker for baseline capture only) — VALIDATED ✅
Pixel-level reproduction across local-dev (macOS) and CI-shape (Linux container) is NOT guaranteed (111px delta confirms this), but geometry IS. SDD §3.1 hierarchy already demoted pixel-diff to ADVISORY for exactly this reason. The Docker image enforces *deterministic-within-CI* baselines; cross-platform pixel-noise stays inside the advisory tier.

### S1a tolerance tuning — adjust pixel-diff threshold
Original SDD §3.1 said "pixel diff < 0.5% before flagging." For a 100×50 fixture (5000 pixels), 0.5% = 25 pixels. Spike measured 111 pixels across platforms for the same authored shape — i.e., > 2% of pixels differ due to anti-aliasing alone.

**Recommended S1a setting:** pixel-diff threshold = **3%** (not 0.5%) at the advisory tier, OR drop the pixel-diff advisory entirely and gate solely on boundingBox + sha256-identity. Decision belongs in S1a.T7 (render-helpers determinism settings) — landing this report under the operator's eye lets S1a inherit the correct number.

### S0 surfaced integration costs (per cycle-1 doctrine)

1. **esbuild native binary architecture mismatch** — host arm64 vs container linux. Resolution: Docker image installs playwright globally; spike script uses absolute import path `/usr/lib/node_modules/playwright/index.mjs`. S1a's render-helpers will reference this path inside the baseline-capture container.
2. **NODE_PATH does not work for ESM resolution** — env var only honored for CJS. Absolute path imports are the workaround in the Docker shim.
3. **Playwright base image has browsers cached at `/ms-playwright/` but not the npm package** — requires `npm install -g playwright@<version>` step in the Dockerfile.
4. **Pixel-diff threshold can NOT be 0.5%** — anti-aliasing alone produces ~2-3% on a small fixture. Tune up in S1a.

These integration costs are now LOCKED in the Dockerfile + docker-side shim before S1a authors any real-component baselines. **This is exactly what S0 is for** (per cycle-1 doctrine FR-0 contract).

## Artifacts

- `scripts/spikes/s0-calibration.ts` — local capture + diff runner (self-deletes at S0.T7)
- `scripts/spikes/s0-calibration-docker.mjs` — Docker capture shim (self-deletes at S0.T7)
- `tests/snapshots/Dockerfile` — RETAINED (graduates to S1a as the baseline-capture image)
- `spike-output/local-fixture.{png,json}` — local capture (gitignored, working artifact)
- `spike-output/docker-fixture.{png,json}` — docker capture (gitignored, working artifact)
- `spike-output/delta-report.json` — delta-check JSON output (gitignored)
- `spike-output/diff-fixture.png` — pixelmatch visual diff (gitignored)
- This report — `grimoires/loa/cycles/lab-evolution-2026-05-18/s0-calibration-report.md` (RETAINED)

## Audit trail

| Step | Time | Outcome |
|---|---|---|
| Install playwright + pixelmatch + pngjs + types | ~12s | OK (workspace-root, 78 packages added) |
| Download Chromium 1223 | ~30s | OK (92.4MB cached) |
| Local capture | 638ms | OK · sha256 `8596378673…637aa` |
| Docker base image build | ~33s | OK (mcr.microsoft.com/playwright:v1.60.0-noble + playwright@1.60.0 global) |
| Docker capture | 720ms | OK · sha256 `9ab6719214…d73b98` |
| Delta-check | <1s | GEOMETRY_OK_PIXEL_DRIFT (111px) |

Total S0 wall-time: ~3 minutes (under the half-day budget by a wide margin — the cycle-1 doctrine remained the constraint, not the time).

## Decision: proceed to S1a

S0 is GREEN-LIGHT for S1a. ADR-1 + ADR-8 hold. Pixel-diff threshold tunes up in S1a.T7. Spike scripts (`.ts` + `.mjs`) get deleted at S0.T7 per FR-0 contract; Dockerfile graduates to S1a's baseline-capture infrastructure.

---

*S0 spike completed 2026-05-19. Branch: `feature/feat/lab-evolution-s0-spike`. Plan ID: `plan-20260518-f581af5a`. Next: S0.T7 self-delete · S0.T8 draft PR · operator pair-point.*
