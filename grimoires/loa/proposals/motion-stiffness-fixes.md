---
status: draft-r0
type: doctrine + audit
author: claude (Opus 4.7 1M)
created: 2026-05-12
cycle: battle-foundations-2026-05-12 (post-PR /remote-control session)
trigger: operator: "the feeling i have right now with the motion and movement of the cards is too stiff. Provide rigorous feedback for improvement... bridging the gap with the motion of top indie game studios as well as shaders"
companion: juice-doctrine.md (decisions about juice moments) + composable-vfx-vocabulary.md (VFX kit pattern)
---

# Motion Stiffness — Rigorous Diagnosis + Camera Doctrine

## The diagnosis

Eight reasons our motion reads as cardboard, ranked by how much each is
contributing to the "stiff" feeling:

### 1. Single-axis transforms (HIGH)

We were doing `translateY + rotate` and calling it animated. Top indies
layer **4-6 axes simultaneously** (translate, rotate, scale, skew, blur,
brightness, hue-rotate). The eye reads multi-axis as "alive";
single-axis as "scripted." A card-deal with translate alone says "the
card moved." Translate + rotate + scale + blur + brightness says "the
card *fell into place*."

**Fix shipped:** card-deal now layers translateY + rotate + scale +
blur + brightness across 5 keyframe stops.

### 2. Symmetric easing (HIGH)

Every animation used the same `cubic-bezier(0.34, 1.56, 0.64, 1)`
end-to-end. Real motion has **asymmetric anticipation**: heavy lead-in,
snappy release, slow decay. CSS supports per-keyframe
`animation-timing-function` — different curve per phase of the animation.

The four-stage canonical:

```
0%  → 25%  cubic-bezier(0.42, 0, 1, 1)        easeInQuad — gravity, anticipation
25% → 65%  cubic-bezier(0, 0, 0.2, 1)         easeOutCirc — release
65% → 85%  cubic-bezier(0.34, 1.56, 0.64, 1)  overshoot — settle bounce
85% → 100% cubic-bezier(0.4, 0, 0.2, 1)       easeInOut — final calm
```

**Fix shipped:** card-deal keyframes now declare per-stop timing.

### 3. No constant micro-motion (HIGH)

Cards `card-deal` once and freeze. **Balatro cards bob. Hearthstone cards
drift. Loop Hero cards fidget.** Constant low-amplitude breath is the
biggest gap between "cardboard" and "alive."

We had the tokens (`--breath-fire: 4s` etc.) and per-element keyframes —
they just weren't applied to `.player-card`. The reason: scaling via the
keyframes' own `transform: scale()` would clobber the fan rotate/translate.

**Fix shipped:** `app/battle/_styles/CardBreathing.css` uses
**registered CSS custom properties** (`--breath-scale` + `--breath-opacity`)
animated via keyframes. `.player-card`'s transform composes `scale(var(--breath-scale))`
into the existing fan transform. Five per-element keyframes at non-coprime
periods (3 / 4 / 4.5 / 5 / 6 seconds) — the row never visually lines up.
Opponent cards offset by 1.5s so player and opponent rows don't sync.

This is the single biggest "alive" win in the iteration.

### 4. No parallax (HIGH)

Mouse moves; nothing responds. **No depth illusion.** Every other indie
game responds to the cursor — even subtly. The player's eye needs the
3D illusion to ground itself in the scene.

**Fix shipped:** `ParallaxLayer` component listens to mousemove on
`.battle-scene`, normalizes to -1..+1, writes `--parallax-x/y` (and
per-layer factors for backdrop, arena, cards). The deepest layer
(battlefield map) moves the most (4px max). Cards barely move (0.8px
max). **Translation only, never rotation, capped via the unit circle.**
RAF-throttled. No event listener attached when `prefers-reduced-motion`.

### 5. State-driven only — no perpetual world-pulse (MEDIUM)

Top indies have animations that **don't care about state**. The map
breathes whether you're playing or not. Slay the Spire's vignette
breathes during menu. Loop Hero's tiles drift.

**Partial fix shipped:** `arena-idle-drift` keyframe runs continuously
during arrange phase — figure-8 translation, 18s period, pauses
during clashing/disintegrating so impacts read cleanly.

**Still 🔴:** the BattleField map texture itself doesn't breathe.
`--tide-n` is a CSS variable that's set but consumed only by a single
translateY rule in `.map-detailed`. The map should pulse a brightness +
saturation modulation tied to weather element.

### 6. No secondary motion (MEDIUM)

Swap two cards → only those two move. **Real fans ripple** — adjacent
cards shadow-pulse in response. Disney 12 principles: secondary action.

**Status: 🔴 not shipped this iteration.** A 30-line addition: when
`tap-position` swaps positions, briefly add a `.ripple-from` class to
positions between A and B, with a `box-shadow` pulse animation. Out
of scope for this session — captured for next.

### 7. Camera was a static observer with the WRONG hitstop (HIGH)

The previous `hitstop-shake` keyframe did multi-axis random jitter
(translate(-2px, 1px) → translate(2px, -1px)...). On small viewports
this reads as nausea-inducing vibration, not impact.

**Fix shipped:** Replaced with `hitstop-push` — a single 4px directional
translation toward the clash + brief saturation+brightness bump, then
return. Reads as IMPACT. Translation only, never rotation.

The `.battlefield` itself now also gets parallax translation as its
base transform. The hitstop animation composes on top via the keyframe
expressing the FULL transform (parallax + push) — not relying on
`animation-composition` which has spotty support.

### 8. Per-element weight not differentiated (MEDIUM)

Jani / caretaker_a / caretaker_b animated identically. World-purupuru
gives each element its own breathing rhythm — slow ones feel heavy,
fast ones feel agitated.

**Fix shipped (partial):** Per-element breathing periods are now applied.
Wood (6s) feels patient. Fire (4s) feels agitated. Earth (5.5s) feels
heavy. Metal (4.5s) has a sharp spike + flutter — mechanical. Water (5s)
is tidal — long inhale, short exhale.

**Still 🔴:** card TYPE doesn't differentiate. Jani (1.25x power)
should feel heavier than caretaker_a (1.0). Could express as slightly
deeper breathing amplitude on jani cards, or a subtle weight-shadow.
30 lines. Next iteration.

## Camera Doctrine — subtle without nausea

The constraint the operator named: "subtle camera movement without being
nauseous."

The geometry of nausea, in motion-design terms:

| What induces nausea | What doesn't |
|---|---|
| Rotation under user control | Translation under user control |
| Fast camera movements (>20px in <100ms) | Slow camera movements (>500ms for 4px) |
| Acceleration without anticipation | Eased curves with anticipation phase |
| Movement against the player's input direction | Movement with or perpendicular to input |
| Periodic, predictable cycles | Aperiodic / non-coprime cycles (organic) |
| Full-screen blur/distortion | Per-element blur/distortion |

**The five rules:**

1. **Translation only.** Never rotate the camera. Never zoom on impact.
   Never tilt. Cards rotate; the camera does not.

2. **Cap magnitudes.** Parallax: 4px max on deepest layer, 0.2-0.5x on
   foreground. Idle drift: 2px max. Impact push: 4-6px max, single
   direction.

3. **Slow speeds.** Idle drift: 18s+ for a full cycle. Parallax decay:
   320ms+. Camera moves should be felt, not seen.

4. **Compose translations, never blend rotations.** `transform:
   translate(parallax + drift + push)` is safe. `transform: rotate +
   translate` on the camera is not.

5. **Always provide an opt-out.** `prefers-reduced-motion: reduce` kills
   parallax (no event listener), kills idle drift (animation: none),
   kills hitstop-push. The substrate stays the same; only motion is
   suppressed.

## Shaders — what they actually are at the indie level

People say "shaders" loosely. In CSS terms:

| CSS | Equivalent |
|---|---|
| `filter: blur/saturate/hue-rotate/contrast/brightness` | GPU post-process shaders |
| `mix-blend-mode` | Composite shader |
| `backdrop-filter` | Full screen-space shader on what's behind |
| `mask-image` with gradients | Alpha mask |
| `@property` registered custom properties → animatable | Shader uniforms |
| `conic-gradient` / `radial-gradient` | Procedural texture |
| WebGL canvas overlay | Real fragment programs |

What top indies do with these (achievable in our stack today):

- **Balatro** has a CRT/VHS shader on the WHOLE GAME.
  `filter: contrast(1.05) saturate(1.1) brightness(0.97)` + an animated
  noise overlay via `repeating-conic-gradient` mask.
- **Hearthstone** uses `backdrop-filter: blur(2px)` on the active card to
  push it forward (focus-pull). One-line addition for us.
- **Slay the Spire** has a `radial-gradient` vignette overlay that
  breathes opacity over 8s. Two CSS rules.
- **Loop Hero** has scanline-like `repeating-linear-gradient` masks for
  nostalgic feel. One CSS rule.
- **Inscryption** uses `filter: drop-shadow(...)` per card so cards have
  visual weight — heavier cards drop a longer shadow.

We already shipped a **CSS-shader-style iridescent foil** in the previous
iteration. The same pattern (conic-gradient + mix-blend-mode + filter
hue-rotate + @property animatable custom property) can extend to:

- A whole-game CRT/VHS toggle (one filter on `.battle-scene`)
- Per-card weight shadows (drop-shadow keyed to card.cardType)
- Backdrop focus-pull on hover (backdrop-filter on siblings)
- Animated noise grain overlay (mask + conic gradient)

## What's shipped this iteration

| What | File | Lines |
|---|---|---|
| **Per-element breathing** via registered CSS custom props | `CardBreathing.css` | 75 |
| **Asymmetric card-deal** — 5 keyframe stops, per-stop easing | `BattleHand.css @keyframes card-deal` | 30 |
| **Mouse parallax camera** — translation-only, RAF-throttled | `ParallaxLayer.tsx` + scene CSS | 100 |
| **Idle camera drift** — figure-8 on arena, pauses during clash | `BattleScene.css .arena` | 30 |
| **Hitstop replaced** — directional push + saturation, no jitter | `BattleField.css .battlefield.hitstop` | 20 |
| **Player card transform composition** — fan + parallax + breath | `BattleHand.css .player-card transform` | 5 |
| **Battlefield base transform** — parallax | `BattleField.css .battlefield` | 5 |
| Doctrine + diagnosis | this file | 250 |

## What's NOT shipped (next bites, in priority order)

| # | Item | LOC | Why next |
|---|---|---|---|
| 1 | **Map breathing** — `.map-flat` opacity + brightness keyed to weather element, 8s period | 30 | Closes "world doesn't breathe" — biggest remaining 🔴 |
| 2 | **Backdrop focus-pull on hover** — `backdrop-filter: blur(2px)` on `.lineup-row:has(.player-card:hover) .player-card:not(:hover)` | 8 | Hearthstone's signature card-isolation move |
| 3 | **Secondary motion on swap** — adjacent positions ripple when player swaps | 30 | Closes "fan doesn't respond to its own swaps" |
| 4 | **Per-card-type weight shadows** — jani drops longer drop-shadow than caretaker_b | 20 | Differentiates type beyond breathing |
| 5 | **Vignette + animated grain overlay** — full-scene `radial-gradient` + noise | 40 | Atmosphere — Slay the Spire feel |
| 6 | **CRT/VHS shader toggle** — settings-controlled `filter` on `.battle-scene` | 30 | Balatro-style optional aesthetic |
| 7 | **Number count-up on ComboBadge** — Balatro chip crawl | 60 | (already in juice-doctrine.md as next-bite #1) |
| 8 | **Result word-by-word + caretaker walk-on** | 110 | (already in juice-doctrine.md as next-bite #2) |

## When we move to real shaders

The `@property` approach we're using IS the bridge. Custom properties
(animatable, typed) are syntactically equivalent to GLSL uniforms. When
we mount a `<canvas>` Three.js / OGL layer, the same pattern works:

```js
// CSS world
@property --breath-scale { syntax: '<number>'; ... }

// WebGL world
uniform float u_breath_scale;
```

The card-foil's conic-gradient + mix-blend-mode + filter:hue-rotate is
literally the CSS expression of a fragment program. Migrating to a real
shader means swapping the renderer; the inputs stay the same.

## The doctrine

> **Motion has three layers, not one:**
> 1. **The breath** — perpetual world-pulse, runs always, doesn't care about state. The thing that says "alive."
> 2. **The drift** — slow camera response to time + input. The thing that says "depth."
> 3. **The beat** — event-driven juice on consequential moments. The thing that says "that mattered."
>
> Most indie games miss layer 1 and overdo layer 3. The result feels
> "scripted." The fix is always: ship more breath, ship subtler drift,
> reserve beats for moments that earned them.

Every future motion decision in Purupuru should be classified into one
of these three layers. The juice doctrine handles layer 3. This doctrine
handles layers 1 and 2. The composable VFX vocabulary is the
infrastructure for all of them.
