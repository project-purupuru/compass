/**
 * Adapter static-registration · per ADR-12
 *
 * Imports all effect adapters and registers them with AdapterRegistry at
 * module-load time. The lab's vfx-lab page imports this module once at
 * mount; the registry then has all adapters available for lookups.
 *
 * Adding a new effect adapter:
 *   1. Author `app/battle-v2/_components/vfx/effects/<EffectName>Adapter.ts`
 *   2. Export the EffectAdapter
 *   3. Import + push into ADAPTERS below
 *
 * Until each effect has an adapter (S5 retrofit pass per IMP-006), the
 * registry only knows about the registered subset.
 */

import { Effect } from "effect";
import { runtime } from "@/lib/runtime/runtime";
import { AdapterRegistry } from "@/lib/lab/adapter-registry/adapter-registry.port";
import type { EffectAdapter } from "@/lib/lab/adapter-registry/types";
import { cardCompositionAdapter } from "@/app/battle-v2/_components/vfx/effects/CardCompositionAdapter";

// All known adapters · grows in S5
const ADAPTERS: readonly EffectAdapter[] = [
  cardCompositionAdapter,
  // S5 will add: cardLabAdapter, hexSceneAdapter, miniSceneAdapter,
  // bigRealmSceneAdapter, realmSceneAdapter, zoneSceneAdapter,
  // treeFallAdapter, waterSplashAdapter
];

let _registered = false;

/**
 * Register all known adapters with the runtime's AdapterRegistry.
 * Idempotent: subsequent calls are no-ops.
 */
export function ensureAdaptersRegistered(): Promise<void> {
  if (_registered) return Promise.resolve();
  _registered = true;
  const program = Effect.gen(function* () {
    const registry = yield* AdapterRegistry;
    for (const adapter of ADAPTERS) {
      yield* registry.register(adapter);
    }
  });
  return runtime.runPromise(program);
}

export function listRegisteredAdapterIds(): readonly string[] {
  return ADAPTERS.map((a) => a.primitiveId);
}
