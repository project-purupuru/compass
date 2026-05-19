/**
 * AdapterRegistry · Effect Context.Tag port
 *
 * Per ADR-12: STATIC module-load registration. Adapters from each effect's
 * `adapter.ts` are imported and registered when the registry module loads.
 * No mount-time race; lab can query inactive effects' capabilities.
 *
 * The actual static-registration manifest lives in
 * `app/battle-v2/_components/vfx/VfxRegistry.ts` — that file imports each
 * effect's adapter and passes them to the registry at app bootstrap.
 */

import { Context, type Effect } from "effect";
import type { EffectAdapter, InspectorAdapter, ComposabilityAdapter } from "./types";

export class AdapterRegistryError {
  readonly _tag = "AdapterRegistryError";
  constructor(readonly reason: string) {}
}

export interface AdapterRegistry {
  /** Register an adapter for a primitive. Idempotent: re-registration replaces. */
  readonly register: (adapter: EffectAdapter) => Effect.Effect<void, never>;
  /** Lookup the full adapter by primitive id. */
  readonly get: (primitiveId: string) => Effect.Effect<EffectAdapter | null, never>;
  /** Get just the inspector adapter by primitive id. */
  readonly inspector: (primitiveId: string) => Effect.Effect<InspectorAdapter | null, never>;
  /** Get just the composability adapter by primitive id. */
  readonly composability: (primitiveId: string) => Effect.Effect<ComposabilityAdapter | null, never>;
  /** List all registered primitive ids. */
  readonly list: () => Effect.Effect<readonly string[], never>;
}

export const AdapterRegistry = Context.GenericTag<AdapterRegistry>(
  "@compass/lab/AdapterRegistry",
);
