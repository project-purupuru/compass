---
session: 17
date: 2026-05-17
type: kickoff
status: planned
pacing: iterative VFX (looser than substrate-step-by-step)
run_id: TBD-on-session-start
supersedes: session 16 (columnar-ecs-substrate) — operator-deferred, doc preserved as future-work
---

# Session 17 — Per-zone Elemental VFX · Wood + Water Cluster (kickoff)

## Scope

- 2 elements (wood + water) — canonical cycle-1 matchup
- Zone = cluster of 3-7 hex tiles (operator-pinned 5 as default)
- 4 new ambient VFX primitives (LeafSwirl, PollenMotes, Mist, RippleField) + Rain (existing) as trigger layer
- 1 new substrate piece: Zone primitive + canonical cluster layouts (lib/hex/zone.ts + zone-layouts.ts)
- 1 new lab composer: ZoneScene mounted via VfxRegistry as the "zone-scene" effect
- Two-layer trigger model: ambient always-on + tweakpane-button-triggered intensification (decays back over ~4s)

## Artifacts

- Build doc: `grimoires/loa/specs/enhance-zone-scene-elemental-vfx.md`
- Deferred ECS context (DO NOT EXECUTE): `grimoires/loa/specs/enhance-columnar-ecs-teaching-session.md`
- Substrate PRD reference: `grimoires/loa/specs/enhance-substrate-perf-and-engine.md`

## Prior session (this conversation, sessions 14-16)

Shipped: cel-vocabulary system + biome-decorator substrate + height-classified hex edge rendering + per-tile hue jitter + animated cel water + Rain particle primitive + PerfReadout panel + Hex debug overlay + substrate PRD + 2 k-hole digs (columnar ECS + three.quarks) + session-16 columnar ECS kickoff (now deferred).

Discovered:
- Multi-model adversarial review (FAGAN + GPT-5.5-pro) catches things solo review misses — FAGAN was confidently wrong on cliff wall winding; GPT-5.5 caught it via cross-product math. Disagreement is the tiebreaker signal.
- `hounfour.flatline_routing` was already enabled → gpt-review was already going through cheval (subscription path) not direct API. Confirmed via the `Routing through model-invoke (gpt-reviewer agent)` log line. Also added explicit `gpt_review.models.code: gpt-5.5-pro` block.
- Operator's 120fps + 1 draw call observation invalidated the perf-substrate panic. M4 heat = dev-mode overhead, not scene cost. Pushback validated. ECS work deferred (not killed).

## Decisions made (operator pair-point — both rounds locked)

Round 1 (Direction + Scope):
- ECS substrate: DEFERRED (keep doc, mark deferred)
- Zone = cluster of 3-7 hexes per element
- Scope = wood + water (cycle-1 matchup)
- Visual register = same cel-toon, color-shifted per element

Round 2 (Details):
- Wood signature = leaves swirling + canopy sway + pollen motes (ambient)
- Water signature = rain + mist + ripples (ambient)
- Trigger model = ambient always-on + intensified on card play (two-layer)
- Element interaction = visually adjacent only (defer clash mechanics)
- Route = extend /battle-v2/vfx-lab with new "zone-scene" effect

## Pacing reminder

Iterative VFX pacing — NOT substrate-step-by-step. Looser sprints:
- Stage A (substrate sketch): 30 min
- Stage B (wood ambient): 60 min
- Stage C (water ambient): 60 min
- Stage D (trigger layer): 45 min
- Stage E (composition + registry entry): 45 min
- Stage F (distillation): 30 min

Total: ~4.5h. Operator-pace welcome; pair-point at end of B and end of C to validate per-element feel before continuing.

## Open work bridging into this session

- `task #64` (instance the leaves) — PARKED with the deferred ECS work. Don't open this session.
- The 4 new VFX primitives + ZoneScene composer = the actual deliverable.

## Adjacent context worth knowing

- El Capitan's Five Oracles (CORONA/TREMOR/BREATH/DELUGE) integration is PRD step 9 — not this session, but the per-zone ambient state model HERE lays groundwork (each zone's ambient layer is the natural target for "real weather data fed into game").
- Sound is named as "after that" by the operator — not this session.
- The card-play trigger wiring (replacing the tweakpane button with real game-state events) is a future-session topic. The trigger model here is the substrate that wiring will use.
- "Strengthen VFX/environment substrate as we go" — each new primitive adds to the bespoke-VFX library future cycles will draw from. By session end: wood + water primitives ready; fire/earth/metal compose from same patterns next cycles.
