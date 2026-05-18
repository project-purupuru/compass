---
session: 14
date: 2026-05-16
type: distillation
topic: vfx-style-authored-normals-scheimpflug-dof
status: candidate-doctrine
use_label: background_only
mode: FEEL + DIG → SHIP
constructs: [vfx-playbook, the-easel, artisan/ALEXANDER]
dig_trail:
  - grimoires/k-hole/research-output/dig-session-2026-05-16-T3-authored-normals.md
  - grimoires/k-hole/research-output/dig-session-2026-05-16-T4-scheimpflug.md
relates_to:
  - grimoires/loa/specs/enhance-vfx-lab.md
  - grimoires/loa/specs/vfx-presets/README.md
  - .claude/constructs/packs/vfx-playbook/PLAYBOOK.md (target for promotion)
---

# Session 14 — VFX Style Doctrine · Authored Normals + Scheimpflug DoF

> The OPPOSITE-direction bet. Instead of reaching for higher-fidelity meshes
> (MeshyAI · Blender pipeline), push the low-poly we already have HARDER
> through authored-normal tricks + screen-space tilt-shift. The diorama
> aesthetic comes from **authored visual lies** (Motomura) and **optical
> bugs as aesthetic targets** (Poimandres' tall-object problem), not from
> physical accuracy.

## Operator decision (2026-05-16)

After T3+T4 dig + mini-scene build:
- **Asset source = procedural-first.** Defer MeshyAI pipeline (T2) until
  procedural ceiling is reached.
- **Style = authored normals + screen-space DoF.** Live in the lab as a
  visible test surface (`/battle-v2/vfx-lab` → mini-scene).
- **Scheimpflug DoF is canon for compass.** Postprocess is no longer a
  forbidden category — the session-14 build doc's "NO postprocessing stack"
  cut is **lifted** as of this distillation.

## The three authored-normal algorithms (one per asset class)

Per dig T3 (Motomura GDC 2015 · Breath of the Wild grass · Dedene spherical
proxy). All three implemented in `app/battle-v2/_components/vfx/authoredNormals.ts`.

| Asset | Algorithm | Where it lives | Visual lie |
|---|---|---|---|
| Tree canopy | **spherical-pivot** | `world/clusterGeometry.ts` (`buildPuffCluster`) | Normals point from cluster centroid → lights cluster as one volume. Existed pre-session-14. |
| Grass field | **up-bias (BoTW)** | `vfx/authoredNormals.ts` (`buildGrassFieldUpBias`) | Every card vertex normal = `(0, 1, 0)`. Cards silhouette chaotically but shade as one ground-mass. |
| Rock / boulder | **face-flatten (Motomura)** | `vfx/authoredNormals.ts` (`flattenFaceNormals`, `buildRockGeometry`) | Per-triangle face normals + optional up-bias. Reads as "broad clean shadow blobs", not smooth Lambertian. |

### Rule (Alexander)

> Treat lighting as an authored data mask, not a simulation. The mesh
> tells you what it IS; the normals tell you what it READS as. They are
> independent. Lie when the lie reads better than the truth.

## Scheimpflug DoF — Poimandres recipe (per dig T4)

Implemented via `@react-three/postprocessing`'s `TiltShift2` (already
installed). Wired through `PostPane.tsx` (top-right of lab Canvas) + applied
inside `PreviewPane.tsx` and the compose preview.

### Key insight from dig

> *"The 'miniature' look we associate with HD-2D games is technically an
> optical failure — the 'tall object problem' caused by mapping a 2D
> linear gradient over 3D geometry — that has become so culturally
> codified it is now the desired aesthetic target rather than a bug to
> be fixed."*

We do NOT implement Kensler's physically-accurate per-plane DoF (the
`distance = abs(dot(planeNormal, viewPos) + planeW)` shader). We use the
SCREEN-SPACE tilt-shift and accept the artifact as the aesthetic.

### Default parameters (lab-tuned starting point)

| Param | Value | Why |
|---|---|---|
| `enabled` | `true` | Diorama feel is canon — default ON. |
| `blur` | `0.65` | Soft enough to mask, hard enough to read. |
| `taper` | `0.45` | Smooth falloff outside the focal band. |
| `startY / endY` | `0.42 / 0.58` | Tight focal band centered ~50% screen-Y. |
| `tilt` | `4°` | Slight Scheimpflug tilt — left edge slightly lower than right. |
| `samples` | `10` | Quality/perf tradeoff; 6 ok, 16 luxury. |
| `direction` | `[0, 1]` | Vertical blur perpendicular to mostly-horizontal focal band. |

### Mapping from operator-facing knobs to TiltShift2 line (`postConfig.ts`)

```ts
const tiltRad = (cfg.tilt * Math.PI) / 180;
const delta = Math.tan(tiltRad) * 0.5;
const centerY = (cfg.startY + cfg.endY) / 2;
start = [0, centerY - delta];
end   = [1, centerY + delta];
```

## The cut that was lifted

Session-14 build doc explicitly said:
> NO postprocessing stack (bloom/DoF deferred until effects look right unfiltered)

That cut held through the initial build (TreeFall + WaterSplash shipped
unfiltered). The trigger that lifted it: operator's 2026-05-16 message
*"the style is what we want to refine ... maybe less so the effect and
more so the actual models themselves."* Tilt-shift is the cheapest single
intervention that pushes the existing mesh stack toward the diorama
aesthetic — adding it before MeshyAI lets us see if procedural-still works.

## What's visible NOW in the lab

| Surface | Route | What you see |
|---|---|---|
| isolated tree-fall | `/battle-v2/vfx-lab` → `tree-fall` | Canonical tree pivots + dust + ripple, under Scheimpflug DoF. |
| isolated water-splash | same route → `water-splash` | Droplets + rings + foam, under DoF. |
| **mini-scene** | same route → `mini-scene` | Tree + grass field (up-bias) + 2 rocks (Motomura flatten) composed, under DoF. **The T3+T4 visible test surface.** |
| Post pane | top-right overlay | Live A/B Scheimpflug parameters; toggle enabled for before/after. |

## Promotion ladder

This entry is **candidate-doctrine** — `use_label: background_only` until
operator promotes. To promote into `.claude/constructs/packs/vfx-playbook/`:

1. Operator confirms the mini-scene matches taste under DoF.
2. Operator confirms `up-bias` for grass + `face-flatten` for rocks read
   as intended.
3. Cycle ID + a short PR opens `vfx-playbook/knowledge/applied/` with
   this entry's algorithm table + parameter defaults.

## Open threads (T2 still parked)

The MeshyAI pipeline thread (T2) is parked, not killed. Re-fire when:
- Procedural primitives hit a clear visual ceiling, OR
- A specific asset class (e.g., a village structure with thatch roof) is
  too laborious to author procedurally with the current vocab.

When re-firing, the spike shape from cycle-1 fallback playbook (S0
calibration spike, half-day budget, one asset) still applies.

## Provenance

- T3 dig: `grimoires/k-hole/research-output/dig-session-2026-05-16-T3-authored-normals.md` (Motomura/BoTW/Dedene)
- T4 dig: `grimoires/k-hole/research-output/dig-session-2026-05-16-T4-scheimpflug.md` (Poimandres/Kensler/Octopath)
- Build code: `app/battle-v2/_components/vfx/authoredNormals.ts`, `effects/{Tree,Grass,Rock,MiniScene}.tsx`
- Lab: `app/battle-v2/vfx-lab/page.tsx` + `_components/{PostPane,postConfig}.{tsx,ts}`
- Memory anchor (resonance source): `reference_construct-synthesis-2026-05-16`
