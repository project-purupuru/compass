---
title: Scene Composition Decision Map — Camera & Layering Vocabulary
status: candidate · regrounded-2026-05-13
authors: [stamets, gygax, ostrom, kaori-easel]
constructs: [k-hole, gygax, the-arcade, the-easel]
parent_dig: grimoires/k-hole/research-output/dig-session-2026-05-14.md
regrounded_against: grimoires/loa/context/10-game-pitch.md (Gumi original pitch) + grimoires/k-hole/resonance-profiles/
audience: operator (creative direction · pre-implementation)
implementation_gate: requires explicit operator promotion before binding implementation
note: >
  Written before Gumi's pitch surfaced. The research body (§1-§3) is
  surface-agnostic and stands. §0 and §4 are corrected by the re-grounding
  section below — read that first.
---

# Scene Composition Decision Map

> Multi-construct exploration of camera/layering/composition options for the
> `/battle-v2` R3F world map. Grounded in 4 dig queries (124 unique sources)
> spanning canonical projection vocabulary, 2.5D-in-3D techniques, decoded
> reference projects, and R3F implementation gotchas.
>
> The operator asked: *"I want to ground myself in exactly the language that
> the experts use. I want to know that we aren't wasting time going down the
> wrong rabbit holes."* This artifact answers both — vocabulary first, then
> paradigm map, then a recommendation **grounded in cycle-1's substrate
> constraints** (not the operator's general taste).

---

## ⚠ Re-Grounding (2026-05-13 · against Gumi's pitch)

This doc was written **before** Gumi's original pitch surfaced
(`grimoires/loa/context/10-game-pitch.md`). It treated `/battle-v2` as a
single "R3F world map" surface and chased one camera answer for it. That frame
was wrong.

**The pitch is clear: Purupuru is a card tactics game with multiple distinct
surfaces, each wanting a different camera:**

| Surface | What it is | Governing resonance profile | Camera wants |
|---------|-----------|----------------------------|--------------|
| **The Battle** | Card lineup arrangement → simultaneous clash. **The primary interaction.** | `01-elemental-tactics` + `05-feel-first-no-numbers` | Tactical legibility above all. Card-table framing (the Inscryption / Slay-the-Spire lineage in §2) — *not* a wandering 3D world. No visible numbers. The lineup must read at a glance. |
| **The World-Map / Tide** | Meta-navigation — which element/zone is in play, the cosmic weather tide | `06-live-world-meta` | Ambient. The tide felt as flow, not read as a map. Low-interaction. |
| **The Garden (Soul Garden)** | Puruhani tending, the warm daily view, the world that doesn't pause | `04-agent-layer` | The populated-diorama work — that instinct was *right*, but it belongs **here**, not the battle. See doc 09. |

**What still holds, unchanged:** §1 (vocabulary glossary), §1.4 (failure modes),
§2 (decoded paradigms), §3 (R3F implementation gotchas). All of it is
surface-agnostic craft knowledge — still true, still useful.

**What is corrected:** §0's framing question ("what camera for the world map")
and §4's recommendation. The HD-2D recommendation in §4 was already rejected by
the operator in-session; the populated-diorama pivot it became is **re-scoped to
the Garden surface only** (doc 09) — it was never right for the Battle, which
wants the tactical-legibility camera, not a miniature diorama.

**Read §0 and §4 below as historical** — the question they answer is now three
questions, one per surface. The per-surface camera work is not yet done; this
doc supplies the vocabulary for it.

---

## 0. The Question Behind The Question (GYGAX)

> ⚠ Superseded framing — see Re-Grounding above. Kept for the GYGAX method
> (questioning the question), which is still the right move — just applied
> per-surface now, not to one monolithic "world map."

The operator asked about camera options. The deeper question is:

> **What cognitive load is the camera engineering for?**

Across the 4 digs, every practitioner who locked their camera did so for the
same structural reason: **shift the player's cognition from spatial navigation
to pattern recognition.**

- Casey Yano (Slay the Spire) — "Frictionless Readability" · the screen as a
  rigid stage for pure calculation. Intent System telegraphs AI behavior
  *onto the scene* so spatial reasoning is zero.
- Andrew Shouldice (Tunic) — "Geometric Honesty" · perspective camera at
  10–15° FOV pulled "infinitely far away" so hidden paths can be revealed by
  a deliberate camera tilt on shield-raise.
- Daniel Mullins (Inscryption) — "Diegetic Claustrophobia" · 960×540 target
  resolution chosen to *hide disparate 3D asset quality* and turn the UI
  from screen overlay into physical object.
- Team Asano (Octopath/Triangle Strategy) — UE BokehDOF tilt-shift to evoke
  "Epic Nostalgia" of model train layouts.

**Cycle-1's substrate has:**
- 5 zones (1 interactive in cycle-1 — wood_grove only)
- No terrain height, no occlusion, no unit movement, no grid
- 11-beat wood-activation sequence as the load-bearing dramatization
- Card-to-zone targeting as the load-bearing interaction
- Sora Tower (NPC pillar) + Kaori chibi (player avatar) as atmosphere agents

**Therefore the camera does NOT need spatial reasoning.** It needs:
1. Focal hierarchy — the active zone is unambiguous
2. Atmosphere — the world breathes (wood-tide pulse · element-tinted light)
3. Action framing — the card-zone gesture lands as a stage moment

This eliminates a chunk of the option space before we pick. Free-orbit is out
(no exploration). True isometric for tactical grids is out (no grid). Full
HD-2D miniature with sprite character motion is out (cycle-1 ships with no
character animation). What's left is a **stage**, not a **map**.

---

## 1. Vocabulary Glossary (DIG 1)

So you can talk to creative directors without translation overhead.

### 1.1 Camera Projection Family

| Term | Math | Use case | Trade |
|------|------|----------|-------|
| **Perspective (full)** | Vanishing-point convergence · standard FOV 45–90° | Free 3D worlds · cinematic | High immersion · low spatial readability |
| **Orthographic** | Parallel projection · no vanishing points | Engineering drawings · strict tactical grids | Perfect grid readability · breaks modern shadow cascades · "orthographic nausea" when rotated (*Tunic* dev report) |
| **Isometric (true)** | 30°/30° axes · 1:1:1 foreshortening | Monument Valley · classic tactical | Mathematical symmetry · 120° rotational freedom · pixel-art aliasing artifacts |
| **Dimetric (2:1)** | "Industry standard isometric" · ratio 2:1 horizontal/vertical | Most pixel "isometric" art (FF Tactics, Diablo) | Excellent terrain height readability · unit occlusion problem |
| **Trimetric** | All three axes foreshortened differently | Fallout 1 · pre-rendered sprite farms | High visual realism · expensive 3D-to-2D pre-rendering pipeline |
| **Oblique (cabinet)** | Front face true · depth at 45° foreshortened by half | Old JRPG town maps | Reads like architectural drawing · feels archaic |
| **Oblique (cavalier)** | Front face true · depth at 45° at full scale | Technical illustration | Volume reads correctly · scale exaggerated |
| **Near-Orthographic / Low-FOV Perspective** | Perspective camera · 10–20° FOV · pulled hundreds of units back | HD-2D (Octopath/Triangle Strategy) · Tunic | **Mimics ortho readability while preserving real-time depth-buffer for shadows + DOF** · the "miniature hack" |
| **2.5D** | Any 2D-rendered scene with perceived depth (parallax, billboards) | Old metroidvanias · web parallax | Cheap · fragile camera (rotation breaks the illusion) |

### 1.2 Layering & Composition

| Term | Definition |
|------|------------|
| **Planar diorama** | Scene composed of flat layers stacked at different depths · the Disney Multiplane Camera (1937) is the ancestor |
| **Billboard sprite** | 2D plane that always faces the camera · two flavors: cylindrical-yaw (rotates only on Y) and screen-space (always perfect square-on) |
| **Sprite stack** | Voxel model sliced into N horizontal 2D layers stacked with tiny Y-offsets · used by *Rusted Moss* and *Nium* · catches 3D light naturally |
| **Shadow proxy** | Invisible 3D mesh parented to a billboard sprite · sprite is "no shadow casting", proxy is "shadows only" · prevents the sprite shadow from spinning like a sundial when the camera rotates |
| **Depth card** | A textured plane placed at depth as a matte painting · standard in 3D animation backgrounds |
| **Octahedral impostor** | 3D model baked from many camera angles into a single 2D texture atlas · interpolated at runtime · what Epic ships for distant foliage |
| **Painterly impostor** | Same as above but stylized · uses dithering or temporal crossfade to hide the moment a baked angle "pops" |

### 1.3 Theatrical Composition

| Term | Definition |
|------|------------|
| **Forced perspective** | Renaissance stage technique · physical raked stages built behind proscenium arches to align painted flats with actor depth · echoed in modern shadow-proxy work |
| **Proscenium arch** | The frame around a stage that defines what's "on stage" vs offstage · in screens, the equivalent is HUD/world boundary |
| **Tilt-shift** | Photographic effect that mimics a miniature scale by aggressively shallow depth-of-field along a planar slice · UE's BokehDOF · "the macro photography hack" |
| **Diegetic UI** | UI elements that exist *inside* the game world (Inscryption's table, Tunic's manual) · vs HUD overlays |

### 1.4 Failure Modes To Name (DIG 2)

| Failure mode | What it looks like | Origin | Canonical fix |
|--------------|-------------------|--------|---------------|
| **Orthographic nausea** | Player feels physically disoriented when a strict-ortho camera rotates | *Tunic* dev report | Use Near-Orthographic (low-FOV perspective) instead |
| **Sundial shadows** | Billboard's shadow rotates with camera yaw · breaks ground contact | Naive billboard + light combo | Shadow proxy (invisible 3D mesh, shadows-only) |
| **Sub-pixel shimmer** | Pixel art shimmers when low-res sprites move through floating-point 3D space | Resolution mismatch | Snap 3D coords to virtual low-res grid (Hypersect/Juckett) |
| **Square shadow artifact** | Transparent billboards cast solid square shadows | Three.js default alpha-blended materials | `alphaTest={0.5}` on the meshStandardMaterial (Coldi/Colmen's Quest recipe) |
| **DOF breaks under ortho** | Depth-of-field shaders go synthetic / linear / wrong | True OrthographicCamera handles depth linearly | "Near-Orthographic" workaround — perspective at 10–15° FOV |
| **Impostor popping** | Texture suddenly snaps when crossing a baked-angle boundary | Octahedral impostor pipeline | Shader-based dithering or temporal crossfade |
| **OrbitControls / GSAP fight** | Camera animation glitches mid-tween | OrbitControls writes to camera each frame; GSAP also writes | Drei `<CameraControls>` with native `setLookAt` tweening |
| **React reconciler kill** | 60 re-renders/sec for moving units | useState in render loop | Zustand for transient state · `@react-spring/three` for physics outside render loop |

---

## 2. Decoded Paradigms (DIG 3 — what reference projects actually did)

Eight projects · what each chose · what mood it locks in · whether it
applies to cycle-1.

### Inscryption — "Diegetic Claustrophobia"
- **Camera**: locked first-person · inches above a physical card table
- **Resolution**: 960×540 (chosen to hide asset quality variance)
- **Mood lock**: tactile intimacy · captivity · escape-room foley
- **Cycle-1 fit**: ✗ — too tight a frame for our 5-zone overworld; we need to *show* zones, not tunnel
- **Stealable**: the principle that **frame constraint = mood lock**

### Citizen Sleeper — "Theatrical Tableau"
- **Camera**: overlapping flat planes · station as architectural diagram
- **Author**: Gareth Damian Martin (architectural critic before game dev)
- **Mood lock**: gig-economy stress · the world as "technical diagram, not home"
- **Cycle-1 fit**: ◐ — the flat-planes vocabulary is adjacent to what we already do with `tsuheji-map.png`; could deepen if we treat the map as a tableau, not a board
- **Stealable**: planes as *informational frames*, not surfaces

### Fantasian — "Permanent Level Design"
- **Camera**: photogrammetry-scanned over 150 physical dioramas built by Tokusatsu veterans
- **Mood lock**: museum exhibition · staged history · analog warmth
- **Cycle-1 fit**: ✗ — photogrammetry pipeline is way out of scope
- **Stealable**: the *grain of the analog* as an aesthetic axis · could inform texture/material choices on the cream island

### Octopath Traveler / Triangle Strategy — "Tilt-Shift Miniature" (HD-2D)
- **Camera**: Unreal Engine BokehDOF · perspective at low FOV pulled back · tilt-shift simulating macro-photography scale
- **Sprites**: 2D billboards in relief-like 3D geometry (the harness has *normal-mapped sprite* hooks for this)
- **Mood lock**: epic nostalgia · "model train layout" · world is *precious* because perceived as a physical toy
- **Cycle-1 fit**: ✓✓✓ — closest reference for what cycle-1 wants visually
- **Stealable**: **the entire Low-FOV-Perspective + tilt-shift recipe.** Our current `fov: 45` is the wrong knob — should be 10–20°.

### Tunic — "Perspective-Orthographic Hybrid"
- **Camera**: perspective "infinitely far away" · 10–15° FOV · slight tilt during shield-raise reveals hidden paths
- **Author**: Andrew Shouldice (solo dev · 7-year project)
- **Mood lock**: "geometric honesty" · world as "map come to life" · puzzle culture
- **Cycle-1 fit**: ✓✓ — Tunic and HD-2D arrive at the same camera math from opposite directions; convergence is signal
- **Stealable**: deliberate camera tilt as a *gameplay reveal mechanic* (cycle-2+ feature for revealing hidden zones?)

### Slay the Spire — "Frictionless Readability"
- **Camera**: rigid · non-overlapping · perspective-flat 2D card-game-with-map
- **Author**: Casey Yano · "the Intent System was the last piece of the puzzle"
- **Mood lock**: pure calculation · the screen as systems engineering interface
- **Cycle-1 fit**: ◐ — the principle (telegraph AI intent ON the scene) applies to cycle-2's NPC mood/pose system; not yet
- **Stealable**: **NPC reactions and zone state must be readable at-a-glance, not buried in tooltips**

### Loop Hero — "C64 Clinical Minimalism"
- **Camera**: top-down minimalist · 2D
- **Polish layer**: Garrett Gunnell (Acerola) CRT shader for phosphor bloom + scanlines + barrel distortion (*hides the harshness of the modern LCD grid*)
- **Mood lock**: cartography + systems engineering · "navigating a technical manual"
- **Cycle-1 fit**: ✗ for camera (we're 3D), ✓ for *post-process polish vocabulary* (CRT/film grain as mood lock)
- **Stealable**: a single carefully-chosen post-process effect can re-genre the scene

### Cult of the Lamb — "Pop-up Book Depth"
- **Camera**: 3/4 perspective with depth · 2D billboards in 3D frustum
- **Technical spine**: pivot-point depth sorting · Sorting Groups
- **Mood lock**: tactile cuteness with menace · pop-up book as visual metaphor
- **Cycle-1 fit**: ✓ — closest analog to our current top-down 3/4 starting point
- **Stealable**: pop-up book as *visual metaphor* for the cream island — flat substrate, things rise up out of it

---

## 3. R3F Implementation Gotchas (DIG 4 — what to do, what to avoid)

Direct ported from Coldi (Colmen's Quest) + Poimandres + Wawa Sensei evidence.

### 3.1 The "HD-2D R3F Recipe" (canonical for our target)

```
✗ Three.js native SpriteMaterial — fails dynamic light, no normal map support
✓ <Billboard> wrapping <mesh><planeGeometry /><meshStandardMaterial /> </mesh>
✓ Normal maps baked INTO the 2D sprite assets
✓ alphaTest={0.5} on the material  ← prevents square-shadow artifact + saves mobile GPU fillrate
```

### 3.2 The Orthographic DOF Trap

```
✗ <OrthographicCamera /> + post-processing DOF → broken / linear / synthetic
✓ <PerspectiveCamera /> at fov: 10–15 · positioned hundreds of units away
✓ <EffectComposer resolutionScale={0.5} /> for blur passes  ← halves GPU cost, visually indistinguishable
```

### 3.3 Camera Tweening

```
✗ OrbitControls + GSAP on camera.position  ← they fight, glitchy
✓ Drei <CameraControls /> with .setLookAt() native tweening
```

### 3.4 State Management For The Render Loop

```
✗ useState for unit positions / per-frame state  ← 60 re-renders/sec
✓ Zustand for transient state outside React reconciler
✓ @react-spring/three for physics (card flips etc.) outside render loop
```

### 3.5 Headline Quote (worth pinning)

> *"The HD-2D R3F pipeline is fundamentally an exercise in surgically
> bypassing default behaviors."* — DIG 4 emergence

This is the load-bearing truth. The R3F defaults are designed for spatial 3D
scenes; everything stylized requires deliberately tricking the engine.

---

## 4. Recommendation (OSTROM + EASEL grounded in cycle-1)

> ⚠ **Superseded by the Re-Grounding section at the top.** This recommendation
> assumed one camera for one "world map" surface and landed on HD-2D — which
> the operator rejected in-session. Per Gumi's pitch there are three surfaces
> (Battle / World-Map / Garden), each with a different camera. The
> populated-diorama direction this became is re-scoped to the **Garden** only
> (doc 09). The §4.x knob analysis below is still a useful worked example of
> *how* to tune an R3F camera — just not *the* answer.

### 4.1 Headline

> Adopt the **HD-2D Recipe** as cycle-1's R3F target. Frame the world map as
> a **theatrical tableau on a planar diorama** — not a tactical grid, not a
> free 3D world. Surface the existing `tsuheji-map.png` painted asset as the
> island substrate. Bias the camera to **Near-Orthographic** (perspective ·
> low FOV · pulled back) and add **tilt-shift DOF** as the primary mood lock.

### 4.2 Specific Knob Changes (cycle-1 minimum)

| Knob | Current | Target | Cite |
|------|---------|--------|------|
| Camera FOV | `fov: 45` | `fov: 15` (range 10–20° per Asano + Shouldice convergence) | DIG 1 + DIG 4 |
| Camera position | `[0, 7, 9]` | `[0, ~28, ~36]` (proportional pull-back to compensate FOV reduction · keeps framing constant) | math (tan(45/2) ≈ tan(15/2) × N → N≈3.8x) |
| Material | `meshStandardMaterial` on box geometry | Same material, but bake normal maps into asset textures | DIG 4 (Coldi recipe) |
| Island substrate | Procedural cream `<circleGeometry />` | Apply `tsuheji-map.png` as texture map on the disc plane | local asset audit |
| Post-processing | None | Add `@react-three/postprocessing` with `BokehDOF` at `resolutionScale={0.5}` | DIG 4 (Poimandres trap) |
| Camera controls | `<OrbitControls />` (commented out) | `<CameraControls />` with no manual input · just `setLookAt` tween hooks for cycle-2+ | DIG 4 |

### 4.3 What NOT To Do (boundary marking)

| Anti-pattern | Why not |
|--------------|---------|
| True `<OrthographicCamera />` for the readability win | Breaks DOF, breaks shadow cascades, "orthographic nausea" if ever rotated |
| Free `<OrbitControls />` enabled | Cycle-1 substrate doesn't need exploration; rotation reveals our 5-zone star is decoration-heavy |
| Sprite stacks for Sora Tower / Kaori | Voxel-stack pipeline is heavy for 2 characters; bake normal maps on flat billboards instead |
| Photogrammetry pipeline (Fantasian-style) | Months of physical-diorama work for assets; out of scope |
| Diegetic claustrophobia (Inscryption-style) | Frame too tight for 5-zone overworld; need to *show* the world |
| CRT shader as primary polish | Doesn't match wuxing/old-Horai aesthetic; tilt-shift is a better mood vector for our world |

### 4.4 What This Locks Out For Future Cycles

Be honest: choosing HD-2D commits us. If cycle-3+ wants to rotate the camera
freely, we'll have to rework. Worth naming the lock-in:

- **Locks out**: free camera orbit · spatial-reasoning gameplay · grid-based
  tactical placement · classical isometric pixel art aesthetic
- **Locks in**: theatrical/diorama framing · tilt-shift mood · top-down 3/4
  vantage as canon · "the world is a stage you observe" mental model

This is consistent with the operator's prior note about Purupuru as
"meta-world / observatory" (per memory `[[purupuru-world-org-shape]]`). The
camera locks in the *observatory* metaphor at the visual level.

### 4.5 What To Do Right Now (operator latency: ~30 min)

If the operator agrees, the smallest patch to validate the direction:

1. Add `?fov=15&far=36` query overrides to `WorldMap3D.tsx` — let the operator
   tune in browser without code edits
2. Apply `tsuheji-map.png` as a `useTexture(...)` on the `Island` plane
3. Install `@react-three/postprocessing` and add `<EffectComposer><DepthOfField /></EffectComposer>`
   with `bokehScale={4} focalLength={0.05} resolutionScale={0.5}`
4. Visual review — is the "miniature/diorama" feel landing?
5. If yes: bake the values into the canonical `WorldMap3D.tsx` defaults and
   write the visual reference cycle into the FEEL track for compass-cycle-2

If the operator wants a different paradigm (e.g., flatter Citizen Sleeper
tableau, or push toward Tunic's "geometric honesty"), that's a different
~30 min branch — same recipe, different knobs.

---

## 5. Open Threads (worth a future DIG when relevant)

Surfaced from the 4 digs but not pursued:

- **Itay Keren "Scroll Back" GDC math** — parallax layer scroll-speed ratios for if/when we add web-style scroll-driven world reveal
- **Octahedral impostor pipelines for distant foliage** — relevant if cycle-N adds a wider world map with crowd density
- **Maxime Heckel dithering / retro shading for web** — alternative post-process direction (PS1-aesthetic vs HD-2D)
- **`use-spritesheet` library** — Aseprite atlas optimization for animated chibi NPCs (cycle-2 Kaori animation work)
- **Hypersect Never's End isometric sorting** — Z-sorting depth-popping math for if/when we add deeper sprite stacks
- **Tokusatsu practical miniature techniques** — material/texture vocabulary for the analog-warmth axis
- **Garrett Gunnell (Acerola) shader case studies** — if we ever want a single-shader mood-shift system

---

## 6. Sources & Provenance

Full evidence trail with all 124 sources at:
`grimoires/k-hole/research-output/dig-session-2026-05-14.md`

Per-dig timing & depth:
| Dig | Topic | Time | Sources | Depth |
|-----|-------|------|---------|-------|
| 1 | Camera projection vocabulary | 232.8s | 34 | +++ |
| 2 | 2.5D-in-3D techniques | 156.2s | 27 | ++ |
| 3 | Reference project decoding | 651.8s (with retry) | 15 | +++ |
| 4 | R3F implementation gotchas | 219.1s | 30 | +++ |

All digs ran on `gemini-3-pro-preview` (resolves to gemini-3.1-pro-preview
server-side). Dig 3 surfaced and proved out the new CLI retry-on-timeout
patch (k-hole upstream commit `16d9771`).

---

*Status: candidate — promote to active context only after operator review.*
*Next gate: operator visual decision on §4.5 quick-validation patch.*
