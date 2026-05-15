# Session 8 — The Playing Field (cozy-sim aesthetic pass)

> *The board was a board. Now it's a place.*

> **Mode**: FEEL (ALEXANDER) · structural spine ARCH (OSTROM) · scope BARTH
> **Date**: 2026-05-14
> **Target**: `app/battle-v2/_components/` — worktree `compass-cycle-1` · dev `:3000/battle-v2`
> **Continuation of**: Session 7 (the playable truth) — the ritual works; this dresses the stage.

---

## Target

The cozy-management-sim look: lush rolling green ground, warm even daylight with
soft shadows, dense varied foliage (green + autumn clusters ringing the field),
rounded stylized structures sitting in fenced plots, dirt paths between them. The
key realisation — that look is **lighting + terrain + materials + rounded simple
geometry**, not high-poly models. Cozy sims lean on atmosphere far more than mesh
detail.

## Approach — procedural first (operator decision 2026-05-14)

Every structure, tree, fence and path is built from Three.js geometry + stylized
materials this session. Zero external-asset dependency — the whole field reads
cohesive immediately and is fully iterable live. Alongside it, a thin **GLB
model-slot scaffold** (`world/modelSlot.tsx`): any zone/structure slot can later
take a `gltf:` path (MeshyAI bespoke, or a CC0 kit) and the procedural fallback
swaps out — no other code changes.

## Invariants (what must NOT change)

1. **The ritual is untouched.** `lib/purupuru/**` stays off-limits. The sequencer,
   beats, anchor registry, input-lock — none of it changes. Session 7's VFX
   (`PetalArc`, `ZoneBloom`, `DaemonReact`, `CameraRig`, `RewardRead`) keep working.
2. **The seedling anchor becomes a real thing.** `anchor.wood_grove.seedling_center`
   moved from "the box mesh" to an actual **seedling sprout mesh** in the wood
   plot — same screen-space contract, more honest target. It still carries the
   `impact_seedling` bloom spring.
3. **The prop surface is stable.** `WorldMap3DProps` is unchanged — `BattleV2`
   doesn't change. `WorldMap3D` becomes a composition root.
4. **CameraRig `focusTarget`** still resolves from `ZONE_POSITIONS` — keep that
   layout table.

## Module breakdown (`app/battle-v2/_components/world/`)

| File | Role |
|------|------|
| `palette.ts` | **NEW** — the cozy palette: grass/dirt/sky/foliage + per-element roof tints |
| `Terrain.tsx` | **NEW** — lush rolling green ground (replaces the cream disc), dirt plots + paths |
| `Foliage.tsx` | **NEW** — instanced procedural trees (green + autumn) + bushes, ringing the field |
| `ZoneStructure.tsx` | **NEW** — replaces `ZoneToken3D`: a stylized hut in a fenced plot, element-tinted; wood gets the seedling sprout (anchor + bloom). Keeps click/hover/state visuals |
| `modelSlot.tsx` | **NEW** — GLB swap scaffold: `<ModelSlot slotId fallback>` loads a registered `gltf:` or renders the procedural fallback |
| `CameraRig.tsx` | exists — unchanged |
| `WorldMap3D.tsx` | **REWRITE** — composition root: warm sky + hemisphere/key lighting + soft shadows, composes the above |

## Scope (BARTH)

**V1 — this session:** terrain + warm sky + soft-shadow lighting + instanced
foliage + simple dirt paths + procedural element huts in fenced plots + the
seedling sprout + the GLB loader scaffold. The whole field reads like the
reference's *vibe*.

**Cut from V1 (V2+):** bespoke per-element building designs (V1 = one base hut
tinted per element), dashed-parchment path borders (V1 = plain dirt), animated
structures (mills turning, smoke), an NPC overhaul (the cone+sphere chibis stay),
water/terrain shaders.

## Verify

- `:3000/battle-v2` — the field reads cozy + warm + lush; play the Wood card,
  the full ritual still fires and lands on the seedling.
- `npx tsc --noEmit` exit 0 · `npx oxlint app/battle-v2` 0 errors.
- No new `lib/purupuru/runtime` imports in `_components/`.
