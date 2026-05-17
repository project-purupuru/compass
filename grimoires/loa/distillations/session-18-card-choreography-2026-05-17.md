---
session: 18
date: 2026-05-17
type: substrate-distill
topic: card-to-map-choreography + game-juice-typography
status: ready
authored_by: claude (interactive · operator-paced)
spec: grimoires/loa/specs/enhance-card-to-map-choreography.md
predecessors:
  - grimoires/k-hole/research-output/dig-session-2026-05-17.md (Sakurai + Kowalski + Disney findings)
  - grimoires/k-hole/research-output/gemini-stardust-card-choreography-2026-05-17.md (10 load-bearing directives)
---

# Session 18 — Card-to-Map Choreography · Game-Juice Substrate

Per [[feedback_session-distillation-cadence]] — substrate / application /
taste, 3-stage promotion candidate for construct-honeycomb-substrate.

## What landed

The `/battle-v2/vfx-lab` opens to (with `card-lab` as one picker entry):

- A 5-card hand using the canonical `CardHandFan` + `CardFace` + `CardStack`
  primitives — real game card art, real fan layout, real arm/hover states.
- `LOCK IN` button that drives a state-machine through
  `idle → locked → breath → playing → settle → idle`.
- A right-side `CardShowcase` that stamps the active card with spring-overshoot
  during playback (operator-locked position: cards big-on-right, action on left).
- A `HitText` overlay that fires the operator-priority big-typography climax
  on impact — tier escalates with chain count.
- An `UltimateScreen` full-viewport takeover (radial vignette + element-tinted
  auroras) when a 5-chain ultimate fires.
- A `TYPE TIERS` button strip + keybinds (6/7/8/9/0/-) for tuning each
  typography tier in isolation.
- Lab-only convenience: keybinds 1-5 arm, D discard, R reroll, Shift+1-5
  direct discard, Enter lock-in, Esc unlock.

## Substrate (load-bearing, port verbatim)

### `lib/choreography/` — the timing math

Five framework-agnostic modules. Pure TS state + math, no React, no r3f:

| Module | Role |
|---|---|
| `spring.ts` | Mass/stiffness/damping solver. 4 presets (gentle/snappy/bouncy/firm). Operator-locked: NEVER replace with cubic-bezier for UI motion. Per Emil Kowalski's spatial-UI doctrine. |
| `hitStop.ts` | Global frame-freeze on impact. `freezeDurationFor(tier)` returns canonical seconds — scales with combo tier (0.05s solo → 0.20s 5-chain). Per Sakurai. |
| `trimPath.ts` | Dashed-line draw-in animation primitive (AE Trim Paths equivalent). 4-phase: draw-in 0.18s easeOutQuart → hold 0.10s → tail-fade 0.4s → done. |
| `sequence.ts` | Keyframe stagger primitive + 10 easing curves (easeOutBack, easeInBack, easeOutQuart/Quint, etc). Includes `canonicalCardPlaybackBeats()` — the operator-locked 9-beat single-card template. |
| `typography.ts` | **THE taste-token table.** 6 tiers: `base-hit` · `combo-2/3/4` · `ultimate-chain` · `tide-banner`. Each carries `TypoStyleSpec` (font/stroke/shadow/gradient/brushStroke) + `TypoAnimSpec` (entry/hold/exit/pulse). `sampleTypoAnim(tier, elapsedSec)` returns current scale + opacity + phase. **This is where typography refinement work happens.** |

**Load-bearing invariant**: spring physics beats Bezier. NEVER linear easing
except for fade-outs. Disney "overlapping action" — stagger every keyframe by
2-3 frames; simultaneous = robotic.

### `app/battle-v2/_components/cardjuice/` — the application layer

| File | Role |
|---|---|
| `HandRack.tsx` | Thin wrapper around canonical `CardHandFan`. Mocks `GameState` + `ContentDatabase` + `AnchorStore`. Adds lab-only discard + reroll + keybinds. Honors `locked` prop (translateY +150px easeInCubic). |
| `LockInBar.tsx` | The COMMIT button. Click or Enter → drops the hand UI together. Esc unlocks (lab convenience). |
| `CardShowcase.tsx` | Right-side big-card panel. Spring-overshoot entry (1.5x→1.0x easeOutBack 0.15s). Holds during playback, fades during settle. Uses real `CardFace`. |
| `HitText.tsx` | Stylized typography overlay that animates a tier through entry → hold → exit. Heavy 8-directional black stroke for solid-color tiers; `-webkit-text-stroke` + `drop-shadow` filter for gradient tiers (the only way CSS lets gradient text carry stroke + glow). |
| `TypographyPreview` (in HitText.tsx) | Button strip + keybinds 6/7/8/9/0/-. Each fires a tier through its anim cycle in isolation. The operator tuning surface for typography craft. |
| `UltimateScreen.tsx` | Full-viewport takeover for 5-chain ultimate. Radial vignette + dual element-tinted aurora wisps (top + bottom). Auto-dismisses. |
| `LabPortal.tsx` | `createPortal` to document.body. ESCAPES drei's `<Html>` transform-trap which broke `position: fixed` UI. **All DOM overlays in the card-lab portal through this.** |
| `cardData.ts` | Mock `CardDefinition`s for the lab. 5-card MOCK_HAND + 5-card MOCK_DECK pool. Cast through `unknown` since `CardDefinition` is heavy. |

### Adjacent bug fixes (load-bearing for everyone, not just the lab)

| Path | Fix |
|---|---|
| `lib/runtime/runtime.ts` | Wired `MatchEngineLive` into `PrimitivesLayer`. The match engine was exported but never provided — `useMatch` / `matchEngine.lockIn` etc. all threw "Service not found." |
| `app/battle-v2/_components/CardFace.tsx` | Added `LAYER_CARDTYPE_BY_DEFINITION_CARDTYPE` bridge mapping. Without it, `CardStack`'s character-art layer returned null because the harness `CardDefinition.cardType` ("activation"/"modifier"/"daemon"/"ritual"/"tool"/"event") wasn't a key in the registry's variants (`"jani"/"caretaker_a"/"caretaker_b"/"transcendence"`). **The bridge is now the canonical adapter between harness world and honeycomb layer world.** |
| `app/battle-v2/_components/clash/ClashArena.tsx` | Passed `card.cardType` to CardStack. |
| `app/battle-v2/_components/drag/{dragStore,DragGhost}.tsx` | Extended `DragState` + `beginPending` to carry cardType. |
| `app/battle-v2/_components/vfx/effects/HexScene.tsx:196` | Tuple cast through `unknown` (TS-suggested fix for variable-length array → fixed-length tuple). |
| `types/js-yaml.d.ts` (new) | Minimal type shim — avoids touching package.json which parallel ECS sprint-2 also has open. Promote to `@types/js-yaml` later. |

## Application (compass-specific)

### State machine

```
idle ──(LOCK IN)──> locked ──(0.2s)──> breath ──(0.3s)──> playing ──(~1.5s)──> settle ──(0.4s)──> idle
                                                              │
                                                       (0.5s in: fire HitText)
                                                              │
                                                       (if 5-chain: UltimateScreen
                                                        engages w/ element-accent aurora)
```

### Combo escalation logic

A locked-in sequence increments `chainCount`. The HitText fires the tier
returned by `typoTierForCombo(chainCount)`:

- `chainCount = 1` → `base-hit` → "HIT"
- `chainCount = 2` → `combo-2` → "2 CHAIN" (gold gradient)
- `chainCount = 3` → `combo-3` → "3 CHAIN" (bigger gold + pulse)
- `chainCount = 4` → `combo-4` → "4 CHAIN" (brush-stroke)
- `chainCount ≥ 5` → `ultimate-chain` → "FULL CYCLE" + UltimateScreen takeover

Chain count resets after 4 seconds of idle (no successive lock-in). End-of-round
`tide-banner` ("THE TIDE FAVORED WOOD") is a separate tier fired manually for now
(keybind `-`); the round-resolution flow that triggers it canonically is Stage E+.

### DOM-via-portal pattern

drei's `<Html fullscreen>` wraps children in a transformed div which traps
`position: fixed` — fixed elements anchor to the Html portal, not the
viewport. Solution: `LabPortal` calls `createPortal(children, document.body)`.
The Canvas can hold pure r3f content (Stage D+ map content); all DOM UI
lives outside the Canvas via the portal. **Pattern is reusable for any
r3f-lab that needs viewport-anchored DOM overlays.**

## Taste (operator framings honored)

- **"Refining the typography and the animation of typography is the work"**
  → `typography.ts` is the load-bearing module. 6 tiers × style spec ×
  anim spec. Operator tunes tokens, feels the change live via the type-tier
  buttons.
- **"Card actually focused on the art, big on the right side, action on the left"**
  → `CardShowcase` anchors right. Gemini's centered-marquee pushback was
  reversed because our hex playfield sits on the left half.
- **"If we're going no numbers, we shouldn't have damage either"**
  → No damage numbers anywhere. Removed `ballistic.ts` substrate. The text
  moments + chain banners + element-energy flow are the readability spine.
  Pitch-canon honored.
- **"Use the existing card primitive, not bespoke visuals"**
  → `HandRack` uses real `CardHandFan` + `CardFace` + `CardStack`. The
  source of truth is `lib/cards/layers/registry.json`. Mock data only.
- **"Tone down flashy, not so aggressive"**
  → White slap → element-color soft-light pulse at 0.32 opacity. Discard
  `easeInBack` → `easeInCubic` (no pull-back).

## Architectural moves worth highlighting

1. **`lib/choreography/` is framework-agnostic.** Pure TS state + math.
   r3f/DOM consumers drive in `useFrame` / `useEffect` and apply to their
   surface. Same module works in DOM (HitText) AND r3f (future
   character-impact reaction).

2. **Typography tokens as taste-tokens.** Operator can refine the
   typography character (font, stroke, shadow, gradient, brush-stroke
   flag) WITHOUT touching any code path that reads them. Single source
   of truth at `TYPOGRAPHY_TOKENS`.

3. **Two-taxonomy bridge in CardFace.** The harness world (Tsuheji battle-v2
   `CardDefinition`) and the honeycomb world (layer-system `CardType`) are
   different taxonomies. CardFace is the canonical adapter. ANY new
   surface rendering CardFace inherits the bridge automatically.

4. **createPortal escape hatch.** For r3f labs that need DOM overlays,
   the canonical pattern is `createPortal(child, document.body)` — not
   `<Html>`. Saves operator hours of "why is my fixed-position UI in the
   wrong place?"

## Pull-forward to /battle-v2 next

| Item | Where it goes |
|---|---|
| `lib/choreography/typography.ts` token table | Already lib-level — consume from /battle-v2's actual round-resolution flow when wiring real combos |
| `LockInBar` + state machine | Lift to the canonical /battle-v2 page when the in-game lock-in flow is ready; replace setTimeout with MatchEngine-driven phase events |
| `CardShowcase` | Already references CardFace + CardDefinition — drop-in to /battle-v2's real card-play flow |
| `UltimateScreen` overlay | Generic — fires on any 5-chain. Wire to MatchEngine's `ClashResolved` event when the chain count crosses 5. |
| Spring physics tunings | Tune in `SPRING_PRESETS` once we feel them in real animation contexts (CardShowcase entry is the most exposed candidate) |

## What did NOT ship this session

- Real character / target paper-puppet placement in the map area (3D paper
  puppets per `PaperPuppet3D` doctrine — Stage D's deeper polish, but
  scope-capped this session to focus on UI/text)
- `MovementTrail` r3f component (dashed-line drawing across the hex grid —
  `trimPath.ts` substrate ready but no consumer yet)
- `TargetCrumple` wrapper invoking PaperPuppetMotion `crumple` state on impact
- Drag-to-region card play (canonical play mechanic — substrate exists in
  `drag/dragStore.ts`, but unwired in lab)
- Tide-banner trigger from real round-resolution event (currently manual keybind)
- Per-tier brush-stroke font swap (`brushStroke: true` flag on tier tokens
  is set but the actual font swap isn't wired — needs a brush-stroke web
  font picked first)

## Pushback the operator should weigh

- **TypographyPreview button-strip position**: now at top-mid-left
  (top: 96, left: 244) to avoid the right knob pane. If you find it
  collides with anything else, easiest fix: move to bottom-left ABOVE
  the keybind hints, or hide entirely during a lock-in sequence.
- **CardShowcase scale 1.85x of CardFace base**: arbitrary scale to fill
  the showcase box. If it looks blurry → lift `CardFace`'s base dimensions
  via prop (currently hardcoded in battle-v2.css) or use a dedicated
  ShowcaseCardFace primitive.
- **UltimateScreen aurora intensity**: currently 0x33 alpha (light wash).
  If it doesn't read as ULTIMATE enough, push to 0x55. If too much, drop
  to 0x22.
- **Chain timeout 4 seconds**: if the operator wants to demo a 5-chain
  ultimate with deliberate pacing, 4 seconds might be too tight. Bump to
  6-8s, or expose as a lab knob.

## References

| Topic | Path |
|---|---|
| This distillation | `grimoires/loa/distillations/session-18-card-choreography-2026-05-17.md` |
| Build doc | `grimoires/loa/specs/enhance-card-to-map-choreography.md` |
| Gemini synthesis | `grimoires/k-hole/research-output/gemini-stardust-card-choreography-2026-05-17.md` |
| Dig findings | `grimoires/k-hole/research-output/dig-session-2026-05-17.md` |
| Choreography substrate | `lib/choreography/` (6 files) |
| Cardjuice components | `app/battle-v2/_components/cardjuice/` (8 files) |
| Adjacent bug fixes | `lib/runtime/runtime.ts` + `CardFace.tsx` + `ClashArena.tsx` + `drag/{dragStore,DragGhost}.tsx` + `HexScene.tsx` + `types/js-yaml.d.ts` |
