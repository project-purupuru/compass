/**
 * Workspace state · live impl
 *
 * In-memory Map keyed by WorkspaceId with active-id Ref + Stream.
 */

import { Effect, Layer, PubSub, Ref, Stream } from "effect";
import { DEFAULT_WORKSPACE_STATE, Workspace, type WorkspaceId, type WorkspaceState } from "./workspace.port";

function makeLive() {
  return Effect.gen(function* () {
    const states = yield* Ref.make<Map<WorkspaceId, WorkspaceState>>(
      new Map([
        ["build", DEFAULT_WORKSPACE_STATE],
        ["library", DEFAULT_WORKSPACE_STATE],
      ]),
    );
    const activeRef = yield* Ref.make<WorkspaceId>("build");
    const pubsub = yield* PubSub.unbounded<WorkspaceId>();

    return Workspace.of({
      active: Ref.get(activeRef),
      switch: (id) =>
        Effect.gen(function* () {
          yield* Ref.set(activeRef, id);
          yield* PubSub.publish(pubsub, id);
        }),
      get: (id) =>
        Effect.map(Ref.get(states), (m) => m.get(id) ?? DEFAULT_WORKSPACE_STATE),
      update: (id, patch) =>
        Ref.update(states, (m) => {
          const current = m.get(id) ?? DEFAULT_WORKSPACE_STATE;
          m.set(id, { ...current, ...patch });
          return m;
        }),
      stream: Stream.fromPubSub(pubsub),
    });
  });
}

export const WorkspaceLive = Layer.effect(Workspace, makeLive());
