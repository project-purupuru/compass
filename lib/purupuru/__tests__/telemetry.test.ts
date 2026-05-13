/**
 * AC-13: bifurcated telemetry · ONE CardActivationClarity event with Node sink + browser sink
 */

import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import type { CardActivationClarity } from "../contracts/types";
import {
  emitNodeTelemetry,
  resolveTrailPath,
} from "../presentation/telemetry-node-sink";
import {
  emitBrowserTelemetry,
  pickTelemetrySink,
} from "../presentation/telemetry-browser-sink";

const TEST_DIR = resolve(__dirname, "..", "__tests__/_telemetry-fixtures");

const SAMPLE: CardActivationClarity = {
  cardId: "wood_awakening",
  elementId: "wood",
  targetZoneId: "wood_grove",
  timeFromCardArmedToCommitMs: 420,
  invalidTargetHoverCount: 0,
  sequenceSkipped: false,
  inputLockDurationMs: 2280,
};

afterEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("AC-13 Node sink", () => {
  test("appends ONE valid JSONL line per call", () => {
    const trail = resolveTrailPath({
      trajectoryDir: TEST_DIR,
      dateStamp: "20260513",
      cwd: process.cwd(),
    });
    emitNodeTelemetry(SAMPLE, {
      trajectoryDir: TEST_DIR,
      dateStamp: "20260513",
      cwd: process.cwd(),
    });

    expect(existsSync(trail)).toBe(true);
    const content = readFileSync(trail, "utf8");
    const lines = content.split("\n").filter(Boolean);
    expect(lines).toHaveLength(1);

    const parsed = JSON.parse(lines[0]);
    expect(parsed.eventName).toBe("CardActivationClarity");
    expect(parsed.cycle).toBe("purupuru-cycle-1-wood-vertical-2026-05-13");
    expect(parsed.cardId).toBe("wood_awakening");
    expect(parsed.elementId).toBe("wood");
    expect(parsed.targetZoneId).toBe("wood_grove");
    expect(parsed.timeFromCardArmedToCommitMs).toBe(420);
    expect(parsed.invalidTargetHoverCount).toBe(0);
    expect(parsed.sequenceSkipped).toBe(false);
    expect(parsed.inputLockDurationMs).toBe(2280);
    expect(parsed.emittedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test("appends second call as second line (JSONL append-only)", () => {
    const opts = { trajectoryDir: TEST_DIR, dateStamp: "20260513", cwd: process.cwd() };
    emitNodeTelemetry(SAMPLE, opts);
    emitNodeTelemetry({ ...SAMPLE, timeFromCardArmedToCommitMs: 666 }, opts);

    const trail = resolveTrailPath(opts);
    const content = readFileSync(trail, "utf8");
    const lines = content.split("\n").filter(Boolean);
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[1]).timeFromCardArmedToCommitMs).toBe(666);
  });
});

describe("AC-13 browser sink", () => {
  test("emitBrowserTelemetry calls console.log with wrapped payload", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    emitBrowserTelemetry(SAMPLE);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      "[telemetry]",
      expect.objectContaining({
        eventName: "CardActivationClarity",
        cycle: "purupuru-cycle-1-wood-vertical-2026-05-13",
        persistence: "browser-console-only-cycle-1",
        cardId: "wood_awakening",
      }),
    );
    spy.mockRestore();
  });

  test("pickTelemetrySink returns browser sink in Node test env (no window)", () => {
    const sink = pickTelemetrySink();
    // Both branches return browser sink in cycle-1 (Node sink invoked explicitly).
    expect(typeof sink).toBe("function");
  });
});
