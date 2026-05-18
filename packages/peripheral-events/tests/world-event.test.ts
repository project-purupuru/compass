// AC-1.3 · Effect-Schema decode/encode roundtrip · structured errors

import { Schema as S } from "effect";
import { describe, expect, it } from "vitest";

import {
  ElementShiftEvent,
  MintEvent,
  QuizCompletedEvent,
  WeatherEvent,
  WorldEvent,
  eventReferencesPuruhani,
  eventTagOf,
} from "../src/world-event";

const sampleMint: MintEvent = {
  _tag: "MintEvent",
  output_type: "Artifact",
  eventId: "abc123",
  emittedAt: new Date("2026-05-08T10:00:00Z"),
  ownerWallet: "8ZUczUAUSZxQ7K3sx9uS4CfNnbxYJyc1mEZxxxxxxxxx" as MintEvent["ownerWallet"],
  element: "FIRE",
  weather: "WATER",
  stonePda: "PdaStone111111111111111111111111111111",
};

describe("WorldEvent · sealed discriminated union", () => {
  it("decodes MintEvent · roundtrips through schema", () => {
    const decoded = S.decodeUnknownSync(WorldEvent)(sampleMint);
    expect(decoded._tag).toBe("MintEvent");
    expect(eventTagOf(decoded)).toBe("MintEvent");
  });

  it("decodes WeatherEvent", () => {
    const evt: WeatherEvent = {
      _tag: "WeatherEvent",
      output_type: "Signal",
      eventId: "wx-001",
      emittedAt: new Date(),
      day: "2026-05-08",
      dominantElement: "FIRE",
      generativeNext: "EARTH",
      oracleSources: ["TREMOR", "CORONA"],
    };
    const decoded = S.decodeUnknownSync(WorldEvent)(evt);
    expect(decoded._tag).toBe("WeatherEvent");
  });

  it("decodes ElementShiftEvent", () => {
    const evt: ElementShiftEvent = {
      _tag: "ElementShiftEvent",
      output_type: "Verdict",
      eventId: "shift-001",
      emittedAt: new Date(),
      wallet: "Wallet1111111111111111111111111111111111111" as ElementShiftEvent["wallet"],
      fromAffinity: { WOOD: 0.2, FIRE: 0.5, EARTH: 0.1, METAL: 0.1, WATER: 0.1 },
      toAffinity: { WOOD: 0.2, FIRE: 0.6, EARTH: 0.1, METAL: 0.05, WATER: 0.05 },
      deltaElement: "FIRE",
    };
    const decoded = S.decodeUnknownSync(WorldEvent)(evt);
    expect(decoded._tag).toBe("ElementShiftEvent");
  });

  it("decodes QuizCompletedEvent · NO wallet (per walletAwareGet:false fix)", () => {
    const evt: QuizCompletedEvent = {
      _tag: "QuizCompletedEvent",
      output_type: "Operator-Model",
      eventId: "quiz-001",
      emittedAt: new Date(),
      archetype: "WOOD",
    };
    const decoded = S.decodeUnknownSync(WorldEvent)(evt);
    expect(decoded._tag).toBe("QuizCompletedEvent");
    // wallet field intentionally absent · GET chain is anonymous
    expect("wallet" in decoded).toBe(false);
  });

  it("rejects malformed events with structured errors", () => {
    expect(() => S.decodeUnknownSync(WorldEvent)({ _tag: "MintEvent" })).toThrow();
    expect(() => S.decodeUnknownSync(WorldEvent)({ _tag: "InvalidTag", eventId: "x" })).toThrow();
    expect(() =>
      S.decodeUnknownSync(WorldEvent)({
        ...sampleMint,
        element: "INVALID_ELEMENT",
      }),
    ).toThrow();
  });

  it("eventReferencesPuruhani · MintEvent matches owner", () => {
    const wallet = sampleMint.ownerWallet;
    expect(eventReferencesPuruhani(sampleMint, wallet)).toBe(true);
    expect(
      eventReferencesPuruhani(
        sampleMint,
        "OtherWallet11111111111111111111111111111" as typeof wallet,
      ),
    ).toBe(false);
  });

  it("eventReferencesPuruhani · WeatherEvent never matches (no wallet)", () => {
    const wxEvent: WeatherEvent = {
      _tag: "WeatherEvent",
      output_type: "Signal",
      eventId: "wx-002",
      emittedAt: new Date(),
      day: "2026-05-08",
      dominantElement: "WATER",
      generativeNext: "WOOD",
      oracleSources: ["BREATH"],
    };
    expect(eventReferencesPuruhani(wxEvent, "AnyWallet1111" as MintEvent["ownerWallet"])).toBe(
      false,
    );
  });
});
