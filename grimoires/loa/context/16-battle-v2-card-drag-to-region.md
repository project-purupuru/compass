---
title: "Battle-V2 — Card Drag-to-Region Interaction (coordination brief)"
status: superseded
superseded_by: 17-battle-v2-game-model-reconciliation.md
mode: arch + feel (OSTROM seam + ARTISAN feel)
date: 2026-05-14
relates_to: world/* (the other agent's land-mass build), 14-battle-v2-hud-zone-map
use_label: do_not_use_for_action
---

> ⚠️ SUPERSEDED 2026-05-14. The drag-card-onto-Voronoi-territory mechanic in
> this brief was an invention — it served neither the pitch nor cycle-1's
> substrate. The operator paused drag work; the game model is being
> reconciled in `17-battle-v2-game-model-reconciliation.md`. The drag *code*
> remains in the tree, inert. Do not build from this brief.

# Card Drag-to-Region — design + coordination

> Operator: "drag the card onto a portion of the map, it influences that area …
> the geometric separation of each area … very very easy … highlight the
> decision-making … common in rogue-lites." Two agents, coordinated — this brief
> is the seam.

## The geometry (what the other agent built)

- **`WorldView`** → one R3F `<Canvas>` → **`WorldScene`** → `MapGround` (the
  Tsuheji ground plane, `MAP_SIZE = 54` world units, centred at origin) +
  `RegionMap` + 5× `ZoneStructure` + `RaptorCamera`.
- **`regions.ts` · `regionAt(worldX, worldZ) → ElementId | null`** — the
  continent is partitioned into **5 noise-perturbed Voronoi territories**, one
  per element district. *This is the geometric separation the operator means —
  and the drop-target substrate.*
- **`zones.ts` · `ZONE_POSITIONS`** — 5 districts. `wood_grove` is playable; the
  other 4 are `decorative: true` (locked in cycle-1). Region → drop-zone mapping
  is `elementId`: `regionAt` returns `"wood"` → drop target is `wood_grove`.
- **`RegionMap.tsx`** — already paints each territory with its element tint
  (active element brighter). The drag-hover highlight extends *this*.
- Current play path: click card → `armedCardId` → click `ZoneStructure` →
  `BattleV2.handleZoneClick` → `queue.enqueue(PlayCard, target:{kind:"zone"})`.

## The interaction

1. **Pending** — pointer-down on a `CardFace`. Nothing visible yet (so a plain
   click still works).
2. **Dragging** — pointer moves past a ~6px threshold → the card lifts out of
   the hand (dims in place), a **DragGhost** (a live `CardStack`) follows the
   cursor, tilting toward drag velocity.
3. **Hover region** — while dragging over the canvas, a ground raycast resolves
   the pointer to world `(x,z)` → `regionAt` → the **whole elemental territory
   lights up** (RegionMap's tint for that region jumps to a bright hover state +
   an outline). The hit target is the *entire region*, not the hut — that's the
   "very very easy."
4. **Drop** — pointer-up over a region → play the card on that region's district
   zone. Over a locked region or off-map → the ghost snaps back, no-op.

Rogue-lite feel: generous whole-territory targets, one decisive highlight, a
satisfying snap. The decision is "which element/territory," made obvious.

## The seam — `_components/drag/dragStore.ts`

A module-level store (`useSyncExternalStore`). **Both halves build against this;
neither edits the other's files.** Contract:

```
DragState = { phase: "idle"|"pending"|"dragging", cardId, element, rarity,
              origin, pointer, hoverRegion, hoverZoneId }
beginPending({cardId, element, rarity, pointer})  — card side, on pointer-down
updatePointer(x, y)                                — DragLayer; promotes pending→dragging past threshold
setHover(region, zoneId)                           — MAP SIDE, from the ground raycast
endDrag()                                          — DragLayer, on pointer-up; invokes the drop handler
cancelDrag()                                       — Esc / sub-threshold release
setDropHandler(fn)                                 — BattleV2 registers the PlayCard fire
useDragState()                                     — any consumer
```

## Built this turn (the card side — all isolation-safe, my files)

- **`drag/dragStore.ts`** — the seam contract above.
- **`drag/DragLayer.tsx`** — window-level pointer + Esc tracking during a drag;
  mounted in `HudOverlay`.
- **`drag/DragGhost.tsx`** — the dragged card following the cursor (a live
  `CardStack`, velocity-tilted). Mounted in `HudOverlay`.
- **`CardFace.tsx`** — `onPointerDown → beginPending`; the card dims while it's
  the dragging card. The existing `onClick` arm-path is left intact (sub-
  threshold release = a normal click).

Result after this turn: you can pick up a card and the ghost follows your
cursor. Dropping is a no-op until the map side is wired.

## Needs coordination (the map side — the other agent's in-flight files)

1. **`WorldScene.tsx`** — add a transparent ground-plane mesh (or reuse
   `MapGround`'s) that, while `useDragState().phase === "dragging"`, on
   `onPointerMove` raycasts to world `(x,z)`, calls `regionAt`, maps the
   `ElementId` → district `zoneId`, and calls `dragStore.setHover(region, zoneId)`.
   On `onPointerUp` it's a no-op — `DragLayer` already owns `endDrag()`.
2. **`RegionMap.tsx`** — accept a `hoverRegion: ElementId | null` prop; the
   hovered territory renders at a bright hover alpha + a traced outline.
3. **`BattleV2.tsx`** — `useEffect(() => dragStore.setDropHandler(({cardId, zoneId}) =>
   handleDropPlay(cardId, zoneId)))`, where `handleDropPlay` enqueues the
   `PlayCard` command (the same path `handleZoneClick` uses). Once this works,
   the click-to-arm path can be retired.

## Open question (operator)

Locked regions (4 of 5 in cycle-1) — on hover during a drag, should they show a
**dim "locked" highlight** (clear they're not droppable) or **no highlight at
all**? Recommend the dim locked-state — it still teaches the geography.
