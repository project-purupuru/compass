---
session: 20
date: 2026-05-17
type: cleanup-distillation
status: complete-with-deferred-lint
mode: TEND
scope: substrate hygiene parallel to card-lab x hex-scene convergence
---

# Session 20 Cleanup — Substrate Hygiene

## Substrate

The cleanup pass made three substrate surfaces articulate:

- `lib/scene/` now names the shared scene substrate: atmosphere, element ambient dispatch, and player-local phase selection.
- `lib/cards/bridge.ts` now owns the harness-card taxonomy to layer-card taxonomy bridge instead of hiding that contract inside `CardFace`.
- `lib/choreography`, `lib/hex`, and `lib/wuxing` index headers now state what each module is for and what it is not for.

Protected boundaries held:

- `lib/engine/` was not edited or staged by this pass.
- `lib/cards/layers/` and `public/art/cards/` were not edited.
- `/` and `/demo` were not edited.

## Application

Per-commit substrate gifts:

- `d0312fe3` — `chore(triage): classify untracked cleanup surface`
  - Gift: untracked files are classified without bundling operator-lane work.
- `55351a37` — `refactor(scene): promote shared atmosphere/elementAmbient/scenePhase to lib/scene`
  - Gift: three scene composers keep their visible behavior while shared scene logic has one home.
- `47636365` — `refactor(cards): promote CardDefinition to layer bridge`
  - Gift: `CardFace` renders through a named card-type/rarity bridge instead of local hidden maps.
- `f7ee8fb5` — `chore(archive): commit referenced effects after zero-orphan pass`
  - Gift: the orphan hunt found zero real orphans; referenced effect files are now committed and scan evidence is durable.
- `c1c7e616` — `docs(substrate): intention docstrings for lib choreography wuxing hex`
  - Gift: opening the substrate index files answers "what is this for?" in one sentence.
- `b9b9f782` — `chore(lint): fix cleanup-scope lint errors`
  - Gift: cleanup-scope lint/format/typecheck is clean; out-of-scope `.agents` oxlint errors are deferred with WHY.
- `41f6cd99` — `docs(distill): session 20 cleanup substrate hygiene`
  - Gift: the cleanup pass has a durable substrate/application/taste summary.
- `95414cc1` — `chore(triage): record live-drift cleanup defers`
  - Gift: live operator-lane files that appeared after target-1 triage are classified without crossing into `lib/engine/`.

Verification after each cleanup commit:

- `pnpm typecheck` passed.
- `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/battle-v2/vfx-lab` returned `200`.
- `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/battle-v2` returned `200`.
- `git status --short --untracked-files=all` was checked after commits; live operator-lane changes remained present and unstaged.

`pnpm check` status:

- Cleanup-scope files pass scoped `oxlint`, scoped `oxfmt --check`, and `pnpm typecheck`.
- Full `pnpm check` still fails at `oxlint` on `.agents/skills/bridgebuilder-review/resources/**`; deferred in `grimoires/loa/notes/cleanup-deferred-errors.md` because that is local agent tooling outside the compass app substrate lane.

## Taste

The pass favored explicit boundaries over abstraction for its own sake:

- Scene extraction removed duplication only where the repeated shape was real.
- Effect files were not archived without import evidence.
- Card bridge naming makes the taxonomy mismatch visible to future readers.
- Index docstrings state "IS / NOT" boundaries so the substrate teaches before the reader opens implementation files.

Left better than started: the cleanup did not erase live operator work, did not cross protected ownership lanes, and made the substrate more legible in the places a future engineer will look first.
