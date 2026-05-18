/**
 * Companion ledger tests.
 *
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCompanion,
  loadCompanion,
  recordMatchOutcome,
  rememberFirstElement,
} from "./companion";

describe("companion", () => {
  beforeEach(() => clearCompanion());

  it("starts empty", () => {
    const s = loadCompanion();
    expect(s.totalMatches).toBe(0);
    expect(s.firstElement).toBeNull();
    expect(s.deepestElement).toBeNull();
    expect(s.perElement.wood.wins).toBe(0);
  });

  it("recordMatchOutcome increments wins for the chosen element", () => {
    const s = recordMatchOutcome("wood", "win");
    expect(s.perElement.wood.wins).toBe(1);
    expect(s.perElement.fire.wins).toBe(0);
    expect(s.totalMatches).toBe(1);
  });

  it("recordMatchOutcome increments losses + draws independently", () => {
    recordMatchOutcome("water", "loss");
    recordMatchOutcome("water", "draw");
    const s = loadCompanion();
    expect(s.perElement.water.losses).toBe(1);
    expect(s.perElement.water.draws).toBe(1);
    expect(s.perElement.water.wins).toBe(0);
  });

  it("firstElement sticks to the first record + never updates", () => {
    recordMatchOutcome("wood", "win");
    recordMatchOutcome("fire", "win");
    expect(loadCompanion().firstElement).toBe("wood");
  });

  it("deepestElement tracks the most-played element", () => {
    recordMatchOutcome("wood", "win");
    recordMatchOutcome("wood", "loss");
    recordMatchOutcome("fire", "win");
    expect(loadCompanion().deepestElement).toBe("wood");
  });

  it("totalMatches counts wins+losses+draws across all elements", () => {
    recordMatchOutcome("wood", "win");
    recordMatchOutcome("fire", "loss");
    recordMatchOutcome("earth", "draw");
    expect(loadCompanion().totalMatches).toBe(3);
  });

  it("rememberFirstElement sets firstElement without affecting tallies", () => {
    rememberFirstElement("metal");
    const s = loadCompanion();
    expect(s.firstElement).toBe("metal");
    expect(s.totalMatches).toBe(0);
  });

  it("rememberFirstElement is a no-op once firstElement is set", () => {
    rememberFirstElement("wood");
    rememberFirstElement("fire");
    expect(loadCompanion().firstElement).toBe("wood");
  });

  it("recovers from corrupt JSON", () => {
    window.localStorage.setItem("puru-companion-v1", "not json");
    expect(loadCompanion().totalMatches).toBe(0);
  });

  it("recovers from wrong shape", () => {
    window.localStorage.setItem("puru-companion-v1", JSON.stringify({ v: 99 }));
    expect(loadCompanion().totalMatches).toBe(0);
  });

  it("persists across loadCompanion calls", () => {
    recordMatchOutcome("water", "win");
    recordMatchOutcome("water", "win");
    expect(loadCompanion().perElement.water.wins).toBe(2);
  });
});
