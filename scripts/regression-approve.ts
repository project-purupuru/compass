/**
 * pnpm regression:approve — capture and approve a new baseline.
 *
 * REQUIRES --reason flag (per IMP-010 governance). Audits to .run/audit.jsonl.
 *
 * Usage:
 *   pnpm regression:approve --primitive static-fixture --scale 1 --theme dark --reason "initial baseline"
 *
 * Per ADR-8: production baselines SHOULD be captured inside Docker via:
 *   docker run --rm -v "$(pwd):/work" -w /work lab-snapshot-baseline \
 *     pnpm regression:approve --primitive ... --reason ...
 *
 * Sets LAB_BASELINE_DOCKER=1 inside the container so the baseline's
 * `capturedIn` field correctly records origin.
 */

import { captureBaseline } from "../tests/regression/render-helpers";
import type { RenderTarget } from "../lib/regression/schema";

function parseArgs(): {
  primitive: string;
  scale: 0.5 | 1 | 2;
  theme: "light" | "dark";
  reason: string;
} {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.findIndex((a) => a === flag || a.startsWith(flag + "="));
    if (idx === -1) return undefined;
    const a = args[idx];
    if (a.includes("=")) return a.split("=")[1];
    return args[idx + 1];
  };
  const primitive = get("--primitive");
  const reason = get("--reason");
  if (!primitive) {
    console.error("error: --primitive is required");
    process.exit(2);
  }
  if (!reason || reason.trim().length === 0) {
    console.error("error: --reason is required (per IMP-010 governance)");
    process.exit(2);
  }
  const scaleStr = get("--scale") ?? "1";
  const scale = Number.parseFloat(scaleStr) as 0.5 | 1 | 2;
  const theme = (get("--theme") ?? "dark") as "light" | "dark";
  return { primitive, scale, theme, reason };
}

async function main() {
  const { primitive, scale, theme, reason } = parseArgs();
  const target: RenderTarget = { primitive, scale, theme };
  const { snap } = await captureBaseline(target, reason);
  console.log(
    JSON.stringify(
      {
        action: "approved",
        primitive: snap.metadata.primitive,
        scale: snap.metadata.scale,
        theme: snap.metadata.theme,
        boundingBox: snap.boundingBox,
        sha256: snap.sha256,
        reason,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("regression:approve failed:", err);
  process.exit(1);
});
