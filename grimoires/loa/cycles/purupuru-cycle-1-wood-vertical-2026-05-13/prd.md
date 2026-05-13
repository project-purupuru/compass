---
status: flatline-integrated-r2
type: prd
cycle: purupuru-cycle-1-wood-vertical-2026-05-13
mode: ARCH (Ostrom) + SHIP (Barth) + craft lens (Alexander)
loa_flow: full-truenames (/plan-and-analyze → /architect → /sprint-plan → /run-sprint-plan → /review-sprint → /audit-sprint × 6)
branch: feat/purupuru-cycle-1 (worktree at /Users/zksoju/Documents/GitHub/compass-cycle-1 from origin/main · loa-upstream merged to cycle-108 tip)
predecessor_cycle: card-game-in-compass-2026-05-12 (shipped 2026-05-12 · 8 sprints) + battle-foundations-2026-05-12 (Layer primitive · 429-test coverage)
input_brief: grimoires/loa/specs/arch-enhance-purupuru-cycle-1-wood-vertical.md (ARCH+ENHANCE spec authored prior session 2026-05-13 AM)
canonical_spec_source: ~/Downloads/purupuru_architecture_harness/ (~25KB README · 8 JSON schemas · 8 worked YAML examples · TypeScript pseudocode sketch · creative-director-authored)
manual_flatline_r1: grimoires/loa/a2a/flatline/cycle-1-prd-consensus-2026-05-13.json (Opus structural + Codex skeptic · manual two-voice fallback because orchestrator was broken AM)
orchestrator_flatline_r2: grimoires/loa/a2a/flatline/cycle-1-sprint-codex-orchestrator-2026-05-13.json (3-voice codex-headless run on SPRINT.md · 10 BLK + 9 HIGH + 83% agreement · cycle-107 cheval routing enabled · cost $0 · the 4 top themes folded into PRD r2 + SDD r1)
created: 2026-05-13
revision: r2 · post-orchestrator-flatline (cycle-1 worktree · cheval routing live) · AC-7 contradiction resolved · AC-13/FR-26 bifurcated (Node sink + browser console fallback) · cycle-2 route handler deferred
operator: zksoju
authored_by: /plan-and-analyze (Opus 4.7 1M)
---

# PRD · Purupuru Cycle 1 · Wood Vertical Slice

> **r2 · post-orchestrator-flatline integration** (2026-05-13 PM). Cycle-1 worktree at compass-cycle-1 · cheval routing enabled · loa-upstream merged to cycle-108 tip. Orchestrator's 3-voice codex-headless run on sprint.md surfaced 10 BLOCKERS (severity 700-870), of which two my earlier Opus voice (this morning) missed: telemetry-JSONL boundary (severity 870 · browser cannot write filesystem JSONL) and harness-vendoring reproducibility (severity 760 · no version pin or fallback). 4 top themes integrated: AC-7 contradiction resolved · AC-13/FR-26 bifurcated (Node sink writes JSONL · browser sink console.log only · cycle-2 adds route handler) · harness preflight + input-lock lifecycle moved to SDD r1. r1 findings remain integrated.

> **r1 · post-manual-flatline integration** (2026-05-13 AM, preserved for archeology). 9 blockers + 10 high integrated. Operator-decided: 5-zone path = 1 real + 4 decorative · CardStack adapter built in S4 · telemetry destination = JSONL trail · lightweight S0 calibration spike added (now 6 sprints).

## 0 · TL;DR

Build the foundational simulation + presentation contracts of Purupuru in a NEW namespace `lib/purupuru/`, shipping a single playable element (Wood) end-to-end through the full pipe: schema-validated card data → command-emitting resolver → semantic-event stream → presentation sequence player → live React surface at `/battle-v2`. Existing code (`lib/cards/layers/`, `lib/honeycomb/`, `app/battle/`) is **preserved as superset architecture**: the harness contracts live in greenfield `lib/purupuru/`, the honeycomb battle sub-game stays canonical, and `lib/cards/layers/` remains the visual primitive that a thin `harnessCardToLayerInput()` adapter (S4) bridges into.

The cycle ships in **6 sprints** (added S0 calibration spike post-flatline). Each sprint independently passes `/implement → /review-sprint → /audit-sprint`. The cycle COMPLETED marker requires green on all 6.

**Done bar** (operator-ratified): at `/battle-v2`, the player can hover the wood card → see the ValidTarget pulse on the wood grove → click the grove → see the card travel as a sakura petal arc → see seedling-impact pulse → see local sakura weather start → see chibi-Kaori gesture → see daemon-reaction (presentation-only, gameplay-inert) → see reward-preview → see input unlock. The **11-beat sequence** (`lock_input` at 0ms → `unlock_input` at 2280ms) plays deterministically against a serialized fixture.

**Out of scope this cycle**: 4 non-wood elements (cycle 2 × 4 sprints), three.js viewport (cycle 2), daemon AI rule-based behaviors (cycle 2), card-target-validation rejection path (cycle 2), real cosmic-weather oracles (cycle 4+), transcendence cards (cycle 3), soul-stage AI agents (cycle 3+), daily-duel-against-friend retention loop (cycle 4+), migration of `lib/honeycomb/` or `lib/cards/layers/` (cycle 2+), refactor of existing `/battle` route.

## 0.5 · Pre-decided architecture choices (operator + Gumi-ratified)

PRD-level commitments. SDD elaborates HOW; SDD does not re-open WHAT.

| ID | Decision | Source | Rationale |
|---|---|---|---|
| **D1** · Greenfield namespace with named integration seams (r1: softened) | All harness contracts land in `lib/purupuru/`. Existing `lib/cards/layers/` + `lib/honeycomb/` + `app/battle/` untouched. **Integration seams declared**: (a) `harnessCardToLayerInput()` adapter (FR-21a · S4) bridges harness card types to honeycomb CardStack visuals; (b) `lib/registry/index.ts` imports `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` constants (flat-pattern, not namespaced); (c) `app/globals.css` OKLCH tokens consumed by `/battle-v2` styles. | build-doc §2 (row 1) + §3 + Codex skeptic SCOPE-2 wording softening | Greenfield avoids Svelte-runes-style behavior-rewrite cost. Named seams replace "zero risk" rhetoric — risk is LOW with explicit named edges. |
| **D2** · Schemas are CANONICAL, contracts.ts is ADVISORY pseudocode (r1: corrected per Codex SKP-HIGH-002) | Vendor 8 JSON schemas to `lib/purupuru/schemas/` — these are the persisted-content contract. Hand-author `lib/purupuru/contracts/types.ts` from `~/Downloads/purupuru_architecture_harness/contracts/purupuru.contracts.ts` as ADVISORY shape for runtime boundaries (the file header literally says "engine-agnostic TypeScript-style pseudocode... not mandate a TypeScript runtime"). Loader normalizes YAML `resolver.steps` to TS `resolverSteps` via a single mapper. Also vendor `contracts/validation_rules.md` to `lib/purupuru/contracts/validation_rules.md` (21 design-lint + runtime-assertion rules · NEW per Opus BLK-1). | contracts.ts:1-7 self-declares as pseudocode · harness §21 lists validation_rules.md as a peer of contracts.ts | Schemas + YAMLs are the persisted shape; TS types are local-convention. validation_rules.md is the design-lint surface that schema-validation alone misses. |
| **D3** · AJV at load-time + CI (r1: dependency delta corrected) | YAML content files loaded via `lib/purupuru/content/loader.ts` validated against vendored schemas with AJV. `scripts/validate-content.ts` runs in CI via `pnpm content:validate`. **Dependencies**: `ajv` ^8.20.0 and `ajv-formats` ^3.0.1 already in `package.json`; add only `js-yaml` ^4 (Codex SKP-MEDIUM-003 verified). | build-doc §2 (row 3) + harness §14.1 + `package.json` verification | Industry-standard, runs in node + browser. Reduced dependency delta = cleaner sprint diff. |
| **D4** · Pure functional resolver with FULL op set (r1: expanded per Opus BLK-2) | `lib/purupuru/runtime/resolver.ts` exposes `(state: GameState, command: Command) → { state, events: SemanticEvent[] }`. Deterministic. Replayable. Never touches DOM/audio/UI. **Implements 5 ops for cycle 1**: `activate_zone` + `spawn_event` + `grant_reward` + `set_flag` + `add_resource` (last two from `event.wood_spring_seedling.yaml`'s resolver steps — required for golden replay to complete). Plus `EndTurnCommand` as a no-op stub emitting `TurnEnded` semantic event (Opus MED-2 resolution). | build-doc §2 (row 4) + harness §4.1 + `card.wood_awakening.yaml:26-53` + `event.wood_spring_seedling.yaml:17-32` | Card command spawns an event; event has its OWN resolver steps. Both ops sets must execute for AC-7 golden replay to pass. |
| **D5** · Tiny typed EventEmitter (no external dep) | `lib/purupuru/runtime/event-bus.ts` is a minimal pub/sub for `SemanticEvent` union. No `mitt`, no `eventemitter3`, no Effect.PubSub. | build-doc §2 (row 5) + harness §9 | Honeycomb is `Effect.PubSub`-backed; harness namespace deliberately greenfield. Future composition is cycle-2 work. |
| **D6** · Frame-aligned beat scheduler with ±16ms tolerance (r1: rationale corrected per Codex SKP-MEDIUM-001) | `lib/purupuru/presentation/sequencer.ts` consumes events from event-bus, resolves `sequenceId`, schedules beats at `atMs` offsets via `requestAnimationFrame`. Tolerance: ±16ms (single-frame at 60Hz). Tests use injectable clock (Vitest fake timers), NOT wall-clock rAF. | Codex SKP-MEDIUM-001 + build-doc §2 (row 6) + harness §10 + `sequence.wood_activation.yaml` | rAF aligns to frame boundaries; sub-frame-precision was over-claim. Injectable clock makes tests deterministic. |
| **D7** · `/battle-v2` route | NEW route at `app/battle-v2/page.tsx`. | build-doc §2 (row 7) + operator confirmation 2026-05-13 PM | Discoverable, distinct from `/battle`. `/battle` stays untouched per D1. |
| **D8** · Three.js OUT this cycle | World-view renders in CSS + React only. R3F / shaders deferred to cycle 2. | build-doc §2 (row 9) | Cycle 2 ships R3F + 4 remaining elements together. |
| **D9** · YAML content packs · 1 real zone + 4 decorative locked tiles (r1: zone path landed per OD-1) | 8 worked YAML examples vendored to `lib/purupuru/content/wood/` (verbatim from harness, paths inside the pack manifest treated as **provenance-only** per Codex SKP-MEDIUM-002 — loader discovers colocated files). The vertical-slice surface renders **1 schema-backed zone (`wood_grove`) + 4 decorative locked tiles** (`water_harbor` · `fire_station` · `metal_mountain` · `earth_teahouse`) consuming element naming conventions only — no zone YAML backing. Decorative tiles are render-only; resolver/content validation excludes them; they cannot accept commands. | build-doc §2 (row 10) + operator decision 2026-05-13 PM (OD-1 chose path B) | Preserves the 5-zone visual framing without inventing content. Cycle 2 lands real zone YAMLs when fire/earth/metal/water elements ship. |
| **D10** · Daemons declared, not implemented · BEHAVIOR ≠ rewards (r1: clarified per Opus MED-1) | All daemon entries in zone YAML carry `affectsGameplay: false`. Daemon idle routines render as static art only this cycle. **D10's gameplay axis is daemon BEHAVIOR (Assist state per harness §7.4) — NOT player rewards keyed to daemons** (`rewardType: daemon_affinity` is a player resource, not a daemon-AI behavior). | build-doc §1 invariant 9 + harness §7.4 + Opus MED-1 + Eileen-ratified architecture | "Rule-based NPC + weather-change resets state + no continuity yet." Clarification prevents future agents from incorrectly cutting daemon_affinity rewards. |
| **D11** · 4 SDD-altitude questions deferred · telemetry destination DECIDED at PRD altitude (r1: split per OD-3) | §13 of the build doc names 5 open questions. **Q-SDD-5 (telemetry destination) is RESOLVED at PRD altitude**: JSONL trail at `grimoires/loa/a2a/trajectory/telemetry-cycle-1-*.jsonl` matching predecessor-cycle observability pattern (OD-3 chose A). Other 4 questions (Q-SDD-1/2/3/4) defer to `/architect` SDD interview as `Q-SDD-*`. | operator confirmation 2026-05-13 PM (OD-3) + Codex SCOPE-3 | None of the 4 remaining block sprint authoring. Telemetry destination affects FR-26/AC-13 — must be PRD-altitude. |
| **D12** · Cycle dir + branch + sprint shape (r1: 6 sprints not 5) | Cycle directory `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/` (date-suffixed). **6 sprints** (added S0 lightweight calibration spike per OD-4 + Codex SCOPE-1). Branch decision at `/architect` gate. | operator confirmation 2026-05-13 PM (OD-4) + Codex SCOPE-1 | Date suffix keeps `cycles/` directory time-orderable. S0 spike surfaces AJV/harness integration cost before S1 commits. |

## 1 · Problem

### 1.1 · Surface symptom

Compass has shipped two prior cycles' worth of card-game surface — Layer primitive (battle-foundations-2026-05-12 · 429 tests · `lib/cards/layers/`) and full honeycomb battle (card-game-in-compass-2026-05-12 · 8 sprints · `lib/honeycomb/` + `app/battle/`). The battle surface plays. But the game's `/battle` route still expresses **a card-vs-card combat sub-game**, not the **cozy tactical card-driven overworld** that Gumi (creative director) authored as the actual product vision.

Per harness README §0 (`~/Downloads/purupuru_architecture_harness/README.md:11`):

> "The core craft target is: **Play a card → target a world zone → the world answers.**"

The combat sub-game we shipped is a zoomed-IN moment that exists WITHIN that larger world. The harness defines the world-map shell that contains it. Without that shell, every future card we ship lacks the diegetic frame the creative direction requires.

### 1.2 · Root problem

Three architectural primitives are missing from compass that the harness names as load-bearing:

1. **A simulation/presentation separation layer** — current `lib/honeycomb/` puts state mutations + animation drivers in the same Effect Layers. Harness §2 declares them must be separate (`sim emits meaning; presentation dramatizes meaning`). The harness's `SemanticEvent` stream is the seam.
2. **A world-map shell** — current `/battle` has no concept of zones. Harness ships `zone.wood_grove.yaml` declaring 1 zone with anchors (uiTarget, activationImpact, weatherEmitter, focusRing), structures (sakura tree, shrine stone, torii), and a 9-state state machine (Locked → Idle → ValidTarget → Previewed → Active → Resolving → Afterglow → Resolved → Exhausted). The 5-zone overworld framing exists in the harness's UI screen YAML (`ui.world_map_screen.yaml` with 7 declared slots) — but only 1 zone has a backing YAML this cycle (4 are decorative locked tiles per D9).
3. **A content-pack format** — current cards are TS literal arrays in `lib/honeycomb/cards.ts`. Harness §11 + harness §15 declare cards must be **data-first** (YAML/JSON) with schema validation so non-engineers (Gumi, community creators) can author content without engine code.

Cycle 1 builds these three primitives **alongside** the existing battle sub-game, not on top of it. The honeycomb battle stays canonical for the in-arena fight; the new harness namespace ships the world-map shell that will (cycle 2+) dispatch `zone.event_table[].kind = "battle"` events INTO honeycomb.

### 1.3 · Strategic context

Operator memory (background-only per OperatorOS Doctrine Activation Protocol — these are orienting context, not activated doctrine): world-purupuru is the Rosenzu meta-world; compass + purupuru-game + purupuru are zone-experiences within that world. Honeycomb is the connective substrate across zones. The card game is one zone-experience.

The harness adds a layer ABOVE this: the world-map shell that presents zones to the player as a top-down 2.5D tactical surface. In Gumi's framing, the player is "performing small rituals into a living board" (harness §0). The battle sub-game is the most zoomed-in ritual. The wood-grove activation is a less-zoomed ritual that this cycle ships.

## 2 · Goals

### 2.1 · Primary goals

- **G1 · Foundational simulation pipe** — `lib/purupuru/runtime/{game-state, command-queue, resolver, event-bus, input-lock, ui-state-machine, card-state-machine, zone-state-machine}.ts` ship as pure-functional units. Resolver is deterministic and replayable from a serialized fixture. *(traces to build-doc §6 V1 #3-4 + harness §2 + §4.1 invariants 1-7)*
- **G2 · Foundational presentation pipe** — `lib/purupuru/presentation/{anchor-registry, actor-registry, ui-mount-registry, audio-bus-registry, sequencer}.ts` + `lib/purupuru/presentation/sequences/wood-activation.ts` ship. Sequencer subscribes to the event-bus and fires all **11 beats** of `sequence.wood_activation.yaml` at their declared `atMs` offsets (±16ms tolerance). Presentation NEVER mutates game state. **4 target registries** distinguish anchor/actor/UI/audio targets (Codex SKP-HIGH-005 resolution). *(traces to build-doc §6 V1 #5 + harness §2.2 + §4.1 invariant 4 + §10)*
- **G3 · 8 schemas + 8 worked YAML examples validated + validation_rules.md vendored** — all 8 JSON schemas vendored to `lib/purupuru/schemas/`. All 8 YAML examples vendored to `lib/purupuru/content/wood/`. `validation_rules.md` vendored to `lib/purupuru/contracts/validation_rules.md` (Opus BLK-1). Every YAML validates against its schema via `pnpm content:validate` + Vitest test suite. Design-lint subset enforced for cycle-1 wood pack (Codex SKP-MEDIUM-004). *(traces to build-doc §6 V1 #1-2 + harness §8 + §14.1 + §14.2)*
- **G4 · `/battle-v2` vertical slice** — new Next.js route ships the slot-driven UI screen (per `ui.world_map_screen.yaml`) with 1 schema-backed `wood_grove` zone + 4 decorative locked tiles + chibi-Kaori at the grove + 5-card hand fan + persistent UI. Player can play a wood card → see the full 11-beat sequence → see ZoneEvent active → input unlocks. CardHandFan uses existing `<CardStack>` via the `harnessCardToLayerInput()` adapter (FR-21a). *(traces to build-doc §6 V1 #6-7 + §5 component specs + OD-1 + OD-2)*
- **G5 · Deterministic replay against golden fixture** — playing `card.wood_awakening` on `zone.wood_grove` produces the deterministic 5-event sequence `CardCommitted → ZoneActivated → ZoneEventStarted → DaemonReacted → RewardGranted` against the serialized `core_wood_demo_001` fixture in `validation_rules.md` (Opus BLK-3 + Codex SKP-BLOCKER-002). Replay test green. *(traces to build-doc §6 V1 #8 + §7 sprint-2 acceptance + harness §14.4 + `validation_rules.md:36-81`)*
- **G6 · Full audit-passing slice** — every sprint (6 total) clears `/implement → /review-sprint → /audit-sprint`. Cycle COMPLETED marker requires green on all 6 gates. *(operator standard · card-game-cycle G6)*

### 2.2 · Secondary goals

- **G7 · Registry integration · flat-constant pattern** (r1: corrected) — `lib/registry/index.ts` imports `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` constants exported from `lib/purupuru/index.ts`, mirroring the existing `LAYER_REGISTRY` + `CARD_DEFINITIONS` flat-import pattern (NOT a namespaced `registry.purupuru.*` API — verified at `lib/registry/index.ts:27`). *(build-doc §3 + verified codebase pattern)*
- **G8 · Telemetry emission · JSONL trail destination** (r1: D11 split landed) — ONE `CardActivationClarity` event per sequence completion with the 7 declared properties (`cardId · elementId · targetZoneId · timeFromCardArmedToCommitMs · invalidTargetHoverCount · sequenceSkipped · inputLockDurationMs`) emitted at sequence-end (unlock_input beat) to JSONL trail at `grimoires/loa/a2a/trajectory/telemetry-cycle-1-*.jsonl` (Opus HIGH-5 + Codex SKP-HIGH-003 + OD-3). *(build-doc §7 sprint-5 + `telemetry.card_activation_clarity.yaml`)*
- **G9 · Cycle docs** — `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/README.md` summarizes the cycle's contracts + path index for the next agent. *(build-doc §7 sprint-5)*
- **G10 · SKY EYES P1 wood motif** (r1: cut to wood-only per Opus MED-4) — `lib/purupuru/runtime/sky-eyes-motifs.ts` declares the wood persistent-motif token using harness terminology `sky_eye_leaf` (Opus HIGH-4 — NOT `growth_rings` which is a separate shrine-relief motif). Other 4 elements deferred to cycle 2 when their `element.*.yaml` files ship. *(build-doc §3 NEW list + audit-feel-verdict-2026-05-12 + `element.wood.yaml:31`)*

### 2.3 · Non-goals (explicit cuts)

Per build-doc §6 V2 + §9 + §10. Cuts apply to THIS cycle only.

- ❌ **NO** three.js / R3F implementation — CSS + React renders the world-view (D8 · cycle 2)
- ❌ **NO** daemon AI behaviors — `affectsGameplay: false` everywhere (D10 · cycle 2)
- ❌ **NO** 4 non-wood elements (fire / earth / metal / water) — wood only (cycle 2 × 4 sprints)
- ❌ **NO** card play AGAINST mismatched-element zone — only valid wood→wood-grove path (cycle 2)
- ❌ **NO** card play AGAINST decorative locked tiles — they reject all commands by design (D9)
- ❌ **NO** transcendence cards (Forge / Void / Garden) — cycle 3
- ❌ **NO** soul-stage AI agents — cycle 3+
- ❌ **NO** real cosmic-weather oracles — cycle 4+
- ❌ **NO** daily-duel-against-friend retention loop — cycle 4+
- ❌ **NO** migration of `lib/honeycomb/` or `lib/cards/layers/` — preserved per D1 (cycle 2 evolves the adapter into full art_anchor integration; cycle 2+ dispatches `zone.event_table[].kind = "battle"` into honeycomb)
- ❌ **NO** refactor of existing `/battle` route — stays untouched per D1
- ❌ **NO** card foil shaders / particle systems beyond CSS keyframes — cycle 2
- ❌ **NO** mobile-first polish — desktop-first this cycle
- ❌ **NO** wallet / auth / Solana surface — harness is sim-only this cycle
- ❌ **NO** name harness creator (Gumi) or reference indie games in code comments — sanitization discipline per build-doc §9
- ❌ **NO** 4 other-element SKY EYES motifs (FR-14 cut to wood-only per Opus MED-4)

## 3 · Acceptance metrics

Every metric is independently verifiable. SDD will name the test fixture and review-sprint check for each.

| ID | Metric | Verification |
|---|---|---|
| AC-0 (r1: NEW) | S0 calibration spike: vendor 8 schemas + AJV-validate ONE YAML (`element.wood.yaml`) in an isolated script. Outcome: confirm AJV + schemas + vendored YAML compose without errors. | Script at `scripts/s0-spike-ajv-element-wood.ts` exits 0; report at `grimoires/loa/cycles/.../sprint-0-COMPLETED.md` confirms feasibility before S1 starts. ≤ 0.5 day spike. |
| AC-1 | 8 vendored JSON schemas exist under `lib/purupuru/schemas/` | `ls lib/purupuru/schemas/*.schema.json \| wc -l` returns 8 |
| AC-2 | 8 vendored YAML examples exist under `lib/purupuru/content/wood/`: element.wood · card.wood_awakening · zone.wood_grove · event.wood_spring_seedling · sequence.wood_activation · ui.world_map_screen · pack.core_wood_demo · telemetry.card_activation_clarity | `ls lib/purupuru/content/wood/*.yaml \| wc -l` returns 8 |
| AC-2a (r1: NEW) | `validation_rules.md` vendored to `lib/purupuru/contracts/validation_rules.md` | File exists; SDD references the 21 rules as the design-lint source |
| AC-3 | Every YAML validates against its schema via AJV | `pnpm content:validate` exits 0; Vitest test `lib/purupuru/__tests__/schema.validate.test.ts` green |
| AC-3a (r1: NEW per Codex SKP-MEDIUM-004) | Cycle-1 design-lint subset enforced for wood pack: Wood card has Wood verbs · localized weather is target-zone-only · input lock ends in unlock/fallback · no undefined zone tags · no locked resolver ops in non-core packs | Vitest test `lib/purupuru/__tests__/design-lint.test.ts` green for `pack.core_wood_demo.yaml` |
| AC-4 | TypeScript types compile against the contracts file | `pnpm typecheck` exits 0 with no purupuru-namespace errors |
| AC-5 | UI / Card / Zone state machines have full transition coverage per harness §7.1-7.3 | Vitest test `lib/purupuru/__tests__/state-machines.test.ts` green |
| AC-6 | Pure functional resolver returns `(state, events)` for every command in the union (5 commands: PlayCard · EndTurn · ActivateZone · SpawnEvent · GrantReward; EndTurn is no-op stub emitting TurnEnded) | Vitest test asserts resolver is referentially transparent (same input → same output) |
| AC-7 (r2: contradiction resolved per orchestrator SKP-004) | Resolver replay test produces deterministic event sequence in this order: `CardCommitted → ZoneActivated → ZoneEventStarted → DaemonReacted → RewardGranted+` (the `+` denotes 1-or-more) | Playing serialized `card.wood_awakening` command on `core_wood_demo_001` initial state produces the event sequence pattern. **Assertion mechanism**: test extracts `event.type[]` array from the resolver's `semanticEvents[]` output and matches against the regex `^CardCommitted,ZoneActivated,ZoneEventStarted,DaemonReacted(,RewardGranted)+$`. For `core_wood_demo_001` the exact count is 6 events (1 CardCommitted + 1 ZoneActivated + 1 ZoneEventStarted + 1 DaemonReacted + 2 RewardGranted for spring_pollen + wood_puruhani_affinity per `event.wood_spring_seedling.yaml:33-39`). Test asserts the sequence PATTERN, NOT a fixed total count — additional event-spawning rewards in future fixtures must not break this assertion. |
| AC-8 (r1: rewritten per Codex SKP-HIGH-005) | All **11 beats** of `wood_activation_sequence` fire at correct `atMs` offsets ±16ms. Per-target resolution: anchor-required beats resolve declared anchors; actor/daemon/UI/audio targets resolve through their separate registries. | Sequencer dry-run test with mock registries logs 11 beats with per-registry resolution success rate 100%. Offsets within ±16ms via injectable clock. |
| AC-9 | Presentation layer NEVER calls into resolver / game-state mutation | Static grep test: no `import` of `runtime/resolver` or `runtime/game-state` mutating exports from any file under `lib/purupuru/presentation/`. Also: resolver MUST NOT import `daemons` getter from `game-state.ts` (Opus MED-5 daemon-read prevention). |
| AC-10 (r1: updated per OD-1) | `/battle-v2` renders the slot-driven world screen with 1 schema-backed `wood_grove` zone + 4 decorative locked tiles + Sora Tower + chibi-Kaori + 5-card hand fan | `curl -sf http://localhost:3000/battle-v2` returns HTML; manual visual check shows 5 zones (1 active + 4 locked) + Sora Tower + Kaori at grove + hand fan |
| AC-11 (r1: 11 beats) | At `/battle-v2`, hover wood card → ValidTarget pulse on `wood_grove` → click `wood_grove` → full **11-beat sequence** plays → input unlocks → ZoneEvent active. Clicking any of the 4 decorative locked tiles is rejected with no state change. | E2E test via Playwright; assertions on DOM state transitions + 11-beat event log |
| AC-12 (r1: flat-pattern verified) | Registry integrity check passes — `lib/registry/index.ts` imports `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` from `lib/purupuru/index.ts` | `pnpm typecheck` + `lib/registry/__tests__/index.test.ts` confirms imports resolve cleanly |
| AC-13 (r2: scope to Node tests per orchestrator SKP-001 BLOCKER-870) | ONE `CardActivationClarity` telemetry event emitted at sequence-end (`unlock_input` beat). Cycle-1 emits the event from the **Node-side replay test only** — browser `/battle-v2` runtime emits the event to `console.log` (browser fallback) WITHOUT JSONL persistence (browsers can't write to `grimoires/loa/a2a/trajectory/`). Cycle-2 adds a Next.js route handler (`app/api/telemetry/cycle-1/route.ts`) that the browser POSTs to, which writes the JSONL server-side. | Test asserts (a) replay test emits ONE event with all 7 properties; (b) Node-side persistence writes one valid JSONL line to `grimoires/loa/a2a/trajectory/telemetry-cycle-1-{YYYYMMDD}.jsonl`; (c) browser console.log fires when `/battle-v2` completes a sequence. **NOT asserted in cycle-1**: browser-to-server-to-JSONL persistence (deferred to cycle-2). |
| AC-14 | GameState serializes to localStorage + deserializes back to identical typed object | Vitest test asserts `parse(serialize(state)) === state` deep-equal; schema versioning honored |
| AC-15 | Input lock is SOFT per `inputPolicy.lockMode: soft` in sequence YAML; **lock-owner registry tracks ownership** (Opus HIGH-3) | During the 11-beat sequence, player can hover other cards but cannot commit until `unlock_input` beat fires at 2280ms. Lock-owner registry asserts `acquireLock` / `releaseLock` invariants from `validation_rules.md:30`. |
| AC-16 | Per-sprint COMPLETED markers exist | `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/sprint-{0..5}-COMPLETED.md` exist with green-gate signoff (6 sprints total) |
| AC-17 (r1: budget unchanged) | Net LOC budget: ≤ **+4,500** lines under `lib/purupuru/` + `app/battle-v2/` + tests. ≤ +50 lines under `lib/registry/index.ts` + `package.json` + `app/kit/page.tsx`. Asset additions: zero (CSS + React render in cycle 1). | Manual LOC tally at each sprint close; cycle total at S5 close. S0 spike script not counted (delete-after-spike). |
| AC-18 | Cycle docs exist | `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/README.md` lists each contract + path + one-line behavior summary; sprint-plan archived alongside |

## 4 · Users & stakeholders

**Primary user (this cycle)**: the operator (zksoju). The `/battle-v2` route is a developer surface in cycle 1; the player-facing audience expands as cycle 2 lands 4 more elements.

**Secondary stakeholders**:
- **Gumi** — creative director, harness author. Zero codebase awareness — the harness is greenfield spec authored from the game pitch. Should be informed at S1 (schema vendoring confirms her contracts) and S4 (visual slice ships her wood activation moment). Non-blocking, async.
- **Eileen** — daemon-NFT + substrate-truth doctrine author. Validated the daemon-deferral architecture ("rule-based NPC + weather-change resets state + no continuity yet"). Reference only this cycle.
- **Zerker** — Score API + observatory parallel lane. No direct dependency this cycle.
- **Future content creators** — harness §15 names community-extensible content. Cycle 1 ships the validation pipe; community content is cycle 3+.
- **Future players** — cycle 1's vertical slice is a designer/developer demo. Player audience expands when cycle 2 lands the 4 remaining elements + spatial 3D scene.

## 5 · Functional requirements

### 5.1 · S0 calibration spike (lightweight · NEW per OD-4)

| FR ID | Requirement | Verification |
|---|---|---|
| FR-0 (r1: NEW) | Script at `scripts/s0-spike-ajv-element-wood.ts` vendors `element.schema.json` + `element.wood.yaml` to a scratch directory, runs AJV validation, exits 0 on success. Half-day max. Report at `sprint-0-COMPLETED.md`. Delete the spike script after S0 audit-sprint approves. | AC-0 |

### 5.2 · Schemas + contracts + content (Sprint 1)

| FR ID | Requirement | Verification |
|---|---|---|
| FR-1 | 8 JSON schemas vendored from `~/Downloads/purupuru_architecture_harness/schemas/*.schema.json` to `lib/purupuru/schemas/` | AC-1 |
| FR-2 (r1: corrected per Codex SKP-HIGH-001 + Codex SKP-HIGH-002) | `lib/purupuru/contracts/types.ts` hand-authored from `~/Downloads/purupuru_architecture_harness/contracts/purupuru.contracts.ts` — treated as ADVISORY pseudocode for runtime boundaries. **SemanticEvent union = 15 types** per `contracts.ts:151-166`: CardHovered · CardArmed · TargetPreviewed · TargetCommitted · CardPlayRejected · CardCommitted · CardResolved · ZoneActivated · ZoneEventStarted · ZoneEventResolved · DaemonReacted · RewardGranted · WeatherChanged · InputLocked · InputUnlocked. README §9 lists 5 additional names (CardConsumed · ZoneBecameValidTarget · ZonePreviewed · DaemonRoutineChanged · TurnEnded) which are README-only and deferred from cycle 1. Loader maps YAML `resolver.steps` → TS `resolverSteps` (camelCase normalization). | AC-4 |
| FR-2a (r1: NEW per Opus BLK-1) | `validation_rules.md` vendored from `~/Downloads/purupuru_architecture_harness/contracts/validation_rules.md` to `lib/purupuru/contracts/validation_rules.md` (verbatim) | AC-2a |
| FR-3 (r1: pack-as-provenance per Codex SKP-MEDIUM-002) | `lib/purupuru/content/loader.ts` reads YAML, validates against the appropriate schema via AJV, returns typed objects. Pack manifest treated as PROVENANCE-ONLY — loader discovers colocated YAMLs by directory walk, not by following manifest paths (which reference `examples/*.yaml` and would break post-vendoring). | AC-3 |
| FR-4 | 8 worked YAML examples vendored to `lib/purupuru/content/wood/` | AC-2 |
| FR-5 | `scripts/validate-content.ts` walks `lib/purupuru/content/wood/*.yaml`, AJV-validates each against its schema, exits 0 on success. **Also runs the 5 cycle-1 design-lint checks** (AC-3a). | `pnpm content:validate` |
| FR-6 (r1: dep delta corrected per Codex SKP-MEDIUM-003) | `package.json` declares `pnpm content:validate` script + adds `js-yaml` ^4 to dependencies. `ajv` ^8.20.0 and `ajv-formats` ^3.0.1 are already present (verified). | grep verification |

### 5.3 · Runtime (Sprint 2)

| FR ID | Requirement | Verification |
|---|---|---|
| FR-7 | `lib/purupuru/runtime/game-state.ts` exports typed `GameState` + `createInitialState(runId, dayElementId)` factory | AC-4 + AC-14 |
| FR-8 | `lib/purupuru/runtime/ui-state-machine.ts` exports pure `transition(mode: UiMode, event: SemanticEvent): UiMode` per harness §7.1 | AC-5 |
| FR-9 | `lib/purupuru/runtime/card-state-machine.ts` exports pure `transition(location: CardLocation, event: SemanticEvent): CardLocation` per harness §7.2 | AC-5 |
| FR-10 | `lib/purupuru/runtime/zone-state-machine.ts` exports pure `transition(state: ZoneState, event: SemanticEvent): ZoneState` per harness §7.3 (9 states) | AC-5 |
| FR-11 | `lib/purupuru/runtime/event-bus.ts` exports a minimal typed EventEmitter with `subscribe(eventType, handler)` + `emit(event)` + `unsubscribe` returned for cleanup. No external dependency. | AC-9 |
| FR-11a (r1: NEW per Opus HIGH-3) | `lib/purupuru/runtime/input-lock.ts` exposes `acquireLock(ownerId, mode)` + `releaseLock(ownerId)` + `transferLock(fromOwnerId, toOwnerId)`. Resolver MUST refuse to dispatch `PlayCardCommand` while a lock is held by another owner. Validates the runtime-assertion at `validation_rules.md:30`. | AC-15 |
| FR-12 | `lib/purupuru/runtime/command-queue.ts` exports typed `enqueue(command)` + `drain()` for the 5 `GameCommand` types. **Emits `CardCommitted` semantic event on accepted PlayCard enqueue** (resolves Codex SKP-BLOCKER-002's source-of-CardCommitted question). | AC-6 + AC-7 |
| FR-13 (r1: ops list complete per Opus BLK-2 + EndTurn stub per Opus MED-2) | `lib/purupuru/runtime/resolver.ts` exports `resolve(state, command, content): ResolveResult`. Pure function. No side effects. **Implements 5 resolver-step ops**: `activate_zone` (card.wood_awakening) + `spawn_event` (card.wood_awakening) + `grant_reward` (card.wood_awakening + event.wood_spring_seedling) + `set_flag` (event.wood_spring_seedling) + `add_resource` (event.wood_spring_seedling). **Implements 5 commands**: PlayCard (full pipe) · EndTurn (no-op stub emitting `TurnEnded` semantic event — N.B. TurnEnded is README-only per FR-2; emit as a custom marker until cycle 2 adds it to contracts) · ActivateZone (system-only) · SpawnEvent (system-only) · GrantReward (system-only). | AC-6 + AC-7 |
| FR-14 (r1: cut to wood-only per Opus MED-4 + terminology per Opus HIGH-4) | `lib/purupuru/runtime/sky-eyes-motifs.ts` declares the **wood** persistent-motif token using harness terminology: `wood: "sky_eye_leaf"` (from `element.wood.yaml:31`). Other 4 elements deferred to cycle 2. | AC-4 |
| FR-14a (r1: NEW per Opus MED-5) | Static grep enforcement: no file matching `lib/purupuru/runtime/resolver*.ts` imports `daemons` getter from `game-state.ts`. Enforces D10 daemon-behavior-read prevention. | AC-9 |

### 5.4 · Presentation (Sprint 3)

| FR ID | Requirement | Verification |
|---|---|---|
| FR-15 (r1: split per Codex SKP-HIGH-005) | Four target registries: `lib/purupuru/presentation/{anchor,actor,ui-mount,audio-bus}-registry.ts` each resolves declared target IDs to runtime refs. Anchors = coordinate hooks (e.g., `anchor.wood_grove.seedling_center`). Actors = animatable characters (e.g., `actor.kaori_chibi`). UI-mounts = mounted React surfaces (e.g., `ui.reward_preview`). Audio-buses = audio routing channels (e.g., `audio.bus.sfx`). Fail open with warning if unbound at sequence fire-time. | AC-8 |
| FR-16 (r1: 11 beats + multi-registry) | `lib/purupuru/presentation/sequencer.ts` subscribes to event-bus, on `CardCommitted` event resolves `sequenceId` from the card definition, schedules all 11 beats via `requestAnimationFrame` at declared `atMs` offsets. Each beat resolves its target through the appropriate registry. | AC-8 + AC-9 + AC-15 |
| FR-17 (r1: 11 beats enumerated correctly) | `lib/purupuru/presentation/sequences/wood-activation.ts` is a TypeScript implementation of `sequence.wood_activation.yaml` with all **11 beats**: `lock_input` (0ms · ui.input · soft mode) · `card_anticipation` (0-180ms · card.source · dip_then_lift) · `launch_petal_arc` (120-740ms · vfx.sakura_arc · spline) · `play_launch_audio` (140ms · audio.bus.sfx) · `impact_seedling` (720-980ms · anchor.wood_grove.seedling_center) · `start_local_sakura_weather` (820-2020ms · anchor.wood_grove.petal_column · target_zone_only scope) · `activate_focus_ring` (820-1720ms · zone.wood_grove · active_focus state) · `kaori_gesture` (940-1640ms · actor.kaori_chibi · nurture_gesture) · `daemon_reaction` (1040-1600ms · daemon.wood_puruhani_primary · reverent_hop) · `reward_preview` (1680-2200ms · ui.reward_preview · spring_pollen cue) · `unlock_input` (2280ms · ui.input · WorldMapIdle next state). Each beat binds to its declared target through the correct registry. | AC-8 + AC-11 |
| FR-18 | Sequencer respects `inputPolicy.lockMode: soft` from the YAML — during the 11-beat run, hover events propagate but commit events are rejected with `CardPlayRejected.reason = "input_locked"`. Lock ownership tracked via FR-11a. | AC-15 |

### 5.5 · `/battle-v2` surface (Sprint 4)

| FR ID | Component | Compass destination | Required behavior |
|---|---|---|---|
| FR-19 | **Route shell** | `app/battle-v2/page.tsx` | Next.js route shell; mounts the BattleV2 client component. No auth required. |
| FR-20 (r1: slot-driven per Opus HIGH-2) | **UiScreen wrapper** | `app/battle-v2/_components/UiScreen.tsx` | Generic slot-driven layout wrapper that consumes `ui.world_map_screen.yaml`'s `layoutSlots[]` + `components[]` arrays. Renders 7 declared slots: title_cartouche · focus_banner · selected_card_preview · world_map (60×58% center) · card_hand · deck_counter · end_turn_button. Components inside slots bind via `bindsTo` field. Hanko markers + blank-art surfaces per harness §11.1. |
| FR-20a (r1: WorldMap is a child of slot.center.world_map) | **WorldMap** | `app/battle-v2/_components/WorldMap.tsx` | Mounts inside `slot.center.world_map` (60×58%). Cosmic-indigo void · cream map-island · SVG noise filter. **1 schema-backed `wood_grove` zone** + **4 decorative locked tiles** (water_harbor · fire_station · metal_mountain · earth_teahouse) + Sora Tower at center. Decorative tiles render as static element-stamps with dim outlines; they cannot accept commands. Viewport does NOT pan; cloud-plane CSS `translateY` parallax 8-12s loop. Per build-doc §5 WorldMap spec + OD-1 path B. |
| FR-21 | **CardHandFan** | `app/battle-v2/_components/CardHandFan.tsx` | Persistent bottom-edge 5-card hand. Mounts inside `slot.bottom.card_hand`. Shallow horizontal fan; center card lifted `translateY(-12px)` on hover. Hovered card carries amber-honey halation `oklch(0.82 0.14 85)`. Cards rendered via existing `<CardStack>` via the FR-21a adapter. |
| FR-21a (r1: NEW per Codex SKP-BLOCKER-004 + OD-2) | **Card-type adapter** | `lib/purupuru/presentation/harness-card-to-layer-input.ts` | Maps harness `CardDefinition` to honeycomb `CardStack` props. For cycle 1, `cardType: "activation"` maps to layer-system `cardType: "caretaker_a"` with element from card definition. Adapter is a single function `harnessCardToLayerInput(card: CardDefinition): LayerInput`. Documented as the cycle-2 evolution point: when full `art_anchor` integration ships, this adapter becomes the bridge. ~50 LOC. |
| FR-22 (r1: 9+6 state compose per Opus HIGH-1) | **ZoneToken** | `app/battle-v2/_components/ZoneToken.tsx` | Per-zone token. Discrete painted-illustration on cream-map base; ink-line silhouette `oklch(0.18 0.02 260)` + flat-color interior fill. **Two orthogonal state spaces**: (a) **gameplay states** from harness §7.3 zone state machine: Locked · Idle · ValidTarget · InvalidTarget · Previewed · Active · Resolving · Afterglow · Resolved · Exhausted (10 values); (b) **UI interaction states** from `validation_rules.md:21`: idle · hovered · pressed · selected · disabled · resolving (6 values). The decorative locked tiles are pinned to gameplay=Locked + UI=disabled. Outline visuals from harness `element.wood.yaml:colorTokens`. |
| FR-23 | **SequenceConsumer** | `app/battle-v2/_components/SequenceConsumer.tsx` | Invisible React component (useEffect host) that subscribes to event-bus, registers anchors/actors/UI-mounts/audio-buses into their respective registries (FR-15), delegates beat actions to UI-rendering child components. |
| FR-24 | **Styles** | `app/battle-v2/_styles/battle-v2.css` | OKLCH-palette adherence per `app/globals.css` token system. Per-element breathing rhythms used at idle (wood = `--breath-wood`). Easing curves use `puru-flow` / `puru-emit`. Per build-doc §8 design rules. |

### 5.6 · Integration + telemetry + docs (Sprint 5)

| FR ID | Requirement | Verification |
|---|---|---|
| FR-25 (r1: flat-pattern per AC-12) | `lib/purupuru/index.ts` exports `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` constants. `lib/registry/index.ts` imports them alongside existing `LAYER_REGISTRY` + `CARD_DEFINITIONS`. NOT a `registry.purupuru.*` namespace. | AC-12 |
| FR-26 (r2: bifurcate Node vs browser per orchestrator SKP-001) | ONE `CardActivationClarity` event per completed sequence with the 7 properties from `telemetry.card_activation_clarity.yaml`. Fires at `unlock_input` beat. **Bifurcated emission path**: (a) Node-side (replay test, sprint-2/3 unit tests, CI smoke): `lib/purupuru/presentation/telemetry-node-sink.ts` appends one JSONL line to `grimoires/loa/a2a/trajectory/telemetry-cycle-1-{YYYYMMDD}.jsonl` via `fs.appendFileSync`. (b) Browser-side (`/battle-v2`): `lib/purupuru/presentation/telemetry-browser-sink.ts` calls `console.log("[telemetry]", event)` only — no persistence. Cycle-2 replaces browser sink with `fetch('/api/telemetry/cycle-1', {method: 'POST', body})` writing through a Next.js route handler. Both sinks consume the same `CardActivationClarity` shape; environment detection chooses sink. | AC-13 |
| FR-27 | `app/kit/page.tsx` adds a link to `/battle-v2` | Manual visual check |
| FR-28 | `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/README.md` documents the cycle's contracts + path index + one-line behavior summary per file | AC-18 |
| FR-29 (r1: gate typo fixed per Codex SKP-HIGH-004) | Sprint COMPLETED markers ship per sprint: `sprint-{0..5}-COMPLETED.md` + cycle-wide `CYCLE-COMPLETED.md` at S5 close gated by `/review-sprint sprint-5` + `/audit-sprint sprint-5` (NOT sprint-4 — build doc has same typo at line 312-313, fix at source) | AC-16 |

## 6 · Technical & non-functional

### 6.1 · Stack (minimal new dependencies · r1 corrected)

Inherited from compass (unchanged):
- Next.js 16.2.6 · React 19.2.4 · TypeScript 5 · Tailwind 4 (OKLCH token system) · Effect 3.10.x (honeycomb-only, NOT extended to harness namespace per D5) · motion 12.38.x · Vitest 3.x · Playwright 1.59 · pnpm 10.x

**Existing dependencies (verified)**:
- `ajv` ^8.20.0 (present)
- `ajv-formats` ^3.0.1 (present)

**New dependencies (Sprint 1 only)**:
- `js-yaml` ^4 (NEW · the only dep to add)

### 6.2 · Architectural constraints (harness invariants · NON-NEGOTIABLE)

Per harness §2 + §4.1 + `validation_rules.md` runtime assertions. Enforced by SDD lint checks + review-sprint gates.

1. **Sim/Presentation separation** — `lib/purupuru/runtime/*` MUST NOT import from `lib/purupuru/presentation/*`. Presentation MUST consume game state read-only via event-bus + React refs. AC-9 enforces.
2. **OKLCH wuxing palette** — `app/globals.css` token system. Non-negotiable visual law.
3. **Five-element Wuxing system** — wood / fire / earth / metal / water + Shēng + Kè cycles. Cycle 1 implements wood only.
4. **Composite-vs-Generate discipline** — cards declare `nameKey: card.wood_awakening.name`; text rendered separately, NEVER baked into art. Hanko stamps acceptable.
5. **Existing `lib/cards/layers/`** continues to be the visual primitive. The `harnessCardToLayerInput()` adapter (FR-21a) bridges to it in cycle 1. Cycle 2 evolves the adapter into full art_anchor integration.
6. **Existing `lib/honeycomb/` battle sub-game** stays as-is (cycle 2+ may dispatch `zone.event_table[].kind = "battle"` into honeycomb without modifying honeycomb's surface).
7. **Existing `/battle` route** stays functional. Cycle 1 ships parallel surface at `/battle-v2`.
8. **Cards must resolve through commands, not direct UI callbacks** — harness §4.1 invariant 1.
9. **Card definitions must be data-first** — harness §4.1 invariant 2.
10. **Game state must be serializable** — harness §4.1 invariant 3. AC-14 enforces.
11. **Presentation sequences must not mutate game state** — harness §4.1 invariant 4. AC-9 enforces.
12. **Every player-facing resolving action must emit semantic events** — harness §4.1 invariant 7. AC-7 enforces.
13. **An input lock owner must be registered and must release or transfer ownership** — `validation_rules.md:30`. FR-11a enforces.
14. **A card cannot exist in two locations at once** — `validation_rules.md:26`. State-machine tests enforce.
15. **A presentation sequence cannot emit gameplay mutations directly** — `validation_rules.md:31`. AC-9 enforces.

### 6.3 · Performance

- Initial `/battle-v2` route paint < 1.5s on local dev · < 3s on Vercel preview
- 11-beat sequence fires within ±16ms of declared `atMs` offsets (single rAF frame at 60fps)
- No memory leaks from event-bus subscriptions
- AJV schema-validation runs in <100ms per YAML

### 6.4 · Determinism / replayability

Per harness §14.4 + `validation_rules.md` golden replay `core_wood_demo_001`:
- Same `GameState` + same `Command` → same `ResolveResult` (resolver is pure function)
- Same `SemanticEvent` stream + same registry state → same presentation beats (sequencer is event-driven)
- AC-7 replay test serializes the golden fixture, runs resolver, asserts 5-event sequence

### 6.5 · Security · accessibility · i18n

- No new auth surface (sim-only this cycle)
- ARIA labels on interactive controls (hand-fan cards, zone tokens, end-turn button)
- Keyboard navigation: Tab through hand-fan cards, Enter to arm, Arrow keys to navigate zones, Enter to commit
- High-contrast mode: OKLCH tokens already split between vivid/dim/pastel/tint
- i18n: all user-facing copy through `LocalizationKey` per harness §11.1. Implementation deferred; structure forward-compatible.
- No PII in telemetry — events carry contentIds + EntityIds, not user identifiers

## 7 · Scope

### 7.1 · In (this cycle · 6 sprints)

- S0 calibration spike script (FR-0)
- 8 vendored JSON schemas + `validation_rules.md` (FR-1 · FR-2a)
- TypeScript contracts file with 15-member SemanticEvent union + camelCase normalization (FR-2)
- AJV-based YAML loader + content validation CLI + design-lint subset (FR-3 · FR-5 · FR-6)
- 8 vendored YAML worked examples (FR-4)
- Pure functional runtime: game-state · 3 state machines · event-bus · input-lock · command-queue · resolver (5 ops + 5 commands) · sky-eyes-motifs (wood only) · daemon-read-prevention (FR-7 through FR-14a)
- Presentation: 4 target registries · sequencer · 11-beat wood-activation sequence (FR-15 through FR-18)
- `/battle-v2` route: UiScreen · WorldMap (1 real + 4 locked) · CardHandFan + adapter · ZoneToken (9+6 states) · SequenceConsumer + styles (FR-19 through FR-24)
- Registry integration · ONE-event JSONL telemetry · cycle docs · gate typo fix (FR-25 through FR-29)
- Full audit-passing slice on a feature branch (G6 / AC-16)

### 7.2 · Out (explicit · also see §2.3 non-goals)

Top exclusions: three.js (D8 · cycle 2), 4 non-wood elements (cycle 2 × 4 sprints), daemon AI (D10 · cycle 2), card play against locked tiles (cycle 2), transcendence (cycle 3), soul-stage agents (cycle 3+), real cosmic-weather oracles (cycle 4+), daily duels (cycle 4+), `lib/honeycomb/` migration (cycle 2), `lib/cards/layers/` art_anchor integration (cycle 2 · FR-21a is the bridge), `/battle` refactor (preserved per D1), 4 other-element SKY EYES motifs.

### 7.3 · Cross-cycle interactions

- **Predecessor**: `battle-foundations-2026-05-12` (Layer primitive) + `card-game-in-compass-2026-05-12` (8-sprint honeycomb battle). Both shipped 2026-05-12. This cycle EXTENDS the architectural surface ABOVE both; does NOT modify either.
- **Successor (proposed)**: `purupuru-cycle-2-elements-2-thru-5-202X` — 4 elements + R3F + art_anchor integration evolved from FR-21a adapter + daemon AI behaviors + zone-event dispatch into honeycomb + 4 real zone YAMLs replacing the decorative tiles.
- **Sibling (out of scope)**: `card-game-3d-202X` (now bundled into cycle 2).

## 8 · Risks & dependencies (r1: 2 new risks)

| ID | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | Greenfield namespace creates parallel architecture vs. existing `lib/honeycomb/` | Medium | D1 explicit + §6.2 invariants 5-7 + cycle-2 successor entry. SDD §1 declares this. FR-21a adapter is the named integration seam. |
| R2 | Harness has zero codebase awareness — schemas may conflict with compass conventions | Medium | **S0 spike (FR-0) is the calibration vehicle** (NEW per OD-4). If S0 surfaces incompatibility, recalibrate at S0 close before S1 commits. |
| R3 | 11 beats fire on rAF — anchor-registry timing may miss refs on first render | Medium | FR-15 fail-open semantics. AC-8 tests with mock registries first (S3), then real React refs at S4. |
| R4 | Daemons declared with `affectsGameplay: false` may confuse future agents | Low | D10 explicit. AC-9 grep test (FR-14a) prevents resolver from reading daemon state. |
| R5 | YAML content authoring overhead | Low | Loader is format-agnostic at the type-validation seam; swapping YAML→JSON later is one-file refactor. |
| R6 | rAF drift under heavy main-thread load | Low | ±16ms tolerance (D6 corrected per Codex SKP-MEDIUM-001). Tests use injectable clock. |
| R7 | Registry registration may conflict with existing flat-constant pattern | Low | AC-12 verifies. `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` follow established convention. |
| R8 | LOC budget +4,500 may be tight | Low | S0 spike calibrates pre-S1. If S1 closes >25% over budget, recalibrate S2-S5 budgets. |
| R9 | `/battle-v2` may feel disconnected from `/battle` | Low | Q-SDD-1 (open question) addresses /battle-v2 permanence at cycle 2 end. |
| **R10 (r1: NEW)** | CardStack adapter (FR-21a) may not preserve visual continuity for harness `cardType: "activation"` if `caretaker_a` layer-system art reads as wrong-class | Medium | Operator visual review at S4 close. If adapter visual fails, downgrade to OD-2 path B (harness-native placeholder card face) and reschedule full art_anchor integration to cycle 2. |
| **R11 (r1: NEW)** | 4 decorative locked tiles (D9) may LOOK active and invite player clicks | Low | FR-22 ZoneToken `disabled` UI state must be visually unambiguous (high desaturation + no glow + cursor change). Operator visual review at S4. |

## 9 · Sprint dependency graph (r1: 6 sprints; S0 + corrected S5 gate)

Per build-doc §7 + OD-4 (S0 spike) + Codex SKP-HIGH-004 (S5 gate typo fix).

```text
S0 · Lightweight calibration spike (NEW per OD-4)
  │  - Vendor element.schema.json + element.wood.yaml to scratch dir
  │  - Run AJV validation in scripts/s0-spike-ajv-element-wood.ts
  │  - Half-day max; delete script post-audit
  │  GATE: confirm AJV + harness composability before S1 commits
  │  ACCEPTANCE: AC-0
  ▼
S1 · Schemas + Contracts + Loader + Design-Lint
  │  - Vendor 8 JSON schemas + validation_rules.md (FR-2a)
  │  - lib/purupuru/contracts/types.ts (15-member SemanticEvent union; camelCase normalization)
  │  - lib/purupuru/content/loader.ts (YAML → AJV → typed; pack-as-provenance)
  │  - Vendor 8 worked YAML examples
  │  - scripts/validate-content.ts + pnpm content:validate + 5 design-lint checks
  │  ACCEPTANCE: AC-1, AC-2, AC-2a, AC-3, AC-3a, AC-4
  ▼
S2 · Runtime: GameState + State Machines + EventBus + InputLock + Resolver
  │  - lib/purupuru/runtime/{game-state,event-bus,input-lock,command-queue}.ts
  │  - lib/purupuru/runtime/{ui,card,zone}-state-machine.ts
  │  - lib/purupuru/runtime/resolver.ts (5 ops + 5 commands)
  │  - lib/purupuru/runtime/sky-eyes-motifs.ts (wood only)
  │  - lib/purupuru/runtime/daemon-read-prevention grep test
  │  - Tests: state-machine coverage; resolver replay against core_wood_demo_001 golden fixture
  │  ACCEPTANCE: AC-4, AC-5, AC-6, AC-7, AC-9, AC-14, AC-15
  ▼
S3 · Presentation: 4 Target Registries + Sequencer + Wood Sequence
  │  - lib/purupuru/presentation/{anchor,actor,ui-mount,audio-bus}-registry.ts
  │  - lib/purupuru/presentation/sequencer.ts
  │  - lib/purupuru/presentation/sequences/wood-activation.ts (11 beats from 0ms → 2280ms)
  │  - Tests: dry-run sequencer fires all 11 beats at correct atMs offsets with per-registry resolution
  │  ACCEPTANCE: AC-8, AC-9, AC-15
  ▼
S4 · /battle-v2 Surface · 1 Real Zone + 4 Locked Tiles
  │  - app/battle-v2/page.tsx
  │  - app/battle-v2/_components/UiScreen.tsx (slot-driven from ui.world_map_screen.yaml)
  │  - app/battle-v2/_components/WorldMap.tsx (1 wood_grove + 4 decorative locked)
  │  - app/battle-v2/_components/ZoneToken.tsx (9+6 state compose)
  │  - app/battle-v2/_components/CardHandFan.tsx (uses CardStack via FR-21a adapter)
  │  - lib/purupuru/presentation/harness-card-to-layer-input.ts (adapter · ~50 LOC)
  │  - app/battle-v2/_components/SequenceConsumer.tsx
  │  - app/battle-v2/_styles/battle-v2.css
  │  - Operator visual review (R10 + R11 mitigation)
  │  - Tests: route renders, registries register, event flow fires sakura arc, full 11-beat sequence visible
  │  ACCEPTANCE: AC-10, AC-11
  ▼
S5 · Integration + ONE-event Telemetry + Docs + Final Gate
   - PURUPURU_RUNTIME + PURUPURU_CONTENT in lib/registry/index.ts
   - ONE CardActivationClarity telemetry event → JSONL trail
   - app/kit/page.tsx link to /battle-v2
   - grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/README.md
   - /review-sprint sprint-5 + /audit-sprint sprint-5 gate the cycle (NOT sprint-4)
   ACCEPTANCE: AC-12, AC-13, AC-16, AC-17, AC-18
```

**De-scope ladder** (if cycle running over budget · r1 updated):
1. First to drop · ONE-event telemetry (FR-26 · AC-13) — nice-to-have observability. JSONL writes can ship in cycle 2.
2. Second · `/kit/ui-explorer` link (FR-27) — operators can navigate directly.
3. Third · Reward preview beat — sequence ends at `unlock_input` at 2280ms regardless.
4. Last-resort · 4 decorative locked tiles (D9) — reduce surface to 1-zone visible. PRD framing changes to "single-zone vertical slice."

G1-G6 hold even at the bottom of the ladder. AC-0 through AC-12 + AC-14 + AC-15 + AC-16 + AC-18 hold throughout.

## 10 · References

- **Input brief / build doc**: `grimoires/loa/specs/arch-enhance-purupuru-cycle-1-wood-vertical.md`
- **Canonical contract source**: `~/Downloads/purupuru_architecture_harness/` — README.md (~25KB) · schemas/*.schema.json (8) · contracts/purupuru.contracts.ts (ADVISORY pseudocode per file header) · contracts/validation_rules.md (NEW · 21 design-lint + runtime rules) · examples/*.yaml (8)
- **Predecessor PRD**: `grimoires/loa/cycles/card-game-in-compass-2026-05-12/prd.md`
- **Predecessor cycle**: `grimoires/loa/cycles/battle-foundations-2026-05-12/`
- **Existing visual primitive**: `lib/cards/layers/registry.json` (FR-21a adapter bridges to it)
- **Existing battle sub-game**: `lib/honeycomb/` (preserved)
- **Existing battle route**: `app/battle/` (preserved)
- **OKLCH palette law**: `app/globals.css`
- **SKY EYES P1 retrofit**: `grimoires/loa/proposals/audit-feel-verdict-2026-05-12.md`
- **Manual flatline artifacts (r1)**: `grimoires/loa/a2a/flatline/cycle-1-prd-{opus-structural,codex-skeptic,consensus}-2026-05-13.{md,md,json}` — orchestrator broken; manual fallback per 2026-05-12 precedent
- **Construct identities loaded at session start**:
  - `.claude/constructs/packs/the-arcade/identity/OSTROM.md` — ARCH lens
  - `.claude/constructs/packs/the-arcade/identity/BARTH.md` — SHIP lens
  - `.claude/constructs/packs/artisan/identity/ALEXANDER.md` — craft lens
- **Memory anchors (BACKGROUND-ONLY per Codex SKP-MEDIUM-005 + OperatorOS doctrine activation protocol)**:
  - [[honeycomb-substrate]] · operator-coined name for effect-substrate — background context
  - [[purupuru-world-org-shape]] · world-as-Rosenzu-meta · apps-as-zones — background context
  - [[purupuru-daemon-deferral]] · daemon AI = "rule-based NPC + weather-change resets state + no continuity yet" — background context (no activation receipt yet; do not use to drive requirements without operator promotion)
  - [[dev-tuning-separation]] · dev panels behind hotkey — background context; `/battle-v2` does NOT introduce dev panels this cycle
- **Operator decrees (this discovery session · 2026-05-13)**:
  - "Build doc + harness ARE the pre-PRD" (minimal-mode rationale)
  - Cycle dir: `purupuru-cycle-1-wood-vertical-2026-05-13`
  - Route: `/battle-v2`
  - §13 open questions: 4 deferred to SDD; Q-SDD-5 telemetry destination RESOLVED at PRD-altitude (JSONL trail per OD-3)
  - 5-zone path: 1 real + 4 decorative locked (OD-1 path B)
  - CardStack adapter built in S4 (OD-2 path A)
  - S0 lightweight spike added (OD-4 path C)

## 11 · Open questions for SDD phase (r1: 4 remaining after Q-SDD-5 resolved)

The SDD interview should resolve these. PRD-altitude questions where the operator left a deliberate gap.

1. **Q-SDD-1** · Permanence — Should `/battle-v2` REPLACE `/battle` at cycle 2 completion, or live alongside permanently?
2. **Q-SDD-2** · Honeycomb migration — When `lib/purupuru/` proves out, does `lib/honeycomb/` migrate fully into harness-namespace, or stay as the dispatched-by-zone-event sub-game?
3. **Q-SDD-3** · `art_anchor` binding — When does a card declare which `CardStack` layer-input shape to use? Per-card declaration, or per-element default? (FR-21a adapter is the cycle-1 bridge; cycle 2 evolves it.)
4. **Q-SDD-4** · Daemon-Assist API shape — Cycle 2 will need a resolver-data path for daemon-Assist. What's the API shape? Harness §7.4 names `Assist` as a state but doesn't spec the resolver-data interface.

> Q-SDD-5 (telemetry destination) RESOLVED at PRD-altitude per D11/OD-3 → JSONL trail. Removed from SDD interview scope.

## 12 · Acceptance summary (aligned to §2 goals)

This PRD is accepted when:

- All decisions D1-D12 are preserved load-bearing through SDD
- G1-G6 (primary) each have an SDD section and a sprint-plan task
- G7-G10 (secondary) have at least one sprint task or SDD note
- The 4 remaining Q-SDD-* open questions are resolved during the SDD interview
- Operator confirms cycle scope before sprint-plan begins

---

> **Sources**: `grimoires/loa/specs/arch-enhance-purupuru-cycle-1-wood-vertical.md` · `~/Downloads/purupuru_architecture_harness/README.md` · `~/Downloads/purupuru_architecture_harness/contracts/{purupuru.contracts.ts,validation_rules.md}` · `~/Downloads/purupuru_architecture_harness/examples/{card.wood_awakening,zone.wood_grove,sequence.wood_activation,element.wood,event.wood_spring_seedling,ui.world_map_screen,pack.core_wood_demo,telemetry.card_activation_clarity}.yaml` (all 8 verified pre-PRD r1) · `grimoires/loa/a2a/flatline/cycle-1-prd-{opus-structural,codex-skeptic,consensus}-2026-05-13.{md,md,json}` (manual flatline r1) · this session's two discovery interviews (1 consolidated discovery + 1 consolidated flatline-decision · 7 operator answers total) · code reality at `lib/cards/layers/*` + `lib/honeycomb/*` + `app/battle/*` + `lib/registry/index.ts` + `package.json` (all verified) · `grimoires/loa/cycles/card-game-in-compass-2026-05-12/prd.md` (predecessor house format) · construct identities loaded at session start
