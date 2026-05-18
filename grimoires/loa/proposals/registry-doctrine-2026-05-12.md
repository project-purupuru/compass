---
status: draft-r0
type: doctrine + structural reform brief
author: claude (Opus 4.7 1M)
created: 2026-05-12
cycle: battle-foundations-2026-05-12 (post-PR /remote-control session)
trigger: operator: "ai creates too many sources of truth in an app. so i've been making centralised registries. if something wants to do a new mutation to the state it needs to register, otherwise an unregistered mutation will crash. defensive patterns help ai. … the structure of the app needs ways for it to programmatically track all of the sources in a reliable way. … as a bonus, you can have your agent create a custom eslint rule that enforces this rule"
companions: foundation-vfx-camera-audio-2026-05-12.md, audio-doctrine.md, composable-vfx-vocabulary.md
ground: honeycomb substrate (effect-substrate construct) — Effect.TS + ECS + hexagonal pattern
---

# Registry Doctrine — Defensive Structure for AI Co-Development

## The thesis

> AI agents create too many sources of truth.

Every PR adds a Map, a Record, a side-channel array, a setState that bypasses the reducer, a lookup table inlined in a component. Each is harmless on its own. Aggregated, they form a fog where the agent — even *this* agent — can no longer answer "where does X live?" with confidence.

The honeycomb substrate already prescribes a discipline: **Effect.TS effects are the only mutation channel**, **the reducer is pure**, **commands carry intent**. But the substrate doctrine is silent on a class of mutations that don't go through the reducer:

- registries (sound list, vfx kit list, card definitions, conditions)
- runtime singletons (cameraEngine, vfxScheduler, audioEngine)
- side-channel buffers (extras stream, kaironic dial state)
- localStorage-mirrored config (juiceProfile overrides, audio volumes)

These are NOT substrate state — they are **engine state**. The substrate doesn't constrain them. So they multiply.

## The reform

Extend the honeycomb substrate with a fourth layer: the **Registry Plane**.

```text
Honeycomb substrate (existing)
  ┌────────────────────────────────────────────────┐
  │  P1 · Contract       (effect ports, schemas)   │
  │  P2 · Construct      (reducer, commands)       │
  │  P3 · Execution      (Effect runtime, sinks)   │
  │  P4 · REGISTRY       ◄── NEW                   │
  │       (engines, singletons, side-channels,     │
  │        runtime config — all named, all         │
  │        crash-on-unregistered)                  │
  └────────────────────────────────────────────────┘
```

Every engine, every shared mutable, every "where does X live" answer routes through the Registry Plane. Adding a new mutable to the codebase REQUIRES registering it. An unregistered mutation throws at boot.

This is the **defensive pattern** for AI co-development that the operator's source quotes are pointing at.

## The Registry Of Registries

A single canonical location: `lib/registry/index.ts`. It is the **only file whose job is to know what registries exist**. Every consumer reads from `registry.<name>()` and never imports from the registry's source file directly. This is the moral equivalent of an `inversify` container or a `service-locator` — but without the runtime DI cost, since we resolve at construction.

```ts
// lib/registry/index.ts
import { audioEngine } from "@/lib/audio/engine";
import { vfxScheduler } from "@/lib/vfx/scheduler";
import { cameraEngine } from "@/lib/camera/parallax-engine";
import { SOUND_REGISTRY } from "@/lib/audio/registry";
import { ELEMENT_VFX } from "@/lib/vfx/clash-particles";
import { CARD_DEFINITIONS } from "@/lib/honeycomb/cards";
import { CONDITIONS } from "@/lib/honeycomb/conditions";
import { COMBO_META } from "@/lib/honeycomb/discovery";
import { POLICIES } from "@/lib/honeycomb/opponent.port";
import { SHENG, KE, ELEMENT_META } from "@/lib/honeycomb/wuxing";

export const registry = {
  // Singleton ENGINES (mutable runtime state, RAF/audio context owners)
  audio: audioEngine,
  vfx: vfxScheduler,
  camera: cameraEngine,

  // Static REGISTRIES (immutable lookups by key)
  sounds: SOUND_REGISTRY,
  elementVfx: ELEMENT_VFX,
  cards: CARD_DEFINITIONS,
  conditions: CONDITIONS,
  combos: COMBO_META,
  policies: POLICIES,
  sheng: SHENG,
  ke: KE,
  elementMeta: ELEMENT_META,
} as const;

export type RegistryKey = keyof typeof registry;
```

Three properties this gets us:

1. **Discoverability** — every registry is one Cmd-click away from a single file.
2. **Audit-by-grep** — `grep -r "from \"@/lib/registry\"" lib app` lists every dependency on shared engine state. Anything missing from this grep that mutates shared state is *prima facie* suspect.
3. **AI grounding** — when the agent (or future agent) asks "what registries exist?" the answer is one Read of one file.

## The Mutation Registry

Static lookup registries are easy: `Record<K, V>` literals are already type-safe and exhaustive. The harder case is **mutable runtime state with multiple writers**.

The substrate's `MatchSnapshot` is already protected — the only writer is `match.reducer.ts:reduce()`, which dispatches by command tag. There is no AI-codegen-survivable way to bypass it (closure-captured emitter pattern + readonly snapshot type).

But other mutables exist:
- `lib/activity/index.ts` — `extras: ActivityEvent[]` is a module-level array with `extras.push(...)` callable from anywhere
- `engine.config` objects on the new engines — operator-mutable via Tweakpane, but also accidentally mutable from anywhere that imports the singleton
- `localStorage` — anyone can call `setItem` with any key

For each: introduce a **MutationContract**.

```ts
// lib/registry/mutation-contract.ts
export interface MutationContract<TState, TInput> {
  readonly name: string;
  readonly description: string;
  readonly validate?: (input: TInput) => true | string; // error msg on false
  readonly apply: (state: TState, input: TInput) => TState;
}

export class MutationGuard<TState> {
  private contracts = new Map<string, MutationContract<TState, unknown>>();
  private state: TState;
  private listeners = new Set<(s: TState) => void>();

  constructor(initial: TState) {
    this.state = initial;
  }

  register<TInput>(c: MutationContract<TState, TInput>): void {
    if (this.contracts.has(c.name)) {
      throw new Error(`Mutation "${c.name}" already registered`);
    }
    this.contracts.set(c.name, c as MutationContract<TState, unknown>);
  }

  apply<TInput>(name: string, input: TInput): TState {
    const c = this.contracts.get(name);
    if (!c) {
      throw new Error(
        `Unregistered mutation "${name}". Register a MutationContract first.`,
      );
    }
    if (c.validate) {
      const result = c.validate(input);
      if (result !== true) throw new Error(`Mutation "${name}" rejected: ${result}`);
    }
    this.state = c.apply(this.state, input);
    for (const fn of this.listeners) fn(this.state);
    return this.state;
  }

  read(): Readonly<TState> {
    return this.state;
  }

  subscribe(fn: (s: TState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
```

Pattern of use, applied to the activity stream:

```ts
// lib/activity/registry.ts
import { MutationGuard } from "@/lib/registry/mutation-contract";

const activityGuard = new MutationGuard<ActivityEvent[]>([]);

activityGuard.register({
  name: "activity.append",
  description: "Append a single activity event",
  validate: (e: ActivityEvent) => (e.kind ? true : "missing kind"),
  apply: (state, e) => [...state, e],
});

activityGuard.register({
  name: "activity.seed",
  description: "Seed the stream with synthetic events for testing",
  apply: (_state, events: ActivityEvent[]) => [...events],
});

export const activity = {
  append: (e: ActivityEvent) => activityGuard.apply("activity.append", e),
  seed: (es: ActivityEvent[]) => activityGuard.apply("activity.seed", es),
  read: () => activityGuard.read(),
  subscribe: (fn: (s: ActivityEvent[]) => void) => activityGuard.subscribe(fn),
};

// Direct .push(...) on activity is now impossible — the array isn't exported.
```

The agent (this one or a future one) cannot accidentally `extras.push(...)` because `extras` is closure-captured inside `MutationGuard`. Only the registered mutations can change state. **This is the "register-or-crash" the operator asked for.**

## ESLint enforcement

A custom ESLint rule that ensures defensive structure cannot be silently bypassed.

```js
// eslint-rules/no-unregistered-mutation.js
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid direct .push() on imported state buffers. Route through the registry.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedFiles: { type: "array", items: { type: "string" } },
          forbiddenIdentifiers: { type: "array", items: { type: "string" } },
        },
      },
    ],
  },
  create(context) {
    const opts = context.options[0] ?? {};
    const allowed = new Set(opts.allowedFiles ?? []);
    const forbidden = new Set(
      opts.forbiddenIdentifiers ?? [
        "extras", // lib/activity buffer
        "SOUND_REGISTRY", // append directly forbidden
        "ELEMENT_VFX",
      ],
    );
    const filename = context.getFilename();
    if ([...allowed].some((p) => filename.includes(p))) return {};
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression") return;
        if (callee.property.name !== "push" && callee.property.name !== "splice")
          return;
        const obj = callee.object;
        if (obj.type !== "Identifier") return;
        if (forbidden.has(obj.name)) {
          context.report({
            node,
            message: `Direct .${callee.property.name}() on registered identifier "${obj.name}" is forbidden — route through the registry.`,
          });
        }
      },
    };
  },
};
```

A second rule prevents *new* registries from being introduced outside `lib/registry/*`:

```js
// eslint-rules/no-stray-registry.js
// Flags top-level `export const FOO_REGISTRY = ...` outside lib/registry/.
// Forces every new registry to be added to the canonical index.
```

Both rules attach to `eslint.config.js` with the project's existing flat config.

## Honeycomb-substrate alignment

This doctrine **extends** the substrate, doesn't replace it:

| Layer | Owns | Mutation channel | What this doctrine adds |
|---|---|---|---|
| P1 Contract | port interfaces, schema | (immutable) | — |
| P2 Construct | reducer, command catalog | `reduce(snap, cmd)` | — |
| P3 Execution | Effect runtime, sinks | runtime layer composition | — |
| P4 Registry (NEW) | engines, lookups, side-channels | MutationGuard.apply or registered factories | the whole brief above |

The substrate already gave us a single mutation channel for the *match*. The Registry Plane gives us a single mutation channel for *everything else that mutates*. Same shape, different domain — exactly what the substrate doctrine prescribes.

## What this fixes about the no-friction points

Operator's friction-points this session, mapped to registry-doctrine fixes:

| Pain | Cause | Fixed by |
|---|---|---|
| "really bad mix of effects" | 4 systems firing without coordinator | VFX scheduler is a registry of admitted effects |
| "tweakpane crashes silently on tab switch" | per-instance plugin registration leaked module state | per-pane explicit registration enforced by makePane() doc |
| "Pixi water never showed" | Two renderers requested same family with cap=1, race | Per-element renderer config = registry of routes |
| "parallax saw-tooth" | CSS transition + JS LERP both writing | Camera engine is the registered single-writer |
| "static lines instead of real effects" | No way to know what kits exist or to swap them | ELEMENT_VFX registry surfaces options; VFX panel makes them swappable |
| "DIG broken silently for hours" | 4 fallback paths, all REST, all 403 | CLI-fallback in dig-search.ts after registered REST + OpenRouter both fail |

Every one of these was a "where does this live?" question that AI codegen got wrong. The registry plane removes the question.

## Build order (next bites)

1. ⏳ Write this doctrine (THIS commit)
2. Create `lib/registry/index.ts` (Registry Of Registries — 30 lines)
3. Create `lib/registry/mutation-contract.ts` (MutationGuard — 80 lines)
4. Refactor `lib/activity/index.ts` to MutationGuard pattern (50 lines)
5. Author 2 ESLint rules (no-unregistered-mutation, no-stray-registry)
6. Wire eslint config + run `pnpm lint` to confirm zero new violations
7. Document in CLAUDE.md as a project convention

## What this doctrine intentionally does NOT do

- Does not replace `MatchSnapshot` reducer — that pattern is already correct
- Does not introduce DI containers / inversify — too heavy for this scale
- Does not require schema migrations — registries are code, not data
- Does not constrain UI state (`useState` in components is fine — it's local)
- Does not gate Tweakpane edits — operator latitude is the whole point of dev panel; the panels TARGET engine.config which is operator-tunable by contract

## What I'm asking the operator to confirm before phase 2 lands

- "Yes, fold this discipline into the build cycle" → I create lib/registry/, refactor activity, ship ESLint rules
- "Wait — let's stress-test the existing engines first" → Phase 2 deferred to the next cycle
- "Different shape — explain why X over Y" → Doctrine revision before code
