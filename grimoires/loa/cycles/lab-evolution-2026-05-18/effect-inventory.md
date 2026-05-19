---
sprint: S1a.T0
date: 2026-05-19
cycle: lab-evolution-2026-05-18
reference_commit: 7a179bce (production hotfix · last operator-validated)
purpose: Lock effect inventory before any baseline authored (per Flatline IMP-004)
---

# Effect Inventory · LOCKED for cycle

Canonical inventory of `VFX_REGISTRY` entries in `app/battle-v2/_components/vfx/VfxRegistry.ts`. S5.T1-T8 retrofit pass MUST cover ALL 9 effects per cycle DoD (G6) — no silent deferral per IMP-006.

## 9 effects

| # | Slug | Source file | Adapter target (S5) |
|---|---|---|---|
| 1 | `card-composition` | `app/battle-v2/_components/vfx/effects/CardComposition.tsx` | `effects/CardComposition/adapter.ts` (S2 first adapter) |
| 2 | `card-lab` | `app/battle-v2/_components/vfx/effects/CardLab.tsx` | `effects/CardLab/adapter.ts` (S5.T1) |
| 3 | `hex-scene` | `app/battle-v2/_components/vfx/effects/HexScene.tsx` | `effects/HexScene/adapter.ts` (S5.T2, partial in S3.T7) |
| 4 | `mini-scene` | `app/battle-v2/_components/vfx/effects/MiniScene.tsx` | `effects/MiniScene/adapter.ts` (S5.T3) |
| 5 | `big-realm-scene` | `app/battle-v2/_components/vfx/effects/BigRealmScene.tsx` | `effects/BigRealmScene/adapter.ts` (S5.T4 · Three.js) |
| 6 | `realm-scene` | `app/battle-v2/_components/vfx/effects/RealmScene.tsx` | `effects/RealmScene/adapter.ts` (S5.T5 · Three.js) |
| 7 | `zone-scene` | `app/battle-v2/_components/vfx/effects/ZoneScene.tsx` | `effects/ZoneScene/adapter.ts` (S5.T6 · Three.js) |
| 8 | `tree-fall` | `app/battle-v2/_components/vfx/effects/TreeFall.tsx` | `effects/TreeFall/adapter.ts` (S5.T7 · animation) |
| 9 | `water-splash` | `app/battle-v2/_components/vfx/effects/WaterSplash.tsx` | `effects/WaterSplash/adapter.ts` (S5.T8 · animation) |

## 3 representative baselines for S1a (per Flatline IMP-012 · operator-ratified)

| # | Primitive | Why this one | Path |
|---|---|---|---|
| 1 | `CodexCardFace` | Session-22 regression target — proves fuse on actual bug surface | `app/battle-v2/_components/cards/CodexCardFace.tsx` |
| 2 | `CardComposition` | Kitchen primitive — most-recent operator-validated | `app/battle-v2/_components/vfx/effects/CardComposition.tsx` |
| 3 | `HexScene` | Existing test coverage to lean on; representative of effect-shape primitives | `app/battle-v2/_components/vfx/effects/HexScene.tsx` |

## 4 validated-surface baselines (per G7)

| Route | Description | Capture at |
|---|---|---|
| `/` | Hackathon landing (protected per hackathon-submitted-pivot) | 1280×800 dark |
| `/demo` | Demo page (protected) | 1280×800 dark |
| `/battle-v2` | Main battle surface | 1280×800 dark |
| `/battle-v2/vfx-lab` | Lab itself | 1280×800 dark |

## Reference commit lock

```
git log --oneline 7a179bce -1
7a179bce fix(vfx): backfill defaults in CARD_LAB_DEF.registerKnobs (production hotfix)
```

This commit is the **last operator-validated baseline anchor**. All S1a baselines capture against the state introduced in this commit (or later, since cycle planning artifacts also exist now). Any regression detected post-baseline must be measured against geometry+sha256 from this anchor.

## Canary test target (per FR-S1.4)

`CodexCardFace` is the canary. Intentional mutation: `debugOverrideWidthPct: 105` (5% over-width).

Expected: regression substrate flags `GeometryDrift` with `dimension: "width"`, `deltaPct > 2`.

---

*Locked 2026-05-19 at S1a.T0. Updates require formal PRD amendment (per Flatline IMP-006 no-silent-deferral).*
