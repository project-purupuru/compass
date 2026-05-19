/**
 * Inspector state · live impl (in-memory Ref + Stream via PubSub)
 *
 * Per SDD §2.2: memory storage. Tab close clears state.
 */

import { Effect, Layer, PubSub, Ref, Stream } from "effect";
import { InspectorState, type Selection } from "./inspector.port";

function makeLive() {
  return Effect.gen(function* () {
    const ref = yield* Ref.make<Selection | null>(null);
    const pubsub = yield* PubSub.unbounded<Selection | null>();

    return InspectorState.of({
      current: Ref.get(ref),
      select: (sel) =>
        Effect.gen(function* () {
          yield* Ref.set(ref, sel);
          yield* PubSub.publish(pubsub, sel);
        }),
      clear: () =>
        Effect.gen(function* () {
          yield* Ref.set(ref, null);
          yield* PubSub.publish(pubsub, null);
        }),
      stream: Stream.fromPubSub(pubsub),
    });
  });
}

export const InspectorStateLive = Layer.effect(InspectorState, makeLive());
