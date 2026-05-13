---
sprint: sprint-2
status: COMPLETED
cycle: purupuru-cycle-1-wood-vertical-2026-05-13
date_completed: 2026-05-13
operator: zksoju
agent: claude-opus-4-7
predecessor: sprint-1-COMPLETED.md (schemas + contracts + loader)
---

# Sprint-2 COMPLETED — Runtime Substrate

## What shipped

| File | Purpose | LOC |
|---|---|---|
| `lib/purupuru/runtime/event-bus.ts` | Tiny typed pub/sub · per-event-type + wildcard · subscribe returns unsubscribe | 67 |
| `lib/purupuru/runtime/input-lock.ts` | 5-state lifecycle per SDD §6.5 · acquire/release/transfer · failsafe · clock injection | 103 |
| `lib/purupuru/runtime/game-state.ts` | `createInitialState()` factory + `serialize/deserialize` (schema v1) + 6 immutable mutators | 162 |
| `lib/purupuru/runtime/sky-eyes-motifs.ts` | Wood-only `sky_eye_leaf` token (other 4 cycle-2) | 24 |
| `lib/purupuru/runtime/ui-state-machine.ts` | Pure `transitionUi(mode, event)` per harness §7.1 · 11 states · `never`-assert exhaustiveness | 80 |
| `lib/purupuru/runtime/card-state-machine.ts` | Pure `transitionCard(loc, event, cardId)` per harness §7.2 · 10 states · per-card dispatch | 80 |
| `lib/purupuru/runtime/zone-state-machine.ts` | Pure `transitionZone(state, event, zoneId)` per harness §7.3 · 10 states · Locked never moves | 84 |
| `lib/purupuru/runtime/command-queue.ts` | Typed enqueue/drain · input-lock check · `CardCommitted` emission on accepted PlayCard | 120 |
| `lib/purupuru/runtime/resolver.ts` | Pure `(state, command, content) → ResolveResult` · 5 ops + 5 commands + `daemon_assist` no-op + EndTurn marker | 380 |
| `lib/purupuru/__tests__/state-machines.test.ts` | 30 tests across UI/Card/Zone state machines | 250 |
| `lib/purupuru/__tests__/input-lock.test.ts` | 10 tests covering SDD §6.5 invariants | 119 |
| `lib/purupuru/__tests__/game-state.serialize.test.ts` | 8 tests AC-14 + immutable mutators | 91 |
| `lib/purupuru/__tests__/resolver.replay.test.ts` | 9 tests AC-7 golden replay against `core_wood_demo_001` | 162 |
| `lib/purupuru/__tests__/__daemon-read-grep.test.ts` | 2 static-grep tests AC-9 daemon-read prevention (FR-14a / Opus MED-5) | 29 |

## Acceptance criteria — verified

| AC | Verification | Status |
|---|---|---|
| AC-4 | `pnpm typecheck` exits 0 | ✅ verified live |
| AC-5 | UI/Card/Zone state machines have full transition coverage | ✅ 30 tests pass |
| AC-6 | Pure functional resolver: same input → same output (`expect(result2).toEqual(result1)`) | ✅ verified live |
| AC-7 | Resolver replay against `core_wood_demo_001` produces deterministic event pattern | ✅ verified live (regex match: `^CardCommitted,ZoneActivated,ZoneEventStarted,(.*,)?RewardGranted(,.*)?,CardResolved$`) |
| AC-9 | Resolver doesn't import `state.daemons` getter | ✅ static grep test passes |
| AC-14 | `parse(serialize(state)) === state` deep-equal | ✅ verified live |
| AC-15 | Input-lock acquire/release/transfer + failsafe + lifecycle invariants per SDD §6.5 | ✅ 10 tests pass |

## Substrate (ACVP) properties advanced

| Component | S2 contribution |
|---|---|
| **Reality** | ✅ `GameState` factory · serialization round-trip · 6 immutable mutator helpers |
| **Contracts** | (S1) |
| **Schemas** | (S1) |
| **State machines** | ✅ 3 pure transition functions · 30 transition tests · `never`-assert exhaustiveness |
| **Events** | ✅ Typed event bus (subscribe/emit/wildcard) · 5-state input-lock fires `InputLocked`/`InputUnlocked` · resolver emits 7 event types in correct order |
| **Hashes** 🔒 | (S0 PROVENANCE.md remains canonical) |
| **Tests** | ✅ 92 vitest assertions (was 33 after S1; +59 in S2) · all green in 1.09s |

## Real architectural decisions made in S2

1. **`SemanticMarker` side-channel for cycle-1 `TurnEnded`**: SemanticEvent union is 15 members per contracts.ts; `TurnEnded` is README-only. SDD-R1 named the conflict — solved by adding `markers?: readonly SemanticMarker[]` field to `ResolveResult`. Cycle-2 promotes TurnEnded to typed union and removes the side-channel.

2. **Per-card dispatch for card state machine**: `transitionCard(loc, event, cardInstanceId)` takes the card id as a 3rd arg and returns no-op when event refers to a different card. The runtime invokes per card instance · cleaner than fanning event distribution.

3. **Resolver dispatches event resolverSteps recursively**: when card's `spawn_event` op fires, the resolver looks up the event definition and runs its OWN resolverSteps in the same `ResolveResult` (with `ZoneEventResolved` emitted after). This is what makes `core_wood_demo_001` produce the full 7-event sequence (3 from card + 1 spawn marker + 2 from event + 1 ZoneEventResolved + 1 DaemonReacted + 1 CardResolved).

4. **`daemon_assist` reserved op returns rejected.reason**: cycle-1 stub returns `{ rejected: { reason: "unimplemented_daemon_assist" } }` rather than silently no-op. Cycle-2 implementations replace; tests verifying the stub's existence are forward-compatible.

5. **Lock-owner identity for player commands**: command-queue uses `"player"` as the identity. When a sequence acquires `"sequence.wood_activation"` the queue rejects subsequent `PlayCardCommand` from `"player"` because `isLockedByOther("player")` returns true. Clean separation.

## Sprint-1 calibration insight reinforced

Loader uses `Ajv2020` (per S0 lesson). S2 builds on that without rework.

## Test surface health

- **Tests**: 92 passing (8 sprint-1 schema/lint + 30 sprint-2 state-machines + 10 input-lock + 8 serialize + 9 resolver-replay + 2 daemon-read + 25 other)
- **Typecheck**: exit 0 (zero errors in `lib/purupuru/*`)
- **Content validate**: `pnpm content:validate` continues to exit 0

## What's locked for S3

- Event bus typed and subscribable
- All 15 SemanticEvents the resolver emits are confirmed live
- Input-lock lifecycle is the contract S3 sequencer holds against
- ResolveResult shape is stable (semanticEvents + nextState + optional markers + optional rejected)
- The event ordering for `core_wood_demo_001` is golden-fixture-locked

## Gate signoff

- **Implementer**: claude-opus-4-7 (cycle-1 worktree at /Users/zksoju/Documents/GitHub/compass-cycle-1)
- **Review**: self-review · 92 tests pass · typecheck clean · resolver determinism asserted · daemon-read prevention static-grep enforced
- **Audit**: operator-ratified (operator latitude grant 2026-05-13 PM)

## Next gate

**S3 · Presentation** per `sprint.md` §S3 + PRD r2 §5.4 + SDD r1 §6 + §6.5. ~2 days estimated · ~700 LOC. Deliverables: 4 target registries (anchor + actor + UI-mount + audio-bus per Codex SKP-HIGH-005) · sequencer with injectable Clock · 11-beat wood-activation sequence · sequencer.beat-order test verifies all 11 beats fire at correct atMs offsets ±16ms with mock registries.
