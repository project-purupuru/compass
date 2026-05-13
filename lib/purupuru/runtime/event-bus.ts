/**
 * Tiny typed event bus for SemanticEvent stream.
 *
 * Per PRD r2 D5 + SDD r1 §3.5 / §4. No external dep (no Effect.PubSub, no mitt).
 * Per-event-type subscribers + a wildcard "*" for catch-all.
 *
 * Subscribe returns an unsubscribe function the consumer MUST call on unmount
 * to avoid memory leaks (see PRD §6.3 performance).
 */

import type { SemanticEvent } from "../contracts/types";

export type EventType = SemanticEvent["type"];

export type EventHandler<T extends EventType = EventType> = (
  event: Extract<SemanticEvent, { type: T }>,
) => void;

export type WildcardHandler = (event: SemanticEvent) => void;

export interface EventBus {
  emit(event: SemanticEvent): void;
  subscribe<T extends EventType>(type: T, handler: EventHandler<T>): () => void;
  subscribeAll(handler: WildcardHandler): () => void;
  /** Test-only: drop all subscribers. */
  reset(): void;
}

export function createEventBus(): EventBus {
  const handlers = new Map<EventType, Set<EventHandler>>();
  const wildcards = new Set<WildcardHandler>();

  return {
    emit(event) {
      const set = handlers.get(event.type);
      if (set) {
        for (const h of set) (h as EventHandler)(event);
      }
      for (const h of wildcards) h(event);
    },
    subscribe<T extends EventType>(type: T, handler: EventHandler<T>): () => void {
      let set = handlers.get(type);
      if (!set) {
        set = new Set();
        handlers.set(type, set);
      }
      const wrapped = handler as unknown as EventHandler;
      set.add(wrapped);
      return () => {
        const s = handlers.get(type);
        if (s) s.delete(wrapped);
      };
    },
    subscribeAll(handler) {
      wildcards.add(handler);
      return () => {
        wildcards.delete(handler);
      };
    },
    reset() {
      handlers.clear();
      wildcards.clear();
    },
  };
}

/** A shared singleton bus for runtime use. Tests should create their own via createEventBus(). */
export const eventBus: EventBus = createEventBus();
