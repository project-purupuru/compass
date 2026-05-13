/**
 * Beat sequencer — frame-aligned scheduler for PresentationSequence beats.
 *
 * Per PRD r2 D6 + SDD r1 §6 + AC-8 (±16ms tolerance · injectable Clock).
 *
 * Subscribes to event-bus on `CardCommitted`. Looks up sequenceId from card
 * definition. Schedules each beat at its atMs offset via the injected Clock.
 * Dispatches each beat target through the appropriate registry (anchor/actor/
 * UI-mount/audio-bus). Acquires input-lock at lock_input · releases at unlock_input.
 *
 * NEVER mutates GameState (PRD §6.2 invariant 11 + AC-9). Reads via ContentDatabase.
 */

import type {
  ContentDatabase,
  PresentationBeat,
  PresentationSequence,
  SemanticEvent,
} from "../contracts/types";
import type { EventBus } from "../runtime/event-bus";
import type { InputLockRegistry } from "../runtime/input-lock";
import type { AnchorRegistry } from "./anchor-registry";
import type { ActorRegistry } from "./actor-registry";
import type { AudioBusRegistry } from "./audio-bus-registry";
import type { UiMountRegistry } from "./ui-mount-registry";

// CardCommittedEvent type alias (the event the sequencer subscribes to)
type CardCommittedEvent = Extract<SemanticEvent, { type: "CardCommitted" }>;

// ────────────────────────────────────────────────────────────────────────────
// Injectable Clock (per PRD D6)
// ────────────────────────────────────────────────────────────────────────────

export interface Clock {
  now(): number;
  schedule(callback: () => void, atMs: number): void;
}

/** Production: real performance.now + requestAnimationFrame. */
export function createRafClock(): Clock {
  return {
    now: () => performance.now(),
    schedule(callback, atMs) {
      const tick = () => {
        if (performance.now() >= atMs) callback();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
  };
}

/** Test-only: callback fires immediately when called via flush. */
export function createTestClock(): Clock & {
  advance(toMs: number): void;
  flushAll(): void;
} {
  let _now = 0;
  const pending: { atMs: number; callback: () => void }[] = [];
  return {
    now: () => _now,
    schedule(callback, atMs) {
      pending.push({ atMs, callback });
      pending.sort((a, b) => a.atMs - b.atMs);
    },
    advance(toMs) {
      _now = toMs;
      while (pending.length > 0 && pending[0].atMs <= _now) {
        const next = pending.shift()!;
        next.callback();
      }
    },
    flushAll() {
      while (pending.length > 0) {
        const next = pending.shift()!;
        _now = Math.max(_now, next.atMs);
        next.callback();
      }
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Beat dispatch — by target prefix, route to correct registry
// ────────────────────────────────────────────────────────────────────────────

export type BeatTargetKind = "anchor" | "actor" | "ui-mount" | "audio-bus" | "input";

export function classifyBeatTarget(target: string): BeatTargetKind {
  if (target.startsWith("anchor.")) return "anchor";
  if (target.startsWith("actor.") || target.startsWith("daemon.")) return "actor";
  if (target.startsWith("audio.")) return "audio-bus";
  if (target === "ui.input") return "input"; // input-lock surface
  if (target.startsWith("ui.") || target.startsWith("card.") || target.startsWith("zone.") || target.startsWith("vfx.")) {
    return "ui-mount";
  }
  return "ui-mount"; // default fallback
}

export interface BeatFireRecord {
  readonly beatId: string;
  readonly target: string;
  readonly targetKind: BeatTargetKind;
  readonly atMs: number;
  readonly resolved: boolean;
  readonly action: PresentationBeat["action"];
}

// ────────────────────────────────────────────────────────────────────────────
// Sequencer
// ────────────────────────────────────────────────────────────────────────────

export interface SequencerDeps {
  readonly bus: EventBus;
  readonly content: ContentDatabase;
  readonly lock: InputLockRegistry;
  readonly anchors: AnchorRegistry;
  readonly actors: ActorRegistry;
  readonly uiMounts: UiMountRegistry;
  readonly audioBuses: AudioBusRegistry;
  readonly clock: Clock;
  /** Test-only: capture every beat fired. */
  readonly onBeatFired?: (rec: BeatFireRecord) => void;
}

export interface Sequencer {
  /** Manually fire a sequence (used by tests + dry-runs). */
  fire(sequenceId: string, sourceEvent?: CardCommittedEvent): void;
  /** Cleanup subscription. */
  dispose(): void;
}

export function createSequencer(deps: SequencerDeps): Sequencer {
  const unsubscribe = deps.bus.subscribe("CardCommitted", (event) => {
    const card = deps.content.getCardDefinition(event.cardDefinitionId);
    if (!card) {
      console.warn(`[sequencer] unknown card definition: ${event.cardDefinitionId}`);
      return;
    }
    fireSequence(card.presentation.sequenceId, event);
  });

  function fireSequence(sequenceId: string, sourceEvent?: CardCommittedEvent): void {
    const sequence = deps.content.getPresentationSequence(sequenceId);
    if (!sequence) {
      console.warn(`[sequencer] unknown sequence: ${sequenceId}`);
      return;
    }
    const start = deps.clock.now();
    for (const beat of sequence.beats) {
      const fireAt = start + beat.atMs;
      deps.clock.schedule(() => executeBeat(beat, sequence, fireAt, sourceEvent), fireAt);
    }
  }

  function executeBeat(
    beat: PresentationBeat,
    sequence: PresentationSequence,
    atMs: number,
    sourceEvent?: CardCommittedEvent,
  ): void {
    void sourceEvent;
    const targetKind = classifyBeatTarget(beat.target);
    let resolved = false;

    // Special-case input lock/unlock — these go through InputLockRegistry, not a target registry.
    if (beat.action === "lock_input") {
      const ownerId = sequence.inputPolicy.lockOwnerId ?? sequence.id;
      const mode = sequence.inputPolicy.lockMode === "none" ? "soft" : sequence.inputPolicy.lockMode;
      resolved = deps.lock.acquire(ownerId, mode, sequence.inputPolicy.maxLockMs);
    } else if (beat.action === "unlock_input") {
      const ownerId = sequence.inputPolicy.lockOwnerId ?? sequence.id;
      resolved = deps.lock.release(ownerId);
    } else {
      // Resolve target through the appropriate registry
      switch (targetKind) {
        case "anchor":
          resolved = deps.anchors.has(beat.target);
          break;
        case "actor":
          resolved = deps.actors.has(beat.target);
          break;
        case "ui-mount":
          resolved = deps.uiMounts.has(beat.target);
          break;
        case "audio-bus":
          resolved = deps.audioBuses.has(beat.target);
          break;
        case "input":
          resolved = true; // ui.input is implicit
          break;
      }
      // Cycle-1: also check requiresAnchors if present
      if (resolved && beat.requiresAnchors) {
        for (const a of beat.requiresAnchors) {
          if (!deps.anchors.has(a)) {
            resolved = false;
            break;
          }
        }
      }
      if (!resolved) {
        console.warn(`[sequencer] beat ${beat.id} target ${beat.target} unbound — skipping`);
      }
    }

    deps.onBeatFired?.({
      beatId: beat.id,
      target: beat.target,
      targetKind,
      atMs,
      resolved,
      action: beat.action,
    });
  }

  return {
    fire(sequenceId, sourceEvent) {
      fireSequence(sequenceId, sourceEvent);
    },
    dispose() {
      unsubscribe();
    },
  };
}
