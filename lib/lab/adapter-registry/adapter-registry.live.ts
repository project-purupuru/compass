/**
 * AdapterRegistry · in-memory live implementation
 *
 * Per ADR-12 static registration: the registry is a process-local Map populated
 * at module-load time by VfxRegistry.ts. Lookup is O(1).
 */

import { Effect, Layer, Ref } from "effect";
import { AdapterRegistry } from "./adapter-registry.port";
import type { EffectAdapter } from "./types";

function makeLive() {
  const adapters = new Map<string, EffectAdapter>();

  return Effect.gen(function* () {
    const ref = yield* Ref.make(adapters);
    return AdapterRegistry.of({
      register: (adapter) =>
        Ref.update(ref, (m) => {
          m.set(adapter.primitiveId, adapter);
          return m;
        }),
      get: (id) =>
        Effect.map(Ref.get(ref), (m) => m.get(id) ?? null),
      inspector: (id) =>
        Effect.map(Ref.get(ref), (m) => m.get(id)?.inspector ?? null),
      composability: (id) =>
        Effect.map(Ref.get(ref), (m) => m.get(id)?.composability ?? null),
      list: () =>
        Effect.map(Ref.get(ref), (m) => Array.from(m.keys())),
    });
  });
}

export const AdapterRegistryLive = Layer.effect(AdapterRegistry, makeLive());
