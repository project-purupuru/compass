/**
 * AC-14: GameState serializes + deserializes with deep-equal round-trip
 */

import { describe, expect, test } from "vitest";

import {
  createInitialState,
  deserialize,
  serialize,
  withActiveZone,
  withCardLocation,
  withFlag,
  withResource,
  withZoneEvent,
  withZoneState,
} from "../runtime/game-state";

describe("GameState serialization (AC-14)", () => {
  test("round-trip: parse(serialize(state)) === state (deep-equal)", () => {
    const state = createInitialState({
      runId: "test-run-1",
      dayElementId: "wood",
      hand: [
        { instanceId: "wood_awakening", definitionId: "wood_awakening" },
      ],
      zones: [
        { zoneId: "wood_grove", elementId: "wood", state: "Idle" },
        { zoneId: "water_harbor", elementId: "water", state: "Locked" },
      ],
    });
    const round = deserialize(serialize(state));
    expect(round).toEqual(state);
  });

  test("schemaVersion mismatch throws", () => {
    expect(() => deserialize('{"schemaVersion":99,"state":{}}')).toThrow(/Schema version mismatch/);
  });

  test("withZoneState preserves immutability (returns new object)", () => {
    const state = createInitialState({
      runId: "r",
      dayElementId: "wood",
      zones: [{ zoneId: "wood_grove", elementId: "wood" }],
    });
    const next = withZoneState(state, "wood_grove", { state: "Active" });
    expect(state.zones["wood_grove"].state).toBe("Idle");
    expect(next.zones["wood_grove"].state).toBe("Active");
    expect(state).not.toBe(next);
  });

  test("withCardLocation patches the card's location field only", () => {
    const state = createInitialState({
      runId: "r",
      dayElementId: "wood",
      hand: [{ instanceId: "c1", definitionId: "wood_awakening" }],
    });
    const next = withCardLocation(state, "c1", "Resolving");
    expect(next.cards["c1"].location).toBe("Resolving");
    expect(next.cards["c1"].definitionId).toBe("wood_awakening");
  });

  test("withResource adds delta", () => {
    const state = createInitialState({ runId: "r", dayElementId: "wood" });
    const next1 = withResource(state, "spring_pollen", 2);
    const next2 = withResource(next1, "spring_pollen", 3);
    expect(next2.resources["spring_pollen"]).toBe(5);
  });

  test("withFlag sets value", () => {
    const state = createInitialState({ runId: "r", dayElementId: "wood" });
    const next = withFlag(state, "wood_grove.seedling_awakened", true);
    expect(next.flags["wood_grove.seedling_awakened"]).toBe(true);
  });

  test("withZoneEvent appends to activeEventIds", () => {
    const state = createInitialState({
      runId: "r",
      dayElementId: "wood",
      zones: [{ zoneId: "wood_grove", elementId: "wood" }],
    });
    const next = withZoneEvent(state, "wood_grove", "wood_spring_seedling");
    expect(next.zones["wood_grove"].activeEventIds).toEqual(["wood_spring_seedling"]);
  });

  test("withActiveZone sets activeZoneId", () => {
    const state = createInitialState({ runId: "r", dayElementId: "wood" });
    const next = withActiveZone(state, "wood_grove");
    expect(next.activeZoneId).toBe("wood_grove");
  });
});
