---
sprint: sprint-3
status: COMPLETED
cycle: purupuru-cycle-1-wood-vertical-2026-05-13
date_completed: 2026-05-13
operator: zksoju
agent: claude-opus-4-7
predecessor: sprint-2-COMPLETED.md (runtime substrate)
---

# Sprint-3 COMPLETED — Presentation Layer

## What shipped

| File | Purpose | LOC |
|---|---|---|
| `lib/purupuru/presentation/anchor-registry.ts` | Coordinate hooks · register/get/has/unregister/list | 50 |
| `lib/purupuru/presentation/actor-registry.ts` | Animatable characters (actor.* + daemon.*) | 53 |
| `lib/purupuru/presentation/ui-mount-registry.ts` | UI surfaces (ui.*/card.*/zone.*/vfx.*) · auto-infer kind | 55 |
| `lib/purupuru/presentation/audio-bus-registry.ts` | Audio routing channels | 38 |
| `lib/purupuru/presentation/sequencer.ts` | Beat scheduler + injectable Clock + 4-registry dispatch + input-lock acquire/release | 175 |
| `lib/purupuru/presentation/sequences/wood-activation.ts` | 11-beat TS mirror of sequence.wood_activation.yaml | 154 |
| `lib/purupuru/__tests__/sequencer.beat-order.test.ts` | 9 tests AC-8/9/15 sequencer behavior | 195 |

## Acceptance criteria — verified

| AC | Verification | Status |
|---|---|---|
| AC-8 | Sequencer fires all 11 beats at correct atMs offsets ±16ms via injectable Clock | ✅ verified live (9 sequencer tests · clock.advance(720) → exactly 5 beats fired in correct order) |
| AC-9 | Presentation NEVER mutates GameState · presentation files don't import resolver mutators | ✅ verified live (no `resolver` or `withFoo` imports in presentation/*) |
| AC-15 | Input lock acquired at lock_input · released at unlock_input · sequence.wood_activation as owner | ✅ verified live (lock state transitions exactly at atMs=0 acquire and atMs=2280 release) |

## Substrate (ACVP) properties advanced

| Component | S3 contribution |
|---|---|
| Reality | (S2) |
| Contracts | (S1) |
| Schemas | (S1) |
| State machines | (S2) |
| **Events** ⚡ | ✅ Sequencer subscribes to `CardCommitted` events from event-bus · fires `InputLocked`/`InputUnlocked` via lock registry · dispatches beats through 4 typed registries |
| Hashes 🔒 | (S0) |
| **Tests** | ✅ 101 vitest assertions (was 92 after S2; +9 in S3) · all green in 1.22s |

## 4-registry split (Codex SKP-HIGH-005 resolved)

The sequence YAML beats target 4 distinct namespace categories. The original PRD r0 had a single `anchor-registry`, which Codex flagged as ill-defined because not all targets are coordinate anchors. r1's 4-registry split lands here:

| Registry | Targets | Examples in cycle-1 |
|---|---|---|
| **AnchorRegistry** | `anchor.*` | `anchor.wood_grove.seedling_center`, `anchor.hand.card.center`, `anchor.wood_grove.petal_column`, `anchor.wood_grove.focus_ring`, `anchor.wood_grove.daemon.primary` |
| **ActorRegistry** | `actor.*` + `daemon.*` | `actor.kaori_chibi`, `daemon.wood_puruhani_primary` |
| **UiMountRegistry** | `ui.*` + `card.*` + `zone.*` + `vfx.*` | `card.source`, `vfx.sakura_arc`, `zone.wood_grove`, `ui.reward_preview` |
| **AudioBusRegistry** | `audio.*` | `audio.bus.sfx` |

Special-case: `ui.input` routes through the InputLockRegistry directly (the lock IS the UI input gating mechanism, not a separately mountable surface).

## Injectable Clock (D6 + AC-8 ±16ms)

`createTestClock()` returns a Clock with `.advance(toMs)` + `.flushAll()` for vitest. Production uses `createRafClock()` with real `performance.now()` + `requestAnimationFrame`. Tests assert beat firing through `clock.advance` ticks rather than wall-clock waits — deterministic and fast (101 tests in 1.22s).

## Fail-open semantics (per Opus' SDD §3 vs Codex's SKP-HIGH-005 reconciliation)

When a beat target is unbound at fire-time, the registry returns `undefined` and the sequencer logs a `console.warn` rather than throwing. Beat record's `resolved: false` is captured by the `onBeatFired` test hook. Cycle-1 tests assert this happens for unregistered actor; cycle-2 may tighten to throw on missing required-anchors.

## What's locked for S4

- Sequencer subscribes to event-bus on `CardCommitted` automatically
- 11 beats scheduled via injectable Clock with ±16ms tolerance proven in tests
- Input-lock acquired at lock_input · released at unlock_input · ownership = sequence.wood_activation
- All 4 registries initialized + populated by S4's React `SequenceConsumer` component
- Wood activation sequence is ready to consume via `WOOD_ACTIVATION_SEQUENCE` constant or content-database lookup

## Gate signoff

- **Implementer**: claude-opus-4-7 (cycle-1 worktree at /Users/zksoju/Documents/GitHub/compass-cycle-1)
- **Review**: self-review · 101 tests pass · typecheck clean · 11 beats verified · input-lock lifecycle verified
- **Audit**: operator-ratified (operator latitude grant 2026-05-13 PM)

## Next gate

**S4 · `/battle-v2` Surface** per `sprint.md` §S4 + PRD r2 §5.5 + SDD r1 §5. ~3.5 days estimated · ~1200 LOC. Deliverables: UiScreen wrapper (slot-driven from ui.world_map_screen.yaml) · WorldMap (1 real + 4 locked tiles + Sora Tower) · ZoneToken (10+6 state compose) · CardHandFan (via FR-21a `harnessCardToLayerInput()` adapter) · SequenceConsumer + styles · Playwright E2E + operator visual review (R10 + R11).
