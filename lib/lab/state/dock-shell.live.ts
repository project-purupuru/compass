/**
 * DockShell state · Live impl · cycle-2 S4.1
 *
 * In-memory Ref + PubSub Stream + localStorage sync. Hydrates from
 * localStorage on Layer construction · writes back on every update.
 *
 * Corruption-recovery (S4.6 AC): malformed localStorage payload falls back
 * to DEFAULT_DOCK_SHELL_STATE silently. The defective payload is overwritten
 * on the next state change.
 */

import { Effect, Layer, PubSub, Ref, Stream } from "effect";

import {
  DEFAULT_DOCK_SHELL_STATE,
  decodeDockShellState,
  encodeDockShellState,
  STORAGE_KEY,
  type DockShellState,
} from "./dock-shell.schema";
import { DockShell } from "./dock-shell.port";

function hydrate(): DockShellState {
  if (typeof window === "undefined") return DEFAULT_DOCK_SHELL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return decodeDockShellState(raw) ?? DEFAULT_DOCK_SHELL_STATE;
  } catch {
    return DEFAULT_DOCK_SHELL_STATE;
  }
}

function persist(state: DockShellState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, encodeDockShellState(state));
  } catch {
    // silent · localStorage may be full or disabled · UI keeps working
  }
}

function makeLive() {
  return Effect.gen(function* () {
    const ref = yield* Ref.make<DockShellState>(hydrate());
    const pubsub = yield* PubSub.unbounded<DockShellState>();

    return DockShell.of({
      read: Ref.get(ref),
      update: (patch) =>
        Effect.gen(function* () {
          const next = yield* Ref.updateAndGet(ref, (current) => ({
            ...current,
            ...patch,
          }));
          persist(next);
          yield* PubSub.publish(pubsub, next);
        }),
      reset: Effect.gen(function* () {
        yield* Ref.set(ref, DEFAULT_DOCK_SHELL_STATE);
        persist(DEFAULT_DOCK_SHELL_STATE);
        yield* PubSub.publish(pubsub, DEFAULT_DOCK_SHELL_STATE);
      }),
      stream: Stream.fromPubSub(pubsub),
    });
  });
}

export const DockShellLive = Layer.effect(DockShell, makeLive());
