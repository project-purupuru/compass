---
session: 14
date: 2026-05-16
type: distillation
topic: cel-vocabulary-system
status: candidate-doctrine
use_label: background_only
mode: FEEL + ARCH (system extraction)
constructs: [vfx-playbook, the-easel, artisan/ALEXANDER]
operator_grant: "be crazy. creative. loving... mad agent ai stuff" (2026-05-16)
relates_to:
  - grimoires/loa/specs/enhance-vfx-lab.md
  - grimoires/loa/distillations/session-14-vfx-style-T3-T4-2026-05-16.md
  - .claude/constructs/packs/vfx-playbook/PLAYBOOK.md (target for promotion)
---

# Session 14 — Cel Vocabulary System

> Aesthetic anchor: Nightmare Circus + Guilty Gear Xrd. Substrate move: every
> cel-shaded primitive in compass now reads its language (ink palette, hue
> picker, sway oscillator, gradient defaults) from a single `celVocab.ts`
> module. One knob change here propagates instantly across Tree, Bush,
> Rock, Mushroom, Wildflower, FallenLog, Character, HexPlot.

## The system

```
celShading.ts   ─→ low-level material asset (gradient TEXTURE)
celVocab.ts     ─→ language layer (INK constants, pickFlavorHue, swayAngle, jitterHex)
LeafPuff.tsx    ─→ shared visual atom (1-2 icospheres + outline + optional sway)
authoredNormals ─→ geometry-authoring helpers (BoTW + Motomura recipes)
                       │
                       ▼
  Tree · Bush · Rock · Mushroom · Wildflower · FallenLog · Character · HexPlot
                       │
                       ▼
                   HexScene (composition)
                       │
                       ▼
                  PreviewPane (cel-shaded canvas + Scheimpflug DoF)
```

## Vocabulary primitives

### INK (celVocab.ts)

```ts
INK.color     = "#2a1f12"   // warm near-black
INK.colorDeep = "#1a0f06"   // character (most focal)
INK.heavy     = 4           // trunk, big rock, character body
INK.mid       = 3           // branch, snout, mid puff
INK.fine      = 2           // leaf tip, pebble, accent
```

Three weights = visual hierarchy without subjective per-asset tuning.

### Flavor (celVocab.ts)

```ts
type Flavor = "green" | "autumn" | "sakura" | "honey" | "moss"
```

Mirrors PALETTE bands. Sakura reserved per codex (rare). Honey for warm
accents (wildflower / mushroom cap). Moss for cool darker green (rock tufts,
fallen-log moss).

### swayAngle (celVocab.ts)

Deterministic per-seed phase oscillator. `swayAngle(elapsedSeconds, seed,
amplitude, frequency)` returns the current rotation angle. Baked into
`LeafPuff` so every leaf cluster in the world breathes — Genshin/BoTW
ambient life without per-asset useFrame plumbing.

### jitterHex (celVocab.ts)

Per-seed RGB jitter (default ±6%). Used by HexPlot to vary plot hue across
same-terrain tiles. Subtle enough to preserve palette coherence, strong
enough to break the "wallpaper" feel of uniform tiles.

## LeafPuff — the shared visual atom

The same 1–2 icosphere + ink outline unit is the atom for every leaf-bearing
primitive in the world. Adding a new foliage primitive (e.g., FernFrond,
Sapling) means composing LeafPuff with stems/branches — never re-implementing
the leaf vocabulary.

```ts
<LeafPuff
  position={[...]}
  color={pickFlavorHue(flavor, seed)}
  radius={...}
  secondary={{ offset: [...], scale: 0.7 }}    // optional second puff
  swaySeed={seed}                              // optional ambient sway
  inkThickness={INK.mid}
  flavor={flavor}
/>
```

## Primitives that now share the system

| Primitive | What it adds beyond LeafPuff | Cel signature |
|---|---|---|
| `Tree` | tapered trunk + 3-5 angled branches | branch tips swap to LeafPuff |
| `Bush` | low cluster of 3-4 LeafPuffs | trunkless tree |
| `Rock` | face-flattened geo + optional moss tuft | moss tuft IS a LeafPuff |
| `Mushroom` | thin stem + flat-squashed cap | cap IS a LeafPuff |
| `Wildflower` | tall thin stem + small bloom | bloom IS a LeafPuff, springier sway |
| `FallenLog` | horizontal cylinder + moss tufts along top | tufts ARE LeafPuffs |
| `Character` | adapter to PaperPuppet3D (5-element bears) | own ink palette (paper-puppet vocab) |
| `HexPlot` | hex-ground extrude + per-tile hue jitter + fixture dispatch | ground samples DEFAULT_TOON_GRADIENT |

## Operator-visible effects

| Knob | Where | What it does |
|---|---|---|
| `hexSize` | PostPane → grid | Re-scale every plot + asset coherently (hex-baseline substrate). |
| `showOutline` | PostPane → grid | Toggle hex wireframe for authoring vs production read. |
| `blur` / `taper` / `tilt` | PostPane → tilt-shift | Scheimpflug DoF (Poimandres recipe). |
| Effect picker | left rail | Switch between hex-scene · mini-scene · tree-fall · water-splash. |

## Aesthetic anchors

- **Nightmare Circus** — silhouette-first cel · gnarled tree branches · "wet edge" foam ring on water · clarity over photorealism (operator-shared screenshots 2026-05-16)
- **Guilty Gear Xrd / Junya Motomura** — authored vertex normals as anti-Lambertian shading (dig T3)
- **Octopath Traveler / Poimandres TiltShift** — Scheimpflug screen-space DoF, "tall object problem as aesthetic" (dig T4)
- **Breath of the Wild grass** — up-normal trick for cohesive grass mass (dig T3)
- **Genshin Impact** — three-band cel + warm key + cool rim 3-point lighting · ambient sway

## Promotion ladder

`use_label: background_only` until operator promotes. To promote into
`.claude/constructs/packs/vfx-playbook/knowledge/applied/`:

1. Operator confirms hex-scene reads as intended on hard refresh.
2. Operator validates the new primitives (Mushroom, Wildflower, FallenLog,
   refined Rock with moss + pebbles) compose well.
3. Cycle ID + PR opens `vfx-playbook/knowledge/applied/cel-vocabulary.md`
   with this entry's vocabulary map + LeafPuff API.

## Open threads

- **Grass wind sway** — currently only LEAF-bearing primitives sway. Grass
  cards are static (BoTW up-normal trick — would need vertex-buffer update
  per frame OR a custom shader). Parked. Decide if it matters when scene
  has motion from other elements.
- **MeshyAI thread (T2)** — still parked from earlier. Procedural cel is
  carrying weight; re-evaluate only if a specific asset (village structure,
  hero shrine) needs external mesh authoring.
- **Per-tile elevation transitions** — Plot schema has `edges` (flat/raised/
  cliff/water/bridge) but no renderer for the non-flat variants. Picks up
  when scene needs cliffs / shores between adjacent plots.

## Provenance

- Cel material substrate: `app/battle-v2/_components/vfx/celShading.ts` +
  `celVocab.ts`
- Shared visual atom: `app/battle-v2/_components/vfx/effects/LeafPuff.tsx`
- Geometry-authoring helpers: `app/battle-v2/_components/vfx/authoredNormals.ts`
- Primitives: `app/battle-v2/_components/vfx/effects/{Tree,Bush,Rock,Mushroom,Wildflower,FallenLog,Character}.tsx`
- Hex substrate: `lib/hex/{axial,world,neighbors,iter,plot}.ts`
- Composition: `app/battle-v2/_components/vfx/effects/{HexPlot,HexScene}.tsx`
- Memory anchor: `reference_construct-synthesis-2026-05-16` +
  `feedback_director-mode` (creative latitude grant)
