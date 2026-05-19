/**
 * Pointer-chain resolver · Effect Context.Tag port
 *
 * Per FR-S2.5 + ADR-13: resolves the canonical pointer chain for a
 * (primitiveId, nodeId) tuple by delegating to the AdapterRegistry.
 *
 * Consumers:
 *   - Breadcrumb (S2 · top sticky bar)
 *   - Inspector PointerChainTab (S2 · right rail)
 *   - Composability panel rows (S3 · shape B inline)
 */

import { Context, type Effect } from "effect";
import type { PointerChain } from "./schema";

export interface PointerChainResolver {
  /** Resolve the canonical chain for a primitive node. Null if unknown. */
  readonly resolve: (primitiveId: string, nodeId: string) => Effect.Effect<PointerChain | null, never>;
}

export const PointerChainResolver = Context.GenericTag<PointerChainResolver>(
  "@compass/lab/PointerChainResolver",
);
