---
session: 14
date: 2026-05-16
type: kickoff-build-doc
topic: vfx-lab-sandbox-with-effect-ts
status: ready
mode: ARCH (OSTROM) + craft lens (ALEXANDER) + sandbox doctrine
depends_on: session 13 (substrate-graduation-utc) — k-hole teach protocol +
  ResearchEnvelope shape preferred but not strict prerequisite
convergence_target: "a working /battle-v2/vfx-lab route with 2 effects
  (tree-fall + water-splashing) tunable via tweakpane, configs as
  @effect/schema, presets exported as JSON, layering primitive included"
---

# Session 14 — VFX Lab Sandbox · Tree-Fall + Water-Splashing

> Sandbox-first exploration surface for VFX. Operator + agent converse on the
> same knobs (tweakpane), iterate on individual effects in isolation, layer
> when needed, research inspiration from indie references via k-hole teach
> protocol. Two effects ship v1: tree-fall + water-splashing (cycle-1 wood
> vs water matchup). Effect-TS for config schemas (substrate-consistent).

## Operator-locked decisions (from kickoff exploration)

| Question | Decision | Why |
|---|---|---|
| Sandbox vs gameplay first | **SANDBOX** | Isolation for individual effects · operator-research-driven inspiration mode · "converse on the same surface" |
| Tweakpane integration | **vanilla in useEffect** | Already installed (v4.0.5 + plugin-essentials) · no wrapper tax · focus on contract-level concerns |
| Effect-config schema | **`@effect/schema`** | NOT Zod · consistent with Effect substrate game logic runs through (see [[feedback_effect-ts-as-universal-schema-substrate]]) |
| First effects to ship | **tree-fall + water-splashing** | Cycle-1 matchup = wood vs water · environmental-on-the-map vision · cut card-summon (PaperPuppet covers it) |
| Layering primitive | **included v1** | Operator: "some effects need to be able to layer it" · compose 2+ effects (sequence/parallel/trigger-chain) |
| Inspiration research | **k-hole teach-mode dispatches** | Operator-driven research on indie VFX references via the protocol locked in session 13 |
| Environmental assets | **parallel research track** | MeshyAI + Blender OR pure code via @agent-design-engineer · mid-poly grainy aesthetic |

## Invariants (Ostrom)

1. **Effect-config is DATA** — pure `@effect/schema` types · renderer reads · JSON preset = serialized config
2. **Sandbox-only** — no gameplay wiring this session · effects render in isolation in the lab · gameplay subscription comes later (session 15)
3. **Tweakpane is the OPERATOR-AGENT shared surface** — both author + agent edit the same knobs · presets export/import via `Pane.exportPreset/importPreset`
4. **Builds on motion-lab's 3-pane shape** — page + Station-like effect host + Toolbar · same UX register
5. **Layering composes effects as DATA** — `Composition { mode: sequence|parallel|trigger-chain, effects: [...] }` · not a graph editor (defer that)
6. **K-hole teach-mode is the inspiration channel** — when an effect needs design research, dispatch via k-hole.teach() · operator pulls threads · doctrine lands in vfx-playbook construct

## Blast Radius

| Artifact | Change | Risk |
|---|---|---|
| `app/battle-v2/vfx-lab/page.tsx` | NEW | low |
| `app/battle-v2/vfx-lab/_components/EffectPicker.tsx` | NEW | low |
| `app/battle-v2/vfx-lab/_components/KnobPane.tsx` | NEW (tweakpane mount) | low |
| `app/battle-v2/vfx-lab/_components/PreviewPane.tsx` | NEW (r3f Canvas) | low |
| `app/battle-v2/_components/vfx/VfxConfig.ts` | NEW (@effect/schema types) | low |
| `app/battle-v2/_components/vfx/VfxRegistry.ts` | NEW (name → config + renderer) | low |
| `app/battle-v2/_components/vfx/effects/TreeFall.ts` + `.tsx` | NEW · 2 files (config + r3f renderer) | low |
| `app/battle-v2/_components/vfx/effects/WaterSplash.ts` + `.tsx` | NEW · 2 files | low |
| `app/battle-v2/_components/vfx/Composition.ts` | NEW (layering primitive) | low |
| `grimoires/loa/specs/vfx-presets/*.json` | NEW (tweakpane exports) | low |
| Existing `_components/vfx/` (DaemonReact, PetalArc, etc.) | NO EDIT — vfx-lab builds alongside | none |

No new dependencies needed (tweakpane + r3f + Effect already installed).

## Data Architecture (Effect-TS shape)

```ts
import { Schema as S } from "@effect/schema";

// Base — every VFX effect carries
const VfxEffectBase = S.Struct({
  id: S.String,                          // "tree-fall.wood"
  surface: S.Literal("dom", "r3f"),
  duration: S.Union(
    S.Struct({ ms: S.Number }),
    S.Literal("infinite")
  ),
  trigger: S.Literal("manual", "card-played", "combo", "hit", "ambient"),
});

// Tree-fall specific
const TreeFallConfig = S.extend(VfxEffectBase, S.Struct({
  kind: S.Literal("tree-fall"),
  treeKind: S.Literal("oak", "pine", "deciduous"),
  fallDirection: S.Number,               // angle radians
  fallDurationMs: S.Number,
  dustParticleCount: S.Number,
  dustColor: S.String,                   // oklch
  bounceDamping: S.Number,               // 0..1
  groundImpactDelayMs: S.Number,
}));

// Water-splash specific
const WaterSplashConfig = S.extend(VfxEffectBase, S.Struct({
  kind: S.Literal("water-splash"),
  splashRadius: S.Number,                // world units
  dropletCount: S.Number,
  dropletVelocityMs: S.Number,
  rippleRingCount: S.Number,
  rippleSpreadMs: S.Number,
  foamOpacity: S.Number,
}));

// Layering primitive
const Composition = S.Struct({
  id: S.String,
  mode: S.Literal("sequence", "parallel", "trigger-chain"),
  effects: S.Array(S.Struct({
    effectId: S.String,
    offsetMs: S.Number,
    triggeredBy: S.optional(S.String),   // for trigger-chain mode
  })),
});

export type VfxEffect = S.Schema.Type<typeof VfxEffectBase>;
export type TreeFallConfigT = S.Schema.Type<typeof TreeFallConfig>;
export type WaterSplashConfigT = S.Schema.Type<typeof WaterSplashConfig>;
```

Renderer signature:
```ts
interface VfxRenderer<TConfig> {
  config: TConfig;
  trigger: () => void;                   // tweakpane button or external
  preview: React.FC<{ config: TConfig }>;  // mounted in PreviewPane
}
```

## What to Build (in dependency order)

### 1. `app/battle-v2/_components/vfx/VfxConfig.ts`
Effect schemas for VfxEffectBase + TreeFallConfig + WaterSplashConfig + Composition. Decoder/encoder via @effect/schema. Export types.

### 2. `app/battle-v2/_components/vfx/VfxRegistry.ts`
Map of `effectId → { config defaults, schema, renderer component, presets? }`. Single source for what's available.

### 3. `app/battle-v2/_components/vfx/effects/TreeFall.ts` + `.tsx`
- Config defaults
- r3f preview component: drei `<Billboard>` paper-puppet tree sprite + dust particles via `Points` + ground-impact ripple
- Animation timeline driven by `trigger()` event

### 4. `app/battle-v2/_components/vfx/effects/WaterSplash.ts` + `.tsx`
- Config defaults
- r3f preview: ripple rings via shader-on-plane OR torus geometry · droplet particles with arc trajectories · foam disc fade
- Animation from `trigger()`

### 5. `app/battle-v2/vfx-lab/_components/KnobPane.tsx`
Vanilla tweakpane in `useEffect` — mounts Pane bound to current effect's config. Auto-generates knobs from @effect/schema introspection (or hand-mapped per-effect for v1). Buttons: `trigger`, `export preset`, `import preset`.

### 6. `app/battle-v2/vfx-lab/_components/EffectPicker.tsx`
Left rail · lists VfxRegistry effects · shows preset thumbnails when available · click switches active effect.

### 7. `app/battle-v2/vfx-lab/_components/PreviewPane.tsx`
Center · r3f `<Canvas>` mounting the active effect's `preview` component · ground plane + warm Ghibli lighting (mirrors `/battle-v2/puppet-3d` setup) · trigger button overlay.

### 8. `app/battle-v2/vfx-lab/page.tsx`
3-pane layout · mirrors motion-lab structure · grain overlay (per existing taste tokens) · element-vivid header.

### 9. `app/battle-v2/_components/vfx/Composition.ts`
Layering primitive · schema + runtime that chains effect triggers per `mode`. v1 supports sequence + parallel; trigger-chain stub.

### 10. K-hole inspiration dispatches (per pulled thread)
When operator wants reference research on tree-fall or water-splash patterns from indie games: dispatch via k-hole.teach() with `convergence_target: "doctrine entry in vfx-playbook construct"`. Operator pulls threads → /dig deeper → entries land in `.claude/constructs/packs/vfx-playbook/doctrine/` tagged `tier: silver`.

## Design Rules (Alexander)

- **Preview canvas** mirrors `/battle-v2/puppet-3d` setup: warm Ghibli ambient (#fff2d4) + directional from upper-left (#fff0c0) + warm fill below-right (#ffe8c0) · ground tinted `#4a3d28`
- **Tweakpane theme**: dark with element-vivid accents — `--puru-cloud-bright` panel, `--puru-honey-base` active button. Tweakpane has theme tokens; override via CSS custom props.
- **Grain overlay**: same `grain-warm.webp` soft-light @ 0.22 the motion-lab uses
- **KnobPane width**: 280px right rail. EffectPicker 220px left rail. Preview fills center.
- **Effect labels**: `--font-puru-mono`, text-2xs, uppercase, `--puru-ink-soft`. Match the lab register.

## What NOT to build (Barth)

- NO gameplay wiring (effects don't subscribe to GameState yet — that's session 15)
- NO graph editor (composition is JSON DAG only; visual editor is phase 3)
- NO new dependencies (everything is installed; if you reach for one, that's scope creep)
- NO 3rd + 4th effect (only tree-fall + water-splash this session)
- NO postprocessing stack (bloom/DoF deferred until effects look right unfiltered)
- NO environmental asset authoring (separate parallel track — see below)

## Parallel research track · Environmental assets

Operator surfaced: environmental ASSETS (grass, trees, terrain features) need
their own research path. NOT session 14 build scope, but session 14 will
likely surface gaps that feed into:
- **Option A**: MeshyAI generation + Blender cleanup pipeline
- **Option B**: pure code via @agent-design-engineer (procedural mid-poly,
  grainy shader on flat meshes, etc.)

When session 14 hits a "need a tree asset to fall" moment, k-hole.teach()
dispatch researches "mid-poly grainy environmental asset pipelines" with
convergence_target = "asset workflow decision for cycle-2." Doctrine lands
in vfx-playbook or a new asset-pipeline construct.

## Verify

```bash
pnpm dev
# open http://localhost:3000/battle-v2/vfx-lab
# pick tree-fall · click trigger · tune via tweakpane · export preset
# pick water-splash · same loop
# (optional) compose tree-fall → water-splash via sequence mode
```

## Key References

| Topic | Path |
|---|---|
| Build doc (this) | `grimoires/loa/specs/enhance-vfx-lab.md` |
| Session 13 substrate (graduation tier) | `grimoires/loa/specs/enhance-substrate-graduation-utc.md` |
| Motion-lab precedent | `app/battle-v2/motion-lab/page.tsx` + `_components/Station.tsx` + `_components/Toolbar.tsx` |
| Puppet-3d Canvas precedent | `app/battle-v2/puppet-3d/page.tsx` |
| Existing VFX (DON'T touch) | `app/battle-v2/_components/vfx/{DaemonReact,PetalArc,RewardRead,ZoneBloom,VfxLayer,springs}.{ts,tsx}` |
| Tweakpane docs | https://tweakpane.github.io/docs/ (installed v4.0.5) |
| Effect-TS schema | https://effect.website/docs/schema/introduction · use `@effect/schema` |
| Existing puppet motion config (precedent) | `app/battle-v2/_components/puppet/PaperPuppetMotion.ts` (data-as-config pattern) |

## Convergence target (from frontmatter)

A working `/battle-v2/vfx-lab` route with 2 effects (tree-fall +
water-splashing) tunable via tweakpane, configs as `@effect/schema`, presets
exported as JSON, layering primitive included. After 3-4 iterations without
landing → reset, target was wrong (per the breadth↔depth-toward-convergence
doctrine).

## Open creative questions (for operator at session start)

1. **Tree species** for tree-fall v1 — oak/pine/deciduous, or one specific (matches existing Foliage.tsx assets)?
2. **Splash water layer** — render on ground plane or above an actual water-surface mesh (matches Sea Street Stalls future)?
3. **Preset storage** — `grimoires/loa/specs/vfx-presets/` (graduation-tier-tagged) OR `lib/vfx/presets/` (shipped with code)?
4. **Composition v1 modes** — ship sequence + parallel, defer trigger-chain · or all 3?
