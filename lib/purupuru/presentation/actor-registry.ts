/**
 * Actor registry — animatable character handles for presentation beats.
 *
 * Per SDD r1 §3 / §6 + Codex SKP-HIGH-005. Includes both `actor.*` and
 * `daemon.*` namespaces (both are animatable scene objects).
 */

import type { ContentId } from "../contracts/types";

export type ActorId = ContentId;

export interface ActorHandle {
  readonly id: ActorId;
  readonly kind: "actor" | "daemon";
  readonly registeredAt: number;
}

export interface ActorRegistry {
  register(id: ActorId, kind?: "actor" | "daemon"): ActorHandle;
  get(id: ActorId): ActorHandle | undefined;
  has(id: ActorId): boolean;
  unregister(id: ActorId): boolean;
  reset(): void;
  list(): readonly ActorId[];
}

export function createActorRegistry(): ActorRegistry {
  const map = new Map<ActorId, ActorHandle>();
  return {
    register(id, kind = "actor") {
      const inferred = id.startsWith("daemon.") ? "daemon" : kind;
      const h: ActorHandle = {
        id,
        kind: inferred,
        registeredAt: performance.now(),
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
