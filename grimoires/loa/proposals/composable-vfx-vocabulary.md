---
status: draft-r0
type: doctrine
author: claude (Opus 4.7 1M)
created: 2026-05-12
cycle: battle-foundations-2026-05-12 (post-PR /remote-control session)
trigger: operator named VFX/asset/image bottleneck while stepping away
predecessor_audit: grimoires/loa/proposals/mechanics-legibility-audit.md
---

# Composable VFX Vocabulary

## The pattern

We solved the **substrate** bottleneck with the reducer/Effect/types stack.
We solved the **legibility** bottleneck with the MechanicsInspector + audit.
We're now solving the **VFX** bottleneck with the same primitive: a *typed,
composable registry* that the React tree reads from, not a fan-out of
hand-rolled components.

> **VFX kits are configs, not components.**
>
> Adding a new visual signature means adding a new entry to a registry.
> Not writing new JSX. Not branching a switch statement. Not duplicating
> CSS. The vocabulary is small (~6 particle kinds today). The registry
> can grow to 100 entries without touching the consumer.

## The shape

Every VFX kit is:

```ts
interface ElementVfxKit {
  readonly element: Element;
  readonly signature: string;       // human-readable — feeds inspector + audit
  readonly build: (seed: number) => readonly ParticleInstance[];
  readonly durationMs: number;      // parent cleanup uses this
}
```

A `ParticleInstance` is:

```ts
interface ParticleInstance {
  readonly kind: ClashVfxParticle;  // "ember" | "ring" | "root" | …
  readonly variant?: string;        // optional aux class (e.g. "vfx-ring--1")
  readonly style: Record<string, string>;  // inline CSS variables → keyframes
}
```

The inline `style` is the seam to the keyframes. Each particle has a few
CSS custom properties driving its animation — these are the equivalent
of vertex/fragment uniforms in a real shader.

```css
.vfx-ember {
  animation: ember-fly 400ms ... var(--ember-delay) forwards;
}

@keyframes ember-fly {
  0%   { transform: rotate(var(--ember-angle)) translateX(0); }
  100% { transform: rotate(var(--ember-angle)) translateX(var(--ember-dist)) translateY(-14px); }
}
```

`--ember-angle` and `--ember-dist` are the *uniforms*. The keyframe is the
*shader program*. The seed feeding `build()` is the *deterministic input*
— same clash idx, same particles. Replay-safe.

## What we shipped this pass

### `lib/vfx/clash-particles.ts`

The registry. 5 element kits:
- **fire** — 8 radial embers with seeded angles + sizes
- **earth** — 3 concentric quake rings (staggered)
- **wood** — 5 roots growing outward (seeded angles)
- **metal** — 1 slash + 4 shards (deterministic delays)
- **water** — wave collapse + implosion

Each has a `signature` string used by the MechanicsInspector and this doc.

### `app/battle/_scene/ClashVfx.tsx`

The dumb consumer. Reads `element`, `visibleClashIdx`, `activeClashPhase`
from BattleScene. On every `impact` phase: builds particles via
`buildClashParticles(element, seed)`, mounts them inside `.clash-zone`,
schedules cleanup after `durationMs + 50`.

The component is element-agnostic. Adding a sixth element (e.g. a
hybrid transcendence VFX) means adding to ELEMENT_VFX — nothing in
ClashVfx.tsx changes.

### `app/battle/_styles/ClashVfx.css`

Per-element keyframes, ported verbatim from world-purupuru cycle-088.
Each kind has its own keyframe; the inline CSS variables drive the
shape.

### `app/battle/_styles/CardFoil.css` — the "shader" study

A CSS-shader-style iridescent overlay on every card. Uses:
- `conic-gradient` for the rainbow sweep (the "fragment program")
- `mix-blend-mode: color-dodge` for energy-additive feel
- `@property --foil-rotation { syntax: <angle>; ... }` so the custom
  property is animatable
- `filter: hue-rotate(...)` per data-element to tint without
  redefining the gradient
- `prefers-reduced-motion` → static low-opacity foil

This is not WebGL. It IS a step toward thinking about visual effects
as **layered programs over uniforms**, not as one-off DOM nodes. The
move to real shaders (Three.js or pure GLSL via webgl-canvas) will
inherit this mental model directly.

## The triage matrix (where VFX still has gaps)

From the legibility audit + this pass:

| VFX target | Where | Status | Notes |
|---|---|---|---|
| Per-element clash particles | clash-zone | ✓ this pass | All 5 elements |
| Card iridescent foil | every card | ✓ this pass | First "shader" study |
| Clash orb (impact bloom) | clash-zone | 🔴 | World-purupuru has `<div class="clash-orb">` w/ radial-gradient + dynamic colors |
| Weather watermark | clash-zone backdrop | 🔴 | Ghost kanji behind clash. Easy. |
| Per-card breathing animation | card-slot | 🟡 | Tokens exist (`--breath-wood`, etc.) but the rules aren't applied to `.player-card` directly |
| Chain-link honey thread | between Shēng-chained cards | 🔴 | World-purupuru has `<span class="chain-link">` between card-slot-wraps |
| Setup Strike arrow | caretaker → jani pair | 🔴 | Visual indicator that the pair is empowered |
| Card disintegration particle burst | dying cards | 🟡 | Currently fades + blurs. Could spawn dust particles. |
| Shield burst | shielded cards | ✓ already shipped | But the visual could be richer |
| Hitstop screen flash | full arena on impact | 🟡 | `.battlefield.hitstop` keyframes exist; needs camera-shake intensity dial |
| Map breathing | BattleField backdrop | 🔴 | `--tide-n` is wired but no shader effect on the texture |
| Card-flip pack reveal | future pack-opening | ⚪️ deferred | Three.js or CSS 3D |
| Transcendence burn ceremony | future feature | ⚪️ deferred | Particle system w/ ash + ember |

## How to add a new VFX kit

1. Decide the *signature* — one human sentence: "8 radial embers fly outward."
2. Add the kit to `ELEMENT_VFX` (or a new registry like `TRANSCENDENCE_VFX`):
   ```ts
   const myKit: ElementVfxKit = {
     element: "fire",
     signature: "...",
     durationMs: 600,
     build(seed) {
       const r = rng(seed);
       return Array.from({ length: N }, (_, i) => ({
         kind: "myParticle",
         style: { "--my-angle": "...", ... },
       }));
     },
   };
   ```
3. Add the CSS:
   ```css
   .vfx-myParticle { animation: my-anim 600ms ... var(--my-delay); }
   @keyframes my-anim { ... }
   ```
4. Add a test ensuring particle count + determinism (see `clash-particles.test.ts`).
5. Optionally: extend the MechanicsInspector signature display to surface the new kit.

That's the full lifecycle. No JSX edits in the consumer.

## Where this points

The next obvious extensions of this vocabulary:

1. **TranscendenceVfx** — Forge/Void/Garden each get a signature particle kit. Use the same `buildXxxParticles(defId, seed)` shape.
2. **MapVfx** — for the BattleField backdrop: a kit per weather element that runs ambient particles across the map. Uses the SAME registry pattern.
3. **CardFoil → CardShader** — when we move to WebGL, the CSS conic-gradient becomes a fragment shader; the @property variables become uniforms. The component contract doesn't change.

The substrate paid off because we typed it before we built. The VFX
layer will pay off the same way — typed kits, dumb consumers, growing
registry.

## What I want the operator to do with this

- **Look at the kits in `lib/vfx/clash-particles.ts`** — that's the design surface. Tuning a clash signature = tuning the kit, not chasing CSS.
- **Decide which 🔴 in the triage table is next.** The chain-link thread, the clash orb, and the Setup Strike arrow are all sub-200-line additions that follow the same pattern.
- **When we're ready for Three.js**: do the world-stage map mesh + tide displacement. The VFX vocabulary already names the seam — `MapVfx` is the next registry.

The bottleneck moved.
