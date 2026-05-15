# Session 12 — Substrate Distill · 2026-05-14

> Operator directive (session close): *"after each session, we're actually
> distilling this into the Honeycomb substrate layer ... distill the core
> learnings into these substrate as we continue to navigate and better
> understand the key components."*
>
> Doctrine activated: [[agentic-cryptographically-verifiable-protocol]] +
> [[agentic-game-infrastructure]] + [[loa-as-acvp-infrastructure]] (via
> `/vault ACVP`). Honeycomb substrate pack reference:
> https://github.com/0xHoneyJar/construct-honeycomb-substrate

## TL;DR — the shape of today

Today was **taste-oriented** by the operator's own framing. Most outputs are
application-level tuning (FX dials, mist opacity, cloud counts, art-direction
language). Three things, however, ARE substrate-shaped — reusable across
any ACVP-application that builds a stylized 3D world surface — and belong
upstream in `construct-honeycomb-substrate/patterns/` once a second project
validates them.

Splitting the outputs honestly:

| Layer | Examples from today | Where it belongs |
|---|---|---|
| **Substrate** (cross-project, reusable shape) | Cluster-geometry primitive · presentation-tier-agents pattern · radial-fade-alphaMap atmospheric-layer pattern | upstream Honeycomb pack |
| **Application** (compass-cycle-1 only) | BearColony · GroveGrowth · WoodStockpile · CloudLayer · MistLayer · PostFX dials · the wood-grove juice loop | this worktree |
| **Taste** (tunable values, naming) | Cream `#f5e8c8` vs cream `#e8d8b6` · bloom luminanceThreshold 0.55 · saturation +0.2 · grain 0.045 | parametric in code |

The substrate work is small today. Be honest about that.

## What I read to ground this

| Source | What I extracted |
|---|---|
| `~/vault/wiki/concepts/agentic-cryptographically-verifiable-protocol.md` | 7-component checklist (Reality · Contracts · Schemas · State machines · Events · Hashes · Tests) + 7 cross-component invariants. Presentation-tier work inherits invariant #11 (must not mutate `GameState`). |
| `~/vault/wiki/concepts/agentic-game-infrastructure.md` | AGI as first named ACVP application. Compass-specific 7-component map. Shape-vs-scope rule: peer substrates don't unify shapes. |
| `~/vault/wiki/concepts/loa-as-acvp-infrastructure.md` | Meta-observation: framework has been shipping ACVP components for ~30 cycles without naming it. Today's distillations should follow that pattern — substrate-shaped outputs are quiet by default; promote on the second occurrence. |
| `0xHoneyJar/construct-honeycomb-substrate` README (via WebFetch) | Pack at `candidate` status, 2 validated cycles (2026-05-11 Structural, 2026-05-12 Positional). Promotion to `active` requires ≥3 distinct projects (at least one non-Next.js). Today's candidates wait. |
| `grimoires/loa/distillations/session-4-upstream-learnings-2026-05-11.md` + `kickoff-skill-improvement-spec-2026-05-11.md` | Existing distill shape — source-traced, gap-ranked, opinionated. Following this shape (compressed). |

## 3 candidate patterns from today

### Pattern A · Presentation-tier autonomous agents on substrate state

**One-line**: Make the world react to substrate changes via presentation-tier
autonomous agents that READ substrate state (and event stream) and write
nothing back.

**Compass instance** (this session): `BearColony` runs a steering-behavior +
FSM agent loop reading `state.zones.wood_grove.activationLevel` (substrate
truth, ACVP component #1) every frame. Bears pick trees, chop, haul,
deliver. They visibly populate-and-work the grove as a pure function of
substrate state. Zero substrate writes; zero ACVP-invariant violations.

**ACVP 7-component fit**:
- Reality (#1): agents READ canonical state via accessor (`state.zones[...]`)
- Events (#5): agents could subscribe to event stream for transition cues
  (Pattern is even cleaner when bears react to `ZoneActivated` rather than
  polling `activationLevel`)
- Invariant respected: PresentationMayMutateGameState = false. Agents have
  their own internal FSM state (`Bear.state`), but it lives in presentation
  tier — gone on reload, reconstructible from substrate state at any tick.

**Honeycomb pack fit**: New pattern doc — proposed name
`patterns/presentation-agents-on-substrate-state.md`. Sits beside
`domain-ports-live`. Status: **candidate** (compass only validates).

**Recipe shape (sketch)**:
```
agent {
  internal: { pos, vel, state, fsm-data }     // presentation-tier
  reads:    substrate-state | event-stream     // substrate (read-only)
  writes:   render-side handles               // never substrate
}
```

**Anti-pattern this guards against**: writing an agent that calls
`commandQueue.enqueue(...)` to mutate the world to "make it more alive."
That couples presentation to substrate and breaks the verifiable-replay
property.

### Pattern B · Cluster geometry as a rendering primitive (spherical-pivot normals)

**One-line**: Make N procedural blobs read as ONE organic volume by merging
their geometry into one `BufferGeometry` and replacing every vertex's normal
with a vector pointing from the cluster's pivot to that vertex.

**Compass instance**: `clusterGeometry.ts::buildPuffCluster(puffs, pivot)` —
used by `CloudLayer` (cumulus reads as one fluffy mass) and `GroveGrowth`
(tree canopies — leaves read as one mass). Without it: each blob shaded
like its own little planet, cluster fragments visually. With it: cluster
shades as one volume; faceted silhouette preserved by low subdivision count.

**Caveats discovered (worth carrying upstream)**:
- IcosahedronGeometry is NON-indexed — `geometry.index === null`. Naïve
  merge skips the `if (indAttr)` branch and produces an empty index list →
  invisible cluster. Synthesize sequential indices for non-indexed sources.
- `flatShading: true` discards the normal override. The trick REQUIRES
  smooth shading; the faceted look has to come from low subdivision count,
  not from `flatShading`.

**ACVP 7-component fit**: This is pure presentation-tier — not an ACVP
primitive. But: it composes cleanly with substrate work because it operates
on geometry only, not state.

**Honeycomb pack fit**: A reusable TS utility. Proposed:
`patterns/cluster-geometry-spherical-pivot.md` for the pattern doc, plus
optionally a shipped `utils/buildPuffCluster.ts` (small enough to copy-paste,
small enough to ship as a tiny module). Status: **candidate** (compass only).

### Pattern C · Atmospheric layer via noise + radial-fade alphaMap

**One-line**: Drifting noise-modulated atmospheric layers (mist, fog patches,
soft cloud cover) without shader-fog hacks: two stacked planes, seamlessly-
tileable noise as `map`, ONE shared non-tiling radial fade as `alphaMap`,
scroll the map's UV offset per frame.

**Compass instance**: `MistLayer.tsx` — two stacked horizontal planes at
y≈0.55 + 1.10, seamless integer-frequency-noise alpha texture (so
`RepeatWrapping` + UV scroll never shows a seam), `ClampToEdge` radial-fade
texture as `alphaMap` (so the plane's square footprint is invisible).

**Honeycomb pack fit**: A pattern doc for any R3F project that wants
atmospheric drift without shader fog. Proposed:
`patterns/atmospheric-layer-noise-radial-fade.md`. Status: **candidate**.

**Generic enough to ship now**: yes. The pattern is independent of element
(works for fire embers, water mist, golden dust, etc.) and only needs the
noise/fade textures swapped.

## What's NOT promotion-ready

For honesty's sake — things that look distillable but aren't yet:

- **PostFX dial values** (bloom 0.95 / threshold 0.55 / saturation 0.2 /
  etc.). Project-specific taste tuning. The PATTERN of "wire
  `@react-three/postprocessing` with a Ghibli-warm grade + `?fx=0` escape
  hatch" is a 5-line snippet, not a pack pattern.
- **The "memory of a sunset, not the physics of one" lens.** Already in
  vault doctrine ([[project_art-direction-north-star]]). Cross-project
  aesthetic philosophy, but it lives at vault level, not pack level — the
  pack is for STRUCTURAL doctrine (`domain/ports/live/mock`), not
  aesthetic doctrine.
- **The reference-grounding learning** (seed `/dig` with operator's
  references first). Process pattern. Lives in
  [[feedback_dig-latency-and-seeding]]. Not pack material.

## The METHOD (the operator's actual ask)

The operator's framing: *"have a method that allows us to kind of distill
the core learnings into these substrate as we continue to navigate."*

Proposed three-stage cadence:

### Stage 1 · Session close (per-session, every session)

Write a distill brief at
`grimoires/loa/distillations/session-{N}-substrate-distill-{date}.md`
(this file is the v0 instance). Required sections:

1. **TL;DR shape** — split outputs honestly into Substrate / Application /
   Taste tiers.
2. **Source trace** — what got read to ground the distillation. Include
   any vault doctrine activated.
3. **Candidate patterns** — N entries, each with: one-line · compass
   instance · ACVP 7-component fit · Honeycomb pack fit · status (always
   `candidate` from one project).
4. **NOT-promotion-ready** — honest list of things that look distillable
   but aren't (project-specific tuning, aesthetic doctrine that's vault
   not pack, process patterns).

### Stage 2 · Cross-session consolidation (weekly / per-cycle close)

When 2+ distill briefs propose the SAME pattern, write a candidate pattern
page at `grimoires/loa/distillations/candidate-pattern-{slug}.md`. This is
the bridge document — it's READY to lift upstream but waiting on the
≥3-project rule from the Honeycomb pack.

### Stage 3 · Pack promotion (when a second project validates)

When a NON-compass project (purupuru-game, sprawl, mibera, etc.) ships
its own use of the candidate pattern, lift the candidate-pattern doc into
`construct-honeycomb-substrate/patterns/<slug>.md`. Update the pack's
README cycle log with the 2-project validation. Status: still candidate
until a 3rd project validates (the pack's existing rule).

### Why this method matches the framework

The Honeycomb pack already encodes the cadence (cycle reports per
adoption · ≥3 projects to promote candidate→active). What's been MISSING
is the per-session capture step — without it, learnings evaporate between
sessions and don't accumulate to the cross-session consolidation stage.
Stage 1 is the gap fix.

The cadence also mirrors the vault concept
[[loa-as-acvp-infrastructure]] — the framework has been shipping ACVP
components for ~30 cycles without naming them. The same pattern operates
at pack level: substrate shapes emerge from concrete work, get named
quietly the second time, get promoted to doctrine the third time.

## Concrete next steps

If the operator wants this method live for the next session:

1. **Accept this brief as the v0 distill template.** Future agents follow
   this shape at session close.
2. **Add the Stage-1 step to Loa's `/crystallize` skill** OR to whatever
   skill closes a session. Currently `/crystallize` writes to
   `~/vault/sessions/`; the Stage-1 distill is COMPASS-LOCAL and is
   different in purpose (substrate-extraction vs episodic memory).
3. **When the next session ships substrate-shaped output**, write a
   second distill brief. When two briefs share a pattern, write the
   candidate-pattern bridge doc.
4. **First candidate patterns ready to bridge**: A (presentation agents),
   B (cluster geometry), C (atmospheric layer). They each need ONE
   non-compass project to validate before pack promotion is on the table.

## Cross-repo today (operator note)

Operator flagged today touched "multiple different repos and multiple
different Claude sessions, as well as Codex." This brief only captures
THIS session's outputs (compass-cycle-1 worktree, FEEL mode, art
direction + grove juice + post-processing). The cross-repo / cross-
session work happened in surfaces I don't have line-of-sight to. A
proper Stage-1 distill from those sessions would consolidate by topic;
that's the operator's call to either run another distill agent or to
hand-merge by topic.

## Status

**v0** of the session-distill template — first instance. Refine in place
when the method gets used a second time and a third.

The three candidate patterns (A · B · C) are **ready for the bridge
stage** the moment a second project validates any of them.
