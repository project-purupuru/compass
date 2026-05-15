---
title: "Battle-V2 — Game-Model Reconciliation (pitch → evolution)"
status: candidate
mode: arch (OSTROM — name the invariant)
date: 2026-05-14
grounds_in: 10-game-pitch.md (Gumi, canonical-origin)
supersedes_drift: 16-battle-v2-card-drag-to-region.md (the drag-to-region invention)
use_label: usable (operator-confirmed reframe 2026-05-14)
---

# Battle-V2 — Game-Model Reconciliation

> Consolidation of the operator's reframe (2026-05-14), after a push-back pass
> against the canonical pitch. Captures what is **settled** vs what is still
> **open**, so the visual-layer work stops inventing and starts grounding.

## The reframe

The operator: *"the pitch v1 can evolve … I don't think clashing between the
cards is the interaction … but the core underlying game pitch and game
design/systems should remain true. It's more a visual reskin … make the cards
feel alive and actually have an influence in the world … this ties into how the
weather constructs influence the actual game."*

So battle-v2 is **not** a re-skin of the literal clash loop. It is the pitch's
**systems** carried forward onto an **evolved interaction**.

## SETTLED — the invariants (what must stay true)

These are the pitch's load-bearing systems. They survive the evolution:

1. **Wuxing** — 5 elements; Shēng (generative) + Kè (overcoming) cycles. The
   elemental relationships are the substrate of every decision.
2. **Order as puzzle** — the pitch's hook is that *sequence/adjacency creates
   escalating bonus* (Shēng chains). The *form* evolves (see Open Q2), but
   "arrangement is the strategy" stays.
3. **Cosmic weather meta** — the daily 5-element tide, weather-matching boosts,
   per-match conditions. "The tide favored Wood today." This is the dynamic
   force — and it is the seam to the **other constructs** (the Five Oracles:
   TREMOR/CORONA/BREATH). Weather is shared global state; cards act *within* it.
4. **Feel-first, no numbers** — no Victory/Defeat text, no progress bars. You
   *feel* state through element-energy flow + caretaker whispers.
5. **Cards are alive** — they breathe, they have element-personality, they
   evolve toward Puruhani agents.
6. **Burn / resonance / transcendence** — the collection economy is unchanged.

## SETTLED — what evolved

| | Pitch (v1 / honeycomb) | Battle-V2 evolution (cycle-1 / lib/purupuru) |
|---|---|---|
| The interaction | Arrange a lineup vs a hidden opponent; matching positions **clash** card-vs-card; attrition | Cards are played to **influence the living world** — the map, its zones/territories. Not card-vs-card. |
| The battlefield | An abstract 5-slot arena | The **Tsuheji continent** — districts, elemental regions, weather |
| The substrate | `lib/honeycomb` (lineup · clash · rounds) | `lib/purupuru` (zone-activation · resolver · semantic events) — **this IS the evolution, not a deviation** |
| The "win" | One lineup eliminates the other | *open — see Q1* |

**Correction of record:** an earlier pass (brief 16) treated cycle-1's
zone-activation substrate as "not serving the pitch" and invented a
drag-card-onto-Voronoi-territory mechanic. Both were drift. cycle-1's
"cards influence the world" *is* the sanctioned evolution. Brief 16 is
superseded.

## Creative direction (captured 2026-05-14)

The operator's vision for the visual layer — captured as *language*, not yet as
mechanics. The juice/VFX half is the other agent's lane; this is the shared
target battle-v2 reskins *toward*:

- **Yu-Gi-Oh-grade summoning — "movie-type" — but for weather and elements.**
  Playing a card / firing a combo is a *cinematic event*: the world itself
  performs it. Frame of reference: **Sky-eyes embodying the world** — the play
  shown at world-scale, the way the raptor/observer sees it.
- **Combos feel juicy on the map.** The pitch's Shēng chains don't just tick a
  bonus — they *land* on the continent: a visible, weather-scale payoff.
- **Combo state is legible in the hand** — as you order your cards, the forming
  combos are clearly indicated *in hand*, before you commit. (Gated on Q2.)
- **The world is populated and specific** — trains (Musubi Station, the rosenzu
  lines), bears, honey, bees. Tsuheji's actual iconography, not generic fantasy.
- **The weather constructs drive it.** The cosmic-weather meta (Five Oracles) is
  not backdrop — it's the force that makes the same play land differently.

## OPEN — needs operator clarity before the next build

The reframe settles the *frame*. It does not yet settle the *loop*. These are
the genuine unknowns — not invitations to invent:

- **Q1 · Opponent — SETTLED (2026-05-14).** A second player/agent shapes the
  *same* world (not you-vs-weather). The "winner" is read off the shared world's
  state. cycle-1's `GameState` still has **no opponent representation** — that's
  a substrate gap for the other agent, not an open design question.
- **Q2 · Order in hand — SETTLED (2026-05-14), from Gumi's game repo.**
  `~/Documents/GitHub/purupuru-game` — `prototype/src/lib/game/combos.ts` +
  `grimoires/loa/game-design.md` are Gumi's interpretation of the canon, in
  code. **Order in the 5-card lineup IS the puzzle.** Four position-driven
  synergies:
  - **Shēng Chain** — adjacency in the generative cycle (`SHENG[lineup[i]] ===
    lineup[i+1]`). Escalating: Link +10% · Chain +15% · Flow +18% · Full Cycle
    +20%. Transcendence cards bridge (count as any element).
  - **Setup Strike** — Caretaker immediately before same-element Jani: +30% to
    the Jani, and *breaks* the Shēng chain through those positions — the
    deliberate tradeoff.
  - **Elemental Surge** — all 5 cards one element: +25%, exclusive.
  - **Weather Blessing** — weather-matching cards: +15%, non-positional.
  Gumi's design doc is explicit: synergies *"light up in real time as you drag
  cards to reorder,"* with tooltips explaining the Wuxing principle. That **is**
  the operator's "clear indication of combos in your hand." Gate open — the
  logic is canon, not invention. Ported to `lib/cards/synergy/`; demoed at
  `/battle-v2/combo-preview`.

  *Substrate gap (not a design question):* cycle-1's `lib/purupuru` hand has no
  order/lineup/reorder. The synergy logic is ported + isolated; wiring it to the
  real hand needs the substrate to carry a hand order — the other agent's lane.
- **Q3 · What does "influence the world" produce? — operator: explicitly still
  open (2026-05-14):** *"I want the cards to have an effect on the playing field
  and for it to be meaningful to the core engagement loop — I'm not sure yet."*
  cycle-1's resolver does `activate_zone / spawn_event / grant_reward`. Whether
  accumulated influence across the 5 regions decides the tide is a *candidate*,
  not a decision. Do not invent it.
- **Q4 · Turn / match shape.** cycle-1 has `EndTurn` + a `turn` counter but no
  match-end. Is there a match, or is it the pitch's ambient daily-duel ("the
  tide favored Wood") with no hard win screen?

## Status of the drag work

**Paused** (operator). The drag scaffolding built last turn — `drag/dragStore`,
`DragLayer`, `DragGhost`, the `CardFace` pointer-down, the `HudOverlay` mount —
is **left in place, inert** (a pick-up gesture with no drop target wired). It is
loop-agnostic plumbing; whether it's reused or removed depends on Q1–Q4. No
further drag work until there's a pitch-grounded loop spec.

## IMPLEMENTED — the integration (2026-05-14, this cycle)

The clash loop is **live on `/battle-v2`**, driven off the substrate. It does
not wait for `lib/purupuru` to grow a lineup/opponent — Q1 + Q2's "substrate
gaps" are answered by a **parallel clash substrate**, `lib/cards/battle`,
expressed as an Effect service in the honeycomb-substrate pattern.

**Architecture — three layers, cleanly separated:**

| Layer | What | Where |
|---|---|---|
| Clash **truth** | `MatchEngine` — an Effect service. State in a `SubscriptionRef<MatchState>`; the clash-advance *cadence* is an Effect fiber (`Effect.sleep`), not a React timer; the clash trace publishes to a `PubSub<ClashEvent>`. Port/live/Layer, merged into `AppLayer`. | `lib/cards/battle/match-engine.{port,live}.ts` · `match.ts` (pure step fns, no React) · `events.ts` |
| The **seam** | `GameState.zones[].activationLevel`. `BattleV2` subscribes to `MatchEngine.events` (`useClashEvents`) and turns each `ClashResolved` into an `activationLevel` delta — the same channel the world already animates off. Events in, world out. | `BattleV2.tsx` · `lib/runtime/react.ts` |
| The **surface** | `ClashArena` — a pure overlay layer (z-index 20). `useMatch()` reads the engine's state stream; gestures dispatch through the `matchEngine` handle. No game state, no timers. | `app/battle-v2/_components/clash/` |

**The loop, on the surface:** arrange your 5-card lineup (tap-two-to-swap, or
drag) → Lock In → opponent's mirrored hand flips → the engine fiber reveals
each clash on a beat (敗 stamps, the helper band phases the clash narration) →
the world expresses it (player wins pump `wood_grove` → the grove thickens, the
bear colony swarms; opponent wins pump `fire_station` — correct data, not yet
visually wired) → rearrange survivors → … → "the tide favored X" → Play Again.

**Observability:** the clash trace (`RoundLocked · ClashResolved×N ·
RoundConcluded | MatchEnded`) flows through the unified event log in `BattleV2`
alongside `lib/purupuru`'s `SemanticEvent`s — the substrate's events trace.

**Still open (unchanged):**
- **Q3 — the visual legibility of "who won."** The world reacts (activationLevel
  → grove/colony), but the precise read of *which side won* off the world's
  state is the Gumi + team collaboration the operator named. Cycle-1 ships a
  sensible first pass (your wins grow the grove); not a final commitment.
- **Cycle-1 reality:** only the *wood* territory is visually wired. Non-wood
  clash outcomes accrue correct `activationLevel` data; their juice lands as
  those territories get built (`RegionWeather` is element-generic already).
