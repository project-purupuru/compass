---
status: graduation-tier
owner: vfx-lab
last_updated: 2026-05-16
---

# VFX Presets

Operator-curated tweakpane state snapshots from `/battle-v2/vfx-lab`.

## How presets land here

1. Tune an effect in the lab.
2. KnobPane → ops → `download preset` (or `copy preset (json)`).
3. Drop the file into this directory as `<effect-id>.<descriptor>.preset.json`.

Filename convention: `tree-fall.dramatic-oak.preset.json`, `water-splash.gentle-ripple.preset.json`.

## Format

Tweakpane v4 `Pane.exportState()` output — a `{ children: [...] }` tree where
each leaf binding has its current value. Loaded back via `import preset…` in
the lab.

## Why grimoires (not lib/vfx/presets/)

Graduation-tier storage anchors presets to user-truth canvases (per the
graduation-as-user-truth-backpressure doctrine). Each preset is a captured
moment of "this feels right" — operator-validated, not engineer-defaulted.
When an effect ships into gameplay (session 15+), the preset selected is a
deliberate authoring choice, not a side-effect of code import order.
