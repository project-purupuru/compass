/**
 * Pointer-chain resolver · live impl
 *
 * Delegates to AdapterRegistry · per ADR-12 static registration.
 */

import { Effect, Layer } from "effect";
import { AdapterRegistry } from "../adapter-registry/adapter-registry.port";
import { PointerChainResolver } from "./pointer-chain.port";

export const PointerChainResolverLive = Layer.effect(
  PointerChainResolver,
  Effect.gen(function* () {
    const registry = yield* AdapterRegistry;
    return PointerChainResolver.of({
      resolve: (primitiveId, nodeId) =>
        Effect.gen(function* () {
          const inspector = yield* registry.inspector(primitiveId);
          if (!inspector) return null;
          return inspector.resolveChain(nodeId);
        }),
    });
  }),
);
