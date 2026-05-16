# Honeycomb Substrate

Use this when editing `lib/honeycomb/`, `lib/runtime/match.client.ts`, `lib/runtime/battle.client.ts`, or battle dev-console code that dispatches substrate commands.

## Room Contract

- Domain: deterministic card-battle substrate for `/battle` and `/battle-v2`.
- Goal: keep game rules, state transitions, and debug handles easy for parallel agents to find and extend.
- Allowed inputs: `lib/honeycomb/**`, `lib/runtime/runtime.ts`, `lib/runtime/*.client.ts`, `app/battle/_inspect/**`, focused tests under `lib/honeycomb/**`.
- Forbidden inputs: visual taste decisions in `app/battle/_scene/**` and `app/battle/_styles/**` unless the task is explicitly UI-facing.
- Exit condition: typed ports still compile, local tests cover changed phase/rule behavior, and `bash scripts/check-honeycomb-discipline.sh` passes.

## Boundary Map

- `cards.ts`, `wuxing.ts`, `conditions.ts`, `combos.ts`, `seed.ts`, `lineup.ts`, `battlefield-geometry.ts`, `curves.ts`, `whispers.ts`: pure domain vocabulary. Prefer adding here before teaching components new rules.
- `*.port.ts`: service interfaces and command/event/snapshot contracts. Adding a phase, command, event, or field here requires focused tests.
- `*.live.ts`: production adapters. Own Effect `Ref` and `PubSub` state, but do not import React, Next, app routes, chain SDKs, or backend clients.
- `*.mock.ts`: per-instance test adapters. Keep these cheap enough for agents to compose in focused tests.
- `match.reducer.ts`: synchronous deterministic match transitions. If a mutation does not need fibers, timers, runtime services, or async work, put it here.
- `match.live.ts`: async orchestration for lock-in, reveal fibers, clash timing, and phase transitions that require Effect services.
- `collection.seed.ts`: the only accepted Honeycomb runtime bridge. It is dev-gated fixture tooling, not a domain dependency.

## Service Ownership

| Service | Owns | Reads |
|---|---|---|
| `Battle` | legacy v1 selection/arrangement snapshot and events | cards, combos, conditions, curves, whispers |
| `Match` | full match lifecycle snapshot, event stream, reveal fiber | `Clash`, optional `Collection`, combos, companion/discovery |
| `Clash` | round resolution events and rule math | cards, combos, conditions, wuxing |
| `Opponent` | deterministic AI lineup policy | cards, combos, seed, wuxing |
| `Collection` | owned card store | cards, storage |

Prefer `Match` for `/battle-v2` lifecycle work. Treat `Battle` as the older selection/arrangement substrate unless the caller is already wired to `battle.client`.

## Change Rules

- Keep substrate changes out of scene/style files unless the request is explicitly about presentation.
- Route UI actions through `matchCommand` / `battleCommand`; do not mutate snapshots from components.
- Add new `MatchPhase` or `MatchCommand` values in `match.port.ts`, `match.reducer.ts` or `match.live.ts`, and the phase tests together.
- Keep dev-only mutation behind `dev:*` commands and the `__PURU_DEV__.enabled` gate.
- When adding a new Effect service, create the `port/live/mock` trio and wire the live layer once in `lib/runtime/runtime.ts`.

## Checks

```sh
bash scripts/check-honeycomb-discipline.sh
pnpm vitest run lib/honeycomb
pnpm typecheck
```
