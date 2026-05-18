---
status: draft-r0
type: doctrine
author: claude (Opus 4.7 1M)
created: 2026-05-12
cycle: battle-foundations-2026-05-12 (post-PR /remote-control session)
trigger: operator: "design out the actual juice elements... top 0.00001% indie game dev for balatro, hearthstone"
references: Balatro, Hearthstone Battlegrounds, Neko Atsume, Slay the Spire, Loop Hero
---

# Juice Doctrine — Purupuru

## What juice is

Juice is the layer of feedback, anticipation, weight, and reward that
makes interactions feel *consequential*. It's the difference between a
card that flips and a card that *flips*.

The references unify around one idea:

> **Juice is the moment between cause and effect.**
>
> The substrate is fast — milliseconds. The juice slows the
> *consequential* moments down to honor them, and speeds the
> *trivial* ones up so they don't tax attention.

Balatro's chip-count crawl. Hearthstone's mana-pop. Neko Atsume's
silent footprint trail. Slay the Spire's card-burn arc when you
defeat an enemy. Loop Hero's loot-drop cascade. Every one of those is
a beat the developer chose to make heavy.

## The Purupuru identity

Three references, three sensibilities to inherit:

1. **Hearthstone Battlegrounds** — *tactics, observation*. The clash phase
   is not action. It's spectacle. The player has already committed; now
   they witness. Slow camera, clear narration, no late-input affordances.
2. **Balatro** — *the puzzle is the game*. Numbers count up. Combos are
   named the moment they appear. Hovering a card tells you what it
   would do. The arrange phase is the meditation.
3. **Neko Atsume** — *living world*. The world has its own pulse
   independent of the player. Cards drift. Caretakers gesture. The
   tide breathes whether you're watching or not.

The Purupuru-specific blend:
- Play feels like Balatro (puzzle in arrange)
- Watch feels like Battlegrounds (witness in clash)
- Idle feels like Neko Atsume (the world without you)

## The juice profile registry

`lib/juice/profile.ts` is a typed knob — `default` / `quiet` / `loud`
modes carrying every timing + intensity in the game. Substrate-shaped
seam, same pattern as the VFX vocabulary:

```ts
import { juiceProfile } from "@/lib/juice/profile";
const delay = juiceProfile.cardDealDelayMs(index, total);
```

Caller sites *never* hardcode timings. Tuning the game's feel = editing
profile.ts. Adding a player-facing "Cinematic mode" toggle = setting the
mode on mount. The doctrine for adding new juice values:

1. Pick a name that describes the *moment*, not the implementation
   (`lockInPressMs`, not `buttonDuration`).
2. Add it to all three modes. Quiet should be ≤50%, loud ≥150% of
   default.
3. Read it at the call-site. Never inline.

## What we shipped this iteration

| What | File | Why |
|---|---|---|
| `JuiceProfile` registry + 3 modes | `lib/juice/profile.ts` | The knob |
| `ClashOrb` (impact bloom) | `app/battle/_scene/ClashOrb.tsx` + CSS | The consequence beat |
| `card-deal` cascade (springy entrance) | `BattleHand.css @keyframes card-deal` | First impression of every match |
| Lock-in commitment ritual | `BattleScene.css .tile-btn--lock` + `arena[committed]` rules | The moment of irreversibility |
| Opponent face-down → revealed flip cascade | `BattleScene.css @keyframes opponent-flip` | Witness phase begins |

## The juice ladder — every moment, prioritized

Each row scored by **(impact-on-feel) × (frequency-per-session) ÷ (lines-of-code-to-ship)**.

| # | Moment | Status | Impact | Reach | LOC | Notes |
|---|---|---|---|---|---|---|
| 1 | Card-deal cascade | ✓ this pass | high | every match | 30 | Springy entrance, center-first |
| 2 | Lock-in commitment ritual | ✓ this pass | high | every round | 60 | Press, halo, fan compaction, opponent flip |
| 3 | Clash orb at impact | ✓ this pass | high | every clash | 80 | Bloom that says "something happened" |
| 4 | Per-element clash particles | ✓ already shipped | high | every clash | — | The 5-element vocabulary |
| 5 | Card foil overlay | ✓ already shipped | medium | always | — | Iridescent material |
| 6 | Combo discovery toast | ✓ already shipped | very high | first discovery only | — | Names the puzzle the first time |
| 7 | Caretaker A Shield burst | ✓ already shipped | high | per save | — | The mechanic made legible |
| 8 | Whisper bubble | ✓ already shipped | high | per clash | — | The narrator |
| 9 | Wuxing breathing strip on entry | ✓ already shipped | medium | always | — | Quiet world signal |
| 10 | Today's tide pill on entry | ✓ already shipped | medium | per session | — | Daily meta legibility |
| 11 | Companion identity line | ✓ already shipped | medium | returning players | — | Persistence reward |
| — | **─── above this line is shipped ───** | | | | | |
| 12 | Hover parallax tilt on player cards | 🟡 next | medium | constant | ~40 | Mouse-position drives `--tilt-x/y` CSS vars (no JS); enables foil to feel "real" |
| 13 | Number count-up on combo bonus reveal | 🟡 next | high | per discovery | ~60 | Balatro's chip crawl. ComboBadge ramps from 0% → final pct over 400ms |
| 14 | Setup Strike pairing arrow | 🔴 | medium | per setup | ~40 | Honey arrow from caretaker → jani when paired |
| 15 | Chain-link honey thread | 🔴 | medium | per chain | ~30 | Visible thread between Shēng-chained slots |
| 16 | Weather watermark behind clash-zone | 🔴 | low | always | ~20 | Ghost kanji, 0.05 opacity |
| 17 | Disintegrate dust particles | 🔴 | medium | per death | ~80 | Cards crumble into element-tinted ash |
| 18 | Tutorial overlay → coach mark redesign | 🔴 | medium | first match | ~120 | Replace blocking modal with non-modal coach marks |
| 19 | EntryScreen: empty-space layout fix | 🔴 | low | always | ~20 | Tighter vertical rhythm so wordmark + strip aren't separated by void |
| 20 | Mana/energy crystal animation | ⚪️ deferred | n/a | per turn | n/a | Purupuru doesn't have mana yet. Reserve the slot. |
| 21 | Result: word-by-word headline reveal | 🔴 | high | per match | ~30 | "the · tide · favored · 木" with stagger |
| 22 | Result: caretaker walk-on | 🔴 | very high | per match | ~80 | Winner's caretaker walks into center of result screen |
| 23 | Result: confetti from winner element | 🔴 | high | per win | ~60 | Element-tinted, brief |
| 24 | Pre-clash hush (the 1.4s pause) | 🔴 | medium | per round | ~30 | Currently silent stillness; could breathe the map + bloom the weather kanji |
| 25 | Tide-shift overnight ambient (return splash) | 🔴 | medium | once per day return | ~40 | Surface the daily-meta change as a moment, not just a label |
| 26 | Card hover sound | ⚪️ deferred | medium | constant | (audio pipe) | Need audio infrastructure first |
| 27 | Clash impact sound | ⚪️ deferred | very high | per clash | (audio pipe) | Same |
| 28 | Pack-reveal ceremony | ⚪️ deferred | very high | rare | (Three.js) | Future feature; needs 3D card flip |
| 29 | Transcendence burn ceremony | ⚪️ deferred | very high | rare | (particles + audio) | Sacrifice your collection moment |
| 30 | "VHS / film grain" shader toggle | ⚪️ deferred | low | always | (settings UI) | Balatro-style optional aesthetic |

## The 3 next bites (under 200 LOC each)

If the user asks "what should I build next?" — these in order:

### A. Number count-up on ComboBadge (#13)
The Balatro chip crawl, applied to our combo system. Currently the badge
just renders `+18%`. Make it RAMP from 0% to 18% over 400ms when it
appears. Adds drama to the puzzle reveal. Single component change in
`BattleHand.tsx::ComboBadge` + a useEffect with requestAnimationFrame.

### B. Result: word-by-word headline + caretaker walk-on (#21 + #22)
"the tide favored 木" appears word by word with stagger, then the
winning element's caretaker thumbnail FADES IN AND WALKS to center.
Closes the match with weight. Both sit in `ResultScreen.tsx`.

### C. Hover parallax tilt (#12)
Mouse-position drives CSS variables on `.player-card`. Combined with
the foil overlay, cards feel like physical objects you're tilting.
Pure CSS + 8 lines of mouse-handler in BattleHand. Constant micro-feel
boost.

## The doctrine

> **For every consequential moment in the substrate, ship at least
> one of (a) a juice beat that honors it, (b) a profile entry that
> tunes it, (c) a row in this doctrine flagged 🔴 with a budget.**

This is the same shape as the VFX and legibility doctrines. The pattern
is: substrate names the seam → the typed registry holds the values →
the consumer reads from the registry → adding work means editing the
registry, not the consumer.

## Where to plug in itch.io / external assets

The user mentioned having access to itch.io shaders + UI kits. Three
pluggable seams:

1. **`lib/vfx/` registry** — drop new particle kits alongside
   `clash-particles.ts`. Same shape, same consumer.
2. **`app/battle/_styles/CardFoil.css`** — current is a CSS conic-
   gradient. Swap to a real fragment shader via WebGL canvas overlay
   without changing card markup.
3. **`lib/juice/profile.ts`** — third-party "feel packs" can ship as
   alternate profile presets (e.g. `arcade`, `cinematic`, `vintage`).

## Where this points

The substrate paid off. The legibility layer paid off. The juice layer
will pay off the same way: **typed configs, dumb consumers, growing
registry**.

When a player picks up Purupuru, the juice is what makes them say "this
feels good." When a developer extends Purupuru, the doctrine is what
makes them say "I can ship this in 30 lines."

Both win.
