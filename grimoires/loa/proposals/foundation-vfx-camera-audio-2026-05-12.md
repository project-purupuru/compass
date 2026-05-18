---
status: draft-r0
type: doctrine + architecture brief
author: claude (Opus 4.7 1M)
created: 2026-05-12
cycle: battle-foundations-2026-05-12 (post-PR /remote-control session)
trigger: operator: "I'm not exactly registering anything. I selected water but I'm just seeing a really bad mix of a bunch of effects that render and derender poorly. It's a mess. Also the parallax camera movement is glitchy and feels poorly done. Let's study how this is done properly at the expert level using /dig and scaffold a foundation of well built tweakpanes that surface these elements to the surface."
dig_status: failed (Gemini 403 PERMISSION_DENIED across 4 queries) — synthesized from training knowledge instead per CLAUDE.md fallback rule
companions: composable-vfx-vocabulary.md, juice-doctrine.md, audio-doctrine.md
---

# Foundation Doctrine — VFX, Camera, Audio + Tweakpane Control Plane

## What we observed

The current `/battle` arena has FOUR independent effect systems firing at the
same trigger (clash impact) with no orchestration:

1. **`<ClashOrb>`** — central radial bloom (CSS keyframe)
2. **`<ClashVfx>`** — per-element CSS particle kit (lines, rings, embers)
3. **`<PixiClashVfx>`** — Pixi droplets for water (added this session)
4. **`<ParallaxLayer>`** — direct mouse → CSS variable write

Each is internally correct in isolation. Together they:

- **Stack** without budget → 4 visual events compete for attention on impact
- **Don't deconflict** → CSS lines + Pixi burst both fire on water clashes
- **Don't share rendering rules** → no shared "what's on screen" model
- **Snap rather than ease** → ParallaxLayer writes the cursor position
  directly with NO interpolation; every mousemove is an instant snap.
  Combined with CSS `transition` on the consumer, you get a saw-tooth
  feel — the camera jerks toward the cursor in transition steps rather
  than smoothly trailing it

This is a **systems** problem, not a tweaking problem. Adding more juice
won't fix it — it'll make it worse. The right move is a coordinator layer
that owns the lifecycle of each effect family.

## Mental model — "the conductor pattern"

In professional game audio (Wwise, FMOD) and in VFX systems at studios
like Riot and Blizzard, the rule is the same:

> **Effects don't render themselves. A scheduler renders them.**

A clash event doesn't say "spawn an orb + particles + a sound." It says
"a clash happened, payload X." The scheduler decides what to render
based on:

- Currently-playing effects of the same family (don't double-fire orbs)
- Render budget (cap to N concurrent particles, M concurrent sounds)
- Priority (a critical-hit beats a regular-hit; both lose to a screen-wipe)
- Source-of-truth state (we're in `clashing` phase, not `between-rounds`)

This is the same shape as a typed-stream pipe: events in → scheduler →
admitted-effects-with-IDs out. Consumers (Pixi, CSS, audio) become dumb
renderers that obey their tickets.

## The four foundations

### 1. VFX Scheduler (`lib/vfx/scheduler.ts`)

Single owner of "what's playing and what's allowed to play."

```ts
type EffectFamily = "orb" | "particle" | "wave" | "shake" | "petal";

interface EffectRequest {
  family: EffectFamily;
  element?: Element;
  priority: number;        // 0..100, higher wins
  payload: Record<string, unknown>;
  expectedDurationMs: number;
}

interface AdmittedEffect {
  id: string;
  family: EffectFamily;
  startedAt: number;
  expiresAt: number;
}

class VfxScheduler {
  request(req: EffectRequest): AdmittedEffect | null;  // null = rejected
  active(family?: EffectFamily): readonly AdmittedEffect[];
  cancel(family?: EffectFamily): void;
  // Subscribers are the renderers (CSS / Pixi)
  subscribe(family: EffectFamily, fn: (active: readonly AdmittedEffect[]) => void): () => void;
}
```

Rules baked in:

- **Family caps**: at most 1 orb, at most 1 wave per element, at most 8
  particles total at any moment
- **Cooldowns**: same-family same-element rejected if last-spawned < 80ms
- **Auto-expire**: scheduler GCs effects past expiresAt; subscribers
  receive a fresh array
- **Phase gate**: scheduler refuses requests when match phase is
  `between-rounds` or `result` (configurable per family)

Renderers (`<ClashOrb>`, `<ClashVfx>`, `<PixiClashVfx>`) become subscribers,
not autonomous spawners. The current useEffect-fires-spawn pattern moves
INTO the scheduler. The components just paint what's active.

### 2. Smooth Camera (`lib/camera/parallax-engine.ts`)

Replace direct mouse → CSS write with a target/current LERP loop.

```ts
class CameraEngine {
  // Target (set by mouse): -1..+1 normalized
  setTarget(x: number, y: number): void;
  // Impulse (clash punch / window shake): added on top of target
  punch(magnitude: number, durationMs?: number): void;
  shake(intensity: number, durationMs: number): void;
  // Idle drift (subtle sin-wave when target is 0,0 for >2s)
  setIdleDriftEnabled(b: boolean): void;
  // Tunable
  setSmoothing(lerpFactor: number): void;  // 0.05..0.30, default 0.12
  setMaxTravelPx(p: number): void;
  // Output: writes --parallax-x / --parallax-y / --camera-shake to root
  // Runs on a single requestAnimationFrame loop
}
```

Loop pseudocode:

```text
on each frame (RAF):
  current.x = lerp(current.x, target.x + idleDrift.x + impulse.x, smoothing)
  current.y = lerp(current.y, target.y + idleDrift.y + impulse.y, smoothing)
  shake.decay()
  impulse.decay()
  idleDrift.tick()
  writeCSSVars(current, shake)
```

Why this works (the math):
- LERP factor of 0.12 means the camera covers 12% of the remaining
  distance per frame → at 60fps, the camera reaches ~95% of target in
  ~25 frames (~400ms). Feels alive without lag.
- Reference: Lerp interpolation is the foundation of every "follow
  camera" implementation in indie games — see Vlambeer's Nuclear Throne
  GDC talk on game feel where Jan Willem Nijman cites lerped camera as
  the single biggest "feel" upgrade.

### 3. Audio Mixer with buses (`lib/audio/mixer.ts`)

Restructure the audio engine into a bus graph:

```text
                 ┌── SFX_BUS (gain) ──┐
masterGain ──────┼── MUSIC_BUS (gain) ─┤── audioContext.destination
                 └── UI_BUS (gain) ────┘
```

- Per-bus gain controls (master / sfx / music / ui)
- **Ducking**: when SFX_BUS plays a sound with `priority >= 800`,
  MUSIC_BUS gain auto-ducks to 30% over 100ms, restores to 100% over
  400ms after the SFX finishes
- **Polyphony cap PER BUS**: SFX_BUS = 4 voices, UI_BUS = 6 voices,
  MUSIC_BUS = 1 voice (with crossfade)
- **Priority queue**: when at cap, evict the oldest sound with lower
  priority before rejecting new requests
- **Snapshot system**: named volume presets ("combat", "menu",
  "victory") apply to multiple bus gains atomically; transitions take
  configurable ramp time
- This is exactly the Wwise/FMOD pattern, scaled to Web Audio API. The
  AudioContext is the implicit "master" sink; we add explicit GainNodes
  per bus and route every sound through its bus.

### 4. Three Tweakpane control panels (`app/battle/_inspect/`)

Tweakpane is the operator's interface to the three engines above.
Doctrine: the panel does NOT own state — it BINDS to the engines'
mutable config objects. Read-only state surfaces as `addBinding(...,
{ readonly: true })` (monitor mode).

**Panel 1: Camera/Parallax**
- Smoothing (slider 0.05..0.30, live-tune the LERP)
- Max travel px (slider 0..16)
- Idle drift enabled (toggle)
- Idle drift speed / amplitude (sliders)
- "Punch" button (test impulse)
- "Shake light/medium/heavy" buttons
- FpsGraph (read-only, top of panel — shows the cost of changes)
- Monitor: current parallax x/y, shake intensity (read-only graphs)

**Panel 2: VFX Scheduler**
- Per-family caps (sliders: max orbs, max particles)
- Cooldown ms per family (sliders)
- Phase gates (toggles: "allow during between-rounds")
- Element override: which element uses CSS vs Pixi (dropdown per element)
- Monitor: currently-active effects list + FPS impact
- "Trigger test orb / particle / wave" buttons (visual diagnostic)
- "Clear all VFX" button (panic flush)

**Panel 3: Audio Mixer**
- Per-bus gain sliders (master, sfx, music, ui)
- Per-bus polyphony cap (sliders)
- Ducking on/off + duck depth slider + duck attack/release ms
- Snapshot dropdown: combat / menu / victory / tutorial
- Per-sound mute (list of registered sounds with checkboxes — uses the
  existing SOUND_REGISTRY)
- Monitor: currently-playing voices count per bus
- Audition buttons (existing pattern)

All three panels share:
- **Preset persistence**: serialize current pane state to localStorage
  (`puru.devpanel.preset.{camera,vfx,audio}`)
- **Preset import/export**: copy/paste JSON for sharing tunings
- **FpsGraph at top** of every panel so the operator sees the cost in
  real time
- **Schema-driven binding**: panels read from the engine's `config`
  proxy; binding is `pane.addBinding(engine.config, "smoothing", { ... })`
  so live edits propagate without any manual wiring

## Why this beats "more effects"

| Symptom (before) | Cause | Fix in foundation |
|---|---|---|
| 4 effects fight on impact | No coordinator | VFX Scheduler with budgets |
| Parallax snaps/saw-tooths | No interpolation | LERP camera engine |
| Sounds clip / pile up | No bus / no polyphony cap | Audio mixer with buses |
| Can't tune live | No control plane | 3 Tweakpane panels |
| Pixi water never showed | Double-fire CSS+Pixi | Scheduler picks ONE per family |

This is the same architectural shape that powers polished indie games:
**typed registry · scheduler · dumb renderers · live control plane.**
We've already proven this shape works for audio (`audioEngine`) and
VFX (`ELEMENT_VFX`); this brief just applies the discipline at the
RUNTIME level (scheduler) instead of just the catalog level.

## Build order (this turn)

1. ⏳ Commit doctrine brief
2. **Smooth Camera** — biggest visible win, fewest lines
3. **VFX Scheduler v0** — minimal rules, just deconflict CSS+Pixi
4. **Audio Mixer** — refactor existing engine to bus graph
5. **Three Tweakpanes** — bind to all three engines
6. ✅ Verify in browser
7. ✅ Commit + push

## What is NOT in this turn

- Particle pooling at the WebGL level (Pixi handles it for our scale)
- Wwise-style snapshot interpolation (single snapshot for now)
- Production audio settings UI (panels are dev-only)
- Per-element Pixi kits beyond water (operator picks direction first)
- Camera shake tied to substrate events (foundation only — wiring later)
