---
session: 20
date: 2026-05-17
type: kickoff-build-doc
topic: card-lab + scene convergence + substrate cleanup
status: ready
mode: ARCH (OSTROM) + FEEL (ARTISAN) + janitorial pass
predecessor_sessions:
  - session 17 — zone-scene + realm-scene + wuxing substrate (lib/wuxing/, lib/hex/zone.ts, multi-VFX primitives)
  - session 18 — card-to-map choreography lab + lib/choreography/ + adjacent bug fixes (commit eba4299a)
  - simstim cycle-3 — fixture-ECS-instancing (parallel · BigRealmScene + InstancedTreeField · commits 2bc443f6 → bc4c7d6c)
operator_locked_decisions:
  convergence_unit: the card-lab's lock-in playback fires AGAINST a hex scene below the card UI — NOT two parallel surfaces
  scene_choice: composable · operator picks which scene (zone | realm | big-realm | hex) sits behind the cards
  paper_puppet_doctrine: still LOCKED — never 3D characters · all NPCs via PaperPuppet3D + sprite assets
  mountains_doctrine: still LOCKED — mountains are hex tiles within the landmass · perimeter ring was a sandbox toy
  card_visuals: Gumi-owned · DO NOT touch CardFace / CardStack / registry.json / layer art
  scope_of_session: convergence + cleanup · NOT new VFX content · NOT new card content
parallel_work:
  - simstim cycle-3 fixture-ECS sprint-3 is in flight on lib/engine/ — DO NOT touch lib/engine/ files (their territory)
  - HexScene.tsx may also be in their write surface — coordinate before edits there
references:
  - grimoires/loa/distillations/session-17-zone-scene-2026-05-17.md
  - grimoires/loa/distillations/session-18-card-choreography-2026-05-17.md
  - grimoires/loa/specs/enhance-card-to-map-choreography.md (session 18 spec)
  - lib/cards/battle/index.ts (MatchEngine + ClashEvent — the canonical event substrate)
  - app/battle-v2/_components/vfx/effects/CardLab.tsx (the lab composer)
  - app/battle-v2/_components/vfx/effects/{Zone,Realm,BigRealm}Scene.tsx (the candidate scenes)
---

# Session 20 — Card-Scene Convergence + Substrate Cleanup

> Two tracks running in this session: the **convergence** that brings
> card-lab and a hex scene together as ONE play surface, and the
> **janitorial pass** that promotes growing substrate into intentional
> shape. Codex runs the cleanup in parallel via a handoff prompt; the
> live operator drives convergence.

## Context

Session 18 shipped card-lab as an isolated effect — DOM hand rack + lock-in
+ sequential playback + typography + UltimateScreen, all over an empty
`<group />`. It works in isolation. Operator: *"In isolation it's okay
but together is where we start to converge."*

The convergence problem: when the player locks in and the sequence plays,
the action should ALSO play on a hex scene below the cards. The cards
choreograph the moment; the scene shows where the moment happens.

Beside that: substrate has been growing fast across sessions 14 → 17 → 18.
Many untracked files. Duplication between scene composers. A clean
janitorial pass (Codex's lane) earns the next 5 sessions of clean ground.

## Load order (read in this order)

| # | Path | Why |
|---|------|-----|
| 1 | `grimoires/loa/distillations/session-18-card-choreography-2026-05-17.md` | The card-lab substrate as it stands now · what's load-bearing |
| 2 | `app/battle-v2/_components/vfx/effects/CardLab.tsx` | The lab composer · this is the file the convergence work mostly touches |
| 3 | `app/battle-v2/_components/cardjuice/HandRack.tsx` | The hand rack · where lock-in fires + lineup state lives |
| 4 | `app/battle-v2/_components/vfx/effects/RealmScene.tsx` (or BigRealmScene) | The candidate scene to compose with · read its prop surface |
| 5 | `lib/cards/battle/index.ts` + `match-engine.live.ts` | The MatchEngine substrate · `ClashEvent` is the canonical play-event channel |
| 6 | `app/battle-v2/_components/cardjuice/UltimateScreen.tsx` + `HitText.tsx` | The DOM overlays · they portal via LabPortal · keep that pattern |

## Personas to load

- **OSTROM** (ARCH lens) — invariants, blast radius, schema thinking. Already in CLAUDE.md.
- **ALEXANDER** (craft lens) — for the per-card visual transitions, the per-zone hex-glow on play, the typography fit.
- **BARTH** (SHIP discipline) — V1 / V2 / cut named explicitly. The session must SHIP a working composed effect, not a half-done abstraction.

## What to build (in order)

### 1. New effect: `card-on-scene` (or extend `card-lab` with a scene picker)

**File:** `app/battle-v2/_components/vfx/effects/CardLab.tsx` (extend) OR new `CardOnSceneLab.tsx`

**Operator-pinned approach (recommended):** extend card-lab with a config knob `composedScene: "none" | "zone-scene" | "realm-scene" | "big-realm-scene" | "hex-scene"`. When non-`"none"`:
- The Canvas renders the chosen scene's 3D content (mounted at `<group />` slot)
- The DOM card-lab UI continues to portal above
- Lock-in fires propagate into the scene via a shared callback or event

Why a knob (not a separate effect): the card-lab IS the operator's iteration surface for the play-flow. Switching scenes underneath shouldn't require switching effects.

### 2. Scene-play event bridge

**File:** `app/battle-v2/_components/cardjuice/PlayEventBus.ts` (NEW)

The card-lab's playback orchestrator (in `CardLab.tsx`) emits per-card events:
- `card-promote` (fired when CardShowcase begins entry) — target zone hex
- `card-impact` (fired at hit-stop frame) — element + tier
- `card-settle` (fired at end of per-card phase)
- `lineup-finale` (fired before tide banner)

The chosen scene subscribes (via a context provider OR a shared store) and animates accordingly. Use `useSyncExternalStore` for SSR-safe sharing.

### 3. Per-zone hex-glow on play

**File:** Extend the chosen scene to consume the event bus.

When `card-impact` fires for element=wood, the wood zone's hex tiles pulse with a soft glow for 0.3s (use existing `ElementGlow` from RealmScene + intensity ramp). At full 5-chain, all five element zones glow simultaneously (ultimate moment).

Don't author NEW VFX content this session — reuse the substrate that exists (ZoneAmbientFor, ElementGlow, ShengFlow). The composition is the win.

### 4. Cleanup tracks (parallel — Codex's lane primarily)

See the Codex Janitor handoff prompt at `/tmp/codex-janitor-handoff.md`.

Live operator may interleave 1-2 small cleanups but the bulk lives with Codex.

## Design rules (Alexander)

- **The cards always stay on top.** The scene is the stage; the cards are the actors at the apron. No card element ever clips behind a 3D mesh.
- **The scene atmosphere drives the card's ambient backdrop.** When time-of-day is `night`, the card-lab backdrop (the canvas gradient) inherits that mood. Reuse `PHASE_PALETTE` from `lib/wuxing/timeOfDay.ts`.
- **Per-card scene reactions are SUBTLE.** A hex-glow pulse, not a particle explosion. The text moment is the climax; the scene reaction supports it.
- **The 5-chain ultimate reaches into the scene.** When `lineup-finale` fires, ALL 5 element zones light up before the tide banner. The map participates in the climax.
- **Typography tuning continues.** Refine `TYPOGRAPHY_TOKENS` against the new composed backdrop (visual contrast may shift).

## What NOT to build (Barth)

- NO new card visuals (Gumi-owned)
- NO new VFX primitives (substrate is rich enough · use what's there)
- NO ECS work (simstim's lane · don't touch `lib/engine/`)
- NO MatchEngine wiring beyond stub event bus (real match wiring is a future cycle)
- NO drag-to-region play wiring (Stage F+ work from session 18 · still future)
- NO character / paper-puppet placement on the scene (sub-cycle)

## Stage shape (loose · iterative)

| Stage | Goal | Duration |
|---|---|---|
| A | PlayEventBus + scene picker config | 30 min |
| B | Mount chosen scene in card-lab below the cards | 30 min |
| C | Wire `card-impact` → per-zone hex-glow | 45 min |
| D | Wire `lineup-finale` → all-zones-flash for ultimate | 30 min |
| E | Operator FEEL pair-point · iterate timings, hex-glow intensities, typography vs backdrop | 45 min |
| F | Distill — `session-20-convergence-2026-05-17.md` | 30 min |

Total: ~3.5h. The CLEANUP track (Codex) runs in parallel — operator dispatches the Codex prompt at session start.

## Verify

When card-lab is selected with `composedScene = "realm-scene"`:
- The 5-element pentagon renders below the cards
- Card 1 lock-in → wood zone glows on impact frame
- Card 2 → fire zone glows
- ...continue through all 5
- 5-chain ultimate → all five zones flash together + UltimateScreen takes over + tide banner closes

If FPS dips below 50 on M4: stop and profile. The substrate-ECS work (simstim's track) is supposed to keep BigRealmScene at 60+; if it doesn't, the cleanup pass has perf debt to surface.

## Open creative questions (pair-point at session start)

1. **Scene choice for first convergence:** zone-scene (2-side wood vs water) is the simplest · realm-scene (5-element pentagon) maps cleanly to the 5-card chain. Operator pick.
2. **Sheng-flow during chains:** the ShengFlow lines (realm-scene) already trace the generative cycle. When a 5-chain plays, should the lines pulse in card-order? Operator FEEL call.
3. **End-of-round banner accent:** tide banner currently always says "THE TIDE FAVORED WOOD". With real wuxing math: derive from which element scored highest. Lab can hardcode for now or accept a knob.

## References

| Topic | Path |
|---|---|
| This build doc | `grimoires/loa/specs/enhance-card-scene-convergence.md` |
| Session 18 spec | `grimoires/loa/specs/enhance-card-to-map-choreography.md` |
| Session 18 distill | `grimoires/loa/distillations/session-18-card-choreography-2026-05-17.md` |
| Card-lab composer | `app/battle-v2/_components/vfx/effects/CardLab.tsx` |
| Choreography substrate | `lib/choreography/` (6 modules) |
| Wuxing substrate | `lib/wuxing/` |
| Codex handoff | `/tmp/codex-janitor-handoff.md` (this session generates) |
| Run trail | `.run/compose/{RUN_ID}/orchestrator.jsonl` |
