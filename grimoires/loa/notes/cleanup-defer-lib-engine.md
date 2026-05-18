---
date: 2026-05-17
type: cleanup-defer
status: active
scope: lib/engine
---

# Cleanup Defer — lib/engine

Janitor pass did not edit or stage `lib/engine/`.

Live-drift item observed during completion audit:

- `lib/engine/ecs/rock-archetype.ts` — untracked; belongs to simstim cycle-3 / engine-instancing lane.

Why deferred:

- The cleanup objective explicitly marks `lib/engine/` as owned by simstim cycle-3.
- The janitor pass may classify the file but must not edit, archive, or commit it.
