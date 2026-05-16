---
session: playable-truth-hud-feel
date: 2026-05-14
type: kickoff
mode: feel
persona: ALEXANDER (construct-artisan)
posture: studio
status: planned
surface: battle-v2 (feat/purupuru-cycle-1 · worktree compass-cycle-1 · dev server :3000/battle-v2)
operator_role: creative director / decider — the proxy player in the selection loop
---

# Session — The Playable Truth + Game HUD (FEEL kickoff)

## What this session is

A **FEEL-mode Studio** under the ALEXANDER persona. Two intertwined surfaces:

1. **The playable truth** — the one ritual where you play a card and the world *answers*.
2. **The game HUD + camera** — the chrome, and the lens, that frame that ritual.

This is **not the full game**. It is one loop, made undeniable — then the HUD earns
its way in around it. Per the operator's director-mode shift: build the toy first,
promote what survives. Per ALEXANDER: the studio *builds* — it does not moodboard.
The artifact is the argument.

## The playable truth — from the operator's ChatGPT conversation (2026-05-14)

North star: **"make the world answer the player."** A player must never feel they
clicked a button. They placed a card into a living world, and the world answered back.

The one loop — the **Wood Miracle**:

> hover Wood card → card lifts, soft amber-leaf pulse → valid Wood Grove glows →
> commit → input soft-locks → petal arc travels card→grove → petals land on the
> seedling → seedling pulses, blooms → local sakura swirl → Kaori gestures → wood
> puruhani reacts → tide indicator pulses Wood → result reads → input unlocks →
> the player has a new meaningful choice.

The feel chain to protect: **intent → anticipation → commitment → travel → impact →
world reaction → daemon reaction → result → afterglow → next decision.**

The acceptance oracle is not test coverage — it is two tests:
- **The clarity test:** the player narrates it with no text — *"I played the green
  card. It went to the grove. The grove woke up. The creature reacted."*
- **The repeat test:** *do they want to do it again?* If yes, it is a game loop. If
  no, it is a beautiful interaction demo.

This is a **feel slice**, not a vertical slice. Emotional viability before production
viability.

## The HUD + camera — from the operator's reference (2026-05-14)

Reference: a warm, hand-painted top-down village-builder (screenshot, temp file
expired before save — operator may re-drop into `grimoires/loa/tracks/refs/`).
Observed HUD vocabulary:

- **Identity, top-left** — circular character portrait + place name ("Little Ivywood ·
  Small Village") + a small progress badge.
- **Resource rail, top-center** — a horizontal counter strip bracketed by purple
  end-caps; mixed icon+number counters (tools `+1`, food `7` `8` …).
- **Transient notification card** — "New residents have arrived…" with a `0:06`
  countdown bar. Appears, informs, expires.
- **Time controls, top-right** — pause / play / fast-forward × levels / settings.
  Time is *scrubbable* — the world has a clock the player conducts.
- **Contextual entity panel, right** — on selection: title + flavor line, worker
  slots, efficiency, two green→red gauge bars (Humidity / Soil Fertility), a
  production-chain row, action buttons. Rich, but *summoned by selection* — not
  always-on.
- **Action tray, bottom-center** — build/action icons + role tabs (Farmers / Workers
  / Nobles).
- **Frame** — decorative wood-grain chrome corners. The HUD is *furniture*, warm.
- **The world underneath** — ambient density: villagers walking, varied flora,
  dashed green path-outlines, a selected plot ringed in green.

The operator's note: **"the camera would zoom in as stuff happens in the world."**
The camera is a **FEEL instrument**, not a static frame — it leans in when the
ritual fires, and releases when input returns.

## ALEXANDER's discipline for this session

- **Structure → behavior → motion → material.** Settle the HUD layout and the loop's
  state machine before color or spring constants. Refuse to animate what is not yet
  composed.
- **Motion is physics.** Card lift, petal arc, seedling bloom, camera zoom — each gets
  mass / stiffness / damping, not an ease curve. Every motion answers: what mass
  moves, what force started it, what friction resists.
- **Every sequence needs an exit.** What starts the ritual, what owns it, what can
  interrupt it, *when input unlocks*, what happens if it fails. No beautiful
  deadlocks.
- **Emptiness is structural.** The interval between the resource rail and the world,
  between notification card and frame — Ma carries information. Negative space is
  load-bearing.
- **Sensory judgments must decompose.** "The grove should feel like it woke up"
  becomes a named glow delta + a spring + a stagger. If it can't be a token, it is
  not a decision yet.
- **Convergence is subtractive.** The reference is dense. Do not port all of it.
  Find the core — the loop — and let each HUD element earn its place.

## Anchors — name the skeleton before animating

Every magical moment needs an anchor (operator's ChatGPT convo · ALEXANDER's
structure-first). Name and place these before any choreography:

| Anchor | What it is |
|--------|------------|
| `CardCastOriginAnchor` | where the played card's energy launches (hand → world) |
| `WoodZoneImpactAnchor` | where the petal arc lands (the Wood Grove) |
| `SeedlingBloomAnchor` | the bloom focal point inside the zone |
| `DaemonReactionAnchor` | where the wood puruhani stands to react |
| `CameraFocusAnchor` | what the camera leans toward when the ritual fires |
| `HudConfirmAnchor` | where the result / tide pulse reads on the HUD |

## In scope / out of scope

**In:** the Wood card ritual choreography; the HUD shell (resource rail, contextual
entity panel, action tray, notification card, time controls); the camera
zoom-on-event behavior; the six anchors.

**Out:** the other four elements; full content (1 card, 1 zone, 1 daemon, 1 event —
everything else fake); substrate wiring (battle-v2 has no honeycomb substrate — that
is a later *promotion*, not this studio's problem); sound (its own feel slice later).

## Starting material

- `app/battle-v2/_components/` on `feat/purupuru-cycle-1` — worktree `compass-cycle-1`,
  dev server live at **:3000/battle-v2**:
  `WorldMap.tsx`, `WorldMap3D.tsx` (25KB — a 3D world foothold already exists),
  `ZoneToken.tsx`, `CardHandFan.tsx`, `CardFace.tsx`, `SequenceConsumer.tsx`,
  `UiScreen.tsx`, `BattleV2.tsx`, `battle-v2.css`.

## Decisions made in kickoff

1. **FEEL Studio, ALEXANDER persona.** Posture is Studio — but ALEXANDER's "artifact
   is the argument" means this studio *builds the toy*. Outputs are touchable
   battle-v2 changes + decomposable specs, not sketches.
2. **The loop is the unit, not the feature.** The job is the *one* Wood ritual + the
   HUD that frames it — not "implement the HUD," not "build battle-v2."
3. **Surface = battle-v2**, in the `compass-cycle-1` worktree. Substrate wiring
   deferred — build the toy, promote later.
4. **Camera is a FEEL instrument.** Zoom-on-event is a first-class motion problem,
   specced with physics — not a static frame.
5. **Anchors before animation.** Place the six anchors, *then* choreograph.
6. **Feel slice, not vertical slice.** The clarity test and the repeat test are the
   acceptance oracle.

## Next session entry point

```text
/feel   — FEEL mode · ALEXANDER
Surface: app/battle-v2/_components/  (worktree compass-cycle-1 · dev :3000/battle-v2)

Build order (operator's ChatGPT convo, sessions 1–6, collapsed):
  1. Interaction skeleton — hover card → target lights → commit → input lock →
     resolve → unlock. Ugly. Just the state machine + the exit.
  2. Card feel — hover lift + amber-leaf pulse + commit motion (springs, not eases).
  3. The arc — CardCastOriginAnchor → WoodZoneImpactAnchor, petal trail, timing.
  4. Impact — seedling pulse/bloom at SeedlingBloomAnchor + local sakura swirl.
  5. Daemon reaction — wood puruhani notices at DaemonReactionAnchor.
  6. HUD confirm + camera — tide pulse at HudConfirmAnchor, camera leans to
     CameraFocusAnchor and releases on input-unlock.

Each step: build the toy → touch it on :3000/battle-v2 → name what felt right in
tokens → promote. Keep everything else fake (deck, hand, event result, daemon AI,
weather). The question at every step: does the player want to do it again?
```
