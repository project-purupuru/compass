---
status: distillation (session-close)
type: lessons learned + pack-state + what-next for the operator's next session
session_arc: kickoff → goal → layer primitive → audit-feel → mechanical FEEL → asset prompts v1 → UI prompts v2 → MINT v3 → image #1 + #2 feedback → pack sync + this distillation
date: 2026-05-12
authors:
  - operator (zerker / zksoju)
  - claude (Opus 4.7 1M)
companions:
  - ui-mockup-prompts-2026-05-12.md (the active prompts doc)
  - image-prompts-2026-05-12.md (deprecated v1 asset-gen prompts)
  - audit-feel-verdict-2026-05-12.md
  - kickoff-next-session-2026-05-12.md
goal: ensure the next agent inherits these lessons cold-reading the project
---

# Distillation — what this session taught us

> "Distill upstream what we learned here. The main thing is probably properly installing those constructs into this repo so that we have them here and we can continue to iterate on these prompts so that we can get closer to the design that we want." — operator, 2026-05-12

## §1 · Pack state — what is installed, what was synced

Construct packs are **symlinks** from `.claude/constructs/packs/<pack>` → `~/.loa/constructs/packs/<pack>`. The global store is the source of truth. To update a pack:

```bash
cd ~/.loa/constructs/packs/<pack> && git pull
```

Pack-by-pack state after this session:

| Pack | Installed via | Synced this session | Notable updates pulled |
|---|---|---|---|
| **the-mint** | git clone | ✅ pulled | `skills/prompting-images/{SKILL.md, index.yaml}` — the four-block Images 2.0 discipline that was MISSING locally and is the headline learning of this session |
| **k-hole** | git clone | already current | — |
| **the-easel** | git clone | ✅ pulled | `grounding-creative` + `recording-taste` skill updates |
| **rosenzu** | git clone | ✅ pulled | `mapping-topology` + `naming-rooms` skill updates |
| **artisan** | tarball (no .git) | ⚠ couldn't pull | Need re-install via `/constructs` to get latest. Worked fine this session via cached snapshot. |
| **observer** | tarball (no .git) | ⚠ couldn't pull | Same situation as artisan. Worked fine via snapshot. |

**Action for the next operator session:** run `/constructs` and re-install **artisan** + **observer** so they're git-tracked. Once on git, future sessions just `git pull` to stay current.

## §2 · The v1 → v2 → v3 prompt evolution — three rounds of lesson-learning

This session shipped THREE versions of the lock-screen prompts. Each version was wrong in a specific way; the corrections are reusable across the rest of the prompt set.

### v1 — asset-generation prompts (deprecated, `image-prompts-2026-05-12.md`)

**Shape:** five sections, each asking ChatGPT image to generate a finished asset (caretaker portrait, scene background, etc.).

**Operator verdict:** "I don't need the actual portrait or images. It's more so to visualize how this could look, and then I can pass it over to you as the agent."

**Lesson:** asset generation ≠ UI exploration. Gumi paints the real art; the prompt artifacts should produce **layout concepts to taste-test**, not **finished assets to ship**. The operator wanted DECISIONS, not DELIVERABLES.

### v2 — UI mockup 2×2 grid prompts (`ui-mockup-prompts-2026-05-12.md` §2.1 v2)

**Shape:** six prompts, each requesting a 2×2 grid of "concept-art mockup tiles." Vertical 9:16 portrait.

**Operator verdict (after generating Image #1):** "Overall it feels too stylized like a portrait rather than a game. We should split each prompt so there's focused attention possibly. I really want to make it a horizontal app."

**Three lessons distilled into v3:**

1. **Aspect ratio matters as a category signal.** Vertical 9:16 ⇒ poster framing. Horizontal 16:9 ⇒ desktop screen framing. The model picks up aspect as a STRONG semantic cue about what category of output is wanted.

2. **2×2 grid trick harmonizes variants.** ChatGPT image renders all four tiles as one composition with shared lighting and palette. Variants are LESS different than they look on paper. One prompt per variant gives each the model's full attention.

3. **"Concept art" framing reads as "poster."** This is the #1 latent-space miss. Reframing as "in-app screenshot of a desktop card game running in a browser window" is a CATEGORY shift, not a tone shift. Different output basin.

### v3 — split horizontal in-app-screenshot prompts (`ui-mockup-prompts-2026-05-12.md` §2.1 v3 + the MINT discipline)

**Shape:** four individual prompts. 16:9 horizontal. "In-app screenshot" reframe.

**Operator verdict after generating Image #2:** "It's not something you would typically see in a mobile game like Hearthstone or these indie games that I shared. I feel like, in that sense, it needs to be refined further."

**This was the SECOND round of MINT-discipline failure** — see §3. Then I read THE MINT pack's `prompting-images` SKILL.md and shipped v3-MINT.

### v3-MINT — properly disciplined prompts (current state)

**Shape:** one fully-rewritten variant (§2.1.A-MINT). Four-block structure (`IMPORTANT DETAILS` / `REFERENCE GUIDANCE` / `USE CASE` / `CONSTRAINTS`), named treatments, OKLCH values, single-stamp discipline, composite-vs-generate honored, sanitization applied, correct 1536×1024 size.

**Status:** B/C/D variants still need MINT rewrite. Operator has NOT yet generated against v3-MINT, only the §2.1.A v3 (pre-MINT-discipline) prompt that produced Image #2.

## §3 · The MINT pack's prompting-images discipline — the headline learning

THE MINT's `prompting-images` SKILL.md ([upstream](https://github.com/0xHoneyJar/construct-the-mint)) codifies the discipline I should have loaded BEFORE writing v1. The ten rules I violated:

1. **Four-block structure** as literal section headers: `IMPORTANT DETAILS / REFERENCE GUIDANCE / USE CASE / CONSTRAINTS`
2. **Named treatments** with `TREATMENT NAME: description` bullets
3. **OKLCH values** per region, not color names
4. **Single-stamp discipline** — one accent locus per scene, named explicitly with exclusions
5. **`gpt-image-1` hard size limits**: 1024² / 1024×1536 / **1536×1024** (no wider landscape)
6. **Composite-vs-Generate rule** — NEVER ask the model to render wordmark text / logos / readable signage; render BLANK SURFACES and composite locally via `rsvg-convert + magick`
7. **Sanitization** — strike named creators/franchises ("Studio Ghibli", "Spiritfarer") and replace with material descriptors
8. **REFERENCE GUIDANCE** block with per-image roles (composition / style / palette / edit target)
9. **Tight per-element negatives** in CONSTRAINTS — not loose allow-lists that contradict
10. **USE CASE** block declaring landing surface + aspect + crop intent

The doctrine framing that lands:

> v2/v3 prompts read like a **director's brief to an illustrator** — vivid, narrative, atmospheric.
> THE MINT writes prompts like a **manufacturing spec to a CNC machine** — structured, numerical, with named treatments and hard negatives.
> Different artifacts for different machines.

## §4 · East-Asian UI craft patterns surfaced via dig — apply throughout

From the depth-2 `dig-search.ts` run on wuxing/East-Asian game UI (18 sources, 248s), five patterns Purupuru should treat as native UI vocabulary, not decoration:

1. **Pomo (破墨, broken ink)** — UI transition technique. Wet-on-wet ink bleeding **replaces Gaussian blur**. Period-correct vocabulary for screen transitions (lock → quiz → arrange → clash → result).

2. **Yinzhang (印章, cinnabar seal)** — replaces the Western "checkbox / confirm" UI primitive with the act of stamping a red cinnabar seal. The lock-screen CTA is a hanko press, not a rectangle button.

3. **Liubai (留白, white space as medium of flow)** — Sky: Children of the Light's discipline. White space is NOT emptiness but the surface ritual moves across. Symbolic rituals (light a candle, place a stone) replace text labels.

4. **Jianjia Jiegou (间架结构, calligraphic frame-structure)** — the architectural logic of how a kanji internally balances (the nine palaces / 九宫格) maps directly to **modular UI grid systems**. The 5-element battlefield wants this discipline.

5. **Sheng/Ke as functional UI state, not skin** — Amazing Cultivation Simulator + Sifu treat the wuxing generative/destructive cycles as ACTUAL ENGINEERING substrate for UI state machines. Color shifts, transitions, pulse-rates should be driven by Sheng/Ke events, not abstract animation.

The next-cycle question is whether Purupuru's UI should adopt these as **NAMED PRIMITIVES** in `lib/cards/layers/` (e.g., a `pomo-transition` mask class, a `yinzhang-button` component, a `jianjia-grid` layout primitive). My recommendation: yes, but as **second-cycle work** after the visual direction is locked.

## §5 · The unresolved gap — Hearthstone-tier vs concept-art-tier

Operator's standing critique after BOTH image generations: "Not something you would typically see in a mobile game like Hearthstone or these indie games I shared."

The MINT v3 prompt (and Image #2) successfully produced **game concept art**. It did NOT produce **game UI**. The gap:

| Game UI (Hearthstone-tier) | Game concept art (current) |
|---|---|
| Persistent HUD chrome on all 4 screen edges (top bar, settings cog, account chip, notification badges) | Scene fills most of frame; UI is 3-5 small diegetic objects |
| Visible hit-state affordances — hover highlights, button glow, cursor position | No interactive states shown — single static frame |
| Resource readouts as pips/bars (mana gems, HP counters, deck count, tide-meter) | Status implied via lit-stone glow, not displayed as numerical readouts |
| Action queue / turn indicator | Absent |
| Inventory + deck slot icons | Absent |
| Notification badges (new mail, new card unlock, friend online) | Absent |

The **next refinement** for v4 is layering Hearthstone-tier chrome ONTO the painted Gumi aesthetic. Painted parchment HUD panels with painted icons. Hand-lettered HP numerals. Cinnabar-stamp button hovers. Diegetic-but-prominent.

**Suggested v4 IMPORTANT DETAILS addition:**

```
  PERSISTENT HUD CHROME (occupies the 4 screen edges, painted into
  the world but unmistakably functional):
    - TOP-LEFT CORNER: a small carved-wood account-chip showing the
      player's caretaker companion (placeholder sprite ok), with
      a small painted name-tag below
    - TOP-RIGHT CORNER: a small painted bronze wind-chime hanging
      from the pavilion eave — this is the "settings" affordance
      (no gear-icon, just an interactive wind-chime)
    - BOTTOM-LEFT CORNER: a stack of 3 painted small stones (deck
      count indicator) and a small ink-line "tide meter" showing
      W-L-D record as horizontal stroke counts
    - BOTTOM-RIGHT CORNER: a small carved bell with a frayed cord
      — this is the "notifications" affordance, with a hand-painted
      red dot above the bell if there's something pending
  None of these are "icons" — they are PAINTED OBJECTS that READ as
  functional. Hearthstone's bronze-and-gold-leaf carving discipline
  applied in Gumi's soft-painted Tsuheji idiom.

  HIT-STATE AFFORDANCES:
    - The play-lantern has a subtle outer glow that intensifies on
      hover (paint two states or show one slightly mid-hover)
    - The active wuxing stone has a faint mouse-cursor hint above
      it (a hand-painted small cursor mark — not a system cursor)
    - The settings wind-chime has a thin moving line suggesting it's
      animated (it sways)
```

## §6 · What the next agent inherits

Reading this doc + the pack state, the next agent picking up should:

1. **Run `/constructs`** and re-install **artisan** + **observer** via git so they sync going forward
2. **Read THE MINT pack's `prompting-images` SKILL.md** BEFORE writing any image prompt (the discipline is now available locally)
3. **Treat v3-MINT (§2.1.A in the active doc) as the prompt-shape template** — extend the same discipline to §2.1.B/C/D and the other 5 sections (§2.2-§2.6)
4. **Apply the v4 HUD chrome addition** above to push from concept-art-tier toward Hearthstone-tier
5. **Use 16:9 horizontal + 1536×1024 px** as the default; portrait/mobile prompts come later
6. **The single-stamp accent** for the lock screen is today's-wuxing-element OKLCH-vivid value applied to BOTH the active stone AND the play-CTA, nothing else
7. **East-Asian UI patterns (Pomo/Yinzhang/Liubai/Jianjia/Sheng-Ke)** are native vocabulary, not decoration — invoke them by name in prompts

## §7 · What I built in parallel (creative latitude continued)

Already shipped (and surviving across sessions):
- `lib/cards/layers/` — Layer primitive (8 layer kinds, 429-test coverage, registered in `registry.cards.layers`)
- `scripts/cards-audit.ts` + `scripts/assets-list.ts` — manifest validators
- `app/kit/ui-explorer/page.tsx` — operator's mockup tasting page (now 16:9 landscape tiles)
- `audit-feel-verdict-2026-05-12.md` — verdict from manual 3-stage audit-feel chain
- `goal-verification-2026-05-12.md` — kickoff session goal-conditions audit
- `ui-mockup-prompts-2026-05-12.md` — active prompts doc (v1 → v2 → v3 → v3-MINT)
- `app/globals.css` — added `.kanji-lift` utility (Visual Center Lifting per ZCOOL doctrine)

This distillation doc closes the session.

## §8 · /propose-learning candidates (upstream contribution)

Two findings from this session deserve consideration for **upstream contribution** to the the-mint pack:

1. **"In-app screenshot vs concept art" reframe** — could land in `the-mint/skills/prompting-images/SKILL.md` as a documented latent-space-basin distinction (similar to how the SKILL.md already documents the "stylized realism" basin for FAL.ai). Worth a section like `## The Category-Signal — what your prompt's framing tells the model to be`.

2. **East-Asian UI craft vocabulary (Pomo/Yinzhang/Liubai/Jianjia/Sheng-Ke)** — could land as a `materials/east-asian-ui-vocab.md` in the the-mint pack, joining the existing `materials/_style-tokens.md` model-routing table. Reusable across any East-Asian-themed project.

Both would benefit operators downstream. Operator can fire `/propose-learning` if interested.
