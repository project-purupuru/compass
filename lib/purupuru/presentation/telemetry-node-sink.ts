/**
 * Node-side telemetry sink — appends JSONL to file.
 *
 * Per PRD r2 FR-26 + AC-13 (bifurcated per orchestrator SKP-001 BLOCKER-870).
 *
 * Use this sink in resolver replay tests, sprint-2/3 unit tests, CI smoke,
 * and any Node-only telemetry consumer. NEVER call from browser code (Next.js
 * client components) — use telemetry-browser-sink.ts instead.
 */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { CardActivationClarity } from "../contracts/types";

const DEFAULT_TRAJECTORY_DIR = "grimoires/loa/a2a/trajectory";

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export interface NodeTelemetrySinkOptions {
  /** Override the trajectory directory (default: grimoires/loa/a2a/trajectory). */
  readonly trajectoryDir?: string;
  /** Override the date stamp used in the file name. */
  readonly dateStamp?: string;
  /** Override the project root (default: process.cwd()). */
  readonly cwd?: string;
}

/**
 * Returns the resolved JSONL trail path for cycle-1 telemetry.
 * Path: {cwd}/{trajectoryDir}/telemetry-cycle-1-{YYYYMMDD}.jsonl
 */
export function resolveTrailPath(opts: NodeTelemetrySinkOptions = {}): string {
  const cwd = opts.cwd ?? process.cwd();
  const dir = opts.trajectoryDir ?? DEFAULT_TRAJECTORY_DIR;
  const stamp = opts.dateStamp ?? todayStamp();
  return resolve(cwd, dir, `telemetry-cycle-1-${stamp}.jsonl`);
}

/**
 * Append one CardActivationClarity event to the cycle-1 JSONL trail.
 * Creates the trajectory directory if it doesn't exist.
 *
 * Per FR-26: ONE event per completed sequence. Do NOT call multiple times
 * for the same sequence run.
 */
export function emitNodeTelemetry(
  event: CardActivationClarity,
  opts: NodeTelemetrySinkOptions = {},
): void {
  const trail = resolveTrailPath(opts);
  const dir = dirname(trail);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const wrapped = {
    eventName: "CardActivationClarity",
    emittedAt: new Date().toISOString(),
    cycle: "purupuru-cycle-1-wood-vertical-2026-05-13",
    ...event,
  };
  appendFileSync(trail, `${JSON.stringify(wrapped)}\n`);
}
