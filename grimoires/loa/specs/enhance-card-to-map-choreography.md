---
session: 18
date: 2026-05-17
type: kickoff-build-doc
topic: card-to-map-choreography-and-game-juice
status: ready
mode: FEEL (ARTISAN) + iterative juice tuning · BARTH for scope discipline
operator_locked_decisions:
  reference_game: STARDUST (Wish of Witch · KnivStudio) · lineage incl. Balatro / Slay the Spire / Inti Creates
  hand_size: 5 cards
  hand_interaction: drag + 1-5 keybinds for swap/discard · draw pile slot replenishment
  lock_in: both players lock · choreographed playback sequence resolves the round
  primary_focus: combos + how legendary cards INFLUENCE THE MAP + typography craft + small satisfying engagement loop
  card_promote_position: RIGHT-side showcase (operator-locked 2026-05-17 — card IS art, action lives on the left of frame, the card is the showpiece not a label)
  damage_numbers: REMOVED ENTIRELY · pitch canon honored · no numbers anywhere · text moments + element-energy flow carry all feedback
  win_loss_signal: animated flow of element energy + END-OF-ROUND banner in same typography family ("THE TIDE FAVORED WOOD") · refinement focus = TYPOGRAPHY + ANIMATION OF TYPOGRAPHY, not the strings
  full_5_card_wuxing_chain: ultimate-style screen takeover with custom animation before final hit resolves
  character_impact_reaction: use existing PaperPuppetMotion `crumple` state FIRST (already authored, stepped pacing, 3D rotation hinge) · only build new if it falls short
  hit_stop_scope: 0.05s freeze on EVERY hit · DURATION scales with combo tier (0.05s solo, 0.08s 2-chain, 0.12s 3+, frozen-takeover on 5-chain ultimate)
  lab_surface: `/battle-v2/card-lab` (NEW sibling of vfx-lab — scope wider than VFX, hand UI + lock-in + orchestrator)
  paper_puppet_doctrine: LOCKED — characters are 2D billboard sprites · NEVER 3D · see [[paper-puppet-doctrine-locked]]
  win_signal_via_numbers: NO (pitch-canon · "tide favored Wood today" framing)
convergence_target: "/battle-v2/card-lab (new) opens to a single-card playback sequence that lands every load-bearing timing pin from Gemini's STARDUST breakdown — spring-physics card stamp, 0.05s hit-stop, target white-flash, stylized HIT text in screen-space, damage numbers as ballistic VFX (if enabled), 0.3s lock-in pause, staggered keyframes. Tweakpane controls every timing value so the operator can FEEL each pin and adjust. After 3-4 iterations without landing → reset, target was wrong."
depends_on:
  - grimoires/k-hole/research-output/gemini-stardust-card-choreography-2026-05-17.md (Gemini's beat sheet — port specs verbatim)
  - grimoires/k-hole/research-output/dig-session-2026-05-17.md (dig findings — Sakurai hit-stop + Kowalski spring physics + Disney overlapping action)
  - grimoires/loa/context/10-game-pitch.md (game pitch · "feel first · visual first · explanation only if absolutely needed")
  - app/battle-v2/_components/puppet/* (canonical paper-puppet substrate · PaperPuppet3D / PaperPuppetSprite / JaniManifest / SpriteSheetPlane)
  - public/art/{jani,puruhani,characters,stickers}/* (sprite assets)
  - app/battle-v2/_components/vfx/effects/* (substrate from session 17 · LeafSwirl/Mist/Embers/etc + ZoneScene/RealmScene patterns)
  - app/battle-v2/vfx-lab/* (sibling-lab template · 3-pane EffectPicker · PreviewPane · KnobPane)
run_id: TBD-on-session-start
---

# Session 18 — Card-to-Map Choreography · The Juice Track

> Operator pivot toward the card-summon → map-interaction sequence per
> STARDUST: Wish of Witch reference. Card VFX itself is Gumi's domain; we
> are focused on **interaction substrate** + **game-juice typography** +
> **combo visualization**.

## Pre-flight reading (in this order)

| # | Path | Why |
|---|------|-----|
| 1 | `grimoires/k-hole/research-output/gemini-stardust-card-choreography-2026-05-17.md` | The beat sheet — 10 load-bearing directives, exact timing pins, easing curves, what STARDUST gets wrong. Verbatim engineering spec. |
| 2 | `grimoires/k-hole/research-output/dig-session-2026-05-17.md` | Substrate principles — Sakurai hit-stop math, Kowalski spring-physics-over-bezier, Disney overlapping action, AE Trim Paths for movement trails. |
| 3 | `grimoires/loa/context/10-game-pitch.md` | "Feel first · visual first · explanation only if absolutely needed." + "No visible numbers anywhere · you feel who's winning by the animated flow of element energy." — DAMAGE-NUMBERS decision points here. |
| 4 | `app/battle-v2/_components/puppet/PaperPuppet3D.tsx` | r3f billboard sprite renderer · the character impact reaction surface lives here. Walk = 2-frame bg-swap · direction = rotateY hinge / scaleX mirror. |
| 5 | `app/battle-v2/_components/puppet/PaperPuppetMotion.ts` | Motion config schema — `crumpleDuration`, `actionDuration`, `summonDuration`, `framePacing` (stepped vs smooth), `directionFlip.backface` modes. The hit-reaction lives in `state: "crumple"` already. |
| 6 | `app/battle-v2/vfx-lab/page.tsx` | Sibling-lab pattern · 3-pane shape · tweakpane-driven · Effect-Schema configs. Copy structure for `/battle-v2/card-lab`. |

## What this session builds

### NEW route + lab

```
app/battle-v2/card-lab/                       — NEW sandbox surface
  page.tsx                                    — 3-pane (sequence-picker · preview · knob-pane)
  _components/
    SequencePicker.tsx                        — left pane: pick which choreography (single-card / 2-card combo / 5-chain ultimate)
    SequencePreviewPane.tsx                   — center: the playback theatre
    SequenceKnobPane.tsx                      — right: every Gemini timing pin as a knob
```

### NEW substrate (lib/choreography)

```
lib/choreography/
  spring.ts                                   — mass/stiffness/damping solver for UI (Kowalski-spec) — NOT Bezier
  hitStop.ts                                  — global frame-freeze hook · pauses N ms · resumes · DURATION scales with combo tier
  trimPath.ts                                 — dashed-line "draw-in" path animation (AE Trim Paths-equivalent for r3f)
  sequence.ts                                 — keyframe stagger primitive (start time + duration + ease per beat)
  typography.ts                               — type-token table (HIT / CRIT / COMBO / CHAIN / ULTIMATE / TIDE-banner) · entry/hold/exit animation specs · scale-by-tier
```

**Removed from original draft:** `ballistic.ts` (damage-number physics) — operator dropped damage entirely · no numbers anywhere.

### NEW primitives (app/battle-v2/_components/cardjuice/)

```
HandRack.tsx                                  — 5-card hand · hover state · keybind handler (1-5) · drag-to-discard zone
CardShowcase.tsx                              — RIGHT-side card-art showcase (card IS the showpiece) · spring-driven entry (scale 1.5x→1.0x, 0.15s easeOutBack) · stays anchored while map action plays on the LEFT
HitText.tsx                                   — stylized HIT/COMBO/CHAIN overlay · screen-space · heavy stroke · typography is the work
ChainBanner.tsx                               — wuxing chain visualization (Water → Wood CHAIN!) · scales exponentially with chain length
UltimateScreen.tsx                            — full-5-chain takeover · Sunfire-pattern · custom anim before final hit · LEGENDARY card moments
TideBanner.tsx                                — end-of-round outcome banner ("THE TIDE FAVORED WOOD") · same typography family · biggest + slowest
MovementTrail.tsx                             — dashed-line draw-in path (trimPath)
TargetCrumple.tsx                             — thin wrapper invoking PaperPuppetMotion `crumple` state on impact (use existing substrate, don't rebuild)
TargetWhiteFlash.tsx                          — 0.05s solid-white on target sprite at impact
LockInBar.tsx                                 — "lock in" button + state · drops UI with easeInCubic 0.2s
PlaybackOrchestrator.tsx                      — drives the sequence · cards play in order · honors all Gemini timing pins
```

## Operator-locked specs (port verbatim from Gemini)

### Hand interaction (HandRack)

| Action | Spec |
|---|---|
| Hover | translateY -20px · scale 1.15x · 0.1s easeOutQuad · z-promote · shadow 0→40% over 0.15s |
| Keybind fire | flash white 0.05s before move (haptic) |
| Swap (A over B) | B shifts to A's old slot · 0.15s easeOutCubic |
| Discard | scale 0.5x + opacity 0 + translate to discard-pile coord · 0.2s easeInBack |
| Replacement draw | slide in from draw pile · 0.25s easeOutBack (overshoot 110%) |

### Lock-in transition

| Time | Beat |
|---|---|
| 0.00s | UI Y-translates +150px in 0.2s easeInCubic — physical exit |
| 0.20s | Map gets the screen |
| 0.20–0.50s | **THE BREATH** — 0.3s pause before first card fires (palette cleanser) |
| ~0.30s mark | Opponent hand reveal: 0.15s/card flip, staggered 0.1s between cards |

### Per-card playback (canonical timing)

| Time | Beat | Spec |
|---|---|---|
| 0.00s | Sequence start · UI drops (easeInCubic 0.2s) | — |
| 0.30s | Caster anticipation · cast frame · charge VFX | 0.2s fade-in + scale 0.5→1.0 |
| 0.50s | Projectile travel (if applicable) | easeInQuad · 0.3s cap regardless of distance |
| 0.80s | **IMPACT — THE HIT-STOP MOMENT** | 3-frame (~0.05s) global freeze · target white-flash 0.05s · target hurt-frame + knockback nudge 0.1s easeOutCubic + return 0.2s easeInOutSine |
| 0.85s | UI/data payout simultaneous | CardStamp 1.5x→1.0x in 0.15s easeOutBack · HitText + DamageBurst at same frame |
| 1.50s | Settle | Caster/target idle · side card + text fade 0.2s linear |
| 1.70s | Buffer | 0.2s empty beat before next card |

### Typography (screen-space layer)

- **HIT base** — italicized display font · white core · heavy black stroke · theme-color shadow · scale 2.0x→1.0x in 0.1s easeOutQuad · hold ~0.5s · fade
- **CRIT** — same shape, larger, additional red flash burst
- **COMBO/CHAIN** — gold/yellow metallic gradient · distinct from HIT · scales exponentially with chain length
- **ULTIMATE (5-chain)** — brush-stroke takeover · ⅓ screen · freezes map · custom anim · pre-empts final hit

### Damage numbers (DEFERRED — opt-in)

If enabled, world-space ballistic eruption:
- spawn slightly above target · upward burst + random X-velocity (±15°)
- easeOutQuint on Y · hang at peak · fade before drop · ~0.8s lifetime
- thick blocky sans-serif · yellow→red gradient · heavy black outline

### Universal taste tokens (Gemini's 10 directives — port across app)

1. **easeOutBack** for all UI entrances
2. **easeInCubic** for all UI exits
3. **3-frame (0.05s) global hit-stop** on every impact
4. Spawn text/UI payouts **AT THE EXACT** hit-stop frame (not before / not after)
5. **Heavy black stroke** on all screen-space text (pixel-art noise resistance)
6. **0.3s projectile travel cap**
7. **0.05s white-flash on target** at impact
8. **0.3s lock-in pause** before first card
9. **Separate screen-space and world-space layers** — HitText + CardStamp don't follow camera
10. **No linear easing** except for fades

## What NOT to build (Barth)

- NO new card VFX content (Gumi's domain)
- NO right-side side-screen card stamp (Gemini-flagged: covers hex grid)
- NO 3D character geometry — [[paper-puppet-doctrine-locked]]
- NO damage numbers as default — pitch-canon says no numbers · keep behind opt-in
- NO camera moves this session — operator de-prioritized · Sakurai's 1% punch-in is OPTIONAL
- NO sound design integration — text + visual juice only · audio is a future cycle
- NO ECS-ization of the orchestrator — single useFrame is fine at session-scale
- NO wuxing chain MATH this session — visual choreography only · math is downstream

## Stage-by-stage (iterative pacing)

### Stage A — Substrate sketch (~40 min)
Write `lib/choreography/{spring,hitStop,ballistic,trimPath,sequence}.ts`. No UI yet — pure math + hooks. Verify with vitest if quick.

### Stage B — Hand rack (~50 min)
`HandRack.tsx` with mock 5-card hand · hover state · keybind 1-5 discard · draw-pile slide-in. Mount in `/battle-v2/card-lab` left section. Knobs for every timing pin.

### Stage C — Lock-in transition (~30 min)
`LockInBar.tsx` button. Click → UI drops · 0.3s breath · console.log("ready"). Confirms the breath FEELS right.

### Stage D — Single-card playback (~75 min)
`PlaybackOrchestrator.tsx` + `CardStamp.tsx` + `HitText.tsx` + `TargetWhiteFlash.tsx` + `MovementTrail.tsx`. Hard-code one card ("Blaze Finger" stand-in). Fire on lock-in. Tune every timing pin in tweakpane until the operator confirms "yes, that feels like STARDUST." OPERATOR PAIR-POINT.

### Stage E — Combo + chain banner (~45 min)
`ChainBanner.tsx` + multi-card sequencing. 2-card → "2 CHAIN" gold metallic text. 3-card → bigger. Hook into wuxing element transitions (water→wood etc).

### Stage F — Ultimate screen takeover (~30 min)
`UltimateScreen.tsx` · 5-chain triggers screen-takeover · custom anim placeholder · resolves into final hit.

### Stage G — Distill (~30 min)
`grimoires/loa/distillations/session-18-card-choreography-2026-05-17.md`. Separate substrate/application/taste. Note which timings landed feeling RIGHT vs which still feel off.

## Design rules (Alexander)

- **Spring physics, never Bezier** for UI motion · the curve carries the FEEL
- **Stagger every keyframe** by 2-3 frames · simultaneous = robotic · Disney overlapping action
- **Map idle, cards inject impact** · per [[project_battle-v2-zone-composition]] · no ambient world motion during the choreographed sequence
- **Card stamps to lower-third centered**, not side-screen · hex grid is sacred space
- **Text is VFX, not data** · the text moment IS the climax · scale the visual weight with combo tier

## Verify

When `/battle-v2/card-lab` is open and the operator plays a single-card sequence:

- 5-card hand reads at bottom · hover lifts smoothly with overshoot · keybind 1-5 discards instantly with white flash
- Lock-in button drops the UI in 0.2s · 0.3s breath BEFORE anything fires · feels intentional
- Card promotes to centered lower-third marquee position · spring-physics overshoot
- Movement trail draws in (dashed line progressive) · doesn't pop
- Character reaches target · 0.05s freeze · white-flash on target · knockback nudge · returns
- HIT text crashes in at the same frame as hit-stop · heavy stroked · readable
- Settle in ~1.5s total · 0.2s buffer before next card
- Combo demo: fire 2 cards in sequence · "2 CHAIN" gold metallic text on second hit
- Full 5-chain demo: ULTIMATE screen takeover replaces normal beats for final card

## Open forks — RESOLVED (operator 2026-05-17)

1. **Character impact reaction** → use existing `PaperPuppetMotion.crumple` state first. Build new only if it falls short.
2. **Damage numbers** → REMOVED ENTIRELY. Pitch-canon honored. No numbers anywhere. Combo + tide-banner + element-energy carry all feedback.
3. **Hit-stop** → 0.05s freeze on EVERY hit; DURATION scales with combo tier (solo 0.05s · 2-chain 0.08s · 3+ chain 0.12s · 5-chain full freeze + ultimate takeover).
4. **End-of-round banner** → SHIP IT. "THE TIDE FAVORED WOOD" pattern in same typography family. Biggest + slowest. The work here is **refining the typography and the animation of typography**, not the strings.
5. **Lab surface** → `/battle-v2/card-lab` (NEW sibling of vfx-lab).

## The center of gravity (operator framing 2026-05-17)

> "Focus on the combos and how those combos and legendary cards actually influence the map, focusing on the art and just the satisfaction from the interactions, as well as just enjoying the whole small feedback loop or engagement loop, very simple."

**The work is in three places:**

1. **Typography craft** — type tokens, easing curves, scale-by-tier. The text moments ARE the game-juice climax; refining how they LOOK and how they ANIMATE is the load-bearing taste decision. Author `lib/choreography/typography.ts` as a TASTE-TOKEN module the whole app can read.
2. **Combo → map influence** — when 2+ cards combo, *something happens on the map* beyond the text overlay. The 5-chain ultimate is the canonical case (Sunfire-style screen takeover). Mid-tier combos (2-3 chain) should also visibly influence the map — element-energy flow, glow pulses, terrain hex reaction.
3. **Card-as-art showcase** — RIGHT-side card promote in 1.5x scale with spring physics. The card IS the showpiece. Visual hierarchy: card (right, big) > action on map (left) > text overlay (centered above action).

## Pushback invitation

- If the 0.3s "breath" feels too slow to playtesters — drop to 0.2s
- If the card-stamp scale feels too aggressive at 1.5x→1.0x — try 1.3x→1.0x with same easing
- If keybinds 1-5 conflict with anything → operator picks alternate (Q-W-E-R-T?)
- If the Gemini-spec'd right-side stamp turns out to read fine on our hex layout — REVERSE the centered-marquee decision (but defer until visual evidence)

## References

| Topic | Path |
|---|---|
| This build doc | `grimoires/loa/specs/enhance-card-to-map-choreography.md` |
| Gemini beat sheet | `grimoires/k-hole/research-output/gemini-stardust-card-choreography-2026-05-17.md` |
| Dig synthesis | `grimoires/k-hole/research-output/dig-session-2026-05-17.md` |
| Game pitch | `grimoires/loa/context/10-game-pitch.md` |
| Paper-puppet substrate | `app/battle-v2/_components/puppet/` |
| Sprite assets | `public/art/{jani,puruhani,characters,stickers}/` |
| VFX-lab template | `app/battle-v2/vfx-lab/` |
| Paper-puppet doctrine | `memory/feedback_paper-puppet-doctrine-locked.md` |
| Card-summon hybrid | `memory/project_card-summon-hybrid.md` |
| Game-pitch grounding | `memory/feedback_ground-in-the-pitch.md` |
