// AC-1.1 · eventIdOf stable across re-encodes (100 runs identical)
// AC-1.2 · schema_version preserves prior eventIds for unchanged events
// AC-1.4 · cross-source eventId collision impossible

import { describe, expect, it } from "vitest";

import { eventIdOf, verifyEventId } from "../src/event-id";
import type { MintEvent } from "../src/world-event";

const baseMintFields: Omit<MintEvent, "eventId"> = {
  _tag: "MintEvent",
  output_type: "Artifact",
  emittedAt: new Date("2026-05-08T10:00:00Z"),
  ownerWallet: "8ZUczUAUSZxQ7K3sx9uS4CfNnbxYJyc1mEZxxxxxxxxx" as MintEvent["ownerWallet"],
  element: "FIRE",
  weather: "WATER",
  stonePda: "PdaStone111111111111111111111111111111",
};

describe("eventIdOf · canonical hash derivation", () => {
  it("AC-1.1 · stable across 100 re-encodes (deterministic)", () => {
    const first = eventIdOf(baseMintFields, "score");
    for (let i = 0; i < 100; i++) {
      expect(eventIdOf(baseMintFields, "score")).toBe(first);
    }
  });

  it("AC-1.4 · same payload + different source → different eventId", () => {
    const fromScore = eventIdOf(baseMintFields, "score");
    const fromSonar = eventIdOf(baseMintFields, "sonar");
    const fromWeather = eventIdOf(baseMintFields, "weather");
    expect(fromScore).not.toBe(fromSonar);
    expect(fromScore).not.toBe(fromWeather);
    expect(fromSonar).not.toBe(fromWeather);
  });

  it("schema_version bump produces different hash", () => {
    const v1 = eventIdOf(baseMintFields, "score", 1);
    const v2 = eventIdOf(baseMintFields, "score", 2);
    expect(v1).not.toBe(v2);
  });

  it("verifyEventId · derived eventId matches stored", () => {
    const eventId = eventIdOf(baseMintFields, "score");
    const fullEvent: MintEvent = { ...baseMintFields, eventId };
    expect(verifyEventId(fullEvent, "score")).toBe(true);
  });

  it("verifyEventId · tampered field detected", () => {
    const eventId = eventIdOf(baseMintFields, "score");
    const tampered: MintEvent = { ...baseMintFields, eventId, element: "WATER" };
    expect(verifyEventId(tampered, "score")).toBe(false);
  });

  it("verifyEventId · wrong source detected", () => {
    const eventId = eventIdOf(baseMintFields, "score");
    const fullEvent: MintEvent = { ...baseMintFields, eventId };
    expect(verifyEventId(fullEvent, "sonar")).toBe(false);
  });

  it("canonical encoding · key reordering produces same hash", () => {
    // Object key order is insertion order in JS · canonical encoding sorts.
    const reordered: Omit<MintEvent, "eventId"> = {
      stonePda: baseMintFields.stonePda,
      weather: baseMintFields.weather,
      element: baseMintFields.element,
      ownerWallet: baseMintFields.ownerWallet,
      emittedAt: baseMintFields.emittedAt,
      _tag: baseMintFields._tag,
      output_type: baseMintFields.output_type,
    };
    expect(eventIdOf(reordered, "score")).toBe(eventIdOf(baseMintFields, "score"));
  });

  it("returns 64-char hex (sha256)", () => {
    const id = eventIdOf(baseMintFields, "score");
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });
});
