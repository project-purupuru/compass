"use client";

/**
 * React integration for the Honeycomb Battle substrate.
 *
 * Same shape as `useWeather` / `sonifier`:
 *   - `useBattle()` hook subscribes to the BattleSnapshot via Stream
 *   - `battleCommand` is an imperative handle for dispatching commands
 *
 * Consumers see useState semantics; no Effect leaks into JSX.
 */

import { Effect, Fiber, Stream } from "effect";
import { useEffect, useRef, useState } from "react";
import {
  Battle,
  type BattleCommand,
  type BattleEvent,
  type BattleSnapshot,
} from "@/lib/honeycomb/battle.port";
import type { KaironicWeights } from "@/lib/honeycomb/curves";
import { runtime } from "./runtime";

/** Live snapshot of the battle state. Re-renders on every published event. */
export function useBattle(): BattleSnapshot | null {
  const [snapshot, setSnapshot] = useState<BattleSnapshot | null>(null);
  const lastEventRef = useRef<BattleEvent | null>(null);

  useEffect(() => {
    const fiber = runtime.runFork(
      Effect.gen(function* () {
        const battle = yield* Battle;
        const initial = yield* battle.current;
        setSnapshot(initial);
        yield* Stream.runForEach(battle.events, (event) =>
          Effect.gen(function* () {
            lastEventRef.current = event;
            const next = yield* battle.current;
            yield* Effect.sync(() => setSnapshot(next));
          }),
        );
      }),
    );
    return () => {
      runtime.runFork(Fiber.interrupt(fiber));
    };
  }, []);

  return snapshot;
}

/**
 * Subscribe to a specific BattleEvent _tag — useful for sound/animation
 * triggers without re-rendering on every snapshot change.
 */
export function useBattleEvent(
  predicate: (event: BattleEvent) => boolean,
  handler: (event: BattleEvent) => void,
): void {
  useEffect(() => {
    const fiber = runtime.runFork(
      Effect.gen(function* () {
        const battle = yield* Battle;
        yield* Stream.runForEach(battle.events, (event) =>
          Effect.sync(() => {
            if (predicate(event)) handler(event);
          }),
        );
      }),
    );
    return () => {
      runtime.runFork(Fiber.interrupt(fiber));
    };
  }, [predicate, handler]);
}

/**
 * Imperative command surface. Module-level + stable.
 * Errors are logged; the snapshot subscription will reflect any phase that
 * actually transitioned.
 */
export const battleCommand = {
  dispatch: (cmd: BattleCommand): void => {
    runtime.runFork(
      Effect.gen(function* () {
        const battle = yield* Battle;
        yield* Effect.catchAll(battle.invoke(cmd), (err) =>
          Effect.sync(() => console.warn("[battle]", cmd._tag, "rejected:", err)),
        );
      }),
    );
  },
  beginMatch: () => battleCommand.dispatch({ _tag: "begin-match" }),
  selectCard: (index: number) => battleCommand.dispatch({ _tag: "select-card", index }),
  deselectCard: (index: number) => battleCommand.dispatch({ _tag: "deselect-card", index }),
  proceedToArrange: () => battleCommand.dispatch({ _tag: "proceed-to-arrange" }),
  rearrange: (from: number, to: number) =>
    battleCommand.dispatch({ _tag: "rearrange-lineup", from, to }),
  previewLineup: () => battleCommand.dispatch({ _tag: "preview-lineup" }),
  lockIn: () => battleCommand.dispatch({ _tag: "lock-in" }),
  resetMatch: (seed?: string) => battleCommand.dispatch({ _tag: "reset-match", seed }),
  tuneKaironic: (weights: Partial<KaironicWeights>) =>
    battleCommand.dispatch({ _tag: "tune-kaironic", weights }),
} as const;
