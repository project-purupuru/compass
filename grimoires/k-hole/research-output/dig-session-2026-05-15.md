
## Dig: Kirka.io browser FPS WebGL three.js multiplayer performance architecture netcode
_2026-05-15T04:38:12.940Z | 15 sources | 444.8s | depth: +++_

### Findings
**Awesome Sam**'s **Better Kirka Client (BKC)** leverages **Electron.js** to explicitly bypass the Chromium "Main Thread" bottleneck, allowing the game to exceed the standard 60 FPS browser cap and reduce input lag. His implementation of "Resource Swapping"—intercepting standard `.obj` or `.gltf` requests to substitute community-made "flat" textures—treats the browser's asset pipeline as a dynamic injection point rather than a static fetch (bridge). This mirrors the "Custom Shell" approach in **high-frequency trading (HFT)**, where practitioners like **Ariel Silahian** in *Trading Systems Performance Unleashed* (2024) advocate for replacing standard OS window managers with optimized graphics layers to visualize L2 order books at microsecond precision without dropping frames (adjacent).

**xip (Hudsonjpg)**, the lead developer of Kirka.io, pivoted the game's architecture toward an authoritative server model using the **Colyseus** Node.js framework to mitigate the "speed and teleport hacks" prevalent in earlier voxel shooters. While WebSockets (TCP) provide reliability, xip has documented the inherent struggle with **Head-of-Line (HOL) Blocking**, where a single lost packet halts the entire stream. This has led to community-led experimentation with **netcode.io**, a protocol designed by **Glenn Fiedler** to wrap UDP for the browser, enabling the "unreliable/unordered" packet delivery essential for the "micro-stutter" free movement required in competitive bhop (bunny hopping) mechanics.

**Gabriel Gambetta**’s seminal research on **Client-Side Prediction** and **Server Reconciliation** serves as the mathematical backbone for Kirka's entity interpolation logic. This ensures that even when the server—as the "source of truth"—corrects a player's position, the transition is visually smoothed to prevent "snapping." This technique is structurally identical to **Model-Mediated Control** in robotics teleoperation, where a local "digital twin" of a drone or surgical arm reacts instantly to user input to provide haptic feedback while the actual high-latency command signal travels over the network (adjacent).

**Three.js `InstancedMesh`** is the primary primitive used by original developers **adelnorberg** and **pumpudum** to render Kirka's voxel environments without overwhelming the GPU's draw call limit. By instancing thousands of blocks in a single draw call, the engine maintains high frame rates on integrated GPUs. This echoes the **"Instanced Geometry"** techniques found in **Willy Scheibel's** research at the Hasso Plattner Institute, where he achieved a **3000% higher FPS count** for 2.5D financial information landscapes by offloading data-point replication to the GPU vertex shader rather than the CPU (adjacent).

### Pull Threads
- **AwesomeSam9523/better-kirka-client Resource Swapping logic** — to understand the exact intercept point in the Three.js loader for runtime asset substitution.
- **Colyseus Room Schema binary encoding** — to analyze how Kirka minimizes the payload size of authoritative state updates over WebSockets.
- **Glenn Fiedler's netcode.io C implementation vs. browser wrapper** — to see how "unreliable" packets are simulated within the constraints of a browser's security sandbox.
- **xip's KLO (Kirka Leveling/Ranking) system rewrite** — to investigate the statistical transition from basic ELO to a Skill-Based Matchmaking (SBMM) algorithm optimized for fast-lobby turnover.

### Emergence
The "Browser FPS" exists in a state of architectural hypocrisy: it sells "instant-on/no-install" access while its competitive community's first move is to install an Electron wrapper (BKC) that effectively turns it into a desktop app. The technical debt of the browser—event loop bottlenecks and TCP-only defaults—is being paid for by community-built "performance shims" that treat the browser as a mere runtime for more aggressive low-level optimizations (bridge).

### Sources
- [r/Kirka - Q&A with Developer xip (hudsonjpg)](https://www.reddit.com/r/Kirka/comments/pwyq9x/new_developer_update_september_2021/)
- [AwesomeSam9523 GitHub - Better Kirka Client Technicals](https://github.com/AwesomeSam9523/better-kirka-client)
- [Colyseus - Multiplayer Framework Documentation](https://docs.colyseus.io/)
- [Gabriel Gambetta - Fast-Paced Multiplayer Netcode Research](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html)
- [Gaffer on Games - Netcode.io Protocol Analysis](https://gafferongames.com/post/netcode_io/)
- [Vectaria.com - Original Kirka Developers Site](https://vectaria.com/)
- [Kirka.io Public API Announcement](https://discord.com/channels/804047466170613760/)
- [Kirka.io Official Discord & Dev Blog](https://discord.com/invite/kirka)
- [Gaffer on Games: Netcode and Determinism](https://gafferongames.com/)
- [Ariel Silahian: Trading Systems Performance Unleashed](https://www.tradingperformanceunleashed.com/)
- [Haneesh Bandaru: Nebula HFT Dashboard Case Study](https://haneesh.dev/project/nebula)
- [Hephaistos: 2.5D Order Book Visualization Research](https://www.willyscheibel.de/publications/)
- [Figma's Multiplayer Technology Stack](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Model-Mediated Teleoperation in Robotics](https://ieeexplore.ieee.org/document/4651034)
- [VisualHFT Open Source Project](https://github.com/ArielSilahian/VisualHFT)

---

## Dig: Achieving the For The King + Craftopia mountains + Island Beekeeper aesthetic in React Three Fiber — mid-poly painterly worlds (not low-poly flat, not high-detail PBR): warm directional sunset lighting with rim/edge glow on land, painted-texture terrain, mid-poly trees with leaf-card canopies, drifting cloud layers viewed from above, atmospheric depth fog, flat-shaded icosphere blob vocabulary, Ghibli-warm mood
_2026-05-15T04:03:18.708Z | 13 sources | 715.6s | depth: +++_

### Findings

Faraz Shaikh’s `three-custom-shader-material` (CSM) serves as the technical pivot for the "Sunday Afternoon" aesthetic, enabling the injection of custom GLSL into Three.js’s native lighting chunks. By hijacking the `MeshStandardMaterial`, Shaikh preserves built-in shadow mapping while overriding the fragment shader to calculate a Fresnel-driven "rim glow"—a `dot(normal, viewDir)` calculation that illuminates the edges of a model as if it were caught in a perpetual sunset. (adjacent) This technique mirrors the "Light and Space" movement’s use of light as a tangible material, specifically Larry Bell’s vacuum-coated glass cubes that define volume through edge-glow and refraction rather than surface detail.

Maxime Heckel’s "The Study of Shaders with React Three Fiber" provides the blueprint for "fluffy" mid-poly canopies through spherical normal manipulation. By forcing vertex normals to point outward from a central pivot rather than perpendicular to their actual geometry, the lighting wraps around clusters of "leaf cards" or icosphere blobs as a single organic volume. Heckel emphasizes using "3D Simplex or Perlin noise to displace the vertices along their normals dynamically," creating the "drifting, breathing" quality seen in *Island Beekeeper* clouds. (bridge) The synthesis of Heckel’s displacement logic with Oskar Stålberg’s "Irregular Quad Grids" transforms the mesh from a static shell into a "perceptual container" where the geometry itself acts as a medium for atmospheric turbulence.

Paul Henschel (0xca0a) champions the use of `AccumulativeShadows` to ground the floating hex-grids of *For The King*-style dioramas, arguing that "soft, jittered shadows" are the essential "glue" that makes a digital island feel like a tactile toy. This groundedness is softened by "noise-injected height fog," a technique that replaces standard linear fog with a color gradient (deep purple to warm peach) modulated by noise to simulate "patches" of drifting mist. (adjacent) This layering of atmospheric color echoes the "Luminist" painters of the Hudson River School, such as Albert Bierstadt, who used translucent oil glazes to achieve a "glow of the land"—a physical precursor to the modern Alpha-blended fragment shader.

### Pull Threads

- "Maxime Heckel Kuwahara Filter shader implementation" — How to use variance-based smoothing in a post-processing pass to convert 3D renders into painterly oil strokes.
- "Oskar Stålberg Townscaper vertex color palette" — Achieving a "painted" look without texture maps by encoding colors directly into the mesh geometry for optimized, low-memory dioramas.
- "Faraz Shaikh Sunday Afternoon lighting setup" — The specific `CustomShaderMaterial` configuration for achieving warm, low-contrast, non-PBR global illumination.
- "Kazuo Oga Studio Ghibli poster color clumping" — How to translate the 2D "blob" vocabulary of anime background art into 3D volume modeling and "leaf-card" placement.

### Emergence

A fundamental shift occurs in this aesthetic from "Mathematical Accuracy" to "Perceptual Affect." By hijacking vertex normals and injecting noise into fog, practitioners like Henschel and Heckel are not simulating the physics of light, but the *memory* of a sunset. The tension between the "jagged" mid-poly geometry and the "soft" lighting gradients creates a "haptic visuality"—a world that looks like it would feel warm to the touch.

### Sources
- [Building a stylized scene with React Three Fiber](https://www.youtube.com/watch?v=R2jI00GZ1bQ)
- [React Three Fiber - Shaders - Toon Shading](https://tympanus.net/codrops/2023/11/08/the-study-of-shaders-with-react-three-fiber/)
- [Three.js Fog Hacks](https://medium.com/@_V_S_/three-js-fog-hacks-7424d10e587e)
- [r3f-fog-effect](https://github.com/AxiomeCG/r3f-fog-effect)
- [Drei - Outlines and Edges](https://drei.pmnd.rs/)
- [Lamina documentation](https://github.com/pmndrs/lamina)
- [Bruno Simon's Three.js Journey](https://threejs-journey.com/)
- [Maxime Heckel: The Power of the Kuwahara Filter](https://maximeheckel.com/posts/the-power-of-the-kuwahara-filter/)
- [Faraz Shaikh: THREE-CustomShaderMaterial](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial)
- [Alexander Birke: The Living Painting Technical Breakdown](https://www.gamedeveloper.com/design/creating-the-painterly-art-style-of-11-11-memories-retold)
- [Oskar Stålberg's Townscaper Grid Logic](https://twitter.com/OskarStalberg/status/1164101967205244928)
- [Matt DesLauriers: Generative Impressionism](https://mattdesl.svbtle.com/generative-impressionism)
- [Poimandres: React Three Fiber Examples](https://docs.pmnd.rs/react-three-fiber/getting-started/examples)

---
