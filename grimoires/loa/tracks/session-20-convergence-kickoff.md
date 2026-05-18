---
session: 20
date: 2026-05-17
type: kickoff
status: planned
parallel_work: simstim cycle-3 fixture-ECS-instancing (sprint-3 in flight on lib/engine/)
---

# Session 20 — Card-Scene Convergence + Substrate Cleanup (kickoff)

## Scope

- Compose card-lab + a hex scene (zone/realm/big-realm) as ONE play surface
- Wire a play-event bus so the lock-in sequence fires per-zone hex glows
- 5-chain ultimate reaches into the scene — all five element zones flash together
- Codex runs a parallel janitor pass on the codebase (separate prompt)
- Distill session 20 — what convergence shape lands, what still feels off

## Artifacts

- Build doc: `grimoires/loa/specs/enhance-card-scene-convergence.md`
- Codex handoff: `/tmp/codex-janitor-handoff.md`
- Run trail (substrate-detected): `.run/compose/{RUN_ID}/orchestrator.jsonl`

## Prior session

Session 18 (commit `eba4299a`) shipped card-lab as an isolated effect — DOM hand rack + sequential playback + typography moments + ultimate takeover. In parallel, simstim cycle-3 has been instancing fixture archetypes for BigRealmScene scale. The convergence brings them together.

## Decisions made

- **Convergence is composition, not new mechanics** — the cards + the scene are already substrates · wire the event bus + reuse `ElementGlow` and `ShengFlow` from realm-scene
- **Card-lab grows a scene picker** (config knob) rather than spawning a parallel effect — the operator's iteration surface stays unified
- **Gumi keeps the card art surface** — CardFace / CardStack / registry / layer compositions are not in this session's scope
- **Codex owns cleanup** — Janitor + Engineer/Architect persona · runs in parallel · operator dispatches at session start
- **No ECS work this session** — simstim owns `lib/engine/` · don't cross the lane
