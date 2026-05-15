---
title: Soul Garden Roadmap — Cycles 2-4 Vocabulary Map (one surface, not the game)
status: candidate · regrounded-2026-05-13
authors: [stamets, ostrom, kaori-easel]
constructs: [k-hole, the-arcade, the-easel]
parent_dig: grimoires/k-hole/research-output/dig-session-2026-05-14.md
parent_decision_map: grimoires/loa/context/08-scene-composition-decision-map.md
regrounded_against: grimoires/loa/context/10-game-pitch.md (Gumi original pitch) + grimoires/k-hole/resonance-profiles/04-agent-layer.yaml
audience: operator (creative direction · pre-implementation)
implementation_gate: each cycle requires explicit operator promotion to PRD
note: >
  Written before Gumi's pitch surfaced. Originally framed as "the game's
  roadmap" — it is not. It is the build path for ONE surface: the Soul Garden /
  ambient agent-layer. The named-object vocabulary and cycle ramp stand; the
  scope is corrected by the re-grounding section below.
---

# Populated-Diorama Roadmap

> Operator pivot 2026-05-13: from HD-2D miniature → "alive populated diorama"
> (TemTem · Eternal Return · Fae Farm family). Cycle-1 lands the chassis;
> cycles 2-4 compound real chibis · grass · atmospherics · ambient choreography.
>
> This document **uses the dig vocabulary as named objects** so we can
> creatively direct around them — both with human collaborators and with
> AI generation tools. Each named object has an explicit referent.

---

## ⚠ Re-Grounding (2026-05-13 · against Gumi's pitch)

This roadmap was written **before** Gumi's original pitch surfaced
(`grimoires/loa/context/10-game-pitch.md`). It read as *"the game's roadmap."*
**It is not.**

Per the pitch, Purupuru is a **card tactics game**. This roadmap is the build
path for **one surface only**: the **Soul Garden / ambient agent-layer** — where
the Puruhani (the honey creatures in their element-colored pots) tend, where the
world doesn't pause when you close the app, the "warm daily view."

**It is NOT:** the battle system, the card / lineup mechanics, the
burn-transcendence loop, or the daily duel. Those are separate surfaces with
their own roadmaps — **not yet written**.

**Clean re-anchor:** the Puruhani described in
`grimoires/k-hole/resonance-profiles/04-agent-layer.yaml` *are* the
populated-diorama inhabitants. This roadmap is literally the build path for the
**agent-layer's visible form**. The "Theatrical Performance" frame (§0) still
holds — for the Garden. The C2→C3→C4 technical ramp (chibi GLB · grass /
atmosphere · ambient choreography), the named-object vocabulary (CSM, drei
Outlines, VAT, Simon Dev grass, Wawa godrays), the asset-gen prompts, the
decision points — **all still valid, as the Garden layer's build path.**

**One correction to the comp set:** the blockquote above cites "TemTem ·
Eternal Return · Fae Farm" — that was the *combat-MMO* read. For the **Garden
specifically**, Gumi's tone (contemplative, reverent, ambient — the world
tending itself while you're away) points instead at **Neko Atsume, Ooblets,
Cozy Grove, Spiritfarer**. The battle surface keeps its own comps (Hearthstone
Battlegrounds, Balatro — see `resonance-profiles/01-elemental-tactics.yaml`).

Read everything below as **the Soul Garden roadmap** — accurate and useful at
that scope, just not the whole game.

---

## 0. The Unifying Frame ("Theatrical Performance")

The new dig surfaced an insight that resolves the apparent tension between
locked-camera and populated-MMO-feel:

> *"In the browser, the locked camera allows for **Frustum-Aware
> Instancing**, where the GPU only computes the parallel flip-book of VAT
> animations for what is currently on screen. This creates a Theatrical
> Performance architecture: the world exists only where the player is
> looking, turning the MMO from a persistent physical simulation into a
> series of hot-swapped stage sets."*
> — Dig synthesis, 2026-05-14

**What this means for cycle-1+:**
- The locked camera is the *performance lever*, not the aesthetic constraint
- The world doesn't have to be persistent — only *believably alive in view*
- This is the differentiator vs Unity/Unreal MMOs: those simulate; we present
- The card-play interaction is the player's tool for *directing the stage*

Hold this frame as the design north-star. Every named object below is in
service of this frame.

---

## 1. Vocabulary Glossary (named objects from the dig)

Each entry: name · what it is · which cycle owns it · why it matters.

### 1.1 Character Pipeline

| Name | What it is | Cycle | Why |
|------|-----------|-------|-----|
| **GLB / GLTF chibi mesh** | Industry-standard 3D model format · binary glTF | C2 | The chibi placeholders we have today are cone+sphere; real meshes ship as GLB |
| **Sky Children 1:3 head-to-body** | Chibi proportion standard from *Sky: Children of the Light* — head is 1/3 the body height (vs realistic 1/7) | C2 | Expressive silhouette readable at distance · ergonomic for the camera lock |
| **drei `<Outlines />`** | Inverted-hull outline component · vertex-shader scaled back-faced mesh | C2 | NPR (non-photorealistic) outline without depth-stencil postprocessing cost · mobile-friendly |
| **CSM (`THREE-CustomShaderMaterial`)** | Faraz Shaikh's library · injects GLSL into standard Three.js materials | C2 | Toon-shading + LUT-stepped gradients while keeping native Three.js shadows |
| **LUT-stepped gradient** | Look-Up Table texture for "toon" lighting · samples ramps instead of smooth | C2 | The "stepped" cel-shaded look (vs PBR realism) |
| **Abnormal (Blender plugin)** | Vertex normal editing tool used in Genshin/BoTW | C2 stretch | Manually smoothed normals for flat illustrative chibi faces |
| **SDF face maps** | Signed Distance Field textures baked into chibi faces | C3 stretch | Smooth shadow transitions on noses/lips regardless of light angle (Genshin signature) |
| **VAT (Vertex Animation Textures)** | Bake skeletal bone positions into a texture · shader reads per-instanceId | C4 | "Parallel flip-book" · thousands of animated NPCs at 60fps |

### 1.2 World Surface

| Name | What it is | Cycle | Why |
|------|-----------|-------|-----|
| **Simon Dev GPU-instanced grass** | Wind sway in vertex shader · samples terrain heightmap for color/grounding | C3 | Canonical web-3D grass · single draw call for entire field · the *Eternal Return / Fae Farm* texture |
| **Vertex shader wind sway** | Mathematical wind animation embedded in the grass blade vertices | C3 | Continuous motion · CPU-free · scales arbitrarily |
| **Heightmap-grounded blades** | Each grass blade samples terrain height at root for placement | C3 | "Grass follows terrain" without per-blade positioning data |
| **Frustum-Aware Instancing** | Only render what's in camera view · culling at GPU level | C3 | The performance lever that makes 200+ NPCs + grass feasible |

### 1.3 Atmosphere & Light

| Name | What it is | Cycle | Why |
|------|-----------|-------|-----|
| **Wawa Sensei fake godrays** | Fresnel-faded cone meshes (geometry-based light shafts) vs screen-space radial blur | C3 | Cheap on mobile · stylized light shaft look · doesn't cost a full postprocess pass |
| **Per-element ambient particles** | Pooled particle system that swaps emitter prefab per `activeElement` | C3 | Wood = drifting leaves · Fire = ember sparks · Water = mist droplets · Earth = pollen · Metal = gold dust |
| **TSL (Three Shading Language)** | The new node-graph WGSL/GLSL system in Three.js | C3 stretch | Future-proof · lets us compose shaders visually |
| **Element-biased directional light** | Directional light color leans toward `ELEMENT_COLOR[activeElement]` | C1 ✓ | Already shipping in cycle-1 — the world bathes in the active element's color |

### 1.4 Architectural Patterns

| Name | What it is | Cycle | Why |
|------|-----------|-------|-----|
| **Theatrical Performance arch** | World-in-view-only · hot-swapped stage sets · presentation layer over substrate | All | The unifying frame · cycles compound on this |
| **Substrate ↔ World coupling** | Substrate state (activeElement, sequence beats) reactively biases world atmosphere/NPC behavior | C1 partial · C2 deepen | Already: light tint + NPC bob speed. Future: NPC orientation · particle emitter prefab · godray angle · grass density |
| **Pooled instance allocator** | Recycle InstancedMesh entries per zone-class so total mesh count stays bounded | C3-C4 | The mechanism that makes density scale |

---

## 2. Cycle Sequencing (compounding plan)

Each cycle owns a discrete set of named objects from §1. Each compounds on
the previous chassis without invalidation.

### Cycle 1 (current · DONE this turn)
- Camera pivot to stylized-3D vantage (`fov:40, [0,6,10]`)
- Full-bleed canvas + HUD as overlay
- 45 chibi placeholders · density-biased toward active zone
- Element-biased directional light tint (substrate→atmosphere coupling)
- Element-matched NPCs bob faster (substrate→behavior coupling)
- Painted `tsuheji-map.png` as island substrate

**Status**: shipping · ready for operator visual verdict

### Cycle 2 — "First Inhabitants"
**Goal**: replace placeholder cones+spheres with 5 real chibi GLB meshes
(one per element clan), wrapped in `<Outlines />` and using a CSM toon material.

**Named objects deployed**:
- GLB chibi mesh × 5 (one per element)
- Sky 1:3 head-to-body proportion (asset spec)
- drei `<Outlines />` (NPR outline)
- CSM toon material (LUT-stepped element-tinted shader)
- Optional: Abnormal-edited normals on faces

**Deliverables**:
- 5 GLB files in `public/models/chibi/{wood,fire,water,metal,earth}.glb`
- New `<ChibiNPC>` component replacing `<ChibiPlaceholder>`
- Per-element LUT texture in `public/textures/lut/{element}.png`

**Estimated scope**: 1 full sprint (S1 calibration + S2 GLB pipeline + S3 CSM/Outlines wiring)

### Cycle 3 — "World Comes Alive"
**Goal**: world surface stops being a flat painted disc · grass sways, light
shafts pour over Sora Tower, weather particles drift per active element.

**Named objects deployed**:
- Simon Dev GPU-instanced grass (vertex-shader wind, heightmap-grounded)
- Wawa Sensei fake godrays (Fresnel cones over Sora Tower)
- Per-element ambient particles (5 prefab pools, switch on `activeElement`)
- Frustum-Aware Instancing (the perf lever — actually implement it)

**Deliverables**:
- New `<IslandGrass>` component using InstancedMesh + custom vertex shader
- New `<SoraTowerGodrays>` component (3-4 cone meshes with Fresnel material)
- New `<AmbientParticles>` component reading `state.weather.activeElement`
- InstancedMesh refactor of NPC scatter for frustum culling

**Estimated scope**: 1 full sprint

### Cycle 4 — "Ambient Choreography"
**Goal**: NPCs aren't just bobbing — they walk, idle, celebrate. World
density bumps 45 → 200+ via VAT.

**Named objects deployed**:
- VAT (Vertex Animation Textures) bake of chibi walk/idle/celebrate
- "Parallel flip-book" GPU rig
- Pooled instance allocator (cap NPC count, recycle by frustum)
- Substrate→behavior deeper coupling (NPCs path to active zone, gather, react to beat)

**Deliverables**:
- VAT bake pipeline doc (Houdini or `three-mesh-bvh-animation`)
- VAT-driven `<InstancedAnimatedNPCs>` component
- Bumped scatter logic → 200 deterministic positions
- Beat-reactive ambient choreography (sequence fires → NPCs face Sora Tower)

**Estimated scope**: 1 full sprint · stretch C5 if VAT pipeline is harder than expected

---

## 3. Asset Generation Prompts (use the vocabulary)

When you direct AI image/3D-generation tools (Midjourney, Stable Diffusion,
Meshy, Tripo, etc.), use the named-object vocabulary precisely. The prompt
templates below are calibrated to produce assets that drop in cleanly.

### 3.1 Chibi character art reference (Cycle 2 prep · 2D ref → 3D model)

```
2D character reference sheet, chibi proportions Sky Children of the Light
1:3 head-to-body ratio, low-poly stylized 3D game aesthetic, soft flat
shading with toon LUT-stepped gradients, drei Outlines inverted-hull
outline style, element [WOOD/FIRE/WATER/METAL/EARTH] palette, t-pose,
front view + 3/4 view + side view, neutral background, game-ready
character design, TemTem / Eternal Return / Fae Farm aesthetic family
```

Five renders (one per element). Use as reference photos for Meshy/Tripo
GLB generation, OR as direct material palette for hand-modeled chibi.

### 3.2 GLB model generation prompt (Cycle 2 · text-to-3D)

```
chibi humanoid character, low-poly stylized, 1:3 head-to-body ratio,
clean topology under 3000 tris, single-skinned mesh ready for skeletal
animation, T-pose, [ELEMENT] elemental clan villager from purupuru
world, simple flat colors ready for toon shader, no textures (palette
will be applied via CSM LUT), neutral expression
```

### 3.3 Element ambient particle reference (Cycle 3)

```
[ELEMENT] particle effect, stylized game VFX, [drifting leaves
WOOD / ember sparks FIRE / mist droplets WATER / pollen EARTH /
gold dust METAL], soft saturated palette matching wuxing element
[wood mossy green / fire warm coral / water deep teal / metal pale
violet / earth amber], top-down view for game asset, alpha channel
preserved, stylized-3D-action aesthetic
```

### 3.4 Grass texture / blade reference (Cycle 3)

```
single grass blade reference, stylized low-poly game asset, soft hand-
painted look (Eternal Return / Fae Farm aesthetic), green gradient
top-to-bottom, simple alpha cutout shape, vertical orientation, transparent
background, ready for vertex-shader wind sway, sized for GPU-instanced
grass field
```

### 3.5 Godray cone reference (Cycle 3 stretch)

```
volumetric light shaft cone, soft golden-amber, fresnel-faded edges
(brighter at narrow tip, fading at wide base), vertical orientation,
stylized game atmosphere, single isolated cone mesh, ready as Three.js
Fresnel cone for fake godray over Sora Tower
```

---

## 4. Decision Points That Surface Per Cycle

Cycle promotion to PRD requires operator answers to:

### Cycle 2
- **Chibi style**: do we author hand-modeled GLBs, or generate via Meshy/Tripo from 2D refs? (Meshy is faster · hand-model is higher quality)
- **Outline thickness**: thin clean (BoTW/TemTem) or chunky illustrative (Cult of the Lamb)?
- **Shadow strategy**: native Three.js shadows + CSM, or full SDF face maps (Genshin)? Cycle-2 ships with native; SDF is C3 stretch.
- **Element clan visual identity**: each clan's silhouette differentiation — same chibi base + accessory swap, or 5 distinct silhouettes?

### Cycle 3
- **Grass density**: light scatter (Stardew aesthetic) · medium (Eternal Return) · dense field (Fae Farm)?
- **Godray emitters**: only Sora Tower, or also one per zone, or only the active zone?
- **Particle persistence**: ambient always-on, or only during sequence dramatization?
- **Color grading**: do we add a postprocess color-grade pass to push toward warm-painted aesthetic?

### Cycle 4
- **VAT pipeline tool**: Houdini (industry std but heavy) · `three-mesh-bvh-animation` (web-native, smaller scope) · or hand-bake?
- **Animation library**: walk + idle + celebrate (3 anims)? Or also gather + worship + flee (6)?
- **Density target**: 100 NPCs (safe) · 200 (ambitious) · 500 (showcase the perf story)?
- **Substrate→choreography depth**: do NPCs path-find to active zone, or just face-rotate?

---

## 5. What This Roadmap Locks In / Out

**Locks IN** (these become canon if we proceed):
- Stylized-3D-action aesthetic family (TemTem/Eternal Return/Fae Farm reference set)
- Locked-camera "Theatrical Performance" architecture
- Substrate→world reactive coupling (substrate truth drives world feel · the *agentic-game-infrastructure* doctrine in our memory)
- Web-3D as the deployment target (vs porting to Unity/Unreal)
- chibi 1:3 proportion as the character standard
- LUT-stepped toon NPR as the lighting model
- per-element 5-clan world population

**Locks OUT** (acknowledge what we're foreclosing):
- Free-camera 3D exploration (we keep camera locked)
- Photorealistic PBR aesthetic (we're stylized)
- Persistent simulation (world is presentation, not simulation)
- Avatar/movement gameplay (you direct from outside, not embody)
- Mobile-app-only deployment (we're committing to web-3D as the pitch)

---

## 6. Open Threads (DIG candidates as needed)

When we hit a specific named object and need depth:

- **CSM cookbook**: every example pattern for LUT shading / rim light / outline emission
- **Houdini → web VAT pipeline**: the actual SOP graph for baking skeletal anims to texture
- **Mobile WebGL perf budget**: what's actually feasible at 60fps on iPhone 13?
- **Sky Children chibi rigging**: how the 1:3 proportion handles weight-painting and IK
- **Eternal Return grass postmortem**: if/when the team published their grass shader
- **stylized-3D color grading for web**: TemTem-style saturation curves vs hand-painted

Each of these is a 1-dig question that lands a discrete doc.

---

*Status: candidate. Promote to active context after operator review of cycle-1
visual verdict + sign-off on Cycle 2 scope.*

*Provenance: this roadmap derives from*
- `grimoires/loa/context/08-scene-composition-decision-map.md` (parent decision map)
- `grimoires/k-hole/research-output/dig-session-2026-05-14.md` (5 dig queries · 142 sources total)
- Operator visual review 2026-05-13 (HD-2D rejection · populated-diorama selection)
