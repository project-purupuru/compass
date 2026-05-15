# Purupuru Substrate

Use this when editing `lib/purupuru/**`, `/battle-v2` command/event wiring, or the cycle-1 wood content pack.

## Room Contract

- Domain: cycle-1 playable truth substrate for `/battle-v2`.
- Goal: keep content contracts, game state, semantic events, and presentation sequencing easy for parallel agents to extend.
- Allowed inputs: `lib/purupuru/**`, `app/battle-v2/_components/**` when wiring commands/events, `app/battle-v2/_devtools/**`, and focused tests under `lib/purupuru/**`.
- Forbidden inputs: visual-only polish in `app/battle-v2/_styles/**` and 3D scene craft unless the task is explicitly FEEL/UI-facing.
- Exit condition: content validation passes, Purupuru tests cover changed behavior, and `bash scripts/check-purupuru-discipline.sh` passes.

## Boundary Map

- Shape: **peer substrate, different shape** per `construct-effect-substrate`. Purupuru is substrate-as-category, but not the Honeycomb/Effect shape: it uses subdir-as-type, a tiny typed event bus, pure resolver functions, injectable clocks, and explicit constructor deps.
- `contracts/types.ts`: advisory TypeScript runtime contracts. JSON schemas remain canonical for persisted content shape.
- `schemas/*.json`: persisted content contracts. Schema edits are high-blast-radius and need tests plus content validation.
- `content/loader.ts`: YAML discovery, AJV validation, and camelCase normalization from content files into runtime objects.
- `content/wood/*.yaml`: cycle-1 wood vertical content. Presentation sequences must keep `mutatesGameState: false`.
- `runtime/game-state.ts`: immutable state helpers. Add mutations here before hand-editing `GameState` in components.
- `runtime/command-queue.ts`: input-lock gate and accepted `PlayCard` queueing. It owns bus-side `CardCommitted` emission.
- `runtime/resolver.ts`: pure `(GameState, Command, ContentDatabase) -> ResolveResult`. It must not touch DOM, audio, React, or route state.
- `presentation/sequencer.ts`: read-only semantic-event consumer that schedules beats. It dramatizes substrate truth; it does not mutate `GameState`.
- `index.ts`: grep-friendly public registry for runtime/content surfaces.

## Substrate Checklist

| ACVP component | Local evidence |
|---|---|
| Reality | `runtime/game-state.ts` |
| Contracts | `contracts/types.ts` + `contracts/validation_rules.md` |
| Schemas | `schemas/*.schema.json` + `schemas/PROVENANCE.md` |
| State machines | `runtime/{ui,card,zone}-state-machine.ts` |
| Events | `runtime/event-bus.ts` + `SemanticEvent` union |
| Hashes | `schemas/PROVENANCE.md` source hashes |
| Tests | `__tests__/*.test.ts` |

This checklist is the baseline: a namespace can differ from Honeycomb's Effect shape only if all seven rows stay represented and tested.

## Change Rules

- `/battle-v2` components may hold local view state, but game truth should flow through `GameState`, `GameCommand`, and `SemanticEvent`.
- Do not import React, Next, app routes, chain SDKs, backend clients, or `lib/runtime/runtime.ts` into `lib/purupuru`.
- Do not emit `CardCommitted` from both queue and UI. Queue emits on accepted `PlayCard`; resolver includes it for replay-only callers.
- New content kinds require schema, loader inference, validation tests, and content pack examples together.
- New presentation beats read anchors/actors/UI/audio registries and return effects; they do not write substrate state.
- Runtime modules may import contracts and other runtime modules, not `presentation/`, `content/`, or `schemas/`.
- Content modules may import contracts/schemas, not runtime or presentation modules.
- Presentation modules may subscribe to `event-bus` and use `input-lock`, but must not import state mutation or resolver modules.

## Checks

```sh
pnpm substrate:check
bash scripts/check-purupuru-discipline.sh
bash scripts/check-world-discipline.sh
pnpm content:validate
pnpm vitest run lib/purupuru
pnpm typecheck
```
