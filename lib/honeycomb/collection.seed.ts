/**
 * Collection.seed — dev-gated fixture seeder.
 *
 * A production-exclusion surface (NFR-6). The gate is a security
 * boundary, not a convenience — all four exported functions no-op
 * entirely in production. Builds cards via `createCard` from
 * `CARD_DEFINITIONS` and writes via `Collection.replaceAll` (replace
 * semantics → deterministic, known test states). Per SDD §7.5.
 *
 * NOT the canonical `generatePack()` — this is a fixture tool only.
 * The real pack-mint loop (FR-2 fast-follow) stays out of scope.
 */

import { Effect } from "effect";
import { runtime } from "@/lib/runtime/runtime";
import { CARD_DEFINITIONS, createCard, type Card, type CardType } from "./cards";
import { Collection } from "./collection.port";

/** The three burnable set types — transcendence is burn-only, not seedable. */
export type SeedableSet = Exclude<CardType, "transcendence">;

/**
 * Dev-gate: seeders are a production-exclusion surface (NFR-6).
 * Every exported function short-circuits to a no-op unless this holds.
 *
 * `__PURU_DEV__` is the object surface `{ enabled, ... }` the rest of the
 * codebase uses (DevConsole's `installDevGlobal`, `match.live.ts`,
 * `lib/runtime/types.d.ts`) — the gate keys on `.enabled`, not a bare
 * boolean.
 */
function devGateOpen(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    (window as unknown as { __PURU_DEV__?: { enabled?: boolean } })
      .__PURU_DEV__?.enabled === true
  );
}

/** Build `count` cards (one per element, in CARD_DEFINITIONS order) of a set type. */
function buildSet(setType: SeedableSet, count: number): Card[] {
  return CARD_DEFINITIONS.filter((d) => d.cardType === setType)
    .slice(0, count)
    .map((d) => createCard(d));
}

/** Replace the collection with a complete 5-element set (burn-eligible). */
export async function seedCompleteSet(setType: SeedableSet): Promise<void> {
  if (!devGateOpen()) return;
  const cards = buildSet(setType, 5);
  await runtime.runPromise(Effect.flatMap(Collection, (c) => c.replaceAll(cards)));
}

/** Replace the collection with a partial set of `count` cards (burn-ineligible). */
export async function seedPartialSet(
  setType: SeedableSet,
  count: number,
): Promise<void> {
  if (!devGateOpen()) return;
  const cards = buildSet(setType, Math.max(0, Math.min(count, 5)));
  await runtime.runPromise(Effect.flatMap(Collection, (c) => c.replaceAll(cards)));
}

/** Replace the collection with all three complete sets (15 cards). */
export async function seedAllSets(): Promise<void> {
  if (!devGateOpen()) return;
  const cards = CARD_DEFINITIONS.map((d) => createCard(d));
  await runtime.runPromise(Effect.flatMap(Collection, (c) => c.replaceAll(cards)));
}

/** Empty the collection. */
export async function clearCollection(): Promise<void> {
  if (!devGateOpen()) return;
  await runtime.runPromise(Effect.flatMap(Collection, (c) => c.replaceAll([])));
}
