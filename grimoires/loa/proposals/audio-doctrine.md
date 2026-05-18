---
status: draft-r0
type: doctrine
author: claude (Opus 4.7 1M)
created: 2026-05-12
cycle: battle-foundations-2026-05-12 (post-PR /remote-control session)
trigger: operator: "We should have a single audio engine i think. Check out the one on observatory page as well as henlo-interface if u back out a repo."
references: henlo-interface/hooks/use-sound-effects.ts (file-based MP3 player) + world-purupuru/sites/world/src/lib/workshop/audio-service.ts (synthesis-based oscillator player)
companions: composable-vfx-vocabulary.md, juice-doctrine.md, motion-stiffness-fixes.md, mechanics-legibility-audit.md
---

# Audio Doctrine — Single Engine, Two Pathways

## What we ported

Two prior repos had complementary audio patterns. The right answer was to
**compose them, not pick one**:

| Repo | Pattern | What we kept |
|---|---|---|
| `henlo-interface/hooks/use-sound-effects.ts` | File-based MP3 engine — lazy load + cache + clone-on-play, fade-in/out music, localStorage soundEnabled toggle | All of it. File pathway in our engine. |
| `world-purupuru/sites/world/src/lib/workshop/audio-service.ts` | AudioContext singleton + oscillator preset registry + polyphony cap (4 voices/namespace) + throttle (200ms) + autoplay-policy resume | All of it. Procedural pathway in our engine. |

Both serve the SAME `play(id)` API. The engine routes by the `kind` field
on the registered sound. Same hexagon shape we used for VFX.

## The shape

```
lib/audio/
├── engine.ts           ← AudioEngine singleton (file + procedural)
├── registry.ts         ← typed SOUND_REGISTRY + procedural fallback builders
├── music-director.ts   ← MatchPhase → music track router (with crossfade)
├── use-audio.ts        ← React hook (mount engine + subscribe to MatchEvent)
└── audio.test.ts       ← 10 vitest assertions (registry shape + settings + director)
```

**Key insight: every sound is registered TWICE.** Each entry declares both:
- a `path` to a future MP3 (`/sounds/sfx/lock-in.mp3`)
- a `build(ctx, output)` oscillator builder

The `kind` field decides which one runs. **Today everything ships as
`procedural`** so the game has audio without a single MP3 in the repo.
When you drop a file at the declared path, flip `kind: "procedural"` →
`kind: "file"` and the same caller plays the recording.

This is the audio equivalent of "type-driven mock that survives the swap
to live impl" — every consumer keeps working as the implementation
evolves.

## Sounds shipped today (procedural)

19 sounds across 5 namespaces. All work without any audio assets.

| Namespace | id | What it sounds like (procedural) |
|---|---|---|
| `ui` | `ui.hover` | 1.2kHz sine, 40ms blip — barely audible |
| `ui` | `ui.tap` | 900Hz triangle, 80ms |
| `ui` | `ui.toggle` | 660Hz square, 90ms |
| `card` | `card.deal` | 1400→600Hz down-chirp, 280ms (the "swoosh") |
| `card` | `card.swap` | 720Hz triangle, 70ms |
| `card` | `card.lift` | 660→990Hz up-chirp, 120ms (anticipation) |
| `match` | `match.lock-in` | Two-tone rising chime (C5 → G5) — anchor + commit |
| `match` | `match.win` | C5 major triad arpeggio, 700ms |
| `match` | `match.lose` | 440→165Hz down-chirp, 600ms |
| `match` | `match.draw` | C5 sustained sine, 500ms |
| `match` | `match.clash-impact.{element}` | Per-element noise/oscillator: fire=bright noise, water=mid-noise, earth=deep noise, wood=triangle blip, metal=square blip |
| `discovery` | `discovery.combo` | E5 major triad arpeggio (higher than win, more celebratory) |
| `music` | `music.{entry-ambient, arrange-tension, clash, result, idle}` | File-only — no procedural fallback. Silent until MP3s land. |

## Music director — phase-driven crossfade

`musicDirector().onPhase(phase)` is called by `useAudio` whenever a
`phase-entered` MatchEvent fires. The phase → track map:

| MatchPhase | Music track |
|---|---|
| `idle` / `entry` / `quiz` | `music.entry-ambient` |
| `select` / `arrange` / `between-rounds` | `music.arrange-tension` |
| `committed` / `clashing` / `disintegrating` | `music.clash` |
| `result` | `music.result` |

Default crossfade: 1200ms each way. Same-phase calls are no-ops (don't
restart the same track).

When music files are missing the engine silently no-ops — the SFX layer
remains audible.

## What the operator does next

### Phase 1: Demo immediately
**Open `/battle?dev=1` → JUICE tab → Audio folder.** Master / SFX /
music sliders + audition buttons. Sound is on by default.

The procedural sounds are tuned to be musical-but-restrained — they
won't win awards but they communicate "this is a game, not a prototype"
on first contact.

### Phase 2: Drop MP3 assets
Browse itch.io / freesound / your favorite SFX library. Drop files at
the declared paths in `public/sounds/sfx/` and `public/sounds/music/`.

Then in `lib/audio/registry.ts`, flip the relevant entries:

```ts
{ id: "match.lock-in", kind: "procedural", build: ..., path: "/sounds/sfx/lock-in.mp3" }
// becomes
{ id: "match.lock-in", kind: "file", build: ..., path: "/sounds/sfx/lock-in.mp3" }
```

The registered procedural builder stays as documentation. The game uses
the MP3.

### Phase 3: Music shifts (the meaningful upgrade)
Once you have music tracks, the director already routes them. You can
expand the map (e.g. element-specific clash music: `music.clash.fire`
vs `music.clash.water`) by editing `music-director.ts`.

## The contract layer

The `RegisteredSound` interface IS the contract:

```ts
interface RegisteredSound {
  readonly id: string;               // stable across kind swaps
  readonly namespace: AudioNamespace; // ui | card | match | discovery | music
  readonly kind: "file" | "procedural";
  readonly volume: number;            // 0..1 baseline
  readonly path?: string;             // file pathway
  readonly build?: (ctx, output) => { stop: () => void };  // procedural pathway
  readonly loop?: boolean;            // music
}
```

Every consumer (BattleScene, BattleHand, useAudio, MusicDirector) talks
to the engine via `audioEngine().play(id)` — never imports the registry
directly. The registry is the seam where new sounds land.

## What's NOT shipped (next bites, in order)

1. **MP3 asset drop + kind flips** — operator-driven, when you have
   audio you like
2. **Per-element music variants** — `music.clash.{element}` so each
   weather day has its own combat soundtrack (~30 lines in registry +
   director)
3. **Volume ducking during whispers** — when the speaker bubble fires,
   duck the music by 30% via the masterGain (~20 lines in engine)
4. **Spatial audio** — pan card hover sounds left/right based on card
   position in the fan. Uses StereoPannerNode (~15 lines on the
   procedural path)
5. **Audio settings UI in production** — currently only in
   JuiceTweakpane (dev). Player-facing settings page when we have one.

## The 4-doctrine stack now

Each doctrine names a different bottleneck and resolves it with the
same hexagon shape — typed registry, dumb consumer, growing schema:

| Doctrine | Bottleneck | Registry | Consumer |
|---|---|---|---|
| `mechanics-legibility-audit.md` | Builder can't see what's happening | substrate fields → MechanicsInspector rows | dev panel |
| `composable-vfx-vocabulary.md` | VFX one-offs don't compose | `ELEMENT_VFX` per-element kits | `<ClashVfx>` |
| `juice-doctrine.md` + `motion-stiffness-fixes.md` | Motion feels stiff / scripted | `JUICE_SCHEMA` + `CSS_VAR_SCHEMA` | Tweakpane + CSS |
| **this** `audio-doctrine.md` | No sound | `SOUND_REGISTRY` per-id with file + procedural | `audioEngine().play(id)` |

Same shape, different domain. The substrate keeps paying off.
