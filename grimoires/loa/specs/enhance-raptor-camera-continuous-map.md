# Session 10 — The Raptor Camera + the Continuous Tsuheji Map

> *Sky-eyes watches the world. The global view is a raptor's watch — and a
> raptor's eyes never leave the target.*

> **Mode**: FEEL (ALEXANDER) · ARCH spine (OSTROM) · scope BARTH
> **Date**: 2026-05-14
> **Target**: `app/battle-v2/_components/` — worktree `compass-cycle-1` · dev `:3000/battle-v2`
> **Continuation of**: Session 9 (overview ⇄ zone). Resolves the "sickening"
> camera + "glitches outwards" via the research verdict + the operator's
> owl/hawk creative direction.

---

## Why this session

Session 9 shipped overview ⇄ zone as **two stacked Canvases, opacity
crossfade**. The operator: *"sickening … glitches outwards."* Research verdict
(WebSearch, dig-search was down): the crossfade IS the nausea — two
stationary-but-different images dissolving give the vestibular system zero
motion cues, so the brain reads a teleport. Two WebGL contexts churning is the
"glitchy" part. The fix every source converges on: **one Canvas, one camera, a
continuous eased move.**

Operator forks resolved 2026-05-14:
- **One continuous map + one flying camera** (revisits the Session-9 "separate
  scenes" call — but it converges with the canonical-map re-grounding).
- The global view is **a raptor's** — owl/hawk. Movement + vantage reflect that.

## The raptor feel spec (ALEXANDER)

A bird of prey is the camera's *character*. Four states:

| State | When | Feel | Spec |
|-------|------|------|------|
| **Soar** | overview / rest | High over the whole continent, looking down. Never dead-still — a slow thermal drift, a wide lazy circle. The world breathes under a circling watcher. | altitude pose · ambient drift: ~22s period, small amplitude orbit + gentle bob |
| **Stoop** | overview → district | The committed dive. Drops from altitude toward the district — accelerating in, decelerating to the hover. **Gaze LOCKED on the district centre the entire descent** — the owl's head-stability: body moves, eyes don't. | critically-damped spring → district pose · ~0.7s · FOV constant · lookAt fixed on district centre throughout |
| **Hover** | at a district | Near-still watchful hold. The faintest drift — a perched raptor's micro-adjustments. The ritual plays here. | district pose + tiny ambient drift · this is where it **STAYS** |
| **Climb** | district → overview | The reverse — pull back up to altitude, regain the soar. | same spring → altitude pose · ~0.8s |

**Gaze-lock is the load-bearing principle.** Translation reads as comfortable;
rotation is the nausea driver. The camera *dollies* between altitude and a
district while its aim stays nailed to a stable focal anchor. This is the
research finding and the raptor metaphor saying the same thing.

**Stays in the zone.** Entering a district HOLDS. No auto-return on
`unlock_input`. Leaving is an explicit operator act — Esc, or a corner "ascend"
control. (Session 9's auto-return on `unlock_input` is the "glitches outwards"
bug — deleted.)

## Architecture — collapse to one Canvas

```
WorldView                         (thin · one <Canvas> · the view-state machine)
  │  viewState: overview | district:<id>  → feeds RaptorCamera a target pose
  └─▶ WorldScene                  (ONE continuous scene)
        Tsuheji map ground (tsuheji-map.png, the real continent — operator:
          "I can no longer see the map" · Session 8 dropped this texture)
        + 5 districts at CANONICAL positions (world/zones.ts ← locations.ts)
        + Sora Tower at the hub + Foliage across the map + DaemonReact
        + RaptorCamera   (soar · stoop · hover · climb · gaze-locked)
```

- **One `<Canvas>`, one camera.** Kills the crossfade nausea + the WebGL churn.
- `WorldOverview.tsx` + `ZoneScene.tsx` **retired** — their content (lighting,
  foliage, structures, the daemon) is absorbed into `WorldScene`. The districts
  no longer live in separate scenes; they're regions of one continent.
- `CameraRig.tsx` → **`RaptorCamera.tsx`** — hand-rolled (builds on `stepSpring`
  / a critically-damped `SPRING_RAPTOR`): the research's CameraControls is the
  generic answer, but the raptor is a *character* and needs bespoke motion
  (the soar drift, the stoop's accel profile). Honours every research
  principle — ease-in-out, focal-stable, constant FOV, no overshoot.
- `WorldView`'s prop surface is **unchanged** — `BattleV2` + `world-preview`
  keep working untouched.

## Invariants

1. `lib/purupuru/**` untouched. The ritual — sequencer, beats, anchors,
   input-lock, VFX — unchanged. The wood grove's seedling anchor still binds
   (it's now a fixed spot in the one scene; `useMeshAnchorBinding` projects it
   through the live raptor camera every frame — petals + bloom still track).
2. `WorldView` stays a drop-in for the `worldMap` slot — no `BattleV2` edit
   (concurrent HUD work lives there).

## Scope (BARTH)

**V1 — this session:** one Canvas + the raptor camera (all four states) +
`tsuheji-map.png` as the continuous ground + the 5 districts at
canonical-informed positions + stays-in-zone + an explicit ascend control.
The camera feels like a raptor; the map is visible; nothing glitches out.

**Cut from V1 (V2):** all 19 canonical `locations.ts` markers, the 6 train
lines (the rosenzu) rendered across the map, per-district bespoke mood,
player-controlled free pan, an elaborate multi-waypoint soar path.

## Verify

- `:3000/battle-v2` — the painted Tsuheji map is the ground; the camera soars
  over it; click the wood grove → it **stoops** down (gaze-locked, smooth, no
  nausea) and **stays**; the ritual fires there; Esc / ascend control climbs
  back to the soar.
- `npx tsc --noEmit` exit 0 · `npx oxlint app/battle-v2` 0 errors.
- No new `lib/purupuru/runtime` imports; `WorldView` prop surface unchanged.
