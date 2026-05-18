/**
 * Collection.mock — deterministic in-memory Layer for tests.
 *
 * Backed by an `Effect.Ref<readonly Card[]>`. Accepts optional initial
 * fixtures so a test can stand up a known collection state (a complete
 * set for burn-eligibility, a partial set for ineligibility). No
 * localStorage, no I/O — fully deterministic. Per SDD §7.4.
 */

import { Effect, Layer, Ref } from "effect";
import type { Card } from "./cards";
import { Collection } from "./collection.port";

export const CollectionMock = (
  initial: readonly Card[] = [],
): Layer.Layer<Collection> =>
  Layer.effect(
    Collection,
    Effect.gen(function* () {
      const ref = yield* Ref.make<readonly Card[]>(initial);
      return Collection.of({
        getAll: () => Ref.get(ref),
        grant: (card) => Ref.update(ref, (cards) => [...cards, card]),
        replaceAll: (cards) => Ref.set(ref, cards),
      });
    }),
  );
