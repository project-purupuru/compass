---
mode: dig
construct: k-hole
persona: STAMETS
thread: Kirka-adjacent browser FPS performance, three.js runtimes, and multiplayer readiness
created: 2026-05-15
plannable: true
status: research-artifact
dig_script_status: "completed via /Users/zksoju/.loa/constructs/packs/k-hole/scripts/dig-search.ts after local paths were missing"
trail_file: grimoires/k-hole/research-output/dig-session-2026-05-15.md
---

# Dig: Kirka Browser FPS Runtime

## Room

Domain: Compass battle/runtime performance and future multiplayer.

Goal: study Kirka-adjacent browser games and the engine/runtime decisions behind high frame rate, low heat, and resilient multiplayer feel.

Allowed context: public web sources, existing Compass three.js candidate notes, current battle performance harness.

Forbidden context: vault doctrine as authority, implementation changes, multiplayer product commitments.

Expected output: grounded findings, stealable design decisions, risks, and pull threads for a future ARCH/SHIP room.

## Findings

The strongest signal is that Kirka is not magic. A developer comment on the Kirka 0.35 Reddit post says the 3D layer is three.js, mostly custom, and not a game engine. The global DIG run also surfaced Kirka-community evidence around Better Kirka Client, Colyseus, client-side prediction, and `InstancedMesh`. Together, these point at the same pattern: the smooth browser FPS/MMO path is usually not "use Three.js and hope." It is "treat Three.js/WebGL as one subsystem inside a small custom engine."

The engine shape is consistent across sources:

- Renderer: aggressively limit draw calls through merged static geometry, instancing, batching, low material variety, and culling.
- Runtime: avoid per-frame allocation, avoid surprise GC, and own lifecycle disposal for GPU resources.
- Art direction: low-poly, voxel, flat/stylized materials, compressed textures, and simple silhouettes create headroom for responsiveness.
- Networking: keep the game server authoritative; hide latency with client-side prediction for local input and interpolation/history buffers for remote entities.
- Tooling: ship profiling and debug overlays early, not after the game feels bad.

This points at a specific Compass implication: the future three.js/puppet-theater work should not begin as a React scene graph with many live components. It should begin as a runtime loop with explicit budgets: entity count, draw calls, allocated objects per frame, texture memory, server tick rate, network payload size, interpolation delay, and worst-case VFX burst.

## Global DIG Run

The required local paths were missing, but the global Loa k-hole install was found and executed:

```bash
npx tsx /Users/zksoju/.loa/constructs/packs/k-hole/scripts/dig-search.ts --query "Kirka.io browser FPS WebGL three.js multiplayer performance architecture netcode" --depth 2
```

Result: depth `+++`, 15 sources, 2 searches, trail written to `grimoires/k-hole/research-output/dig-session-2026-05-15.md`.

High-confidence takeaways to carry forward:

- Better Kirka Client is worth inspecting because Electron wrappers reveal where competitive players feel browser runtime friction: frame caps, input latency, and asset substitution.
- Colyseus is the right first networking framework to study for browser-authoritative rooms/state sync, even if later transport work moves below WebSocket semantics.
- Gabriel Gambetta / Valve-style prediction and reconciliation should be treated as required multiplayer literacy before any real-time combat implementation.
- Three.js `InstancedMesh` and draw-call budgeting are not optional for voxel/blocky or many-entity scenes.

Claims to verify before architecture:

- Whether Kirka production itself uses Colyseus today, and at what layer.
- Whether Kirka production uses `InstancedMesh` specifically, versus a custom batching path.
- Whether any community netcode.io browser wrapper exists in active use, versus this being a conceptual pull thread.
- Exact Better Kirka Client resource interception points and whether those ideas are useful to Compass without violating asset integrity.

## Kirka / Adjacent Evidence

Kirka itself is a browser FPS with PC and mobile support and modest public requirements: Chromium-based browser or Kirka Client, with no specific device requirements listed by the fan wiki. The useful technical clue is the developer response: the 3D part is made with three.js, mostly from scratch, and not built on a game engine.

Krunker is the commercial proof point. GamesBeat reported that Krunker had over 200 million unique players and full modding support, playable anywhere without install, before its FRVR acquisition. That matters less as a business story than as a runtime constraint: browser shooters can scale if the art/runtime/network budgets are strict enough.

Hordes.io gives the clearest renderer lesson. Its developer describes a custom WebGL renderer for high-load situations: many moving entities, large open worlds, frustum culling, distance-based terrain LOD, prop batching, effects, foliage, and terrain systems, with claimed 144+ FPS on consumer hardware. Even if the exact benchmark is self-reported, the subsystem list is the lesson.

## Rendering Steals

1. Design for draw-call collapse.

Three.js documentation says each Mesh generally becomes a draw request, so merged geometry is a core optimization. InstancedMesh exists specifically to render many objects sharing geometry/material with different transforms and reduce draw calls. PlayCanvas says the same thing in engine language: batching combines mesh instances into a single GPU draw call, but only when material/shader/layer/bounds rules cooperate.

Compass translation: model the battlefield/world as a small number of render families, not arbitrary objects:

- static environment batches
- repeated props as instanced meshes
- characters as a bounded animated set
- particles as pooled GPU buffers
- HUD as DOM/CSS only where it does not fight the canvas

2. Use stylization as performance infrastructure.

Kirka/Krunker/Hordes-style visuals work because blocky or low-poly art lowers geometry, material, texture, and shader complexity. This does not mean "cheap." It means the expensive layer becomes timing, camera, hit feedback, particles, and animation clarity.

Compass translation: AAA-on-web should mean AAA responsiveness and taste, not native-engine asset density. The material vocabulary should bias toward bold shapes, baked lighting, matcaps, texture atlases, compressed textures, and selective post-processing.

3. Treat device pixel ratio as an adaptive quality knob.

PlayCanvas warns that using native device pixel ratio can multiply fill cost and hurt frame rate. For a browser game that must not overheat, DPR is not a static aesthetic choice.

Compass translation: future WebGL/WebGPU surfaces should own a dynamic render scale. Use 1.0 as the safe default on mid/low devices, raise only after measurement, and drop during VFX spikes or thermal stress signals.

4. Make resource lifetime explicit.

Three.js cannot automatically clean up WebGL resources while the page stays alive; textures, geometries, and materials need disposal. The existing Compass VFX scheduler test direction is aligned with this: leaks and stale timers become heat.

Compass translation: every future renderer live module needs a ResourceTracker-style owner and a route/unmount disposal test. This belongs in the engine boundary, not in individual scene components.

## Networking Steals

1. Authoritative server is the baseline.

Nakama's docs frame server-authoritative multiplayer as the model where gameplay data is validated and broadcast by the server, with fixed tick-rate match logic for real-time play. Colyseus similarly positions itself around authoritative game servers, state synchronization, rooms, and matchmaking.

Compass translation: do not let the client report final combat state. Clients send input/intent; server validates and emits authoritative state/events. This composes with Honeycomb/substrate doctrine better than client-trusted state.

2. Prediction is mandatory for local feel.

Bernier's Half-Life networking paper is blunt: a dumb client waiting for server results feels unacceptable on the Internet. The fix is client-side prediction from stored user commands, later corrected by authoritative server acknowledgements. Shared movement/weapon code between client and server reduces prediction divergence.

Compass translation: when multiplayer lands, local drag/aim/card-commit feedback should be predicted immediately, with server correction layered behind it. "No prediction" is acceptable for menus, not for moment-to-moment combat.

3. Interpolation is mandatory for remote readability.

Gaffer explains snapshot interpolation as sending relevant simulation state and reconstructing a visual approximation on the receiving side. The problem is jitter: packets do not arrive evenly, even if sent evenly. Bernier's paper similarly describes rendering other players slightly in the past using a position history buffer, trading a little latency for smoothness.

Compass translation: remote daemons/cards/projectiles should render from an interpolation buffer. Do not bind remote entity position directly to last network packet. The visual system should be time-addressed.

4. Transport choice matters less than latency semantics, but WebSockets have a ceiling.

The NSDI 2025 browser networking paper compares WebSockets, WebRTC, and WebTransport for browser real-time games. It highlights the basic browser constraint: unlike native games using UDP/DTLS, browsers expose WebSockets, WebRTC, and WebTransport. TCP reliability can create stale retransmissions; WebRTC and WebTransport offer more UDP-like semantics, but WebRTC has overhead and WebTransport is still emerging.

Compass translation: first multiplayer can start with WebSockets if scope is tactical/card-like and turn cadence is forgiving. For FPS-grade responsiveness or dense real-time action, the architecture should leave a transport port open for WebRTC data channels or WebTransport datagrams later.

## Compass Runtime Shape

Existing Compass notes already point in the right direction:

- `grimoires/loa/context/10-puppet-theater-and-ecs-visualizer.md` names instanced meshes, GPU-driven particles, post-processing, and an ECS bridge as the future three.js value.
- `grimoires/loa/proposals/foundation-vfx-camera-audio-2026-05-12.md` names the runtime pattern: typed registry, scheduler, dumb renderers, live control plane.
- `tests/performance/battle-runtime.spec.ts` now gives a browser-side guard for lag/overheating symptoms: frame stalls, long tasks, and leaked canvases.

The next ARCH room should preserve that shape and add explicit budgets:

| Budget | First target |
|---|---:|
| Render loop | no allocations in hot path |
| Draw calls | under 100 mobile, under 300 desktop for battle scene |
| DPR | adaptive 0.75-1.5, never blindly native |
| Long tasks | 0 during active combat burst |
| Remote entity interpolation | 100-200ms buffer, measured |
| Server tick | start 20-30Hz for card/tactics; isolate code so 60Hz+ action is possible |
| Snapshot payload | budget bytes per tick before feature design |
| Resource lifetime | route unmount disposes geometries/materials/textures/timers |

## Risks

- Three.js is a renderer, not a game engine. If Compass asks React components to become ECS, physics, networking, and renderer all at once, frame stability will collapse.
- R3F can be acceptable as an authoring layer, but the hot loop still needs engine ownership. Avoid per-entity React reconciliation for active combat.
- "AAA quality" on web should not mean dense imported assets. It should mean consistent frame pacing, low input latency, legible combat, great camera, sharp VFX timing, and graceful quality scaling.
- WebGPU is not a shortcut. It may improve certain workloads later, but the same budget discipline is required. WebGL2-first with a renderer port is the safer near-term architecture.

## Pull Threads

1. Kirka/Krunker clone-room: inspect runtime behavior in browser devtools, capture draw calls if possible, benchmark FPS/CPU/GPU/network under match load.
2. Three.js ECS bridge: compare raw Three.js + custom ECS, Miniplex, Koota, and R3F only-at-boundaries.
3. Browser transport spike: prototype the same tiny authoritative movement loop over WebSocket, WebRTC data channel, and WebTransport; measure RTT, jitter, stale update rate, and CPU overhead.
4. Render-budget harness: extend `tests/performance/battle-runtime.spec.ts` to collect renderer stats once a three.js canvas exists: draw calls, triangle count, texture count, program count, and heap delta after route churn.
5. Asset budget doctrine: define a Compass web-game asset envelope: mesh triangle limits, material count, atlas sizes, KTX2/Basis compression, audio polyphony, VFX particle caps.
6. Better Kirka Client resource path: inspect `AwesomeSam9523/better-kirka-client` for where it swaps assets and whether the same mechanism suggests a clean Compass dev-only skin/profile loader.

## Sources

- Kirka.io wiki: https://kirkaiofpsgame.fandom.com/wiki/Kirka.io_Wiki
- Kirka developer Reddit comment on three.js/custom engine: https://www.reddit.com/r/IoGames/comments/zgwj40/kirkaio_is_a_multiplayer_fps_in_the_browser_patch/
- Krunker acquisition / scale: https://gamesbeat.com/frvr-acquires-free-to-play-shooter-krunker-io/
- Hordes.io developer renderer notes: https://dek.engineer/
- Three.js optimize lots of objects: https://threejs.org/manual/en/optimize-lots-of-objects.html
- Three.js cleanup/resource lifetime: https://threejs.org/manual/en/cleanup.html
- Three.js InstancedMesh docs: https://threejs.org/docs/api/en/objects/InstancedMesh
- PlayCanvas batching docs: https://developer.playcanvas.com/user-manual/graphics/advanced-rendering/batching/
- PlayCanvas optimization guidelines: https://developer.playcanvas.com/user-manual/optimization/guidelines/
- Colyseus docs: https://docs.colyseus.io/
- Nakama authoritative multiplayer docs: https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/
- Gabriel Gambetta, client-side prediction and server reconciliation: https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
- Better Kirka Client: https://github.com/AwesomeSam9523/better-kirka-client
- Gaffer on Games netcode.io: https://gafferongames.com/post/netcode_io/
- Browser-based networking paper: https://aaron.gember-jacobson.com/docs/nsdi2025browser-networking.pdf
- Gaffer on Games snapshot interpolation: https://www.gafferongames.com/post/snapshot_interpolation/
- Bernier, latency compensating methods in client/server protocols: https://www.gamedevs.org/uploads/latency-compensation-in-client-server-protocols.pdf
- Three.js forum note on Krunker/resource handling: https://discourse.threejs.org/t/analyze-an-applications-performances/20917/8

## DIG Tool Log

The required DIG script was attempted first:

```bash
npx tsx .Codex/constructs/packs/k-hole/scripts/dig-search.ts --query "Kirka.io browser FPS WebGL three.js multiplayer performance architecture netcode" --depth 2
```

It failed because the script path is not installed in this checkout. The documented fallback was attempted:

```bash
npx tsx scripts/dig-search.ts --query "Kirka.io browser FPS WebGL three.js multiplayer performance architecture netcode" --depth 2
```

That path is also missing. A home search later found the global Loa install, and the successful command was:

```bash
npx tsx /Users/zksoju/.loa/constructs/packs/k-hole/scripts/dig-search.ts --query "Kirka.io browser FPS WebGL three.js multiplayer performance architecture netcode" --depth 2
```

The script wrote its trail entry to `grimoires/k-hole/research-output/dig-session-2026-05-15.md`.
