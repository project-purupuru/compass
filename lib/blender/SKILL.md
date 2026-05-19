# Compass · blender substrate (v0 · bronze)

> Agent-navigable adapter to Blender 3.0+ for the Honeycomb game engine. Built minimal-from-scratch (not forked) so the bug class affecting all existing Blender MCPs is eliminated at the substrate level.
>
> Compass is the learning lab; graduates to `honeycomb-blender` (separate repo, eventually under 0xHoneyJar) when proven. See `feedback_compass-learns-honeycomb-graduates` memory.

## Status

- **Tier**: 🟡 bronze
- **Coverage**: data seam + wire envelope (v0)
- **Deferred**: operator seam · context seam · node-graph seam · asset seam · live socket client · Python addon

## Systems

- **data** — bpy.data CRUD (objects · meshes · materials · ...) · port + mock + tests
- **wire** — length-prefixed framing protocol (4-byte BE uint32 header + UTF-8 JSON body) · solves the "Incomplete JSON response" bug class affecting ahujasid + Hermes + sandraschi etc.

## How to add a system (follows lift-pattern-template per honeycomb doctrine)

```bash
# 1. Copy the data.* trio (data is the canonical v0 reference)
cp lib/blender/data.{port,mock}.ts lib/blender/<seam>.{port,mock}.ts
cp lib/blender/__tests__/data.test.ts lib/blender/__tests__/<seam>.test.ts

# 2. Edit the 4 files to your seam (rename BlenderData → Blender<Seam> + adjust shape)

# 3. Eventually: add the Live Layer to AppLayer in lib/runtime/runtime.ts
#    (deferred until live socket client exists)

# 4. Update this SKILL.md (add to Systems list + state-ownership matrix)

# 5. Run the seam's test (no Blender required for mock tests)
pnpm vitest lib/blender/__tests__/<seam>.test.ts
```

## State ownership matrix

| System | Owns (writes) | Reads |
|---|---|---|
| data | `objects` Ref (in-mem map of bpy.data.objects projection) · `changesPubSub` PubSub | (none currently — operator + context + node-graph + asset seams will register reads here when they land) |
| wire | (transport only — no domain Ref/PubSub) | command/response payloads it ferries |

## Guarantees (load-bearing invariants)

- **Length-prefixed framing on day 1.** Every wire frame is `[4-byte BE uint32 length][UTF-8 JSON body]`. Closes the "Incomplete JSON response" bug class that affects ALL surveyed Blender MCPs.
- **Idempotent commands.** Every WireCommand carries a `cmdId`. The Python addon dedupes on cmdId — client may retry safely after socket loss.
- **Schema validation at the boundary.** All wire payloads run through `Schema.decodeUnknownSync(WireResponse)` before fields are trusted. Malformed payloads surface as `ParseError`, never silent drops.
- **Mock parity with live.** Mock implements the same Port surface as live will. Tests written against mock must pass against live with NO test changes (only the Layer swap).
- **No bpy off the main thread.** The Python addon side will enforce this when written; the TypeScript adapter cannot violate it (only sends commands).
- **Module-private state.** No adapter state is stored on `bpy.types` (avoids ahujasid #245 preset-corruption class).
- **No platform-specific asyncio internals.** Avoid `ProactorEventLoop`-class bugs (ahujasid #52).

## Checks

```bash
# Run substrate tests (mock-based · no Blender required)
pnpm vitest lib/blender

# Future: typecheck against canonical compass shape
pnpm typecheck
```

## Design rationale (1-line each)

- **Why TypeScript adapter + Python addon split?** TypeScript has stronger type-safety for agent ergonomics (operator preference). Python is forced (Blender's bpy is Python-only). The split lives at the socket boundary.
- **Why "build minimal" not fork?** ahujasid + sandraschi + Hermes all ship the wire-framing bug latent. Forking inherits the bug class. Building minimal puts the fix at day 1.
- **Why honeycomb extension, not freeside module?** Per `feedback_compass-learns-honeycomb-graduates`: compass learns first, honeycomb absorbs the graduated primitive, freeside only when 2+ projects need it. Adapter is currently 1-project (compass).

## Cross-references

- Design brief: `grimoires/loa/context/blender-adapter-design-brief-2026-05-18.md`
- Wire-framing rationale: `~/.claude/projects/-Users-zksoju-Documents-GitHub-compass/memory/reference_length-prefixed-framing-tcp-bug-class.md`
- Graduation discipline: `~/.claude/projects/-Users-zksoju-Documents-GitHub-compass/memory/feedback_compass-learns-honeycomb-graduates.md`
- Honeycomb construct: `~/Documents/GitHub/construct-honeycomb-substrate/` (target for eventual extraction)
- Pattern source: `lib/world/SKILL.md` (canonical port/live/mock substrate compass already ships)
- Force-chain mapping: `grimoires/loa/context/13-force-chain-mapping.md`

## What's NOT in v0 (named deferrals)

- `operator.port.ts` — bpy.ops dispatch (next chunk)
- `context.port.ts` — workspace / area / mode (next chunk)
- `node-graph.port.ts` — shader · geometry · compositor node-tree CRUD (cycle after)
- `asset.port.ts` — asset library + catalog UUID (cycle after)
- `data.live.ts` — actual socket client (next chunk · biggest single piece of work)
- Python addon (`addon.py`) — separate repo eventually (next chunk's compass-side prep)
- Modal-operator support — explicitly NOT in scope · revisit only if a spike forces it
- MCP-protocol compatibility — deferred · build native protocol first, MCP-export later if ecosystem value emerges
```
