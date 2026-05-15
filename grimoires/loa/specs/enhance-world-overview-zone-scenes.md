# Session 9 — World Overview + Zone Scenes

> *Survey the whole map. A card touches a district — the world takes you there.*

> **Mode**: ARCH (OSTROM) spine · FEEL (ALEXANDER) surface · scope BARTH
> **Date**: 2026-05-14
> **Target**: `app/battle-v2/_components/` — worktree `compass-cycle-1` · dev `:3000/battle-v2`
> **Continuation of**: Session 8 (the playing field) — the cozy world exists; this restructures it into overview ⇄ zone.

---

## Target (operator direction)

The 5 zones are no longer crammed into one cramped field. Instead:

- A **world overview** — the whole map, all 5 districts spread far apart and
  distinct. This is the survey vantage.
- **Separate zone scenes** — when a card affects a district, the view
  transitions INTO that district's own detailed scene. The ritual plays there.
  Then it returns to the overview.
- **Auto-director camera** — no manual panning; the world directs the eye to
  wherever the action is. The CIV5 *aspect*: survey, then the camera takes you
  to the action.

Operator forks resolved 2026-05-14: **B** (world overview + separate zone
scenes, not one continuous map) · **auto-director** (no player pan).

## Architecture

```
BattleV2  ──renders──▶  WorldView                         (drop-in for WorldMap3D)
                          │  view-state machine: overview | zone:<id>
                          │  two stacked <Canvas> layers, opacity crossfade
                          ├─▶ WorldOverview   (Canvas A · always mounted)
                          │     the map · 5 ZoneStructures spread WIDE · high survey cam
                          │     zone markers are the card-play click targets
                          └─▶ ZoneScene       (Canvas B · mounts while a zone is active)
                                one district up close · its ZoneStructure +
                                dense local foliage + DaemonReact + CameraRig + the ritual
```

- **One R3F root per view** (two Canvases) — clean separation, the crossfade is
  pure CSS opacity (no transform — a CSS scale would break `useMeshAnchorBinding`'s
  screen projection). Each view owns its camera.
- **The trigger is the beat stream.** `WorldView` watches `activeBeat`: any
  ritual beat → transition to `state.activeZoneId`'s scene; `unlock_input` →
  transition back. A rejected card-play fires no beats → no transition. The
  substrate stays the source of truth.
- **High reuse.** `WorldOverview` and `ZoneScene` both compose the Session-8
  `world/` modules (`Terrain`, `Foliage`, `ZoneStructure`, `palette`,
  `modelSlot`). The overview is "5 structures spread wide, seen from high";
  the zone scene is "1 structure up close, with the ritual."

## Invariants (what must NOT change)

1. **The substrate is untouched.** `lib/purupuru/**` off-limits. The ritual —
   sequencer, beats, anchors, input-lock, VFX — all unchanged. The ZoneScene
   mounts before the beats need its anchors; `useMeshAnchorBinding`'s
   mount/unmount cleanup already survives the scene swap.
2. **`BattleV2`'s shape barely moves** — `WorldView` takes the same props
   `WorldMap3D` did and is a drop-in. `onZoneClick` still fires from the
   overview's zone markers; the play pipeline is identical.
3. **The VfxLayer is DOM and always mounted** — the ritual's screen-space
   overlay is unaffected by the canvas swap.

## Module breakdown

| File | Role |
|------|------|
| `world/zones.ts` | **NEW** — the shared zone placement table, spread WIDE for the overview |
| `world/WorldOverview.tsx` | **NEW** — the map: Terrain + Foliage + SoraTower + 5 spread ZoneStructures + Villagers + a high survey camera |
| `world/ZoneScene.tsx` | **NEW** — one district up close: local ground + dense Foliage + the focused ZoneStructure + DaemonReact + CameraRig + the ritual |
| `WorldView.tsx` | **NEW** — view-state machine + two-Canvas crossfade. Drop-in for `WorldMap3D` |
| `WorldMap3D.tsx` | **RETIRED** — its modules were extracted in Session 8; its remaining content (ZONE_POSITIONS, SoraTower, NPCs, knobs) moves into the files above |
| `BattleV2.tsx` | **MODIFIED** — one import swap: `WorldMap3D` → `WorldView` |
| `battle-v2.css` | **MODIFIED** — `.world-view` two-layer stack + opacity crossfade |

## Scope (BARTH)

**V1 — this session:** the overview ⇄ zone architecture, proven end-to-end with
the **wood grove**. The overview shows all 5 districts spread wide; the wood
grove gets a full detailed `ZoneScene`; the camera transitions in on card-play
and back on `unlock_input`; the ritual fires inside the zone scene.

**Cut from V1 (V2+):** detailed scenes for the other 4 districts (overview
markers only — they're decorative/locked anyway), free zoom/explore without
playing a card, bespoke per-district terrain/mood, animated overview (weather
drifting across the map), an overview minimap/HUD.

## Verify

- `:3000/battle-v2` — the overview shows 5 distinct spread-out districts; arm
  the Wood card, click the wood grove; the view transitions into the wood grove
  scene, the full ritual fires there, then it returns to the overview.
- `npx tsc --noEmit` exit 0 · `npx oxlint app/battle-v2` 0 errors.
- No new `lib/purupuru/runtime` imports in `_components/`.
