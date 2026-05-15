/**
 * MatchEngineLive — the clash state machine, run on the substrate.
 *
 * State lives in a SubscriptionRef (reactive — the React surface subscribes to
 * `.changes`). The clash-advance *timing* is an Effect fiber: reveal a clash
 * every beat, then conclude the round. The fiber owns the cadence the UI used
 * to own with setTimeout — the game is driven off the engine, not the surface.
 *
 * The clash trace publishes to a PubSub: RoundLocked → ClashResolved×N →
 * RoundConcluded | MatchEnded. Subscribers (the event log, the world's
 * activationLevel seam) read events in; nobody reaches into match state.
 *
 * Layer.effect with no requirements — the pure match functions (./match) are
 * closed over, so the Service has R = never, mergeable straight into AppLayer.
 */

import { Effect, Fiber, Layer, PubSub, Ref, Stream, SubscriptionRef } from "effect";

import type { ClashEvent } from "./events";
import {
  advanceClash,
  clashesExhausted,
  concludeRound,
  createMatch,
  lockIn as lockInState,
  withPlayerLineup,
} from "./match";
import { MatchEngine } from "./match-engine.port";

/** Beats — how long a single clash sits revealed before the next, and the
 *  pause on the last clash before the round concludes. */
const CLASH_INTERVAL = "850 millis";
const CONCLUDE_DELAY = "1100 millis";

export const MatchEngineLive = Layer.effect(
  MatchEngine,
  Effect.gen(function* () {
    const stateRef = yield* SubscriptionRef.make(createMatch());
    const eventHub = yield* PubSub.unbounded<ClashEvent>();
    // The currently-running clash-advance fiber (one per round). Tracked so a
    // re-lock or a restart can interrupt a loop still in flight.
    const loopFiberRef = yield* Ref.make<Fiber.RuntimeFiber<void, never> | null>(null);

    // The clash-advance loop for ONE round: reveal each clash on a beat,
    // publish its outcome, then conclude. Forked as a fiber by `lockIn`.
    const runClashLoop: Effect.Effect<void> = Effect.gen(function* () {
      while (true) {
        const st = yield* SubscriptionRef.get(stateRef);
        if (st.phase !== "clashing" || !st.roundResult) break;

        if (!clashesExhausted(st)) {
          yield* Effect.sleep(CLASH_INTERVAL);
          const next = advanceClash(yield* SubscriptionRef.get(stateRef));
          yield* SubscriptionRef.set(stateRef, next);
          const clash = next.roundResult?.clashes[next.revealedClashes - 1];
          if (clash) {
            const winner =
              clash.loser === "p2" ? "player" : clash.loser === "p1" ? "opponent" : "draw";
            const element =
              winner === "player"
                ? clash.p1Card.element
                : winner === "opponent"
                  ? clash.p2Card.element
                  : null;
            yield* PubSub.publish(eventHub, {
              type: "ClashResolved",
              round: next.round,
              index: next.revealedClashes - 1,
              winner,
              element,
            });
          }
        } else {
          yield* Effect.sleep(CONCLUDE_DELAY);
          const concluded = concludeRound(yield* SubscriptionRef.get(stateRef));
          yield* SubscriptionRef.set(stateRef, concluded);
          if (concluded.phase === "result") {
            yield* PubSub.publish(eventHub, {
              type: "MatchEnded",
              winner: concluded.winner ?? "draw",
            });
          } else {
            yield* PubSub.publish(eventHub, {
              type: "RoundConcluded",
              round: concluded.round - 1,
              playerSurvivors: concluded.playerLineup.length,
              opponentSurvivors: concluded.opponentLineup.length,
            });
          }
          break;
        }
      }
    });

    const interruptLoop = Effect.gen(function* () {
      const prev = yield* Ref.get(loopFiberRef);
      if (prev) yield* Fiber.interrupt(prev);
      yield* Ref.set(loopFiberRef, null);
    });

    return MatchEngine.of({
      state: stateRef.changes,
      current: SubscriptionRef.get(stateRef),
      events: Stream.fromPubSub(eventHub),

      setLineup: (lineup) =>
        SubscriptionRef.update(stateRef, (s) => withPlayerLineup(s, lineup)),

      lockIn: Effect.gen(function* () {
        const s = yield* SubscriptionRef.get(stateRef);
        const locked = lockInState(s);
        if (locked === s) return; // not in an arrangeable phase — no-op
        yield* interruptLoop;
        yield* SubscriptionRef.set(stateRef, locked);
        yield* PubSub.publish(eventHub, { type: "RoundLocked", round: locked.round });
        const fiber = yield* Effect.forkDaemon(runClashLoop);
        yield* Ref.set(loopFiberRef, fiber);
      }),

      restart: Effect.gen(function* () {
        yield* interruptLoop;
        const fresh = createMatch();
        yield* SubscriptionRef.set(stateRef, fresh);
        yield* PubSub.publish(eventHub, { type: "MatchStarted", weather: fresh.weather });
      }),
    });
  }),
);
