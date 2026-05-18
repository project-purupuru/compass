/**
 * Battle.live — production implementation of the Battle state machine.
 *
 * v1 surface: selection → arrange → preview → committed. No clash logic yet.
 *
 * Internals:
 *   - state held in Ref for atomic command processing
 *   - events fanned out via PubSub → Stream for subscribers
 *   - whispers fired on phase transitions
 *
 * Deterministic: same seed → same starter collection, same condition,
 * same whisper picks. The view layer can replay any match by passing
 * `reset-match` with the seed.
 */

import { Effect, Layer, PubSub, Ref, Stream } from "effect";
import {
  Battle,
  type BattleCommand,
  type BattleError,
  type BattleEvent,
  type BattlePhase,
  type BattleSnapshot,
} from "./battle.port";
import { type Card, CARD_DEFINITIONS, createCard } from "./cards";
import { detectCombos, getComboSummary } from "./combos";
import { CONDITIONS, type BattleCondition } from "./conditions";
import { DEFAULT_KAIRONIC_WEIGHTS, type KaironicWeights } from "./curves";
import { hashStringToInt, rngFromSeed } from "./seed";
import { whisper } from "./whispers";
import { ELEMENT_ORDER, type Element, getDailyElement } from "./wuxing";

function initialSnapshot(seed: string): BattleSnapshot {
  const rng = rngFromSeed(seed);
  const weather = getDailyElement();
  const opponentElement: Element = rng.pick(ELEMENT_ORDER);
  const condition: BattleCondition = CONDITIONS[opponentElement];
  const collection = generateStarterCollection(rng);
  return {
    phase: "idle",
    seed,
    weather,
    opponentElement,
    condition,
    collection,
    selectedIndices: [],
    lineup: [],
    combos: [],
    comboSummary: { count: 0, totalBonus: 0 },
    kaironic: DEFAULT_KAIRONIC_WEIGHTS,
    lastWhisper: null,
    whisperCounter: 0,
  };
}

/**
 * Starter collection: 12 cards drawn from the 15-base pool.
 * Hackathon: pure RNG. Production: read collection from chain.
 */
function generateStarterCollection(rng: {
  pick: <T>(xs: readonly T[]) => T;
  nextInt: (max: number) => number;
}): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < 12; i++) {
    const def = rng.pick(CARD_DEFINITIONS);
    cards.push(createCard(def, new Date(2026, 4, 12 + i)));
  }
  return cards;
}

export const BattleLive: Layer.Layer<Battle> = Layer.scoped(
  Battle,
  Effect.gen(function* () {
    const stateRef = yield* Ref.make<BattleSnapshot>(initialSnapshot("compass-genesis"));
    const pubsub = yield* PubSub.unbounded<BattleEvent>();

    const publish = (event: BattleEvent) => PubSub.publish(pubsub, event);

    const transition = (phase: BattlePhase): Effect.Effect<void> =>
      Effect.gen(function* () {
        yield* Ref.update(stateRef, (s) => ({ ...s, phase }));
        yield* publish({ _tag: "phase-entered", phase, at: Date.now() });
      });

    const emitWhisper = (
      mood: "win" | "lose" | "draw" | "anticipate" | "stillness",
    ): Effect.Effect<void> =>
      Effect.gen(function* () {
        const snap = yield* Ref.get(stateRef);
        const playerElement = snap.weather;
        // FR-24 / AC-12: deterministic whisper sequence from (seed, counter, mood).
        // Same match seed + same phase-transition order → same whisper lines.
        const seedNum = hashStringToInt(`${snap.seed}|${snap.whisperCounter}|${mood}`);
        const line = whisper(playerElement, mood, seedNum);
        yield* Ref.update(stateRef, (s) => ({
          ...s,
          lastWhisper: line,
          whisperCounter: s.whisperCounter + 1,
        }));
        yield* publish({ _tag: "whisper-emitted", line, element: playerElement });
      });

    const recomputeCombos = (lineup: readonly Card[]): Effect.Effect<void> =>
      Effect.gen(function* () {
        const snap = yield* Ref.get(stateRef);
        const combos = detectCombos(lineup, { weather: snap.weather });
        yield* Ref.update(stateRef, (s) => ({
          ...s,
          combos,
          comboSummary: getComboSummary(combos),
        }));
        yield* publish({ _tag: "combos-detected", combos });
      });

    const invoke = (cmd: BattleCommand): Effect.Effect<void, BattleError> =>
      Effect.gen(function* () {
        const snap = yield* Ref.get(stateRef);
        switch (cmd._tag) {
          case "begin-match": {
            yield* transition("select");
            yield* emitWhisper("anticipate");
            return;
          }
          case "select-card": {
            if (snap.phase !== "select") {
              return yield* Effect.fail({
                _tag: "wrong-phase",
                current: snap.phase,
                expected: ["select"],
              } as const);
            }
            if (cmd.index < 0 || cmd.index >= snap.collection.length) {
              return yield* Effect.fail({
                _tag: "index-out-of-range",
                index: cmd.index,
                bound: snap.collection.length,
              } as const);
            }
            if (snap.selectedIndices.includes(cmd.index) || snap.selectedIndices.length >= 5) {
              return;
            }
            const card = snap.collection[cmd.index];
            if (!card) return;
            yield* Ref.update(stateRef, (s) => ({
              ...s,
              selectedIndices: [...s.selectedIndices, cmd.index],
            }));
            yield* publish({ _tag: "card-selected", index: cmd.index, card });
            return;
          }
          case "deselect-card": {
            yield* Ref.update(stateRef, (s) => ({
              ...s,
              selectedIndices: s.selectedIndices.filter((i) => i !== cmd.index),
            }));
            yield* publish({ _tag: "card-deselected", index: cmd.index });
            return;
          }
          case "proceed-to-arrange": {
            if (snap.phase !== "select") {
              return yield* Effect.fail({
                _tag: "wrong-phase",
                current: snap.phase,
                expected: ["select"],
              } as const);
            }
            if (snap.selectedIndices.length !== 5) {
              return yield* Effect.fail({
                _tag: "lineup-invalid",
                reason: `need 5 cards, have ${snap.selectedIndices.length}`,
              } as const);
            }
            const lineup = snap.selectedIndices.map((i) => snap.collection[i]!).filter(Boolean);
            yield* Ref.update(stateRef, (s) => ({ ...s, lineup }));
            yield* recomputeCombos(lineup);
            yield* transition("arrange");
            return;
          }
          case "rearrange-lineup": {
            if (snap.phase !== "arrange" && snap.phase !== "preview") {
              return yield* Effect.fail({
                _tag: "wrong-phase",
                current: snap.phase,
                expected: ["arrange", "preview"],
              } as const);
            }
            const { from, to } = cmd;
            if (from === to) return;
            const reordered = [...snap.lineup];
            const [moved] = reordered.splice(from, 1);
            if (!moved) return;
            reordered.splice(to, 0, moved);
            yield* Ref.update(stateRef, (s) => ({ ...s, lineup: reordered }));
            yield* recomputeCombos(reordered);
            yield* publish({ _tag: "lineup-rearranged", from, to });
            return;
          }
          case "preview-lineup": {
            if (snap.phase !== "arrange") {
              return yield* Effect.fail({
                _tag: "wrong-phase",
                current: snap.phase,
                expected: ["arrange"],
              } as const);
            }
            yield* transition("preview");
            return;
          }
          case "lock-in": {
            if (snap.phase !== "arrange" && snap.phase !== "preview") {
              return yield* Effect.fail({
                _tag: "wrong-phase",
                current: snap.phase,
                expected: ["arrange", "preview"],
              } as const);
            }
            yield* transition("committed");
            yield* emitWhisper("stillness");
            return;
          }
          case "reset-match": {
            const next = initialSnapshot(cmd.seed ?? `compass-${Date.now()}`);
            yield* Ref.set(stateRef, next);
            yield* publish({ _tag: "seed-reset", seed: next.seed });
            yield* publish({ _tag: "phase-entered", phase: "idle", at: Date.now() });
            return;
          }
          case "tune-kaironic": {
            yield* Ref.update(stateRef, (s) => ({
              ...s,
              kaironic: { ...s.kaironic, ...cmd.weights } satisfies KaironicWeights,
            }));
            const tuned = yield* Ref.get(stateRef);
            yield* publish({ _tag: "kaironic-tuned", weights: tuned.kaironic });
            return;
          }
        }
      });

    return Battle.of({
      current: Ref.get(stateRef),
      events: Stream.fromPubSub(pubsub),
      invoke,
    });
  }),
);
