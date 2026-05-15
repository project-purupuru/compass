---
session: 12
date: 2026-05-14
type: kickoff
mode: feel
status: planned
target: app/battle-v2/ (worktree compass-cycle-1 · dev :3000/battle-v2)
---

# Session 12 — Juice: the satisfaction of changing the world

> *Play a card. The wood grove answers — not with a flash, but with consequence.
> Trees grow. Bears come. Wood is cut and carried home. The map remembers.*

## The direction (operator, 2026-05-14)

The world is built — the continent, the elemental territories, the raptor
camera, the ritual. **Session 12 is about JUICE**: the felt satisfaction of
playing a card and *influencing an area of the map*. Not VFX for their own
sake — visible, legible **consequence**.

The wood-grove worked example:
- Play a wood card on the wood district → **trees grow** in that region.
- **Characters appear** on the map — **bears** (there is existing artwork to
  work from). They aren't ambient dressing; they *do* things.
- Bears **grow trees / chop trees**, then **carry the wood back to the main
  area** (Musubi Station / the hub) — a little supply loop you can watch.
- **"Ideally they aren't all just houses."** Each district should have varied,
  living activity — the wood grove is a working grove, not a hut with a roof.
- **Weather effects** — the elemental regions (Session 11) are the substrate.
  The active element's territory should *do* something the eye reads as weather.

## Asset pipeline

- **MeshyAI prompt work** — produce the bears + district props + structures.
  Session 8's `world/modelSlot.tsx` GLB-swap scaffold is ready: register a
  `gltf:` path against a slot id and the procedural fallback swaps out, no
  other code change. Bears, trees-that-grow, the wood-cart — all slot-able.

## What this builds on (already shipped, sessions 7–11)

| Layer | Where | Use it for |
|-------|-------|-----------|
| The ritual substrate | `lib/purupuru/` (OFF-LIMITS) — sequencer, beats, anchor registry, input-lock | Card-play already fires a deterministic beat stream. Juice = more beats, richer answers. |
| Beat-driven VFX | `_components/vfx/` — PetalArc, ZoneBloom, DaemonReact, RewardRead, VfxLayer | The pattern for "a beat fires → something happens." Tree-growth, bear-arrival, wood-haul are new beat-driven components. |
| Raptor camera | `_components/world/RaptorCamera.tsx` | Stoop into the district being acted on; the juice plays out under the watcher's gaze. |
| Map geometry | `_components/world/landmass.ts` (`isOnLand`, `sampleOnLand`), `regions.ts` (`regionAt` → element) | Place trees/bears ON land; per-region elemental behaviour; the substrate weather effects key off. |
| GLB model slots | `_components/world/modelSlot.tsx` | Drop MeshyAI bear/tree/prop GLBs into district slots. |
| Elemental territories | `_components/world/RegionMap.tsx` | Already renders the 5 territories + active-element brighter. Weather effects extend this. |

## Open shapes to resolve in-session

- The bear "supply loop" — is it a scripted beat sequence (like the ritual), or
  a small autonomous agent loop? (Lean: scripted beats first — juice, not sim.)
- Tree-growth as a beat-driven spawn vs a persistent map-state change ("the map
  remembers"). The substrate's GameState is the truth channel — does grown-wood
  persist in state, or is it presentation-only for V1?
- Weather: per-region ambient effect (the active territory) vs a global
  cosmic-weather overlay. Session 11's `regionAt` supports either.

## Carry-forward from Session 11

- Map geometry pipeline shipped: `_tools/extract-map-geometry.py` → bitmask +
  coastline + SVG. Re-run if the map art changes.
- All 5 districts + hub + tower snap to solid land (`snapToLand`, SNAP_CLEARANCE
  5 — the full plot footprint stays on the continent).
- `/feedback` filed `0xHoneyJar/construct-k-hole#24` — dig-search dual-path
  failure. dig-search remains down; operator is fixing the k-hole construct.
- Prior session specs: `grimoires/loa/specs/enhance-{playable-truth-hud,
  playing-field-aesthetic,world-overview-zone-scenes,raptor-camera-continuous-map,
  map-geometry-elemental-regions}.md`.

## Next session entry point

```text
/feel   — FEEL mode · ALEXANDER · juice + consequence
Read first: this track + grimoires/loa/specs/enhance-map-geometry-elemental-regions.md
Surface:    app/battle-v2/_components/  ·  dev :3000/battle-v2

The question at every step: when you play the card, do you FEEL the world change?
```
