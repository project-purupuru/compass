---
session: purupuru-cycle-1-wood-vertical
date: 2026-05-13
mode: ARCH (Ostrom) + craft (Alexander)
loa_flow: full-truenames (/plan-and-analyze → /architect → /sprint-plan → /run-sprint-plan → /review-sprint → /audit-sprint)
status: ready-for-build
prior_artifact: grimoires/loa/proposals/ui-prompts-distillation-2026-05-12.md
canonical_spec: ~/Downloads/purupuru_architecture_harness/ (operator's local + README.md is 28KB)
game_pitch: shared in conversation 2026-05-13 — elemental tactics × Wuxing × daily duels × real-cosmic-weather
---

# ARCH+ENHANCE — Purupuru Cycle 1: Wood Vertical Slice

> Build the foundational sim+presentation contracts of Purupuru per the creative director's architecture harness. Cycle 1 ships a single playable element (Wood) end-to-end through the full pipe: schema-validated card data → command-emitting resolver → semantic-event stream → presentation sequence player → live React surface. Existing code (`lib/cards/layers/`, `lib/honeycomb/`, `/battle` route) is **preserved** as superset architecture: harness lives in new `lib/purupuru/` namespace; battle sub-game stays in honeycomb; layer-system becomes the art_anchor implementation.

## §0 Context Snapshot

**The creative direction** (Gumi, no codebase awareness — pure spec):
- Purupuru is a cozy tactical card-driven overworld game.
- Core craft target: **"Play a card → target a world zone → the world answers."**
- Screen direction: 2.5D tactical meta-map · diegetic card UI · localized elemental VFX · daemon ecology · data-driven rules resolver.
- The simulation emits meaning. The presentation dramatizes meaning. The two must remain separate.

**The product context** (operator's pitch shared in conversation):
- 18 cards × 3 sets × 5 elements. Burnable into 3 transcendence cards.
- 5-card lineup battles, clash-pair attrition, Shēng chain combos, 2-4 rounds.
- Cosmic weather shifts the meta daily (TREMOR / CORONA / BREATH oracles → real seismic + solar + air-quality data).
- Daily friend duels via Puruhani AI agents.
- Soul-stage cards become AI companions.
- Feel-first. Visual-first. No "Victory/Defeat" language.

**The codebase context** (what exists prior to this cycle):
- `lib/cards/layers/` — 8-layer visual primitive (registry.json + resolve.ts + CardStack.tsx + 429-test coverage). Pure render.
- `lib/honeycomb/` — battle sub-game logic (5-card lineup, clash pairs, Shēng/Ke wuxing graph, phase machine).
- `app/battle/` — live React route running off honeycomb (EntryScreen, ElementQuiz, BattleHand, OpponentZone, CardPetal, ResultScreen).
- `app/kit/ui-explorer/` — operator's mockup tasting surface (16:9 landscape tiles).
- ~30+ session artifacts at `grimoires/loa/proposals/` documenting prior cycles.

## §1 Invariants (Ostrom — what must not change)

1. **Sim/Presentation separation rule** (harness §2). Simulation emits semantic events; presentation consumes them. Presentation NEVER mutates game state.
2. **OKLCH wuxing palette** (`app/globals.css`). 5 elements × 4 shades each. Non-negotiable visual law.
3. **Five-element Wuxing system** (game pitch + harness §6 elemental grammar). Wood / Fire / Earth / Metal / Water + Shēng (generative) + Kè (overcoming) cycles.
4. **Composite-vs-Generate discipline** (harness §11 + MINT skill). Cards declare `nameKey: card.wood_awakening.name` — text rendered separately, NEVER baked into art.
5. **Existing `lib/cards/layers/`** continues to be the visual primitive. The harness's `card.art_anchors` field maps onto layer-registry inputs.
6. **Existing `lib/honeycomb/` battle sub-game** continues to power `/battle`. Future zone-events may trigger battles, but this cycle does not refactor honeycomb.
7. **Existing `/battle` route stays functional**. Cycle 1 builds against a NEW surface (`/battle-v2` or `/kit/wood-slice`); visual continuity preserved.
8. **The harness JSON schemas at `~/Downloads/purupuru_architecture_harness/schemas/*.json`** are the canonical contract source. Vendor them into `lib/purupuru/schemas/` for runtime validation.
9. **Daemons declared in resolver data, not implemented** (operator decision: daemon AI deferred to a later cycle). Schemas may name daemons; `affectsGameplay: false` for all this cycle.

## §2 Structural Decisions

| Decision | Recommendation | Reasoning | Reversibility |
|---|---|---|---|
| Package location | `lib/purupuru/` greenfield | Greenfield alongside per operator's evolution synthesis. Old code untouched. | Cheap — delete the dir if abandoned |
| TypeScript type source | Hand-author from `contracts/purupuru.contracts.ts` first; later generate via `json-schema-to-typescript` if drift appears | Hand-author keeps the type surface readable; harness contracts.ts file is already TypeScript-flavored | Cheap — swap to generated later |
| Schema validation | AJV at content-load time + as CI step | AJV is industry-standard; runs in node and browser | Cheap |
| Resolver shape | Pure functional: `(GameState, Command) → { state, events[] }` | Easy to replay, test, serialize per harness §4.1 | Cheap |
| Event bus | Tiny typed EventEmitter (no external dep) | Stays in-process; presentation subscribes; testable | Cheap |
| Sequence player | Time-driven beat scheduler subscribes to events, calls anchor-bound effects | Per harness §10 sequence rules | Cheap |
| Wood-slice surface | NEW route `/battle-v2` | Discoverable, distinct from `/battle`, can be linked from `/kit/ui-explorer` | Cheap |
| Test framework | Vitest (already in compass) | No new tooling | n/a |
| Three.js | OUT OF SCOPE for cycle 1 | The visual slice can run in 2D CSS/React for the wood demo; three.js is cycle 2+ | n/a |
| Content pack format | YAML files validated against JSON schemas; loaded via `lib/purupuru/content/loader.ts` | Matches harness worked examples | Cheap |

## §3 Blast Radius (Ostrom — what changes)

**NEW** (zero risk to existing code):
- `lib/purupuru/contracts/types.ts` — TypeScript interfaces from `contracts/purupuru.contracts.ts`
- `lib/purupuru/schemas/*.schema.json` — 8 JSON schemas vendored from harness
- `lib/purupuru/runtime/game-state.ts` — `GameState` definition + initial-state factory
- `lib/purupuru/runtime/command-queue.ts` — typed command enqueue + drain
- `lib/purupuru/runtime/resolver.ts` — pure `(state, command) → { state, events[] }` function
- `lib/purupuru/runtime/event-bus.ts` — minimal typed event emitter
- `lib/purupuru/runtime/ui-state-machine.ts` — UiMode transitions
- `lib/purupuru/runtime/card-state-machine.ts` — CardLocation transitions
- `lib/purupuru/runtime/zone-state-machine.ts` — ZoneState transitions
- `lib/purupuru/runtime/sky-eyes-motifs.ts` — per-element persistent-motif tokens (carries SKY EYES P1 retrofit into runtime)
- `lib/purupuru/presentation/sequencer.ts` — beat scheduler subscribed to event bus
- `lib/purupuru/presentation/anchor-registry.ts` — named anchor → DOM/scene-coordinate resolver
- `lib/purupuru/presentation/sequences/wood-activation.ts` — TypeScript implementation of `sequence.wood_activation.yaml`
- `lib/purupuru/content/loader.ts` — YAML loader + AJV validator
- `lib/purupuru/content/wood/card.wood_awakening.yaml` — vendored from harness examples
- `lib/purupuru/content/wood/zone.wood_grove.yaml` — vendored
- `lib/purupuru/content/wood/element.wood.yaml` — vendored
- `lib/purupuru/content/wood/event.wood_spring_seedling.yaml` — vendored
- `lib/purupuru/content/wood/pack.core_wood_demo.yaml` — vendored
- `lib/purupuru/content/wood/ui.world_map_screen.yaml` — vendored
- `lib/purupuru/content/wood/telemetry.card_activation_clarity.yaml` — vendored
- `lib/purupuru/__tests__/resolver.replay.test.ts` — golden replay fixtures
- `lib/purupuru/__tests__/schema.validate.test.ts` — every YAML validates against its schema
- `lib/purupuru/__tests__/state-machines.test.ts` — UI/Card/Zone transition coverage
- `app/battle-v2/page.tsx` — the vertical slice surface (top-down map · 5 zones · wood-zone activates from played wood card)
- `app/battle-v2/_components/WorldMap.tsx`
- `app/battle-v2/_components/CardHandFan.tsx`
- `app/battle-v2/_components/ZoneToken.tsx`
- `app/battle-v2/_components/SequenceConsumer.tsx`
- `app/battle-v2/_styles/battle-v2.css`
- `scripts/validate-content.ts` — CI step: AJV-validate every YAML in `lib/purupuru/content/`
- `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical/` — PRD/SDD/sprint plan home

**MODIFIED** (low risk):
- `package.json` — add `ajv` + `js-yaml` deps; add `pnpm content:validate` script
- `lib/registry/index.ts` — register `registry.purupuru.runtime` + `registry.purupuru.content` namespaces (mirrors existing `registry.cards.layers` pattern)
- `app/kit/page.tsx` (or `/kit/ui-explorer/page.tsx`) — add a link to `/battle-v2` so operators can find the new surface

**UNTOUCHED** (preserved per evolution synthesis):
- `lib/cards/layers/*` — visual primitive stays as-is; harness `art_anchors` map onto layer-registry inputs in cycle 2
- `lib/honeycomb/*` — battle sub-game stays as-is; future zone-events of `kind: "battle"` will dispatch into honeycomb in cycle 2+
- `app/battle/*` — live route stays unchanged; cycle 1 ships parallel surface at `/battle-v2`

**DELETED**: none.

## §4 Data Architecture

```text
Player Input (React onClick / onPointerDown)
  ↓
UiStateMachine.transition()         lib/purupuru/runtime/ui-state-machine.ts
  ↓ (mode = CardArmed/Targeting/...)
CommandQueue.enqueue(Command)       lib/purupuru/runtime/command-queue.ts
  ↓
RulesResolver.apply(state, command) lib/purupuru/runtime/resolver.ts
  ↓ → returns { newState, events: SemanticEvent[] }
GameState mutation (immutable)      lib/purupuru/runtime/game-state.ts
  ↓
EventBus.emit(event)                lib/purupuru/runtime/event-bus.ts
  ↓
PresentationSequencer.consume(event) lib/purupuru/presentation/sequencer.ts
  ↓ (resolves sequenceId → wood-activation-sequence)
beats[].action → AnchorRegistry.bind() + UI/VFX/Audio side-effects
  ↓
React tree re-renders (subscribed to GameState via useSyncExternalStore)
```

Persistence: GameState serialized to `localStorage` (harness §4.1 #3 — must be saveable/replayable). Schema versioned.

## §5 Component Specifications (Alexander — craft lens)

### WorldMap (the top-down zone-map view)

| Axis | Spec |
|---|---|
| Material | `bg: oklch(0.18 0.02 260)` cosmic-indigo void · map-island base `oklch(0.94 0.015 90)` cream · subtle paper-grain texture across both via SVG noise filter |
| Rhythm | 5 zones positioned in a deliberate 5-point asymmetric arrangement around the central Sora Tower; spacing between zones ≥ 12% of viewport width for breathing |
| Weight | Active zone (wood, when player has armed a wood card) carries `oklch(0.81 0.144 112.7)` outline-glow at 40% blend, 12-18px wide. Other zones quiet (their element-stamp dim 25% blend on shrine-stone only) |
| Motion | Camera does NOT move in cycle 1; subtle parallax on cloud planes (`translateY` keyframe 8-12s loop). Card-in-flight arc uses cubic-bezier `(0.34, 1.56, 0.64, 1)` per `puru-flow` easing |
| Color-as-information | Outline-glow = "valid target" / "active target" — the only zone with element-vivid saturation in its border |

### CardHandFan (persistent bottom-edge UI)

| Axis | Spec |
|---|---|
| Material | Cards use existing `lib/cards/layers/` CardStack composition; hand-fan container is `bg: oklch(0.20 0.02 60)` warm-charcoal at 60% blend over the page |
| Rhythm | 5 cards in shallow horizontal fan, center card lifted `translateY(-12px)` on hover; spacing follows golden-ratio arc |
| Weight | Hovered card lifts + carries `oklch(0.82 0.14 85)` amber-honey halation (universal "active card" signal, element-independent) |
| Motion | Hover: 180ms `ease-puru-settle`. Drag-to-zone: card lifts to z-index above world; arc-trail spawned in three.js-free CSS keyframe along the spline |
| Color-as-information | Element-tint background per card identifies element. Amber halation = hover/armed state. NO other state-color permitted |

### ZoneToken (per zone — wood grove, etc.)

| Axis | Spec |
|---|---|
| Material | Discrete painted-illustration token on cream-map base; ink-line `oklch(0.18 0.02 260)` silhouette + flat-color interior fill |
| Rhythm | Each zone has 3-5 structure-sub-tokens (sakura tree, shrine-stone, torii for wood) spread within a ~12% × 14% footprint |
| Weight | Idle zones at full opacity but no glow. ValidTarget zones get soft pulsing outline `0.81 0.144 112.7` at 30% blend, 600ms pulse. Active zone gets 40% blend solid outline |
| Motion | ValidTarget pulse: opacity 0.3 → 0.6 → 0.3 over 1.2s `ease-puru-breathe`. Active state: outline locks at 0.4. Afterglow: outline fades over 800ms |
| Color-as-information | Outline-color = element. Outline-state = (valid / active / afterglow / resolved) |

### SequenceConsumer (the presentation dispatcher React component)

| Axis | Spec |
|---|---|
| Material | Invisible — it's a `useEffect` host that subscribes to event bus |
| Rhythm | Listens for `CardCommitted`, `ZoneActivated`, `ZoneEventStarted`, `DaemonReacted`, `RewardGranted` |
| Weight | Each event → sequence lookup → beat scheduler invocation |
| Motion | Beats fire at `atMs` offsets from sequence start; uses `requestAnimationFrame` for sub-frame accuracy |
| Color-as-information | n/a — presentation effects render through child components |

## §6 Shipping Scope (Barth — what's V1 vs cut)

### V1 — Ship Now (cycle 1)

1. All 8 JSON schemas vendored + AJV validation tests passing.
2. All 8 worked YAML examples loaded + validated.
3. `GameState` + `CommandQueue` + `RulesResolver` + `EventBus` runtime in place.
4. UI/Card/Zone state machines with full transition coverage tests.
5. `WoodActivationSequence` implemented as TypeScript that consumes events + invokes anchor-bound effects.
6. `/battle-v2` route renders the top-down wood-grove world with chibi-Kaori at the grove + 5-card hand fan + persistent UI.
7. Player can hover wood card → see ValidTarget pulse on wood grove → click grove → see card travel as sakura arc → see seedling-impact-pulse → see local sakura weather start → see Kaori gesture → see daemon-reaction (presentation-only, no gameplay effect) → see reward-preview → input unlocks.
8. The whole flow replay-tests deterministically against a serialized fixture.

### V2 — After Feedback (cycle 2+)

- 4 more elements (fire/earth/metal/water) — repeat the wood-vertical-slice pattern × 4.
- Card play AGAINST a target zone of mismatched element (validation feedback path).
- Daemon AI rule-based behaviors implemented (deferred per operator decision).
- Three.js scene replacing the 2D CSS world view (the visual-target mockups operator already rendered).
- Migration of `lib/honeycomb/` battle sub-game to be dispatchable from `zone.event_table[].kind = "battle"`.
- Migration of `lib/cards/layers/` to be reachable as `card.art_anchors` of harness cards.
- Daily-duel-against-friend-Puruhani retention loop.
- Transcendence cards (Forge / Void / Garden).
- Soul-stage AI agents.
- Five Oracles real-cosmic-weather integration (TREMOR / CORONA / BREATH).

### CUT from V1 (Barth's "while-I'm-at-it" banlist)

- ❌ Three.js implementation (cycle 2)
- ❌ Daemon AI behavior (cycle 2)
- ❌ 4 non-wood elements (cycle 2 × 4 sprints)
- ❌ Transcendence cards (cycle 3)
- ❌ Soul-stage agents (cycle 3+)
- ❌ Real cosmic weather oracles (cycle 4+)
- ❌ Daily duels & retention loop (cycle 4+)
- ❌ Migration of `lib/honeycomb/` or `lib/cards/layers/` (cycle 2+)
- ❌ Refactor of existing `/battle` route (kept untouched)
- ❌ Card foil shaders / particle systems beyond CSS keyframes (cycle 2)

## §7 Build Sequence (dependency-ordered)

The next-session agent should follow this order. Each sprint is a `/run sprint-N` unit under full Loa truenames.

### Sprint 1 — Schemas + Contracts + Loader
1. Vendor 8 JSON schemas to `lib/purupuru/schemas/`.
2. Write `lib/purupuru/contracts/types.ts` based on `~/Downloads/purupuru_architecture_harness/contracts/purupuru.contracts.ts`.
3. Write `lib/purupuru/content/loader.ts` (YAML → AJV-validated → typed object).
4. Vendor 8 worked examples to `lib/purupuru/content/wood/`.
5. Write `scripts/validate-content.ts` + add to `package.json` as `pnpm content:validate`.
6. Tests: every YAML validates against its schema. Pass `pnpm test` + `pnpm typecheck`.
**Acceptance criterion**: `pnpm content:validate` exits 0; types compile; vitest green.

### Sprint 2 — Runtime: GameState + State Machines + EventBus + Resolver
1. `lib/purupuru/runtime/game-state.ts` — typed state + initial-state factory.
2. `lib/purupuru/runtime/{ui,card,zone}-state-machine.ts` — pure functions, transition tables.
3. `lib/purupuru/runtime/event-bus.ts` — typed pub/sub.
4. `lib/purupuru/runtime/command-queue.ts` — typed Command union + enqueue/drain.
5. `lib/purupuru/runtime/resolver.ts` — `(state, command) → { state, events[] }`. Implements `activate_zone` + `spawn_event` + `grant_reward` ops from wood_awakening's resolver.steps[].
6. Tests: state-machine transition coverage; resolver replay against `card.wood_awakening` golden fixture.
**Acceptance criterion**: replay test shows playing a wood_awakening card on wood_grove produces deterministic `ZoneActivated → ZoneEventStarted → RewardGranted` event sequence.

### Sprint 3 — Presentation: Anchor Registry + Sequencer + Wood Sequence
1. `lib/purupuru/presentation/anchor-registry.ts` — anchor-id → React ref lookup.
2. `lib/purupuru/presentation/sequencer.ts` — beat scheduler subscribed to events.
3. `lib/purupuru/presentation/sequences/wood-activation.ts` — TypeScript implementation of `sequence.wood_activation.yaml` (12 beats from `lock_input` at 0ms through `unlock_input` at 2280ms).
4. Tests: sequencer with mock anchors fires all 12 beats at correct atMs offsets.
**Acceptance criterion**: dry-run sequencer logs all 12 beats in correct order with anchor-binding success rate 100%.

### Sprint 4 — `/battle-v2` Surface
1. `app/battle-v2/page.tsx` — Next.js route shell.
2. `app/battle-v2/_components/WorldMap.tsx` — top-down 5-zone view + Sora Tower center.
3. `app/battle-v2/_components/ZoneToken.tsx` — per-zone token with state-driven outline.
4. `app/battle-v2/_components/CardHandFan.tsx` — persistent 5-card hand using existing CardStack.
5. `app/battle-v2/_components/SequenceConsumer.tsx` — useEffect host that wires sequencer into React render.
6. `app/battle-v2/_styles/battle-v2.css` — OKLCH palette adherence.
7. Tests: render-test the route, verify all anchors register, verify event flow fires sakura arc.
**Acceptance criterion**: at `/battle-v2`, player can hover wood card → grove pulses → click grove → full 12-beat sequence plays → input unlocks → state shows ZoneEvent active. Visual checklist passes operator review.

### Sprint 5 — Integration + Telemetry + Docs
1. `lib/registry/index.ts` — register `registry.purupuru.runtime` + `registry.purupuru.content`.
2. Add telemetry event emission per `telemetry.card_activation_clarity.yaml`.
3. Update `app/kit/page.tsx` with link to `/battle-v2`.
4. Document the cycle's contracts in `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical/README.md`.
5. Run `/review-sprint sprint-4` + `/audit-sprint sprint-4` to gate the cycle.
**Acceptance criterion**: registry integrity check passes, telemetry fires at correct moments, docs reference paths correctly.

## §8 Design Rules (Alexander — actionable)

- Every UI surface that holds text uses a `LocalizationKey`; NEVER bake text into art assets. Hanko stamps mark composite targets.
- Every state-affordance uses motion + color + at least one more channel (per harness §4.2 #7).
- Active focus zone outline at 40% blend; valid-target pulse at 30% blend min/peak 0.3→0.6.
- Card hover uses universal amber-honey halation `oklch(0.82 0.14 85)` regardless of element (per audit-feel-verdict-2026-05-12).
- No VFX may obscure the committed target at the resolution beat (harness §4.2 #6).
- Localized weather stays local: sakura petal column appears OVER wood_grove only; do NOT drift across the whole map (harness §4.2 #2).
- Cursor / pointer affordance: only valid targets receive the hover-target cursor (harness §4.2 #3).
- Input lock during sequence is SOFT (per `inputPolicy.lockMode: soft` in wood_activation_sequence.yaml). Soft = player can hover other cards but cannot commit until unlock_input beat fires at 2280ms.

## §9 What NOT to Build (Barth — explicit cuts)

- ❌ Do not touch `lib/cards/layers/` — visual primitive stays. art_anchors integration is cycle 2.
- ❌ Do not touch `lib/honeycomb/` — battle sub-game stays. Zone-event → battle dispatch is cycle 2.
- ❌ Do not touch `app/battle/*` — live route stays. Cycle 1 ships parallel surface at `/battle-v2`.
- ❌ Do not implement daemon AI behavior. Daemons in YAML have `affectsGameplay: false`; their idle routines render as static art only.
- ❌ Do not implement three.js. The wood vertical slice runs in CSS+React. Three.js is cycle 2.
- ❌ Do not implement other elements. Wood only.
- ❌ Do not implement transcendence / Soul stage / oracles / daily duels. Future cycles.
- ❌ Do not refactor existing tests. Existing test surface is preserved.
- ❌ Do not name the harness creator (Gumi) or reference indie game references by name in code comments — sanitization discipline.

## §10 Verify

```bash
# Sprint 1
pnpm content:validate              # AJV validates 8 YAML examples — exit 0
pnpm typecheck                     # tsc --noEmit — exit 0
pnpm test lib/purupuru/__tests__/schema.validate.test.ts

# Sprint 2
pnpm test lib/purupuru/__tests__/resolver.replay.test.ts
pnpm test lib/purupuru/__tests__/state-machines.test.ts

# Sprint 3
pnpm test lib/purupuru/__tests__/sequencer.beat-order.test.ts

# Sprint 4
pnpm dev
# Browser: http://localhost:3000/battle-v2
# Manual verify: hover wood card → grove pulses → click grove → 12-beat sequence plays

# Sprint 5
pnpm assets:check
pnpm test                          # full test suite — all green
/review-sprint sprint-4
/audit-sprint sprint-4
```

## §11 Key References (paths the next session needs)

| Topic | Path |
|---|---|
| Harness README | `~/Downloads/purupuru_architecture_harness/README.md` (28KB, vendor into `grimoires/loa/specs/harness-spec.md` for canonical reference) |
| Harness schemas | `~/Downloads/purupuru_architecture_harness/schemas/*.schema.json` (vendor 8 files into `lib/purupuru/schemas/`) |
| Harness contracts | `~/Downloads/purupuru_architecture_harness/contracts/purupuru.contracts.ts` |
| Harness examples | `~/Downloads/purupuru_architecture_harness/examples/*.yaml` (vendor into `lib/purupuru/content/wood/`) |
| Prior session digest | `grimoires/loa/proposals/ui-prompts-distillation-2026-05-12.md` |
| Audit-feel verdict | `grimoires/loa/proposals/audit-feel-verdict-2026-05-12.md` |
| Existing layer registry | `lib/cards/layers/registry.json` (preserved; art_anchors integration is cycle 2) |
| Existing honeycomb | `lib/honeycomb/` (preserved; battle-sub-game dispatch is cycle 2) |
| OKLCH palette law | `app/globals.css` |

## §12 Persona for Next Session

Load these construct identities at session start:
- `.claude/constructs/packs/the-arcade/identity/OSTROM.md` — ARCH structural lens for SDD authoring
- `.claude/constructs/packs/the-arcade/identity/BARTH.md` — SHIP discipline / scope guard
- `.claude/constructs/packs/artisan/identity/ALEXANDER.md` — craft lens for component specs
- `.claude/constructs/packs/the-mint/skills/prompting-images/SKILL.md` — when authoring follow-up renders for elements 2-5 in cycle 2

## §13 Open Questions (next session may want to resolve via /plan-and-analyze interview)

1. Should `/battle-v2` REPLACE `/battle` at cycle 2 completion, or live alongside permanently?
2. When `lib/purupuru/` proves out, does honeycomb migrate fully or stay as the dispatched-by-zone-event sub-game?
3. art_anchor binding: when does a card declare which CardStack layer-input shape to use? Per-card or per-element-default?
4. The harness names daemons with `affectsGameplay: false` — cycle 2 will need a resolver-data path for daemon-Assist. What's the API shape?
5. Telemetry destination — JSONL trail? Hivemind sink? Operator hivemind-os integration?

These are recorded for /plan-and-analyze interview; they don't block cycle 1 sprint authoring.
