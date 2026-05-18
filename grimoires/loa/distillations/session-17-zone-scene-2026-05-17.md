---
session: 17
date: 2026-05-17
type: substrate-distill
topic: per-zone-elemental-vfx + side-primitive + time-of-day-as-player-clock
status: ready
authored_by: claude (interactive session with operator)
spec: grimoires/loa/specs/enhance-zone-scene-elemental-vfx.md
---

# Session 17 — Zone-Scene · Wood + Water · Player-Local Time-of-Day

Per [[feedback_session-distillation-cadence]] — substrate / application / taste,
3-stage promotion candidate for construct-honeycomb-substrate.

## What landed

`/battle-v2/vfx-lab` opens to `zone-scene` (first picker entry). Two
cluster Sides (player + opponent) mount side-by-side, each carrying an
element (default: player=wood, opponent=water). Scene atmosphere wears the
player's local time-of-day; per-side ambient VFX runs continuously,
modulated by element resonance against the current phase; tweakpane
trigger buttons ramp each side independently.

Six stages — A (substrate) · B (wood ambient) · C (water ambient) · D
(trigger ramps) · E (composition + main "fire all" trigger) · F (this
distillation). Code-lands clean; visual ratification by operator pending.

## Substrate (load-bearing, port verbatim)

### Wuxing module — `lib/wuxing/`

Runtime expression of `core-lore/wuxing.yaml` from the
[[reference_purupuru-codex-construct]]. **One substrate, one truth.**

| File | Role |
|---|---|
| `element.ts` | `ElementId` literal · `ELEMENT_META` table (color, season, phase-index, henlo, trait, puruhani trait) · `SHENG_SEQUENCE` + `KE_SEQUENCE` + `shengGenerates` / `shengGeneratedBy` helpers |
| `timeOfDay.ts` | `timeOfDayFromDate(date)` → `{ phase, tFactor, nextPhase, source }` · `PHASE_PALETTE` (5 mood swatches: skyTop/Bottom, ambient, directional, fog, intensities) · `ELEMENT_PHASE` ↔ `PHASE_ELEMENT` bidirectional map |
| `resonance.ts` | `resonanceMultiplier(element, phase)` → 0.5..1.0 · 5-ring distance metric (0, 1, 2) |

**Load-bearing invariant**: sheng IS time-of-day progression
(wood→fire→earth→metal→water mirrors morning→noon→afternoon→evening→night).
The substrate names this once; everything else reads from it.

### Zone primitive — `lib/hex/zone.ts`

```ts
interface Zone { id: string; element: ElementIdT; coords: readonly HexCoord[]; }
```

Pure data. No ambient/trigger STATE in the Zone — that lives in the
ZoneScene composer (React refs + useFrame). Keeps Zone serializable for
future card-play wiring.

`clusterCoords(center, shape)` returns coords for `triangle | patch-5 |
hexring | star`. Operator-pin default: `patch-5` (center + E + NE + W +
SW = horizontal patch suited for side-by-side layout).

### Bespoke VFX primitives (Rain.tsx recipe)

| File | Role | Pattern |
|---|---|---|
| `effects/LeafSwirl.tsx` | Drifting leaves | InstancedMesh of thin boxes · single useFrame · tile inradius confinement with "wind shape" nudge · NaN-guarded count |
| `effects/PollenMotes.tsx` | Honey-gold motes rising | InstancedMesh of low-poly spheres · sine alpha fade · ceiling-wrap respawn |
| `effects/Mist.tsx` | Translucent fog plates | InstancedMesh of plane sheets · slow xz drift + sine fade · out-of-bounds → respawn |
| `effects/RippleField.tsx` | Expanding moss-teal rings | InstancedMesh of ringGeometry · age 0..1 drives radius + alpha curve |

All five (incl. existing `Rain.tsx`) follow ONE recipe:
- Single BufferGeometry + InstancedMesh → single draw call
- Single `useFrame` loop, no per-frame allocs
- Tile-confined spawn + respawn
- `intensity` prop (0..1) — scales geometry directly so caller can modulate
  by element-resonance × trigger-ramp without re-allocating

### Trigger ramp hook

`useTriggerRamp(counter, baseline, upSec, decaySec)` in `ZoneScene.tsx`:
- Detects counter bumps via `useEffect` (no render-time mutation)
- `performance.now()` wall-clock — independent of useFrame delta-clamping
- Ramp shape: baseline → 1.0 over `upSec`, then 1.0 → baseline over
  `decaySec`. Returns the current multiplier; caller multiplies into VFX
  intensity prop.

## Application (compass-specific)

### Side composition

```
Scene
├── timeOfDay              ← player-local Date → 5 phases
├── ambientLight + sky     ← derived from timeOfDay alone
└── sides
    ├── player:   { id, element, zone, anchor: [-offset, 0] }
    └── opponent: { id, element, zone, anchor: [+offset, 0] }
```

Each Side's effective intensity:
```
intensity = ambientBase × resonance(side.element, scene.timeOfDay) × triggerRamp
```

**Player-local time-of-day is the SCENE'S only clock.** Operator framing:
"calm awareness — if it's your night, the whole map is night." Opponent's
element drives their cluster's ambient VFX (color + behavior), but their
time-zone does NOT split the sky.

### Per-element signatures (Stage B + C authored)

**Wood (Konka Market vibe — codex `loc-konka-market`):**
- LeafSwirl: 80 leaves, canopy-green or canopy-autumn flavor, hex-tile confined
- PollenMotes: 36 motes, honey-gold `#e8b248`, rising + sine fade
- Reads as: "mismatched stalls overflow with produce that shouldn't exist"

**Water (Sunken Shrine vibe — codex `loc-the-sunken-shrine`):**
- WaterMossGlow: per-tile emissive teal disc `#3fa28a` · opacity floor 0.35
- Mist: 14 plate sheets · moss-tinted `#7ab8b8` · slow drift + sine fade
- RippleField: 18 rings · bioluminescent moss-teal `#6fd6c0`
- Reads as: "knee-deep water and caves lit by glowing moss"

### Asymmetric resonance behavior

Wood at user-night dampens to 0.5x via the resonance curve. Water at
user-morning likewise dampens. BUT WaterMossGlow holds its inner light
(opacity floor 0.35) — the codex's "underground doesn't care what time
it is" framing is expressed as a per-mesh opacity floor that resonance
can't kill. **The cave keeps its own light.**

## Taste (what feels right)

- **"Memory of a sunset, not the physics of one"** — five palette swatches
  per phase (not a sun-disc simulation). Per [[project_art-direction-north-star]].
- **Ambient never sleeps** — resonance floor 0.5 ensures every cluster
  reads as alive even at the opposite hour. Operator-locked.
- **Hex-tile confinement** — no VFX bleeds across zones. "Wind shape"
  nudge (LeafSwirl) is softer than a hard clamp.
- **Per-leaf hue variance is a Stage E polish.** Stage B uses palette[0]
  as material color — InstancedBufferAttribute + custom shader is the
  upgrade path.
- **Trigger button polish.** 1.5s ramp-up → 4s decay feels operator-aligned
  (matches build doc pin). If "too aggressive" feedback, slow ramp-up to
  2.5s per the doc's pushback invitation.

## Architectural moves (worth highlighting)

1. **Side primitive lives in ZoneScene runtime, not lib/.** The Side has
   anchor + element + zone — application-level concept. Promoting it to
   `lib/world/side.ts` is a future move if v3/v4 want to share it.

2. **Element-resonance × trigger-ramp composition.** Two independent
   multipliers. Resonance is a pure function of (element, phase). Trigger
   is a stateful animation. They compose without coupling.

3. **Codex consultation memory saved** — `[[reference_purupuru-codex-construct]]`.
   Prior session got Musubi Station wrong by relying on tangential
   references. The codex pack at `.claude/constructs/packs/purupuru-codex/`
   has 19 canonical locations with `element_affinity` frontmatter.
   ALWAYS consult before designing world content.

## Pull-forward to /battle-v2 next

| Item | Where it goes |
|---|---|
| `lib/wuxing/*` | Already lib-level — use as-is in battle-v2 ground state |
| `Zone` primitive | `lib/hex/zone.ts` — generic, ready for cards |
| Per-side `intensity` model | Useful for card-play wiring: card-summon bumps the host side's ramp counter |
| `useTriggerRamp` | Generic — extract to `lib/world/triggerRamp.ts` when battle-v2 needs it |
| Sky/fog/ambient from timeOfDay | Move to a shared `<SceneAtmosphere>` for battle-v2's main render |

## What did NOT ship this session (per build doc)

- ECS substrate (deferred — see `enhance-substrate-perf-and-engine.md`)
- Element CLASH mechanics (visually adjacent only — operator-locked)
- Card-play wiring (tweakpane buttons stand in)
- Fire / earth / metal VFX primitives (future cycles, same recipe)
- Biome variants (`konka-market` / `sunken-shrine` biomes — Stage E polish)
- Per-leaf hue jitter shader
- Sound (operator: "after that")

## Pushback the operator should weigh

- **Resonance floor 0.5 may be too generous.** If wood at user-night
  reads as "still pretty active," lower the floor to 0.3 in
  `lib/wuxing/resonance.ts` `opts.floor`.
- **WaterMossGlow opacity floor 0.35** — if the moss disc reads as "too
  green / overpowering," drop to 0.2 or remove the disc entirely (Mist +
  Ripples may carry the cave feel alone).
- **patch-5 cluster shape** picks horizontal asymmetry. If you want true
  symmetric clusters, use `hexring` (7 hexes, full ring). Available via
  tweakpane `grid → shape`.
- **Per-side trigger button placement** — currently in `player side` /
  `opponent side` folders. May want to surface them more prominently in
  a top-level `triggers` folder. Iteration-fast.

## References

| Topic | Path |
|---|---|
| Build doc | `grimoires/loa/specs/enhance-zone-scene-elemental-vfx.md` |
| Wuxing yaml | `.claude/constructs/packs/purupuru-codex/core-lore/wuxing.yaml` |
| Codex locations | `.claude/constructs/packs/purupuru-codex/locations/` (19 files) |
| Konka Market | `.../locations/konka-market.md` |
| Sunken Shrine | `.../locations/the-sunken-shrine.md` |
| Rain reference | `app/battle-v2/_components/vfx/effects/Rain.tsx` |
| Memory pointer | `memory/reference_purupuru-codex-construct.md` |
