/**
 * Match.live — phase-orchestrator implementation.
 *
 * Sits above Battle (selection/arrangement state) and Clash (round resolution).
 * Drives the full match lifecycle defined by MatchPhase. SDD §3.3.
 *
 * Phase × Command transition matrix is enforced via validCommandsFor() from
 * the port. Wrong-phase commands return a typed `wrong-phase` error.
 */

import { Duration, Effect, Fiber, Layer, Option, PubSub, Ref, Stream } from "effect";
import { Clash } from "./clash.port";
import type { Card } from "./cards";
import { Collection } from "./collection.port";
import { detectCombos, getComboSummary } from "./combos";
import {
  Match,
  type MatchCommand,
  type MatchError,
  type MatchEvent,
  type MatchPhase,
  type MatchSnapshot,
  validCommandsFor,
} from "./match.port";
import { recordMatchOutcome } from "./companion";
import { initialSnapshot, reduce, stubOpponentLineup } from "./match.reducer";
import { SHENG, KE } from "./wuxing";
import { whisper as pickWhisper } from "./whispers";

/** Staggered-reveal timing — mirrors world-purupuru advanceClash() at round 1.
 * Each later round is faster via roundIntensity scaling at call-site. */
const CLASH_TIMING = {
  approachMs: 500,
  impactMs: 100,
  settleMs: 350,
  holdMs: 200,
  gapMs: 400,
  disintegrateMs: 700,
  weatherPauseMs: 200,
} as const;

// initialSnapshot + stubOpponentLineup moved to ./match.reducer (pure module).
// Re-imported above so the existing in-file references continue to work.

/**
 * Compute who dies this round, applying Caretaker A Shield. Mirrors
 * world-purupuru startDisintegrate: a surviving caretaker_a saves one
 * adjacent eliminated ally (one save per shield).
 */
function computeDyingAndShields(
  clashes: readonly { p1Card: { position: number }; p2Card: { position: number }; loser: "p1" | "p2" | "draw" }[],
  p1Lineup: readonly Card[],
  p2Lineup: readonly Card[],
): {
  dyingP1: Set<number>;
  dyingP2: Set<number>;
  shieldedP1: Set<number>;
  shieldedP2: Set<number>;
} {
  const dyingP1 = new Set<number>();
  const dyingP2 = new Set<number>();
  for (const c of clashes) {
    if (c.loser === "p1") dyingP1.add(c.p1Card.position);
    else if (c.loser === "p2") dyingP2.add(c.p2Card.position);
    else {
      dyingP1.add(c.p1Card.position);
      dyingP2.add(c.p2Card.position);
    }
  }

  const shieldedP1 = new Set<number>();
  const shieldedP2 = new Set<number>();

  const applyShield = (lineup: readonly Card[], dying: Set<number>, shielded: Set<number>) => {
    for (let i = 0; i < lineup.length; i++) {
      const card = lineup[i];
      if (!card) continue;
      if (card.cardType !== "caretaker_a") continue;
      if (dying.has(i)) continue;
      for (const adj of [i - 1, i + 1]) {
        if (adj >= 0 && adj < lineup.length && dying.has(adj)) {
          dying.delete(adj);
          shielded.add(adj);
          break;
        }
      }
    }
  };
  applyShield(p1Lineup, dyingP1, shieldedP1);
  applyShield(p2Lineup, dyingP2, shieldedP2);

  return { dyingP1, dyingP2, shieldedP1, shieldedP2 };
}

export const MatchLive: Layer.Layer<Match, never, Clash> = Layer.scoped(
  Match,
  Effect.gen(function* () {
    const clash = yield* Clash;
    // FR-7a deal seam: read the player's owned collection and seed the match
    // with it, so owned transcendence cards reach the playable lineup. When
    // the collection is empty — or the Collection service isn't provided
    // (e.g. the transition-matrix test layer) — initialSnapshot falls back to
    // its 12-random deal. Collection is read via serviceOption so MatchLive's
    // requirement type stays `Clash`-only: the runtime provides Collection
    // via PrimitivesLayer, but suites that wire MatchLive over ClashLive
    // alone keep working with no fixture changes. SDD §6.4.
    const collectionOpt = yield* Effect.serviceOption(Collection);
    const ownedCards = Option.isSome(collectionOpt)
      ? yield* collectionOpt.value.getAll()
      : [];
    const stateRef = yield* Ref.make<MatchSnapshot>(
      initialSnapshot("match-genesis", ownedCards.length > 0 ? ownedCards : undefined),
    );
    const pubsub = yield* PubSub.unbounded<MatchEvent>();
    /** Ref to the currently-running reveal fiber, so reset-match can interrupt it. */
    const fiberRef = yield* Ref.make<Fiber.RuntimeFiber<unknown, unknown> | null>(null);

    const publish = (event: MatchEvent) => PubSub.publish(pubsub, event);
    const tick = () => PubSub.publish(pubsub, { _tag: "state-changed" } as MatchEvent);

    /** Update state and publish a tick so subscribers re-read. */
    const update = (
      f: (s: MatchSnapshot) => MatchSnapshot,
    ): Effect.Effect<void> =>
      Effect.gen(function* () {
        yield* Ref.update(stateRef, f);
        yield* tick();
      });

    const transition = (phase: MatchPhase): Effect.Effect<void> =>
      Effect.gen(function* () {
        yield* Ref.update(stateRef, (s) => ({ ...s, phase }));
        yield* publish({ _tag: "phase-entered", phase, at: Date.now() });
      });

    const interruptReveal = Effect.gen(function* () {
      const fiber = yield* Ref.get(fiberRef);
      if (fiber) yield* Fiber.interrupt(fiber);
      yield* Ref.set(fiberRef, null);
    });

    /**
     * Drive a single round: resolve the clash sequence upfront, then animate
     * each pair (approach → impact → settle → gap) via the snapshot. After
     * the last pair, run disintegration (with Caretaker A Shield), update
     * lineups, and either transition to result or back to between-rounds.
     *
     * Ported from world-purupuru state.svelte.ts runClash + playNextClash +
     * advanceClash + startDisintegrate.
     */
    const runRound = (round: number): Effect.Effect<void> =>
      Effect.gen(function* () {
        const snap = yield* Ref.get(stateRef);

        // 1. Resolve the whole round up front (deterministic).
        const result = yield* clash.resolveRound({
          p1Lineup: snap.p1Lineup,
          p2Lineup: snap.p2Lineup,
          weather: snap.weather,
          condition: snap.condition,
          round,
          seed: snap.seed,
          p1CombosAtRoundStart: snap.p1Combos,
          p2CombosAtRoundStart: snap.p2Combos,
          previousChainBonus: snap.chainBonusAtRoundStart,
        });
        yield* publish({ _tag: "clash-resolved", result });

        // 2. Seed the reveal state and flip into `clashing`.
        yield* update((s) => ({
          ...s,
          phase: "clashing" as MatchPhase,
          clashSequence: result.clashes,
          visibleClashIdx: -1,
          activeClashPhase: null,
          stamps: [],
          lastPlayed: null,
          lastGenerated: null,
          lastOvercome: null,
          animState: "idle" as const,
        }));
        yield* publish({ _tag: "phase-entered", phase: "clashing", at: Date.now() });

        // Jo-Ha-Kyu: later rounds compress. Quadratic gap shrink so R3 feels urgent.
        const intensity = round === 1 ? 1.0 : round === 2 ? 1.2 : 1.4;
        const t = (ms: number) =>
          Effect.sleep(Duration.millis(Math.round(ms / intensity)));
        const tQuad = (ms: number) =>
          Effect.sleep(Duration.millis(Math.round(ms / (intensity * intensity))));

        yield* t(CLASH_TIMING.weatherPauseMs);

        // 3. For each clash: approach → impact → settle → gap.
        for (let i = 0; i < result.clashes.length; i++) {
          const c = result.clashes[i]!;
          const playerEl = c.p1Card.card.element;
          const opponentEl = c.p2Card.card.element;

          // approach — slide cards toward each other
          yield* update((s) => ({
            ...s,
            visibleClashIdx: i,
            activeClashPhase: "approach" as const,
            lastPlayed: playerEl,
            lastGenerated: SHENG[playerEl],
            lastOvercome: KE[playerEl],
            animState: "idle" as const,
          }));
          yield* t(CLASH_TIMING.approachMs);

          // impact — stamp loser, fire hitstop, whisper from player's caretaker
          const stampEl = c.loser === "p2" ? "win" : c.loser === "p1" ? "lose" : "draw";
          const seedNum = i + round * 17;
          const whisperLine = pickWhisper(
            snap.playerElement ?? snap.weather,
            stampEl,
            seedNum,
          );
          yield* update((s) => ({
            ...s,
            activeClashPhase: "impact" as const,
            stamps: [...new Set([...s.stamps, i])],
            animState: "hitstop" as const,
            lastWhisper: whisperLine,
          }));
          yield* t(CLASH_TIMING.impactMs);

          // settle — relax animation; let stamp + whisper breathe
          yield* update((s) => ({
            ...s,
            activeClashPhase: "settle" as const,
            animState: "idle" as const,
          }));
          yield* t(CLASH_TIMING.settleMs + CLASH_TIMING.holdMs);

          // gap between clashes
          yield* update((s) => ({ ...s, activeClashPhase: null }));
          if (i < result.clashes.length - 1) {
            yield* tQuad(CLASH_TIMING.gapMs);
          }
        }

        // 4. Disintegrate phase — surface the dying set with Caretaker A Shield.
        const { dyingP1, dyingP2, shieldedP1, shieldedP2 } =
          computeDyingAndShields(result.clashes, snap.p1Lineup, snap.p2Lineup);

        yield* update((s) => ({
          ...s,
          phase: "disintegrating" as MatchPhase,
          dyingP1: [...dyingP1],
          dyingP2: [...dyingP2],
          shieldedP1: [...shieldedP1],
          shieldedP2: [...shieldedP2],
          animState: "golden-hold" as const,
        }));
        yield* publish({ _tag: "phase-entered", phase: "disintegrating", at: Date.now() });
        yield* t(CLASH_TIMING.disintegrateMs);

        // 5. Apply elimination + tally clash wins.
        const pWins = result.clashes.filter((c) => c.loser === "p2").length;
        const oWins = result.clashes.filter((c) => c.loser === "p1").length;
        const newP1 = snap.p1Lineup.filter((_, idx) => !dyingP1.has(idx));
        const newP2 = snap.p2Lineup.filter((_, idx) => !dyingP2.has(idx));
        // Between-rounds recompute — pass previousChainBonus so The Garden's
        // grace combo can retain a portion of last round's chain bonus
        // (Port 2d, SDD §2.2). The reducer's pre-battle detectCombos calls
        // correctly omit this — grace only applies after round 1.
        const newP1Combos = detectCombos(newP1, {
          weather: snap.weather,
          previousChainBonus: snap.chainBonusAtRoundStart,
        });
        const newP2Combos = detectCombos(newP2, { weather: snap.weather });
        const summary = getComboSummary(newP1Combos);

        yield* update((s) => ({
          ...s,
          p1Lineup: newP1,
          p2Lineup: newP2,
          currentRound: round,
          rounds: [...s.rounds, result],
          p1Combos: newP1Combos,
          p2Combos: newP2Combos,
          chainBonusAtRoundStart: result.gardenGraceFired
            ? result.chainBonusAtRoundEnd
            : summary.totalBonus,
          playerClashWins: s.playerClashWins + pWins,
          opponentClashWins: s.opponentClashWins + oWins,
          stamps: [],
          dyingP1: [],
          dyingP2: [],
          shieldedP1: [],
          shieldedP2: [],
          clashSequence: [],
          visibleClashIdx: -1,
          activeClashPhase: null,
          animState: "idle" as const,
        }));
        yield* publish({ _tag: "round-ended", round, eliminated: result.eliminated });

        // 6. Match continuation: result vs next round.
        const playerEl = snap.playerElement;
        if (newP1.length === 0 && newP2.length === 0) {
          yield* Ref.update(stateRef, (s): MatchSnapshot => ({ ...s, winner: "draw" }));
          if (playerEl) yield* Effect.sync(() => recordMatchOutcome(playerEl, "draw"));
          yield* publish({ _tag: "match-completed", winner: "draw" });
          yield* transition("result");
        } else if (newP1.length === 0) {
          yield* Ref.update(stateRef, (s): MatchSnapshot => ({ ...s, winner: "p2" }));
          if (playerEl) yield* Effect.sync(() => recordMatchOutcome(playerEl, "loss"));
          yield* publish({ _tag: "match-completed", winner: "p2" });
          yield* transition("result");
        } else if (newP2.length === 0) {
          yield* Ref.update(stateRef, (s): MatchSnapshot => ({ ...s, winner: "p1" }));
          if (playerEl) yield* Effect.sync(() => recordMatchOutcome(playerEl, "win"));
          yield* publish({ _tag: "match-completed", winner: "p1" });
          yield* transition("result");
        } else {
          yield* transition("between-rounds");
        }
        yield* Ref.set(fiberRef, null);
      });

    const ensurePhase = (snap: MatchSnapshot, cmd: MatchCommand): Effect.Effect<void, MatchError> =>
      Effect.gen(function* () {
        const valid = validCommandsFor(snap.phase);
        if (!valid.includes(cmd._tag)) {
          // Find phases that DO accept this command (for error message)
          const allPhases: MatchPhase[] = [
            "idle",
            "entry",
            "quiz",
            "select",
            "arrange",
            "committed",
            "clashing",
            "disintegrating",
            "between-rounds",
            "result",
          ];
          const expected = allPhases.filter((p) => validCommandsFor(p).includes(cmd._tag));
          return yield* Effect.fail({
            _tag: "wrong-phase",
            current: snap.phase,
            expected,
          } as const);
        }
      });

    const invoke = (cmd: MatchCommand): Effect.Effect<void, MatchError> =>
      Effect.gen(function* () {
        const snap = yield* Ref.get(stateRef);
        yield* ensurePhase(snap, cmd);

        // Deterministic commands delegate to the pure reducer. This is the
        // ONLY allowed callsite for the synchronous transitions — it makes
        // event publication explicit (no more "forgot to call update()"
        // bug class). See lib/honeycomb/match.reducer.ts.
        if (
          cmd._tag === "begin-match" ||
          cmd._tag === "choose-element" ||
          cmd._tag === "complete-tutorial" ||
          cmd._tag === "tap-position" ||
          cmd._tag === "swap-positions" ||
          cmd._tag === "reset-match"
        ) {
          // reset-match additionally interrupts any in-flight reveal fiber.
          if (cmd._tag === "reset-match") {
            yield* interruptReveal;
          }
          const result = reduce(snap, cmd);
          if ("_tag" in result) {
            return yield* Effect.fail(result satisfies MatchError);
          }
          yield* Ref.set(stateRef, result.next);
          for (const e of result.events) yield* publish(e);
          return;
        }

        // Dev-only escape hatch (NODE_ENV guard + global flag).
        if (cmd._tag === "dev:force-phase" || cmd._tag === "dev:inject-snapshot") {
          const isDev =
            process.env.NODE_ENV !== "production" &&
            (globalThis as { __PURU_DEV__?: { enabled: boolean } }).__PURU_DEV__?.enabled === true;
          if (!isDev) {
            return yield* Effect.fail({
              _tag: "wrong-phase" as const,
              current: snap.phase,
              expected: [],
            });
          }
          if (cmd._tag === "dev:force-phase") {
            yield* interruptReveal;
            yield* update((s) => ({ ...s, phase: cmd.phase }));
            yield* publish({ _tag: "phase-entered", phase: cmd.phase, at: Date.now() });
          } else {
            yield* update((s) => ({ ...s, ...cmd.patch }));
          }
          return;
        }

        switch (cmd._tag) {
          case "lock-in": {
            // p1Lineup is always the live snapshot lineup. Earlier code branched
            // on selectedIndices.length === 5, but choose-element seeds
            // selectedIndices to [0,1,2,3,4] permanently — so on round 2 that
            // branch re-dealt the full collection over the survivors, making
            // dying cards re-appear. (Reported 2026-05-12 mid-cycle.) Always
            // trust snap.p1Lineup; the survivors are already there.
            const p1Lineup = snap.p1Lineup;
            const p2Lineup =
              snap.p2Lineup.length === 0 ? stubOpponentLineup(snap) : snap.p2Lineup;

            const p1Combos = detectCombos(p1Lineup, { weather: snap.weather });
            const p2Combos = detectCombos(p2Lineup, { weather: snap.weather });

            yield* Ref.update(stateRef, (s) => ({
              ...s,
              p1Lineup,
              p2Lineup,
              p1Combos,
              p2Combos,
              selectedIndex: null,
              // Reset round-scoped UI state so previous round's stamps/dying
              // don't bleed into the next reveal.
              stamps: [],
              dyingP1: [],
              dyingP2: [],
              shieldedP1: [],
              shieldedP2: [],
            }));

            yield* publish({ _tag: "lineups-locked" });

            // Run the staggered reveal in the background fiber.
            const round = snap.currentRound + 1;
            const reveal = runRound(round);
            const fiber = yield* Effect.forkDaemon(reveal);
            yield* Ref.set(fiberRef, fiber);
            return;
          }
          case "advance-clash":
          case "advance-round": {
            // The staggered-reveal fiber drives both transitions automatically
            // after `lock-in`. These commands remain valid no-ops so UIs that
            // call them defensively don't blow up. (See runRound below.)
            return;
          }
        }
      });

    return Match.of({
      current: Ref.get(stateRef),
      events: Stream.fromPubSub(pubsub),
      invoke,
    });
  }),
);
