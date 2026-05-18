---
session: 14
date: 2026-05-16
type: kickoff
status: planned
depends_on: session 13 (substrate-graduation-utc — k-hole teach protocol preferred but not strict prereq)
convergence_target: "/battle-v2/vfx-lab route with tree-fall + water-splashing tunable via tweakpane, @effect/schema configs, JSON presets, layering primitive"
---

# Session 14 — VFX Lab Sandbox (kickoff)

## Scope

- Sandbox-first VFX surface at `/battle-v2/vfx-lab` (NOT gameplay wiring — defer to session 15)
- 2 effects v1: tree-fall + water-splashing (cycle-1 wood vs water matchup)
- Configs via `@effect/schema` (NOT Zod — operator locked)
- Tweakpane already installed (v4.0.5 + plugin-essentials) · vanilla in useEffect
- Layering primitive included v1 (Composition · sequence/parallel/trigger-chain)
- K-hole teach-mode dispatches for inspiration research on indie VFX patterns

## Artifacts

- Build doc: `grimoires/loa/specs/enhance-vfx-lab.md`

## Decisions made (kickoff exploration loop, 1 iteration converged)

| Decision | Choice | Why |
|---|---|---|
| Sandbox vs gameplay first | SANDBOX | isolation · operator-research-driven · "converse on the same surface" |
| Tweakpane integration | vanilla in useEffect | already installed · no wrapper tax · focus on contracts |
| Schema layer | `@effect/schema` (NOT Zod) | consistent with Effect substrate game logic runs through |
| Effects v1 | tree-fall + water-splashing | cycle-1 wood vs water · environmental-on-the-map vision |
| Layering | composition primitive in v1 | "some effects need to be able to layer it" |
| Inspiration research | k-hole teach-mode dispatches | operator-driven via the protocol locked in session 13 |
| Environmental assets | parallel research track | MeshyAI/Blender OR @agent-design-engineer · mid-poly grainy aesthetic |

## Prior session (13 kickoff)

Session 13 substrate work hasn't run yet — graduation tier schema +
k-hole upgrade are in flight. Session 14 BENEFITS FROM but doesn't STRICTLY
DEPEND ON session 13: if vfx-lab ships first, configs stay as @effect/schema
without the graduation-tier wrapper; tier metadata can be added retroactively
when session 13 lands.

## Sub-agent dispatch plan (per pulled thread, interactive)

When operator wants inspiration research during session 14:
- Dispatch via k-hole teach-mode (the protocol from session 13)
- Subagent returns ≤5 PullThreads (per digestibility doctrine)
- Operator scans 60s · picks 1 · /dig with next_query_seeds
- Doctrine entry drafted with subagent · operator greenlights · lands in
  `.claude/constructs/packs/vfx-playbook/doctrine/` tagged `tier: silver`
- After 3-4 iterations without landing → reset, target was wrong

## Reference repos / docs in session

- Tweakpane docs https://tweakpane.github.io/docs/
- Effect-TS schema https://effect.website/docs/schema/introduction
- `app/battle-v2/motion-lab/` (3-pane precedent)
- `app/battle-v2/puppet-3d/` (r3f Canvas + warm Ghibli lighting precedent)
- Existing `app/battle-v2/_components/vfx/` (DON'T touch · vfx-lab builds alongside)
