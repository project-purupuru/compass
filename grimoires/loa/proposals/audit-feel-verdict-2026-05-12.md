---
status: verdict
type: audit-feel chain output (manual three-stage invocation)
composition: discovery/audit-feel.yaml v2.1.0
stages_executed_inline:
  - stage_1: artisan::decomposing-feel
  - stage_2: artisan::scoring-experience
  - stage_3: observer::analyzing-gaps
target_surfaces:
  - app/battle/_scene/EntryScreen.tsx (+ _styles/EntryScreen.css)
  - app/battle/_scene/ElementQuiz.tsx (+ _styles/ElementQuiz.css)
reference: Slay the Spire (title, character-select, card-played)
canon:
  - grimoires/loa/proposals/kickoff-next-session-2026-05-12.md
  - app/globals.css (token system)
author: claude (Opus 4.7 1M) — manual chain per audit-feel known_limitations
created: 2026-05-12
---

# Audit-Feel Verdict — Lock + Quiz vs Slay the Spire

> Composition's stated execution path: "Manual chaining via three `Skill()` invocations." Runner (compose-run.sh) has tmux backend but cycle-004 doctrine ships the spec, not the runner. Manual chain executed inline.

## Stage 1 — Decomposing FEEL

### EntryScreen (Lock room)

| Axis | Observations |
|---|---|
| **Material** | Tsuheji map ghost (radial mask, opacity 0.18, sepia 0.08, saturate 0.35) · weather-orb soft radial gradient (12-22% opacity by theme) · orb-kanji 15% opacity, translate(-20%, 20%) · wordmark SVG · subtitle uppercase 0.18em tracking · tide pill blurred-glass (`backdrop-filter: blur(8px)`, cloud-base 0.5 bg) · companion line italic dim · wuxing strip 5 glyphs at 18%→85% opacity pulse · tile-btn honey-base + lifted shadow + 25% glow · seed pill blurred-glass mono |
| **Motion** | Entry container 800ms fade · backdrop 1200ms@300ms · wordmark 900ms@400ms · subtitle 600ms@800ms · tide 900ms@1000ms · companion 1100ms@1400ms · wuxing-strip 1800ms@1400ms · per-glyph 4s breathe infinite, 0.8s stagger. **Total intro choreography: 0 → 3.2s.** Tile-btn:active is the only commit interaction. |
| **Rhythm** | Vertical stack: map-behind → wordmark-center → tide → companion → CTA → wuxing-strip → seed. Nothing punches in unison. Weather orb static after fade-in (no pulse, no rotation). |
| **Spacing** | Padded 2xl bottom, lg sides. gap-md between tide/btn/strip. Wuxing strip gap clamp(20px, 6vw, 44px). Seed pill free-floats bottom-right with safe-area-inset. |

### ElementQuiz

| Axis | Observations |
|---|---|
| **Material** | Cards 3/4.2 aspect, cloud-deep border, shadow-card · scene art object-cover at center 30% · scene-tint pastel soft-light 40% · kanji top-right 30% white text-shadow drop, font-card text-lg, inset md · caretaker mural 72% wide, bottom-right -15%/-6% overflow · puruhani 48% wide, bottom-left -12%/-4% overflow · header mono-eyebrow + display title, no underline |
| **Motion** | Quiz fade 300ms · header 700ms · cards card-enter (translateY 12→0) staggered 70ms × i · hover scale 1.04 + mural lift · active scaleY(0.94) scaleX(1.02) · **chosen scaleY(1.01) scaleX(1.04) + honey border + 16px honey-dim glow** · **faded opacity 0.35 + scaleY(0.97) scaleX(0.95)** · tint-flood 600ms post-selection (full-bleed pastel wash) |
| **Rhythm** | Cards enter staggered. Selection delta is small (~+4%/-5% scale between chosen and faded). 600ms commit delay before phase transition. Tint-flood is the strongest moment in the room. |
| **Spacing** | Cards gap 64px desktop, space-xl mobile with 3+2 custom row. 80px padding-bottom to let murals overflow. |

## Stage 2 — Scoring Experience vs Slay the Spire

Reference vocabulary distilled:
- **Status readability** — every state has a discrete, glanceable visual (energy orbs, intent telegraph, debuff icons)
- **Commit moments** — hover-lift → snap → emit pattern; relic pickup has anticipation curve before reveal
- **Rejection clarity** — disabled is dimmed AND desaturated AND tagged ("no" overlay, X glyph, red treatment) — NOT just opacity
- **Action vocabulary** — distinct verbs for distinct moments: peek · hover · lock · fire
- **Modest VFX** — short, snappy, <500ms; never decorative
- **Anchor / grounding** — horizon · foreground · midground · character; never floating

### EntryScreen scoring

| Factor | Score | Notes |
|---|---|---|
| Status indicators | **fail** | Wuxing strip pulses ambiently; weather orb is a glow blob. No "+1 fire bonus" or concrete status read. |
| Commit moment (Play btn) | **partial** | Press-feel exists (scaleY 0.94). Missing: anticipation curve pre-press + aftermath lock state. |
| Anchor / grounding | **partial** | 3 depth planes structurally (z:-1 / z:0 / z:1) but nothing inhabits them. Slay's title has silhouette + smoke + candle flicker. We have layers but no life. |
| Material consistency | **fail** | 4 material languages: paper (map) · plasma (orb) · glass (tide pill) · italic (companion). Slay never code-switches like this. |
| Information hierarchy | **partial** | Bottom-half busy (tide + companion + CTA + strip). Slay's title has 3 things visible at once. |
| Anticipation curve | **fail** | Button is just there. Slay's Continue button breathes faintly while you wait. |

### ElementQuiz scoring

| Factor | Score | Notes |
|---|---|---|
| Card-select commit | **partial** | Glow exists. Snap too gentle (+4% width delta). No "settle into locked" feel. |
| Rejection clarity | **fail** | Just opacity-dim. No desaturate. No reject treatment. SpS unaffordables get red-glow + crossed-out. |
| Material consistency | **partial** | Art is great. Kanji top-right (text-lg) reads as label not glyph. Bottom murals gorgeous. **Top-of-card empty** (operator-flagged). Visual mass bottom-heavy. |
| Action vocabulary | **partial** | hover · active · chosen · faded states exist but deltas too small. SpS uses confident +20-30% / -30% deltas. |
| Tint flood (commit) | **pass** | Pastel wash post-selection is the room's strongest moment. Real SpS moment. |
| Anchor / grounding | **pass** | Caretaker + puruhani overflow bottom corners. Structurally identical to SpS relic-art bleeding past frame. |

## Stage 3 — Observer Cross-Reference (5 friction patterns)

### Pattern #1 — Ambient instead of operative
Both rooms have rich ambient layers (wuxing breathing, map texture, scene-tint wash, pastel underglow). Nothing reads as OPERATIVE ("do this → consequence is that"). Slay is operative-first, ambient-second. Compass is ambient-first, operative-third.

### Pattern #2 — Fade-down instead of reject-out
Both rooms use opacity as primary rejection tool (wuxing inactive 18%, faded cards 35%). Signals "we're politely looking the other way" not "this is rejected right now." SpS uses transformation: desaturate + posterize + red overlay + dim.

### Pattern #3 — Small deltas in commit transforms
Press/select transforms are mathematically small (1-5% scale, single-frame). SpS transforms are loud enough that you SEE the commit even if you blink. Ours read "polished and quiet"; SpS reads "this is happening now."

### Pattern #4 — Wordmark-center, status absent
Center of EntryScreen is the Purupuru wordmark. SpS title-screen center shows last-run state (deck, ascension, character). On load, player has zero information about themselves except "you're playing Purupuru." Companion line exists for returners but is small/italic/dim.

### Pattern #5 — Choice without consequence
ElementQuiz asks "Choose your element" without telling the player what each element MEANS in the game. SpS character-select shows starting deck + starting relic + ascension implication. We show scene + kanji. The choice is unmotivated.

## Verdict (per-room classification)

| Room | Asset gap? | Compositional fix scope | Priority |
|---|---|---|---|
| **EntryScreen (Lock)** | **NO** | (1) Promote wuxing strip from ambient → operative status row · (2) Add anticipation curve to Play button (breathing glow + lean-in) · (3) Reduce bottom-stack density · (4) Consider companion-state-card center on returners | **HIGH** — Lock is first impression, biggest gap from SpS |
| **ElementQuiz** | **NO** | (1) Crank selection deltas (chosen +15-20%; rejected -30% + desaturate 0.7) · (2) Add top-of-card detail · (3) Show element-consequence (3-7 word caption) · (4) Faded → desaturate, not just dim | **HIGH** — selection moment is whole purpose of the room |

### Asset generation decision (drives Step 3)

**Hard NO** to `direct-render` composition this session. Both rooms have sufficient art assets. Step 3 is **SKIPPABLE**. Run `feel-iterate` directly on Step 4a (Lock) + Step 4b (Quiz).

### Sequencing recommendation (drives Step 2 vs Step 4 order)

Layer-primitive port (Pillar 1 / Step 2) is structurally **orthogonal** to the two FEEL passes — EntryScreen and ElementQuiz don't render cards; the port helps CardPetal, BattleHand, OpponentZone downstream. The port and the FEEL passes are independent surfaces.

**Recommended order:** Step 2 (layer port) FIRST — pure substrate work, no operator HITL needed, lands the primitive + tests + 3 callsite replacements cleanly. Then Step 4a + 4b (surgical FEEL passes) which DO need operator HITL.

This unblocks Step 5 (CLI scripts) which depend on the layer registry existing in `lib/cards/layers/`.

## Open questions for the operator

1. **Companion-state-card** in EntryScreen center — promote it or drop it? Either is consistent; sitting between is what reads as "wordmark + small companion line." Picking one is the fix.
2. **Element consequence caption** in ElementQuiz — content TBD. Need 5 short phrases ("water cards flow on Tuesdays" etc.) — operator content.
3. **Rejection treatment** in ElementQuiz — agreed it's not enough, but the operator's brief said FADED not REJECTED. Want full desaturate + scale -10% + posterize? Or softer (desaturate 0.5 + dim 0.3)? Calibration question.

## Provenance & override

- This verdict was authored manually per audit-feel's documented execution path (cycle-004 known_limitations: "Manual chaining via three `Skill()` invocations is the current execution path.").
- Output-reproducibility not guaranteed per SKP-002/004; dispatch is deterministic, verdict varies.
- **Operator may override.** If "no new assets needed" is wrong, re-run audit-feel with corrected scope, OR proceed to `direct-render` for the room that actually needs new art.
