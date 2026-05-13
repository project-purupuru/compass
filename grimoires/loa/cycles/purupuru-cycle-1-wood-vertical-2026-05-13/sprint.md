---
status: ready-for-implementation
type: sprint-plan
cycle: purupuru-cycle-1-wood-vertical-2026-05-13
mode: ARCH (Ostrom) + SHIP (Barth) + craft lens (Alexander)
prd: grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/prd.md
sdd: grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/sdd.md
branch: feat/hb-s7-devpanel-audit (may rebase to feat/purupuru-cycle-1 before S1 starts)
created: 2026-05-13
revision: r0
operator: zksoju
authored_by: /sprint-plan (Opus 4.7 1M)
sprint_count: 6
total_loc_budget: 4500
total_estimated_loc: 4300
total_estimated_days: 13
---

# Sprint Plan · Purupuru Cycle 1 · Wood Vertical Slice

**Version:** 1.0
**Date:** 2026-05-13
**Author:** Sprint Planner (Opus 4.7 1M)
**PRD Reference:** `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/prd.md` (r1 · flatline-integrated · 441 lines)
**SDD Reference:** `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/sdd.md` (r0 · ready-for-sprint-plan · 724 lines)

---

## Executive Summary

Build the foundational simulation + presentation contracts of Purupuru in a NEW namespace `lib/purupuru/`, shipping a single playable element (**Wood**) end-to-end through the full pipe: schema-validated card data → command-emitting resolver → semantic-event stream → presentation sequence player → live React surface at `/battle-v2`. Existing code (`lib/cards/layers/`, `lib/honeycomb/`, `app/battle/`) is preserved as superset architecture per **D1** (greenfield namespace with named integration seams).

The cycle ships in **6 sprints** (S0 calibration spike + S1-S5 implementation). Each sprint independently clears `/implement → /review-sprint → /audit-sprint`. The cycle COMPLETED marker requires green on all 6 gates.

**Done bar** (operator-ratified): at `/battle-v2`, the player hovers wood card → sees ValidTarget pulse on wood grove → clicks grove → sees sakura petal arc → sees seedling-impact pulse → sees local sakura weather → sees chibi-Kaori gesture → sees daemon-reaction (presentation-only) → sees reward-preview → sees input unlock. The **11-beat sequence** (`lock_input` at 0ms → `unlock_input` at 2280ms) plays deterministically against a serialized fixture.

**Total Sprints:** 6
**Total Estimated LOC:** ~4,300 (under PRD AC-17 cap of +4,500 · ~4% headroom)
**Total Estimated Duration:** ~13 days
**Estimated Completion:** 2026-05-26 (S0 + S1-S5 sequential, no parallelization due to layer dependencies)

> Sprint duration NOTE — Per `resources/templates/sprint-template.md`, the framework default is 2.5 days. This cycle uses SDD §10 per-sprint estimates that reflect actual layer-specific complexity (S0: 0.5d · S1: 2.5d · S2: 3d · S3: 2d · S4: 3.5d · S5: 1.5d).

---

## Sprint Overview

| Sprint | Theme | Days | LOC | Key Deliverables | Dependencies |
|--------|-------|------|-----|------------------|--------------|
| **S0** | Lightweight calibration spike (AJV + harness composability) | 0.5 | ~80 (deleted post-audit) | `scripts/s0-spike-ajv-element-wood.ts`; AJV validates one YAML | None |
| **S1** | Schemas + Contracts + Loader + Design-Lint | 2.5 | ~900 | 8 schemas + 8 YAMLs + `validation_rules.md` vendored; `loader.ts` + `validate-content.ts` + 5 design-lints | S0 |
| **S2** | Runtime: GameState + State Machines + Resolver | 3.0 | ~1,100 | Pure-functional resolver (5 ops + 5 commands); 3 state machines; event-bus + input-lock; golden replay test | S1 |
| **S3** | Presentation: 4 Target Registries + Sequencer + Wood Sequence | 2.0 | ~700 | 4 registries (anchor/actor/UI-mount/audio-bus); sequencer; 11-beat wood-activation sequence | S2 |
| **S4** | `/battle-v2` surface · 1 real zone + 4 locked tiles | 3.5 | ~1,200 | Route shell + UiScreen + WorldMap + ZoneToken + CardHandFan + adapter + SequenceConsumer | S3 |
| **S5** | Integration + ONE-event Telemetry + Docs + Final Gate | 1.5 | ~400 | Registry export; JSONL telemetry; cycle README; CYCLE-COMPLETED marker | S4 |
| **TOTAL** | — | **13** | **~4,300** | — | — |

---

## Sprint 0: Lightweight Calibration Spike

**Scope:** SMALL (1 task)
**Duration:** ~0.5 day
**Branch:** `feat/hb-s7-devpanel-audit` (or rebase target)

### Sprint Goal
Confirm AJV + vendored harness schemas + YAML examples compose without errors *before* S1 commits 900 LOC. Surface integration friction in a delete-after-spike script.

### Deliverables
- [ ] Spike script at `scripts/s0-spike-ajv-element-wood.ts` vendors `element.schema.json` + `element.wood.yaml` to a scratch directory, runs AJV validation, exits 0 on success
- [ ] Report at `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/sprint-0-COMPLETED.md` documenting outcome and any integration friction discovered
- [ ] Spike script deleted after audit-sprint approves S0 (net LOC delta: 0)

### Acceptance Criteria
- [ ] **AC-0**: `pnpm tsx scripts/s0-spike-ajv-element-wood.ts` exits 0 with AJV "valid" output
- [ ] sprint-0-COMPLETED.md confirms feasibility (or names blocker for re-recalibration before S1 starts)
- [ ] Script removed in S0-close commit (`git diff --stat` shows zero net additions for the spike file)

### Technical Tasks

> Tasks annotated with contributing goal(s): → **[G-N]**. PRD goals G1-G10 are defined in `prd.md §2.1-2.2`.

- [ ] **S0-T1**: Author spike script · `scripts/s0-spike-ajv-element-wood.ts` · load `element.schema.json` from harness source · load `element.wood.yaml` · run `ajv.validate()` · log structured pass/fail + AJV errors · exit code reflects outcome → **[G-3]** (validates the schema-vendoring path before bulk vendoring)
- [ ] **S0-T2**: Author `sprint-0-COMPLETED.md` with explicit "AJV composability: confirmed | needs recalibration" verdict, any friction notes, and the green-gate signoff → **[G-6]**
- [ ] **S0-T3**: Delete `scripts/s0-spike-ajv-element-wood.ts` in S0-close commit (only after audit approves) → **[G-6]**

### Dependencies
- None (this is the first sprint; opens the cycle)

### Security Considerations
- **Trust boundaries**: Spike script is dev-time only; no runtime exposure
- **External dependencies**: Uses `ajv` (^8.20.0) + `ajv-formats` (^3.0.1) — both ALREADY in `package.json` (verified per PRD FR-6 / SDD §2.2)
- **Sensitive data**: None — harness YAMLs are content data only, no secrets

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AJV strict mode rejects harness schema patterns (e.g., `$ref` resolution) | Low | High | If S0 fails, recalibrate at S0 close *before* S1 commits 900 LOC. Per PRD R2 / R8. |
| Spike script accidentally retained, inflating LOC budget | Low | Low | Audit checklist requires deletion before S0-COMPLETED marker is signed |

### Success Metrics
- AJV validates `element.wood.yaml` against `element.schema.json` in <100ms (per PRD §6.3)
- 0 net LOC delta from spike (script deleted post-audit)
- S1 can proceed without architectural revision

---

## Sprint 1: Schemas + Contracts + Loader + Design-Lint

**Scope:** LARGE (7 tasks)
**Duration:** ~2.5 days
**LOC Budget:** ~900

### Sprint Goal
Vendor the 8 canonical JSON schemas, 8 worked YAML examples, and `validation_rules.md` from the harness into `lib/purupuru/`. Author the TypeScript contracts file (15-member SemanticEvent union + 6-op ResolverOpKind enum) and the YAML loader with AJV validation + 5 cycle-1 design-lint checks.

### Deliverables
- [ ] 8 JSON schemas vendored to `lib/purupuru/schemas/*.schema.json`
- [ ] 8 worked YAML examples vendored to `lib/purupuru/content/wood/*.yaml`
- [ ] `validation_rules.md` vendored verbatim to `lib/purupuru/contracts/validation_rules.md`
- [ ] `lib/purupuru/contracts/types.ts` hand-authored with 15-member SemanticEvent union (per SDD §3.2), 5-member GameCommand union, 6-member ResolverOpKind enum
- [ ] `lib/purupuru/content/loader.ts` reads YAML → AJV-validates → returns typed objects; pack manifest treated as PROVENANCE-ONLY (loader discovers via directory walk)
- [ ] `scripts/validate-content.ts` CLI walks `lib/purupuru/content/wood/*.yaml`, AJV-validates each, runs 5 design-lint checks
- [ ] `package.json` adds `js-yaml` ^4 dependency + `content:validate` script (`ajv` + `ajv-formats` already present)

### Acceptance Criteria
- [ ] **AC-1**: `ls lib/purupuru/schemas/*.schema.json | wc -l` returns 8
- [ ] **AC-2**: `ls lib/purupuru/content/wood/*.yaml | wc -l` returns 8 (element · card · zone · event · sequence · ui · pack · telemetry)
- [ ] **AC-2a**: `lib/purupuru/contracts/validation_rules.md` exists (verbatim from harness)
- [ ] **AC-3**: `pnpm content:validate` exits 0; Vitest `lib/purupuru/__tests__/schema.validate.test.ts` green
- [ ] **AC-3a**: Vitest `lib/purupuru/__tests__/design-lint.test.ts` green for `pack.core_wood_demo.yaml` (5 lints: wood-verbs · localized-weather-scope · input-lock-unlock-or-fallback · no-undefined-zone-tags · no-locked-ops-in-non-core-packs)
- [ ] **AC-4**: `pnpm typecheck` exits 0 with no `lib/purupuru/` namespace errors

### Technical Tasks
- [ ] **S1-T1**: Vendor 8 JSON schemas from `~/Downloads/purupuru_architecture_harness/schemas/` → `lib/purupuru/schemas/` · verify `$id` + `$schema` headers preserved → **[G-3]**
- [ ] **S1-T2**: Hand-author `lib/purupuru/contracts/types.ts` per SDD §3 sketches: ElementId · EntityId · ContentId · LocalizationKey · UiMode (11 states) · CardLocation (10 states) · ZoneState (10 states · including InvalidTarget) · DaemonState (6 states) · 15-member SemanticEvent discriminated union · 5-member GameCommand union · 6-member ResolverOpKind enum (5 cycle-1 + `daemon_assist` reserved per Q-SDD-4) · ResolverStep · ResolveResult · CommandResolver interface → **[G-1, G-3]**
- [ ] **S1-T2a**: Vendor `validation_rules.md` verbatim from `~/Downloads/purupuru_architecture_harness/contracts/validation_rules.md` to `lib/purupuru/contracts/validation_rules.md` (Opus BLK-1 closure) → **[G-3]**
- [ ] **S1-T3**: Vendor 8 worked YAML examples from `~/Downloads/purupuru_architecture_harness/examples/` → `lib/purupuru/content/wood/` (element.wood · card.wood_awakening · zone.wood_grove · event.wood_spring_seedling · sequence.wood_activation · ui.world_map_screen · pack.core_wood_demo · telemetry.card_activation_clarity) → **[G-3]**
- [ ] **S1-T4**: Author `lib/purupuru/content/loader.ts` per SDD §8 · `loadCard` / `loadZone` / `loadEvent` / `loadSequence` / `loadElement` / `loadUiScreen` / `loadTelemetry` functions · `loadPack(dir)` directory-walk with `inferKind()` from filename prefix · normalize YAML `resolver.steps` → TS `resolverSteps` (camelCase per PRD D2) · pack manifest paths IGNORED at runtime (provenance-only per Codex SKP-MEDIUM-002) → **[G-3]**
- [ ] **S1-T5**: Author `scripts/validate-content.ts` · walks `lib/purupuru/content/wood/*.yaml` · AJV-validates each against `inferKind`-resolved schema · runs 5 design-lint checks per SDD §9 (wood-verbs ⊆ element.wood.verbs · localized-weather-target-zone-only · input-lock-ends-in-unlock-or-fallback · no-undefined-zone-tags · no-locked-resolver-ops-in-non-core-packs) · exits non-zero on any failure with `file:line + lint-rule-id + offending-value` to stderr → **[G-3]**
- [ ] **S1-T6**: Modify `package.json` · add `js-yaml` ^4 to `dependencies` · add `"content:validate": "tsx scripts/validate-content.ts"` to `scripts` · run `pnpm install` to lockfile-update · verify `ajv` ^8.20.0 + `ajv-formats` ^3.0.1 already present (no-op) → **[G-3]**
- [ ] **S1-T7**: Author `lib/purupuru/__tests__/schema.validate.test.ts` (AC-1 + AC-2 + AC-3 enforcement) + `lib/purupuru/__tests__/design-lint.test.ts` (AC-3a enforcement) · vitest parameterized over all 8 YAMLs · failure asserts cite filename + AJV error path → **[G-3, G-6]**

### Dependencies
- **S0**: AJV + harness schema composability confirmed (AC-0)

### Security Considerations
- **Trust boundaries**: All vendored content is read-only at load time; loader rejects malformed YAML before passing to AJV
- **External dependencies**: NEW `js-yaml` ^4 (well-maintained, ~4M weekly downloads, no native code) — pin major version per existing `package.json` convention
- **Sensitive data**: None — content YAMLs carry game-design data only

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Harness YAMLs have implicit cross-references (e.g., `card.targetingTypes` referencing schema not yet vendored) | Med | High | S1-T7 schema.validate test parameterized over all 8 YAMLs; failure exposes missing schema before S2 starts. PRD R2 + R5. |
| `js-yaml` v4 parses tags differently than harness author expected | Low | Med | Loader uses default safe-load mode; flag any YAML-tag failures in CI |
| 5 design-lint checks have false positives for cycle-1 wood pack | Low | Low | AC-3a explicitly scoped to `pack.core_wood_demo.yaml` only; cycle 2 extends per Codex SKP-MEDIUM-004 |

### Success Metrics
- `pnpm content:validate` runtime < 500ms for full 8-YAML pack
- 100% schema coverage: every vendored YAML has a corresponding schema
- 0 TypeScript errors in `lib/purupuru/` namespace post-vendoring

---

## Sprint 2: Runtime · GameState + State Machines + Event Bus + Input Lock + Resolver

**Scope:** LARGE (6 tasks)
**Duration:** ~3 days
**LOC Budget:** ~1,100

### Sprint Goal
Ship the pure-functional simulation core: `GameState` factory, 3 state machines (UI/Card/Zone), event-bus, input-lock with owner registry, command-queue, and the resolver implementing 5 ops + 5 commands. Pass the golden replay fixture deterministically.

### Deliverables
- [ ] `lib/purupuru/runtime/game-state.ts` with `GameState` interface + `createInitialState(runId, dayElementId)` factory + serializer
- [ ] `lib/purupuru/runtime/{ui,card,zone}-state-machine.ts` — three pure `transition()` functions per harness §7.1-7.3
- [ ] `lib/purupuru/runtime/event-bus.ts` — minimal typed pub/sub (no external dep per PRD D5)
- [ ] `lib/purupuru/runtime/input-lock.ts` — `acquireLock` / `releaseLock` / `transferLock` with owner registry per FR-11a
- [ ] `lib/purupuru/runtime/command-queue.ts` — typed enqueue/drain; emits `CardCommitted` on accepted PlayCard
- [ ] `lib/purupuru/runtime/resolver.ts` — pure `resolve(state, command, content)` with 5 ops (`activate_zone` + `spawn_event` + `grant_reward` + `set_flag` + `add_resource`) + 5 commands (PlayCard full pipe; EndTurn no-op stub; ActivateZone/SpawnEvent/GrantReward system-only)
- [ ] `lib/purupuru/runtime/sky-eyes-motifs.ts` — wood-only declaration: `sky_eye_leaf` per harness terminology (Opus HIGH-4)
- [ ] Static grep test `__daemon-read-grep.test.ts` ensures resolver does NOT import `daemons` getter from game-state (Opus MED-5)

### Acceptance Criteria
- [ ] **AC-4**: TypeScript compiles against contracts.ts in `lib/purupuru/runtime/` (extends S1's AC-4 to runtime layer)
- [ ] **AC-5**: All 3 state machines (UI / Card / Zone) have full transition coverage per harness §7.1-7.3; Vitest `state-machines.test.ts` exhaustive switch with `never`-assert fallback
- [ ] **AC-6**: Resolver is referentially transparent: same `(state, command, content)` → byte-equal `ResolveResult` (deep-equal assertion on 2 consecutive calls)
- [ ] **AC-7**: Replay test serializes `core_wood_demo_001` fixture from `validation_rules.md:36-81`, runs resolver, asserts exact 5-event sequence: `CardCommitted → ZoneActivated → ZoneEventStarted → DaemonReacted → RewardGranted` (RewardGranted may fire 1+ times per event reward count)
- [ ] **AC-9** (resolver-side): No file under `lib/purupuru/runtime/resolver*.ts` imports `daemons` from `game-state.ts` (static grep test green)
- [ ] **AC-14**: `parse(serialize(state)) === state` deep-equal for all GameState shapes; schema versioning honored
- [ ] **AC-15**: Input-lock invariants per `validation_rules.md:30` — acquire/release/transfer must keep owner registry consistent

### Technical Tasks
- [ ] **S2-T1**: Author `lib/purupuru/runtime/game-state.ts` + `event-bus.ts` + `input-lock.ts` + `command-queue.ts` per SDD §10 LOC ~350. GameState includes `runId · dayElementId · turn · zones · hand · deck · discard · exhausted · resources · flags · daemons · weather · lockOwners[]`. Event-bus: `subscribe(eventType, handler) → unsubscribe`, `emit(event)`. Input-lock: `acquireLock(ownerId, mode)` + `releaseLock(ownerId)` + `transferLock(fromId, toId)`. Command-queue emits `CardCommitted` on accepted PlayCard enqueue. → **[G-1]**
- [ ] **S2-T2**: Author `lib/purupuru/runtime/{ui,card,zone}-state-machine.ts` per SDD §4 + harness §7.1-7.3. Pure `transition(state, event)` functions. Exhaustive switch on `event.type` with `never`-assert fallback. ZoneStateMachine includes 10 states (Locked → Idle → ValidTarget → InvalidTarget → Previewed → Active → Resolving → Afterglow → Resolved → Exhausted). Card invariant per `validation_rules.md:26-27`: card cannot exist in 2 locations. → **[G-1]**
- [ ] **S2-T3**: Author `lib/purupuru/runtime/resolver.ts` per SDD §7 sketch. 5-op `executeOp(step, state, content, target)` switch covers `activate_zone` · `spawn_event` · `grant_reward` · `set_flag` · `add_resource`, plus `daemon_assist` no-op stub returning `{ ok: false, reason: "unimplemented" }` per Q-SDD-4. 5-command top-level `resolve()` switch covers PlayCard (full pipe) · EndTurn (no-op stub emitting `TurnEnded` marker per SDD-R1) · ActivateZone · SpawnEvent · GrantReward. PlayCard pre-flight: lock-not-held check (FR-11a) + targeting validation. → **[G-1, G-3, G-5]**
- [ ] **S2-T4**: Author `lib/purupuru/runtime/sky-eyes-motifs.ts` declaring wood-only persistent-motif token `wood: "sky_eye_leaf"` per `element.wood.yaml:31` + Opus HIGH-4 terminology fix. Other 4 elements deferred to cycle 2. → **[G-10]**
- [ ] **S2-T5**: Author runtime tests under `lib/purupuru/__tests__/`: `state-machines.test.ts` (parameterized matrix of (state, event) → expected next state · AC-5); `resolver.replay.test.ts` (golden fixture `core_wood_demo_001` · AC-7) including determinism assertion (AC-6); `input-lock.test.ts` (acquire/release/transfer invariants · AC-15); `game-state.serialize.test.ts` (parse(serialize(x)) === x · AC-14). → **[G-5, G-6]**
- [ ] **S2-T6**: Author `lib/purupuru/__tests__/__daemon-read-grep.test.ts` — static check (read file contents via `node:fs`) asserts no file matching `lib/purupuru/runtime/resolver*.ts` imports `daemons` getter from `game-state.ts`. Enforces D10 + Opus MED-5 daemon-behavior-read prevention. → **[G-6]**

### Dependencies
- **S1**: Contracts types.ts (the 15-member SemanticEvent union + 6-member ResolverOpKind enum) must be importable
- **S1**: YAML loader (loads `card.wood_awakening` + `event.wood_spring_seedling` + `core_wood_demo_001` fixture)

### Security Considerations
- **Trust boundaries**: Resolver is the ONLY place state mutations happen. Presentation cannot mutate state (AC-9). Daemons cannot affect gameplay (AC-9 grep).
- **External dependencies**: None new
- **Sensitive data**: None — runtime is sim-only this cycle (no auth, no PII)
- **Determinism**: Resolver MUST be pure (no `Date.now()`, `Math.random()` — runId is the seed for any randomness). AC-6 enforces via byte-equal assertion.

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| `TurnEnded` marker (cycle-1 README-only event name) breaks TypeScript narrowing on SemanticEvent union | Med | Med | SDD-R1: carry `TurnEnded` in side-channel `markers: Marker[]` field on ResolveResult; cycle 2 promotes to typed union member |
| Resolver step ops execute in wrong order, breaking the 5-event golden sequence | Med | High | Replay test (AC-7) catches this. Order is documented in card YAML `resolver.steps[]` + event YAML `resolver.steps[]`. |
| Card-location invariant violations slip past state machine tests | Low | High | `card-location-invariants.ts` runtime assertion + state-machine tests (AC-5) parameterize all (location, event) tuples |
| `EndTurn` no-op stub silently masks future bugs when cycle 2 implements turn logic | Low | Med | SDD-R1 documents the stub; cycle-2 acceptance criteria must explicitly cover `TurnEnded` typed event |

### Success Metrics
- Resolver replay test (AC-7) completes in <50ms
- 100% transition coverage on all 3 state machines (every `(state, event)` tuple has an explicit return)
- 0 mutations to `state` parameter in resolver (verified by `Object.freeze` in test setup)

---

## Sprint 3: Presentation · 4 Target Registries + Sequencer + Wood Sequence

**Scope:** MEDIUM (4 tasks)
**Duration:** ~2 days
**LOC Budget:** ~700

### Sprint Goal
Ship the presentation pipe: 4 target registries (anchor/actor/UI-mount/audio-bus), the event-bus-driven sequencer with injectable clock, and the TypeScript implementation of the 11-beat `wood_activation_sequence` (0ms `lock_input` → 2280ms `unlock_input`). Presentation NEVER mutates game state.

### Deliverables
- [ ] `lib/purupuru/presentation/anchor-registry.ts` — registers coordinate hooks (e.g., `anchor.wood_grove.seedling_center`)
- [ ] `lib/purupuru/presentation/actor-registry.ts` — registers animatable characters (e.g., `actor.kaori_chibi`)
- [ ] `lib/purupuru/presentation/ui-mount-registry.ts` — registers mounted React surfaces (e.g., `ui.reward_preview`)
- [ ] `lib/purupuru/presentation/audio-bus-registry.ts` — registers audio routing channels (e.g., `audio.bus.sfx`)
- [ ] `lib/purupuru/presentation/sequencer.ts` — event-bus subscriber + beat scheduler (rAF-driven, injectable Clock for tests)
- [ ] `lib/purupuru/presentation/sequences/wood-activation.ts` — TypeScript port of `sequence.wood_activation.yaml` with all 11 beats

### Acceptance Criteria
- [ ] **AC-8**: All 11 beats of `wood_activation_sequence` fire at correct `atMs` offsets ±16ms (single rAF frame at 60Hz tolerance per PRD D6). Per-target resolution: each beat resolves its target through the correct registry. Per-registry resolution success rate 100%.
- [ ] **AC-9** (presentation-side): No file under `lib/purupuru/presentation/*` imports from `lib/purupuru/runtime/{resolver,game-state}` mutating exports. Static grep test green.
- [ ] **AC-15** (sequencer-side): Sequencer respects `inputPolicy.lockMode: soft` from YAML — during 11-beat run, hover events propagate but commit events emit `CardPlayRejected.reason = "input_locked"`. Lock-owner registry tracked.

### Technical Tasks
- [ ] **S3-T1**: Author 4 registry files under `lib/purupuru/presentation/`: `anchor-registry.ts` · `actor-registry.ts` · `ui-mount-registry.ts` · `audio-bus-registry.ts`. Each exports `register(id, ref)` + `resolve(id) → ref | null` + `unregister(id)`. Fail-open semantics: warn on unresolved at sequence fire-time, do not throw (FR-15). LOC ~250 across all 4. → **[G-2]**
- [ ] **S3-T2**: Author `lib/purupuru/presentation/sequencer.ts` per SDD §6 sketch. Subscribes to event-bus on `CardCommitted` events. On fire: resolve `card.presentation.sequenceId` → schedule all beats via injectable `Clock` interface. Production Clock uses `performance.now()` + `requestAnimationFrame`; tests inject `vi.useFakeTimers()` + manual advance per PRD D6. LOC ~200. → **[G-2]**
- [ ] **S3-T3**: Author `lib/purupuru/presentation/sequences/wood-activation.ts` with all 11 beats per PRD FR-17 exact spec: `lock_input` (0ms · ui.input · soft) · `card_anticipation` (0-180ms · card.source · dip_then_lift) · `launch_petal_arc` (120-740ms · vfx.sakura_arc · spline) · `play_launch_audio` (140ms · audio.bus.sfx) · `impact_seedling` (720-980ms · anchor.wood_grove.seedling_center) · `start_local_sakura_weather` (820-2020ms · anchor.wood_grove.petal_column · target_zone_only scope) · `activate_focus_ring` (820-1720ms · zone.wood_grove · active_focus) · `kaori_gesture` (940-1640ms · actor.kaori_chibi · nurture_gesture) · `daemon_reaction` (1040-1600ms · daemon.wood_puruhani_primary · reverent_hop) · `reward_preview` (1680-2200ms · ui.reward_preview · spring_pollen cue) · `unlock_input` (2280ms · ui.input · WorldMapIdle). Each beat tagged with `targetRegistry: "anchor" | "actor" | "ui-mount" | "audio-bus"`. LOC ~250. → **[G-2]**
- [ ] **S3-T4**: Author `lib/purupuru/__tests__/sequencer.beat-order.test.ts` (AC-8). Mock all 4 registries with stub refs. Use `vi.useFakeTimers()` + `vi.advanceTimersByTime(N)`. Fire a synthetic `CardCommitted` event. Assert: (a) all 11 beats logged in declared order; (b) `atMs` offsets all within ±16ms; (c) per-registry resolution success rate 100%; (d) `unlock_input` resets sequencer state. Also include static grep test for AC-9 (presentation→runtime imports). LOC ~200. → **[G-2, G-6]**

### Dependencies
- **S2**: event-bus (sequencer subscribes to it)
- **S2**: SemanticEvent union (sequencer pattern-matches on `CardCommitted`)
- **S1**: `sequence.wood_activation.yaml` loaded via loader (sequencer references its `sequenceId`)

### Security Considerations
- **Trust boundaries**: Presentation reads game state via event-bus messages ONLY; never directly imports resolver/game-state mutating exports (AC-9)
- **External dependencies**: None new — sequencer uses native `requestAnimationFrame` + `performance.now()`; no `mitt` / `eventemitter3` / Effect.PubSub per PRD D5
- **Sensitive data**: None
- **Timing attack surface**: None — sequencer is purely presentation; no security-relevant timing

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 11 beats fire on rAF — anchor-registry timing may miss refs on first render | Med | Med | FR-15 fail-open semantics: warn + skip if unresolved. AC-8 tests with mock registries (no React timing). S4 catches real-DOM timing failures. Per PRD R3. |
| rAF drift under heavy main-thread load exceeds ±16ms tolerance | Low | Low | Tests use injectable clock (deterministic). Production gracefully degrades — beat fires "as late as the next frame after `atMs`." Per PRD R6 + D6. |
| Sequencer subscribes to event-bus but never unsubscribes, leaking listeners | Low | Med | SequenceConsumer (S4) controls `seq.dispose()` on unmount. Test asserts `unsubscribe` is returned. |
| `inputPolicy.lockMode: soft` interpretation drift between sequencer and resolver | Low | High | FR-11a + SDD §3.4-3.5 single source of truth: lock-owner registry. Both layers reference the same `input-lock.ts` module. |

### Success Metrics
- Sequencer beat-order test (AC-8) completes in <100ms with all 11 beats verified
- Static grep test (AC-9 presentation-side) finds 0 violations
- 0 memory leaks under repeated subscribe/unsubscribe cycles (test asserts via reference counting)

---

## Sprint 4: `/battle-v2` Surface · 1 Real Zone + 4 Locked Tiles

**Scope:** LARGE (8 tasks)
**Duration:** ~3.5 days
**LOC Budget:** ~1,200

### Sprint Goal
Ship the player-facing surface at `/battle-v2`: Next.js route + slot-driven UiScreen + WorldMap (1 schema-backed `wood_grove` + 4 decorative locked tiles + Sora Tower) + ZoneToken (10+6 state compose) + CardHandFan using existing `<CardStack>` via the `harnessCardToLayerInput()` adapter. Visual review at sprint close validates R10 (adapter visual continuity) + R11 (decorative tiles read as locked).

### Deliverables
- [ ] `lib/purupuru/presentation/harness-card-to-layer-input.ts` — adapter from harness `CardDefinition` to honeycomb `<CardStack>` props (~50 LOC per FR-21a)
- [ ] `app/battle-v2/page.tsx` — Next.js route shell
- [ ] `app/battle-v2/_components/UiScreen.tsx` — slot-driven layout per `ui.world_map_screen.yaml` (7 slots)
- [ ] `app/battle-v2/_components/WorldMap.tsx` — 1 wood_grove + 4 decorative locked tiles + Sora Tower + cloud parallax
- [ ] `app/battle-v2/_components/ZoneToken.tsx` — 10-state gameplay × 6-state UI compose; decorative pinned to Locked+disabled
- [ ] `app/battle-v2/_components/CardHandFan.tsx` — 5-card hand fan rendering `<CardStack>` via adapter
- [ ] `app/battle-v2/_components/SequenceConsumer.tsx` — useEffect host that registers refs into 4 registries + subscribes sequencer to event-bus
- [ ] `app/battle-v2/_styles/battle-v2.css` — OKLCH palette + per-element breathing (`--breath-wood`) + `puru-flow` / `puru-emit` easing
- [ ] Operator visual review report appended to `sprint-4-COMPLETED.md` (R10 + R11 mitigation gate)

### Acceptance Criteria
- [ ] **AC-10**: `curl -sf http://localhost:3000/battle-v2` returns HTML; manual visual check shows 5 zones (1 active wood_grove + 4 locked) + Sora Tower + chibi-Kaori at grove + 5-card hand fan
- [ ] **AC-11**: At `/battle-v2`, Playwright E2E asserts: hover wood card → ValidTarget pulse on `wood_grove` → click `wood_grove` → full 11-beat sequence plays → input unlocks → ZoneEvent active. Clicking any of the 4 decorative locked tiles is rejected (no state change).
- [ ] Operator visual review pass: `caretaker_a` layer-art reads correctly for `activation` cards (R10); decorative tiles read unambiguously as locked (R11)

### Technical Tasks
- [ ] **S4-T1**: Author `lib/purupuru/presentation/harness-card-to-layer-input.ts` per SDD §5.4 sketch. Function `harnessCardToLayerInput(card: CardDefinition): LayerInput` maps `cardType: "activation"` → layer `cardType: "caretaker_a"`, threads `element` from card definition, defaults `rarity` to "common" / "starter", sets `revealStage: "hand"` + `face: "front"`. ~50 LOC per PRD FR-21a + Codex SKP-BLOCKER-004. → **[G-4]**
- [ ] **S4-T2**: Author `app/battle-v2/page.tsx` — minimal Next.js App Router page that mounts the BattleV2 client component. No auth. ~30 LOC. → **[G-4]**
- [ ] **S4-T3**: Author `app/battle-v2/_components/UiScreen.tsx` per SDD §5.1 + PRD FR-20. Generic slot-driven layout wrapper that consumes `ui.world_map_screen.yaml`'s `layoutSlots[]` + `components[]` arrays. Renders 7 declared slots: `title_cartouche` · `focus_banner` · `selected_card_preview` · `world_map` (60×58% center) · `card_hand` · `deck_counter` · `end_turn_button`. Components bind via `bindsTo` field threaded through `state: GameState` prop. ~250 LOC. → **[G-4]**
- [ ] **S4-T4**: Author `app/battle-v2/_components/WorldMap.tsx` per SDD §5.2 + PRD FR-20a + OD-1 path B. Mounts inside `slot.center.world_map`. 1 schema-backed `<ZoneToken zoneId="wood_grove" />` + 4 decorative `<ZoneToken zoneId="{water_harbor|fire_station|metal_mountain|earth_teahouse}" decorative />` + 1 Sora Tower at center (non-interactive). Cloud-plane parallax via CSS `translateY` 8-12s loop. Viewport does NOT pan. Background: `oklch(0.18 0.02 260)` cosmic-indigo void · cream map-island `oklch(0.94 0.015 90)` · SVG noise filter for paper grain. ~200 LOC. → **[G-4]**
- [ ] **S4-T5**: Author `app/battle-v2/_components/ZoneToken.tsx` per SDD §5.3 + PRD FR-22 + Opus HIGH-1. Two orthogonal state spaces: (a) 10 gameplay states from runtime ZoneStateMachine; (b) 6 UI interaction states (idle · hovered · pressed · selected · disabled · resolving) from `validation_rules.md:21`. Decorative prop pins to gameplay=Locked + UI=disabled (high desaturation + no glow + `cursor: not-allowed` per R11). Outline visuals from `element.wood.yaml:colorTokens.primary`. 3-5 sub-tokens per real zone (sakura tree, shrine stone, torii). ~250 LOC. → **[G-4]**
- [ ] **S4-T6**: Author `app/battle-v2/_components/CardHandFan.tsx` per SDD §5.4. Persistent bottom-edge 5-card hand. Mounts inside `slot.bottom.card_hand`. Shallow horizontal fan; center card lifted `translateY(-12px)` on hover. Hovered card carries amber-honey halation `oklch(0.82 0.14 85)`. Cards rendered via `<CardStack {...harnessCardToLayerInput(card)} />`. Click-to-arm → emit `CardArmed` event. ~150 LOC. → **[G-4]**
- [ ] **S4-T7**: Author `app/battle-v2/_components/SequenceConsumer.tsx` per SDD §5.5 + PRD FR-23. useEffect host: (1) Subscribe to event-bus for `CardCommitted` events; (2) Register anchor refs / actor handles / UI mount points / audio bus connections into the 4 target registries; (3) Hand off `CardCommitted` events to the sequencer. On unmount: unsubscribe + tear down registries. ~100 LOC. → **[G-4]**
- [ ] **S4-T8**: Author `app/battle-v2/_styles/battle-v2.css` per PRD FR-24. OKLCH-palette adherence from `app/globals.css` token system. Per-element breathing rhythms used at idle (wood = `var(--breath-wood)`). Easing curves use `puru-flow` / `puru-emit`. ~200 LOC. → **[G-4]**
- [ ] **S4-T9** (testing): Author Playwright E2E `tests/e2e/battle-v2.spec.ts` covering AC-10 (route renders, 5 zones present, Sora Tower visible, hand fan visible) + AC-11 (full 11-beat sequence playthrough · click-and-verify-each-beat with DOM-state assertions · click on decorative locked tile rejected). → **[G-4, G-6]**

### Dependencies
- **S3**: Sequencer subscribes to event-bus (S2) and consumes from S4 SequenceConsumer
- **S2**: GameState + state machines + resolver (drives ZoneToken state + handles PlayCard commands)
- **S1**: Loader (provides `card.wood_awakening` + `zone.wood_grove` + `ui.world_map_screen` definitions)
- **External**: Existing `<CardStack>` component at `lib/cards/layers/` (untouched per D1 / R10 contingency)

### Security Considerations
- **Trust boundaries**: User input (clicks, hovers) flows through React event handlers → command-queue (S2 validates) → resolver (S2 validates lock + targeting). Presentation layer cannot bypass.
- **External dependencies**: None new — only existing `<CardStack>` referenced via adapter
- **Sensitive data**: None — no auth, no PII, no wallet surface this cycle (per PRD non-goals)
- **Accessibility**: ARIA labels on interactive controls (hand-fan cards, zone tokens, end-turn button per PRD §6.5)

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **R10** (PRD): CardStack adapter (FR-21a) may not preserve visual continuity for harness `cardType: "activation"` if `caretaker_a` layer-system art reads as wrong-class | Med | High | Operator visual review at S4 close. If adapter visual fails, downgrade to OD-2 path B (harness-native placeholder card face) and reschedule full art_anchor integration to cycle 2. |
| **R11** (PRD): 4 decorative locked tiles may LOOK active and invite player clicks | Low | Med | ZoneToken `disabled` UI state visually unambiguous (high desaturation + no glow + cursor change). Operator visual review at S4. |
| Anchor registry refs not populated on first render (rAF fires before useEffect mount) | Med | Med | FR-15 fail-open semantics. SequenceConsumer registers in useEffect synchronously before any `CardCommitted` can fire. First `CardCommitted` is user-driven (post-mount). |
| Playwright timing flake on 11-beat sequence (2280ms total) | Low | Med | Use Playwright `waitFor()` against DOM state markers (not arbitrary sleeps); test asserts events in sequence rather than wall-clock timing |

### Success Metrics
- `/battle-v2` initial route paint <1.5s on local dev (per PRD §6.3)
- Playwright E2E completes in <8s end-to-end (route load + full 11-beat sequence + verification)
- 0 console errors during the 11-beat sequence playthrough
- Operator visual review verdict: PASS (R10 + R11 mitigated)

---

## Sprint 5: Integration + ONE-event Telemetry + Docs + Final Gate

**Scope:** MEDIUM (7 tasks)
**Duration:** ~1.5 days
**LOC Budget:** ~400

### Sprint Goal
Wire `lib/purupuru/` into the project registry, emit the ONE `CardActivationClarity` telemetry event per completed sequence to JSONL trail, ship cycle README documentation, and gate the entire cycle through final `/review-sprint sprint-5` + `/audit-sprint sprint-5` per PRD FR-29 (Codex SKP-HIGH-004 typo fix).

### Deliverables
- [ ] `lib/purupuru/index.ts` exporting `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` constants (flat-pattern per FR-25)
- [ ] `lib/registry/index.ts` MODIFIED to import these constants (NOT a `registry.purupuru.*` namespace API)
- [ ] Telemetry emission: ONE `CardActivationClarity` event per completed sequence with the 7 properties (`cardId · elementId · targetZoneId · timeFromCardArmedToCommitMs · invalidTargetHoverCount · sequenceSkipped · inputLockDurationMs`) emitted at `unlock_input` beat → JSONL trail at `grimoires/loa/a2a/trajectory/telemetry-cycle-1-{YYYYMMDD}.jsonl`
- [ ] `app/kit/page.tsx` adds a link to `/battle-v2`
- [ ] `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/README.md` documenting cycle contracts + path index + one-line behavior summary per file
- [ ] `lib/registry/__tests__/index.test.ts` verifying registry imports resolve cleanly
- [ ] All 6 sprint-COMPLETED.md markers (sprint-0 through sprint-5) + cycle-wide `CYCLE-COMPLETED.md`
- [ ] **E2E Goal Validation** task (Task 5.E2E) executes against the running surface

### Acceptance Criteria
- [ ] **AC-12**: Registry integrity check passes — `lib/registry/index.ts` imports `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` from `lib/purupuru/index.ts`; `pnpm typecheck` clean
- [ ] **AC-13**: ONE `CardActivationClarity` telemetry event fires at sequence-end (`unlock_input` beat) with all 7 properties populated from accumulated semantic events; JSONL line appended to `grimoires/loa/a2a/trajectory/telemetry-cycle-1-{YYYYMMDD}.jsonl`
- [ ] **AC-16**: Per-sprint COMPLETED markers exist at `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/sprint-{0..5}-COMPLETED.md` with green-gate signoff (6 sprints total)
- [ ] **AC-17**: Net LOC budget honored: ≤ +4,500 lines under `lib/purupuru/` + `app/battle-v2/` + tests · ≤ +50 lines under `lib/registry/index.ts` + `package.json` + `app/kit/page.tsx` · 0 asset additions
- [ ] **AC-18**: Cycle README exists with each contract + path + one-line behavior summary; sprint-plan archived alongside

### Technical Tasks
- [ ] **S5-T1**: Author `lib/purupuru/index.ts` exporting `PURUPURU_RUNTIME` (resolver · state-machines · event-bus · input-lock · command-queue · sky-eyes-motifs) + `PURUPURU_CONTENT` (loader · vendored YAMLs · contracts) per FR-25 flat-constant pattern verified at `lib/registry/index.ts:27`. ~40 LOC. → **[G-7]**
- [ ] **S5-T2**: Modify `lib/registry/index.ts` to import `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` from `lib/purupuru/index.ts` alongside existing `LAYER_REGISTRY` + `CARD_DEFINITIONS`. NO `registry.purupuru.*` namespace. ~10 LOC. → **[G-7]**
- [ ] **S5-T3**: Implement ONE-event telemetry emission per PRD FR-26 + Opus HIGH-5 + OD-3. Subscribe to `unlock_input` beat in sequencer; accumulate semantic-event properties during the sequence; emit ONE `CardActivationClarity` event with 7 properties; append as JSONL line to `grimoires/loa/a2a/trajectory/telemetry-cycle-1-{YYYYMMDD}.jsonl` (file path includes date stamp). Tests verify: (a) ONE event per completed sequence (not 4); (b) all 7 properties present and typed; (c) JSONL format. ~150 LOC. → **[G-8]**
- [ ] **S5-T4**: Add `/battle-v2` link to `app/kit/page.tsx` per FR-27. ~5 LOC. → **[G-9]**
- [ ] **S5-T5**: Author `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/README.md` per FR-28 + AC-18. List each contract + path + one-line behavior summary: schemas/* · contracts/types.ts · contracts/validation_rules.md · content/wood/*.yaml · content/loader.ts · runtime/{game-state · event-bus · input-lock · command-queue · resolver · sky-eyes-motifs · 3 state machines} · presentation/{4 registries · sequencer · sequences/wood-activation · harness-card-to-layer-input} · app/battle-v2/{page · 5 components · styles}. Cite PRD §2.3 non-goals as forward-looking pointer to cycle 2. ~100 LOC. → **[G-9]**
- [ ] **S5-T6**: Author `lib/registry/__tests__/index.test.ts` per AC-12. `pnpm typecheck` confirms imports resolve cleanly; runtime import test asserts `PURUPURU_RUNTIME.resolver` + `PURUPURU_CONTENT.loader` are functions. ~50 LOC. → **[G-7, G-6]**
- [ ] **S5-T7**: Author per-sprint COMPLETED markers `sprint-{0..5}-COMPLETED.md` (one per sprint at close) + cycle-wide `CYCLE-COMPLETED.md` at S5 close per FR-29 (Codex SKP-HIGH-004 fix: gate is sprint-5 NOT sprint-4). Each marker lists ACs cleared + green-gate signoff. ~50 LOC across all markers. → **[G-6]**
- [ ] **S5-T8** (telemetry tests): Author `lib/purupuru/__tests__/telemetry.emit.test.ts` per AC-13. Simulate full 11-beat sequence; assert exactly ONE `CardActivationClarity` event emitted; assert 7 properties present and typed; assert JSONL line written. → **[G-8, G-6]**

### Task 5.E2E: End-to-End Goal Validation

**Priority:** P0 (Must Complete)
**Goal Contribution:** All goals (G-1 through G-10)

**Description:** Validate that all PRD goals are achieved through the complete implementation at `/battle-v2`.

**Validation Steps:**

| Goal ID | Goal | Validation Action | Expected Result |
|---------|------|-------------------|-----------------|
| **G-1** | Foundational simulation pipe (game-state · command-queue · resolver · event-bus · input-lock · 3 state machines) ship as pure-functional units | Run `pnpm test lib/purupuru/__tests__/resolver.replay.test.ts` + `state-machines.test.ts` + `game-state.serialize.test.ts` | All AC-4 / AC-5 / AC-6 / AC-7 / AC-14 / AC-15 tests green; resolver replay produces deterministic 5-event sequence |
| **G-2** | Foundational presentation pipe (4 registries + sequencer + wood-activation sequence) ship | Run `pnpm test lib/purupuru/__tests__/sequencer.beat-order.test.ts` | AC-8 green; 11 beats fire at correct atMs ±16ms; per-registry resolution 100% |
| **G-3** | 8 schemas + 8 worked YAML examples + validation_rules.md validated | Run `pnpm content:validate` + `pnpm test lib/purupuru/__tests__/schema.validate.test.ts` + `design-lint.test.ts` | AC-1 / AC-2 / AC-2a / AC-3 / AC-3a green |
| **G-4** | `/battle-v2` vertical slice ships with slot-driven UI screen + 1 schema-backed zone + 4 decorative locked tiles + Kaori + 5-card hand fan | Run `pnpm playwright test tests/e2e/battle-v2.spec.ts` | AC-10 / AC-11 green; 11-beat sequence visible end-to-end |
| **G-5** | Deterministic replay against golden fixture | Run `pnpm test lib/purupuru/__tests__/resolver.replay.test.ts` (same as G-1 but emphasizes golden-fixture path) | AC-7 green; identical output across 2 consecutive resolver invocations on same input |
| **G-6** | Every sprint clears `/implement → /review-sprint → /audit-sprint` | Verify all 6 `sprint-{0..5}-COMPLETED.md` markers exist + `CYCLE-COMPLETED.md` present | AC-16 green; 6 green-gate signoffs |
| **G-7** | Registry integration (PURUPURU_RUNTIME + PURUPURU_CONTENT flat-constant pattern) | Run `pnpm test lib/registry/__tests__/index.test.ts` + `pnpm typecheck` | AC-12 green; imports resolve cleanly |
| **G-8** | ONE-event telemetry to JSONL trail | Run `pnpm test lib/purupuru/__tests__/telemetry.emit.test.ts` + manually inspect `grimoires/loa/a2a/trajectory/telemetry-cycle-1-{YYYYMMDD}.jsonl` after a `/battle-v2` playthrough | AC-13 green; 1 JSONL line per completed sequence with all 7 properties |
| **G-9** | Cycle docs at `cycles/.../README.md` | Verify file exists + lists all contracts + paths + one-line summaries | AC-18 green |
| **G-10** | SKY EYES P1 wood-only motif declared | Verify `lib/purupuru/runtime/sky-eyes-motifs.ts` exports `wood: "sky_eye_leaf"` per Opus HIGH-4 terminology | File exists; export matches `element.wood.yaml:31` |

**Acceptance Criteria:**
- [ ] Each goal validated with documented evidence (test output, file existence, playthrough screenshot)
- [ ] Integration points verified (data flows end-to-end: YAML → loader → state → resolver → events → sequencer → DOM)
- [ ] No goal marked as "not achieved" without explicit justification in `CYCLE-COMPLETED.md`
- [ ] Net LOC ≤ +4,500 verified via `git diff main..HEAD --stat` (AC-17)

### Dependencies
- **S4**: `/battle-v2` route + components shipped (S5 depends on the live surface for telemetry + E2E validation)
- **S1-S3**: All preceding layers (registry export depends on runtime + presentation modules being importable)

### Security Considerations
- **Trust boundaries**: Registry exports are read-only constants; no mutation surface
- **Telemetry destination**: JSONL trail under `grimoires/loa/a2a/trajectory/` (State Zone — Read/Write permitted per `.claude/rules/zone-state.md`)
- **Sensitive data**: Telemetry carries only `contentIds` + `EntityIds` — NO PII, NO user identifiers (per PRD §6.5)
- **External dependencies**: None new

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Registry-pattern conflict with existing `LAYER_REGISTRY` flat-constant import | Low | Med | AC-12 verifies; `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` follow established convention per FR-25 / R7 |
| JSONL trail write fails silently in browser (no fs access from client) | Med | Med | Telemetry emitter checks `typeof window === "undefined"` — emits via Node `fs.appendFileSync` server-side; client-side falls back to `console.log` with structured envelope for cycle-2 server-relay |
| LOC budget overrun discovered at S5 close (no time to refactor) | Low | High | De-scope ladder in PRD §9: telemetry first (cycle 2), then `/kit` link, then reward_preview beat, then 4 decorative tiles. G1-G6 hold even at bottom of ladder. |
| `/review-sprint sprint-5` + `/audit-sprint sprint-5` may surface late blockers | Low | High | Each prior sprint's audit is the safety net; S5 audit focuses on integration cleanliness + final LOC tally. Operator-ratified gate stands. |

### Success Metrics
- All 18 PRD acceptance criteria green (AC-0 through AC-18 minus AC-3a which is sprint-1 scoped)
- Net LOC ≤ +4,500 (per AC-17)
- `CYCLE-COMPLETED.md` written with green-gate signoff
- 1 JSONL line written to telemetry trail per `/battle-v2` playthrough (verified manually)

---

## Risk Register

Combined register from PRD §8 (R1-R11) + SDD §12 (SDD-R1 to SDD-R3) + sprint-specific risks.

| ID | Risk | Sprint | Probability | Impact | Mitigation | Owner |
|----|------|--------|-------------|--------|------------|-------|
| R1 | Greenfield namespace creates parallel architecture vs. `lib/honeycomb/` | All | Med | Med | D1 explicit + §6.2 invariants 5-7. FR-21a adapter is the named integration seam. | implementer |
| R2 | Harness has zero codebase awareness — schemas may conflict with compass conventions | S0-S1 | Med | High | **S0 spike (FR-0)** is the calibration vehicle. If S0 surfaces incompatibility, recalibrate at S0 close before S1 commits. | implementer |
| R3 | 11 beats fire on rAF — anchor-registry timing may miss refs on first render | S3-S4 | Med | Med | FR-15 fail-open semantics. AC-8 tests with mock registries (S3); real React refs tested at S4. | implementer |
| R4 | Daemons declared with `affectsGameplay: false` may confuse future agents | All | Low | Med | D10 explicit. AC-9 grep test (FR-14a) prevents resolver from reading daemon state. | implementer |
| R5 | YAML content authoring overhead | S1 | Low | Low | Loader is format-agnostic at the type-validation seam; swapping YAML→JSON later is one-file refactor. | implementer |
| R6 | rAF drift under heavy main-thread load exceeds ±16ms tolerance | S3-S4 | Low | Low | ±16ms tolerance (D6). Tests use injectable clock. Production gracefully degrades to next-frame. | implementer |
| R7 | Registry registration may conflict with existing flat-constant pattern | S5 | Low | Med | AC-12 verifies. `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` follow `LAYER_REGISTRY` convention. | implementer |
| R8 | LOC budget +4,500 may be tight | All | Low | Med | S0 spike calibrates pre-S1. If any sprint closes >25% over its budget, recalibrate remaining sprints. | operator + implementer |
| R9 | `/battle-v2` may feel disconnected from `/battle` | S4 | Low | Low | Q-SDD-1 resolved: V2 is the EVOLUTION of V1, not a parallel sibling. Cycle 2 turns V1 into a redirect/sub-view. | operator |
| R10 | CardStack adapter (FR-21a) may not preserve visual continuity for harness `cardType: "activation"` | S4 | Med | High | Operator visual review at S4 close. Downgrade to OD-2 path B (harness-native placeholder) if adapter visual fails. | operator |
| R11 | 4 decorative locked tiles (D9) may LOOK active and invite player clicks | S4 | Low | Med | FR-22 ZoneToken `disabled` UI state visually unambiguous (high desaturation + no glow + cursor change). Operator visual review at S4. | operator |
| SDD-R1 | `EndTurnCommand` no-op stub emits `TurnEnded` marker NOT in 15-member SemanticEvent union — TypeScript narrowing breaks | S2 | Med | Med | Use side-channel `markers: Marker[]` field on `ResolveResult`. Cycle 2 promotes to typed union member. | implementer |
| SDD-R2 | 4 target registries may have circular initialization dependencies if components register before sequencer subscribes | S4 | Low | Med | SequenceConsumer (FR-23) controls init order: registries first, then sequencer subscription. Test asserts ordering. | implementer |
| SDD-R3 | YAML loader's directory-walk discovery may fail in Next.js Turbopack symlinked/bundled environments | S1 | Low | Med | Test with `pnpm build` + `pnpm start`; if Turbopack tree-shakes YAML files, embed them as inline imports at build time (cycle-2 concern). | implementer |

---

## Success Metrics Summary

| Metric | Target | Measurement Method | Sprint |
|--------|--------|-------------------|--------|
| AJV validation runtime per YAML | <100ms | `pnpm content:validate` profiling | S1 |
| Schema coverage | 8 schemas + 8 YAMLs + validation_rules.md | `ls` + AJV exit code | S1 |
| State-machine transition coverage | 100% (every (state, event) tuple has explicit return) | Vitest parameterized matrix | S2 |
| Resolver determinism | byte-equal `ResolveResult` on repeat input | Vitest deep-equal assertion | S2 |
| Golden fixture replay | 5-event sequence `CardCommitted → ZoneActivated → ZoneEventStarted → DaemonReacted → RewardGranted` | Replay test on `core_wood_demo_001` | S2 |
| 11-beat sequence timing | All beats fire at `atMs` offsets ±16ms | Sequencer test with `vi.useFakeTimers()` | S3 |
| Per-registry resolution success | 100% (anchor/actor/UI-mount/audio-bus) | Mock registries + assertions | S3 |
| `/battle-v2` route paint | <1.5s local dev, <3s Vercel preview | DevTools performance panel | S4 |
| Playwright E2E duration | <8s end-to-end | `pnpm playwright test` timing | S4 |
| Telemetry events per sequence | Exactly ONE `CardActivationClarity` event with 7 properties | JSONL line count + property assertion | S5 |
| Net LOC budget | ≤ +4,500 lines | `git diff main..HEAD --stat` | S5 |
| Sprint completion markers | 6 (S0-S5) + 1 CYCLE-COMPLETED.md | File-existence check | S5 |

---

## Dependencies Map

```text
S0 (calibration spike)
  │  AJV + harness composability validated
  ▼
S1 (schemas + contracts + loader + design-lint)
  │  Vendored content + loader + types + validation_rules.md
  ▼
S2 (runtime: game-state + state machines + resolver)
  │  Pure functional sim with deterministic golden replay
  ▼
S3 (presentation: 4 registries + sequencer + 11-beat sequence)
  │  Presentation pipe consuming semantic events from S2
  ▼
S4 (/battle-v2 surface · 1 real zone + 4 locked tiles)
  │  Live React surface + Playwright E2E + operator visual review
  ▼
S5 (integration + telemetry + docs + final gate)
     Registry export · JSONL telemetry · cycle README · CYCLE-COMPLETED
```

**Critical path**: S0 → S1 → S2 → S3 → S4 → S5 (strict sequential; no parallelization due to layer dependencies)

---

## Appendix

### A. PRD Functional Requirement Mapping

| PRD FR | Description | Sprint | Status |
|--------|-------------|--------|--------|
| FR-0 | S0 lightweight calibration spike script | S0 | Planned |
| FR-1 | 8 JSON schemas vendored | S1 | Planned |
| FR-2 | `contracts/types.ts` with 15-member SemanticEvent union | S1 | Planned |
| FR-2a | `validation_rules.md` vendored verbatim | S1 | Planned |
| FR-3 | `content/loader.ts` with AJV + pack-as-provenance | S1 | Planned |
| FR-4 | 8 worked YAML examples vendored | S1 | Planned |
| FR-5 | `scripts/validate-content.ts` + 5 design-lints | S1 | Planned |
| FR-6 | `package.json` adds `js-yaml` ^4 + content:validate script | S1 | Planned |
| FR-7 | `runtime/game-state.ts` + factory | S2 | Planned |
| FR-8 | `runtime/ui-state-machine.ts` | S2 | Planned |
| FR-9 | `runtime/card-state-machine.ts` | S2 | Planned |
| FR-10 | `runtime/zone-state-machine.ts` (10 states) | S2 | Planned |
| FR-11 | `runtime/event-bus.ts` minimal typed pub/sub | S2 | Planned |
| FR-11a | `runtime/input-lock.ts` lock-owner registry | S2 | Planned |
| FR-12 | `runtime/command-queue.ts` emits `CardCommitted` | S2 | Planned |
| FR-13 | `runtime/resolver.ts` 5 ops + 5 commands | S2 | Planned |
| FR-14 | `runtime/sky-eyes-motifs.ts` wood-only | S2 | Planned |
| FR-14a | Static grep: resolver does not read daemons | S2 | Planned |
| FR-15 | 4 target registries (anchor/actor/UI-mount/audio-bus) | S3 | Planned |
| FR-16 | `presentation/sequencer.ts` | S3 | Planned |
| FR-17 | `sequences/wood-activation.ts` (11 beats) | S3 | Planned |
| FR-18 | Sequencer respects `inputPolicy.lockMode: soft` | S3 | Planned |
| FR-19 | `app/battle-v2/page.tsx` route shell | S4 | Planned |
| FR-20 | `UiScreen.tsx` slot-driven layout | S4 | Planned |
| FR-20a | `WorldMap.tsx` 1 real + 4 locked + Sora Tower | S4 | Planned |
| FR-21 | `CardHandFan.tsx` via adapter | S4 | Planned |
| FR-21a | `harness-card-to-layer-input.ts` adapter (~50 LOC) | S4 | Planned |
| FR-22 | `ZoneToken.tsx` 10+6 state compose | S4 | Planned |
| FR-23 | `SequenceConsumer.tsx` event-bus consumer | S4 | Planned |
| FR-24 | `battle-v2.css` OKLCH palette + breathing | S4 | Planned |
| FR-25 | `lib/registry/index.ts` imports PURUPURU constants | S5 | Planned |
| FR-26 | ONE telemetry event → JSONL trail | S5 | Planned |
| FR-27 | `app/kit/page.tsx` link to `/battle-v2` | S5 | Planned |
| FR-28 | Cycle README docs | S5 | Planned |
| FR-29 | Sprint COMPLETED markers (s5 gate, fixed typo) | S5 | Planned |

### B. SDD Component Mapping

| SDD Section | Component / Path | Sprint | Status |
|-------------|------------------|--------|--------|
| §2.4 (layer-by-layer diagram) | `lib/purupuru/schemas/*.schema.json` | S1 | Planned |
| §3 (contract types) | `lib/purupuru/contracts/types.ts` | S1 | Planned |
| §3 (vendored rules) | `lib/purupuru/contracts/validation_rules.md` | S1 | Planned |
| §8 (loader sketch) | `lib/purupuru/content/loader.ts` | S1 | Planned |
| §9 (design lints) | `scripts/validate-content.ts` | S1 | Planned |
| §4 (state machines) | `lib/purupuru/runtime/{ui,card,zone}-state-machine.ts` | S2 | Planned |
| §7 (resolver sketch) | `lib/purupuru/runtime/resolver.ts` | S2 | Planned |
| §7.1 (golden replay) | `lib/purupuru/__tests__/resolver.replay.test.ts` | S2 | Planned |
| §2.4 (4 registries) | `lib/purupuru/presentation/{anchor,actor,ui-mount,audio-bus}-registry.ts` | S3 | Planned |
| §6 (11-beat sequence) | `lib/purupuru/presentation/sequences/wood-activation.ts` | S3 | Planned |
| §5.1-5.5 (components) | `app/battle-v2/_components/{UiScreen,WorldMap,ZoneToken,CardHandFan,SequenceConsumer}.tsx` | S4 | Planned |
| §5.4 (adapter) | `lib/purupuru/presentation/harness-card-to-layer-input.ts` | S4 | Planned |
| §10 S5 tasks | `lib/purupuru/index.ts` + `lib/registry/index.ts` + telemetry + README | S5 | Planned |
| §11 (test methodology) | All `__tests__/*.test.ts` files | S1-S5 | Planned |

### C. PRD Goal Mapping

PRD goals G1-G10 defined in `prd.md §2.1 (G1-G6 primary)` + `§2.2 (G7-G10 secondary)`. IDs explicit in PRD — no auto-assignment.

| Goal ID | Goal Description | Contributing Tasks | Validation Task |
|---------|------------------|-------------------|-----------------|
| **G-1** | Foundational simulation pipe (`runtime/{game-state, command-queue, resolver, event-bus, input-lock, 3 state machines}.ts`) ship as pure-functional units; resolver deterministic + replayable | S1: T2 (contracts/types.ts) · S2: T1 (state + bus + lock + queue), T2 (3 state machines), T3 (resolver 5 ops + 5 commands) | Sprint 5: Task 5.E2E |
| **G-2** | Foundational presentation pipe (4 registries + sequencer + wood-activation sequence) ship; sequencer fires all 11 beats at correct atMs ±16ms; presentation NEVER mutates game state | S3: T1 (4 registries), T2 (sequencer), T3 (11-beat sequence), T4 (beat-order test) | Sprint 5: Task 5.E2E |
| **G-3** | 8 schemas + 8 worked YAML examples validated + `validation_rules.md` vendored; design-lint subset enforced | S0: T1 (AJV spike) · S1: T1 (vendor schemas), T2 (contracts types), T2a (vendor validation_rules.md), T3 (vendor YAMLs), T4 (loader), T5 (validate-content + 5 lints), T6 (package.json), T7 (tests) · S2: T3 (resolver consumes content) | Sprint 5: Task 5.E2E |
| **G-4** | `/battle-v2` vertical slice ships (slot-driven UI + 1 schema-backed wood_grove zone + 4 decorative locked tiles + Sora Tower + chibi-Kaori + 5-card hand fan via FR-21a adapter) | S4: T1 (adapter), T2 (route), T3 (UiScreen), T4 (WorldMap), T5 (ZoneToken), T6 (CardHandFan), T7 (SequenceConsumer), T8 (styles), T9 (E2E) | Sprint 5: Task 5.E2E |
| **G-5** | Deterministic replay against golden fixture `core_wood_demo_001` produces 5-event sequence | S2: T3 (resolver), T5 (replay test) | Sprint 5: Task 5.E2E |
| **G-6** | Every sprint (6 total) clears `/implement → /review-sprint → /audit-sprint`; CYCLE-COMPLETED requires green on all 6 | S0: T2 · S1: T7 · S2: T5, T6 · S3: T4 · S4: T9 · S5: T6, T7, T8 (sprint-COMPLETED markers + tests) | Sprint 5: Task 5.E2E + CYCLE-COMPLETED |
| **G-7** | Registry integration via flat-constant pattern (`PURUPURU_RUNTIME` + `PURUPURU_CONTENT` in `lib/registry/index.ts`) | S5: T1 (lib/purupuru/index.ts), T2 (lib/registry/index.ts), T6 (registry test) | Sprint 5: Task 5.E2E |
| **G-8** | Telemetry emission · ONE `CardActivationClarity` event per completed sequence · JSONL trail destination | S5: T3 (telemetry emitter), T8 (telemetry test) | Sprint 5: Task 5.E2E |
| **G-9** | Cycle docs README at `grimoires/loa/cycles/.../README.md` | S5: T4 (kit link), T5 (README) | Sprint 5: Task 5.E2E |
| **G-10** | SKY EYES P1 wood-only motif (`sky_eye_leaf` per Opus HIGH-4 terminology) | S2: T4 (sky-eyes-motifs.ts) | Sprint 5: Task 5.E2E |

**Goal Coverage Check:**
- [x] All PRD goals (G-1 through G-10) have at least one contributing task
- [x] All goals have a validation step in Task 5.E2E (Sprint 5 final sprint)
- [x] No orphan tasks (every task in §5.1-§5.5 sprints contributes to at least one goal)

**Per-Sprint Goal Contribution:**

| Sprint | Contributing Goals |
|--------|---------------------|
| S0 | G-3 (calibration), G-6 (audit gate) |
| S1 | G-1 (partial: contracts), G-3 (complete), G-6 (audit gate) |
| S2 | G-1 (complete: runtime), G-3 (partial: content consumed), G-5 (complete: replay), G-6 (audit gate), G-10 (sky-eyes wood motif) |
| S3 | G-2 (complete: presentation), G-6 (audit gate) |
| S4 | G-4 (complete: surface), G-6 (audit gate) |
| S5 | G-6 (final gate), G-7 (complete: registry), G-8 (complete: telemetry), G-9 (complete: docs), E2E validation of G-1 through G-10 |

### D. Sprint Ledger Integration

This cycle (`purupuru-cycle-1-wood-vertical-2026-05-13`) does NOT yet appear in `grimoires/loa/ledger.json`. The ledger's current state:
- `next_sprint_number: 143`
- `active_cycle: cycle-099-model-registry` (a Loa-framework cycle, NOT this purupuru cycle)

The ledger appears to track Loa-internal cycles. This purupuru cycle uses its own date-suffixed directory at `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/` per PRD D12, matching the predecessor `card-game-in-compass-2026-05-12` pattern. Per-sprint COMPLETED markers + CYCLE-COMPLETED marker (FR-29 / AC-16) provide the audit trail in lieu of ledger registration.

If the operator wants ledger registration, a follow-up `/architect` or `/sprint-plan` invocation can add a new cycle entry with `sprints: [{ local_id: "S0".."S5", global_id: 143..148 }]`.

---

*Generated by Sprint Planner Agent (Opus 4.7 1M) · 2026-05-13 · construct composition: ARCH-OSTROM + SHIP-BARTH + craft-ALEXANDER*
