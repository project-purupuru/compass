import { describe, expect, it } from "vitest";

import { Archetype } from "../ecs/archetype";

import { swayLeafSystem, type SwayLeafCols } from "./sway-system";

const LEAF_SPECS = [
  { name: "phase", itemSize: 1 },
  { name: "amplitude", itemSize: 1 },
  { name: "frequency", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
];

function buildArch(
  entries: ReadonlyArray<{
    readonly phase: number;
    readonly amplitude: number;
    readonly frequency: number;
  }>,
): Archetype<SwayLeafCols> {
  const arch = new Archetype<SwayLeafCols>(LEAF_SPECS, 8);
  for (const e of entries) {
    arch.add({
      phase: [e.phase],
      amplitude: [e.amplitude],
      frequency: [e.frequency],
      rotY: [0],
    });
  }
  return arch;
}

// Local mulberry32 to verify celVocab math without importing the app layer.
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Round a Float64 through Float32 so test expectations match what columns store. */
function f32(x: number): number {
  const buf = new Float32Array(1);
  buf[0] = x;
  return buf[0];
}

describe("swayLeafSystem", () => {
  it("is deterministic: same state + same t produces identical rotY", () => {
    const arch = buildArch([
      { phase: 0, amplitude: 0.05, frequency: 0.4 },
      { phase: Math.PI, amplitude: 0.05, frequency: 0.4 },
    ]);

    swayLeafSystem(arch, 0, 1.0);
    const rotY = arch.columnArray("rotY");
    const first = [rotY[0], rotY[1]];

    rotY[0] = 0;
    rotY[1] = 0;
    swayLeafSystem(arch, 0, 1.0);
    expect(rotY[0]).toBe(first[0]);
    expect(rotY[1]).toBe(first[1]);
  });

  it("different phases produce independent sway at the same t", () => {
    const arch = buildArch([
      { phase: 0, amplitude: 0.05, frequency: 0.4 },
      { phase: Math.PI / 2, amplitude: 0.05, frequency: 0.4 },
    ]);
    swayLeafSystem(arch, 0, 0.25);
    const rotY = arch.columnArray("rotY");
    expect(rotY[0]).not.toBe(rotY[1]);
  });

  it("matches celVocab.swayAngle math: sin(t·omega + phase) · amplitude", () => {
    const seed = 42;
    const amplitude = 0.05;
    const frequency = 0.4;
    const t = 1.5;

    // Precompute phase the same way swayAngle would.
    const rand = mulberry32(seed);
    const phase = rand() * Math.PI * 2;

    const arch = buildArch([{ phase, amplitude, frequency }]);
    swayLeafSystem(arch, 0, t);

    // Expected uses the Float32-rounded column values, since that's what the
    // system actually reads. Float32 has ~7 decimal digits of precision.
    const f32Phase = arch.columnArray("phase")[0];
    const f32Amp = arch.columnArray("amplitude")[0];
    const f32Freq = arch.columnArray("frequency")[0];
    const omega = 2 * Math.PI * f32Freq;
    const expected = Math.sin(t * omega + f32Phase) * f32Amp;
    expect(arch.columnArray("rotY")[0]).toBeCloseTo(expected, 6);
  });

  it("leaves input columns (phase, amplitude, frequency) untouched", () => {
    const arch = buildArch([
      { phase: 0.7, amplitude: 0.05, frequency: 0.4 },
      { phase: 1.3, amplitude: 0.1, frequency: 0.5 },
    ]);

    // Snapshot the input columns BEFORE running the system, so we compare
    // exactly what's stored (Float32-rounded) — not the JS Float64 literals.
    const phaseBefore = [arch.columnArray("phase")[0], arch.columnArray("phase")[1]];
    const ampBefore = [
      arch.columnArray("amplitude")[0],
      arch.columnArray("amplitude")[1],
    ];
    const freqBefore = [
      arch.columnArray("frequency")[0],
      arch.columnArray("frequency")[1],
    ];

    swayLeafSystem(arch, 0, 2.0);

    expect(arch.columnArray("phase")[0]).toBe(phaseBefore[0]);
    expect(arch.columnArray("phase")[1]).toBe(phaseBefore[1]);
    expect(arch.columnArray("amplitude")[0]).toBe(ampBefore[0]);
    expect(arch.columnArray("amplitude")[1]).toBe(ampBefore[1]);
    expect(arch.columnArray("frequency")[0]).toBe(freqBefore[0]);
    expect(arch.columnArray("frequency")[1]).toBe(freqBefore[1]);
    // Sanity check against the Float32-rounded literals (catches regressions
    // where a "passthrough" column starts being mutated to a different value).
    expect(phaseBefore[0]).toBe(f32(0.7));
    expect(phaseBefore[1]).toBe(f32(1.3));
  });

  it("ignores slots beyond arch.length (unused capacity stays untouched)", () => {
    const arch = buildArch([{ phase: 0, amplitude: 0.05, frequency: 0.4 }]);
    const rotY = arch.columnArray("rotY");
    // Capacity is 8, length is 1. Stamp a sentinel into an unused slot.
    rotY[5] = -999;

    swayLeafSystem(arch, 0, 1.0);

    expect(rotY[0]).not.toBe(0); // active slot was written
    expect(rotY[5]).toBe(-999); // unused slot untouched
  });

  it("handles an empty archetype (length 0) as a no-op", () => {
    const arch = new Archetype<SwayLeafCols>(LEAF_SPECS, 8);
    expect(() => swayLeafSystem(arch, 0, 1.0)).not.toThrow();
    expect(arch.length).toBe(0);
  });
});
