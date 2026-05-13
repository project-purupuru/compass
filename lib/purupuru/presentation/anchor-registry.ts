/**
 * Anchor registry — coordinate/position hooks for presentation beats.
 *
 * Per SDD r1 §3 / §6 + Codex SKP-HIGH-005 (4 target registries split).
 *
 * Anchors are declared in zone YAMLs (zone.wood_grove.yaml `anchors:` block) and
 * referenced by sequence beats (e.g., `anchor.wood_grove.seedling_center`).
 *
 * Cycle-1: registry is in-memory map. Cycle-2 will bind to real React refs/Threlte
 * scene objects.
 *
 * Fail-open semantics: if an anchor is unbound at sequence fire-time, the
 * registry returns `undefined` and the sequencer logs a warning (not an error).
 */

import type { ContentId } from "../contracts/types";

export type AnchorId = ContentId;

/** Cycle-1: anchor handles are opaque tokens. Cycle-2 binds to actual scene refs. */
export interface AnchorHandle {
  readonly id: AnchorId;
  readonly registeredAt: number;
}

export interface AnchorRegistry {
  register(id: AnchorId, handle?: Partial<AnchorHandle>): AnchorHandle;
  get(id: AnchorId): AnchorHandle | undefined;
  has(id: AnchorId): boolean;
  unregister(id: AnchorId): boolean;
  reset(): void;
  list(): readonly AnchorId[];
}

export function createAnchorRegistry(): AnchorRegistry {
  const map = new Map<AnchorId, AnchorHandle>();
  return {
    register(id, handle) {
      const h: AnchorHandle = {
        id,
        registeredAt: handle?.registeredAt ?? performance.now(),
      };
      map.set(id, h);
      return h;
    },
    get(id) {
      return map.get(id);
    },
    has(id) {
      return map.has(id);
    },
    unregister(id) {
      return map.delete(id);
    },
    reset() {
      map.clear();
    },
    list() {
      return [...map.keys()];
    },
  };
}
