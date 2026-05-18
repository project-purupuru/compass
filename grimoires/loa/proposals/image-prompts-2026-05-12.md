---
status: creative-direction + per-asset prompts
type: direct-render composition output (manual chain — artisan/directing-generation + the-mint/prompting-images + the-easel/visual-direction + rosenzu/room-atmosphere)
composition: delivery/direct-render (manual chain inline)
target_screens:
  - lock screen (/battle EntryScreen)
  - gameplay screens (/battle arrange + clash phases, all 5 elements)
explicit_NO: ElementQuiz (operator is happy with current state — leave alone)
goal: top 0.001% indie game developer visual quality
operator_directive: |
  Run through composition · produce ChatGPT image prompts. You are creative director.
  Embody THE MINT + THE EASEL + ARTISAN + ROSENZU. Taste tokens are baseline.
author: claude (Opus 4.7 1M)
created: 2026-05-12
companions:
  - kickoff-next-session-2026-05-12.md
  - audit-feel-verdict-2026-05-12.md
  - registry-doctrine-2026-05-12.md
references_dig_subagents:
  - lock-screen indie refs (12 games) — Hollow Knight · Slay the Spire · Hades · Cocoon · Sable · Inscryption · Cult of the Lamb · Stray · Disco Elysium · Loop Hero · Tunic · Spiritfarer
  - combat-screen indie refs (11 games) — Slay the Spire · Inscryption · Into the Breach · Cobalt Core · Monster Train · Hades · Griftlands · Loop Hero · Wildermyth · Midnight Suns · Across the Obelisk
---

# Creative Direction + Per-Asset Image Prompts — Purupuru

## §1 · The unifying visual thesis

> **"The battlefield is not a screen. It is the bus-stop at dusk, with five stones laid on the bench between two seated travelers, each stone glowing its element as it speaks."**
>
> — combat-screen dig synthesis

Purupuru is **East-Asian-warm × wuxing-elemental × time-of-day-cinematic.** Its three closest indie cousins:

| For LOCK / TITLE screen | For COMBAT / GAMEPLAY screen |
|---|---|
| **Spiritfarer** — caretaker-protagonist + lantern-as-warm-point + ribbon-script logo + Toon Boom 2D quality | **Inscryption** — diegetic table-as-battlefield + candles-as-resource + scene-IS-the-frame |
| **Sable** — Moebius/Ghibli line-quietude + flat-shaded peach/turquoise + hairline outline type | **Wildermyth** — papercraft characters on painted-storybook backdrops + comic-panel reveals |
| **Tunic** — golden-hour rim-light + oversized totemic object framing small figure + parchment-style serif | **Monster Train** — lane-as-readability for the 5-card lineup + diorama floors with infernal lighting |

These three combine into:

> **Spiritfarer's warmth × Sable's silence × Tunic's cozy-mystery, lit by Purupuru's OKLCH wuxing palette as ambient scene light, framed by Inscryption's diegetic-scene-as-UI doctrine.**

## §2 · What top-0.001% always do, never do

From the lock-screen dig synthesis — the patterns that separate top-tier from also-ran:

**ALWAYS:**
1. **One human/proxy anchor figure**, viewed from behind or in three-quarter, small-in-frame — viewer becomes the character by gazing at their back
2. **One light source carries the entire scene** — motivated lighting, never ambient-flat
3. **The logo wants to disappear** — small + confident, or promoted to hand-crafted artifact (never marketing chrome)
4. **One thing breathes — and only one** — restraint about motion separates indie-top from AAA flash
5. **Color economy: one dominant + one accent + one warm point of life** (Hades teal + red rim + gold logo; Spiritfarer teal sea + rose sky + lantern amber)
6. **UI is hidden, hand-crafted, or absent** — system chrome shatters diegesis

**NEVER:**
- Treat the title screen as a marketing surface
- Big logo, feature callouts, "Press X to play" billboard
- Ambient flat lighting
- Every status effect in its own color (rainbow = card-soup)

## §3 · Where Purupuru is now (state-stuck diagnosis)

The Lock screen has 8 stacked elements: Tsuheji-map ghost · weather-orb · wordmark · subtitle · tide pill · companion line · CTA · wuxing strip · seed pill. **Zero anchor figure. Wordmark is the visual subject, but it's text, not character.** That's why it feels "state-stuck" — the screen has the bones of a title screen but no PRESENCE.

**The fix is not more design.** It is one strong image: a caretaker at a bus-stop in their element's time-of-day, viewed from behind, with the wuxing sigil floating as the warm point of life. The image becomes the lock screen. The wordmark shrinks. The strip + tide + companion become small captions arranged around the hero image, not competing with it.

The Quiz works because it HAS character presence (caretaker mural + puruhani + scene). The Lock screen needs to inherit that.

## §4 · Taste tokens — what every image MUST preserve

These are the world's invariants. Any generated image MUST stay inside them.

### Palette (OKLCH wuxing — the world's law)

| Element | Tint | Pastel | Dim | Vivid |
|---|---|---|---|---|
| **Wood (Kaori)** | oklch(0.95 0.02 145) | oklch(0.82 0.08 145) | oklch(0.66 0.114 112.7) | oklch(0.81 0.144 112.7) |
| **Fire (Akane)** | oklch(0.95 0.018 45) | oklch(0.8 0.08 45) | oklch(0.49 0.151 28.4) | oklch(0.64 0.181 28.4) |
| **Earth (Nemu)** | oklch(0.96 0.02 85) | oklch(0.88 0.12 85) | oklch(0.7 0.123 83.8) | oklch(0.85 0.153 83.8) |
| **Metal (Ren)** | oklch(0.95 0.015 310) | oklch(0.82 0.06 310) | oklch(0.37 0.096 309.7) | oklch(0.52 0.126 309.7) |
| **Water (Ruan)** | oklch(0.96 0.015 230) | oklch(0.88 0.06 230) | oklch(0.38 0.15 266.2) | oklch(0.53 0.18 266.2) |
| **Honey (warmth-of-life)** | oklch(0.95 0.03 85) | oklch(0.82 0.14 85) | oklch(0.7 0.12 85) | oklch(0.88 0.16 85) |
| **Cloud (light field)** | oklch(0.97 0.01 90) | oklch(0.94 0.015 90) | oklch(0.88 0.02 90) | oklch(0.65 0.03 85) |
| **Ink (text + line)** | oklch(0.18 0.02 260) | oklch(0.25 0.015 260) | oklch(0.35 0.012 260) | oklch(0.45 0.01 260) |

**Approximate sRGB for prompt-writing convenience:**
- Wood vivid ≈ soft jade-olive
- Fire vivid ≈ warm vermillion (not pure red — has cream warmth)
- Earth vivid ≈ honey-amber
- Metal vivid ≈ dusty plum-violet (not gray)
- Water vivid ≈ deep indigo (not cyan)
- Honey base ≈ aged-gold marigold

### Typography (the world's voice)

- **FOT-Yuruka Std** — display brand serif, slightly hand-drawn warmth. The wordmark sets in this. Like a calligrapher made a label.
- **ZCOOL KuaiLe** — Chinese display, chunky-warm. For element kanji (木/火/土/金/水) when set at glyph size.
- **font-puru-card** — display for in-card numerals/text. Reads as carved/inked.
- **font-puru-body** — soft body sans.
- **font-puru-mono** — engraved/instrument-panel monospace.

### Characters (the world's people)

| Element | Caretaker | Mood-tag |
|---|---|---|
| Wood | Kaori | hopeful, sakura-spring |
| Fire | Akane | nefarious, sunset-station |
| Earth | Nemu | exhausted, mid-day |
| Metal | Ren | loving, autumnal-night |
| Water | Ruan | overwhelmed, rainy |

Each caretaker has full-body brand art at `public/brand/characters/{name}.png` + chibi versions. The Quiz screen pairs them with their puruhani companion sprite.

### Atmosphere (the world's place)

**Tsuheji.** A continent — half-mythic, half-modern. Bus stops with elemental atmospheres. Tea-house lanterns. Observatory windows. Hand-painted map textures (`/art/tsuheji-map.png`). The world is **soft**, **warm**, **slightly out-of-time** — Studio Ghibli's late-90s film aesthetic with a Murata Range gridded-ink overlay.

## §5 · Per-asset prompts

Each prompt is **operator-runnable**: paste into ChatGPT image / nano-banana, no editing required. Iteration knobs follow each prompt.

Image generation note: ChatGPT image / DALL-E 3 / nano-banana respect natural-language prompts better than parameter strings. These are written conversationally, with the technical specifics inline.

---

### §5.1 · ASSET — Lock screen hero (the missing centerpiece)

**Intent:** Replace the lock screen's text-centered composition with a single atmospheric hero image. Operator returns to this screen daily; it must function as a *room you stand in*, not a *poster you read*.

**Reference anchor:** Spiritfarer (Stella at the prow with lantern, dusk sky) × Tunic (golden-hour rim-light + small figure before totemic object) × Hollow Knight (parallax-friendly Z-spaced planes).

**Compositional rule:** caretaker in three-quarter rear view, small-in-frame (figure occupies 18–25% of vertical canvas), looking outward toward a Tsuheji vista. ONE warm point of light (lantern, wuxing sigil floating, or sun-disc) carries the scene. Wordmark space reserved top-center but treated as ornament-not-marketing.

#### Prompt 5.1.A — "Kaori at the wood bus-stop, spring dawn" (default first-visit)

```
A 2D hand-painted illustration in the style of a Studio Ghibli film background
fused with Sable's flat-shaded outline aesthetic. Vertical 9:16 composition.

Foreground center-right: Kaori, a young woman in a sage-green linen yukata
with cherry-blossom embroidery, seen from three-quarter behind. She stands
holding a small paper lantern at hip-height. The lantern emits warm amber
light (oklch 0.82 0.14 85 — aged-gold marigold). She occupies roughly 22%
of the vertical canvas, small-in-frame.

Midground: a wooden bus-stop bench under a sakura tree in late dawn bloom.
The bench has elemental stones laid on it — small jade-green pebbles that
glow faintly. The Tsuheji rural road curves away behind her.

Background: rolling jade-olive hills (oklch 0.81 0.144 112.7) under a soft
ivory-cream dawn sky (oklch 0.97 0.01 90) with sakura petals drifting on
faint wind. Distant Tsuheji mountains, hand-painted with subtle ink-line
detail like Studio Ghibli's "Whisper of the Heart" backgrounds.

Lighting: motivated single-source — the lantern is the warm focal point,
with golden-hour rim-light catching Kaori's hair and yukata edge. Cool
jade-pastel shadow fill from the right. No flat ambient.

Material: 2D hand-painted with visible brush texture, soft-shaded but
flat-line silhouette discipline. Slight grain — like film stock, not
digital. NO photographic realism, NO 3D rendering, NO anime-cel-shading.
Closer to Joe Hisaishi's color sense than to modern manga.

Composition: leave the top ~20% of the canvas relatively quiet (sky +
distant mountains only) — there will be a small ribbon-script wordmark
placed there in post. Leave the bottom ~12% relatively quiet for status
captions.

Color economy: jade-olive dominant + sakura-pink accent + lantern-amber
warm point. Total palette held to 5 colors maximum.

NO logos, NO text in the image itself, NO UI elements, NO menu items,
NO score readouts, NO HUD, NO modern intrusions (phones, signage in
English), NO photographic faces.

Output: 2048×3640px (9:16), PNG with no transparency.
```

**Iteration knobs:**
- If too cold/sparse → swap "spring dawn" for "warm spring afternoon," brighten lantern to fire-vivid
- If too maximalist → drop sakura tree, simplify hills to a single horizon line, reduce midground props
- If Kaori reads as too young/anime → "early thirties, calm, wearing a traditional cotton yukata with subtle embroidery, posture solid not delicate"
- If lantern competes with sun → time-shift to dusk so lantern reads as primary

#### Prompt 5.1.B — "Akane at the fire bus-stop, sunset" (returning-player fire-affinity)

```
[Same opening paragraph as 5.1.A through "9:16 composition."]

Foreground center-right: Akane, a young woman in a deep-vermillion kimono
with subtle ember-pattern weave, seen from three-quarter behind. She holds
a folding iron paper-fan (sensu) at chest-height; the fan catches the
last sunset light like it's about to ignite. She occupies 22% of vertical
canvas.

Midground: a low iron-frame bus-stop with a kettle on a brazier nearby
— steam rising into the warm air. Elemental stones on the bench, vermillion-
hot at the embered edge.

Background: a Tsuheji station-town silhouette against a sunset sky moving
from vermillion (oklch 0.64 0.181 28.4) through fire-pastel (oklch 0.8
0.08 45) to a sliver of metal-violet (oklch 0.52 0.126 309.7) at the
zenith. Sun has just dropped behind the rail-line; the sky still holds
warmth. Power lines cross-hatch the upper third like ink calligraphy
strokes.

Lighting: sunset-as-rim-light — Akane's silhouette is edged in copper,
brazier embers carry a second small warm point. Long shadows fall
right-to-left across the platform.

Material + composition + color economy + NO list + Output: same as 5.1.A.
```

**Iteration knobs:**
- For "nefarious" mood tag — make Akane glance backward over her shoulder, eye-catch with viewer
- If sky is too saturated — pull all colors one notch toward dim (oklch 0.49 0.151 28.4 for vermillion)
- If station reads too urban — replace with rural fire-shrine (tori-gate silhouette, vermillion paint flaking)

#### Prompt 5.1.C — "Nemu at the earth bus-stop, mid-day" (returning · earth-affinity)

```
[Same opening through "9:16 composition."]

Foreground center-right: Nemu, a young woman in a worn honey-amber linen
work-coat over a cream undertunic, seen from three-quarter behind. She
holds a wooden walking-staff tipped with a small earth-amber crystal that
catches the noon sun. She occupies 22% of vertical canvas. Her posture
suggests tiredness — slight forward lean — but rooted, not collapsed.

Midground: a sun-baked clay bus-stop with a tile roof, terracotta pots
nearby with desert-flowers in honey-amber bloom. Elemental stones on the
bench glow with steady honey-vivid light (oklch 0.85 0.153 83.8).

Background: rolling honey-amber farmland under a sun-bleached cream sky
(oklch 0.96 0.02 85). A distant Tsuheji village rooftop line, ink-drawn.
The sun sits high — directly overhead, slightly veiled by haze.

Lighting: high-noon, near-vertical, mostly soft via the haze. The amber-
crystal at the staff-tip is the small additional warm point; mid-day
itself is the dominant light.

Material + composition + color economy + NO list + Output: same as 5.1.A.
```

**Iteration knobs:**
- For "exhausted" mood — heat-shimmer at horizon, dustier palette overall
- If too monotone — add a single pop of cooler color via a water-blue cloth tied to the staff
- If midday feels static — shift to "late afternoon, sun just past zenith" for slight long-shadow drama

#### Prompt 5.1.D — "Ren at the metal bus-stop, autumnal night" (returning · metal-affinity)

```
[Same opening through "9:16 composition."]

Foreground center-right: Ren, a man in a dark plum-violet wool coat over
a slate undershirt, seen from three-quarter behind. He carries an old
brass railway-lantern at hip — its flame burns metal-vivid (oklch 0.52
0.126 309.7) with a violet inner heart. He occupies 22% of vertical
canvas. Posture: a moment of pause, gentle.

Midground: a covered iron-and-wood bus-stop with autumn maple leaves
(amber-fading-to-rust) drifting past. The lantern light makes the leaves
on the ground glow. Elemental stones on the bench: deep plum-violet,
faintly humming.

Background: a Tsuheji forest-edge under a dark autumn night sky (oklch
0.18 0.02 260 deepening upward). Stars faintly visible; a sliver-moon
clipped behind a leafless branch. Distant chimney-smoke rises in slow
columns from out-of-frame houses, lit gold from below.

Lighting: lantern-as-primary, second small warm point in the chimney-
smoke glow. Deep violet shadows. This is the WARMEST + DEEPEST of the
five — the one that reads "Old Horai dark theme" most directly.

Material + composition + color economy + NO list + Output: same as 5.1.A.
```

**Iteration knobs:**
- For "loving" mood — Ren glances backward gently toward viewer, small smile
- If lantern not violet enough — strengthen with "the flame is unmistakably violet-hearted, not a normal yellow flame"
- If too dark — bring stars up + add a single chimney-smoke gold-lit column for second warm anchor

#### Prompt 5.1.E — "Ruan at the water bus-stop, rainy evening" (returning · water-affinity)

```
[Same opening through "9:16 composition."]

Foreground center-right: Ruan, a young woman in a navy-indigo raincoat
over a pale-water undershirt, seen from three-quarter behind. She holds
a translucent paper-umbrella overhead — the umbrella catches puddle-light
from below in cool water-vivid blue (oklch 0.53 0.18 266.2). She occupies
22% of vertical canvas. Slight forward shoulder slump — the "overwhelmed"
mood without losing dignity.

Midground: a glass-paneled bus-stop in the rain, water sheeting down the
glass. A single warm-amber street-lamp behind her reflects in the wet
pavement, providing the warm-point counterpoint to the cool sea of blue.
Elemental stones on the bench: water-vivid, pulsing slowly.

Background: a Tsuheji harbor town blurred by rain — distant boats with
yellow port-lights, the sea behind. Sky moves from deep water-dim (oklch
0.38 0.15 266.2) at top through water-pastel (oklch 0.88 0.06 230) at
the horizon where the sun's afterglow lingers. Heavy rain ink-drawn as
soft slanting strokes.

Lighting: dual-source — cool indigo from sky/rain, single warm street-
lamp amber behind Ruan. The COOLEST of the five.

Material + composition + color economy + NO list + Output: same as 5.1.A.
```

**Iteration knobs:**
- For "overwhelmed" mood — rain drops the umbrella canvas slightly under-curve
- If too dark — restore some sunset afterglow at the horizon
- If reads too sad — add one warm window glow in the distance (boat or house) as second warm point

---

### §5.2 · ASSET — Battlefield scenes × 5 elements (gameplay backdrops)

**Intent:** The arrange + clash phases currently use the same generic ghost-map backdrop. Top-tier card combat (Inscryption, Wildermyth, Monster Train) treats the **scene** as the battlefield. Generate one battlefield per element — the bus-stop scene at the appropriate time-of-day, framed wide-cinematic so the 5-card lineup can be laid on the bench-as-surface.

**Reference anchor:** Inscryption's cabin-as-table × Wildermyth's storybook-stage × Spiritfarer's lantern-warmth.

**Compositional rule:** 16:9 horizontal frame. Empty-foreground bench/table surface occupies the lower 35–40% (where the lineup will visually sit). Caretaker present but small + off-axis (left or right third — never center; center is where cards will live). Background recedes painterly + atmospheric. NO UI, NO frames, NO captions.

#### Prompt 5.2.A — "Wood battlefield — Kaori's sakura bench, spring morning"

```
A 2D hand-painted Studio Ghibli-style background. Horizontal 16:9
composition. Cinematic widescreen.

Lower 40% of frame: a long wooden bench under a sakura tree, viewed in
three-quarter perspective from slightly above. The bench surface is the
visual SURFACE — clean, empty, ready to hold objects (cards). Sakura
petals scattered sparsely on the wood. The bench occupies the foreground
horizontal axis.

Middle 30%: Kaori, in a sage-green yukata, seated cross-legged at the
LEFT END of the bench (occupies the left-third). She is small in frame
(~18% of vertical), facing right toward the bench surface. She is calm,
hands folded, waiting. To her right on the bench: empty space where
five elemental stones will sit (this empty space is the play area).

Upper 30%: the sakura tree spreading overhead, branches arcing across
the upper frame. A wuxing sigil floats faintly above the bench center
(jade-green, glyph 木) — the sigil is the warm-point of life. Beyond
the tree, soft hills and Tsuheji village rooftops.

Lighting: soft early-morning sun from upper-right, dappling through the
sakura. Jade-olive ambient + warm amber sigil-glow. Long soft shadows
fall left across the bench.

Color economy: jade-olive dominant + sakura-pink mid-accent + sigil-
amber warm point + sky-cream upper.

Material: same hand-painted Ghibli-warm style as Lock screen series.
Slight film grain, painterly brush texture, ink-line discipline.

NO logos, NO text/wordmarks (sigil glyph 木 is the only "type"),
NO UI elements, NO frames, NO HUD, NO modern intrusions, NO five cards
yet — the bench is EMPTY where cards will go in-app.

Output: 2560×1440px (16:9), PNG no transparency.
```

#### Prompt 5.2.B — "Fire battlefield — Akane's station platform, sunset"

```
[Same opening 3 paragraphs of frame setup.]

Lower 40%: a low iron-frame railway-station bench, viewed three-quarter
from slightly above. Brass-edged, with a vermillion lacquer worn at the
corners. Empty surface, ready for stones.

Middle 30%: Akane, in deep vermillion kimono, standing at the RIGHT END
of the bench (right-third). Small in frame, profile toward the bench
surface. A small brazier nearby with low embers — the second warm point.

Upper 30%: sunset sky over a Tsuheji station-town silhouette. Power
lines cross-hatch. A wuxing sigil 火 floats above the bench center,
vermillion-glowing. Sun has just dropped behind the rail-line.

Lighting: sunset rim-light from upper-right (the dropping sun), brazier
embers as secondary warm point, sigil as third small accent. Long
copper-edged shadows.

Color economy: vermillion dominant + sunset-pink mid + brazier-amber +
metal-violet sky-zenith sliver.

Material + NO list + Output: same as 5.2.A.
```

#### Prompt 5.2.C — "Earth battlefield — Nemu's clay bus-stop, high noon"

```
[Same opening 3 paragraphs.]

Lower 40%: a sun-baked clay-and-terracotta bench, viewed three-quarter
from slightly above. Clay roof-tile fragments and a stone-edged platform
beneath. Surface empty, warm-cream stone.

Middle 30%: Nemu, in honey-amber linen work-coat, seated on the LEFT
END (left-third). Walking-staff propped against the bench beside her;
the staff's earth-crystal tip glows steadily. Tired posture but rooted.

Upper 30%: rolling honey-amber farmland under a hazy cream-sun sky.
Distant Tsuheji village rooftops. Wuxing sigil 土 floats above bench
center in honey-amber. The sun is overhead, behind a thin haze.

Lighting: noon-high, soft via haze, near-vertical. Crystal-tip and
sigil as small warm points. Short hard ground shadows beneath the
bench.

Color economy: honey-amber dominant + cream-sky upper + earth-vivid
small accents. Warmest of all 5 battlefields.

Material + NO list + Output: same as 5.2.A.
```

#### Prompt 5.2.D — "Metal battlefield — Ren's covered bus-stop, autumn night"

```
[Same opening 3 paragraphs.]

Lower 40%: an iron-and-wood covered bus-stop bench, viewed three-quarter
from slightly above. Dark-stained wood with brass fittings, autumn maple
leaves scattered across the surface. Surface empty in the center.

Middle 30%: Ren, in plum-violet wool coat, standing at the RIGHT END
(right-third). Brass railway-lantern at hip — flame is metal-violet,
the primary warm-point of the scene.

Upper 30%: a Tsuheji forest-edge at autumn night. Stars faintly visible.
Sliver-moon clipped behind a leafless branch. Out-of-frame chimney-smoke
columns are warm-lit gold from below, providing depth. Wuxing sigil 金
floats above bench center in plum-violet.

Lighting: lantern-as-primary warm point. Deep violet shadows. Star-glow
in upper sky. This is the DEEPEST of the 5 battlefields — closest to
the "Old Horai" dark theme aesthetic.

Color economy: plum-violet dominant + deep night-ink upper + lantern-
violet warm point + distant chimney-amber accent.

Material + NO list + Output: same as 5.2.A.
```

#### Prompt 5.2.E — "Water battlefield — Ruan's glass-paneled bus-stop, rainy evening"

```
[Same opening 3 paragraphs.]

Lower 40%: a glass-and-steel bus-stop bench, viewed three-quarter from
slightly above. The glass roof above sheets with rain. Surface empty,
pale-water reflection on the bench wood. A few raindrops have made it
to the bench — small puddles bead.

Middle 30%: Ruan, in navy-indigo raincoat, seated on the LEFT END (left-
third). Translucent paper-umbrella folded beside her. Slight forward
shoulder slump.

Upper 30%: a Tsuheji harbor town blurred by rain. Distant boats with
yellow port-lights. Wuxing sigil 水 floats above bench center in
water-vivid blue. Sky moves deep water-dim at top to water-pastel at
horizon where sun-afterglow lingers.

Lighting: dual-source — cool indigo from sky/rain dominant, one warm
street-lamp amber off-frame casting a soft pool of light on the bench
center (the warm-point — without it the scene reads too sad).

Color economy: indigo-water dominant + rain-pastel mid + harbor-amber
warm point + sun-afterglow horizon-cream.

Material + NO list + Output: same as 5.2.A.
```

**Iteration knobs across all 5 battlefields:**
- If too "Ghibli-cute" → strengthen ink-line discipline, push toward Disco Elysium painterly density
- If bench surface not flat-readable enough → "the bench surface is the cleanest, calmest area of the painting — no clutter, slightly out-of-focus midground, sharp foreground edge"
- If sigil reads as cartoonish UI → "the wuxing kanji glyph is hand-brushed in ink as if drawn by a calligrapher, NOT a digital icon — it should look like ink soaking into rice paper, hovering over the bench center"
- If caretaker too prominent → "the caretaker is a quiet anchor, NOT the subject. The empty bench center IS the subject. Caretaker is roughly 1/6 the height of frame."

---

### §5.3 · ASSET — HD caretaker portraits × 5 (battlefield dialogue moments)

**Intent:** Per the combat-screen dig — "Caretaker portrait as the dialogue moment. During clashes, the caretaker reacts (Hades portrait-banner move) — but only at moments of emotional weight." We need higher-fidelity caretaker portraits for these moments. The existing `public/brand/characters/{name}.png` are full-body brand art; we need EMOTING three-quarter bust shots.

**Reference anchor:** Hades portrait UI (Zagreus/Melinoë three-quarter, painted, intense eye-contact) × Spiritfarer's hand-drawn warmth.

**Compositional rule:** vertical 3:4 bust portrait, three-quarter view, neutral background (will be composited over battlefield). Six expressions per character (calm, focused, concerned, triumphant, defeated, secret-smile). Soft-painted, NOT anime-flat. Eye contact present in 3 of 6 expressions.

#### Prompt 5.3.A — "Kaori portrait set, six expressions"

```
Generate six painted three-quarter bust portraits of the same character
across one composition. Vertical 3:4 each, arranged as a 3×2 grid.

Character: Kaori — young woman, early thirties, calm-hopeful presence.
Long dark hair pulled back loosely with sakura-pink ribbon. Sage-green
yukata with subtle cherry-blossom embroidery at collar. Skin warm
ivory. Eyes deep ink-brown.

Style: 2D hand-painted, Hades-portrait fidelity, Spiritfarer-soft. Each
portrait painted as if by the same artist in the same sitting. No anime
cel-shading, no realism, no manga. Soft-shaded, ink-line discipline.
Slight visible brush texture.

Background per portrait: neutral cream wash (oklch 0.94 0.015 90) with
faint jade-green wuxing-wood underglow at the lower edge. The portraits
should composite cleanly over any battlefield.

Six expressions, left-to-right top-to-bottom:
  1. CALM — eyes closed, slight serene smile, hands folded out of frame
  2. FOCUSED — eyes open, looking down/forward at imagined cards on a
     surface, brow slightly knitted in concentration
  3. CONCERNED — eyes raised toward viewer, lips parted slightly, small
     furrow between brows
  4. TRIUMPHANT — eyes wide and bright, full smile, slight head tilt
     up-right
  5. DEFEATED — eyes downcast, soft frown, head tilted slightly down-
     forward, hand brought up near face (gesture of "ah, well")
  6. SECRET-SMILE — eyes meeting viewer's, knowing smirk, head tilted
     slightly down (this is the "I have one more card to play" face)

Color economy: ivory skin + sage-green clothing + sakura-pink hair ribbon +
ink-brown eyes. Restraint.

NO text labels on the image (the grid labels will be added in post),
NO frames between portraits (just clean grid),
NO backgrounds beyond the neutral wash,
NO 3D rendering, NO modern photography reference.

Output: 3072×2048px (3:2 overall for the grid), PNG. Each portrait
within the grid is roughly 1024×1024.
```

**Iteration knobs:**
- If too youthful → "she is unmistakably an adult, late twenties to early thirties, with quiet experience behind the eyes"
- If style drifts → "imagine a single painter — Joe Hisaishi's color sense combined with Hades-portrait fidelity — painting all six in one sitting"
- If expressions don't read distinct → "the six expressions must be readable from across a room — exaggerate the gesture and brow more than feels natural"

#### Prompts 5.3.B — 5.3.E — Akane/Nemu/Ren/Ruan portrait sets

Use 5.3.A as the template. Substitute:

| Character | Hair/Ribbon | Clothing | Skin | Background underglow |
|---|---|---|---|---|
| **Akane (fire)** | jet-black hair pulled tight, vermillion ribbon | deep vermillion kimono, ember-pattern weave | warm copper | vermillion at lower edge |
| **Nemu (earth)** | sandy-amber braid down one shoulder, no ribbon | honey-amber linen work-coat | sun-tanned warm | honey-amber at lower edge |
| **Ren (metal)** | short black hair, no ribbon (he's male) | plum-violet wool coat, slate scarf | cool fair | plum-violet at lower edge |
| **Ruan (water)** | wet dark-blue hair loose, navy ribbon | navy-indigo raincoat over pale undertunic | cool fair | water-blue at lower edge |

Same six expressions for each. Same style discipline. Same NO list. Same output spec.

**Special note for Akane:** her "nefarious" mood-tag should show in expressions 4 (TRIUMPHANT becomes "sly triumphant — eyebrow raised, half-smile") and 6 (SECRET-SMILE becomes "outright smirk with one fang showing").

**Special note for Ren:** his "loving" mood-tag should show in expressions 1 (CALM with eyes-just-barely-open, paternal) and 3 (CONCERNED becomes "softly concerned for someone else, not himself").

---

### §5.4 · ASSET (optional, future cycle) — Ornate wuxing-themed card frames × 4 rarities

**Intent:** The current `/art/cards/frames/{rarity}.svg` are functional geometric SVGs. Top-tier (Slay the Spire, Hades) treats card frames as **hand-painted ornament** — each frame a small painting in itself.

This is a future cycle target — NOT urgent. Documented here so the operator can fire it when ready.

**Reference anchor:** Slay the Spire painted card frames + Hades boon-card ornament + Japanese inrō-lacquer carved wood panels.

#### Prompt 5.4 — "Wuxing card frame set, four rarities, painted ornament"

```
Generate a horizontal 4×1 grid of card frames — same vertical 3:4 card
shape repeated four times across, each frame increasingly ornate from
left (Common) to right (Rarest).

Style: painted ornament — like Slay the Spire's frames, like Japanese
inrō lacquer panels, like Hades boon-cards. Each frame is a small
painting that surrounds a transparent inner cavity (the card's art
will be placed inside).

Frame 1 — COMMON: simple ink-line wood border, undyed bamboo color
(oklch 0.94 0.015 90 cream + 0.66 0.114 112.7 jade for accents). Clean
calligraphic edge. No metal, no jewels.

Frame 2 — MID: bamboo border with subtle inlay — a thin band of brass
nail-heads at the four corners. Mid-saturation, more visual weight than
common. Honey-amber accent (oklch 0.7 0.12 85).

Frame 3 — RARE: lacquered wood frame with carved relief — sakura petals
running along the upper edge, a small wuxing-five-element sigil at the
top-center (carved wood relief, not painted). Deeper vermillion and
honey-amber accents. The frame has visible 3D depth via painted
shadow.

Frame 4 — RAREST: full lacquer-and-gold-leaf treatment. Carved dragons
or kirin along left and right edges, koi swimming up the bottom. A
central five-element circular sigil at the very top-center, gold-leaf
on lacquer. Deep night-violet base color (oklch 0.18 0.02 260) with
saturated honey-vivid + vermillion + jade highlights. The frame reads
as an heirloom — something owned, passed down.

Style discipline: ALL FOUR frames painted by the same imagined artist,
in the same style, so they read as a single set escalating in
materiality. Hand-painted, NOT digital geometric. Visible brush.

The center of each frame is TRANSPARENT (or marked clearly as the empty
art zone) — the card's character art will be placed inside.

Output: 4 separate images, each 1024×1400px (3:4 vertical), PNG with
transparent center cavity. Submit as a single 4096×1400 horizontal
sheet OR as four separate exports.

NO text, NO numbers, NO HP/attack stats, NO modern UI elements. Just
the frame as ornament.
```

**Iteration knobs:**
- Tier escalation steps too small → push Rare further by adding a third material (lacquer + gold + jade inlay)
- Frame center cavity unclear → "the inner cavity is a clean 3:4 rectangle, perfectly clear, marked with a faint dotted line that will be removed in post"
- Style drift across the four → "treat this as a craftsman's portfolio — he made all four for one collector"

---

## §6 · Composition workflow (operator-runnable, end-to-end)

The brief's `delivery/direct-render` composition pattern, executed manually:

1. **Generate** (the-mint / image gen)
   - Pick ONE prompt above (start with 5.1.A — first-visit Kaori lock screen)
   - Paste into ChatGPT image / nano-banana
   - Generate 3–5 variants
   - Save all 5 to a working folder

2. **Curate** (artisan / decomposing-feel)
   - Compare variants against the taste-token rules (§4) — does the OKLCH discipline hold?
   - Compare against the reference anchor (§5.1 says Spiritfarer × Tunic × Hollow Knight)
   - Eliminate variants that fail the ALWAYS/NEVER list (§2)
   - Reduce to 1–2 candidates

3. **Iterate** (artisan ↔ the-mint loop)
   - For each surviving candidate, identify ONE thing to push (lantern bigger? caretaker smaller? sky shift?)
   - Use the per-prompt iteration knobs as starting points
   - Generate 2–3 more variants with the push
   - Loop until ONE candidate emerges as "this is the lock screen"

4. **Composite** (the-mint / preparing-assets)
   - Run final image through the asset-prep pipeline
   - Resize to 2048×3640 (for lock) or 2560×1440 (for battlefield)
   - Compress to web-WebP @ quality 85
   - Place at `public/art/lock-hero/kaori-wood-spring.webp` (or equivalent)

5. **Wire into the layer system** (lib/cards/layers)
   - For lock-screen hero: replace `WORLD_MAP_TEXTURE` in `EntryScreen.tsx` with the new hero image (or compose as a new layer behind the existing UI)
   - For battlefield: register the 5 scenes in the layer registry as a NEW layer kind (`battlefield`, faces=['front'], z:-10) so the CardStack stays focused on the card itself and the battlefield is a sibling layer at the battle-scene level

## §7 · Five things the operator should decide before generating

Open questions where I'm directing but the operator has the final cut:

1. **First-visit vs returning visit on Lock screen** — should new visitors always see Kaori-wood-spring (the "default introduction face"), OR pick by today's wuxing weather (so a fire-weather day shows Akane regardless of player history)? My recommendation: today's weather drives it, with Kaori-spring as the fallback when weather hasn't loaded yet. This couples Lock with `weather` prop more meaningfully.

2. **HD caretaker portraits — Hades-style banner or floating bust?** Banner = bottom slide-in during dialogue (consumes 25% of screen). Floating bust = persistent small portrait in corner. My recommendation: banner for emotional moments (start, mid-clash, end), floating bust during arrange (corner mascot showing the player's caretaker companion).

3. **Battlefield scene per-element OR shared neutral?** Per-element (5 backgrounds) buys atmospheric depth but costs storage + asset-load. Neutral shared (1 background tinted by current weather) costs less but feels generic. My recommendation: ship per-element, because the brief specifically named caretaker scenes as the source of THE QUIZ'S WIN — same pattern, different verbs, scales the IP.

4. **Card frame ornate upgrade — this cycle or future?** Future cycle. Lock + battlefield + portraits are the immediate need. Frames are polish-on-polish.

5. **Generated-asset register — where do these live in the layer system?** New layer kinds proposal:
   - `lock_hero` (z:-20, faces=['front'], element-keyed, single image per element)
   - `battlefield` (z:-10, faces=['front'], element-keyed, single image per element)
   - `caretaker_emote` (z:60, faces=['front'], element-keyed × 6 expression-keyed) — used during dialogue moments
   - All three would also get manifest entries so `pnpm cards:audit` covers them.

## §8 · Connection to existing doctrine

These prompts AREN'T orthogonal — they extend the existing system:

- **Layer system (lib/cards/layers)** — these images become NEW layer kinds with the same registry shape (battlefield, lock_hero, caretaker_emote). The substrate I built today is the integration target.
- **Audit-feel verdict (§5)** — the verdict explicitly said "no new assets needed for Lock + Quiz." That was correct for compositional FEEL fixes. THESE prompts are different scope — they're for elevating from "compositionally correct" to "top 0.001% indie." The verdict's compositional fixes (Quiz selection deltas, Lock wuxing-status, tile-btn anticipation) are landed and stay; these images are the LAYER ABOVE that.
- **Hollow Knight parallax-planes dig finding** — Team Cherry's "3D lie" (10–12 Z-spaced PNG planes through a perspective camera) is structurally what the CardStack DOM-stack already does. Future cycle: extend CardStack into a PARALLAX wrapper for lock-screen + battlefield depth.
- **Registry doctrine (registry-doctrine-2026-05-12.md)** — the P4 Registry Plane is where new layer kinds belong. Generated images join `registry.cards.layers` alongside the existing 8 layer kinds.

## §9 · Operator-runnable next steps (paste-and-fire)

```text
1. Open ChatGPT (or nano-banana / DALL-E 3 / Recraft)
2. Paste Prompt §5.1.A verbatim — generate 5 variants
3. Pick favorite; iterate via knob set under 5.1.A
4. When one variant locks, save as public/art/lock-hero/kaori-wood-spring.png
5. Continue through §5.1.B, .C, .D, .E for the other 4 caretakers
6. Then move to §5.2 battlefields (5 prompts)
7. Then §5.3 caretaker portraits (5 prompts — each generates a 6-expression sheet)
8. Hand assets back; I wire them into the layer system per §6 step 5
```

Estimated cost (ChatGPT image API at current pricing): ~$1.50 per prompt × 15 prompts (5 lock + 5 battlefield + 5 portrait) × 5 variants per prompt = ~$112 budget for full asset pass. If only running the lock-screen set first: ~$37.

Estimated wall-clock: 15–30 minutes per prompt session if operator iterates, 4–6 hours total for full pass.
