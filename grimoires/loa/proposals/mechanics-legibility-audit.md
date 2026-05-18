---
status: draft-r0
type: audit
author: claude (Opus 4.7 1M)
created: 2026-05-12
cycle: battle-foundations-2026-05-12 (post-PR addendum)
discovery_context: operator played /battle, reported "1 card got marked, the other didn't, both survived" — Caretaker A Shield firing invisibly
---

# Mechanics Legibility Audit — `/battle`

## The pattern

When porting world-purupuru → compass, the **substrate** (state machine + math) and the **legibility layer** (UI indicators that surface what the substrate is doing) are two separate ports. We ported the substrate first because it has tests; legibility is the harder, fuzzier work that only reveals itself when a human plays.

**The diagnostic question for each mechanic:**

> Can the player see this firing? Can the *builder* see this firing? If neither, it's invisible — and an invisible mechanic might as well not exist.

This audit catalogs every active mechanic in the substrate vs whether the UI exposes it. Reported live on 2026-05-12 after the operator's playtest surfaced 3 layered bugs (all UI / legibility, all substrate-correct).

## The triage matrix

For every mechanic, we classify:

| Tier | Meaning | Action |
|---|---|---|
| 🟢 SURFACED | Player can see it firing during play | Keep |
| 🟡 SEMI-SURFACED | Logic exists in DOM but no visual treatment, OR visual treatment only for the BUILDER not the player | Decide if it deserves player-facing affordance |
| 🔴 INVISIBLE | Mechanic fires but neither builder nor player can see it without console logs | Build a dev-panel inspector AND decide player surface |
| ⚪️ DEFERRED | Real implementation lives in future cycle | Document and skip |

## The mechanics × legibility table

| # | Mechanic | Substrate location | Tier | Player surface | Builder surface | Notes |
|---|---|---|---|---|---|---|
| 1 | Wuxing Shēng (generates) | `wuxing.ts getInteraction` | 🟡 | Spark VFX at clash (golden-hold) | None during arrange | The spark fires but it's too brief; player can't reason about why a clash went a certain way |
| 2 | Wuxing Kè (overcomes) | `wuxing.ts getInteraction` | 🟡 | Spark VFX | None | Same |
| 3 | Type Power (jani 1.25 / caretaker_a 1.0 / caretaker_b 1.05) | `cards.ts TYPE_POWER` | 🔴 | None — card faces show no power number | None | Player has no way to know jani hits harder |
| 4 | Weather Blessing (+15% matching today's element) | `combos.ts detectWeatherBlessing` | 🟡 | `.turn-match` `+` glyph on matching cards (but in BattleHand, not on opponent) | CombosPanel (legacy, not currently mounted in production UI) | Indicator exists but no multiplier shown |
| 5 | Setup Strike (caretaker → same-element jani, +30%) | `combos.ts detectSetupStrikes` | 🔴 | None | None | World-purupuru shows `.setup-strike-target` class + arrow visual; we have neither |
| 6 | Shēng Chain (+10/15/18/20% per link) | `combos.ts detectShengChain` | 🟡 | First-time toast (✓) | None | After first discovery, no per-card chip and no chain-link visual between cards |
| 7 | Elemental Surge (5-same +25%) | `combos.ts detectElementalSurge` | 🟡 | First-time toast (✓) | None | Same |
| 8 | Per-position combo multiplier (`comboSummary.perCard`) | `combos.ts getPositionMultiplier` | 🔴 | None — cards never show their personal `+X%` | None | This is the biggest "I can't see the puzzle" gap. Balatro lives or dies on this. |
| 9 | Condition: Wood Growing (positional [0.8, 0.9, 1.0, 1.2, 1.4]) | `conditions.ts` | 🔴 | None | None | Player can't see that "the last position hits hardest today" |
| 10 | Condition: Fire Volatile ([1.3, 1.15, 1.0, 0.85, 0.7]) | `conditions.ts` | 🔴 | None | None | Same |
| 11 | Condition: Earth Steady ([0.8, 1.0, 1.3, 1.0, 0.8]) | `conditions.ts` | 🔴 | None | None | Same |
| 12 | Condition: Metal Precise (doubles largest shift) | `conditions.ts` | 🔴 | None | None | "Why did that one clash matter so much?" — invisible. |
| 13 | Condition: Water Tidal (×1.3 all shifts) | `conditions.ts` | 🔴 | None | None | Same |
| 14 | Today's Tide (daily meta strip on EntryScreen) | `daily-meta.ts` | 🟢 | "THE TIDE TURNED OVERNIGHT · 木 weather · Nemu's challenge · steady" pill | Same | Just shipped. Condition name *is* there but its EFFECT is still hidden. |
| 15 | Caretaker A Shield (surviving caretaker_a saves adjacent ally) | `match.live.ts computeDyingAndShields` | 🟢 | `.shield-burst` glyph + honey outline pulse (just shipped) | Same | Closed the legibility bug from the playtest. |
| 16 | Caretaker B Adapt (round 2+ becomes weather element) | `clash.live.ts resolveClash` | 🔴 | None | None | World-purupuru has `adaptedPositions` derived state. Round 2 starts and your caretaker_b is silently a different element. |
| 17 | Garden Grace (Wood transcendence preserves chain bonus on survival) | `clash.live.ts` | 🔴 | None | None | A whole transcendence mechanic, completely silent. |
| 18 | Forge auto-counter (Metal transcendence becomes overcomes-opponent) | `clash.live.ts applyTranscendence` | 🔴 | None | None | Same |
| 19 | Void mirror (Water transcendence mirrors opponent power) | `clash.live.ts applyTranscendence` | 🔴 | None | None | Same |
| 20 | Numbers-advantage tiebreak | `clash.live.ts applyNumbersTiebreak` | 🔴 | None | None | "Why did the smaller side lose the tie?" |
| 21 | R3 transcendence tiebreak immunity | `clash.live.ts` | 🔴 | None | None | Same |
| 22 | Chain bonus across rounds | `match.live.ts runRound chainBonusAtRoundStart` | 🔴 | None | None | Round 2 starts with a bonus you can't see |
| 23 | Tide drift (clash-win delta drives `--tide-n`) | `match.live.ts → BattleField` | 🟡 | Map shifts subtly | Same | Very subtle. Probably fine. |
| 24 | Whisper system | `whispers.ts` + `runRound` | 🟢 | Speaker bubble | Same | Working. |
| 25 | Companion record | `companion.ts` | 🟢 | "Kaori has been with you for 7 battles" on EntryScreen | Same | Just shipped. |
| 26 | Combo discovery ledger | `discovery.ts` | 🟢 | First-time toast | Same | Just shipped. |
| 27 | Clash VFX category (steam/roots/sparks/melt/etc.) | `clash.live.ts vfxFor` | 🔴 | None — only the generic `.spark` fires | None | Per-element clash signature absent |
| 28 | Visible clash sequence reveal | `match.live.ts runRound` | 🟢 | approach → impact → settle anim | Same | Working. |

**Summary**: 28 mechanics in substrate · **7 🟢 surfaced** · **5 🟡 semi-surfaced** · **15 🔴 invisible** · **1 ⚪️ deferred**.

54% of game mechanics are invisible at play time.

## What's invisible to the BUILDER (you)

These are the gaps the operator named in chat:

1. **No live mechanics readout.** As you play, there's no "what just happened" surface. You can't see Setup Strike fire, you can't see Caretaker B Adapt change a card's element. You learn the game's depth by writing the substrate — but the running game doesn't tell you.
2. **No way to scrub a clash.** The dev panel has `dev:force-phase` and `dev:inject-snapshot` now, but no "step the clash sequence one tick at a time" affordance.
3. **No legend.** Every mechanic that has a visual treatment (shield-burst, floor-pulse, stamps) lacks an inline explanation. New eyes can't tell what they're looking at.

## Visual glitches observed during the audit

Reported live on 2026-05-12 via agent-browser sweep:

| ID | Where | What | Severity |
|---|---|---|---|
| VG-1 | EntryScreen (tall viewport) | Big empty vertical gap between wordmark and Today's Tide pill. Layout doesn't fill the column gracefully. | medium |
| VG-2 | EntryScreen | First-time `Five cards, five clashes` Guide tutorial overlay competes with the actual entry CTA. New user doesn't know where to look. | high |
| VG-3 | EntryScreen + ElementQuiz | Floating `N` caretaker chip bottom-left has no label / affordance. Mystery affordance. | low |
| VG-4 | EntryScreen + everywhere | Dev panel toggle visible without `?dev=1`. NODE_ENV gates the panel CONTENT but the floating toggle button itself ships. | medium (bleeds dev-affordance into prod-shaped views) |
| VG-5 | Arrange phase | Player hand fan visible but no `+X%` badges on cards. Player can't see which card hits hardest. | high (game design — the puzzle is invisible) |
| VG-6 | Arrange phase | No condition label ("Steady", "Volatile") explaining today's battlefield. | high |
| VG-7 | Arrange phase | No chain-link visual between Shēng-chained cards. World-purupuru has a honey thread. | medium |
| VG-8 | Arrange phase | No Setup Strike arrow / pairing indicator. | medium |
| VG-9 | Clash phase | clash-orb at the impact point is missing. The center of the clash zone has a faint warm bloom but no orb. | medium |
| VG-10 | Clash phase | No element-specific clash particles (fire embers / earth rings / wood roots / metal slash / water wave). World-purupuru has all 5; we have only generic spark. | medium |
| VG-11 | Clash phase | weather-watermark (ghost kanji behind clash-zone) absent. | low |
| VG-12 | Result phase | "0W · 0L · 0D" record is showing — `record` prop isn't wired to the live `companion.totalMatches` derived from `loadCompanion()`. | medium |
| VG-13 | All phases | `prefers-color-scheme: dark` not exercised; `[data-theme='old-horai']` rules exist in CSS but no theme-switch UI. | low |
| VG-14 | All phases | Caretaker chibis (`N` icon) appear with no greeting / no transition. | low |
| VG-15 | Between-rounds | No "rearrange" affordance hint. Player doesn't know they CAN reorder survivors. | medium |

## Recommendations (triage of triage)

### Highest leverage (do next cycle)

1. **MechanicsInspector dev pane** — building this in-session. A live readout of every active substrate state in human language. Builder always sees what's firing. **This is what closes the meta-gap the operator named in chat.**
2. **Per-card combo multiplier badge** (VG-5, mechanic #8) — single biggest player-facing legibility win. Balatro's core hook. Shows arrange = puzzle.
3. **Condition label + position-scale strip** (VG-6, mechanics 9-13) — the battlefield's rules made visible.
4. **Caretaker B Adapt visual** (mechanic #16) — a small element-overlay glyph on the card in round 2+.

### Medium

5. **Chain-link visual between Shēng-chained cards** (VG-7, mechanic 6)
6. **Setup Strike arrow / pairing badge** (VG-8, mechanic 5)
7. **Per-element clash VFX** (VG-10, mechanic 27)
8. **Dev panel toggle NODE_ENV gate** (VG-4)

### Polish

9. **Tutorial overlay timing / layering** (VG-2)
10. **Empty-space layout fix on EntryScreen** (VG-1)
11. **Result record wiring to companion** (VG-12)
12. **clash-orb + weather-watermark** (VG-9, VG-11)

## The doctrine

> **For every mechanic in the substrate, ship at least one of:**
> 1. A player-facing visual indicator, OR
> 2. A dev-panel readout line in the MechanicsInspector
>
> **If you ship neither, the mechanic doesn't exist in the game's design — it only exists in the math.**

This is the rule we should apply to every future port from world-purupuru. The substrate is the math; the legibility layer is the GAME.

## What I'm building now

Single-session pass:

- **MechanicsInspector.tsx** (dev pane) — closes the builder gap immediately
- **Per-card combo multiplier badge** (game UI) — closes the highest-impact player gap

Other items become tracked work for follow-on cycles. The doctrine above (`for every mechanic, ship a surface`) becomes the rule we apply to each.
