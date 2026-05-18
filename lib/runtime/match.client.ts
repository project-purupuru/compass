"use client";

/**
 * React integration for the Honeycomb Match service.
 *
 * Mirror of lib/runtime/battle.client.ts but reads from the Match orchestrator
 * which composes Battle + Clash + Opponent. The view layer subscribes to
 * `useMatch()` and never touches Effect directly.
 */

import { Effect, Fiber, Stream } from "effect";
import { useEffect, useRef, useState } from "react";
import {
  Match,
  type MatchCommand,
  type MatchEvent,
  type MatchSnapshot,
} from "@/lib/honeycomb/match.port";
import type { Element } from "@/lib/honeycomb/wuxing";
import { runtime } from "./runtime";

/** Live snapshot of the match state. Re-renders on every published event. */
export function useMatch(): MatchSnapshot | null {
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const lastEventRef = useRef<MatchEvent | null>(null);

  useEffect(() => {
    const fiber = runtime.runFork(
      Effect.gen(function* () {
        const m = yield* Match;
        const initial = yield* m.current;
        setSnapshot(initial);
        yield* Stream.runForEach(m.events, (event) =>
          Effect.gen(function* () {
            lastEventRef.current = event;
            const next = yield* m.current;
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

/** Subscribe to MatchEvent _tag for sound/animation triggers without re-rendering. */
export function useMatchEvent(
  predicate: (event: MatchEvent) => boolean,
  handler: (event: MatchEvent) => void,
): void {
  useEffect(() => {
    const fiber = runtime.runFork(
      Effect.gen(function* () {
        const m = yield* Match;
        yield* Stream.runForEach(m.events, (event) =>
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

/** Imperative command surface · stable, module-level. */
export const matchCommand = {
  dispatch: (cmd: MatchCommand): void => {
    runtime.runFork(
      Effect.gen(function* () {
        const m = yield* Match;
        yield* Effect.catchAll(m.invoke(cmd), (err) =>
          Effect.sync(() => console.warn("[match]", cmd._tag, "rejected:", err)),
        );
      }),
    );
  },
  beginMatch: (seed?: string) => matchCommand.dispatch({ _tag: "begin-match", seed }),
  chooseElement: (element: Element) => matchCommand.dispatch({ _tag: "choose-element", element }),
  completeTutorial: () => matchCommand.dispatch({ _tag: "complete-tutorial" }),
  tapPosition: (index: number) => matchCommand.dispatch({ _tag: "tap-position", index }),
  swapPositions: (a: number, b: number) =>
    matchCommand.dispatch({ _tag: "swap-positions", a, b }),
  lockIn: () => matchCommand.dispatch({ _tag: "lock-in" }),
  advanceClash: () => matchCommand.dispatch({ _tag: "advance-clash" }),
  advanceRound: () => matchCommand.dispatch({ _tag: "advance-round" }),
  resetMatch: (seed?: string) => matchCommand.dispatch({ _tag: "reset-match", seed }),
} as const;
