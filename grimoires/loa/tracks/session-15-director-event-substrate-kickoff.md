---
session: 15
date: 2026-05-16
type: kickoff
status: planned
depends_on:
  - session 13 (substrate-graduation-utc) — preferred for tier-tagging
  - session 14 (vfx-lab) — VfxRegistry the VfxChannel consumes
convergence_target: "Director Effect service · unified event stream ·
  UI + VFX + Sound channels as composable Layers · code-only · sound noop"
---

# Session 15 — Director Event Substrate (kickoff)

## Scope

- Build the Director Effect service: PubSub-backed unified event stream,
  publish + subscribe + sequence API
- Build 3 channels as Effect Layers (UI · VFX · Sound) subscribing to Director
- SoundChannel is NOOP — ready for the-speakers to plug in when it ships
- VfxChannel routes to VfxRegistry from session 14 (stubs if session 14 hasn't shipped)
- Code-only authoring (no scrubber UI · operator deferred)
- Extend `lib/purupuru/presentation/sequencer` (BeatFireRecord ports forward)
- One demo sequence: cardPlayedSequence — UI pulse → VFX summon → Sound cue → combo check

## Artifacts

- Build doc: `grimoires/loa/specs/enhance-director-event-substrate.md`

## Decisions made (kickoff iteration converged)

| Decision | Choice | Why |
|---|---|---|
| Director shape | unified event stream (blockchain-style) | actions emit · director publishes · channels subscribe |
| Channel separation | composable subscribers per honeycomb doctrine | each medium lives on its own · listens · reacts |
| Timeline editor | CODE-ONLY v1 | scrubber unfamiliar / reference-only · bigger build · defer |
| Sound | noop hook interface | the-speakers not shipped yet · "substrate before implementation" |
| Schema layer | `@effect/schema` | one substrate · GameEvent is a TaggedUnion |
| Existing sequencer | EXTEND not replace | BeatFireRecord ports forward |

## Prior sessions

- Session 13 (substrate-graduation-utc) — graduation tier schema · may or may not have shipped before this · Director sequences can be tier-tagged when it lands
- Session 14 (vfx-lab) — VfxRegistry is what VfxChannel consumes · same: stubs work if 14 hasn't shipped

## Sub-agent dispatch plan (per pulled thread, interactive)

When operator wants research during session 15:
- Effect-TS PubSub + Stream + Layer patterns (k-hole teach-mode if uncertain)
- Blockchain event-bus prior art (k-hole if validating analogy)
- Music player at `/` route (read first, then research if needed)

All dispatches honor session 13 protocol: ≤5 PullThreads · operator scans
60s · picks 1 · /dig with next_query_seeds · doctrine lands tagged
`tier: silver`. Each dispatch declares its convergence_target.

## Reference repos / docs in session

- Effect docs: PubSub https://effect.website/docs/concurrency/pubsub ·
  Stream https://effect.website/docs/stream/introduction · Layer
  https://effect.website/docs/requirements-management/layers
- Existing sequencer: `lib/purupuru/presentation/sequencer.ts`
- Existing sequencer demo (FAKE_BEATS): `app/battle-v2/world-preview/page.tsx`
- The-speakers construct (future Sound integration): `.claude/constructs/packs/the-speakers/`
