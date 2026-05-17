---
date: 2026-05-17
type: cleanup-triage
status: committed-note
scope: untracked-files
---

# Cleanup Untracked Triage — 2026-05-17

Classification source: `git status --short --untracked-files=all` on `feat/ecs-leaves-2026-05-17`.

Protected boundaries honored:
- `lib/engine/` untouched; no cleanup-scope scene/bridge file is imported by `lib/engine/`.
- `lib/cards/layers/` and `public/art/cards/` untouched.
- `/` and `/demo` untouched.

## Commit-worthy source

These are substrate/application files that should land only through their matching focused cleanup target, not in this triage commit.

- `app/battle-v2/_components/vfx/Composition.ts`
- `app/battle-v2/_components/vfx/authoredNormals.ts`
- `app/battle-v2/_components/vfx/celShading.ts`
- `app/battle-v2/_components/vfx/celVocab.ts`
- `app/battle-v2/vfx-lab/_components/EffectPicker.tsx`
- `app/battle-v2/vfx-lab/_components/KnobPane.tsx`
- `app/battle-v2/vfx-lab/_components/PostPane.tsx`
- `app/battle-v2/vfx-lab/_components/PreviewPane.tsx`
- `app/battle-v2/vfx-lab/_components/postConfig.ts`
- `lib/hex/axial.ts`
- `lib/hex/biome.ts`
- `lib/hex/decorator.ts`
- `lib/hex/index.ts`
- `lib/hex/iter.ts`
- `lib/hex/neighbors.ts`
- `lib/hex/world.ts`
- `lib/hex/zone.ts`
- `lib/wuxing/element.ts`
- `lib/wuxing/index.ts`
- `lib/wuxing/resonance.ts`
- `lib/wuxing/timeOfDay.ts`

## Commit-worthy effects pending orphan pass

Initial read says these are real VFX/effect implementation files. Target 4 owns final referenced-vs-archive disposition.

- `app/battle-v2/_components/vfx/effects/Bush.tsx`
- `app/battle-v2/_components/vfx/effects/Character.tsx`
- `app/battle-v2/_components/vfx/effects/DustMotes.tsx`
- `app/battle-v2/_components/vfx/effects/Embers.tsx`
- `app/battle-v2/_components/vfx/effects/FallenLog.tsx`
- `app/battle-v2/_components/vfx/effects/Grass.tsx`
- `app/battle-v2/_components/vfx/effects/HexDebugOverlay.tsx`
- `app/battle-v2/_components/vfx/effects/HexOutline.tsx`
- `app/battle-v2/_components/vfx/effects/LeafPuff.tsx`
- `app/battle-v2/_components/vfx/effects/LeafSwirl.tsx`
- `app/battle-v2/_components/vfx/effects/MiniScene.tsx`
- `app/battle-v2/_components/vfx/effects/Mist.tsx`
- `app/battle-v2/_components/vfx/effects/MountainRing.tsx`
- `app/battle-v2/_components/vfx/effects/MusubiSilhouette.tsx`
- `app/battle-v2/_components/vfx/effects/PerfReadout.tsx`
- `app/battle-v2/_components/vfx/effects/PollenMotes.tsx`
- `app/battle-v2/_components/vfx/effects/PuruhaniWalker.tsx`
- `app/battle-v2/_components/vfx/effects/Rain.tsx`
- `app/battle-v2/_components/vfx/effects/RealmScene.tsx`
- `app/battle-v2/_components/vfx/effects/RippleField.tsx`
- `app/battle-v2/_components/vfx/effects/ShengFlow.tsx`
- `app/battle-v2/_components/vfx/effects/Sparks.tsx`
- `app/battle-v2/_components/vfx/effects/TreeFall.tsx`
- `app/battle-v2/_components/vfx/effects/WaterSplash.tsx`
- `app/battle-v2/_components/vfx/effects/WaterSurface.tsx`
- `app/battle-v2/_components/vfx/effects/ZoneMonument.tsx`
- `app/battle-v2/_components/vfx/effects/ZoneScene.tsx`

## Docs

These are Loa/K-hole research, kickoff, spec, or distillation artifacts. They should be committed with documentation-focused work, not mixed into source refactors.

- `grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md`
- `grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md`
- `grimoires/k-hole/research-output/dig-session-2026-05-16-T3-authored-normals.md`
- `grimoires/k-hole/research-output/dig-session-2026-05-16-T4-scheimpflug.md`
- `grimoires/k-hole/research-output/dig-session-2026-05-16.md`
- `grimoires/k-hole/research-output/envelopes/columnar-stores-in-game-engine-ecs-trizen-ecs-archetype-pattern-clickh-b2e96aa7.json`
- `grimoires/k-hole/research-output/envelopes/guilty-gear-xrd-junya-motomura-authored-vertex-normals-technique-2d-lo-36dd68a6.json`
- `grimoires/k-hole/research-output/envelopes/scheimpflug-principle-tilt-shift-focal-plane-octopath-traveler-hd-2d-m-8254ba26.json`
- `grimoires/k-hole/research-output/envelopes/three-quarks-particle-vfx-library-architecture-how-it-integrates-with-9ab96bd0.json`
- `grimoires/loa/distillations/session-14-biome-substrate-2026-05-16.md`
- `grimoires/loa/distillations/session-14-cel-vocabulary-system-2026-05-16.md`
- `grimoires/loa/distillations/session-14-vfx-style-T3-T4-2026-05-16.md`
- `grimoires/loa/distillations/session-16-ecs-substrate-proof-2026-05-17.md`
- `grimoires/loa/distillations/session-17-zone-scene-2026-05-17.md`
- `grimoires/loa/distillations/session-18-hex-composition-scale-2026-05-17.md`
- `grimoires/loa/specs/enhance-card-scene-convergence.md`
- `grimoires/loa/specs/enhance-columnar-ecs-teaching-session.md`
- `grimoires/loa/specs/enhance-director-event-substrate.md`
- `grimoires/loa/specs/enhance-substrate-perf-and-engine.md`
- `grimoires/loa/specs/enhance-vfx-lab.md`
- `grimoires/loa/specs/enhance-zone-scene-elemental-vfx.md`
- `grimoires/loa/specs/vfx-presets/README.md`
- `grimoires/loa/tracks/session-14-vfx-lab-kickoff.md`
- `grimoires/loa/tracks/session-15-director-event-substrate-kickoff.md`
- `grimoires/loa/tracks/session-16-columnar-ecs-kickoff.md`
- `grimoires/loa/tracks/session-17-zone-scene-kickoff.md`
- `grimoires/loa/tracks/session-20-convergence-kickoff.md`

## Archive-worthy

- None classified as archive-worthy from path/content triage alone.

The separate orphan hunt target must make any archive decision from import evidence, then move real orphans to `__archive__/` with a tombstone note instead of deleting tests or source.

## Live-drift addendum

After the target-1 triage commit, the live operator lane added additional untracked files. Current-status addendum:

- `app/battle-v2/_components/vfx/effects/InstancedRockField.tsx` — commit-worthy, operator/engine-instancing lane; not staged by janitor pass.
- `app/battle-v2/_components/vfx/effects/fixtureGeometryVariants.ts` — commit-worthy, operator/engine-instancing lane; not staged by janitor pass.
- `lib/engine/ecs/rock-archetype.ts` — protected `lib/engine/` lane; deferred to `grimoires/loa/notes/cleanup-defer-lib-engine.md`.
