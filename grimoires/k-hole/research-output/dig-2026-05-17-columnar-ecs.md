
## Dig: Columnar stores in game engine ECS · Trizen ECS archetype pattern · ClickHouse columnar storage how it enables SQL queries on columns · ECS Bitsquid / Caches Bevy / EnTT how archetypes bundle entities with same component shape · why columnar data layout makes typed array access cache-friendly · convergence target: doctrine entry in effect-substrate construct on whether columnar-archetype ECS composes with our existing Effect-TS substrate, and what platform-agnostic plugin shape for renderer/physics looks like (Three.js WebGPU + Rapier as plugins, not coupled)
_2026-05-17T17:48:08.444Z | 8 sources | 418.1s | depth: +_

### Findings

Alexey Milovidov's architecture for ClickHouse proved that querying millions of rows requires bypassing irrelevant data to execute vectorized instructions over dense, predictable memory blocks. Sander Mertens, creator of Flecs, directly translates this to game engines, explicitly comparing the ECS archetype graph to the projection and materialization phases of columnar DBs and stating plainly that "ECS is a Database." Loïc Baumann cemented this connection in his piece "What game engines know about data that databases forgot," explicitly linking Unity's ECS and Burst Compiler to OLAP databases like Snowflake.

Carter Anderson's Bevy engine formalizes this columnar approach by bundling entities into "Tables" based purely on their component shape. Iterating over these archetypes means finding the matching tables and executing a "straight, unbranched linear sweep through memory." This perfectly fills 64-byte CPU cache lines with parallel `Float32Array` data, avoiding the scattered heap allocations of standard JavaScript objects. In contrast, Michele Caini's EnTT framework achieves similar iteration speed using Sparse Sets and "Groups", mapping sparse Entity IDs to dense indices to ensure $O(1)$ component addition instead of costly archetype structural migrations—highlighting a fundamental trade-off between strict memory contiguity for read speed and relational flexibility for write speed across all ECS implementations (bridge).

Michael Arnaldi's Effect-TS acts as the orchestration substrate to house this highly mutable, C-like machine code inside a pure functional environment. The ECS inner loop is injected as an "opaque, mutable resource", allowing Effect to manage the application lifecycle and system concurrency (`Effect.all(..., { concurrency: "unbounded" })`) without incurring garbage collection pauses on every array access. When integrating platforms like Three.js WebGPU, the Effect `Layer` simply binds the raw `Float32Array` as an Instanced Buffer Attribute, entirely bypassing the `THREE.Mesh` object graph to maintain strict architectural decoupling. This structural isolation mirrors the WebAssembly linear memory model, where a shared contiguous buffer is mutated imperatively while the host environment strictly sandboxes the orchestration and lifecycle (adjacent).

### Pull Threads
- `@effect/schema` for memory-aligned byte offset generation — how TypeScript type schemas compile down to deterministic `ArrayBuffer` views.
- Loïc Baumann "What game engines know about data that databases forgot" — the specific algorithmic differences between Unity's Burst Compiler and Snowflake query planners.
- Three.js Shading Language (TSL) Compute Shader raw buffer binding — how modern WebGPU pipelines bypass the classical `THREE.Scene` object graph for ECS-driven rendering.
- EnTT "Groups" sparse set iteration mechanics — how mapping sparse IDs to dense indices avoids the Bevy archetype structural change penalty.

### Sources
- [Effect-TS Documentation: Context & Layers](https://effect.website/docs/context-management/layers)
- [Bevy Engine Architecture: ECS & Archetypes](https://bevyengine.org/learn/architecture/)
- [Sander Mertens: Building an ECS (Flecs)](https://ajmmertens.medium.com/building-an-ecs-1-where-are-my-entities-and-components-63d07c7da742)
- [ClickHouse Documentation: Why Column-Oriented Databases Work Better](https://clickhouse.com/docs/en/about-us/performance)
- [Bitsquid Blog: Data-Oriented Design](http://bitsquid.blogspot.com/2014/08/building-data-oriented-entity-system.html)
- [EnTT GitHub Repository & Documentation](https://github.com/skypjack/entt)
- [Rapier Physics: JavaScript & WASM Integration](https://rapier.rs/docs/user_guides/javascript/getting_started_js)
- [Three.js WebGPU Renderer Drafts](https://threejs.org/docs/#api/en/renderers/webgpu/WebGPURenderer)

---
