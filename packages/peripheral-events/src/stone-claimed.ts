// StoneClaimed · Effect Schema mirror of the on-chain Anchor event
//
// Anchor program emits this on every successful claim_genesis_stone via
// `emit!(StoneClaimed { ... })`. Indexers (zerker's lane) parse the base64
// log line using the program's IDL discriminator + Borsh decode. This schema
// is the typed substrate-side mirror so downstream consumers (Score
// dashboard · awareness-layer feed) get a single source of truth.
//
// Source of truth: programs/purupuru-anchor/programs/purupuru-anchor/src/lib.rs
// `#[event] pub struct StoneClaimed { wallet: Pubkey, element: u8, weather: u8, mint: Pubkey }`
//
// Element/weather byte mapping (same as ClaimMessage):
//   1=Wood · 2=Fire · 3=Earth · 4=Metal · 5=Water

import { Schema as S } from "effect";

import { SolanaPubkey } from "./world-event";

// Element / weather byte literals · 1..5 per wuxing cycle.
export const ElementByte = S.Literal(1, 2, 3, 4, 5);
export type ElementByte = S.Schema.Type<typeof ElementByte>;

// Indexed metadata not in the on-chain event itself but needed by consumers
// to disambiguate occurrences (the Anchor event has no signature/slot).
// Indexers fill these fields from the surrounding tx context.
export const StoneClaimedIndexedFields = S.Struct({
  /** Solana tx signature (base58) where this event was emitted */
  signature: S.String,
  /** Slot the tx landed in · primary ordering key */
  slot: S.Number,
  /** Unix seconds · null until the slot is finalized */
  blockTime: S.NullOr(S.Number),
});

// Raw on-chain event shape · matches the Anchor #[event] struct exactly.
export const StoneClaimedRaw = S.Struct({
  wallet: SolanaPubkey,
  element: ElementByte,
  weather: ElementByte,
  mint: SolanaPubkey,
});
export type StoneClaimedRaw = S.Schema.Type<typeof StoneClaimedRaw>;

// Indexed shape · what dashboards / awareness-layer consumers use.
// Composes raw event with indexer-supplied metadata.
export const StoneClaimedSchema = S.extend(StoneClaimedRaw, StoneClaimedIndexedFields);
export type StoneClaimed = S.Schema.Type<typeof StoneClaimedSchema>;
