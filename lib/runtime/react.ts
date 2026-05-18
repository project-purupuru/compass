"use client";

import { Effect, Fiber, Stream } from "effect";
import { useEffect, useState } from "react";
import { INITIAL_WEATHER_STATE, type WeatherState } from "@/lib/domain/weather";
import { WeatherFeed } from "@/lib/ports/weather.port";
import { Sonifier, type PlayEventOpts } from "@/lib/ports/sonifier.port";
import {
  MatchEngine,
  type BattleCard,
  type ClashEvent,
  type MatchState,
} from "@/lib/cards/battle";
import { runtime } from "./runtime";

// Subscribe to the WeatherFeed stream + seed with current. React consumers
// don't see the Effect surface — useState semantics only.
export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>(INITIAL_WEATHER_STATE);

  useEffect(() => {
    const fiber = runtime.runFork(
      Effect.gen(function* () {
        const feed = yield* WeatherFeed;
        const initial = yield* feed.current;
        setState(initial);
        yield* Stream.runForEach(feed.stream, (s) => Effect.sync(() => setState(s)));
      }),
    );
    return () => {
      runtime.runFork(Fiber.interrupt(fiber));
    };
  }, []);

  return state;
}

// Imperative sonifier handle backed by the Effect service. Module-level
// + stable so consumers can call from useEffect without adding it to deps
// (matches the prior getSonifier() singleton shape).
export const sonifier = {
  start: (): Promise<void> =>
    runtime.runPromise(
      Effect.gen(function* () {
        const s = yield* Sonifier;
        yield* s.start;
      }),
    ),
  stop: (): void => {
    runtime.runFork(
      Effect.gen(function* () {
        const s = yield* Sonifier;
        yield* s.stop;
      }),
    );
  },
  play: (opts: PlayEventOpts): void => {
    runtime.runFork(
      Effect.gen(function* () {
        const s = yield* Sonifier;
        yield* s.play(opts);
      }),
    );
  },
};

// ── MatchEngine — the clash game on the substrate ───────────────────────────

// Subscribe to the MatchEngine state stream. Seed from `current` first so the
// clash surface has a playable first frame even when `.changes` only emits
// subsequent updates.
export function useMatch(): MatchState | null {
  const [state, setState] = useState<MatchState | null>(null);

  useEffect(() => {
    let active = true;
    runtime
      .runPromise(
        Effect.gen(function* () {
          const engine = yield* MatchEngine;
          return yield* engine.current;
        }),
      )
      .then((initial) => {
        if (active) setState(initial);
      })
      .catch((error: unknown) => {
        console.error("[battle] failed to seed match state", error);
      });

    const fiber = runtime.runFork(
      Effect.gen(function* () {
        const engine = yield* MatchEngine;
        yield* Stream.runForEach(engine.state, (s) =>
          Effect.sync(() => setState(s)),
        );
      }),
    );
    return () => {
      active = false;
      runtime.runFork(Fiber.interrupt(fiber));
    };
  }, []);

  return state;
}

// Run a callback for every clash event the engine publishes — the clash
// trace. `onEvent` should be stable (useCallback) so the subscription isn't
// torn down on every render.
export function useClashEvents(onEvent: (event: ClashEvent) => void): void {
  useEffect(() => {
    const fiber = runtime.runFork(
      Effect.gen(function* () {
        const engine = yield* MatchEngine;
        yield* Stream.runForEach(engine.events, (e) =>
          Effect.sync(() => onEvent(e)),
        );
      }),
    );
    return () => {
      runtime.runFork(Fiber.interrupt(fiber));
    };
  }, [onEvent]);
}

// Imperative MatchEngine handle — module-level + stable, callable from event
// handlers without dep-array churn. Mirrors the `sonifier` handle shape.
export const matchEngine = {
  setLineup: (lineup: readonly BattleCard[]): void => {
    runtime.runFork(
      Effect.gen(function* () {
        const e = yield* MatchEngine;
        yield* e.setLineup(lineup);
      }),
    );
  },
  lockIn: (): void => {
    runtime.runFork(
      Effect.gen(function* () {
        const e = yield* MatchEngine;
        yield* e.lockIn;
      }),
    );
  },
  restart: (): void => {
    runtime.runFork(
      Effect.gen(function* () {
        const e = yield* MatchEngine;
        yield* e.restart;
      }),
    );
  },
};
