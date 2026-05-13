/**
 * Input-lock owner registry — single source of truth across runtime/sequencer/UI.
 *
 * Per SDD r1 §6.5 (5-state lifecycle):
 *   PRE-COMMIT → COMMAND ENQUEUED → RESOLVER FIRES → SEQUENCER STARTS → LOCK ACQUIRED → LOCK RELEASED
 *
 * Per validation_rules.md:30 — "An input lock owner must be registered and must
 * release or transfer ownership."
 *
 * Per PRD r2 FR-11a + AC-15.
 *
 * `acquireLock` / `releaseLock` / `transferLock` emit InputLocked / InputUnlocked
 * SemanticEvents on the bus passed at construction. UI subscribes via the bus.
 */

import type { ContentId, SemanticEvent } from "../contracts/types";
import type { EventBus } from "./event-bus";

export type LockMode = "soft" | "hard";

export interface LockState {
  readonly ownerId: ContentId;
  readonly mode: LockMode;
  readonly acquiredAt: number;
  readonly maxDurationMs: number;
}

export interface InputLockRegistry {
  acquire(ownerId: ContentId, mode: LockMode, maxDurationMs: number): boolean;
  release(ownerId: ContentId): boolean;
  transfer(fromOwner: ContentId, toOwner: ContentId): boolean;
  getState(): LockState | null;
  isLockedBy(ownerId: ContentId): boolean;
  isLockedByOther(ownerId: ContentId): boolean;
  /** Test-only: clear without firing events. */
  reset(): void;
  /** Test-only: inject a clock for deterministic timestamps. */
  setClock(clock: () => number): void;
}

export function createInputLockRegistry(bus: EventBus): InputLockRegistry {
  let state: LockState | null = null;
  let clock: () => number = () => performance.now();

  const emit = (event: SemanticEvent) => bus.emit(event);

  return {
    acquire(ownerId, mode, maxDurationMs) {
      if (state !== null && state.ownerId !== ownerId) return false;
      // Idempotent: re-acquire by same owner refreshes the state.
      state = { ownerId, mode, acquiredAt: clock(), maxDurationMs };
      emit({ type: "InputLocked", ownerId, mode });
      return true;
    },
    release(ownerId) {
      if (state === null || state.ownerId !== ownerId) return false;
      state = null;
      emit({ type: "InputUnlocked", ownerId });
      return true;
    },
    transfer(fromOwner, toOwner) {
      if (state === null || state.ownerId !== fromOwner) return false;
      const mode = state.mode;
      const maxDurationMs = state.maxDurationMs;
      // Atomic: emit unlock + lock as a pair. Internal state mutates between the two.
      state = null;
      emit({ type: "InputUnlocked", ownerId: fromOwner });
      state = { ownerId: toOwner, mode, acquiredAt: clock(), maxDurationMs };
      emit({ type: "InputLocked", ownerId: toOwner, mode });
      return true;
    },
    getState() {
      return state;
    },
    isLockedBy(ownerId) {
      return state?.ownerId === ownerId;
    },
    isLockedByOther(ownerId) {
      return state !== null && state.ownerId !== ownerId;
    },
    reset() {
      state = null;
    },
    setClock(c) {
      clock = c;
    },
  };
}

/** Failsafe — release lock if held longer than its declared maxDurationMs. */
export function checkLockExpiry(
  registry: InputLockRegistry,
  now: number = performance.now(),
): boolean {
  const state = registry.getState();
  if (state === null) return false;
  const elapsed = now - state.acquiredAt;
  if (elapsed > state.maxDurationMs) {
    registry.release(state.ownerId);
    return true;
  }
  return false;
}
