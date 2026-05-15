/**
 * Stable Battle V2 state fingerprints for replay/debug harnesses.
 *
 * Card `uid`s are per-process instance identities, and clash whispers are
 * cosmetic RNG. The digest below strips those volatile fields so two logically
 * identical match states hash to the same SHA-256 value.
 */

import { createHash } from "node:crypto";

import type { BattleCard } from "./card-defs";
import type { ClashResult, RoundResult } from "./resolve";
import type { MatchState } from "./match";

export const BATTLE_STATE_FINGERPRINT_VERSION = "battle-v2.match-state.sha256.v1";

type JsonPrimitive = string | number | boolean | null;
type JsonObject = { readonly [key: string]: JsonValue };
type JsonValue = JsonPrimitive | readonly JsonValue[] | JsonObject;

export interface BattleStateFingerprint {
  readonly algorithm: "sha256";
  readonly version: typeof BATTLE_STATE_FINGERPRINT_VERSION;
  readonly digest: string;
}

function normalizeNumber(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function normalizeCard(card: BattleCard): JsonObject {
  return {
    defId: card.defId,
    element: card.element,
    cardType: card.cardType,
    rarity: card.rarity,
    resonance: card.resonance ?? null,
  };
}

function clashUidMap(clashes: readonly ClashResult[]): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < clashes.length; i++) {
    const clash = clashes[i];
    map.set(clash.p1Card.uid, `p1:${i}:${clash.p1Card.defId}`);
    map.set(clash.p2Card.uid, `p2:${i}:${clash.p2Card.defId}`);
  }
  return map;
}

function normalizeRoundResult(round: RoundResult | null): JsonValue {
  if (!round) return null;

  const uidMap = clashUidMap(round.clashes);
  return {
    round: round.round,
    clashes: round.clashes.map((clash, index) => ({
      index,
      p1Card: normalizeCard(clash.p1Card),
      p2Card: normalizeCard(clash.p2Card),
      p1Power: normalizeNumber(clash.p1Power),
      p2Power: normalizeNumber(clash.p2Power),
      shift: normalizeNumber(clash.shift),
      loser: clash.loser,
      interaction: {
        type: clash.interaction.type,
        advantage: normalizeNumber(clash.interaction.advantage),
      },
      vfx: clash.vfx,
      reason: clash.reason,
    })),
    eliminated: round.eliminated
      .map((uid) => uidMap.get(uid) ?? `unmapped:${uid}`)
      .sort(),
  };
}

export function canonicalBattleState(state: MatchState): JsonValue {
  return {
    version: BATTLE_STATE_FINGERPRINT_VERSION,
    phase: state.phase,
    round: state.round,
    weather: state.weather,
    condition: {
      id: state.condition.id,
      element: state.condition.element,
      effect: state.condition.effect as unknown as JsonValue,
    },
    playerLineup: state.playerLineup.map(normalizeCard),
    opponentLineup: state.opponentLineup.map(normalizeCard),
    roundResult: normalizeRoundResult(state.roundResult),
    revealedClashes: state.revealedClashes,
    history: state.history.map(normalizeRoundResult),
    winner: state.winner,
  };
}

export function stableJson(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("[battle] non-finite number in fingerprint");
    return JSON.stringify(value);
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const object = value as JsonObject;
  const keys = Object.keys(object).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function fingerprintBattleState(state: MatchState): BattleStateFingerprint {
  return {
    algorithm: "sha256",
    version: BATTLE_STATE_FINGERPRINT_VERSION,
    digest: sha256Hex(stableJson(canonicalBattleState(state))),
  };
}
