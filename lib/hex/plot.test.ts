import { describe, expect, it } from "vitest";

import { Schema as S } from "effect";

import { Plot, grassPlot, type PlotT } from "./plot";

describe("PlotT", () => {
  it("constructs without element or ambientBindings (legacy shape)", () => {
    const plot = grassPlot({ q: 0, r: 0 });
    expect(plot.element).toBeUndefined();
    expect(plot.ambientBindings).toBeUndefined();
    expect(plot.terrain).toBe("grass");
  });

  it("accepts element via the schema decoder", () => {
    const raw: unknown = {
      coord: { q: 1, r: -1 },
      terrain: "grass",
      elevation: 0,
      fixtures: [],
      edges: ["flat", "flat", "flat", "flat", "flat", "flat"],
      element: "wood",
    };
    const decoded = S.decodeUnknownSync(Plot)(raw);
    expect(decoded.element).toBe("wood");
  });

  it("accepts ambientBindings as an array of elements", () => {
    const raw: unknown = {
      coord: { q: 0, r: 0 },
      terrain: "shrine",
      elevation: 0.2,
      fixtures: [],
      edges: ["flat", "flat", "flat", "flat", "flat", "flat"],
      element: "fire",
      ambientBindings: ["fire", "earth"],
    };
    const decoded = S.decodeUnknownSync(Plot)(raw);
    expect(decoded.element).toBe("fire");
    expect(decoded.ambientBindings).toEqual(["fire", "earth"]);
  });

  it("rejects an invalid element value via schema decode", () => {
    const raw: unknown = {
      coord: { q: 0, r: 0 },
      terrain: "grass",
      elevation: 0,
      fixtures: [],
      edges: ["flat", "flat", "flat", "flat", "flat", "flat"],
      element: "lightning", // not in ElementId literal union
    };
    expect(() => S.decodeUnknownSync(Plot)(raw)).toThrow();
  });

  it("legacy plots without the new fields still decode cleanly", () => {
    const raw: unknown = {
      coord: { q: 0, r: 0 },
      terrain: "water",
      elevation: -0.06,
      fixtures: [],
      edges: ["flat", "flat", "flat", "flat", "flat", "flat"],
    };
    const decoded = S.decodeUnknownSync(Plot)(raw);
    // Legacy plots produce a valid PlotT — the new fields are optional.
    const t: PlotT = decoded;
    expect(t.terrain).toBe("water");
  });
});
