// WorldEvent · sealed Effect Schema discriminated union
// SDD r2 §3.1 · 4 v0 variants
//
// All events share: eventId (canonical hash · see event-id.ts) + emittedAt.
// Mint and ElementShift include wallet · WeatherEvent and QuizCompletedEvent
// are wallet-agnostic (per walletAwareGet:false fix · SDD §3.2).
//
// output_type annotations (added 2026-05-12 · S1-T4 substrate-agentic cycle):
// Each variant carries an `output_type` literal matching the 5-stream taxonomy
// from construct-rooms-substrate (Signal/Verdict/Artifact/Intent/Operator-Model).
// CI gate `scripts/check-envelope-coverage.sh` enforces 100% coverage.

import { Schema as S } from "effect";

// Wuxing five-element vocabulary · Element domain primitive.
export const Element = S.Literal("WOOD", "FIRE", "EARTH", "METAL", "WATER");
export type Element = S.Schema.Type<typeof Element>;

// Solana pubkey as base58 string · branded for type-safety at boundaries.
export const SolanaPubkey = S.String.pipe(S.brand("SolanaPubkey"));
export type SolanaPubkey = S.Schema.Type<typeof SolanaPubkey>;

// Cosmic weather oracle sources (per gumi pitch · 3 of 5 named).
export const OracleSource = S.Literal("TREMOR", "CORONA", "BREATH");
export type OracleSource = S.Schema.Type<typeof OracleSource>;

// Element-affinity vector · normalized 0..1 per element.
export const ElementAffinity = S.Record({ key: Element, value: S.Number });
export type ElementAffinity = S.Schema.Type<typeof ElementAffinity>;

// ── 4 v0 variants ───────────────────────────────────────────────────

export const MintEvent = S.Struct({
  _tag: S.Literal("MintEvent"),
  output_type: S.Literal("Artifact"),
  eventId: S.String,
  emittedAt: S.DateFromSelf,
  ownerWallet: SolanaPubkey,
  element: Element,
  weather: Element,
  stonePda: S.String,
});
export type MintEvent = S.Schema.Type<typeof MintEvent>;

export const WeatherEvent = S.Struct({
  _tag: S.Literal("WeatherEvent"),
  output_type: S.Literal("Signal"),
  eventId: S.String,
  emittedAt: S.DateFromSelf,
  day: S.String,
  dominantElement: Element,
  generativeNext: Element,
  oracleSources: S.Array(OracleSource),
});
export type WeatherEvent = S.Schema.Type<typeof WeatherEvent>;

export const ElementShiftEvent = S.Struct({
  _tag: S.Literal("ElementShiftEvent"),
  output_type: S.Literal("Verdict"),
  eventId: S.String,
  emittedAt: S.DateFromSelf,
  wallet: SolanaPubkey,
  fromAffinity: ElementAffinity,
  toAffinity: ElementAffinity,
  deltaElement: Element,
});
export type ElementShiftEvent = S.Schema.Type<typeof ElementShiftEvent>;

export const QuizCompletedEvent = S.Struct({
  _tag: S.Literal("QuizCompletedEvent"),
  output_type: S.Literal("Operator-Model"),
  eventId: S.String,
  emittedAt: S.DateFromSelf,
  archetype: Element,
});
export type QuizCompletedEvent = S.Schema.Type<typeof QuizCompletedEvent>;

// ── sealed union ────────────────────────────────────────────────────

export const WorldEvent = S.Union(MintEvent, WeatherEvent, ElementShiftEvent, QuizCompletedEvent);
export type WorldEvent = S.Schema.Type<typeof WorldEvent>;

// ── typed accessors ─────────────────────────────────────────────────

export const eventTagOf = (e: WorldEvent): WorldEvent["_tag"] => e._tag;

export const eventReferencesPuruhani = (e: WorldEvent, walletId: SolanaPubkey): boolean => {
  switch (e._tag) {
    case "MintEvent":
      return e.ownerWallet === walletId;
    case "ElementShiftEvent":
      return e.wallet === walletId;
    case "WeatherEvent":
    case "QuizCompletedEvent":
      return false;
  }
};
