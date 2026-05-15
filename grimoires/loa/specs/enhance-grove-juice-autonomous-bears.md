# Session 12 — Grove Juice + Autonomous Bears

> *Play a card. The wood grove answers — not with a flash, but with consequence.
> A tree grows. The bears notice, and go to work. Wood is cut, carried, stacked
> at the station. The map keeps the score.*

> **Mode**: FEEL (ALEXANDER) surface · expert game-eng (autonomous agents)
> **Date**: 2026-05-14
> **Target**: `app/battle-v2/_components/world/` — worktree `compass-cycle-1`
> **Substrate**: `lib/purupuru/` is OFF-LIMITS. All juice is beat-driven
> presentation, reading `activeBeat` + `GameState`.

---

## Why

The world is built — continent, elemental territories, raptor camera, the
ritual. Session 12 is **juice**: the felt satisfaction of playing a card and
*influencing an area of the map*. Not VFX for their own sake — visible, legible
**consequence**. The wood grove is the worked example.

## Resolved decisions (operator, 2026-05-14)

Three open shapes from the kickoff track, settled in-session:

### D1 · Memory channel — read `activationLevel`

The grove "remembers" via the substrate, not a parallel store. Every wood card
play increments `state.zones.wood_grove.activationLevel` (substrate-side, in
`card.wood_awakening.yaml` → `activationLevelDelta: 1`). Grove density — trees
grown, bear population, wood stockpiled — is a **pure function of
`activationLevel`**. Deterministic, substrate-grounded, survives re-render, zero
substrate edits.

### D2 · Bears are autonomous agents

Not a scripted timeline — a real (small) **autonomous-agent system**. The
operator's vision is option 2, and wants the expert vocabulary made explicit:

- **Steering behaviors** (Craig Reynolds, 1999) — a bear is a point-mass with
  `maxSpeed` + `maxForce`. Behaviors (`seek`, `arrive`, `wander`) produce a
  *steering force*; the agent integrates it. `arrive` eases to a stop inside a
  slow-radius so a bear doesn't jitter on its target.
- **Finite State Machine (FSM)** — the bear's "brain". States:
  `WANDER → SEEK_TREE → CHOP → HAUL → DELIVER → WANDER`. Each state selects a
  steering behavior + a target; transitions fire on arrival or a state timer.
- **The agent loop** — every frame: *perceive* (where am I, where's my target) →
  *decide* (FSM transition) → *act* (steering force → integrate → clamp to land
  via `isOnLand`).

The grove is *always working* — bears run the loop independent of card plays.
A card play makes the grove **busier and bigger** (more bears, more trees),
which the eye reads as the card's consequence.

### D3 · Weather is active-territory only

The active element's region (`regionAt`) gets the weather effect — wood active →
pollen motes drifting up over the wood territory + a soft green light wash.
Keyed off `state.weather.activeElement`. Built element-generic; only wood is
exercised in cycle-1. **Global cosmic weather is reserved** for real-world /
cross-instance global state (Discord, other players, IRL weather) — TBD, out of
scope.

## Build plan

New files under `app/battle-v2/_components/world/`:

| File | Role |
|------|------|
| `agents/steering.ts` | The vocabulary — `Vec2` math, `seek` / `arrive` / `wander`, `integrate`. Pure, testable. |
| `agents/bearBrain.ts` | The FSM — `Bear` type, `stepBear(bear, ctx, dt)` perceive→decide→act. |
| `BearColony.tsx` | R3F host — spawns `f(activationLevel)` bears, steps the loop in `useFrame`, renders each as a billboard PNG (`/brand/characters/bear-0{1,2,3}.png`), shows a carried log while hauling. `modelSlot`-ready for a MeshyAI GLB swap. |
| `GroveGrowth.tsx` | Trees that grow with `activationLevel` — rejection-sampled in the wood region; the newest sapling springs in (scale 0→1) on the `impact_seedling` beat. |
| `WoodStockpile.tsx` | A stack of logs at Musubi Station that fills toward `activationLevel` — the visible destination of the bears' haul. |
| `RegionWeather.tsx` | Active-territory ambient — pollen motes + green light over `regionAt === activeElement`. |

Wired into `WorldScene.tsx` alongside `Foliage` / `RegionMap` / `DaemonReact`.

## The loop the operator should *feel*

```
play wood card
  → activationLevel++  (substrate)
  → a sapling springs up in the grove           (impact_seedling beat)
  → the grove is now bigger — more trees stand
  → more bears are at work
  → you watch a bear seek a tree, chop, haul a log to Musubi Station
  → the stockpile at the station rises to match what the cards earned
```

The question at every step: **when you play the card, do you FEEL the world change?**

## Verify

- `:3000/battle-v2` — bears autonomously work the grove; playing a wood card
  grows a tree + thickens the colony; a bear's haul to Musubi Station is
  watchable; the wood territory drifts with pollen; raptor stoop + ritual still
  fire (regression).
- `npx tsc --noEmit` clean · `npx oxlint app/battle-v2` clean.

## Sets up (not built this session)

- **MeshyAI GLB swap** — bears + district props + structures. `modelSlot`
  registry takes one line per asset; the procedural billboard is the fallback.
- **Per-element weather signatures** — fire embers, water mist, metal shimmer,
  earth dust. `RegionWeather` is built element-generic; only wood is wired.
- **Global cosmic weather** — the real-world / cross-instance layer (D3).
