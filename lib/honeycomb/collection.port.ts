/**
 * Collection — the player's persistent owned-card store.
 *
 * Port for the burn-rite cycle (Sprint 148 / S1). Ports the canonical
 * `cards: Card[]` collection model from purupuru-game's `state.ts:4-27`
 * into a swap-ready Effect port. Three methods only — no backend
 * overcooking (PRD NFR; SDD §5.1). The `live` impl is disposable
 * localStorage; the `mock` is an in-memory Ref. A future on-chain /
 * backend impl satisfies this same interface with no caller changes
 * (NFR-5).
 *
 * Distinct from the per-match deal (`match.reducer.ts` deals base cards
 * into a *match*; the Collection is what the player *owns* across
 * sessions).
 */

import { Context, type Effect } from "effect";
import type { Card } from "./cards";

export class Collection extends Context.Tag("purupuru-ttrpg/Collection")<
  Collection,
  {
    /** All cards the player currently owns. */
    readonly getAll: () => Effect.Effect<readonly Card[]>;
    /** Add one card to the collection. */
    readonly grant: (card: Card) => Effect.Effect<void>;
    /** Replace the entire collection (burn resolution, seeding, clear). */
    readonly replaceAll: (cards: readonly Card[]) => Effect.Effect<void>;
  }
>() {}
