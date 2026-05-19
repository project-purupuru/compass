/**
 * pnpm regression:check — invoke regression diff against a target.
 *
 * Usage:
 *   pnpm regression:check --primitive static-fixture --scale 1 --theme dark
 *   pnpm regression:check --primitives "CodexCardFace,CardComposition,HexScene"
 *
 * Outputs JSON diff result(s) to stdout. Exit codes:
 *   0  Match (all targets)
 *   1  Drift detected on at least one target
 *   2  BaselineMissing on at least one target
 *   3  Runtime error
 */

import { runRegressionCheck } from "../tests/regression/render-helpers";
import type { DiffResult, RenderTarget } from "../lib/regression/schema";

function parseArgs(): {
  primitives: string[];
  scale: 0.5 | 1 | 2;
  theme: "light" | "dark";
  failOnAdvisory: boolean;
} {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.findIndex((a) => a === flag || a.startsWith(flag + "="));
    if (idx === -1) return undefined;
    const a = args[idx];
    if (a.includes("=")) return a.split("=")[1];
    return args[idx + 1];
  };
  const primitiveSingle = get("--primitive");
  const primitivesMulti = get("--primitives");
  const primitives = primitivesMulti
    ? primitivesMulti.split(",").map((p) => p.trim()).filter(Boolean)
    : primitiveSingle
      ? [primitiveSingle]
      : ["static-fixture"];
  const scaleStr = get("--scale") ?? "1";
  const scale = (Number.parseFloat(scaleStr) as 0.5 | 1 | 2);
  const theme = (get("--theme") ?? "dark") as "light" | "dark";
  const failOnAdvisory = args.includes("--fail-on-advisory");
  return { primitives, scale, theme, failOnAdvisory };
}

async function main() {
  const { primitives, scale, theme, failOnAdvisory } = parseArgs();
  let worst: "match" | "advisory" | "drift" | "missing" | "error" = "match";
  const results: Array<{ primitive: string; result: DiffResult }> = [];

  for (const primitive of primitives) {
    const target: RenderTarget = { primitive, scale, theme };
    try {
      const result = await runRegressionCheck(target);
      results.push({ primitive, result });
      switch (result._tag) {
        case "Match":
          break;
        case "PixelDrift":
          if (worst === "match") worst = "advisory";
          break;
        case "GeometryDrift":
          worst = "drift";
          break;
        case "BaselineMissing":
          if (worst === "match" || worst === "advisory") worst = "missing";
          break;
      }
    } catch (err) {
      results.push({
        primitive,
        result: { _tag: "GeometryDrift", dimension: "width", expected: 0, actual: 0, deltaPx: 0, deltaPct: 0 },
      });
      worst = "error";
      console.error(`[regression:check] error on ${primitive}:`, err);
    }
  }

  console.log(JSON.stringify({ results, worst }, null, 2));

  // Exit code policy:
  //   GeometryDrift → 1 (BLOCKS · primary gate)
  //   BaselineMissing → 2
  //   PixelDrift → 0 (ADVISORY · never blocks) unless --fail-on-advisory
  //   error → 3
  if (worst === "error") process.exit(3);
  if (worst === "drift") process.exit(1);
  if (worst === "missing") process.exit(2);
  if (worst === "advisory" && failOnAdvisory) process.exit(1);
  process.exit(0);
}

main();
