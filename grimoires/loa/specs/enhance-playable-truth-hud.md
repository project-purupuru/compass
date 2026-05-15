# Session 7 — The Playable Truth + Game HUD

> *A card leaves your hand and the world leans in to receive it.*

> **Mode**: FEEL (ALEXANDER) · structural spine by ARCH (OSTROM) · scope by BARTH
> **Date**: 2026-05-14
> **Target**: `app/battle-v2/` — worktree `compass-cycle-1` (`feat/purupuru-cycle-1`) · dev server `:3000/battle-v2`
> **Kind**: merged ARCH + build doc (one MD is the source of truth)

---

## Context

battle-v2 already has a **real, wired game loop** — hover a card, arm it, click a zone, a `PlayCard` command runs through the resolver, `GameState` advances, semantic events flow on the event-bus. What it does **not** have is the *answer*: the world does almost nothing visible when you play. The sequencer fires beats into the void because the presentation anchors (`anchor.hand.card.center`, `anchor.wood_grove.seedling_center`, `anchor.wood_grove.daemon.primary`, …) are registered as **synthetic IDs with no refs bound** (`SequenceConsumer.tsx:56-62`).

This session builds **the playable truth** — the one ritual where you play the Wood card and the world answers back — by binding those anchors and routing sequencer beats to new presentation components. Plus the **camera as a FEEL instrument** (it is locked today) and the first slice of **game HUD**.

It is a FEEL-mode Studio. Per ALEXANDER: the studio *builds the toy* — it does not moodboard. Per the operator's director-mode shift: build the toy first, promote what survives. The acceptance oracle is not test coverage — it is the **clarity test** (the player narrates the loop with no text) and the **repeat test** (*do they want to do it again*).

---

## Invariants (OSTROM — what must not change)

1. **The sim/presentation separation is load-bearing.** `lib/purupuru/runtime/` — command-queue, resolver, event-bus, game-state, input-lock — is REAL, WIRED, and **off-limits**. The FEEL session lives entirely in `app/battle-v2/_components/` + `app/battle-v2/_styles/battle-v2.css` + binding the already-registered anchors.
2. **The event-bus is the only truth channel.** Presentation *consumes* semantic events and sequencer beats. It **never** mutates `GameState`. If an effect "needs" to change state, route it through a command or read it off an event — never a direct mutation.
3. **The anchor registry is the binding contract.** Effects originate and land at *named anchors*, never hardcoded coordinates. New anchors get registered; they are not invented inline.
4. **OKLCH palette + the `cubic-bezier(0.34,1.56,0.64,1)` overshoot easing** are the existing material vocabulary (`battle-v2.css:7-14,186`). Extend them; do not fork them.
5. **3D (`WorldMap3D`) is the committed world surface.** The CSS `WorldMap` is the 2D fallback for comparison only.

**What breaks if wrong:** if the session reaches into `lib/purupuru/runtime/` to "make the effect fire," the separation that makes every `_components/` file a disposable skin is gone — and the loop's rules become vibe-coded. The fix is always: a beat, or an event — never a state mutation.

---

## Blast Radius (OSTROM)

| Artifact | Change | Risk |
|----------|--------|------|
| `app/battle-v2/_components/anchors/useAnchorBinding.ts` | **NEW** — hook: binds a React/R3F ref to a registered anchor ID, resolves `{x,y,z}` / screen coords | zero (new) |
| `app/battle-v2/_components/vfx/PetalArc.tsx` | **NEW** — card→zone travel VFX, beat-driven | zero (new) |
| `app/battle-v2/_components/vfx/ZoneBloom.tsx` | **NEW** — the world answering: seedling pulse + sakura swirl | zero (new) |
| `app/battle-v2/_components/vfx/DaemonReact.tsx` | **NEW** — Kaori / wood-puruhani reaction, beat-driven | zero (new) |
| `app/battle-v2/_components/hud/RewardRead.tsx` | **NEW** — the result, in the `ui.reward_preview` mount | zero (new) |
| `app/battle-v2/_components/world/CameraRig.tsx` | **NEW** — camera lean/release rig (replaces the locked OrbitControls) | low — isolated to `WorldMap3D` |
| `app/battle-v2/_components/hud/TideIndicator.tsx` + `EntityPanel.tsx` | **NEW** — first HUD slice | zero (new) |
| `app/battle-v2/_components/SequenceConsumer.tsx` | **MODIFIED** — wire the unused `onBeatFired` callback (`:36`); bind real anchors instead of synthetic placeholders (`:56-62`) | medium — the keystone seam |
| `app/battle-v2/_components/WorldMap3D.tsx` | **MODIFIED** — mount `CameraRig`; register `ZoneToken3D` meshes + Kaori as anchor refs | medium — core world file |
| `app/battle-v2/_components/CardHandFan.tsx` | **MODIFIED** — register the armed card slot as `anchor.hand.card.center` | low |
| `app/battle-v2/_components/UiScreen.tsx` + `BattleV2.tsx` | **MODIFIED** — new HUD slots; pass `onBeatFired` through | low |
| `app/battle-v2/_styles/battle-v2.css` | **MODIFIED** — named spring tokens, VFX keyframes | low |
| `lib/purupuru/**` | **UNTOUCHED** | — (invariant 1) |

---

## Data Architecture — the keystone seam

```
PlayCard command → resolver → GameState advances → semanticEvents → event-bus
                                                                      │
                                          ┌───────────────────────────┤
                                          ▼                           ▼
                                   Sequencer (fires beats)      BattleV2 setState
                                          │                     (UI re-renders)
                                  onBeatFired(beat)  ◄── THE WIRE (SequenceConsumer:36)
                                          │
                          ┌───────────────┼───────────────┬──────────────┐
                          ▼               ▼               ▼              ▼
                     PetalArc        ZoneBloom       DaemonReact     CameraRig
                          │               │               │              │
                          └──────── all resolve positions via ────────────┘
                                      AnchorRegistry  (useAnchorBinding)
```

The sequencer already exists and already fires the `wood_activation_sequence` beats. **The two missing wires:** (1) `onBeatFired` is never passed a handler — battle-v2 ignores beats; (2) the anchors are synthetic — effects have nowhere to land. Bind both and the world answers.

---

## Component Specifications (ALEXANDER)

### `PetalArc` — the travel (intent made visible)
- **Material**: ~7 petals tinted `--wood-glow` `oklch(0.82 0.14 85)`. This exact glow appears *only* here, mid-flight — it means "energy in transit."
- **Motion**: a *thrown object*, not an ease. Spring `mass 0.6 · stiffness 220 · damping 18`. Travels `anchor.hand.card.center → anchor.wood_grove.petal_column` along a bezier that rises then falls — gravity is felt.
- **Rhythm**: petals stagger ~40ms — a trail, not a clump.
- **Timing**: ~480ms travel. Name the token `--arc-travel: 480ms`.

### `ZoneBloom` — the impact (the world answering — THE moment)
- **Motion**: a ~80ms **hit-stop** when the petals land — the world *catches* them — then the seedling springs `scale 0.97 → 1.06 → settle` (`mass 1.2 · stiffness 180 · damping 14`, the existing overshoot feel). Heavy: the world is big.
- **Material**: peaks at `--wood-vivid`, settles to a steady glow. A local sakura swirl radiates from `anchor.wood_grove.seedling_center`.
- **The Void**: ~400ms of stillness *after* the bloom, before the daemon reacts. The pause is the impact registering. Ma is load-bearing.

### `CameraRig` — the lens (the operator's core ask)
- **Behavior**: on `beat: commit`, begin a lean toward `CameraFocusAnchor` (the played zone) — Z distance −20%, lookAt eased onto the zone. Fully leaned by `beat: bloom`. On `input-unlock`, release to the resting top-down 3/4.
- **Motion**: the camera has **mass**. `mass 2.0 · stiffness 120 · damping 26` — it *glides*, never snaps. A snapping camera reads as a cut; a gliding camera reads as *attention*.
- Replaces the disabled OrbitControls (`WorldMap3D.tsx:575`) with a tween rig.

### `DaemonReact` — the world is inhabited
- Kaori chibi already exists as a billboard (`WorldMap3D.tsx:213`). On `beat: daemon.react`, intensify the `Float` bob + a small rotation toward the bloom. Spring, light: `mass 0.4 · stiffness 300 · damping 20` — a creature notices quickly. Real GLB expression is V2.

### `TideIndicator` + `EntityPanel` (HUD — first slice)
- **TideIndicator**: `activeElement` as a *felt presence* — a stone badge that breathes at the element's rhythm, not a text label.
- **EntityPanel**: summoned by selection (zone-select or card-arm), right-side. Identity + flavor + state. **Emptiness is structural** — it is not always-on. Felt-state over raw numerals where possible (burn-rite NFR-2 lineage).
- **Material**: warm wood-frame chrome; monospace `tabular-nums` for any numerals, ticking not fading.

---

## Shipping Scope (BARTH)

### V1 — ship now (the finish line: *a player plays the Wood card and wants to do it again*)
- `useAnchorBinding` + the `onBeatFired` wire — the keystone.
- The 5 ritual beats rendered: card lift (formalize the existing CSS), `PetalArc`, `ZoneBloom`, `DaemonReact`, `RewardRead`.
- `CameraRig` — lean on commit, release on unlock.
- HUD: **only** `TideIndicator` + `EntityPanel`-on-select.

### V2 — after feedback
- Full HUD chrome: resource rail, transient notification cards, scrubbable time controls, role tabs (the village-sim reference is the V2+ north star).
- The other 4 elements; sound; the daemon's real GLB animation.

### Cut from V1 (BARTH says NO — "while I'm at it" is banned)
- The resource rail, notification cards, time controls, role tabs — all V2.
- Sound — its own feel slice.
- Multi-element — V1 is Wood only.
- The event-log `<details>` panel stays a hidden debug tool, never player-facing.

---

## Load Order

1. `grimoires/loa/tracks/session-7-playable-truth-hud-kickoff.md` — the session track (continuity).
2. **This doc** — the source of truth.
3. `app/battle-v2/_components/SequenceConsumer.tsx` — the keystone seam (`:36` unused callback, `:56-62` synthetic anchors).
4. `app/battle-v2/_components/BattleV2.tsx` — the orchestrator; how state + bus + sequencer wire.
5. `app/battle-v2/_components/WorldMap3D.tsx` — the R3F world; zones, Kaori, lighting, the locked camera.
6. `app/battle-v2/_styles/battle-v2.css` — the OKLCH palette + overshoot easing to extend.
7. `lib/purupuru/presentation/sequencer` — the beat engine (read-only — understand it, don't touch it).

## Persona

FEEL mode — **ALEXANDER** (`.claude/constructs/packs/artisan/identity/ALEXANDER.md`). Structural spine from **OSTROM** when touching the seam. Scope from **BARTH**.

## What to Build (in order — dependency-ordered)

1. **`useAnchorBinding` + bind the real anchors.** Nothing else works without it. A hook that takes an anchor ID, accepts a ref (DOM or R3F mesh), and registers `{x,y,z}` / screen coords into the existing `AnchorRegistry`. Replace the synthetic placeholders in `SequenceConsumer.tsx:56-62` with real bindings: card slot → `anchor.hand.card.center`, `ZoneToken3D` wood mesh → `anchor.wood_grove.seedling_center`, Kaori → `anchor.wood_grove.daemon.primary`.
2. **Wire `onBeatFired`.** Pass a handler from `BattleV2` through `SequenceConsumer` (`:36`) so the app knows which beat is live. Conditionally render VFX components keyed to beat IDs.
3. **`PetalArc`** — beat `arc.fire`. The travel. (ChatGPT-convo build step 3.)
4. **`ZoneBloom`** — beat `zone.bloom`. The world answering. The hit-stop + the Void. (Build step 4.)
5. **`DaemonReact`** — beat `daemon.react`. (Build step 5.)
6. **`CameraRig`** — beats `commit` → `bloom` → `input-unlock`. The operator's core ask. (Build step 6.)
7. **`RewardRead`** — consume `CardCommitted` / reward event into the `ui.reward_preview` mount.
8. **`TideIndicator` + `EntityPanel`** — the first HUD slice. Last, because the ritual is the unit.

Each step: build the toy → touch it on `:3000/battle-v2` → name what felt right *in tokens* → promote. Keep everything else fake.

## Design Rules (ALEXANDER — actionable)

- **Springs, not eases.** Every motion gets `mass · stiffness · damping` named in `battle-v2.css` as a token. No new bare `cubic-bezier` or `ease-in-out`.
- **Structure → behavior → motion → material.** Bind anchors and wire beats (structure) before animating anything (motion). Refuse to animate what is not composed.
- **Every sequence needs an exit.** Each beat-driven component answers: what beat starts it, what owns it, what interrupts it, *when input unlocks*, what if it fails. No beautiful deadlocks.
- **Color is information.** `--wood-glow` means energy-in-transit and appears *only* in `PetalArc`. `--wood-vivid` is the bloom peak. If a thing is colored, it means something.
- **The Void is structural.** The ~400ms stillness after the bloom is specified, not incidental. Negative space carries the impact.
- **Numerals tick, never fade.** Any HUD number: monospace, `tabular-nums`.
- **The artifact is the argument.** Build it on `:3000/battle-v2` and touch it. Do not debate the arc in prose.

## What NOT to Build

- Anything in `lib/purupuru/runtime/` — invariant 1.
- The full HUD (resource rail, notifications, time controls, role tabs) — V2.
- Sound, the other 4 elements, the daemon's GLB — V2.
- New game logic, new commands, new events — the loop's *rules* are done; this is the *answer*, not the rules.
- A free-orbit camera — `CameraRig` is a tween rig, not OrbitControls.

## Verify

- `:3000/battle-v2` — play the Wood card. The petals travel, the grove blooms, the camera leans, the daemon notices, the result reads, input returns. The **clarity test**: narrate it with no text. The **repeat test**: do you want to do it again?
- `cd compass-cycle-1 && npx tsc --noEmit` — exit 0.
- `npx oxlint app/battle-v2` — 0 errors.
- No new imports from `lib/purupuru/runtime/` in any `_components/` file (invariant 1 — grep to confirm).

## Key References

| Topic | Path |
|-------|------|
| Keystone seam (unused callback, synthetic anchors) | `app/battle-v2/_components/SequenceConsumer.tsx:36,56-62` |
| The orchestrator (state + bus + sequencer wiring) | `app/battle-v2/_components/BattleV2.tsx` |
| The 3D world + the locked camera | `app/battle-v2/_components/WorldMap3D.tsx:493-500,575` |
| Material vocabulary (OKLCH + overshoot easing) | `app/battle-v2/_styles/battle-v2.css:7-14,186` |
| The beat engine (read-only) | `lib/purupuru/presentation/sequencer` |
| Card hover/arm states (already wired) | `app/battle-v2/_styles/battle-v2.css:348-358` |
| FEEL persona | `.claude/constructs/packs/artisan/identity/ALEXANDER.md` |
| The playable-truth source (operator's ChatGPT convo, distilled) | this doc + `grimoires/loa/tracks/session-7-playable-truth-hud-kickoff.md` |
</content>
