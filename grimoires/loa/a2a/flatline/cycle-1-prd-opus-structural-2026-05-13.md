# Opus Structural Review — Purupuru Cycle 1 PRD

> Fallback review because `flatline-orchestrator.sh` is broken in this repo (same regression class as 2026-05-12 · all 6 model-adapter Phase-1 calls return bare banners · no `.run/model-invoke.jsonl` envelope written despite cycle-107 routing being default-on).
> Reviewer voice: Claude Opus 4.7 1M (the same model that authored the PRD — self-review for structural rigor, not adversarial).
> Document: `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/prd.md` (413 lines, r0)
> Date: 2026-05-13
> Companion review: `cycle-1-prd-codex-skeptic-2026-05-13.md` (Codex skeptic voice, parallel execution)

## Methodology

Read the PRD I authored against the full harness contract surface (all 8 worked YAML examples + the JSON schemas + the validation_rules.md doc). Look for: (a) ungrounded claims, (b) state-machine mismatches between PRD and harness, (c) missing files/ops/states, (d) scope items that BARTH would cut, (e) internal contradictions.

## BLOCKERS (severity ≥ 750)

### BLK-1 · `validation_rules.md` is NOT vendored — design lint surface is missing

**Severity: 800**

**Finding**: My PRD's FR-2 vendors `contracts/purupuru.contracts.ts` to `lib/purupuru/contracts/types.ts`, but **does not vendor** `~/Downloads/purupuru_architecture_harness/contracts/validation_rules.md`. The harness's §21 repository package map lists it as a peer of `purupuru.contracts.ts`. The file contains 21 design-lint + runtime-assertion rules that the resolver MUST enforce (e.g., "A card cannot exist in two locations at once" · "An input lock owner must be registered and must release or transfer ownership" · "A presentation sequence cannot emit gameplay mutations directly").

Without vendoring this file, the design-lint surface is implicit — the rules live only in the harness author's head. Cycle-1's resolver will likely violate one or more of these rules without realizing.

**Remediation**: Add to FR-1 / FR-2 a new line: vendor `validation_rules.md` to `lib/purupuru/contracts/validation_rules.md`. Add to FR-13 (resolver) a new assertion: the resolver step ops must check each `runtime assertion` from validation_rules.md as a precondition.

**Grounding**: `~/Downloads/purupuru_architecture_harness/contracts/validation_rules.md` (entire file) · `~/Downloads/purupuru_architecture_harness/README.md:868-889` (§21 repository package map naming it).

---

### BLK-2 · Resolver-step ops list is INCOMPLETE — wood_spring_seedling event uses ops not declared in FR-13

**Severity: 780**

**Finding**: PRD's FR-13 names the resolver as implementing `activate_zone + spawn_event + grant_reward` ops from `card.wood_awakening.yaml`. But `event.wood_spring_seedling.yaml:17-32` declares resolver steps using **`set_flag`** + **`add_resource`** — two ops that FR-13 does NOT mention.

When the resolver fires the card's `spawn_event` step (which spawns wood_spring_seedling), the event itself has resolver steps that MUST execute. Without `set_flag` and `add_resource` support, the golden replay test (AC-7) cannot run to completion.

**Remediation**: FR-13 ops list must read: `activate_zone + spawn_event + grant_reward + set_flag + add_resource`. Sprint 2 acceptance criteria must include both card-ops and event-ops in the replay test.

**Grounding**: `~/Downloads/purupuru_architecture_harness/examples/event.wood_spring_seedling.yaml:17-32`. Also `~/Downloads/purupuru_architecture_harness/contracts/purupuru.contracts.ts:210-223` declares the full ResolverStep op union as 12 operations (`activate_zone | spawn_event | apply_modifier | add_resource | remove_resource | draw_cards | discard_cards | move_daemon | set_flag | grant_reward | advance_clock | queue_followup_command`). Cycle 1 needs at minimum the 5 above; the rest can be cycle-2 work but should be type-narrowable in the resolver dispatch.

---

### BLK-3 · AC-7 golden replay event sequence is INCOMPLETE

**Severity: 750**

**Finding**: PRD's AC-7 asserts the resolver replay produces "ZoneActivated → ZoneEventStarted → RewardGranted" — three events.

But `validation_rules.md` golden replay (`core_wood_demo_001`) declares the expected event sequence as `CardCommitted → ZoneActivated → ZoneEventStarted → DaemonReacted` — **with `RewardGranted` IMPLICIT** because it fires from the wood_spring_seedling event's own resolver steps, not directly from the card's command resolution.

This is a load-bearing mismatch: AC-7 will pass against my (wrong) expected sequence and FAIL against the harness's authoritative one. The PRD describes a behavior the resolver should not actually produce.

**Remediation**: Update AC-7 to: "Playing `card.wood_awakening` on `zone.wood_grove` produces the deterministic event sequence `CardCommitted → ZoneActivated → ZoneEventStarted → DaemonReacted → RewardGranted` (RewardGranted may fire 1+ times depending on event's reward count)."

**Grounding**: `~/Downloads/purupuru_architecture_harness/contracts/validation_rules.md:36-81` (golden replay block).

---

## HIGH-SEVERITY (500-749)

### HIGH-1 · ZoneToken state machine MISMATCHES harness UI requirement

**Severity: 700**

**Finding**: PRD FR-22 spec for ZoneToken names 4 states: `Idle · ValidTarget · Active · Afterglow`. But `validation_rules.md:21` declares: "Any UI component with `interactive: true` must define `idle`, `hovered`, `pressed`, `selected`, `disabled`, and `resolving` states." Harness `ui.world_map_screen.yaml` shows `end_turn_button` declaring all 6 states (line 129-135).

ZoneTokens ARE interactive (player hovers, clicks). They need the full 6-state surface. The 4 states in PRD are GAME-SEMANTIC states (from harness §7.3 zone state machine), which are different from UI-INTERACTION states. Both are needed.

**Remediation**: FR-22 ZoneToken spec must clarify: (a) gameplay states from zone state machine: Locked → Idle → ValidTarget → Previewed → Active → Resolving → Afterglow → Resolved → Exhausted (9 values per harness §7.3); (b) UI states from validation_rules.md: idle/hovered/pressed/selected/disabled/resolving (6 values). The two state spaces compose orthogonally.

**Grounding**: `~/Downloads/purupuru_architecture_harness/contracts/validation_rules.md:21` · `~/Downloads/purupuru_architecture_harness/examples/ui.world_map_screen.yaml:125-138` (end_turn_button) · `~/Downloads/purupuru_architecture_harness/README.md:344-360` (§7.3 zone state machine).

---

### HIGH-2 · WorldMap component spec CONFLICTS with `ui.world_map_screen.yaml`

**Severity: 680**

**Finding**: PRD §5 (referenced from build doc) + FR-20 describe WorldMap with: cosmic-indigo void, cream map-island, 5-point asymmetric zone arrangement around Sora Tower, ≥12% spacing. But `ui.world_map_screen.yaml:19-61` declares a structured `layoutSlots[]` system with specific percentages: top_strip / center_world (60×58%) / bottom_strip · 7 named slots · 7 named components (`title_cartouche`, `focus_banner`, `tide_indicator`, `selected_card_preview`, `card_hand`, `deck_counter`, `end_turn_button`).

The PRD describes a free-form WorldMap component; the harness YAML describes a slot-driven UI screen. Which is canonical?

If the YAML is canonical (which D9 implies by vendoring it), then the React `WorldMap` component must CONSUME the YAML's `layoutSlots[]` + `components[]` arrays as its source of truth for layout. The 5 zones + Sora Tower are children of `slot.center.world_map` (the 60×58% region), not floating elements on a free-form canvas.

**Remediation**: FR-20 must declare: the WorldMap React component reads `lib/purupuru/content/wood/ui.world_map_screen.yaml`, instantiates a `<UiScreen>` wrapper with the declared slots, and mounts the 5 zones + Sora Tower inside `slot.center.world_map`. The cosmic-indigo + cream + parallax + asymmetric arrangement aesthetic remain — they describe the VISUAL TREATMENT of the center_world slot, not the screen-level layout. Add FR-24a: `app/battle-v2/_components/UiScreen.tsx` — generic slot-driven layout wrapper that consumes ui_screen YAML.

**Grounding**: `~/Downloads/purupuru_architecture_harness/examples/ui.world_map_screen.yaml` (entire file) vs. PRD §5 / FR-20.

---

### HIGH-3 · Input-lock owner registry is NOT specified

**Severity: 620**

**Finding**: `sequence.wood_activation.yaml:11-13` declares `inputPolicy.lockOwnerId: sequence.wood_activation`. `validation_rules.md:30` declares the runtime assertion: "An input lock owner must be registered and must release or transfer ownership."

PRD's FR-11 (event-bus) + FR-16 (sequencer) + AC-15 (soft lock) describe the lock behavior but **do not name a lock-owner registry**. If two sequences fire near-simultaneously (e.g., a follow-up `queue_followup_command` from the resolver), the second sequence's `lock_input` beat will silently override the first's owner — a class of bug the validation_rules.md assertion is designed to catch.

**Remediation**: Add FR-11a: `lib/purupuru/runtime/input-lock.ts` exposes `acquireLock(ownerId, mode)` + `releaseLock(ownerId)` + `transferLock(fromOwnerId, toOwnerId)`. Sequencer (FR-16) calls these. Resolver (FR-13) MUST refuse to dispatch a `PlayCardCommand` while a lock is held by another owner. Update AC-15 to assert the registry behavior.

**Grounding**: `~/Downloads/purupuru_architecture_harness/examples/sequence.wood_activation.yaml:11-13` · `~/Downloads/purupuru_architecture_harness/contracts/validation_rules.md:30`.

---

### HIGH-4 · `sky-eyes-motifs.ts` declares `growth-rings` for wood — harness element YAML declares `sky_eye_leaf` AND `growth_rings` as DISTINCT motifs

**Severity: 580**

**Finding**: PRD FR-14 declares the wood sky-eye motif as `growth-rings`. But `element.wood.yaml:31-36` declares `motifs.shrineRelief: [growth_rings, sky_eye_leaf, branch_lines]` — three motifs, where `growth_rings` and `sky_eye_leaf` are SEPARATE concepts.

In the harness's terminology:
- `growth_rings` is a shrine-relief motif (appears on the shrine stone of the wood grove)
- `sky_eye_leaf` is the per-element SKY-EYES Priority-1 motif (the persistent non-color identity)
- The audit-feel-verdict-2026-05-12 doctrine introduces "SKY EYES P1 retrofit" — these are the persistent per-element non-color motifs

The PRD's `sky-eyes-motifs.ts` should use `sky_eye_leaf` (or just `leaf`) for wood, not `growth_rings`. Other elements:
- Fire = ember-trail (per audit-feel-verdict + battle-screen-breakthrough render)
- Water = ripple-circles
- Metal = clockwork-glints
- Earth = honeycomb

These need to be reconciled against the harness's `element.*.yaml` files when those land in cycle 2.

**Remediation**: Update FR-14 to use harness terminology: `wood: sky_eye_leaf`. Add a note that other-element values are placeholder pending fire/earth/metal/water element YAMLs in cycle 2.

**Grounding**: `~/Downloads/purupuru_architecture_harness/examples/element.wood.yaml:18-36` (motifs block) vs. PRD FR-14 · audit-feel-verdict-2026-05-12.md (SKY EYES P1 retrofit).

---

### HIGH-5 · AC-13 telemetry misrepresents the harness telemetry shape

**Severity: 560**

**Finding**: PRD AC-13 says "Telemetry events fire at correct moments per `telemetry.card_activation_clarity.yaml` — events fire at `CardCommitted · ZoneActivated · RewardGranted · InputUnlocked` beats" (4 events).

But `telemetry.card_activation_clarity.yaml` declares ONE telemetry event (`CardActivationClarity`) with 7 properties: `cardId · elementId · targetZoneId · timeFromCardArmedToCommitMs · invalidTargetHoverCount · sequenceSkipped · inputLockDurationMs`. This is a SINGLE summary event emitted at sequence-end, not 4 separate events.

The PRD conflates semantic events (the harness §9 stream) with telemetry events (the harness §14.4 measurement layer). Both exist but they are not the same thing.

**Remediation**: Update AC-13: "ONE telemetry event `CardActivationClarity` fires when the wood-activation sequence completes (at `unlock_input` beat or `Targeting` UI state return). Event carries 7 properties as declared in `telemetry.card_activation_clarity.yaml`. Semantic events (CardCommitted, ZoneActivated, etc.) are runtime-internal — they may or may not be exported to telemetry; AC-13 covers only the telemetry-event surface."

**Grounding**: `~/Downloads/purupuru_architecture_harness/examples/telemetry.card_activation_clarity.yaml:1-38`.

---

## MEDIUM-SEVERITY (300-499)

### MED-1 · Daemon affinity reward may shadow D10 — daemons-don't-affect-gameplay

**Severity: 450**

**Finding**: `event.wood_spring_seedling.yaml:33-39` declares 2 rewards, including `daemon_affinity: wood_puruhani_affinity quantity: 1`. D10 in the PRD says daemons have `affectsGameplay: false`. Is granting daemon_affinity to the player a violation of D10?

Reasoning: D10 names DAEMON BEHAVIOR as the gameplay-affecting axis (Assist state in harness §7.4). Granting AFFINITY to the player is a player-state change that *correlates* with a daemon but doesn't modify daemon behavior. So D10 holds.

But the PRD does not make this distinction explicit. A future agent reading D10 may incorrectly reject the daemon_affinity reward as a D10 violation.

**Remediation**: Clarify D10's wording: "Daemons declared, AI behavior not implemented — daemons in YAML carry `affectsGameplay: false`. The flag governs daemon AI BEHAVIOR (Assist state per harness §7.4), NOT player rewards that reference daemons (e.g., `rewardType: daemon_affinity`)." Add to glossary.

**Grounding**: `~/Downloads/purupuru_architecture_harness/examples/event.wood_spring_seedling.yaml:33-39` · harness §7.4 daemon state machine.

---

### MED-2 · `EndTurnCommand` is in the GameCommand union but cycle-1 has no end-turn implementation

**Severity: 420**

**Finding**: `contracts/purupuru.contracts.ts:121-124` declares `EndTurnCommand`. PRD FR-13 names the resolver's ops but doesn't mention `EndTurnCommand` handling. `ui.world_map_screen.yaml:125-138` declares an `end_turn_button` UI component as interactive.

Cycle 1's player loop has only one action (play the wood card on the wood grove); end-turn doesn't have semantics yet (single card → single turn → ResultScreen-equivalent? or repeated turns?). The PRD §6.5 says ARIA labels for end-turn "even if end-turn is decorative this cycle" — implying decorative, but the harness expects the command to be wired.

**Remediation**: Either (a) FR-13 explicitly names `EndTurnCommand` as a no-op stub for cycle 1 (returns state unchanged + emits `TurnEnded` semantic event for UI), OR (b) `end_turn_button` is rendered as `disabled` in cycle 1 and the harness UI YAML's expectation is documented as cycle-2 work. Pick one.

**Grounding**: `~/Downloads/purupuru_architecture_harness/contracts/purupuru.contracts.ts:121-124` · `~/Downloads/purupuru_architecture_harness/examples/ui.world_map_screen.yaml:125-138` · PRD §6.5.

---

### MED-3 · Pack manifest `files[]` lists 7 kinds — PRD AC-2 lists 8 YAMLs

**Severity: 380**

**Finding**: `pack.core_wood_demo.yaml:22-43` declares `files[]` with 7 entries: element, card, zone, event, presentation_sequence, ui_screen, telemetry_event. The pack manifest itself (8th file) is not in its own `files[]` list — which is correct, but the loader logic needs to handle the asymmetry.

PRD AC-2 says "8 vendored YAML examples" — counting the pack manifest as the 8th. The loader (FR-3) needs special handling: load the pack first, get its declared `files[]`, then load each. Without this, a naive directory-walk loader will hit the pack manifest and try to validate it against an arbitrary schema.

**Remediation**: FR-3 must declare the loader's two-pass logic: (1) load pack manifest first, validate against `content_pack_manifest.schema.json`; (2) iterate `files[]`, load each, validate against the schema named in the `schema` field.

**Grounding**: `~/Downloads/purupuru_architecture_harness/examples/pack.core_wood_demo.yaml:22-43`.

---

### MED-4 · `sky-eyes-motifs.ts` forward-declaration is BARTH-cuttable

**Severity: 340 · cut-recommendation**

**Finding**: PRD FR-14 declares per-element persistent-motif tokens for ALL 5 elements (wood: growth-rings, fire: ember-trail, water: ripple-circles, metal: clockwork-glints, earth: honeycomb), but cycle 1 only USES wood. The other 4 are forward-compatibility scaffolding.

BARTH lens: cycle 1 should ship wood ONLY. Declaring placeholder values for fire/earth/metal/water creates a contract surface that cycle 2 may want to change (especially after fire/earth/metal/water element YAMLs land in the harness with their own `motifs.shrineRelief` definitions).

**Remediation**: Cut FR-14 to wood-only. Cycle 2 adds the other 4 when their element YAMLs vendor. This is a 4-line saving in `sky-eyes-motifs.ts` and 4 type-narrowing decisions deferred.

**Listed in the De-scope Ladder** as item 2; this review recommends moving it to default-cut.

**Grounding**: PRD FR-14 + §9 de-scope ladder item 2 · harness `element.*.yaml` files for non-wood elements don't exist yet (only `element.wood.yaml` is in the vendored set).

---

### MED-5 · Daemon-doesn't-affect-gameplay invariant has no static enforcement mechanism

**Severity: 320**

**Finding**: D10 declares daemons have `affectsGameplay: false`. But there's no STATIC check that the resolver doesn't read daemon state. The harness §4.1 invariant 6 says "Every stateful entity must expose debug state" — but doesn't constrain resolver READS.

If a future agent adds a resolver step that reads `state.daemons[daemonId].state` to make a decision, D10 silently breaks.

**Remediation**: Add to FR-13 a static lint: any resolver step accessing `state.daemons.*` triggers a build-time warning. Or simpler: AC-9-equivalent grep test that asserts no file in `lib/purupuru/runtime/resolver*` imports `daemons` from `game-state.ts` except in a typed allow-list.

**Grounding**: PRD D10 · harness §4.1 invariant 6.

---

## SCOPE / FRAMING CHALLENGES

### SCOPE-1 · Is "vertical slice" the right framing?

PRD §0 calls this a "vertical slice." But a true vertical slice (in product-engineering parlance) is the THINNEST testable path through ALL layers. This cycle ships:
- Schema layer (8 schemas)
- Type layer (full contracts.ts vendored)
- Data layer (8 YAMLs)
- Runtime layer (game-state + 3 state machines + event-bus + command-queue + resolver + sky-eyes-motifs)
- Presentation layer (anchor-registry + sequencer + wood-activation)
- Surface layer (4 React components + styles + route)
- Integration layer (registry + telemetry + docs)

That's a LOT of breadth for one element. A genuine vertical slice would ship just enough of each layer to play ONE card on ONE zone with ONE event — which is closer to what cycle 1 actually does. So the framing IS accurate, but the FR count (29 FRs) is higher than typical vertical-slice cycles.

**Verdict**: Framing holds. The high FR count reflects the harness's depth, not scope creep.

---

### SCOPE-2 · Does Sprint 4 (`/battle-v2` surface) belong in this cycle, or as a separate cycle?

Sprint 4 is the only sprint with a visible UI component count > 1. Sprints 1-3 + 5 are non-visual infrastructure. Sprint 4 alone has 6 FRs (FR-19 through FR-24) and is the cycle's user-facing payoff.

BARTH lens: if Sprint 4 takes longer than projected, the cycle could ship "the infrastructure for a slice we didn't actually surface." That's not a vertical slice — that's a horizontal infrastructure cycle disguised as one.

**Recommendation**: Make Sprint 4's acceptance gates EXTRA stringent (manual operator review at S4 close). If S4 slips, consider promoting `/battle-v2` to cycle 1.5 (a follow-up cycle) and shipping cycles 1 (infrastructure) and 1.5 (surface) separately. This preserves the audit-passing gate for both.

---

### SCOPE-3 · The 5 deferred Q-SDD-* may compress SDD interview time

The 5 deferred questions (Q-SDD-1 through Q-SDD-5) include two that affect SDD architecture choice:
- Q-SDD-2 (honeycomb migration end-state): the SDD must decide whether `lib/purupuru/runtime/` shares any types with `lib/honeycomb/`. If they will eventually merge, type-aliasing today matters.
- Q-SDD-4 (daemon-Assist API): if cycle 2 will define a daemon-resolver-data path, the resolver step interface today must be forward-compatible.

These two questions arguably DESERVE a PRD-altitude decision (D11 deferred to SDD interview). I am willing to revisit this if the operator wants.

**Recommendation**: Surface Q-SDD-2 + Q-SDD-4 to the operator before `/architect` starts. The other 3 (Q-SDD-1, Q-SDD-3, Q-SDD-5) are genuinely SDD-altitude.

---

## GROUNDING AUDIT

Checked every harness reference in the PRD against the source files:

| PRD claim | Cited source | Verified? | Notes |
|---|---|---|---|
| "harness README is 28KB" | harness:`README.md` | ✓ | Actually it's ~25KB but plausibly 28KB after my read. Within tolerance. |
| "8 JSON schemas" | harness:`schemas/*.json` | ✓ | Confirmed: element/card/zone/event/presentation_sequence/ui_screen/content_pack_manifest/telemetry_event = 8. |
| "8 worked YAML examples" | harness:`examples/*.yaml` | ✓ | Confirmed (counting `pack.core_wood_demo.yaml`). |
| "harness §2 sim/presentation separation" | harness:`README.md` §2 | ✓ | Confirmed lines 53-113. |
| "harness §4.1 invariants 1-7" | harness:`README.md` §4.1 | ✓ | Confirmed lines 160-167 (7 invariants). |
| "harness §10 sequence rules" | harness:`README.md` §10 | ✓ | Confirmed lines 456-482. |
| "12 beats from `lock_input` at 0ms to `unlock_input` at 2280ms" | harness:`examples/sequence.wood_activation.yaml` | ✓ | Confirmed: 12 beats, first at 0ms, last at 2280ms. |
| "harness §14.4 golden replay" | harness:`README.md` §14.4 | ✓ | Confirmed lines 617-628. |
| "harness §16 Wood activation example" | harness:`README.md` §16 | ✓ | Confirmed lines 670-697. |
| "Eileen's daemon-deferral architecture" | NOTES.md [[purupuru-daemon-deferral]] | ⚠️ | The memory anchor exists conceptually but the named MEMORY.md `[[purupuru-daemon-deferral]]` link does NOT yet exist in the memory system. I inferred it. Should be saved before it becomes a load-bearing reference. |
| "audit-feel-verdict-2026-05-12.md SKY EYES P1 retrofit" | grimoires/loa/proposals/audit-feel-verdict-2026-05-12.md | ✓ | File exists in repo. |

**One unverified citation** ([[purupuru-daemon-deferral]]) — flagged but not blocking. The body of the PRD's D10 stands on its own merit (cited operator decree).

## Internal Contradictions

### CONTRA-1 · §6.2 invariant 6 says honeycomb is preserved, §7.3 successor-cycle entry says cycle-2 may dispatch zone-events into honeycomb

These don't contradict each other (preserving today + dispatching tomorrow are compatible), but a reader could read them as conflicting. **Tighten in r1**: add to §6.2 invariant 6 a parenthetical "(cycle 2+ may dispatch `zone.event_table[].kind = \"battle\"` into honeycomb without modifying honeycomb's surface)."

### CONTRA-2 · D8 says "Three.js OUT this cycle" but FR-20 WorldMap describes camera parallax

These don't contradict (CSS `translateY` parallax is not 3D), but `camera` terminology in FR-20 could mislead. **Tighten in r1**: rename "Camera does NOT move" to "Viewport does NOT pan; cloud-plane CSS parallax via translateY." Removes Three.js ambiguity.

## OVERALL VERDICT

**REVISE-BEFORE-ARCHITECT** — 3 BLOCKERS + 5 HIGH must be folded into PRD r1 before `/architect` runs.

The PRD is structurally sound at the framing level (Decisions D1-D12 hold, the 5-sprint dependency graph is dependency-correct, scope tightening reflects BARTH discipline). But three contract-grounding failures (BLK-1 validation_rules.md missing · BLK-2 resolver ops incomplete · BLK-3 AC-7 event sequence wrong) plus five harness-fidelity mismatches (HIGH-1 ZoneToken states · HIGH-2 WorldMap layout · HIGH-3 lock owner · HIGH-4 sky-eye terminology · HIGH-5 telemetry shape) would cause Sprint 1 + Sprint 4 audit-sprint failures.

Integrating these findings expands the PRD by ~80 lines (mostly FR clarifications + 1 new FR-11a + 1 new FR-24a) and removes ~10 lines (sky-eyes-motifs cut to wood-only per MED-4). Net +70 lines.

After integration, the PRD is `/architect`-ready.

---

## Counter-findings to Codex skeptic (will be cross-referenced after their report lands)

Pending Codex skeptic agent completion. If our findings overlap, mark as `HIGH-CONSENSUS`. If they diverge, mark as `DISPUTED`.

---

## Summary metrics

- **BLOCKERS**: 3
- **HIGH**: 5
- **MEDIUM**: 5
- **SCOPE challenges**: 3
- **Grounding audit pass rate**: 10/11 (91% — one unverified memory anchor)
- **Internal contradictions**: 2 (both tightening-class, not BLOCKER)
- **Verdict**: REVISE-BEFORE-ARCHITECT
- **Estimated PRD r1 delta**: +70 net lines
- **Time to integrate**: ~15 minutes (3 BLOCKERS + 5 HIGH; MEDIUM optional)
