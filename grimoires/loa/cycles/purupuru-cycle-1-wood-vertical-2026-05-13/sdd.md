---
status: ready-for-sprint-plan
type: sdd
cycle: purupuru-cycle-1-wood-vertical-2026-05-13
mode: ARCH (Ostrom) + SHIP (Barth) + craft lens (Alexander)
prd: grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/prd.md (r1 · flatline-integrated · 441 lines)
prd_review: grimoires/loa/a2a/flatline/cycle-1-prd-consensus-2026-05-13.json (manual fallback · 9 BLK + 10 HIGH integrated)
sdd_review: pending (`/flatline-review sdd` after authoring · loa#877 may still block · operator-ratified gate stands)
branch: feat/hb-s7-devpanel-audit (may rebase to feat/purupuru-cycle-1 at /sprint-plan)
created: 2026-05-13
revision: r0
operator: zksoju
authored_by: manual / cycle directory (architect skill misfired on global PRD; cycle SDD authored directly per predecessor card-game-in-compass-2026-05-12 pattern)
---

# SDD · Purupuru Cycle 1 · Wood Vertical Slice

> **r0** (2026-05-13). The PRD owns **what** and **why**; this SDD owns code paths, type sketches, sequencing, and acceptance-verification mechanics. All 4 deferred SDD questions (Q-SDD-1 through Q-SDD-4) resolved in this discovery via single operator gate.

## 1 · Abstract

This SDD describes **how** compass acquires the foundational simulation + presentation contracts of Purupuru per Gumi's architecture harness, shipping a single playable element (Wood) end-to-end through the full pipe: schema-validated card data → command-emitting resolver → semantic-event stream → presentation sequence player → live React surface at `/battle-v2`.

> **Protocol reframe (2026-05-13 PM, post-SDD-r0)**: After this SDD's first authoring, the operator added events and hashes as critical missing components and named the abstract concept: this work is an application of **Agentic Cryptographically Verifiable Protocol (ACVP)** as Game Infrastructure. The 7-component substrate (reality + contracts + schemas + state machines + **events** ⚡ + **hashes** 🔒 + tests) and 7 cross-component invariants are documented at `~/vault/wiki/concepts/agentic-cryptographically-verifiable-protocol.md`. cycle-098's L1-L7 audit envelope work is the META-protocol cycle-1 inherits from. SDD r1 should fold this framing into §1 prose; r0 is preserved for archeology.

**Critical framing from operator clarifications (this discovery session)**:

- **The substrate is one thing across two namespaces.** `lib/honeycomb/` (effect-substrate pattern · battle sub-game) and `lib/purupuru/` (harness namespace · world overworld) are BOTH **substrate**. Operator's exact framing: *"This is the reality, contracts, schemas, state machines, tests that define constraints and enable truth seeking within a sandbox. This is what we call agentic game infrastructure."* Both namespaces serve the substrate role; they have different shapes because they cover different parts of the experience, but they are NOT different categories. See `[[agentic-game-infrastructure]]` memory.
- **`/battle-v2` is the evolution of `/battle`, not a parallel sibling.** Same game, successive iterations. PRD's "preserve `/battle` untouched" framing is transitional: while V2 stabilizes, V1 stays functional. Long-term, V2 is the canonical surface. See `[[v2-routes-as-evolution]]` memory.
- **Daemons need flexibility as a type contract.** Cycle 1 keeps `affectsGameplay: false` per D10, but the resolver-step op union RESERVES `daemon_assist` as a known op enum (no-op stub returning UNIMPLEMENTED). Cycle 2 fills behavior without breaking the contract. SimCity-directional.
- **`art_anchors` live per-card in YAML.** Each card's YAML declares its layer-registry bindings. Maximum authorial control. Cycle 2 replaces the cycle-1 FR-21a `harnessCardToLayerInput()` adapter with this binding mechanism.

**Critical inheritance from PRD r1**: D1-D12 hold load-bearing; 11-beat sequence (not 12); 5 resolver ops + 5 commands (set_flag + add_resource added per Opus BLK-2); validation_rules.md vendored (per Opus BLK-1); 4 target registries (anchor/actor/UI-mount/audio-bus per Codex SKP-HIGH-005); 10-state gameplay + 6-state UI compose for ZoneToken; ONE telemetry event with 7 properties (not 4 events); 1 schema-backed zone + 4 decorative locked tiles (per OD-1).

**The SDD's customer is the implementer agent in S0–S5 sprints and the operator pair-points at gates.** Every section names file paths · code shapes · acceptance criteria · NOT design rationale (PRD owns rationale).

## 2 · Stack & decisions

### 2.1 · Confirmed stack (no runtime changes this cycle)

- Next.js 16.2.6 (App Router · Turbopack default)
- React 19.2.4
- TypeScript 5
- Tailwind 4 (`@tailwindcss/postcss` · OKLCH token system in `app/globals.css`)
- Effect 3.10.x (used in `lib/honeycomb/` only; explicitly NOT extended to `lib/purupuru/` per PRD D5)
- motion 12.38.x (for non-canvas UI · sequencer uses requestAnimationFrame per PRD D6)
- Vitest 3.x (test runner · injectable clock for sequencer tests per PRD D6)
- Playwright 1.59 (E2E · for AC-10, AC-11)
- pnpm 10.x

### 2.2 · New dependencies introduced this cycle

- `js-yaml` ^4 (NEW runtime dep · cycle's only addition)
- `ajv` ^8.20.0 (ALREADY present · verified)
- `ajv-formats` ^3.0.1 (ALREADY present · verified)

No new devDependencies. No new lint rules beyond AC-3a's 5 design-lint checks running inside `pnpm content:validate`.

### 2.3 · Resolved SDD-level decisions (PRD §11 closures)

| ID | Question | Resolution | Source |
|---|---|---|---|
| Q-SDD-1 | `/battle-v2` permanence | **V2 is the evolution of V1, not a parallel route.** During cycle 1, both routes exist (V1 untouched, V2 ships harness contracts). Long-term: V2 is the canonical surface. The cycle 2+ migration path turns V1 into a redirect to V2 (or repurposes V1 as a sub-view inside V2). | Operator clarification 2026-05-13 PM · [[v2-routes-as-evolution]] |
| Q-SDD-2 | Honeycomb / purupuru substrate relationship | **Both are substrate (agentic game infrastructure).** `lib/honeycomb/` covers the in-arena battle sub-game's Effect-substrate pattern; `lib/purupuru/` covers the world-overworld harness contracts. They have different *shapes* (Effect-PubSub vs minimal-EventEmitter per PRD D5) because they cover different *scopes*. Cycle 2+ does NOT unify them into one shape — the shapes serve different scopes by design. | Operator clarification 2026-05-13 PM · [[agentic-game-infrastructure]] |
| Q-SDD-3 | `art_anchor` binding | **Per-card YAML declarations.** Each card's YAML declares its `art_anchors: { background, character, frame, ... }` mapping to `lib/cards/layers/registry.json` IDs. Cycle 1 uses FR-21a `harnessCardToLayerInput()` adapter as a bridge; cycle 2 replaces the adapter with the YAML-declared binding mechanism. | Operator decision 2026-05-13 PM |
| Q-SDD-4 | Daemon-Assist API shape | **Reserve type slots in resolver-step op union; no-op stub in cycle 1.** `daemon_assist` is a known op enum value in FR-13's expanded list. Resolver returns `{ ok: false, reason: "unimplemented", op: "daemon_assist" }` when invoked. Daemon state machine's `Assist` state is typed but unreachable in cycle 1 (`affectsGameplay: false` everywhere). Cycle 2+ fills behavior; the type contract is forward-compatible. | Operator decision 2026-05-13 PM · SimCity-directional |
| Q-SDD-5 | (Resolved at PRD altitude · NOT in SDD scope) | Telemetry destination = JSONL trail per PRD D11/OD-3 | PRD r1 |

### 2.4 · Layer-by-layer decision summary

```
┌────────────────────────────────────────────────────────────────────┐
│ APP ZONE                                                            │
│                                                                     │
│  app/battle-v2/page.tsx               Next.js route shell           │
│  app/battle-v2/_components/                                         │
│    UiScreen.tsx                       FR-20 · slot-driven layout    │
│    WorldMap.tsx                       FR-20a · 1 real + 4 locked    │
│    ZoneToken.tsx                      FR-22 · 10+6 state compose    │
│    CardHandFan.tsx                    FR-21 · CardStack via adapter │
│    SequenceConsumer.tsx               FR-23 · event-bus consumer    │
│  app/battle-v2/_styles/                                             │
│    battle-v2.css                      FR-24 · OKLCH palette         │
│  app/battle/                          UNTOUCHED (V1 stays functional)│
│  app/kit/page.tsx                     FR-27 · adds /battle-v2 link  │
│                                                                     │
├────────────────────────────────────────────────────────────────────┤
│ LIB ZONE — SUBSTRATE (agentic game infrastructure)                 │
│                                                                     │
│  lib/purupuru/                        Harness-shaped substrate      │
│    schemas/*.schema.json              FR-1 · 8 vendored schemas    │
│    contracts/                                                       │
│      types.ts                         FR-2 · 15-member SE union    │
│      validation_rules.md              FR-2a · vendored verbatim    │
│    content/                                                         │
│      wood/*.yaml                      FR-4 · 8 vendored examples   │
│      loader.ts                        FR-3 · YAML→AJV→typed        │
│    runtime/                                                         │
│      game-state.ts                    FR-7 · GameState + factory   │
│      ui-state-machine.ts              FR-8 · UiMode transitions    │
│      card-state-machine.ts            FR-9 · CardLocation          │
│      zone-state-machine.ts            FR-10 · ZoneState (9 states) │
│      event-bus.ts                     FR-11 · tiny typed pub/sub   │
│      input-lock.ts                    FR-11a · lock-owner registry │
│      command-queue.ts                 FR-12 · emits CardCommitted  │
│      resolver.ts                      FR-13 · 6 ops + 5 commands   │
│      sky-eyes-motifs.ts               FR-14 · wood only            │
│      __daemon-read-grep.test.ts       FR-14a · static enforcement  │
│    presentation/                                                    │
│      anchor-registry.ts               FR-15 · anchor IDs           │
│      actor-registry.ts                FR-15 · actor IDs            │
│      ui-mount-registry.ts             FR-15 · UI mount IDs         │
│      audio-bus-registry.ts            FR-15 · audio bus IDs        │
│      sequencer.ts                     FR-16 · beat scheduler       │
│      harness-card-to-layer-input.ts   FR-21a · cycle-1 adapter     │
│      sequences/                                                     │
│        wood-activation.ts             FR-17 · 11-beat sequence     │
│    index.ts                           FR-25 · PURUPURU_RUNTIME +   │
│                                       PURUPURU_CONTENT exports     │
│    __tests__/                                                       │
│      schema.validate.test.ts          AC-3                          │
│      design-lint.test.ts              AC-3a                         │
│      state-machines.test.ts           AC-5                          │
│      resolver.replay.test.ts          AC-7 (golden fixture)        │
│      sequencer.beat-order.test.ts     AC-8                          │
│      input-lock.test.ts               AC-15                         │
│      game-state.serialize.test.ts     AC-14                         │
│                                                                     │
│  lib/honeycomb/                       UNTOUCHED (peer substrate)    │
│  lib/cards/layers/                    UNTOUCHED (visual primitive   │
│                                       · adapter bridges to it)      │
│  lib/registry/index.ts                MODIFIED · imports            │
│                                       PURUPURU_RUNTIME + PURUPURU_  │
│                                       CONTENT (flat-pattern)        │
│                                                                     │
├────────────────────────────────────────────────────────────────────┤
│ SCRIPTS + CONFIG                                                    │
│                                                                     │
│  scripts/s0-spike-ajv-element-wood.ts FR-0 · S0 lightweight spike   │
│                                       (delete after S0 audit)       │
│  scripts/validate-content.ts          FR-5 · AJV + 5 design-lints   │
│  package.json                         FR-6 · adds js-yaml + script  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## 3 · Contract types (TypeScript sketch)

The `contracts/types.ts` file hand-authored from `~/Downloads/purupuru_architecture_harness/contracts/purupuru.contracts.ts`. Treated as **advisory** per PRD D2 (file header says "engine-agnostic pseudocode"). JSON schemas are CANONICAL for persisted-content shape; types are a runtime convenience.

### 3.1 · Core unions

```typescript
export type ElementId = "wood" | "fire" | "water" | "metal" | "earth";
export type EntityId = string;
export type ContentId = string;
export type LocalizationKey = string;

export type UiMode =
  | "Boot" | "Loading" | "WorldMapIdle" | "CardHovered" | "CardArmed"
  | "Targeting" | "Confirming" | "Resolving" | "RewardPreview"
  | "TurnEnding" | "DayTransition";

export type CardLocation =
  | "InDeck" | "Drawn" | "InHand" | "Hovered" | "Armed"
  | "Committed" | "Resolving" | "Discarded" | "Exhausted" | "ReturnedToHand";

export type ZoneState =
  | "Locked" | "Idle" | "ValidTarget" | "InvalidTarget" | "Previewed"
  | "Active" | "Resolving" | "Afterglow" | "Resolved" | "Exhausted";

export type DaemonState =
  | "Hidden" | "IdleRoutine" | "Notice" | "React" | "Assist" | "ReturnToIdle";
```

### 3.2 · SemanticEvent union (15 members per contracts.ts:151-166)

```typescript
export type SemanticEvent =
  | { type: "CardHovered"; cardInstanceId: EntityId }
  | { type: "CardArmed"; cardInstanceId: EntityId }
  | { type: "TargetPreviewed"; cardInstanceId: EntityId; target: TargetRef; valid: boolean }
  | { type: "TargetCommitted"; cardInstanceId: EntityId; target: TargetRef }
  | { type: "CardPlayRejected"; cardInstanceId: EntityId; reason: string }
  | { type: "CardCommitted"; cardInstanceId: EntityId; cardDefinitionId: ContentId; target: TargetRef }
  | { type: "CardResolved"; cardInstanceId: EntityId; cardDefinitionId: ContentId }
  | { type: "ZoneActivated"; zoneId: EntityId; elementId: ElementId; activationLevel: number }
  | { type: "ZoneEventStarted"; zoneId: EntityId; eventId: ContentId }
  | { type: "ZoneEventResolved"; zoneId: EntityId; eventId: ContentId }
  | { type: "DaemonReacted"; daemonId: EntityId; reactionSetId: ContentId; zoneId?: EntityId }
  | { type: "RewardGranted"; rewardType: string; id: ContentId; quantity: number }
  | { type: "WeatherChanged"; activeElement: ElementId; scope: "localized" | "global" }
  | { type: "InputLocked"; ownerId: ContentId; mode: "soft" | "hard" }
  | { type: "InputUnlocked"; ownerId: ContentId };
```

README §9 lists 5 additional names (CardConsumed · ZoneBecameValidTarget · ZonePreviewed · DaemonRoutineChanged · TurnEnded) which are README-only and deferred from cycle 1 per PRD FR-2. EndTurnCommand emits `TurnEnded` as a NON-typed marker event (cycle 2 adds it to the union).

### 3.3 · GameCommand union (5 commands per PRD D4)

```typescript
export type GameCommand =
  | PlayCardCommand     // player surface
  | EndTurnCommand      // player surface · no-op stub cycle 1
  | ActivateZoneCommand // system-only · resolver-internal
  | SpawnEventCommand   // system-only · resolver-internal
  | GrantRewardCommand; // system-only · resolver-internal

export interface CommandBase {
  commandId: string;
  issuedAtTurn: number;
  source: "player" | "system" | "tutorial" | "replay";
}
```

### 3.4 · ResolverStep op union (6 ops · 5 cycle-1 + 1 forward-reserved)

```typescript
export type ResolverOpKind =
  | "activate_zone"   // FR-13 · card.wood_awakening
  | "spawn_event"     // FR-13 · card.wood_awakening
  | "grant_reward"    // FR-13 · card.wood_awakening + event.wood_spring_seedling
  | "set_flag"        // FR-13 · event.wood_spring_seedling
  | "add_resource"    // FR-13 · event.wood_spring_seedling
  | "daemon_assist";  // RESERVED · Q-SDD-4 forward-compat · no-op stub cycle 1

export interface ResolverStep {
  id: ContentId;
  op: ResolverOpKind;
  scope: "self" | "target_zone" | "target_daemon" | "adjacent_zones" | "all_zones" | "global_map";
  args: Record<string, unknown>;
  emits?: string[]; // semantic event names
}
```

### 3.5 · ResolveResult shape

```typescript
export interface ResolveResult {
  readonly nextState: GameState;
  readonly semanticEvents: SemanticEvent[];
  readonly rejected?: { readonly reason: string };
}

export interface CommandResolver {
  resolve(state: GameState, command: GameCommand, content: ContentDatabase): ResolveResult;
}
```

The `resolve` function is pure (PRD D4). No DOM/audio/UI side effects. AC-6 enforces.

## 4 · State machines (per harness §7)

### 4.1 · UiStateMachine (`runtime/ui-state-machine.ts`)

```typescript
// Pure function. Test exhaustively per AC-5.
export function transitionUi(mode: UiMode, event: SemanticEvent): UiMode {
  // Boot → Loading (system)
  // Loading → WorldMapIdle (system · initial state factory complete)
  // WorldMapIdle + CardHovered → CardHovered
  // CardHovered + CardArmed → CardArmed
  // CardArmed + TargetPreviewed (valid) → Targeting
  // Targeting + TargetCommitted → Confirming
  // Confirming + CardCommitted → Resolving
  // Resolving + InputUnlocked → RewardPreview
  // RewardPreview (after reward show timeout) → WorldMapIdle
  // *any* + CardPlayRejected → WorldMapIdle (with toast/error UI)
  // Test: every (mode, event) tuple has an explicit return.
}
```

Transition table covered in `__tests__/state-machines.test.ts`. Exhaustive switch with `never`-assert fallback for compile-time exhaustiveness check.

### 4.2 · CardStateMachine (`runtime/card-state-machine.ts`)

`InDeck → Drawn → InHand → Hovered → Armed → Committed → Resolving → {Discarded | Exhausted | ReturnedToHand}`. Driven by SemanticEvent emissions per harness §7.2.

Critical invariant (per `validation_rules.md:26-27`): a card cannot exist in two locations at once. Enforced by state-machine logic + a `lib/purupuru/runtime/card-location-invariants.ts` runtime assertion.

### 4.3 · ZoneStateMachine (`runtime/zone-state-machine.ts`)

`Locked → Idle → {ValidTarget | InvalidTarget} → Previewed → Active → Resolving → Afterglow → Resolved → Exhausted` (10 values including InvalidTarget). Driven by SemanticEvent emissions per harness §7.3.

The 4 decorative locked tiles per PRD D9 are pinned to `state: "Locked"` forever in cycle 1 — they cannot transition. ZoneToken (FR-22) renders them with `disabled` UI state.

### 4.4 · Daemon state machine (TYPED but UNUSED in cycle 1)

`Hidden → IdleRoutine → Notice → React → Assist → ReturnToIdle`. Cycle 1 daemons stay in `IdleRoutine` indefinitely. The `Assist` state is typed but unreachable (`affectsGameplay: false` per D10).

## 5 · Component specifications (per PRD §5 + harness §11)

### 5.1 · UiScreen wrapper (FR-20)

Reads `lib/purupuru/content/wood/ui.world_map_screen.yaml`'s `layoutSlots[]` + `components[]`. Renders each slot as a positioned region (% based on viewport). Each component declared in YAML mounts into its `slotId` with the declared `componentType`. `interactive: true` components get the 6-state UI machine (idle/hovered/pressed/selected/disabled/resolving). `bindsTo` field threads to game state via the SequenceConsumer subscription.

```typescript
interface UiScreenProps {
  screen: UiScreenDefinition; // from ui.world_map_screen.yaml
  state: GameState;            // read-only
}
```

### 5.2 · WorldMap (FR-20a)

Mounts inside `slot.center.world_map` (60×58%). Renders:
- 1 `<ZoneToken zoneId="wood_grove" state={gameState.zones.wood_grove} />` (real, schema-backed)
- 4 `<ZoneToken zoneId="<name>" state={{ state: "Locked", elementId: <element>, ... }} decorative />` for water_harbor / fire_station / metal_mountain / earth_teahouse
- 1 Sora Tower at center (decorative, non-interactive)
- Cloud-plane parallax via CSS `translateY` 8-12s loop. Viewport does NOT pan.

Background: `oklch(0.18 0.02 260)` cosmic-indigo void · cream map-island `oklch(0.94 0.015 90)` · SVG noise filter for paper grain.

### 5.3 · ZoneToken (FR-22 · 10+6 state compose)

```typescript
interface ZoneTokenProps {
  zoneId: EntityId;
  state: ZoneRuntimeState;     // gameplay state from runtime
  uiState?: UiInteractionState; // hovered/pressed (driven by React)
  decorative?: boolean;        // when true, pins to Locked + disabled
  onTarget?: () => void;       // commit handler
}

type UiInteractionState =
  | "idle" | "hovered" | "pressed" | "selected" | "disabled" | "resolving";
```

Visual: discrete painted-illustration on cream-map base · ink-line silhouette `oklch(0.18 0.02 260)` + flat-color interior. 3-5 sub-tokens per zone (sakura tree, shrine stone, torii for wood). Outline color from harness `element.wood.yaml:colorTokens.primary` for ValidTarget pulse.

Decorative tiles: high desaturation + no glow + `cursor: not-allowed` (R11 mitigation).

### 5.4 · CardHandFan (FR-21) + adapter (FR-21a)

```typescript
// FR-21a · lib/purupuru/presentation/harness-card-to-layer-input.ts
export function harnessCardToLayerInput(card: CardDefinition): LayerInput {
  // Cycle 1: map harness cardType -> honeycomb cardType
  // activation -> caretaker_a (sole mapping; cycle 2 widens)
  return {
    element: card.elementId,
    cardType: card.cardType === "activation" ? "caretaker_a" : "caretaker_a", // fallback
    rarity: card.balance?.rarity ?? "starter" === "starter" ? "common" : (card.balance.rarity as Rarity),
    revealStage: "hand",
    face: "front",
  };
}
```

CardHandFan: `<CardStack {...harnessCardToLayerInput(card)} />` rendered in shallow horizontal arc. Center card `translateY(-12px)` on hover. Amber-honey halation `oklch(0.82 0.14 85)` on hovered card.

Operator visual review at S4 close confirms whether `caretaker_a` mapping reads correctly for `activation` cards (R10 mitigation; fallback path = harness-native placeholder per OD-2 path B if visual fails).

### 5.5 · SequenceConsumer (FR-23)

Invisible React useEffect host. On mount:
1. Subscribe to event-bus for `CardCommitted` events.
2. Register all anchor refs / actor handles / UI mount points / audio bus connections into the 4 target registries (FR-15).
3. Hand off `CardCommitted` events to the sequencer (FR-16), which schedules the 11 beats.

On unmount: unsubscribe + tear down registries (no memory leaks).

```typescript
function SequenceConsumer({ children }: { children: ReactNode }) {
  const sequencerRef = useRef<Sequencer | null>(null);

  useEffect(() => {
    const seq = createSequencer({ eventBus, registries });
    sequencerRef.current = seq;
    const unsub = eventBus.subscribe("CardCommitted", (event) => {
      const card = getCardDefinition(event.cardDefinitionId);
      seq.fire(card.presentation.sequenceId, event);
    });
    return () => {
      unsub();
      seq.dispose();
    };
  }, []);

  return <>{children}</>;
}
```

## 6 · 11-beat sequence implementation (FR-17)

The TypeScript implementation of `sequence.wood_activation.yaml` at `lib/purupuru/presentation/sequences/wood-activation.ts`. Beats listed at PRD r1 FR-17. Each beat:

```typescript
interface WoodActivationBeat {
  id: string;
  atMs: number;
  durationMs: number;
  action: BeatAction;
  target: string; // resolves through one of 4 registries
  targetRegistry: "anchor" | "actor" | "ui-mount" | "audio-bus";
  params: Record<string, unknown>;
  saliencyTier: 0 | 1 | 2 | 3 | 4 | 5;
}
```

Schedule on `CardCommitted` event:

```typescript
function fireWoodActivation(event: CardCommitted) {
  const start = performance.now();
  for (const beat of WOOD_ACTIVATION_BEATS) {
    scheduleBeat(beat, start + beat.atMs);
  }
}

function scheduleBeat(beat: WoodActivationBeat, fireAt: number) {
  const tick = () => {
    if (performance.now() >= fireAt) {
      executeBeat(beat);
    } else {
      requestAnimationFrame(tick);
    }
  };
  requestAnimationFrame(tick);
}
```

Tests use injectable `Clock` interface per PRD D6:

```typescript
interface Clock {
  now(): number;
  rafSchedule(callback: () => void): void;
}
// production: real performance.now() + requestAnimationFrame
// tests: vi.useFakeTimers() + manual advance
```

## 7 · Resolver implementation sketch (FR-13)

```typescript
// lib/purupuru/runtime/resolver.ts
export function resolve(
  state: GameState,
  command: GameCommand,
  content: ContentDatabase
): ResolveResult {
  switch (command.type) {
    case "PlayCard": return resolvePlayCard(state, command, content);
    case "EndTurn": return resolveEndTurn(state, command);
    case "ActivateZone": return resolveActivateZone(state, command);
    case "SpawnEvent": return resolveSpawnEvent(state, command, content);
    case "GrantReward": return resolveGrantReward(state, command);
    default: { const _: never = command; throw new Error("exhaustive"); }
  }
}

function resolvePlayCard(state, command, content): ResolveResult {
  const card = content.getCardDefinition(command.cardInstanceId);
  if (!card) return { nextState: state, semanticEvents: [], rejected: { reason: "unknown_card" } };

  // Pre-flight: validate input lock not held by another owner (FR-11a)
  if (isLockedByOther(state, "player")) {
    return { nextState: state, semanticEvents: [{
      type: "CardPlayRejected", cardInstanceId: command.cardInstanceId, reason: "input_locked"
    }], };
  }

  // Validate targeting
  const valid = validateTargeting(card.targeting, command.target, state);
  if (!valid) return { ..., rejected: { reason: "invalid_target" } };

  // Execute resolver steps from the card definition + any spawned events
  const events: SemanticEvent[] = [];
  let next = state;
  for (const step of card.resolverSteps) {
    const stepResult = executeOp(step, next, content, command.target);
    next = stepResult.state;
    events.push(...stepResult.events);
  }

  // Emit CardCommitted (FR-12 enforces this in command-queue.ts; resolver also emits as redundancy)
  events.unshift({ type: "CardCommitted", cardInstanceId: command.cardInstanceId, cardDefinitionId: card.id, target: command.target });

  return { nextState: next, semanticEvents: events };
}

function executeOp(step, state, content, target): { state: GameState; events: SemanticEvent[] } {
  switch (step.op) {
    case "activate_zone":    return opActivateZone(state, step, target);
    case "spawn_event":      return opSpawnEvent(state, step, content, target);
    case "grant_reward":     return opGrantReward(state, step);
    case "set_flag":         return opSetFlag(state, step);
    case "add_resource":     return opAddResource(state, step);
    case "daemon_assist":    return { state, events: [] }; // Q-SDD-4 · no-op stub cycle 1
    default: { const _: never = step.op; throw new Error("exhaustive"); }
  }
}
```

Each `opX` function is pure. Tests in `resolver.replay.test.ts` cover all 6 ops.

### 7.1 · Golden replay fixture (AC-7 · per validation_rules.md:36-81)

```typescript
// __tests__/resolver.replay.test.ts
test("core_wood_demo_001 produces 5-event sequence", () => {
  const initialState = loadFixture("core_wood_demo_001"); // pre-vendored from validation_rules.md
  const command: PlayCardCommand = {
    type: "PlayCard", commandId: "cmd-001", issuedAtTurn: 1, source: "player",
    cardInstanceId: "hand_003", // hand_003 = wood_awakening per fixture
    target: { kind: "zone", zoneId: "wood_grove" }
  };
  const result = resolve(initialState, command, content);
  expect(result.semanticEvents.map(e => e.type)).toEqual([
    "CardCommitted",
    "ZoneActivated",
    "ZoneEventStarted",
    "DaemonReacted",
    "RewardGranted", // 1+ times depending on event reward count
  ]);
  // Determinism: same input -> same output, byte-for-byte
  const result2 = resolve(initialState, command, content);
  expect(result2).toEqual(result);
});
```

## 8 · Loader implementation sketch (FR-3)

```typescript
// lib/purupuru/content/loader.ts
import * as yaml from "js-yaml";
import Ajv from "ajv";
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const ajv = new Ajv({ allErrors: true });
const schemas = loadAllSchemas("lib/purupuru/schemas"); // cached

interface LoaderResult<T> { data: T; sourcePath: string; warnings: string[]; }

export function loadCard(path: string): LoaderResult<CardDefinition> {
  const raw = yaml.load(readFileSync(path, "utf8"));
  const validator = ajv.getSchema("card.schema.json");
  if (!validator(raw)) throw new Error(`AJV: ${ajv.errorsText(validator.errors)}`);
  // Normalize: YAML resolver.steps -> TS resolverSteps (camelCase)
  return { data: normalizeCard(raw), sourcePath: path, warnings: [] };
}

// Pack manifest is PROVENANCE-ONLY per PRD FR-3 (Codex SKP-MEDIUM-002 resolution)
// Loader discovers colocated YAMLs by directory walk
export function loadPack(dir: string): PackContent {
  const files = readdirSync(dir).filter(f => f.endsWith(".yaml"));
  const result: PackContent = { cards: [], zones: [], events: [], sequences: [], elements: [], uiScreens: [], telemetry: [] };
  for (const file of files) {
    const inferKind = (n: string) => {
      if (n.startsWith("card.")) return "card";
      if (n.startsWith("zone.")) return "zone";
      // ... etc
    };
    // Load + dispatch to correct bucket
  }
  return result;
}
```

Normalizer maps YAML `resolver.steps` → TS `resolverSteps` (camelCase) per PRD D2.

## 9 · Design lints (AC-3a · 5 checks per Codex SKP-MEDIUM-004)

In `scripts/validate-content.ts` after AJV validates structurally:

1. **Wood card has Wood verbs**: card.verbs ⊆ element.wood.verbs (loaded from element.wood.yaml). Cycle 1 wood verbs are `["grow", "awaken", "bind", "heal", "branch", "nurture"]`.
2. **Localized weather is target-zone-only**: any sequence beat with `action: "start_vfx_loop"` AND `params.scope === "target_zone_only"` cannot fire on a zone with `weatherBehavior !== "localized_only"`.
3. **Input lock ends in unlock/fallback**: every sequence with `inputPolicy.lockMode !== "none"` MUST have an `unlock_input` beat OR transition to another lock-owner sequence within `maxLockMs`.
4. **No undefined zone tags**: every `zone.tags[]` value must appear in the wood pack's zone-tags vocabulary (declared in pack manifest or default-known set).
5. **No locked resolver ops in non-core packs**: cycle 1's pack is `tier: core`, so this is vacuously true; lint still runs for future-pack readiness.

Failures log to stderr with file:line + lint-rule ID + offending value. `pnpm content:validate` exits non-zero on any failure.

## 10 · Sprint task contracts (per PRD §9)

Each task has: file paths to create/modify · code shape · acceptance criteria · LOC sub-budget (approximate).

### S0 · Lightweight calibration spike (≤ 0.5 day · per PRD FR-0)

| Task | File | Acceptance |
|---|---|---|
| S0-T1 | `scripts/s0-spike-ajv-element-wood.ts` | Vendor `element.schema.json` + `element.wood.yaml` to a scratch dir; run AJV validation; exit 0 on success. Report at `sprint-0-COMPLETED.md`. Delete the spike script after S0 audit-sprint approves. |

**LOC sub-budget**: ~80 lines (spike script, deleted on audit). Net cycle LOC delta: 0.

### S1 · Schemas + Contracts + Loader + Design-Lint (~ 2.5 days · ~ 900 LOC)

| Task | File | LOC |
|---|---|---|
| S1-T1 | `lib/purupuru/schemas/{8 files}` (vendor) | 0 (vendored) |
| S1-T2 | `lib/purupuru/contracts/{types.ts, validation_rules.md}` | ~ 400 |
| S1-T3 | `lib/purupuru/content/wood/{8 yamls}` (vendor) | 0 (vendored) |
| S1-T4 | `lib/purupuru/content/loader.ts` | ~ 200 |
| S1-T5 | `scripts/validate-content.ts` + 5 design-lints | ~ 200 |
| S1-T6 | `package.json` (add `js-yaml` + `content:validate` script) | ~ 5 |
| S1-T7 | `lib/purupuru/__tests__/{schema.validate, design-lint}.test.ts` | ~ 150 |
| S1 gate | `pnpm content:validate` exits 0; `pnpm typecheck` clean; AC-1 through AC-4 + AC-3a green | — |

### S2 · Runtime (~ 3 days · ~ 1,100 LOC)

| Task | File | LOC |
|---|---|---|
| S2-T1 | `lib/purupuru/runtime/{game-state,event-bus,input-lock,command-queue}.ts` | ~ 350 |
| S2-T2 | `lib/purupuru/runtime/{ui,card,zone}-state-machine.ts` | ~ 300 |
| S2-T3 | `lib/purupuru/runtime/resolver.ts` (6 ops + 5 commands) | ~ 350 |
| S2-T4 | `lib/purupuru/runtime/sky-eyes-motifs.ts` (wood only) | ~ 30 |
| S2-T5 | `lib/purupuru/__tests__/{state-machines, resolver.replay, input-lock, game-state.serialize}.test.ts` | ~ 400 |
| S2-T6 | `lib/purupuru/__tests__/__daemon-read-grep.test.ts` (static check) | ~ 30 |
| S2 gate | Replay test passes 5-event sequence; AC-5 through AC-7 + AC-9 + AC-14 + AC-15 green | — |

### S3 · Presentation (~ 2 days · ~ 700 LOC)

| Task | File | LOC |
|---|---|---|
| S3-T1 | `lib/purupuru/presentation/{anchor,actor,ui-mount,audio-bus}-registry.ts` | ~ 250 |
| S3-T2 | `lib/purupuru/presentation/sequencer.ts` (injectable Clock) | ~ 200 |
| S3-T3 | `lib/purupuru/presentation/sequences/wood-activation.ts` (11 beats) | ~ 250 |
| S3-T4 | `lib/purupuru/__tests__/sequencer.beat-order.test.ts` (vi.useFakeTimers) | ~ 200 |
| S3 gate | Dry-run sequencer fires 11 beats at correct atMs ±16ms with mock registries; AC-8 green | — |

### S4 · /battle-v2 surface (~ 3.5 days · ~ 1,200 LOC)

| Task | File | LOC |
|---|---|---|
| S4-T1 | `lib/purupuru/presentation/harness-card-to-layer-input.ts` (adapter) | ~ 50 |
| S4-T2 | `app/battle-v2/page.tsx` | ~ 30 |
| S4-T3 | `app/battle-v2/_components/UiScreen.tsx` (slot-driven) | ~ 250 |
| S4-T4 | `app/battle-v2/_components/WorldMap.tsx` (1 real + 4 locked + Sora Tower) | ~ 200 |
| S4-T5 | `app/battle-v2/_components/ZoneToken.tsx` (10+6 state compose) | ~ 250 |
| S4-T6 | `app/battle-v2/_components/CardHandFan.tsx` (via adapter) | ~ 150 |
| S4-T7 | `app/battle-v2/_components/SequenceConsumer.tsx` | ~ 100 |
| S4-T8 | `app/battle-v2/_styles/battle-v2.css` | ~ 200 |
| S4 gate | Playwright E2E: hover wood card → ValidTarget pulse → click → 11-beat sequence → unlock; AC-10 + AC-11 green; operator visual review (R10 + R11) | — |

### S5 · Integration + Telemetry + Docs + Final Gate (~ 1.5 days · ~ 400 LOC)

| Task | File | LOC |
|---|---|---|
| S5-T1 | `lib/purupuru/index.ts` (export PURUPURU_RUNTIME + PURUPURU_CONTENT) | ~ 40 |
| S5-T2 | `lib/registry/index.ts` (modify · import the constants) | ~ 10 |
| S5-T3 | Telemetry emission · ONE CardActivationClarity event with 7 props | ~ 150 |
| S5-T4 | `app/kit/page.tsx` (add link · OD-1 deferred to operator) | ~ 5 |
| S5-T5 | `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/README.md` (docs) | ~ 100 |
| S5-T6 | `lib/registry/__tests__/index.test.ts` (registry integrity) | ~ 50 |
| S5-T7 | Cycle COMPLETED markers · `sprint-{0..5}-COMPLETED.md` + `CYCLE-COMPLETED.md` | ~ 50 |
| S5 gate | `/review-sprint sprint-5` + `/audit-sprint sprint-5` green; AC-12 + AC-13 + AC-16 + AC-17 + AC-18 green; net LOC ≤ +4,500 (per PRD AC-17) | — |

**Total estimated**: ~ 4,300 LOC (under PRD's +4,500 cap with ~ 4% headroom).

## 11 · Test methodology

### 11.1 · Vitest layers

| Layer | Coverage target | Pattern |
|---|---|---|
| Pure functions | 95%+ | every branch via parameterized tests |
| State machines | 100% transition coverage | matrix of (state, event) tuples |
| Resolver | 100% command + op coverage | replay tests against golden fixtures |
| Sequencer | 100% beat ordering | mock registries + injectable clock |
| Adapters (FR-21a) | 100% input cardType coverage | exhaustive switch test |
| React components | render + interaction smoke | @testing-library/react + Playwright for E2E |

### 11.2 · Determinism

- Resolver: same `(state, command)` → byte-equal `ResolveResult`. Tested via deep-equal assertion on a serialized golden fixture.
- Sequencer: same event-bus sequence → same beat firing order (clock-deterministic).
- Loader: same YAML file → same typed object (no Date.now or Math.random).

### 11.3 · Acceptance verification matrix (AC → test file)

| AC | Test file | Notes |
|---|---|---|
| AC-0 | `sprint-0-COMPLETED.md` (one-shot script) | S0 spike report |
| AC-1 | `__tests__/schema.validate.test.ts` | 8 schema files exist |
| AC-2 | `__tests__/schema.validate.test.ts` | 8 YAML files exist |
| AC-2a | smoke check in CI | `validation_rules.md` exists |
| AC-3 | `__tests__/schema.validate.test.ts` | every YAML validates |
| AC-3a | `__tests__/design-lint.test.ts` | 5 lint checks |
| AC-4 | `pnpm typecheck` | no purupuru-namespace errors |
| AC-5 | `__tests__/state-machines.test.ts` | full transition coverage |
| AC-6 | `__tests__/resolver.replay.test.ts` | resolver is pure |
| AC-7 | `__tests__/resolver.replay.test.ts` | 5-event sequence |
| AC-8 | `__tests__/sequencer.beat-order.test.ts` | 11 beats at ±16ms |
| AC-9 | `__tests__/grep-presentation-imports.test.ts` + `__daemon-read-grep.test.ts` | static checks |
| AC-10 | Playwright `/battle-v2` smoke | route renders, all components present |
| AC-11 | Playwright E2E | full 11-beat sequence visible |
| AC-12 | `lib/registry/__tests__/index.test.ts` | typecheck + import resolution |
| AC-13 | `__tests__/telemetry.emit.test.ts` | ONE event with 7 props |
| AC-14 | `__tests__/game-state.serialize.test.ts` | parse(serialize(x)) === x |
| AC-15 | `__tests__/input-lock.test.ts` | acquire/release/transfer invariants |
| AC-16 | git status + CI artifact check | sprint-N-COMPLETED.md files exist |
| AC-17 | `git diff main..HEAD --stat` | net LOC ≤ +4,500 |
| AC-18 | README.md existence + content check | docs present |

## 12 · Risk re-evaluation (PRD §8 updated)

R1-R11 from PRD r1 hold. Additional SDD-level risks:

| ID | Risk | Likelihood | Mitigation |
|---|---|---|---|
| SDD-R1 | The `EndTurnCommand` no-op stub emits a `TurnEnded` marker event that's NOT in the SemanticEvent union (15 types) — TypeScript narrowing breaks | Medium | Use a `SemanticMarker` side-channel for cycle-1: `{ type: "TurnEnded" }` carried in a separate `markers: Marker[]` field on ResolveResult. Cycle 2 promotes to typed union. |
| SDD-R2 | The 4 target registries (FR-15) may have circular initialization dependencies if components register before sequencer subscribes | Low | SequenceConsumer (FR-23) controls init order: registries first, then sequencer subscription. Test asserts ordering. |
| SDD-R3 | YAML loader's directory-walk discovery (FR-3) may fail in environments where `lib/purupuru/content/wood/` is symlinked or bundled (Next.js Turbopack) | Low | Test with `pnpm build` + `pnpm start`; if Turbopack tree-shakes YAML files, embed them as inline imports at build time (cycle-2 concern; cycle-1 dev-server-only is sufficient). |

## 13 · Sources

- PRD r1: `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/prd.md` (441 lines · flatline-integrated)
- Manual flatline artifacts: `grimoires/loa/a2a/flatline/cycle-1-prd-{opus-structural,codex-skeptic,consensus}-2026-05-13.{md,md,json}`
- Harness: `~/Downloads/purupuru_architecture_harness/{README.md, schemas/*, contracts/{purupuru.contracts.ts, validation_rules.md}, examples/*}`
- Predecessor SDD (format reference): `grimoires/loa/cycles/card-game-in-compass-2026-05-12/sdd.md`
- Memory anchors (background-only · activated for this session):
  - `[[agentic-game-infrastructure]]` — substrate framing across honeycomb/purupuru namespaces (NEW 2026-05-13 PM)
  - `[[v2-routes-as-evolution]]` — V-suffixed routes = evolutionary iterations (NEW 2026-05-13 PM)
  - `[[honeycomb-substrate]]` — canonical alias for effect-substrate doctrine
  - `[[purupuru-world-org-shape]]` — zones-as-apps within Rosenzu meta-world
- Operator clarifications (this discovery · 2026-05-13 PM):
  - Q-SDD-1: V2 is evolution of V1, same game
  - Q-SDD-2: Both substrates are the same thing (agentic game infrastructure)
  - Q-SDD-3: Per-card YAML art_anchor declarations
  - Q-SDD-4: Reserve daemon_assist type slot, no-op stub cycle 1

---

> **Sources**: PRD r1 (441 lines) · harness (all 8 schemas + 8 YAML examples + contracts.ts pseudocode + validation_rules.md) · code reality verification (`lib/purupuru/` non-existent · `lib/cards/layers/` + `lib/honeycomb/` + `app/battle/` + `lib/registry/index.ts` + `package.json` extant) · this session's two discovery interviews (1 consolidated PRD discovery + 1 consolidated SDD clarification with reframe · 7 operator answers total) · construct identities (ARCH-OSTROM · SHIP-BARTH · craft-ALEXANDER) loaded at session start
