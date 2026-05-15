---
title: "Battle-V2 HUD — Taste Tokens (extracted from the Observatory)"
status: candidate
mode: feel (ARTISAN)
constructs: [artisan/ALEXANDER, the-easel]
date: 2026-05-14
source: 3 extraction sub-agents over app/globals.css + components/observatory/*
relates_to: studio-brief 15-battle-v2-hud-vocabulary (main worktree), 14-battle-v2-hud-zone-map
use_label: background_only (until operator promotes)
---

# Battle-V2 HUD — Taste Tokens

> ARTISAN extraction. Three sub-agents read `app/globals.css` (the 755-line token
> registry) + `components/observatory/*` and returned the color/material,
> typography, and composition/motion systems. This is the synthesis: the spec
> the HUD restyle is built from.

## The finding

The Observatory **already codifies exactly the operator's direction.**
`globals.css` carries the doctrine verbatim:

> *"Solid colors only — no opacity on persistent UI. Materials have mass."*

The battle-v2 HUD violated this — every panel was `oklch(… / 0.86)` + `backdrop-filter: blur`. That's *glass*: it has no surface of its own, it samples and frosts whatever is behind it. The Observatory panel is *ceramic*: a solid fill, a 1px edge, a layered drop-shadow, and a faint white inset top-edge glaze that catches light like a physical lit lip. **The restyle is not invention — it is adoption.**

(The one Observatory exception — `FocusCard`, still `/95` + blur — is *not* canonical. Match the opaque tiles: `KpiCell` / `StatsTile` / `WeatherTile` / `KpiStrip`.)

## §1 · Material — opaque, dark (Old Horai)

The HUD is dark-mode-only for now. The `/battle-v2` route forces `data-theme="old-horai"` so every `--puru-*` token resolves dark. Light mode is deferred.

| Role | Token | Dark value |
|---|---|---|
| **Raised panel surface** | `--puru-cloud-bright` | `oklch(0.24 0.015 80)` |
| **Recessed cell / sub-surface** | `--puru-cloud-base` | `oklch(0.20 0.012 80)` |
| **Deepest recess** | `--puru-cloud-deep` | `oklch(0.10 0.008 80)` |
| **Panel border** (1px solid) | `--puru-surface-border` | `oklch(0.30 0.012 80)` |
| **Inset glaze** (top-edge highlight) | `--puru-surface-highlight` | `oklch(1 0 0 / 0.06)` |
| Panel shadow | `--shadow-tile` | layered drop + inset glaze |
| Open-edge panel shadow | `--shadow-rim-bottom` / `--shadow-rim-left` | directional |
| Element vivids | `--puru-{wood,fire,earth,metal,water}-vivid` | e.g. wood `oklch(0.85 0.170 112.7)` |
| Accent / focus | `--puru-honey-base` | `oklch(0.84 0.160 85)` |
| Ink (text) | `--puru-ink-{rich,base,soft,dim}` | `0.90 / 0.84 / 0.72 / 0.62` L |
| Radius | `--radius-sm` 6px (tiles) · `--radius-md` 12px (panels) | — |

**Rule:** no `/ alpha` on any panel surface. Where a tint is wanted, `color-mix(in oklch, <vivid> N%, <opaque base>)` — never alpha. No `backdrop-filter`.

## §2 · Typography

Five brand stacks (all in `globals.css`, loaded route-wide):

| Token | Typeface | Use |
|---|---|---|
| `--font-puru-display` | FOT-Yuruka Std (rounded Japanese) | headings, names — **the character** |
| `--font-puru-body` | Inter | body copy, UI text |
| `--font-puru-mono` | Geist Mono | **labels + all numeric/data** |
| `--font-puru-card` | Noto Serif JP | serif kanji accents |
| `--font-puru-cn` | ZCOOL KuaiLe | pure-CN display |

The Observatory's type signature — **soft-display / hard-data pairing**:
- **Headings / names** → `--font-puru-display`, `--puru-ink-rich`, no uppercase, no tracking. Yuruka's roundness *is* the warmth.
- **Labels** (the canonical pattern) → `--font-puru-mono`, `text-2xs` (~10px), `text-transform: uppercase`, `letter-spacing: 0.22em`, `--puru-ink-soft`/`-dim`.
- **Body** → `--font-puru-body`, `text-sm`/`text-xs`, `--puru-ink-base`.
- **Numeric/data** → `--font-puru-mono` + `font-variant-numeric: tabular-nums`. Numbers swap in tab-stable slots — they do **not** tick or fade. Motion lives on the *cell*, never the digits.

## §3 · Composition & motion

- **Panels are square**; radius lives only on tiles/pills/floating cards (`--radius-sm` 6px).
- **Depth via layering, not borders** — headers separate by stacked shadow (`0 1px 0` + `0 2px 4px`), bodies recess to `--puru-cloud-base`.
- **4px baseline grid** (`--space-*`). Panel headers `px-6 py-4` (24/16); tiles `px-3 py-2`; internal stack `gap-1` (4px).
- **Easing** — `--ease-puru-out` `cubic-bezier(0,0,0.2,1)` (default), `--ease-puru-bounce` `cubic-bezier(0.34,1.56,0.64,1)` (press), `--ease-puru-breathe` (ambient). Durations: press 80ms · tap 120ms · fast 200ms · normal 400ms.
- **Per-element breathing** — `--breath-wood: 6s` … `--breath-fire: 4s`.

## §4 · The four "soft game-UI" techniques

What makes the Observatory read as a cozy Genshin/Ghibli interface, not a flat dashboard — apply all four to the HUD:

1. **Inset top-highlight glaze** — every panel shadow ends with `inset 0 1px 0 var(--puru-surface-highlight)`. Light catches the top lip → ceramic.
2. **Layered depth, not outlines** — surfaces have mass and stacking order; recess sub-cells one step.
3. **Ambient living motion** — breathing dots, sub-pixel drift, gradient cross-fades. Nothing snaps.
4. **Warm palette + felt-not-seen element identity** — element colour enters as low-opacity washes + oversized kanji at `opacity ~0.10`, never as a loud fill.

## §5 · Application map (this turn)

| HUD element | Was | Now |
|---|---|---|
| Ribbon / Stones / Rail panels | `oklch(…/0.86)` + `blur(7px)` | `--puru-cloud-bright` opaque + `--shadow-tile`, no blur |
| Panel borders | wood-tinted `/0.4` | `--puru-surface-border` 1px solid |
| Chips / rail card / stone slots | `oklch(…/0.6–0.7)` | `--puru-cloud-base` opaque |
| Caretaker bubble | `oklch(…/0.92)` + blur | `--puru-cloud-bright` opaque, no blur |
| Labels | default font | `--font-puru-mono` uppercase `0.22em` `--puru-ink-soft` |
| Names / headings | default font | `--font-puru-display` `--puru-ink-rich` |
| Data values | default | `--font-puru-mono` `tabular-nums` |
| Route theme | system-dependent | `data-theme="old-horai"` forced dark |

## §6 · Deferred

- **Light mode** — explicitly out of scope per operator; the `--puru-*` system already has light values, so it's a `data-theme` flip later, not a rewrite.
- **CardFace / cards** — left as-is; cards are opaque layer-art, not frosted HUD.
- **FenceLayer devtool** — its own instrument aesthetic, not game HUD; untouched.
- **Motion adoption** — `--ease-puru-*` + breathing rhythms partially applied; a full motion pass (press squash, ambient drift on the ribbon) is a follow-up.
