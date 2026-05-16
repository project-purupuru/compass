---
status: UI mockup prompts (rewrite of asset-generation prompts)
type: visual prototyping for ChatGPT image — TASTE-TESTING, not asset production
supersedes: image-prompts-2026-05-12.md (asset-gen prompts retired per operator)
target_tool: ChatGPT image (DALL-E 3 / GPT image)
explicit_NO:
  - nano-banana
  - asset generation (Gumi is the artist)
  - in-game art (characters, scenes — those are Gumi's job)
goal: visualize game UI compositional approaches as concept-art mockups; operator picks favorites; agent implements matching CSS
operator_directive: |
  exploring Game UI · use dig script · ChatGPT image only · Gumi is artist
  be crazy. creative. loving... mad agent ai stuff that i don't even have the language for
author: claude (Opus 4.7 1M) — embodying THE MINT × THE EASEL × ARTISAN × ROSENZU
created: 2026-05-12
companions:
  - audit-feel-verdict-2026-05-12.md (the diagnosis)
  - registry-doctrine-2026-05-12.md (where mockup-driven variants live)
  - /kit/ui-explorer (live grid for drop-and-compare)
---

# UI Mockup Tasting Menu — Game UI exploration for Compass

> **You explore visually. Gumi paints the real art. I write the code.**
>
> This doc gives ChatGPT image **per-variant prompts** for game-UI exploration. Drop returned PNGs into `public/art/mockups/<screen>/<letter>.png` and visit `/kit/ui-explorer` to compare. Mark favorites. I implement.

## §0 · How to use this

```text
1. Open ChatGPT (image gen — needs Plus)
2. Paste ONE variant's prompt — get one 16:9 horizontal image back
3. Right-click → save as e.g. `public/art/mockups/lock/a.png`
4. Repeat for next variant
5. Visit http://localhost:3000/kit/ui-explorer to see them in grid
6. Mark favorites — I implement matching CSS
```

**Default aspect: 16:9 horizontal / desktop / landscape.** Purupuru is a horizontal app. Portrait mockups (mobile responsive) come later as a separate prompt pass once horizontal direction is locked.

## §0.5 · What Image #1 (the 2×2 grid trial) taught us

Operator generated §2.1 v1 (the 2×2 portrait grid). Findings:

| Diagnosis | Why it happened | Fix |
|---|---|---|
| All 4 tiles read as **portraits / book covers**, not as game screens | "Concept-art mockup" framing told ChatGPT image "make a poster"; 9:16 portrait amplified poster feel | Reframe as **"in-app screenshot of a desktop card game running in a browser window."** Different category for the model — different output. |
| The 4 tiles **stylistically harmonized** instead of being maximally different | The 2×2 grid trick makes the model render all 4 as a single composition with shared lighting/palette | **One prompt per variant** — operator's call. Each variant gets ChatGPT's full attention. |
| **UI elements were tiny accents** on big paintings (wordmark + small wuxing strip + tiny CTA) | Prompts said wordmark "small + confident NOT marketing chrome" — too far in the minimalist direction | Make UI **prominent + functional**: panel borders, status pills with chrome, button hover-states, persistent HUD rails. The scene is the BACKDROP; the UI is the FOREGROUND. |
| Scene/character was the **subject**; UI was peripheral | Vertical portrait composition with character in center invites poster framing | Horizontal 16:9 with **UI claiming the screen edges + corners** (top-left HUD, bottom hand-rail, right side status); scene/character occupies the middle as backdrop |

All §2 prompts below are rewritten under this discipline. Phase 1 = §2.1 (Lock screen). When operator confirms direction lands, Phase 2 extends the discipline to §2.2-§2.6.

## §1 · Anchor — Gumi's house style (the rule every prompt obeys)

From the asset audit, Gumi's style is:

- **Soft-painted Studio Ghibli warmth** — texture-rich, hand-drawn, NOT anime-cel
- **Caretaker × element pairing** — each of the 5 caretakers (Kaori-wood / Akane-fire / Nemu-earth / Ren-metal / Ruan-water) lives in their elemental time-of-day
- **Puruhani companion creatures** — every caretaker has a small element-themed creature pet
- **Bus-stop world setting** — Tsuheji's everyday surfaces (benches, lanterns, station roofs, tea-house eaves)
- **Chibi sticker treatment** — the stickers pack uses chunky-cute versions of the caretakers as emoji-marks
- **Cosmos-stars + grain-warm patterns** — universal atmosphere overlays
- **Kanji as ornament** — element glyphs (木火土金水) treated as calligraphic-ink not as system-font labels

**Every prompt below specifies "in the style of Gumi's existing Purupuru illustrations — soft-painted with hand-drawn warmth, like a Studio Ghibli film background fused with a Joe Hisaishi color palette." Don't drop this anchor.**

## §0.6 · Critique against THE MINT's `prompting-images` discipline — and what changes

I shipped §2.1 v2 (the 4 horizontal individual prompts) without first loading THE MINT pack's `prompting-images` SKILL.md. After loading it now, the v2 prompts fail roughly every discipline THE MINT teaches. Owning that:

### Where the v2 prompts violate THE MINT's rules

| # | THE MINT rule | What v2 did | Severity |
|---|---|---|---|
| 1 | **Four-block structure** — IMPORTANT DETAILS / REFERENCE GUIDANCE / USE CASE / CONSTRAINTS as literal section headers. The model parses structured input materially better than flat paragraphs. | v2 is flat prose: a 100-line opening narrative followed by an iteration-knob block. No headers. The model has to guess which adjective applies where. | **HIGH** — biggest single defect |
| 2 | **Size limits: `gpt-image-1` supports exactly 1024² / 1024×1536 / 1536×1024.** | v2 prompts request `2560×1440`. **That output doesn't exist** — the API will return its closest match without warning, and the operator may not notice the mismatch. | **HIGH** — broken on physics |
| 3 | **Composite-vs-Generate rule: NEVER ask the model to render brand marks, wordmarks, logos, readable text.** "The model will approximate and mangle every time." | v2 prompts say things like *"the signboard is painted with calligraphic ink reading 'purupuru'"* — explicitly asking the model to render the wordmark. Same for 'play' on the lantern, '木 火 土 金 水' on stones, 'today's tide' caption, 'continue last run' link. | **HIGH** — every variant will return mangled text |
| 4 | **Sanitization — strike named creators/franchises.** "anime key-visual in the style of [NAMED ARTIST]" is the failure pattern. | v2 explicitly cites *Studio Ghibli*, *Joe Hisaishi*, *Sable*, *Moebius*, *Spiritfarer*, *Inscryption*, *Slay the Spire* by name. Images 2.0's IP guardrails will either reject or sanitize these silently — and "Studio Ghibli" is exactly the kind of named-style reference that flags. | **MEDIUM** — partial generation likely; some named refs (Inscryption, Slay) are less risky than Ghibli |
| 5 | **Named treatments with `TREATMENT NAME: description` bullets.** The model "treats each as a named constraint to satisfy." | v2 has no `TREATMENT NAME:` bullets. Treatments are dissolved into descriptive prose. The model picks which to satisfy. | **HIGH** — treatments unenforceable |
| 6 | **OKLCH values, not color names.** "OKLCH constrains; names give drift room." | v2 mixes both: writes "fire-vermillion" / "sage-green" / "honey-amber" instead of `oklch(0.64 0.181 28.4)` etc. The OKLCH values exist in the asset's globals.css and I could have pasted them directly. | **MEDIUM** — palette drift expected |
| 7 | **Single-stamp discipline** — one accent per scene, named: *"Crimson ONLY on the horse sculpture. Nothing else is red."* | v2 names multiple warm points (active stone + lantern + sky-glow + companion sticker). The model will spread the accent. The single-stamp rule says: pick ONE locus, name it explicitly, exclude everywhere else. | **HIGH** — accent will be diffuse |
| 8 | **REFERENCE GUIDANCE block** — per-image role (composition anchor / style anchor / palette anchor / edit target). | v2 passes zero reference images. The composition `direct-render` was designed for reference-anchored prompts; without references, ChatGPT image free-rolls. Gumi's existing assets (`public/art/scenes/kaori-sakura.png` etc.) are perfect anchor candidates. | **HIGH** — biggest untapped lever |
| 9 | **CONSTRAINTS as tight per-element negatives** — "nothing else is red", "no readable text", "no 3D rendering". | v2 negatives are loose ("NO modern UI chrome / NO faces in detail / NO English text beyond the words listed"). The "beyond the words listed" allow-list contradicts rule #3. | **MEDIUM** |
| 10 | **USE CASE block** — where the image lands; include aspect ratio if it affects composition. | v2 mentions "in a browser window" but doesn't formally declare landing/aspect/crop intent as a discrete instruction. | **LOW** |

### The aggregated diagnosis

The v2 prompts read like a **director's brief to an illustrator** — vivid, narrative, atmospheric. THE MINT writes prompts like **a manufacturing spec to a CNC machine** — structured, numerical, with named treatments and hard negatives. Different artifacts for different machines. ChatGPT Image 2.0 is the CNC machine, not the illustrator.

### What v3 looks like — see §2.1.A-MINT below

I've rewritten §2.1.A (Inscryption-diegetic variant) in proper four-block format with all 10 disciplines applied. §2.1.B/C/D will get the same treatment after operator confirms direction.

Key shifts:
- **Four explicit section headers** (`IMPORTANT DETAILS` / `REFERENCE GUIDANCE` / `USE CASE` / `CONSTRAINTS`)
- **Six named treatments** with `TREATMENT NAME:` bullet pattern
- **OKLCH values** for the wuxing palette per region
- **Single-stamp discipline** — today's element vivid is the ONLY accent; everything else cream/ink/dim. Named explicitly.
- **Composite-vs-Generate** honored — wordmark, "play" text, kanji are NOT requested from the model. Marked as "composited locally in post." Model renders the signboard SHAPE without legible text.
- **Sanitization** — named creator references removed and replaced with material descriptors (`Studio Ghibli` → "soft-painted background illustration with visible brush texture, hand-drawn warmth")
- **Size 1536×1024** (the actual landscape max)
- **REFERENCE GUIDANCE block** ready for operator to drop a Gumi asset as composition anchor (placeholder until then)
- **Tight CONSTRAINTS** — per-element negatives, no allow-list contradiction

## §1.5 · Dig finding — five East-Asian UI patterns Purupuru should actually consider

(From a depth-2 dig on wuxing/East-Asian game UI craft, 18 sources synthesized via `dig-search.ts`.)

1. **Pomo (破墨, "broken ink") UI shaders** — used in *Tale of Wuxia* for UI transitions. Wet-on-wet ink bleeding **replaces Gaussian blur**. Surface change reads as ink soaking, not as a CSS filter. For Purupuru's screen transitions (lock → quiz → arrange → clash → result), pomo bleed is the period-correct vocabulary. *Variant prompts below ask for this explicitly.*

2. **Yinzhang (印章, cinnabar seal) confirm-button** — *Tale of Wuxia* replaces the Western "checkbox / confirm" UI primitive with the act of stamping a red cinnabar seal. The CTA isn't a rectangle button — it's a hanko press. **This is the lock-screen CTA replacement.** Variant prompt §2.1 tile B now asks for this.

3. **Liubai (留白, white space as medium of flow)** — *Sky: Children of the Light* treats white space NOT as emptiness but as the surface that ritual moves across. Sky's UI uses **symbolic rituals (light a candle, place a stone)** instead of text labels. Purupuru's lock screen already has ELEMENTAL STONES as a planted metaphor — promote them to ritual-objects-the-player-touches rather than passive glyphs.

4. **Jianjia Jiegou (间架结构, calligraphic frame-structure)** — the architectural logic of how a kanji is internally balanced (the "nine palaces grid" / 九宫格) maps directly to **modular UI grid systems**. ZCOOL designers use this as their compositional discipline. Purupuru's 5-element battlefield already wants to be a 5-stone bench — the nine-palace grid offers a calibrated discipline for arranging 5 cards across a horizontal layout.

5. **Sheng/Ke as functional UI state, not skin** — *Amazing Cultivation Simulator* (Liao Qiuyue) and *Sifu* (Paul-Emile Boucher) treat the wuxing generative/destructive cycles as the actual ENGINEERING substrate for UI state machines. Purupuru already has SHENG/KE imports in `lib/honeycomb/wuxing.ts`. **The UI's color shifts, transitions, and pulse-rates should be driven by Sheng/Ke events, not by abstract "UI animation."**

Pull threads for follow-up dig (operator can fire):
- "Pomo broken-ink UI shaders in WebGL / CSS"
- "Bone Method (骨法用笔) pressure-sensitive easing curves for digital UI"
- "Nine Palaces grid (九宫格) modular layout for mobile games"

## §1.6 · Dig finding — card-game HUD craft discipline (drives my implementation, not the mockups)

(From a depth-2 dig on card-game HUD layout patterns + readability discipline, 10 sources synthesized.)

These are **implementation rules** for me when the operator picks a mockup direction — they don't change what the mockup looks like, but they shape how the live UI behaves.

1. **Slay the Spire's "Intent System"** — the enemy telegraphs their NEXT action with an icon + number above their portrait. Shifts cognitive burden from guessing to calculation. **Compass equivalent:** opponent reveal-stage should telegraph WHICH lane will clash next, with the matchup preview (e.g., "fire vs water — Kè") before the clash fires.

2. **Inscryption's "Sigil Discipline"** — complex card text is reduced to intuitive icons. **Compass equivalent:** combo/condition effects on cards should be SIGILS, not text. We already have element kanji as glyph-icons; extend to combos.

3. **Cobalt Core's "Positional Transparency" + "Predictive Previewing"** — actions show their outcome BEFORE commit. **Compass equivalent:** the arrange phase already does this conceptually (you see the lineup before locking in), but we could go further — hover/long-press a card to see "if I play this here, vs that next, the chain will trigger X."

4. **"Focal Intent"** — exactly ONE dominant objective per screen. **Compass equivalent:** the audit-feel verdict already flagged this for Lock + Quiz. Each phase of /battle should have one clear focal verb: ENTRY = "begin", QUIZ = "pick", ARRANGE = "order", CLASH = "watch", RESULT = "rest".

5. **"Motion with Purpose"** — animations serve functional roles in teaching or communicating, never decoration. **Compass equivalent:** every motion in /battle should answer "what does this teach the player?" The tile-btn anticipation breathe I added teaches "this is ready, breathe with it." The wuxing-strip's active-glyph lift teaches "today's element is THIS." Good.

These rules go in my pocket. When the operator picks a mockup, I implement against them.

## §2 · The 6 prompts (each = one 2×2 grid)

Each prompt produces 4 layout variations of ONE screen. Six prompts × 4 variants = **24 visual options** to taste-test.

> All prompts are written for **ChatGPT image** specifically. They lean on natural language, avoid model-specific parameter strings, and ask for one composite image showing 4 variations.

---

### §2.1 v4 — LOCK SCREEN · 2D vibe-space gradient descent (indie-grade-UI basin)

> **v4 supersedes v3 (§2.1.A-D below).** The v1→v3 lesson trail lives in §0.5/§0.6. v4 keeps everything THE MINT discipline gave us (four-block structure · named treatments · OKLCH · single-stamp · composite-vs-generate · 1536×1024) and reorganizes the variant ANCHORS from named indie games (Inscryption / Spiritfarer / Slay / Sable) into **2D vibe coordinates** so the variants step across a continuous space.
>
> **Operator directive:** "Sweeping across the vibe space sounds like how we should approach this from a gradient descent POV."

#### §2.1 v4.0 · The 2D vibe space (indie-grade-UI basin)

Two axes. Each variant samples one corner.

```
                          PAINTERLY-WARM
                  (oil-paint · brush · ink-bleed)
                                ▲
                                │
                                │
                       Q1 ●     │     ● Q4
                     v4.D       │     v4.B
                  WOOD/DAWN     │   FIRE/DUSK
                                │
WORLD-IMMERSION ◀───────────────┼───────────────▶ GAME-CHROME
 (scene IS UI)                  │                (UI claims edges)
                                │
                       Q2 ●     │     ● Q3
                     v4.A       │     v4.C
                  WATER/RAIN    │   METAL/NIGHT
                                │
                                │
                                ▼
                          GRAPHIC-COOL
                (flat-color · line-art · vector)
```

**Image #4 lives between Q1 and Q4** — chrome-leaning painterly with fire-dusk weather. That hybrid breakthrough informs the space; v4 explores the OTHER three corners + gives you a Q4-baseline so you can see the corners cleanly mapped.

**Element + time-of-day vary per variant** so element-vibe is layered on top of UI-vibe:

| Variant | Vibe corner | Element | Time-of-day | Reference cousins |
|---|---|---|---|---|
| **v4.A** | Q2 — IMMERSION × GRAPHIC | water | rain at twilight | Sable, Cocoon, Tunic (clean line over flat color) |
| **v4.B** | Q4 — CHROME × PAINTERLY | fire | dusk station | Slay-the-Spire painted chrome, Hades portrait HUD |
| **v4.C** | Q3 — CHROME × GRAPHIC | metal | autumn night | Cobalt Core, Into the Breach, Monster Train clean panels |
| **v4.D** | Q1 — IMMERSION × PAINTERLY | wood | spring dawn | Inscryption diegetic table, Spiritfarer painted moment |

**Why this is gradient descent:** fire 4 cold-mode prompts → you pick the favorite (the loss minimum) → next round (v5) I author 4 NEW variants sampling AROUND that point at finer grain. Convergence in ≤3 rounds typically.

#### §2.1 v4.0 · How to fire (cold-mode workflow)

```text
1. Open ChatGPT image in a FRESH chat (cold mode → max variance between
   variants). Repeat for each variant in a new chat.
2. For each variant: attach the suggested Gumi reference images
   (REFERENCE GUIDANCE block lists exact paths). Drag them in before
   pasting the prompt text.
3. Paste the variant's IMPORTANT DETAILS / REFERENCE GUIDANCE / USE
   CASE / CONSTRAINTS prompt.
4. Save the return as public/art/mockups/lock/<letter>.png.
5. Visit /kit/ui-explorer when all 4 are dropped.
6. Tell me which one (or which combo) lands. I'll fire v5 sampling
   around that vibe-space point.
```

**Asset references at hand** (used in the REFERENCE GUIDANCE blocks):

| Tier | Asset path | Role per the MINT skill |
|---|---|---|
| Style anchor | `public/brand/characters/{ruan,akane,ren,kaori}.png` (full-body fineart portraits Gumi painted) | inherit brush quality, soft-painted register |
| Style anchor | `public/art/stickers/chibi-{ruan,akane,ren,kaori}-{element}.png` (chibi sticker versions) | inherit mascot-corner register if Q3/Q4 |
| Composition anchor | The previously-generated Image #4 (operator's local copy of the C-variant breakthrough) | MATCH COMPOSITION EXACTLY for the chrome corners; layout baseline |
| Palette anchor | `public/art/cards/scene-card-{element}.png` (the Tsuheji elemental scene-cards) | inherit OKLCH wuxing palette per element |

---

#### §2.1 v4.A — Lock screen · Q2 IMMERSION × GRAPHIC · water/rain/twilight

```
IMPORTANT DETAILS

A wide-landscape in-app screenshot of a desktop card game's lock screen,
captured from a working game UI — not concept art, not a poster. The
viewport is a 16:9 desktop browser window.

The scene: a single continuous Tsuheji harbor bus-stop at rainy twilight.
Rendered in a soft-graphic register — flat-color fills with clean black
ink-outline shading, like a hand-drawn animation cel layered over a
watercolor wash. NOT photorealistic. NOT 3D. NOT painterly-impressionist.
Visible ink-brush outlines around the silhouettes; flat interior fills
with subtle gradient transitions. Imagine a contemporary indie game's
soft graphic register sitting between watercolor and Moebius line-art.

Horizontal composition — the entire scene IS the UI (Q2 of the vibe
space: world-immersion + graphic-cool). NO frame-border chrome wrapping
the viewport. Game elements live as diegetic objects integrated into
the painted-flat scene.

  LEFT REGION (occupies left 38% of frame):
  A glass-and-steel harbor bus-stop pavilion drawn with clean black
  outlines, flat indigo-pastel roof fills, and a translucent rain-
  sheeted upper canopy. A weathered cream signboard hangs from the
  pavilion post. The signboard surface is INTENTIONALLY BLANK CREAM
  with subtle ink-wash weathering and a small red hanko-stamp square
  in oklch(0.45 0.18 15) — no text rendered on the signboard. The
  wordmark is composited locally in post.

  CENTER REGION (occupies center 30%):
  A clean-line stone bench with five smooth pebble-shaped stones in
  a horizontal row, each carved into a distinct abstract geometric
  shape — no legible kanji inscribed. ONE stone (the leftmost) emits
  a deep water-vivid glow at oklch(0.53 0.18 266.2), with light
  diffusing outward in soft ink-wash bleed over the bench surface.
  The other four stones are dim oklch(0.45 0.01 260) — flat dim-ink
  shadow.

  RIGHT REGION (occupies right 32%):
  A translucent paper umbrella propped against the pavilion edge,
  catching puddle-light from below in the same water-vivid oklch
  (0.53 0.18 266.2) — this is the diegetic "play" affordance. The
  umbrella surface is BLANK cream with hand-drawn ink-line ribs and
  a small subtle highlighted-edge halation suggesting interactivity.
  The "play" word gets composited in post. Below the umbrella, a
  small blank wooden plaque for the "today's tide" caption (also
  composited).

  BACKGROUND (fills behind all three regions):
  A Tsuheji harbor town rendered in 4-5 flat-color depth planes:
  near-pier ink-line silhouettes, mid-ground distant boats with
  yellow port-lights, far-shore mountain pastels in oklch(0.65 0.03
  85), and a rain-veiled sky in cool water-pastel oklch(0.88 0.06
  230) at horizon fading to water-dim oklch(0.38 0.15 266.2) at
  zenith. Heavy rain rendered as slanting clean ink-strokes across
  the upper-third — NOT painted droplet realism, ink-line shorthand.

Lighting: dual-source motivated lighting — cool indigo wash from the
rain-veiled sky dominates; a single warm street-lamp (off-frame to
the right) casts a small pool of amber-grounding warmth on the bench
center (the warm-point counterpoint). The COOL-LEANING variant of
the four.

Apply the following 6 treatments:
  - INK-LINE OUTLINE: every silhouette is bounded by a clean dark
    ink stroke, varying weight by importance — heavy on pavilion +
    bench, medium on stones + umbrella, light on background hills.
    NOT consistent-width vector — hand-drawn ink with subtle taper.
  - FLAT-COLOR INTERIOR: silhouettes filled with flat or subtle-
    gradient color blocks. NO realistic shading or volumetric light
    inside silhouettes.
  - POMO INK-WASH (limited): only the active water-stone and the
    umbrella interior emit a soft ink-bleed halation — Pomo broken-
    ink soaking outward into the cream signboard / bench wood. The
    rest of the scene is clean-line.
  - RAIN-LINES: slanting ink-strokes drawn across the upper sky,
    NOT painted droplets. Approximately 40-degree slant, varying
    densities, heaviest in the upper-right.
  - DIEGETIC IMMERSION: NO floating UI panels, NO frame borders
    around the viewport. The viewport edges fade subtly into the
    sky / pavement at top and bottom.
  - GRAPHIC HARMONY: 4-5 distinct color values total. Each region
    holds its color tightly — no painterly soft-blending.

Palette discipline (per-region OKLCH, hard):
  - cream paper (signboard + umbrella + plaque): oklch(0.97 0.01 90)
  - ink outline + dim-stones + bench shadow: oklch(0.18 0.02 260)
  - wood-warm pavilion frame: oklch(0.65 0.03 85)
  - rain-sky upper: oklch(0.38 0.15 266.2)
  - rain-sky horizon: oklch(0.88 0.06 230)
  - distant hill pastel: oklch(0.65 0.03 85)
  - SINGLE STAMP — water vivid: oklch(0.53 0.18 266.2) on the
    active stone AND inside the umbrella ONLY. Nothing else
    saturated. The off-frame street-lamp's amber pool is at
    oklch(0.82 0.14 85) but reduced to 25% opacity (atmospheric,
    not accenting).
  - hanko square: oklch(0.45 0.18 15) — the only deep red.

REFERENCE GUIDANCE

Attach 2-3 reference images when firing this prompt:
  reference 1 (style anchor): public/brand/characters/ruan.png —
    Ruan in navy-indigo raincoat. INHERIT BRUSH AND OUTLINE
    QUALITY from this image. Don't render her in the output;
    use her as the line-discipline anchor.
  reference 2 (composition anchor, optional): the operator's
    previously-generated lock-screen image (Image #4) —
    INHERIT THE HORIZONTAL UI-REGION LAYOUT (left signboard +
    center stones + right CTA + background vista). Don't copy
    its painterly warm register; render the same layout in this
    variant's graphic-cool register.
  reference 3 (palette anchor, optional): public/art/cards/
    scene-card-water.png — inherit the water-element OKLCH
    palette register.

USE CASE

Mockup of the lock screen for a horizontal-first desktop card game,
WATER weather variant, GRAPHIC-COOL aesthetic. Lands behind the live
React UI at the /battle entry phase. Output: 1536×1024 px landscape.
The wordmark, "play" label, kanji glyphs, and tide caption are ALL
composited locally with rsvg-convert + magick — render BLANK surfaces.

CONSTRAINTS

  - No readable text anywhere. Signboard, umbrella, plaque, stones
    are intentionally blank.
  - No frame-border chrome wrapping the viewport (Q2 is
    immersion — scene IS UI).
  - No detailed faces.
  - No 3D-rendered surfaces. No photographic rain droplets.
  - Single-stamp enforcement: water-vivid oklch(0.53 0.18 266.2)
    appears ONLY on the active stone + inside the umbrella. Hanko
    red oklch(0.45 0.18 15) appears ONLY on that one square.
    Nothing else saturated.
  - No legible inscriptions on any surface.
  - No painterly oil-paint or impressionist soft-blending — this
    variant is GRAPHIC-COOL.
  - Output exact size: 1536×1024 pixels.
```

**Iteration knobs:**
- Push graphic-cool harder → "INK-LINE OUTLINE weight increased; FLAT-COLOR INTERIOR posterized further; reduce gradient transitions to 3 discrete tones per region."
- Soften back toward painterly → reduce ink-line weight, add POMO INK-WASH treatment to more regions.
- Swap weather → re-fire with water → metal at autumn night (different element, same Q2 vibe corner).

---

#### §2.1 v4.B — Lock screen · Q4 CHROME × PAINTERLY · fire/dusk/station-platform

```
IMPORTANT DETAILS

A wide-landscape in-app screenshot of a desktop card game's lock screen,
captured at 16:9 (2560×1440 conceptual aspect, rendered at 1536×1024).
NOT concept art. A working game UI.

The game is "Purupuru." Style: soft-painted with hand-drawn warmth and
visible brush texture — oil-paint-meets-Toon-Boom-2D-animation register.
Visible volumetric haze and rim-light. NOT anime cel-shading. NOT 3D.

This is Q4 of the vibe space — CHROME × PAINTERLY. The Slay-the-Spire-
painted-chrome corner. UI elements claim ALL FOUR screen edges as
painted-wood frame components; the painted scene fills the interior
viewport. Image #4 lives in this vibe basin; v4.B explores it more
deeply with the FIRE element + a more pronounced HUD chrome.

Horizontal composition:

  ALL FOUR EDGES — painted wooden game-UI frame:
    - TOP-LEFT (occupies upper-left ~22% × ~28%): a weathered
      wooden hanging signboard mounted to the frame, surface
      INTENTIONALLY BLANK CREAM, small red hanko square at
      lower-right corner. Wordmark composited in post.
    - TOP-RIGHT (occupies upper-right ~32% × ~22%): a horizontal
      painted parchment strip mounted to the frame, holding a
      row of 5 element-stones (abstract carved shapes, NO legible
      kanji). The vermillion-fire stone glows vividly. Above the
      strip, a small blank caption tag for "today's tide" (text
      composited later). To the right of the strip, a small
      carved-bronze caretaker portrait-medallion — placeholder
      circular bust avatar of a hooded young woman in vermillion
      (DON'T render her face — leave the medallion painted with
      a silhouette only).
    - BOTTOM-EDGE (occupies bottom ~14%): a horizontal painted
      wooden plank acting as the HUD bar. Center: a LARGE
      glowing amber CTA shape (painted-wood pill-button, BLANK
      surface — "play" text composited locally). To its left and
      right, two smaller blank parchment plaques for secondary
      nav buttons (also blank — "rules" / "map" composited).
    - BOTTOM-RIGHT CORNER: a small hanging paper lantern, lit
      from inside with the same vermillion oklch(0.64 0.181
      28.4) as the active stone (single-stamp coupling).

  CENTER VIEWPORT (the painted scene framed by the four edges):
    A Tsuheji station-town at sunset. A low iron-frame railway-
    station bench in the mid-distance with a small brazier of
    glowing embers (also vermillion) beside it. The platform
    recedes to a railway-line vanishing point. Sun has just
    dropped behind distant station-town silhouettes; sky moves
    from vermillion at horizon through fire-pastel and a sliver
    of metal-violet at zenith. Power lines cross-hatch the upper
    third like ink calligraphy strokes. Optional: a small caretaker
    silhouette walking toward the platform (rear view, no
    features), at scale 7% of frame height.

Lighting: sunset rim-light from the upper-right; the painted-wood
frame edges catch warm copper highlights along their inside ridge
(this is what makes the chrome READ as wood, not as a CSS panel).
The brazier embers and the active wuxing stone share the vermillion
warm-point identity. Long copper-edged shadows across the platform.

Apply the following 7 treatments:
  - PAINTED-WOOD FRAME: the four-edge UI chrome reads as carved
    weathered wood with visible grain, plank joints, and brass-
    nail studs at the corners. NOT a flat rectangular CSS panel.
  - INSIDE-EDGE COPPER RIM: the inside edges of all wooden frame
    panels catch a thin warm-copper rim-light. This is what sells
    the painted-volume material.
  - POMO HALATION: the active vermillion stone + the brazier +
    the bottom-corner lantern + the play-CTA all emit soft
    Pomo-style halation (wet-on-wet ink bleed) at their edges.
    8-12px of soft bleed outward. NOT a Gaussian blur.
  - MATERIAL HONESTY: every surface declares what it IS — wood
    grain, parchment fiber, paper lantern translucency, metal
    bench iron, brass-nail studs at the wooden plank corners.
  - HANKO STAMPS: every blank cream surface intended for text
    bears one small red hanko square in the corner, signaling
    "this is where the wordmark will be applied in post." Color
    oklch(0.45 0.18 15). Three such hankos in total across
    signboard + caption strip + play-CTA.
  - CARETAKER PORTRAIT-MEDALLION: top-right HUD strip's small
    circular bust is hand-painted with the silhouette of a
    hooded figure in vermillion robes. NO facial features rendered.
    A small painted bronze-leaf ring frames the medallion.
  - BROWSER-WINDOW VIGNETTE: the entire output has a subtle
    8-pixel vignette at the four corners suggesting the browser
    chrome that wraps the viewport. Not a hard border.

Palette discipline (per-region OKLCH, hard):
  - painted-wood frame: oklch(0.65 0.03 85) base, with inside-edge
    rim at oklch(0.82 0.14 85) at 30% blend.
  - cream parchment (signboard + caption + play-CTA surfaces):
    oklch(0.97 0.01 90)
  - dim ink (shadow + dim-stones + power lines): oklch(0.18 0.02
    260) for line, oklch(0.45 0.01 260) for dim
  - sunset sky horizon: warm-pink-cream oklch(0.95 0.018 45)
  - sunset sky zenith: metal-pastel sliver oklch(0.82 0.06 310)
  - distant station-town silhouettes: dim-violet oklch(0.45 0.01
    260)
  - SINGLE STAMP — fire vivid: oklch(0.64 0.181 28.4) on the
    active wuxing stone, brazier embers, paper lantern interior,
    AND play-CTA glow. These four loci are the single-stamp
    cluster — all the same exact value. Nothing else saturated.
  - hanko square × 3: oklch(0.45 0.18 15) — the only deep red.

REFERENCE GUIDANCE

Attach 2-3 reference images:
  reference 1 (composition anchor): the operator's previously-
    generated lock-screen image (Image #4). MATCH ITS UI-CHROME
    LAYOUT EXACTLY — same wood-frame discipline, same
    top-left wordmark sign, same top-right wuxing strip with
    chibi medallion, same bottom plank with center CTA + flanking
    nav. Inherit its wood-grain quality. Variant change: weather
    interior (fire/sunset), more pronounced chrome density,
    visible station-platform setting.
  reference 2 (style anchor): public/brand/characters/akane.png —
    Akane in vermillion kimono. INHERIT BRUSH QUALITY and
    color-temperature register. Don't render her face; use as
    the painted-warmth anchor.
  reference 3 (palette anchor, optional): public/art/cards/
    scene-card-fire.png — inherit fire-element OKLCH register.

USE CASE

Mockup of the lock screen, FIRE weather variant, PAINTERLY-CHROME
aesthetic. The Hearthstone-tier-pushing variant — chrome dense and
prominent on every edge, painted-warm interior scene moderately
recessed. Lands at /battle entry phase. Output: 1536×1024 px.
Wordmark + play label + kanji + tide caption all composited locally.

CONSTRAINTS

  - No readable text anywhere. All cream surfaces are blank.
  - Painted-wood-FRAME chrome on ALL FOUR edges is mandatory
    (this variant is Q4 chrome). NOT a single panel — full
    four-edge frame.
  - No detailed faces. Caretaker silhouette is a small dot;
    portrait medallion is bust-silhouette only.
  - No 3D-rendered or photographic surfaces.
  - Single-stamp: vermillion oklch(0.64 0.181 28.4) on the 4-
    object cluster (stone + brazier + lantern + CTA). Hanko
    red oklch(0.45 0.18 15) on the 3 hanko squares. Nothing
    else carries saturated color.
  - No 'modern game UI' visual references — no Material Design,
    no glassmorphism, no flat sans-serif chrome.
  - Output exact size: 1536×1024.
```

**Iteration knobs:**
- Push chrome density further → "add a vertical wooden side-rail at the LEFT EDGE holding 3 carved-wood small icons (settings as a wind-chime, profile as a small carved bell, notifications as a hanging tassel)."
- Soften the frame back toward Image #4 → "reduce chrome to 3 edges (top + bottom + bottom-right corner) — leave the LEFT EDGE breathing open into the scene."
- Swap weather → re-fire with fire → earth at midday (different element, same Q4 vibe).

---

#### §2.1 v4.C — Lock screen · Q3 CHROME × GRAPHIC · metal/night/autumn-forest

```
IMPORTANT DETAILS

A wide-landscape in-app screenshot of a desktop card game's lock screen,
captured at 16:9 (rendered 1536×1024). A working game UI — NOT concept
art, NOT a poster.

Style: this variant is Q3 — CHROME × GRAPHIC. The Cobalt-Core-clean
+ Into-the-Breach-readability corner. Painted UI panels with clean
graphic edges; the scene becomes a recessed flat-color backdrop.
Indie-grade but with prominent functional UI density. The most
"video-gamey" of the four variants while still staying inside indie
register — NOT AAA-corporate, NOT Material Design.

Horizontal composition — UI panels claim significant real estate;
scene fills the negative space:

  TOP STRIP (occupies upper ~16% across full width):
  A horizontal painted-metal HUD bar that spans the viewport. Made
  of dark-plum-violet steel oklch(0.18 0.02 260) with subtle brass-
  trim line-work along the bottom edge. Holds, left to right:
    - LEFT: rectangular blank-cream wordmark slot with a small
      red hanko square corner. NO text rendered.
    - CENTER: 5-stone wuxing strip in a row, each stone as a clean
      hexagonal carved-metal disc. The metal-vivid stone glows
      plum-violet. Stones are arranged with even spacing on a
      darkened parchment strip behind them. Above the strip, a
      tiny blank caption tag.
    - RIGHT: a circular brass medallion frame with a hooded
      silhouette inside (caretaker avatar — no facial features),
      and beside it 3 small functional indicator dots (player-
      status / deck-count / notification — three small painted
      stones, dim, only one glowing softly if 'new').

  BOTTOM STRIP (occupies lower ~13%):
  A second horizontal painted-metal bar, same dark-plum register,
  holding a centered LARGE blank cream CTA pill (where "play" gets
  composited) and flanking blank smaller plaques for secondary nav.
  The CTA pill emits a soft plum-violet glow at its outline.

  LEFT VERTICAL RAIL (occupies upper-mid 6% × ~40%):
  A narrow vertical wooden side-rail (different material from the
  top/bottom metal — wood + brass). Holds 4 small carved icons in
  a vertical stack: each a distinct abstract carved shape (NO
  legible glyphs). One has a small glowing indicator. This is the
  navigation/menu rail. Settings / Collection / Friends / Map are
  the conceptual mappings but render as ABSTRACT CARVED SHAPES.

  CENTER VIEWPORT (occupies center 70% × 56% of frame):
  A recessed Tsuheji autumn-forest-edge scene at night. Limited
  palette: deep-night ink-violet sky with stars at oklch(0.97
  0.01 90) cream-dots, leafless tree silhouettes in
  oklch(0.45 0.01 260), distant chimney-smoke columns warm-lit
  from below in oklch(0.82 0.14 85). Cleaner-line shading than
  v4.A (this is Q3 graphic, not Q2 graphic) — silhouettes have
  flat fills but slightly varied gradient. Optional: tiny
  caretaker rear-silhouette walking down the path with a brass
  lantern.

Apply the following 6 treatments:
  - CLEAN-METAL CHROME: top + bottom HUD bars are painted-metal
    flat-fill with subtle brass-line trim. NOT wood-grain (v4.B's
    register). NOT cartoon-flat — clean-painted-game-UI register.
  - GEOMETRIC STONE DISCS: the wuxing-strip stones are hexagonal
    carved-metal discs. Each disc has a clean black ink-line
    silhouette + a flat plum-pastel fill. The active stone has
    an inner gradient suggesting carved-relief.
  - CLEAR-INK ICON SET: the 4 left-rail icons are crisp ink-line
    silhouette shapes filled with brass-pastel oklch(0.82 0.14
    85) at 40% opacity. Variable line-weight, abstract shapes.
  - LANTERN GLOW (single-stamp warm secondary): the off-frame
    chimney-smoke columns are warm-lit from below at oklch(0.82
    0.14 85) at 60% blend — this is the SECOND warm point
    (subordinate to the metal-vivid stamp).
  - SCENE RECESSION: the autumn-night interior is rendered with
    deliberate flatness — 4-5 color stops total, clean ink-line
    edges on tree silhouettes, NO painterly soft-blending. The
    scene is the BACKDROP; UI bars are the FOREGROUND.
  - SUBTLE GLOW HOVER STATES: the play-CTA pill, the active
    wuxing stone, and the single 'new' indicator on the left
    rail all carry a subtle outline-glow suggesting cursor-
    hover potential. Slay-the-Spire-readability vocabulary.

Palette discipline (per-region OKLCH, hard):
  - HUD-metal dark base: oklch(0.18 0.02 260)
  - HUD-metal brass trim line: oklch(0.82 0.14 85) at 30%
  - cream parchment (wordmark/CTA/caption blanks): oklch(0.97
    0.01 90)
  - autumn-night sky: deep ink oklch(0.18 0.02 260) at zenith
    fading to plum-pastel oklch(0.82 0.06 310) near horizon
  - leafless tree silhouettes: oklch(0.45 0.01 260)
  - chimney-smoke warm pool: oklch(0.82 0.14 85) at 60%
    (atmospheric, subordinate)
  - SINGLE STAMP — metal vivid: oklch(0.52 0.126 309.7) on
    the active wuxing stone, the play-CTA outline glow, and
    the single 'new' notification indicator. These are the
    primary stamp cluster. Nothing else at this saturation.
  - hanko square: oklch(0.45 0.18 15) — only deep red, only
    on the wordmark blank's corner.

REFERENCE GUIDANCE

Attach 2-3 reference images:
  reference 1 (composition anchor): Image #4 — MATCH ITS
    four-edge HUD coverage. Variant change: replace painted-wood
    frame with painted-metal flat-graphic bars. Render the SAME
    spatial layout (wordmark TL, wuxing strip TR, play-CTA
    centered bottom, vertical nav rail left).
  reference 2 (style anchor): public/brand/characters/ren.png —
    Ren in plum-violet wool coat. INHERIT THE PLUM-VIOLET
    COLOR-TEMPERATURE register. Don't render him in output.
  reference 3 (style anchor optional): a Cobalt-Core or Into-the-
    Breach screenshot the operator drops in — INHERIT THE CLEAN
    PAINTED-METAL HUD REGISTER. NOT for direct copying — for
    register calibration.

USE CASE

Mockup of the lock screen, METAL weather variant, GRAPHIC-COOL
CHROME-DENSE aesthetic. The most prominent-HUD variant — chrome
covers ~30% of total frame real estate. Output: 1536×1024 px.
All readable text composited locally.

CONSTRAINTS

  - No readable text anywhere. Wordmark / CTA / caption / icon
    glyphs are all BLANK shaped surfaces.
  - Top + bottom HUD bars are painted-metal flat-graphic (NOT
    wood-grain — v4.B has wood, v4.C has metal as the
    differentiator).
  - No detailed faces. Caretaker silhouette is dot-scale.
  - No 3D-rendered or photographic surfaces.
  - No Material Design / glassmorphism / corporate-flat
    register. Indie-grade graphic-painted only.
  - Single-stamp: metal-vivid oklch(0.52 0.126 309.7) on the
    3-object cluster (stone + CTA outline + notification dot).
    Chimney-amber is subordinate warm secondary. Hanko red is
    only on the wordmark blank. Nothing else saturated.
  - No painterly oil-paint soft-blending.
  - Output exact size: 1536×1024.
```

**Iteration knobs:**
- Push graphic-cool further → reduce gradient steps in scene to 3 flat fills; sharpen ink-line edges throughout.
- Push chrome density further → "add a fifth HUD element — a small horizontal tide-meter ribbon under the wuxing strip, calibrated W-L-D record."
- Swap to different element while keeping Q3 → re-fire with metal → fire at sunset (this gives a v4.B vs v4.C-fire delta showing PAINTERLY vs GRAPHIC at same element).

---

#### §2.1 v4.D — Lock screen · Q1 IMMERSION × PAINTERLY · wood/dawn/sakura-path

```
IMPORTANT DETAILS

A wide-landscape in-app screenshot of a desktop card game's lock screen,
captured at 16:9 (rendered 1536×1024). A working game UI — NOT concept
art, NOT a poster.

Style: this variant is Q1 — IMMERSION × PAINTERLY. The Inscryption-
diegetic + Spiritfarer-painted-moment corner. The entire screen is a
single continuous painted Tsuheji morning scene; UI elements live as
painted physical objects integrated into the world, NOT as panel chrome
on the screen edges. NO frame-border around the viewport.

Style anchor: soft-painted oil-meets-2D-animation register with visible
brush texture, hand-drawn warmth, soft-shaded but flat-line silhouette
discipline. NOT anime cel-shading. NOT 3D. Closer to Spiritfarer's
animated-frame quality than to v4.A's clean graphic register.

Horizontal composition — one continuous painted scene where every UI
element is a diegetic object:

  LEFT REGION (occupies left 35% of frame):
  A Tsuheji wooden bus-stop pavilion under an arching sakura tree
  in early-spring dawn bloom. A wooden signboard mounted to the
  pavilion's vertical post — surface INTENTIONALLY BLANK CREAM
  with subtle aging, a small red hanko square at the lower-right
  corner of the blank surface. The pavilion's wood-roof shingles
  catch sakura petals that have drifted down.

  CENTER REGION (occupies center 32%):
  A worn stone bench under the pavilion roof. Five elemental
  stones in a horizontal row, each carved into a distinct
  abstract shape (NO legible kanji). The leftmost stone (wood
  element, the day's weather) emits a deep jade-vivid glow at
  oklch(0.81 0.144 112.7). The other four are dim oklch(0.45
  0.01 260). Sakura petals have settled in soft drifts at the
  base of the bench. A few petals float in the air at frame-
  center, mid-air.

  RIGHT REGION (occupies right 33%):
  A paper lantern hanging from a slender sakura branch (the
  branch dips into the right side of frame at lantern height),
  lit from within with the SAME jade-vivid color oklch(0.81
  0.144 112.7) as the active wuxing stone. This is the single-
  stamp coupling — both wuxing-active stone AND lantern carry
  today's wood-element color. The lantern paper is BLANK CREAM
  with subtle ribbing texture. Below the lantern hangs a small
  wooden plaque (also BLANK) for the today's-tide caption.

  BACKGROUND:
  A Tsuheji dawn vista — rolling jade-olive hills in soft-painted
  pastels at oklch(0.82 0.08 145) for distant hills, fading to
  cream-pink-dawn sky at oklch(0.97 0.01 90) at horizon and a
  band of soft-rose oklch(0.95 0.018 45) above. Distant Tsuheji
  village rooftops at far horizon. Birds drift in the upper sky
  as ink-line silhouettes. Optional: a small caretaker rear-
  silhouette (hooded in sage-green) walking toward the pavilion
  on a dirt path that curves from the lower-right toward the
  center-mid distance, scale 8% of frame height.

Apply the following 6 treatments:
  - PAINTERLY BRUSH: visible oil-brush texture catches light on
    every surface — wood grain, stone weathering, lantern paper
    fiber, sakura branch bark. Soft brush at the edges.
  - SAKURA-DRIFT PARTICLES: about 20-30 small sakura petals
    scattered through the air in soft drifts — at the base of
    the bench, floating mid-frame, settled on the pavilion roof,
    one or two in the upper-right near the lantern. NOT a
    confetti effect — soft natural drift, like Ghibli backgrounds.
  - POMO HALATION: the wood-vivid active stone + the lantern
    interior emit Pomo-style soft ink-bleed halation, 8-12px
    outward. The cream signboard and the bench surface catch
    the glow softly.
  - DAWN-GOLDEN HOUR RIM: motivated lighting from the lower-
    right (rising sun) catches the right edges of the pavilion
    post, the bench's right edge, and the right-frame sakura
    branch in soft cream-warm rim-light. Cool jade-pastel ambient
    fills the rest.
  - DIEGETIC IMMERSION: NO four-edge frame chrome. The viewport
    edges fade subtly into sky at top, into earth at bottom. The
    UI is the wuxing-stones row + the lantern + the (blank)
    signboard. Three diegetic objects, no panel-borders.
  - MATERIAL HONESTY: wood-grain on pavilion + bench + branch;
    stone-weathering on bench-top; paper-fiber on lantern +
    signboard; petal-translucency on sakura petals.

Palette discipline (per-region OKLCH, hard):
  - cream paper (signboard + lantern + plaque): oklch(0.97
    0.01 90)
  - wood-warm (pavilion + bench frame + branch bark): oklch(0.65
    0.03 85)
  - dim ink (silhouettes, dim stones, distant birds): oklch(0.18
    0.02 260) for line, oklch(0.45 0.01 260) for dim
  - distant jade-olive hills: oklch(0.82 0.08 145)
  - cream-pink dawn sky horizon: oklch(0.97 0.01 90) fading to
    rose-pastel oklch(0.95 0.018 45) above
  - sakura petals: soft sakura-pastel oklch(0.94 0.02 350) with
    accent edges at oklch(0.72 0.1 350)
  - SINGLE STAMP — wood vivid: oklch(0.81 0.144 112.7) on the
    active wuxing stone AND inside the paper lantern ONLY. The
    Pomo halation around these two objects shares the same value.
    Nothing else carries this saturation level.
  - hanko square: oklch(0.45 0.18 15) — only deep red, only on
    the signboard blank's lower-right corner.

REFERENCE GUIDANCE

Attach 2-3 reference images:
  reference 1 (style anchor): public/brand/characters/kaori.png —
    Kaori in sage-green linen yukata. INHERIT BRUSH QUALITY and
    sakura-warm color register. Don't render her in output unless
    as a small rear-silhouette.
  reference 2 (composition anchor optional): public/art/scenes/
    kaori-sakura.png — the existing Tsuheji-sakura scene Gumi
    painted. INHERIT THE COMPOSITION DISCIPLINE — same sakura-
    tree-overhang feeling, same dawn light.
  reference 3 (palette anchor): public/art/cards/scene-card-wood.png
    — inherit wood-element OKLCH register.

USE CASE

Mockup of the lock screen, WOOD weather variant, IMMERSION-PAINTERLY
aesthetic. The most diegetic of the four variants — scene IS UI,
no frame chrome, sakura-particle atmosphere. Output: 1536×1024 px.
Wordmark + caption + kanji + play-text all composited locally.

CONSTRAINTS

  - No readable text. Signboard + lantern + plaque are all
    intentionally blank.
  - NO four-edge frame chrome. Q1 is immersion — diegetic only.
    The UI is THREE diegetic objects (stones, lantern, signboard).
  - No detailed faces. Caretaker rear-silhouette is dot-scale.
  - No 3D-rendered surfaces. No photographic petal-realism.
  - Single-stamp: wood-vivid oklch(0.81 0.144 112.7) on the
    stone + lantern. Hanko red oklch(0.45 0.18 15) only on the
    signboard. Nothing else saturated.
  - No graphic-cool flat-color register. This variant is
    PAINTERLY-WARM only.
  - No clean-vector ink-line discipline. Brush-edge variance
    required.
  - Output exact size: 1536×1024.
```

**Iteration knobs:**
- Increase diegesis → "remove the rear-silhouette caretaker entirely; let the scene be quiet, no human figures, only the three diegetic UI objects in nature."
- Push painterly further → add visible canvas-fiber texture overlay at 8% blend across entire frame; lean more into oil-paint visible brushstroke.
- Swap weather → re-fire with wood → water at rainy morning (different element, same Q1 vibe).

---

#### §2.1 v4.0 · Where to go next (gradient descent loop)

After firing all 4 cold-mode prompts and dropping the returns at `public/art/mockups/lock/{a,b,c,d}.png`, visit `/kit/ui-explorer` and pick the favorite (or a favorite blend). Tell me:

> "I like v4.B but want it cooler / more graphic" → I sample around (Q4 ↔ Q3 edge) for v5
> "I like v4.D's diegetic feel but want the play-CTA more prominent" → I sample (Q1 ↔ Q4 edge)
> "I love v4.A's water register; do the other 4 elements in same Q2 vibe" → I generate Q2 × {wood, fire, earth, metal}

This is the gradient descent — each round narrows the search around your preferred vibe-space point.

---

#### §2.1 v3 — _LEGACY — superseded by v4 above_

#### §2.1.A — Lock screen · "Inscryption-diegetic" (MINT-disciplined v3)

> **v3 changes from v2:** four-block structure · named treatments · OKLCH per region · single-stamp · sanitized · 1536×1024 (the real landscape size) · composite-vs-generate honored (model NEVER renders the wordmark text — the signboard surface is painted blank, the wordmark gets composited locally via `rsvg-convert + magick`)

```
IMPORTANT DETAILS

A wide-landscape in-app screenshot of a desktop card game's lock screen,
captured from a working game UI — not concept art, not a movie poster.
The viewport is a 16:9 desktop browser window.

The scene is a single continuous Tsuheji-region rural bus-stop pavilion
at dusk. Soft-painted background illustration with visible brush texture,
hand-drawn warmth, painterly soft-shaded with a flat-line silhouette
discipline. Not anime cel-shading. Not 3D-rendered. Not photographic.
The brush is visible at the edges of every object.

Horizontal composition, divided into three painted regions, all part
of one continuous scene:

  LEFT REGION (occupies left 33% of frame):
  A weathered wooden Tsuheji bus-stop pavilion with a tile roof.
  The pavilion has a vertical wooden signboard mounted on its
  front post. The signboard surface is INTENTIONALLY BLANK CREAM
  PAPER, oklch(0.97 0.01 90), with subtle weathering and aging
  marks but NO TEXT and NO MARKINGS — the wordmark will be added
  in post-production. Below the signboard, a tiny red hanko-stamp
  square in oklch(0.45 0.18 15) — the only deep red in the frame.

  CENTER REGION (occupies center 34%):
  A worn dark-grey stone bench under the pavilion roof. Five
  elemental stones rest on the bench in a clean horizontal row,
  each stone visibly carved into a different abstract geometric
  shape (do NOT inscribe legible kanji — abstract worn carvings
  only; specific kanji glyphs will be composited locally in post).
  ONE stone — the second-from-right — emits a deep vermillion
  glow at oklch(0.64 0.181 28.4), with light spilling onto the
  bench surface and the underside of the pavilion roof above it.
  The other four stones are dim oklch(0.45 0.01 260) — cool ink
  shadow, no glow, no saturation. The vermillion stone is the
  SOLE saturated object in the entire frame.

  RIGHT REGION (occupies right 33%):
  A paper lantern hanging from the pavilion roof on a thin cord.
  The lantern is also lit from within at oklch(0.64 0.181 28.4)
  — the same vermillion as the active stone (this is the single-
  stamp; both the active stone AND the lantern carry today's-
  element color, nothing else). The lantern paper surface is
  BLANK CREAM with subtle weathering — NO TEXT inside, NO PAINTED
  CHARACTERS. The word "play" gets composited locally in post.
  Below the lantern hangs a small blank wooden plaque, same blank-
  surface treatment — caption gets composited in post.

  BACKGROUND (fills behind all three regions):
  A winding Tsuheji dirt road receding to a low horizon. Distant
  hills in cool-pastel oklch(0.65 0.03 85), atmospheric haze.
  Above the horizon, a strip of dusk sky transitioning from warm
  cream oklch(0.94 0.015 90) at horizon to deep-water indigo
  oklch(0.38 0.15 266.2) at zenith. The pavilion silhouette
  anchors the entire foreground.

Lighting: motivated single-source — the vermillion-lit stone +
lantern pair acts as the diegetic light source. Long soft shadows
fall left across the bench and ground. Cool indigo ambient fills
all non-lit regions. Visible volumetric haze near the lantern.
Brush texture catches the edge-light.

Apply the following 6 treatments:
  - POMO BLEED: edges of the lantern glow and the active stone's
    glow soak outward into surrounding cream/wood like wet ink
    on rice paper. Soft halation at the boundary, NOT a Gaussian
    blur, NOT a Photoshop glow filter — ink-on-paper diffusion.
  - LIUBAI WHITE-SPACE: the upper-right quadrant of the frame is
    deliberately empty sky — generous negative space carries the
    composition. No additional props in that quadrant.
  - JIANJIA GRID: the five stones are arranged with kanji-radical
    structural balance — equal spacing, equal stone widths, the
    composition reads like the lower half of a 田 character.
  - MATERIAL HONESTY: every surface declares what it IS — wood
    grain on the pavilion posts is visible at frame distance,
    stone bench has visible chisel marks, the paper of the
    lantern has subtle fiber texture, paper of the signboard
    has horizontal grain.
  - HANKO STAMP: the small red hanko square beside the blank
    signboard reads as ceremonial wax-seal compression — flat,
    matte, slightly off-square, oklch(0.45 0.18 15). It is the
    only saturated red in the frame.
  - BROWSER-WINDOW FRAMING: the entire image has a subtle 8-pixel
    vignette at the four corners, indicating the frame edge of
    a desktop browser window. Not a hard border — just edge fall-
    off.

Palette discipline (per-region OKLCH, hard):
  - cream paper for signboard + lantern + plaque surfaces:
      oklch(0.97 0.01 90)
  - dark ink for all line work + shadow + dim-stone:
      oklch(0.18 0.02 260) for line, oklch(0.45 0.01 260) for dim
  - wood-warm for pavilion posts + bench frame:
      oklch(0.65 0.03 85)
  - dusk-violet for sky zenith + cool ambient:
      oklch(0.38 0.15 266.2) at zenith fading to oklch(0.94 0.015 90)
      at horizon
  - distant hill pastel: oklch(0.65 0.03 85)
  - SINGLE STAMP — today's-element vivid:
      oklch(0.64 0.181 28.4) on the active stone AND on the
      lantern interior glow ONLY. Nothing else in the frame
      carries this saturation level.
  - hanko square: oklch(0.45 0.18 15) — the only deep red.

REFERENCE GUIDANCE

If supplying reference images alongside this prompt:
  reference 1 (operator-supplied: e.g., public/art/scenes/akane-station.png
    or a Tsuheji bus-stop photo): COMPOSITION ANCHOR — match the
    pavilion-and-bench arrangement; inherit the brush quality and
    soft-painted register from this image.
  reference 2 (optional: a wuxing element palette swatch sheet):
    PALETTE CONTINUITY — inherit element color registers.

If no reference images are passed, the OKLCH palette discipline above
carries the visual law alone. Generate without inference from training
exemplars of named studio styles.

USE CASE

Mockup of the lock screen for a horizontal-first desktop card game.
The image lands as a static asset behind the live React UI at the
/battle route's entry phase. Aspect ratio 3:2 landscape, output at
the exact API maximum 1536×1024 pixels. The wordmark, "play" label,
5 wuxing kanji, "today's tide" caption, and any other readable text
will be composited locally with rsvg-convert + magick — do NOT
render any of these in the generation. Center-vertical band of the
composition must remain stable for potential post-hoc cropping to
2:1 or 2.4:1 banners.

CONSTRAINTS

  - No readable text anywhere. Surfaces meant to hold text (signboard,
    lantern, plaque, stones) are intentionally blank.
  - No floating modern UI panels, no rectangular buttons, no flat-
    design icons, no Material Design, no glassmorphism.
  - No detailed faces. If a human figure is present, three-quarter
    rear view only, no facial features rendered.
  - No 3D-rendered surfaces. No photographic realism.
  - Single-stamp enforcement: the vermillion oklch(0.64 0.181 28.4)
    appears ONLY on the active stone and the lantern interior. The
    hanko-square red oklch(0.45 0.18 15) appears ONLY on that one
    small square. Every other surface is cream, wood-warm, dim-ink,
    or atmospheric pastel. Nothing else may carry saturated color.
  - No Photoshop-stock textures or AI-pattern background fills.
  - No legible inscriptions on the stones, signboard, lantern, or
    plaque — the carvings/ink-strokes are abstract worn marks only.
  - Output exact size: 1536×1024 pixels.
```

**Iteration knobs (each is a one-line swap, NOT a full re-prompt):**
- Shift today's-element from FIRE to WATER → in the SINGLE STAMP and lantern glow, swap `oklch(0.64 0.181 28.4)` for `oklch(0.53 0.18 266.2)`; add light rain falling across the frame; the active stone moves to the second-from-left position.
- Shift to WOOD weather → swap stamp color for `oklch(0.81 0.144 112.7)`; add a sakura branch overhead, scatter petals on the bench.
- Push POMO BLEED treatment further → "the lantern's halation soaks 18-24px into the surrounding cream paper, not 8-12px. Soft-edged ink-on-paper diffusion."
- Tighten JIANJIA GRID → "the five stones are now arranged in the lower row of a 九宫格 nine-palace grid; equal stone-widths, equal gaps, no rotational variance."
- If the model adds text anyway despite CONSTRAINTS → re-fire with "INTENTIONALLY BLANK SURFACE — no text, no kanji, no inscriptions, no painted characters. The wordmark is composited in post." repeated TWICE inside IMPORTANT DETAILS for the signboard and lantern.

**Local composite step (after a render lands):**
```bash
# Rasterize the wordmark + kanji glyphs at exact sizes
rsvg-convert -w 280 public/brand/purupuru-wordmark.svg -o /tmp/_wm.png
# Render the 5 kanji at exact px from a small SVG sheet (one per stone)
# Then composite onto the base
magick lock-a.png \
  /tmp/_wm.png      -geometry +85+135  -composite \
  /tmp/_kanji.png   -geometry +540+560 -composite \
  /tmp/_play.png    -geometry +1200+620 -composite \
  public/art/mockups/lock/a.png
```

---

> **§2.1.B, .C, .D not yet rewritten in MINT format.** They still need the same treatment. Tell me to extend, or fire §2.1.A-MINT v3 first to validate the discipline before scaling.

---

#### §2.1.B — Lock screen · "Spiritfarer-lyric" (horizontal, individual)

```
An in-app screenshot of a desktop card game running in a browser window,
captured at 16:9 landscape (2560x1440). NOT concept art. NOT a poster.
A real working game UI with prominent functional elements.

The game is "Purupuru." Setting: Tsuheji, a soft-painted East-Asian-modern
world. Art style: Studio Ghibli backgrounds × Joe Hisaishi palette ×
hand-drawn warmth. Visible brush. NO anime cel, NO 3D.

Composition — this is the "Spiritfarer-lyric" lock screen variant.
A caretaker stands at the LEFT THIRD of the frame in three-quarter rear
view looking outward at a Tsuheji vista. The UI claims the right two-
thirds with discreet but PROMINENT painted panels — game UI elements,
NOT subtle accents on a painting.

Horizontal layout:
  - LEFT 35%: a caretaker figure (placeholder — Kaori, young woman in
    sage-green linen yukata) seated on a wooden bench, three-quarter
    rear view, facing right. She holds a small paper lantern. She is
    roughly 60% of frame height — present but not dominating, a
    companion the player feels accompanied BY. Sakura petals drift.
  - CENTER 30%: a wide Tsuheji vista — sunset over rolling hills,
    distant village rooftops, a winding road. This is the BACKDROP,
    moodful but recessed.
  - RIGHT 35%: a PAINTED UI PANEL — looks like a folded paper screen
    or a worn parchment notice — that holds the active game UI:
    * Top: "purupuru" wordmark in soft calligraphic Yuruka-script
    * Middle: a horizontal row of 5 element-stones (木 火 土 金 水);
      one stone glows vivid (today's weather), the others sit at
      dim-pastel
    * Below the stones: a small soft pill labeled "today's tide ·
      [element name]"
    * Bottom of panel: the "play" CTA — a warm honey-amber rectangular
      button with rounded corners, hand-painted texture, with a faint
      shimmer suggesting it's interactive
    * Below CTA: a smaller secondary text link "continue last run" or
      "settings" in muted ink
  - TOP RIGHT CORNER: a chibi puruhani companion sticker peeking in
    (small mascot accent)

The painted parchment panel ANCHORS the right side. It's not a
rectangular HTML panel — it's a soft-edged hand-painted billboard
LOOKING LIKE part of the world while clearly functioning as game UI.
Slight drop-shadow under the panel separates it from the vista.

Lighting: golden-hour sunset from the right, warming the caretaker's
silhouette, gently illuminating the parchment panel from within
(internal lantern glow effect makes the panel feel "lit").

Color economy: sunset-rose sky + sage-green caretaker + parchment-cream
panel + one element-vivid glowing stone + lantern-amber CTA.

Critical: a player looking at this should immediately see "the play
button is in the bottom-right of the parchment panel; I see today's
weather; I see my companion." UI is FUNCTIONAL and OBVIOUS, not subtle.

NO sharp-corner modern buttons.
NO English text beyond: "purupuru", "play", "today's tide", "continue
last run" or similar, 5 kanji 木 火 土 金 水.
NO detailed faces.
NO 3D-rendered surfaces — everything painted with visible brush.

Output: 2560x1440 px landscape. Subtle vignette at edges.
```

**Iteration knobs:**
- "Move the parchment panel from right to bottom-edge as a horizontal HUD strip instead"
- "Swap caretaker — show Ren in plum-violet wool at autumn night with a brass lantern"
- "Push the puruhani companion sticker bigger — make it a real corner mascot, not a peek-in"

---

#### §2.1.C — Lock screen · "Slay-the-Spire-structured" (horizontal, individual)

```
An in-app screenshot of a desktop card game running in a browser window,
captured at 16:9 landscape (2560x1440). NOT concept art, NOT a poster.
A working game UI with clear HUD-style panels and chrome.

The game is "Purupuru." Setting: Tsuheji East-Asian-modern. Art style:
hand-painted Ghibli × Joe Hisaishi palette × soft brush texture. NO
anime cel. NO 3D.

Composition — this is the "Slay-the-Spire-structured" lock screen
variant. The UI claims real estate on ALL FOUR EDGES; the painted scene
fills the center but is FRAMED by clear painted panel borders. This is
the most HUD-prominent of the four variants — closest to a traditional
game title screen with menu rails.

Horizontal layout — UI lives on the frame edges, scene lives in the
middle:
  - TOP LEFT CORNER: a painted wooden ornament holding the wordmark
    "purupuru" in calligraphic ink. Acts as the primary title-block.
    A small red hanko seal accents it.
  - TOP RIGHT CORNER: a horizontal painted parchment strip showing
    today's wuxing weather — 5 element stones in a row (木 火 土 金 水)
    with one glowing vivid. Above the strip, the text "today's tide."
    To the right of the strip, a small companion-portrait avatar
    (placeholder for the player's caretaker companion).
  - BOTTOM EDGE: a horizontal painted wooden plank acting as a HUD bar.
    On it sits a centered LARGE warm-amber "play" button (painted to
    look like a glowing wood-stamped seal). To the left and right of
    the play button, smaller secondary text buttons: "rules" / "world
    map" / "collection" or similar.
  - CENTER (the painted vista inside the frame): a Tsuheji bus-stop at
    the appropriate weather time-of-day with a caretaker standing in
    three-quarter view. The vista is the MOOD, but the UI frame is
    clearly the operator's interface.

This variant deliberately has VISIBLE PANEL STRUCTURE. The painted
edges create a "the game shows you the world through a wooden viewing
frame" feeling — like the Tsuheji vista is a painting hung on a tea-
house wall and the UI is the wall's woodwork.

Lighting: the vista interior is lit by its element's time-of-day. The
wooden frame elements are lit warmly by an off-screen lantern, giving
them a tactile carved-wood quality.

Color economy: warm-wood panel edges + scene-interior (one element-
weather-dominant) + amber play button + parchment-cream wuxing strip.

The play button is BIG enough to read as the primary action.
The wordmark is clearly visible (medium size, not tiny).
The wuxing strip is a clear row, not a hidden detail.
A player should be able to take in everything in 2 seconds.

NO Material Design.
NO English text beyond: "purupuru", "play", "rules", "world map",
"collection", "today's tide", 5 kanji.
NO realistic faces.
NO modern flat icons.

Output: 2560x1440 landscape PNG with subtle browser-window vignette.
```

**Iteration knobs:**
- "Make the painted wooden frame thicker, more pronounced — give it more visual weight at the edges"
- "Swap to a brass-and-paper frame instead of wood — for a metal-weather day"
- "Replace 'rules / world map / collection' with just one secondary button: 'continue'"

---

#### §2.1.D — Lock screen · "Sable-minimalist" (horizontal, individual)

```
An in-app screenshot of a desktop card game running in a browser window,
captured at 16:9 landscape (2560x1440). NOT concept art, NOT a poster.
A working game UI in a quiet minimalist register.

The game is "Purupuru." Setting: Tsuheji, soft-painted East-Asian-modern.
Art style: Studio Ghibli × Sable's Moebius line-art × Joe Hisaishi color
palette. Hand-drawn warmth, visible brush. NO anime cel. NO 3D.

Composition — this is the "Sable-minimalist" lock screen variant. The
quietest of the four. Maximum negative space (Liubai — Eastern white-
space-as-medium-of-flow). The UI is restrained but EVERY element is
LARGE enough to be functional — minimalism does NOT mean tiny.

Horizontal layout:
  - The full 16:9 frame is a wide Tsuheji vista at dawn or dusk —
    rolling distant hills, soft horizon line, atmospheric depth. This
    is roughly 65% of the visual mass.
  - A tiny caretaker silhouette walks across the LOWER-LEFT of the
    frame (toward the horizon, three-quarter rear view, scale roughly
    5% of frame height — properly small, dot-on-landscape).
  - WORDMARK "purupuru" — set in calligraphic Yuruka-script, centered
    HORIZONTALLY at the upper-third intersection. NOT tiny. Medium-
    large, confident. Around 4-5% of frame height in stroke weight.
    Soft ink-bleed at the edges of the letters (Pomo broken-ink
    technique — wet brush on cream paper). Below the wordmark, a thin
    ink-rule horizontal line.
  - WUXING strip 木 火 土 金 水 — a clean horizontal row of 5 kanji
    glyphs at the bottom-center, set in display-card calligraphy. ONE
    glyph is rendered in its element's vivid OKLCH color (today's
    weather). The other four are dim ink. This row is unmistakably a
    status indicator.
  - "PLAY" CTA — set in calligraphic ink near the bottom-right of the
    frame. NOT a button-shape. Just the word, drawn large with a
    subtle warm amber underline-stroke that suggests "this is the
    interactive element." A small red hanko seal next to it, like
    a cinnabar stamp waiting to be pressed.
  - OPTIONAL: a small "today's tide" caption above the wuxing strip,
    in tiny mono-style hand-printed ink.

The trick of this variant: by SHRINKING the visual UI density and
LIFTING each remaining element via deliberate sizing, every UI cue
reads more clearly than in a crowded design. It's MINIMALIST not by
being tiny but by being CHOSEN — fewer elements, each strong.

Lighting: dawn or dusk, single direction, atmospheric haze. Most of
the frame is sky-and-mood. The wordmark and CTA hold the only "warm"
points; everything else falls cool.

Color economy: 1 dominant atmospheric color (deep-water-indigo or sand-
peach) + 1 element-accent color (today's weather) + cream-ink for type +
warm hanko-vermillion + amber CTA underline.

A player looking at this should feel: "this game is quiet. The play
word is right there. I see the weather. Nothing is shouting at me."

NO floating modern UI panels.
NO English beyond: "purupuru", "play", "today's tide", 5 kanji.
NO detailed faces.

Output: 2560x1440 landscape PNG. Almost no vignette — the frame edges
fade subtly into the dawn/dusk sky.
```

**Iteration knobs:**
- "Push it further — drop the 'today's tide' caption entirely, just the wuxing row alone"
- "Switch to morning fog instead of dusk for a wood/water weather day — more cream-pastel less indigo"
- "Make the wordmark calligraphy bigger but keep everything else the same — test where 'minimalist' breaks"

---

#### §2.1 — How to fire all four

```text
1. Open ChatGPT, image-gen mode
2. Paste §2.1.A — save return as public/art/mockups/lock/a.png
3. Paste §2.1.B — save as ./b.png
4. Paste §2.1.C — save as ./c.png
5. Paste §2.1.D — save as ./d.png
6. Visit http://localhost:3000/kit/ui-explorer — see all four side-by-side
7. Tell me which one to implement (or which parts of which to combine)
```

Each prompt generates ONE 16:9 horizontal image. ChatGPT image gives
each variant its full attention. Variants are maximally different from
each other because they don't have to harmonize on a single sheet.

---

### §2.2 v1 — BATTLE SCREEN · Hearthstone × TFT immersive depth · MINT-disciplined · SKY-EYES element-motif applied

> Operator directive (2026-05-12): "design in direction of hearthstone/TFT with immersive depth for scenes and zones." This is the first §2.2 written in MINT discipline (supersedes the legacy 2×2 portrait that was deprecated upstream).
>
> **Single-element specimen:** the prompt below targets a FIRE-weather match on the sunset station platform (continuity with the lock-screen direction). Re-fire with element-and-weather swaps for the other 4 elements via the iteration knobs.
>
> **SKY-EYES PERSISTENT-MOTIF DISCIPLINE APPLIED:** per SKY-EYES's Priority-1 finding (95.2% cross-element similarity, 4.8/100 element-separation score), this prompt carries fire's identity via THREE non-color signatures simultaneously — ember-trail particles, heat-distortion shimmer, char-warm wood grain. Color alone is insufficient. Future per-element variants must apply equivalent motif clusters (water=ripple-circles+mist-gradients+reflection-surfaces; metal=clockwork-geometry+crystalline-facets+metallic-sheen; wood=growth-rings+root-systems+leaf-veining; earth=honeycomb-geometry+clay-cracking+soil-layers).

```text
IMPORTANT DETAILS

A wide-landscape in-app screenshot of a desktop card game's MAIN BATTLE
SCREEN, captured at 16:9 (rendered at 1536×1024). NOT concept art, NOT
a poster. A working game UI captured mid-match.

[full prompt body is in /tmp/purupuru-battle-prompt-v1.txt and currently
sits in the operator's pbcopy clipboard — 15,973 bytes including all 7
zone descriptions, 9 named treatments, full OKLCH palette block, 4-image
REFERENCE GUIDANCE block, USE CASE, and CONSTRAINTS]
```

**Iteration knobs:**
- Element swap → re-fire with FIRE → WOOD/spring (sakura grove battlefield); the SINGLE-PRIMARY-STAMP cluster swaps to wood-vivid `oklch(0.81 0.144 112.7)`; the per-element-motif cluster swaps to growth-rings + root-systems + leaf-veining; opponent secondary stays metal-violet OR re-pair (fire-vs-water tells a different combat story).
- Zone density push → add a fifth row above the opponent lineup: a small painted "round history" strip showing 3 small painted stones (the 3 rounds), with the current one glowing.
- Reduce HUD chrome density (TFT-leaning) → drop the right rail entirely; replace opponent-intent-telegraph with a small floating banner above the active clash slot.
- Push parallax depth → "the center clash arena reads as TRUE 6-7 distinct distance planes; aerial-perspective haze stronger; foreground bench-platform reads sharply, mid-ground brazier softens by 25%, distant station-town silhouettes desaturate by 60%."
- Increase chibi-mascot presence → bring the puruhani out to mid-frame as a small animated companion sitting beside the player's caretaker rail.

**To re-fire:** the full prompt is also persisted at `/tmp/purupuru-battle-prompt-v1.txt`. Run `cat /tmp/purupuru-battle-prompt-v1.txt | pbcopy` to reload clipboard.

---

> **PHASE 2 NOTICE — LEGACY ENTRIES BELOW** — sections §2.3 through §2.6 below are still the **original 2×2-grid portrait prompts**. They produced the same "poster, not game" problem operator flagged. Tell me which one to rewrite next in MINT/horizontal-individual discipline (§2.3 Clash Moment is the natural follow-up to §2.2 Battle Screen).

### §2.2-LEGACY — PROMPT · Arena: Arrange Phase (pre-clash, picking lineup) — _DEPRECATED 2×2 PORTRAIT FORMAT_

```
Create a 2x2 grid concept-art mockup showing four different layout
approaches to the BATTLE ARRANGE PHASE of a mobile card game called
"Purupuru." This is UI exploration — taste-test composition, not finalize.

Game context: the player picks 5 cards from their collection and arranges
them in a horizontal lineup at the bottom of the screen. The opponent's
5 cards are face-down in a mirrored row at the top. Between them is the
"clash zone" where cards will resolve one-by-one when committed.

Art anchor: same Gumi-style soft-painted Ghibli warmth × Joe Hisaishi
palette × OKLCH wuxing colors as scene light.

All four tiles render a horizontal 16:9 mobile-landscape arena screen.
Each must show:
  - Top row: 5 face-down opponent cards (silhouette / card-back PNG —
    placeholder OK)
  - Mid zone: a "battlefield" surface (bench, table, tatami — vary per
    tile)
  - Bottom row: player's 5 cards — chunky enough to read, each showing
    a placeholder caretaker character + element glow
  - HUD readouts: today's weather kanji, player's tide score, opponent
    name, action queue or "lock in" CTA
  - Optional: caretaker portrait corner (Hades-style)

The 5-card bottom row is the visual loud-spot. Cards are roughly 1/5
of frame width each. Opponent backs are slightly smaller (depth cue).

Four variants:

TILE A — "Slay-the-Spire-pragmatic": flat painterly backdrop, cards loud
+ readable, status pills clean in corners, opponent backs neat row top.
The cards are the loudest thing on screen. Background recedes deliberately.

TILE B — "Inscryption-diegetic-table": the cards literally sit on a
wooden Tsuheji tea-house table viewed three-quarter from above. The
table IS the UI. Caretaker (placeholder) sits at one end, opponent
silhouette at the other. Lighting from a hanging paper lantern.

TILE C — "Monster-Train-lanes": 5 vertical lanes drawn down the
battlefield, each lane is its own small painted diorama (element-themed).
Cards drop into their lane like stones onto a bench. Strong vertical
grid discipline.

TILE D — "Hades-cinematic": much more atmospheric — the battlefield is
a wide Tsuheji vista (bus-stop at the appropriate weather time-of-day);
player's cards float at the bottom edge like a hand in mid-deal; caretaker
portrait LEFT, opponent portrait RIGHT, slight rim-light on both.

Style applies to all four: soft-painted concept art (NOT pixel-perfect
Figma mockup, NOT a screenshot — this is a PAINTING of what the screen
could look like). Painted UI elements integrated into the world. OKLCH
wuxing scene-lighting. Visible brush texture.

NO modern UI chrome.
NO realistic photography.
NO faces in detail.
NO English text beyond "lock in" / a number score / placeholder kanji.

Composite output: a single 2560x2880px image (16:9 tiles in 2x2 grid)
with a 24px gutter and tile labels bottom-left.
```

**Iteration knobs:**
- "All four tiles use the FIRE weather (sunset Tsuheji station) so I can compare layouts within one element"
- "Push tile B further into diegesis — no UI panels at all, every readout is a diegetic object (HP as candles, weather as sky color)"

---

### §2.3 — PROMPT · Arena: Clash Moment (mid-action card-vs-card)

```
Create a 2x2 grid concept-art mockup showing four different visual
approaches to the CLASH MOMENT in a mobile card game called "Purupuru" —
the instant when two cards collide in combat. Visual prototyping; this
is the most cinematic moment of the game's loop.

Context: cards resolve one-by-one. The current clash is the FOCAL EVENT.
Other cards (resolved + pending) are at lower visual priority. The
element-pairing (e.g., fire-vs-water) drives the visual effect.

Art anchor: Gumi-soft-painted × Ghibli × Hisaishi × OKLCH wuxing.

All four tiles render the same conceptual moment: a FIRE card colliding
with a WATER card (vermillion vs indigo) — the element that GENERATES
or OVERCOMES the other (Shēng / Kè wuxing relationship).

Each tile must include:
  - The two ACTIVE clashing cards, center-stage, larger than rest
  - A burst of element-effect at the collision point (steam, fire-quench,
    spark, etc.)
  - Dimmed-resolved cards on one side (already played, lower opacity)
  - Pending-greyed cards on the other side (not yet played)
  - Some indication of WHO IS WINNING this clash (rim-light? color
    wash? tide-meter pull?)

Four variants:

TILE A — "Camera-push-cinematic": the camera has zoomed in tight on the
two clashing cards. Everything else is blurred/peripheral. Element burst
fills the center. Like Hades during a special move.

TILE B — "Top-down-table-diegetic": still the wooden Tsuheji tea-house
table view from above. The two cards meet center-table; element burst
splashes outward; steam from water-meets-fire rises off the table.
Quiet drama. Inscryption-feel.

TILE C — "Lane-stratified": the 5-lane Monster-Train layout, lane #3
(the active lane) is lit + the two cards collide WITHIN that lane.
Lanes 1-2 dimmed (resolved), lanes 4-5 ghosted (pending). Strong
vertical readability.

TILE D — "Painted-cutscene": the moment treated as a Spiritfarer
animation frame — cards drawn into a small painting where the fire-card
caretaker and water-card caretaker LOOK at each other; element burst
between them is symbolic, not literal. Comic-panel feel.

Style: visible motion suggestion (smoke, mist, particle trails, slight
motion blur on element burst) BUT the cards themselves are crisp +
readable. Soft-painted backdrop, modern-graphic-novel composition.
Visible brush texture.

NO sci-fi VFX (no laser beams, no neon glitch effects).
NO English text beyond a number or kanji on each card.
NO faces in detail.

Composite output: 2560x2880px (16:9 tiles), 2x2 grid, gutter + labels.
```

**Iteration knobs:**
- "Re-fire with metal-vs-wood instead of fire-vs-water"
- "Push tile D into full Spiritfarer style — the cards are no longer cards, they're caretakers facing each other"

---

### §2.4 — PROMPT · Result Screen (post-match outcome)

```
Create a 2x2 grid concept-art mockup showing four different visual
approaches to the RESULT SCREEN of a mobile card game called "Purupuru."

Context per the game's GDD: there is NO VICTORY or DEFEAT — the language
is "the tide favored you" or "the tide shifts." Even loss has a soft,
tidal feel — never punishment. This is a Tsuheji-y world that doesn't
celebrate or shame.

Each tile renders a vertical 9:16 mobile result screen showing:
  - A central outcome statement (e.g., "the tide favored 火" / "the tide
    shifts")
  - The 5 clash results as a small summary (which lanes won/lost)
  - A "whisper" — a soft one-line aphorism the world gives back
  - A "play again" or "rest" CTA
  - Optional: caretaker shown reacting — small portrait, six-expression
    set (calm, focused, concerned, triumphant, defeated, secret-smile)
  - A subtle score readout (W-L-D record)

Art anchor: same Gumi-soft-painted style.

Four variants:

TILE A — "Tidal-bloom": the whole screen is a Spiritfarer-style painted
moment — sun setting over Tsuheji harbor (or sunrise for a win), tides
literally drawn as wave patterns along the bottom. The outcome statement
floats as soft hand-lettered calligraphy mid-screen. Cards arranged like
shells on a beach below.

TILE B — "Tea-house-quiet": you and the caretaker (placeholder) seated
at the Tsuheji tea-house table after the match. The cards lay scattered
on the table — resolved lineup. Steam rises from two teacups. The
whisper is on a small paper note on the table. CTA as another card to
draw.

TILE C — "Sky-banner": minimalist — sky takes 70% of frame. Outcome
statement in large soft Yuruka-script. Below, a small horizontal row
of the 5 clash icons. Caretaker face appears small at one corner.

TILE D — "Loop-Hero-stats": more data-forward — a soft painted backdrop
but with clear readable summary: per-lane win/loss icons, tide-meter,
record, all painted as if hand-drawn in a calligrapher's notebook.

Style + NO list same as previous prompts. Add: NO trophies, NO confetti,
NO victory fanfare (this world doesn't do that).

Composite output: 2048x2560px, 2x2 grid (each tile 9:16).
```

**Iteration knobs:**
- "Re-fire showing a LOSS outcome instead of a win — keep all four tiles soft, not punishing"
- "Add the wuxing-affinity-shift hint — show how the outcome moved the player's element affinity"

---

### §2.5 — PROMPT · Card-in-Hand (single card, the layered-stack treatment)

```
Create a 2x2 grid concept-art mockup showing four different visual
treatments for ONE CARD as it appears in the player's hand in a mobile
card game called "Purupuru." This is to compare frame-design / stack-
composition directions.

Context: each card composes from layered elements: background +
character art + frame (by rarity) + element-effects glow + rarity
treatment + behavioral state overlay. The art style is Gumi's
soft-painted Ghibli warmth.

Each tile shows the SAME card-data (e.g., "Kaori, wood, rare,
revealStage 3") rendered as a 3:4 vertical card with a different
COMPOSITIONAL TREATMENT. The character art (Kaori in sage-green linen
yukata, three-quarter front-view, holding a sakura branch) is the
"same actress" across all four — what changes is the FRAME, the
BACKGROUND, the RARITY TREATMENT, the BEHAVIORAL OVERLAY.

Four variants:

TILE A — "Slay-the-Spire-painted-frame": ornate wood-and-bamboo frame
with painted leaf-decorations around the edge. Element kanji 木 carved
on the upper frame. Rarity-glow treatment: subtle gold dust along the
edges. Reads as "this is an heirloom card."

TILE B — "Inscryption-woodcut-numerals": no decorative frame — a thin
clean ink-line border. HP and attack-power numerals appear as carved-
in-the-card-corners woodcut numbers (large, hand-drawn). Element kanji
top-right. Rarity treatment: a subtle metallic shimmer behind the
character.

TILE C — "Spiritfarer-ribbon": flowing painted edges that look like
ribbon or cloth waving slightly. Element kanji integrated into the
ribbon flow. Rarity treatment: the ribbon itself shimmers gold for
rare cards. No hard rectangular edges.

TILE D — "Modern-minimal-tarot": clean tarot-card proportions, simple
geometric border (single thin gold line), character art dominant,
element kanji and rarity glyph at the bottom in a small calligraphic
mark. Reads as "less is more" — the most restrained option.

Each tile is roughly 1024x1400 (3:4 vertical card). Each shows the
SAME character art (Kaori-wood-three-quarter-front) but with the
card-frame treatment varied per tile. Tile label small bottom-left.

Style: soft-painted hand-drawn. Visible brush. NO digital geometric
shapes (everything is hand-drawn even when "minimal"). NO English
text — only kanji / numerals as ornament.

Composite output: 2048x2880px, 2x2 grid, gutter + labels.
```

**Iteration knobs:**
- "Re-fire showing the SAME 4 frame treatments applied to a FIRE card (Akane) so I can see element-coupling"
- "Add a fifth tile (or re-roll) with a 'rarest' tier treatment — gold-leaf, lacquer, dragons"

---

### §2.6 — PROMPT · Status Indicators (the wuxing weather / affinity / tide bestiary)

```
Create a 2x2 grid concept-art mockup showing four different ways to
render the STATUS INDICATORS in a mobile card game called "Purupuru."
This is exploring how to communicate game state — weather, element
affinity, tide score, resonance — in the painted Gumi-style world.

Each tile shows a small CLUSTER of status readouts that would live in
a corner / top-edge of the gameplay screen. Treat each as a TYPESET
SPECIMEN of the readouts together.

Status readouts to render (use placeholder values):
  - Today's Weather: 火 fire (visualized somehow — glyph + treatment)
  - Player Element Affinity: 木 wood, 68%
  - Tide Score: 50 / 100
  - Resonance: 75% (one of dormant / awakening / resonant / harmonized)
  - Round indicator: "Clash 3 of 5"
  - Opponent's caretaker name + element

Four variants:

TILE A — "Paper-amulets": each readout is a small painted paper amulet
(omamori) — soft-cream paper with kanji + calligraphy + a colored ribbon
edge per element. Hung from a string of small charms.

TILE B — "Ink-brush-margin-notes": each readout is hand-painted in
ink-brush calligraphy directly onto the margin of the screen, with no
backing panel — like a calligrapher's notes drying on parchment.

TILE C — "Stone-lantern-readouts": each readout is etched into a small
hanging stone-lantern shape — a 3D-feeling but soft-painted set of
lanterns with the readout glyphs glowing through.

TILE D — "Stamps-and-seals": each readout treated as a Japanese hanko
(stamp) — circular or square red ink stamps with the kanji + a small
text caption below in handwritten ink. Stamped onto a cream paper edge.

Style: same Gumi-soft-painted Ghibli warmth. OKLCH element colors as
the accent per readout (the fire amulet has vermillion accent, the
water amulet has indigo, etc.). Visible brush + paper-grain texture.

NO modern UI chrome (no Material Design pills, no glassmorphism, no
sans-serif system fonts). All "type" is calligraphic ink.

Composite output: 2560x2560px, 2x2 grid, each tile shows the cluster
of ~6 readouts arranged compactly. Gutter + labels.
```

**Iteration knobs:**
- "Re-fire as ANIMATED variants — show three frames of motion per readout (resting / breathing / triggered) so I can see how status COULD animate"
- "Push tile A further — each amulet has a small calligrapher's signature beneath it"

---

## §3 · How the operator + agent loop works

1. **Operator runs prompts** (one at a time in ChatGPT image) → 6 prompts × 4 variants = 24 directions
2. **Drop returns** in `public/art/mockups/<screen>/<letter>.png` (slice the 2×2 grid OR drop whole `grid.png`)
3. **Open `/kit/ui-explorer`** to compare side-by-side
4. **Mark favorites** — either by:
   - Commenting in `public/art/mockups/<screen>/notes.md` ("a: love. b: too sparse. c: implement. d: skip.")
   - OR just telling me "the result-screen tile C is the one"
5. **Agent (me) implements** matching CSS — porting the chosen mockup's compositional ideas into the live React/CSS code
6. **Live route compare** — operator visits `/battle` to see the implementation against the mockup
7. **Iterate** — fire another prompt with the iteration knobs, or different reference seed

## §4 · Doctrine connections (this isn't orthogonal)

- **Layer system (lib/cards/layers)** — when the operator picks favorites, the new compositions may need new LAYER KINDS (`battlefield`, `lock_hero`, `result_atmosphere`). The CardStack pattern extends naturally.
- **Audit-feel verdict (2026-05-12)** — the mechanical FEEL fixes already landed (Quiz selection deltas, Lock wuxing status, tile-btn anticipation). These mockups operate on the LAYER ABOVE that work — composition + structure, not just visual delta tweaks.
- **Gumi as artist** — the prompts don't generate final art. They generate **layout concepts that Gumi will paint over** when the time comes. The mockups are the operator's communication tool with Gumi: "I want THIS composition, painted in YOUR style."

## §5 · What I built in parallel (creative latitude — silent work bonus)

- **`/kit/ui-explorer` page** — drop mockups, view in grid, side-by-side compare to live screens. See companion file.
- This doc itself, including the §0 workflow primer.

## §6 · Five things I want to push back on (questioning the question)

1. **Six 2×2 prompts may be too many to fire.** Recommend: start with §2.1 (Lock) + §2.2 (Arrange). If those produce useful directions, scale to the others. Don't burn ChatGPT image credits on all six unless the first two prove the workflow.

2. **The 2×2 grid trick depends on DALL-E 3 cooperation.** ChatGPT image sometimes ignores grid instructions and gives one composite. Fallback: ask for "four separate images" and run the prompt 4×. The variant text descriptions still work.

3. **"Top 0.001%" framing might be the wrong target.** The top 0.001% indie games (Inscryption, Hollow Knight, Spiritfarer) shipped distinctive but NOT MAXIMALIST UI. The opposite trap is real: maximal mockups make for beautiful concept art that's HOSTILE to actual gameplay. Prefer prompts that produce CALM compositions over BUSY ones — operator should bias toward picking the QUIETER variant when in doubt.

4. **Mockup → implementation loss is real.** What looks gorgeous in a painted concept may not survive CSS implementation (especially under mobile constraints + reduced-motion / accessibility). When implementing, I may need to push back on a chosen mockup if it can't be honored faithfully — better to know that early.

5. **The lock screen is the highest leverage of the six.** It's the first impression, the most static, and the one operator already flagged as state-stuck. Recommend running §2.1 FIRST and treating its outcome as the brand-mood-test before firing the others.

## §7 · Reminder — what is NOT in scope here

- Character art generation (Gumi)
- Scene art generation (Gumi)
- Final UI implementation (me, after operator picks)
- Audio (separate cycle)
- Tutorial / onboarding flow (separate cycle)
- Wallet / auth UI (mocked at hackathon scope)
- Solana on-chain action UI (mocked at hackathon scope)
