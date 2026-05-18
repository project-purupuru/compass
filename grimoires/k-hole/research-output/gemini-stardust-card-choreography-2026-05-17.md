---
date: 2026-05-17
source: Gemini (creative-director frame · STARDUST: Wish of Witch + Balatro + Slay the Spire + Inti Creates lineage)
prompt_artifact: /tmp/gemini-prompt-stardust-card-choreography.md
companion_dig: dig-session-2026-05-17.md
status: ready-for-kickoff-fold-in
---

# Gemini synthesis — STARDUST card-to-map choreography breakdown

Operator passed video into Gemini 3 Pro with the operator-grounded prompt at `/tmp/gemini-prompt-stardust-card-choreography.md`. Output below is the response, captured verbatim for traceability before being folded into `grimoires/loa/specs/enhance-card-to-map-choreography.md`.

## Reality caveat (Gemini's own framing)

Video is a sizzle reel of combat executions — NOT a full uncut planning-phase sequence. STARDUST does not explicitly show Slay-the-Spire-style hand swap/discard. Specs below are a BRIDGE: card hover/selection states from the video + standard practices from the referenced studios.

## 1. Card swap + discard interaction (5-card hand)

**Hover state ("draw"):**
- Cursor enters card bounds → translateY -20px + scale 1.15x
- 0.1s · easeOutQuad — fast up, no bounce, precision over jelly
- Promote to top z-index immediately
- Soft drop shadow fades in 0% → 40% over 0.15s for separation

**Selection / swap:**
- Click+drag OR keybind 1-5
- Keybind haptics: card flashes white 0.05s before moving
- Swap mechanics: dragging card A over slot B shifts B to A's old slot
- Shift timing: 0.15s · easeOutCubic — snap out instantly but settle smoothly

**Discard execution:**
- Drag to discard zone OR right-click
- Scale 0.5x + opacity → 0 + translate to discard-pile screen coords
- 0.2s · easeInBack (pulls back slightly before flying)

**Replacement draw:**
- New card slides in from draw pile, doesn't pop
- 0.25s · easeOutBack — slight overshoot before settling in slot

**Gemini's pushback:** Skip ghost trails on hand management — clutter. Reserve trails for map movement.

## 2. Lock-in → playback transition

- **0.00s — commit:** Bottom card UI Y-translates +150px in 0.2s · easeInCubic. Physical movement, not fade.
- **0.20s — map takeover:** Screen yields to grid.
- **0.20s–0.50s — the breath:** ~0.3s pause before first card fires. *Critical.* Tells player "simulation now running."
- **Opponent hand reveal:** card-by-card flip @ 0.15s/card, staggered 0.1s between cards. Right before action fires.

## 3. Per-card playback choreography (Fireball deconstruction, 0:20–0:23)

| Time   | Beat                | Detail                                                    |
|--------|---------------------|-----------------------------------------------------------|
| 0.00s  | Sequence start      | Target confirmed · UI drops (easeInCubic, 0.2s)           |
| 0.30s  | Caster anticipation | Cast frame · magic circle fades-in/scales 0.5→1.0 over 0.2s |
| 0.50s  | Projectile travel   | easeInQuad · cap at 0.3s total travel regardless of distance |
| 0.80s  | **IMPACT**          | 3-frame freeze (~0.05s) · target flashes white 0.05s · hurt frame · knockback nudge 0.1s easeOutCubic · return 0.2s easeInOutSine |
| 0.85s  | UI/data payout      | Card stamps in (1.5x → 1.0x, 0.15s easeOutBack) · HIT text simultaneous · damage numbers spawn |
| 1.50s  | Settle              | Caster/target return to idle · side card + text fade 0.2s linear |
| 1.70s  | Buffer              | 0.2s empty beat before next card                          |

## 4. Big-text typography catalog

**HIT text:**
- Italicized serif/display font · white core · heavy black stroke · theme-color drop shadow (red for fire)
- Screen-space, anchored right-side ABOVE card preview, disconnected from world space
- Stamps in: scale 2.0x → 1.0x over 0.1s easeOutQuad · holds ~0.5s · fades quick

**Damage numbers:**
- Thick blocky sans-serif · yellow→red gradient · heavy black outline
- WORLD-space, spawn slightly above target
- Physics-driven: upward burst + random X-velocity · easeOutQuint on Y (fast burst, hang) · fade before drop · ~0.8s lifetime

**Skill names (Sunfire, 0:27):**
- Massive stylized brush-stroke takes 1/3 screen
- Reserved STRICTLY for ultimate abilities or full-chain combos

## 5. Combo / chain visualization

- "2 Combo" text at 0:12: appears on left/center, gold/yellow metallic gradient, distinct from red/white HIT
- Triggers immediately on second hit landing
- Video shows NO persistent chain meter — text pop-up at impact carries the whole signal
- **Gemini's recommendation for our wuxing:** swap HIT asset for chain-specific overlay (e.g. "WATER → WOOD CHAIN!") · size + hang-time scale exponentially with chain length · full-5 wuxing chain = ultimate-style screen takeover (Sunfire pattern) freezing map for custom animation before final hit resolves

## 6. The 10 load-bearing directives

1. **easeOutBack for all UI entrances** — overshoot 100% → 110% before settling = tactile/physical
2. **easeInCubic for UI exits** — UI leaves faster than it arrived, gets out of way
3. **3-frame (0.05s) global time-freeze on impact** — single most effective way to make 2D sprite hit feel heavy
4. **Spawn text/UI payouts AT THE EXACT frame of hit-stop** — earlier = disconnected, later = laggy
5. **Heavy black stroke on ALL screen-space text** — pixel-art maps are noisy, thin/un-stroked text vanishes
6. **Cap projectile travel times at 0.3s max** — slower = slog by turn 10
7. **Flash target sprites solid white for 0.05s on impact** — guarantees player knows what got hit
8. **Pause 0.3s after lock-in before first card fires** — emotional palette cleanser
9. **Separate screen-space UI from world-space layers** — HIT text + card stamps independent of camera/map transforms
10. **No linear easing except for fade-outs** — linear = robotic; everything else accelerates/decelerates

## 7. STARDUST mistake NOT to copy

The right-side card stamp during every attack covers the board area where enemies cluster. **Wrong shape for hex-grid where spatial awareness is paramount.**

**Gemini's alternative:** lower-third centered "marquee" position during execution phase. Keeps map focus + still acknowledges driving card.

## Gemini's open question to operator

> "Given your paper-puppet aesthetic, have you finalized how the characters will physically react to these impacts (e.g., sprite distortion, physics-driven knockback, or frame-by-frame animation) to complement the UI juice?"

This is a real fork. The three options have very different engineering implications and different aesthetic outcomes.
