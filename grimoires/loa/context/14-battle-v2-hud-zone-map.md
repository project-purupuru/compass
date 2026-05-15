---
title: "Battle-V2 HUD — Zone Map (from operator fence brief)"
status: candidate
mode: studio (feel + arch)
constructs: [the-easel, artisan/ALEXANDER, the-arcade/OSTROM]
date: 2026-05-14
source: operator fence brief, 12 fences → 6 distinct zones (FenceLayer dev tool)
relates_to: studio-brief 15 (battle-v2-hud-vocabulary, main worktree)
use_label: background_only (until operator promotes to active)
---

# Battle-V2 HUD — Zone Map

> Crystallized from the operator's 12-fence refinement brief (2026-05-14). The
> 12 fences resolve to **6 distinct zones** (each was fenced twice — an
> unlabelled pass, then a labelled+noted pass). This is the spec; the visible
> study is `/battle-v2/hud-preview`.

## The 6 zones

| Zone | Fence | Region (viewport %) | Status | Studio-brief term |
|---|---|---|---|---|
| **Ribbon** — player + stats | F2 | x0 y1 · 99×7 (top, full width) | **restructure** | Ribbon |
| **Stones column** — saved elements | F6 | x1 y15 · 6×31 (left edge) | **additive (new)** | Pip-row, vertical |
| **Hovercard rail** — world focus | F4 | x83 y20 · 16×52 (right edge) | **additive (new)** | Inspector (diegetic-leaning) |
| **Caretaker** — trainer + companion | F12 | x0 y62 · 20×37 (bottom-left) | **additive (new)** | Crest zone |
| **Cards zone** — the hand | F10 | x27 y76 · 46×20 (bottom-center) | **restructure** | Tray |
| **Bottom bar** — back plate | F8 | x0 y88 · 99×12 (bottom, full width) | **restructure** | Tray frame |

Center (everything not fenced) = the world canvas. Already full-bleed z=0 in
battle-v2.css — leave it.

## Zone detail

### Ribbon (F2) — *restructure*
Operator: "this thin top area should be where the user and other stats lie."
- **Today**: `.ui-screen__top-strip` — a 3-col grid (titleCartouche · focusBanner+tide · selectedCardPreview). Floats z=10, gradient anchor.
- **Change**: re-cast as a player-identity ribbon — avatar crest + name + stat chips (energy · day-element · turn). `focusBanner` / `TideIndicator` fold into it as chips.
- **Substrate**: `GameState.weather.activeElement`, `state.turn`, energy (cycle-2). All already in the snapshot.
- **Collision**: edits `UiScreen.tsx` + `battle-v2.css` `.ui-screen__top-strip`. **In-flight Session-7 files.**

### Stones column (F6) — *additive*
Operator: "a column of elemental stones which we have saved and the currently active one is highlighted while the others are not."
- **Today**: does not exist. (This is the "stones vertical-left" idea from the prior turn, now specified.)
- **Build**: a new `<StonesColumn>` HUD component — 5 element tokens stacked vertically, left edge. Active = the day-element tide; others dimmed/desaturated.
- **Substrate**: `GameState.weather.activeElement` for active; the "saved" set is **not in the cycle-1 snapshot** — needs a `savedElements` source or mock for now (flag as a substrate gap).
- **Collision**: none if built as a new file + new slot. New slot wiring touches `UiScreen.tsx` (1 slot) — small, but still an in-flight file.
- **v1 piece to pull**: the element-token visual language (kanji + breathing) — battle-v2 already has `TideIndicator`'s breathing stone; extend that.

### Hovercard rail (F4) — *additive*
Operator: "the area where the (diegetic?) hovering elements in the world like pigs, trees, and other things that might have influence like number of elements in the zone might show up here."
- **Today**: `EntityPanel` exists (right side, selection-summoned) — but it's centered-right and summoned by *selection*, not *world hover*. Different intent.
- **Build**: a new `<WorldFocusRail>` — surfaces what the world is showing (hovered creatures, zone element density). Diegetic-leaning: it reports the *fiction*, not UI state.
- **Substrate**: needs a world-hover signal. `WorldMap3D` has `onZoneHoverChange`; creature/entity hover is **not in cycle-1 substrate** — flag as a gap. EntityPanel may merge into this or sit alongside.
- **Collision**: new file, but conceptually overlaps `EntityPanel` — needs an OSTROM call on whether they merge.

### Caretaker (F12) — *additive*
Operator: "the active caretaker should render here and represent the caretaker + companion (puruhani). two images. like trainer + pokemon. still undecided but at least the trainer with comments."
- **Today**: does not exist in v2. v1's `ArenaSpeakers` is the lineage (Puruhani + mascot + whisper bubble).
- **Build**: a new `<CaretakerCorner>` — two portrait slots (caretaker = trainer, Puruhani = companion) + a comment bubble.
- **Substrate**: `lib/honeycomb/companion.ts` + `whispers.ts` exist in the *main* worktree's honeycomb — **not yet in cycle-1's `lib/purupuru/`**. Caretaker voice lines need a content source. Flag as a gap; mock for the preview.
- **v1 piece to pull**: `app/battle/_scene/ArenaSpeakers.tsx` + `WhisperBubble.tsx` — the structure ports almost directly.

### Cards zone (F10) — *restructure*
Operator: "the cards would be in a row here."
- **Today**: `CardHandFan` — already a row (`.card-hand-fan`, flex). Largely correct.
- **Change**: mostly positional — confirm it sits in the bottom-center band, on the back plate (F8). Minor.
- **Collision**: `CardHandFan.tsx` is an **in-flight Session-7 file** — coordinate before touching.

### Bottom bar (F8) — *restructure*
Operator: "the bottom aesthetic bar that would represent the back plate for your cards."
- **Today**: `.ui-screen__bottom-strip` — a gradient anchor, not a material plate.
- **Change**: give it material — a washi/lacquer back-plate the cards rest *on* (per studio-brief 15 §1.2: the Tray's frame). Cards zone (F10) layers above it.
- **Collision**: `battle-v2.css` `.ui-screen__bottom-strip` — in-flight.

## Routing reality (OSTROM — read before building)

The cycle-1 worktree has **uncommitted Session-7 work** in `BattleV2.tsx`,
`CardHandFan.tsx`, `battle-v2.css`, `page.tsx`. The split:

- **Additive zones** (Stones · Hovercard rail · Caretaker) — buildable as **new files** with low collision. Each needs only a 1-slot wire into `UiScreen.tsx`.
- **Restructure zones** (Ribbon · Cards zone · Bottom bar) — edit in-flight files. These **must** coordinate with the Session-7 work or route through the cycle's `/implement` gate. Not a solo edit.

**Substrate gaps to flag** (none block the preview, all block the *real* build):
1. `savedElements` — the Stones column's "saved" set has no source in `lib/purupuru/`.
2. World-hover signal for creatures/entities — only zone-hover exists.
3. Caretaker + companion content — `companion.ts` / `whispers.ts` live in the *main* worktree's honeycomb, not cycle-1's `lib/purupuru/`.

## The artifact

`/battle-v2/hud-preview` — a static, isolated layout study of all 6 zones,
styled in battle-v2's own token vocabulary. New route, new files, **zero edits
to any in-flight file**.

The refinement loop closes on itself: `app/battle-v2/layout.tsx` mounts the
FenceLayer dev tool across the whole `/battle-v2/*` subtree — so
`/battle-v2/hud-preview?fence=1` lets the operator fence the *mock* for round 2.
