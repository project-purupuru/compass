# Compass · world substrate (S4 deliverable)

> Agent-navigable umbrella for compass's world experience. Each system is one port + one live + one mock + one test. Drop in a new system in 5 commands per the lift-pattern-template.

## Systems

- **awareness** — the world's belief about what's happening (read+subscribe+write composition)
- **observatory** — read-only projection of world state for display surfaces
- **invocation** — write-only command surface (ceremony triggers · NOT lib/ceremony/ which holds UI animation utilities)

## How to add a system (5 commands per lift-pattern-template)

```bash
# 1. Copy the awareness.* trio
cp lib/world/awareness.{port,live,mock,test}.ts lib/world/<name>.{port,live,mock,test}.ts

# 2. Edit the 4 files to your domain (rename Awareness → <Name> · adjust shape)

# 3. Add the Live Layer to AppLayer in lib/runtime/runtime.ts
#    `import { <Name>Live } from "@/lib/world/<name>.live";`
#    Append to `Layer.mergeAll(...)` arg list

# 4. Add an example component
cp app/_components/awareness-example.tsx app/_components/<name>-example.tsx

# 5. Update this SKILL.md (add to Systems list + state ownership matrix)
```

## State ownership matrix (BB-006 · enforced by scripts/check-state-ownership.sh)

| System | Owns (writes) | Reads |
|---|---|---|
| awareness | `awarenessRef` (the consolidated world-belief) · `awarenessChanges` PubSub | weather (read) · activity (read · events stream) · population (read · spawns stream) |
| observatory | (read-only · NO writes to any Ref/PubSub) | awareness (read · current+changes) · weather (read) |
| invocation | `commandsPubSub` (the ceremony invocation queue) | (commands consumed by awareness) |

## Guarantees

- All Live Layers compose into `lib/runtime/runtime.ts` AppLayer (THE single Effect.provide site)
- All envelopes carry `output_type` ∈ Signal/Verdict/Artifact/Intent/Operator-Model (CI-gated)
- No system reads or writes Solana directly — `lib/live/solana.live.ts` would be the chain-binding home (D5 · `lib/adapters/` is forbidden)
- No system imports straylight runtime (D2 · doc-only this cycle)
- No card/battle/deck files live in `lib/world/`; Honeycomb owns card-battle
  vocabulary under `lib/honeycomb/`.
- No system writes to a Ref/PubSub it doesn't declare ownership of in the matrix above (CI-enforced)

## Checks

```bash
pnpm check:world
pnpm check:world:selftest
```

## Cross-references

- Lift-pattern template: `grimoires/loa/specs/lift-pattern-template.md`
- Force-chain mapping: `grimoires/loa/context/13-force-chain-mapping.md`
- Conformance map: `grimoires/loa/context/12-hounfour-conformance-map.md`
- Verify⊥judge fence: `lib/domain/verify-fence.ts`
- Honeycomb card-battle substrate: `lib/honeycomb/SKILL.md`
