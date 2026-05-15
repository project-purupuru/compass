/**
 * MatchEngine — the clash game, as an Effect service (port).
 *
 * The clash is driven *off the substrate*, not the UI: the match state lives
 * in a SubscriptionRef inside the live layer, the clash-advance timing is an
 * Effect fiber, and the domain trace is a PubSub stream. The React surface
 * (ClashArena) is a pure render + dispatch — it never sees the Effect surface
 * (the lib/runtime/react.ts bridge keeps useState semantics).
 *
 * Port/live/layer is the honeycomb-substrate pattern — same shape as
 * WeatherFeed, Awareness, Invocation.
 */

import { Context, type Effect, type Stream } from "effect";

import type { BattleCard } from "./card-defs";
import type { ClashEvent } from "./events";
import type { MatchState } from "./match";

export class MatchEngine extends Context.Tag("MatchEngine")<
  MatchEngine,
  {
    /** Reactive match state — emits the current value, then every transition. */
    readonly state: Stream.Stream<MatchState>;
    /** A one-shot snapshot of the current match state. */
    readonly current: Effect.Effect<MatchState>;
    /** The clash trace — RoundLocked · ClashResolved · RoundConcluded · MatchEnded. */
    readonly events: Stream.Stream<ClashEvent>;
    /** Reorder the player's lineup (arrange / between-rounds only). */
    readonly setLineup: (lineup: readonly BattleCard[]) => Effect.Effect<void>;
    /** Lock in the lineup — resolves the round and forks the clash-advance fiber. */
    readonly lockIn: Effect.Effect<void>;
    /** Abandon the current match and mint a fresh one. */
    readonly restart: Effect.Effect<void>;
  }
>() {}
