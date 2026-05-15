# Session 11 — Map Geometry + Elemental Territories

> *The continent had a shape. Now it has geometry — and the watcher can read
> the elements that move across it.*

> **Mode**: ARCH (OSTROM) spine · FEEL (ALEXANDER) surface · expert game-eng
> **Date**: 2026-05-14
> **Target**: `app/battle-v2/_components/world/` — worktree `compass-cycle-1`

---

## Why

Operator: *"we need an understanding of the map itself ... collision areas ...
position actual locations ... zones/outlined areas like continent/state
boundaries that would inform how we design elemental states and weather
effects."* The continent was a flat texture with no geometry — things floated
in the sea, there were no regions, no boundaries, no substrate for elemental
states. This session gives the map **real geometry**.

## The pipeline

```
public/art/tsuheji-map.png  (painted continent silhouette · olive on alpha)
        │
        │  _tools/extract-map-geometry.py   (PIL · marching squares · Douglas-Peucker)
        ▼
  world/landmass-data.ts   (GENERATED · re-run the tool if the PNG changes)
        ├─ LANDMASS_MASK     160×160 land/sea bitmask
        └─ COASTLINE_NORM    231-pt traced coastline polygon
  public/art/tsuheji-coastline.svg   (editable vector source-of-truth)
```

Research (WebSearch — dig-search is hard-down, project-denied) confirmed the
shape: two representations from one trace — bitmask grid for runtime queries,
polygon for rendering + future 3D extrusion.

## What it gives the runtime

| File | Role |
|------|------|
| `world/landmass.ts` | `isOnLand(x,z)` — constant-time bitmask collision query · `COASTLINE` polygon in world coords · `sampleOnLand()` rejection-sampler for placement |
| `world/regions.ts` | `regionAt(x,z)` — the 5 **elemental territories**, noise-perturbed nearest-district (organic borders, not dead-straight Voronoi). The substrate for elemental states + weather |
| `world/RegionMap.tsx` | The territories made visible — a canvas-texture tint per element washed over the continent (the ACTIVE element brighter — the raptor's eye drawn to where the element flows), plus the traced coastline outline |

## Wired in

- **Foliage + villagers** rejection-sampled onto land — no trees in the sea.
- **RegionMap** layered over the continent — Tsuheji reads as 5 elemental
  states, not one olive blob.
- The canonical coordinate basis holds throughout: normalized [0,1] = pct/100,
  so `landmass-data.ts`, `zones.ts`, and the map texture share one space.

## Sets up (not built this session)

- **3D elevation**: the coastline polygon extrudes into a landmass mesh; the
  bitmask is a heightfield base; noise masked by `isOnLand` gives terrain.
- **Weather / elemental states**: `regionAt(x,z)` is the query a weather system
  drives — per-territory effects, the active element's region animating.
- **Editable boundaries**: `tsuheji-coastline.svg` — reshape in a vector tool,
  re-run the Python tool to regenerate the runtime data.

## Verify

- `:3000/battle-v2` — the continent reads as 5 tinted elemental territories
  with organic borders + a traced coastline; foliage + villagers sit on land;
  the raptor stoop + the ritual still fire (regression-checked).
- `python3 app/battle-v2/_tools/extract-map-geometry.py` re-runs the pipeline.
- `npx tsc --noEmit` clean · `npx oxlint app/battle-v2` clean (the lone warning
  + `_devtools` tsc errors are the concurrent agent's in-flight files).
