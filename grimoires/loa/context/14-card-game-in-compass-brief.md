---
status: candidate
type: crystallization-brief
cycle-name-proposal: card-game-in-compass
created: 2026-05-12
created-by: this Honeycomb-substrate session (post substrate-agentic-translation-adoption-2026-05-12 ship)
sources-active:
  - grimoires/loa/prd.md (substrate cycle · provides Honeycomb foundation)
  - ~/Documents/GitHub/purupuru-game/prototype/src/lib/game/ (state-machine source · 204 tests)
  - ~/Documents/GitHub/world-purupuru/sites/world/src/lib/{battle,game}/ (UI/UX source · NOT code-portable)
  - ~/Documents/GitHub/construct-effect-substrate/ (doctrine pack · scaffold-system.sh + patterns)
operator-decrees:
  - "Honeycomb substrate = effect-substrate. Pure, deferred-execution architectural substrate unifying EffectTS + ECS + Hexagonal. Bounded by contract, packed for performance, infinitely scalable."
  - "world-purupuru = Rosenzu meta-world; apps = zone-experiences; shared substrate across them."
  - "purupuru-game weighed for game design + state machines. world-purupuru weighed for UI/UX qualities."
  - "the substrate is for you. I need a surface to work on the UI."
  - "stop overcooking the backend. just shipping at this point."
---

# Crystallization Brief · `card-game-in-compass`

> This brief is `status: candidate`. Promote to `active` (move to `grimoires/loa/context/active/`) when the operator approves and we're ready to fire `/plan-and-analyze`.

## 0 · Why this brief exists

The Honeycomb substrate cycle (substrate-agentic-translation-adoption-2026-05-12) shipped yesterday, explicitly excluding card-game work and naming `~/Documents/GitHub/purupuru-game` as the canonical card-game home. The operator has since redirected: bring the card game *into compass* with Three.js, learning indie-dev craft, while keeping purupuru-game as the tested-logic source and world-purupuru as the UI/UX vocabulary source.

This is a **scope expansion** of the just-shipped cycle, not a continuation. It needs its own `/plan`. This brief is the input.

## 1 · What's already done (this session)

Scaffolded under `feat/honeycomb-battle` branch · Loa updated to v1.157.0:

| Slice | Status | Files |
|---|---|---|
| Honeycomb pack installed | ✅ | `.claude/constructs/packs/effect-substrate/` (symlink to local source) |
| Pure modules (port-free, framework-agnostic) | ✅ | `lib/honeycomb/{wuxing,cards,curves,whispers,seed,lineup,combos,conditions}.ts` |
| Battle state machine (port + live + mock + tests) | ✅ | `lib/honeycomb/battle.{port,live,mock}.ts` + 5 passing tests |
| Wired into single Effect.provide site | ✅ | `lib/runtime/runtime.ts` appended `BattleLive` to PrimitivesLayer |
| `/battle` route + 2D surface | ✅ | `app/battle/{page.tsx,_scene/*.tsx}` · 6 components |
| Caretaker whispers (Persona/Futaba navigator) | ✅ | `lib/honeycomb/whispers.ts` · 5 elements × 5 moods · seed-driven |
| Kaironic tuning surface | ✅ hand-rolled v1 | `app/battle/_scene/KaironicPanel.tsx` · 7 sliders |
| Replayable seeds | ✅ | `lib/honeycomb/seed.ts` · mulberry32 · "Seed is King" |

**v1 phase machine**: `idle → select → arrange → preview → committed`. Clash resolution, AI opponent, and round-by-round attrition are intentionally NOT in v1 — the operator validates the *substrate feel* through arrangement first, then clash logic lands in v2.

## 2 · What was studied (UI/UX vocabulary from world-purupuru)

Captured as patterns in `lib/honeycomb/curves.ts` + `lib/honeycomb/whispers.ts`. NOT ported as code (SvelteKit → Next.js incompatibility).

| Vocabulary | Sourced from | Embodied in compass as |
|---|---|---|
| 13 named spring/easing curves | `lib/game/puru-curves/` | `PURU_SPRINGS`, `PURU_EASINGS`, `RELIQUARY_SPRINGS` in `lib/honeycomb/curves.ts` |
| 7-dim kaironic weights ("felt time") | `lib/game/puru-curves/kaironic-weights.ts` | `DEFAULT_KAIRONIC_WEIGHTS` + `weighted()` helper |
| Per-element caretaker whispers (Persona/Futaba) | `lib/battle/state.svelte.ts` Session 75 Gumi alignment | `WHISPERS` × 5 moods (win · lose · draw · anticipate · stillness) |
| `(rooms)` route group register | `routes/(rooms)/` + `(immersive)/` | NOT YET adopted in compass — open question |
| OKLCH wuxing palette + cloud-not-void surfaces | `taste.md` | Already in compass `app/globals.css` via prior cycle |
| `puru-camera`, `puru-physics`, `puru-render`, `juice-bus` | `lib/game/*` | NOT YET ported — open question |

## 3 · The three-source split (operator decree codified)

```
purupuru-game  →  state machines + game invariants  →  lib/honeycomb/  (ported as pure TS + Effect systems)
                                                             ↑
                                                             |
world-purupuru →  UI/UX vocabulary + curves + whispers  →  same
                                                             ↑
                                                             |
construct-effect-substrate (Honeycomb)  →  pattern + scaffold-system.sh  →  same
```

Nothing in compass imports from those other repos. The vocabulary is *transcribed*, not linked.

## 4 · Open questions (must be resolved at `/plan` time)

1. **Three.js viewport altitude**. Pure R3F (one scene)? Or hybrid Three+2D-overlay (battlefield = canvas, HUD = HTML)? world-purupuru does hybrid. Indie-dev path = pick hybrid early; the HUD already exists in 2D and shouldn't be re-implemented in 3D space.
2. **Card visual primitive**. World-purupuru has `lib/primitives/card-flip/` and a pokemon-cards-css reference. Port the holographic-tilt + frame-art system into a compass component, or design a simpler "compass card" first?
3. **Daemon NFT / Puruhani spine integration**. Operator named the Puruhani as the player's TBA-style companion. The Genesis Stones contract already ships at `programs/`. Does the `/battle` route need wallet awareness in this cycle, or stays mockable?
4. **Cosmic weather source**. Currently `getDailyElement()` is a 5-day rotation. The Five Oracles (TREMOR / CORONA / BREATH) feed remains future. v2 question.
5. **AI opponent / Puruhani agent**. The brief promises "duel a friend's Puruhani while they sleep." Stub now (random hand) or design properly?
6. **DialKit dependency**. v1 ships hand-rolled sliders. Adding `tweakpane` is a small lift; `dialkit` is heavier. Confirm before installing.
7. **Tests for ported pure modules**. purupuru-game's 204 tests are not yet replayed against compass's port — there are `wuxing.ts`-shape differences (e.g. interaction shift constants), so direct fixture import won't work. Either port the test fixtures, or write fresh test cases that grow with the substrate.
8. **Room-register adoption**. world-purupuru uses `(rooms)/(immersive)/(observatory)` Next.js-style segment groups. Should compass adopt? If yes, `/battle` → `/(immersive)/battle/`.

## 5 · Proposed sprint shape (for `/sprint-plan` once `/plan` finishes)

| Sprint | Theme | Output |
|---|---|---|
| S1 | Clash resolution + match completion | `battle.live.ts` extended through clash loop · 6 invariant tests · purupuru-game pure clash fixtures replayed |
| S2 | Three.js viewport (hybrid · battlefield) | `app/battle/_scene/Battlefield3D.tsx` · 5-card spatial arrangement · element-aware shaders · viewport composes WITH existing 2D HUD |
| S3 | Tweakpane + dialkit polish | Replace hand-rolled `KaironicPanel` with proper tweakpane panel · live shader/curve binding |
| S4 | AI opponent (Puruhani agent) | `opponent.port.ts/live.ts` · per-element personality · daily-duel scaffolding |
| S5 | Card visual primitive (holographic + frame) | Port world-purupuru's `card-flip` and `frame` vocabularies into compass card component |

## 6 · Out of scope for this cycle

- Real Five Oracles wiring (TREMOR / CORONA / BREATH)
- Solana on-chain battle moves (PRD substrate-agentic cycle says compass writes envelopes; chain integration is its own cycle)
- Mobile-first responsive (compass is desktop-first; mobile is a polish phase)
- Daemon NFT / Puruhani TBA mint (separate cycle · operator named as future arc)
- Friend-duel networking
- Soul-stage agent autonomy (the "your Puruhani plays while you sleep" feature)

## 7 · Hand-off note for the next session

If the operator opens this brief on the next session:

- The substrate is *typed* and *tested* — fire `pnpm vitest run lib/honeycomb` to confirm 5/5 green.
- The surface is *visible* — `pnpm dev` → `/battle` → click *Step into the arena*.
- Tweak the kaironic sliders in the right panel; rearrange the lineup; combos recompute live.
- The caretaker speaks bottom-center. Same seed always speaks the same lines (modulo the small `Math.random` whisper-index — that's a TODO to make whisper picks seed-deterministic too).
- When ready, fire `/plan` and reference this brief. The questions in §4 are the conversation starters.
