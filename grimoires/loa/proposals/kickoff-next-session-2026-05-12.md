---
status: ready-for-kickoff
type: kickoff brief + /goal definition
author: claude (Opus 4.7 1M)
created: 2026-05-12
cycle: battle-foundations-2026-05-12 (final commit before context exhaustion)
companions:
  - foundation-vfx-camera-audio-2026-05-12.md
  - registry-doctrine-2026-05-12.md
  - operator-handoff-2026-05-12.md
  - audio-doctrine.md
  - composable-vfx-vocabulary.md
operator_pinned_references:
  reference_north_star: Slay the Spire (deterministic, readable, modest VFX, clear status)
  rooms_priority: [Lock, ElementQuiz, Arena] focus 1+2 first
  layer_scope: full primitive — <Layer> + LayerStack in substrate
  cdn_tool: thin CLI · refer to world-purupuru's prior art before building
  asset_construct: pair with construct-composition for nano-banana/chatgpt image generation as the moodboard → design loop
---

# Kickoff Brief — Next Session: Game-FEEL via Layer Primitive + Room-by-Room Surgical Pass

This brief is the entire previous session's work crystallized for `/kickoff`. The agent picking this up should read it FIRST, then check the file references at the bottom.

---

## The grounded reality

Across 30+ commits this session, the substrate hardened (registry doctrine · MutationGuard · 3 engines + 3 tweakpanes · fagan hardening · camera weight upgrades). But the operator's verdict stands:

> "Each room/phase still falls flat to me but we're getting progressively closer from a substrate layer."

The bottleneck is **compositional vocabulary at the surface layer**. Layer-by-layer card rendering exists in `world-purupuru`/`purupuru` repos already — compass does flat S3-PNG rendering and gets the look of "stage-prop placeholder card with Lorem Ipsum baked in." The fix is structural, not cosmetic.

## The four pillars of the next session

### Pillar 1 — Port the Layer Primitive into the honeycomb substrate (P4 Registry Plane)

Source: `/Users/zksoju/Documents/GitHub/purupuru/lib/card-system/`
- `layer-registry.json` — canonical 7-layer stack (background/frame/frame_pot/character/element_effects/rarity_treatment/behavioral)
- `types.ts` — `LayerDefinition` + `RevealStage` + `LayerSource ("immutable" | "adaptive")` axes
- `use-card-compositor.ts` — render hook (canvas-based)
- `components/card/CardLayerPreview.tsx` — Tweakpane-style live debug

Compass-specific delta: **add a `face: "front" | "back"` axis** so card backs are first-class layers (closes the "card backs are wrong" defect structurally, not by patching one filename).

Land it as:
- `lib/cards/layers/registry.json` (canonical · code-imported, never hand-mutated mid-session)
- `lib/cards/layers/types.ts`
- `lib/cards/layers/resolve.ts` (pure: inputs → resolved layer URLs)
- `lib/cards/layers/CardStack.tsx` (DOM-stacked `<img>` layers, not canvas — mobile-first, hit-testable, motion-compatible)
- Register in `lib/registry/index.ts` as `registry.cards.layers` so AI codegen has one Cmd-click discovery point

Then rip out three callsites:
- `app/battle/_scene/CardPetal.tsx:108-146` — replace `<img class="petal-art-bg/art">` with `<CardStack inputs={...} face="front" />`
- `app/battle/_scene/BattleHand.tsx:242` — replace `<CdnImage>` with `<CardStack>` 
- `app/battle/_scene/OpponentZone.tsx:88` — replace `BRAND.logoCardBack` `<img>` with `<CardStack face="back" />`

### Pillar 2 — Surgical FEEL pass on Lock + ElementQuiz rooms (Slay the Spire reference)

Operator's reference is **Slay the Spire**: tight readable layouts · deterministic action queue · modest rune/glyph particles · super-clear status indicators. NOT Hearthstone painterly excess.

Apply the Slay the Spire vocabulary to:

**Lock screen** (`app/battle/_scene/EntryScreen.tsx`):
- Map already centered + bounded this session ✓ (commit `a02b3192` + arena-style `.entry-map` shipped today)
- Weather orb already on right rail ✓ (commit `d3ad996b`)
- Wuxing breathing strip exists but reads as decoration, not status — promote to readable status indicator (per Slay the Spire pattern)
- "Today's Tide" needs a Slay-style clear pill, not a soft caption
- The Play button needs the lock-in-and-charge feel from Spire (anticipation curve before transition)

**ElementQuiz** (`app/battle/_scene/ElementQuiz.tsx`):
- 5 scene cards already carry character + scene art ✓ (template captions removed this session, kanji inset increased)
- Selection state should be "card snaps + glows + locks" not "card scales gently" — Spire-style commitment moment
- The faded non-selected cards need to feel REJECTED (Spire fades + dims, doesn't just opacity-down)
- Caretaker mural overflowing the bottom-corner is good; needs a complementary detail at the TOP of each card

### Pillar 3 — Use `construct-compositions` (already built) to sequence the FEEL passes

The operator's `construct-compositions` repo at `/Users/zksoju/bonfire/construct-compositions/` already ships **7 compositions** that EXACTLY match what the next session needs. Do NOT design new compositions from scratch — RUN the existing ones in sequence.

**Repo:** https://github.com/0xHoneyJar/construct-compositions
**Runner:** `compose-run <name> --target ./compass` (script in `loa-constructs`)
**Interactive UI:** `loom` (palette at `~/bonfire/construct-compositions/bin/loom`)
**Validator:** `~/bonfire/construct-compositions/scripts/validate.sh`

Mapping each pillar to a composition:

| Pillar | Composition | Why |
|---|---|---|
| Open the session | `discovery/audit-feel` | artisan/decomposing-feel + observer/analyzing-gaps. Surfaces where each room falls flat — generates the verdict that drives Pillars 2-3. |
| Pillar 1 (Layer port) | `delivery/code-implement-and-review` | Straight engineering port from purupuru's `lib/card-system/`. Code + review pass. |
| Pillar 2 (FEEL pass on rooms) | `delivery/feel-iterate` | Component-iteration primitive. artisan ↔ the-mint loop with PixelMark/agent-browser HITL. Run TWICE — once per room (Lock, then ElementQuiz). |
| Pillar 3 (asset moodboarding) | `delivery/direct-render` | The canonical eye-hand pattern: artisan/directing-generation ↔ the-mint/prompting-images → curate → composite. **THIS is the construct-composition the operator was naming.** |
| Pillar 4 (asset CLI) | `delivery/code-implement-and-review` | Same shape as Pillar 1 — engineering with review gate. |

**The killer pattern**: `audit-feel` runs FIRST. Its Verdict tells the next session whether each room needs new ASSETS (→ run `direct-render` to generate them) or just COMPOSITIONAL fixes (→ run `feel-iterate` only). Don't generate art before audit-feel says you need to.

### Pillar 4 — Thin CLI for asset awareness (the gap that bit us this session)

Operator: "the lack of CLI/awareness of the CDN/S3 asset layer and labelling around it." Already-existing primitive: `lib/assets/manifest.ts` + `pnpm assets:check`. Missing: discovery + audit + per-layer coverage.

Build (mirror world-purupuru's prior art before recreating):

```bash
pnpm cards:audit                  # walk every (cardType × element × rarity × revealStage × face)
                                  # combination, HEAD each layer URL, print coverage matrix
pnpm assets:list --filter card    # list all card-class assets with paths + dimensions
pnpm assets:list --missing        # only show registered-but-404 assets
pnpm assets:list --orphan         # only show files-on-disk-not-in-manifest
```

These run inside `scripts/` as `tsx` files, register in `package.json`. Each one prints a markdown table to stdout; agent calls them via Bash and consumes the output. Zero MCP overhead.

CLEANUP TARGETS (operator's "wrong assets"):
- `public/art/bears/`, `bear-faces/`, `bear-pfps/`, `bear-costumes/`, `banners/`, `boarding-passes/`, `characters-hd/`, `scenes-hd/` — all numeric-token PNGs from honey/bera collection, NOT purupuru. Either move out of the repo or delete.
- `public/art/cards/card-template-{water-v1,water-v2}.png` — orphans from a previous template iteration; the layer-system replaces them.
- `public/art/cards/jani-trading-{fire,metal,water}.png` — orphan trio (no wood/earth). Decide: complete the set OR drop and use S3 only.
- Card backs are missing entirely — there's no `cards/backs/` folder. The current code uses `BRAND.logoCardBack` which is the wordmark, not a Tsuheji-themed back.

## /goal definition for `/goal` command

Set this as the next-session goal:

```text
Ship the Layer primitive into the honeycomb substrate (P4 Registry Plane)
and apply it to the Lock + ElementQuiz rooms with Slay-the-Spire-grade
FEEL. Done conditions:

1. lib/cards/layers/{registry.json, types.ts, resolve.ts, CardStack.tsx}
   exist and registered in lib/registry/index.ts. Tests cover the
   resolve.ts pure function for all 5 elements × 4 rarities × 3 reveal
   stages × 2 faces (120 combinations).

2. CardPetal, BattleHand, OpponentZone all consume <CardStack> instead
   of flat <img> rendering. Card backs no longer use BRAND.logoCardBack.

3. pnpm cards:audit runs end-to-end and prints a clean coverage matrix
   (no [MISSING] entries for the layer combinations the substrate emits).
   pnpm assets:list --orphan returns ZERO files for the
   public/art/cards/ tree.

4. EntryScreen + ElementQuiz both pass the operator's "feels like Slay
   the Spire" vibe check. Specifically:
   - Lock screen: map (done), weather orb (done), wuxing strip promoted
     to status indicator, Play button has commitment-anticipation curve
   - ElementQuiz: card-select moment has snap+glow+lock, faded cards
     read as REJECTED (not just dim), top-of-card detail complements
     the bottom mural

5. construct-composition workflow demonstrated ONCE end-to-end:
   reference (Slay the Spire title screen) → moodboard (3-5 options
   generated) → operator picks → asset registered in layer registry.
   Path of either the-easel or the-mint construct chosen and documented.

6. public/art/ honey/bera token PNGs cleaned up (moved or deleted) per
   the inventory in this brief.

Hard NO: do NOT touch the Arena room this session (operator deferred
it). Do NOT touch the substrate reducer. Do NOT add MCP servers.
```

## Files of record (the agent picking this up should read these in order)

1. **This brief** — ground reality + decisions
2. `grimoires/loa/proposals/registry-doctrine-2026-05-12.md` — P1-P4 substrate plane structure
3. `grimoires/loa/proposals/foundation-vfx-camera-audio-2026-05-12.md` — what the engines are
4. `grimoires/loa/proposals/operator-handoff-2026-05-12.md` — what's queued vs operator's job
5. `/Users/zksoju/Documents/GitHub/purupuru/lib/card-system/` — the layer system to port (CRITICAL)
6. `/Users/zksoju/Documents/GitHub/world-purupuru/components/element-identity-card.tsx` — typographic composition reference
7. `/Users/zksoju/Documents/GitHub/compass/lib/assets/manifest.ts` — current asset registry (extend with `class: "layer" | "layer-back"`)
8. `/Users/zksoju/Documents/GitHub/compass/app/battle/_scene/CardPetal.tsx` — primary refactor target
9. `/Users/zksoju/Documents/GitHub/compass/app/kit/page.tsx` — already mentions the layer system in copy; this is where the layer preview tweakpane should live

## What this session shipped (commit history for the kickoff agent's grounding)

| Commit | Subject |
|---|---|
| `b6e533f1` | seed sprint 0 |
| ... (early sprint commits) |
| `887ddd1a` | quiz polish: drop subtitle, drop captions, inset kanji |
| `9e85f5b7` | quiz: remove header underline divider |
| `1005e58c` | map viewport-aware · opponent up · CardPetal layered composition |
| `d3ad996b` | weather-orb on right rail (was bleeding past viewport corner) |
| `619daaa4` | TurnClock viewport clip — position absolute with safe-area inset |
| `8f717908` | TurnClock vertical on left rail (operator request) |
| `3c0851f7` | map-flat centers both axes (animation was clobbering Y) |
| `<this commit>` | entry-map shipped on lock screen + this kickoff brief |

## Permission grants for the next agent

The operator has consistently granted in this session:
- creative latitude ("be crazy. creative. loving... mad agent ai stuff")
- right to question the question
- subagent delegation for parallel research (validated this session — saved hours)
- 20% self-directed quality work (tend latitude)
- micro-fix without /implement for cosmetic + config fixes

The next agent should NOT:
- substrate reducer changes (out of scope this cycle)
- backend integrations (Solana, Convex, Dynamic)
- production-facing UI redesign (dev panels are dev-only)
- per-element art commissions (operator decides spend)
- merge PR `feat/hb-s7-devpanel-audit` (operator's call)

## How to start the next session

```text
/kickoff
Read grimoires/loa/proposals/kickoff-next-session-2026-05-12.md
Read referenced sources from purupuru/world-purupuru
Set /goal to the goal defined in §/goal definition above
Begin Pillar 1 (Layer primitive port)
```

## Operator-runnable prompt sequence (literal copy-paste blocks)

The operator runs these IN ORDER. Each block is one prompt. Composition runner wires the artifact handoffs; operator stays in feedback-loop mode (Pixar-dailies discipline).

### Step 0 — Open the session

```text
/kickoff
Read grimoires/loa/proposals/kickoff-next-session-2026-05-12.md end-to-end.
Then read:
  /Users/zksoju/Documents/GitHub/purupuru/lib/card-system/layer-registry.json
  /Users/zksoju/Documents/GitHub/purupuru/lib/card-system/types.ts
  /Users/zksoju/Documents/GitHub/purupuru/components/card/CardLayerPreview.tsx
Set /goal to the §/goal definition block. Confirm before continuing.
```

### Step 1 — Audit-feel pass (where do rooms fall flat?)

```text
compose-run audit-feel \
  --target /Users/zksoju/Documents/GitHub/compass \
  --inputs.surfaces "app/battle/_scene/EntryScreen.tsx,app/battle/_scene/ElementQuiz.tsx" \
  --inputs.canon "grimoires/loa/proposals/kickoff-next-session-2026-05-12.md" \
  --inputs.reference "Slay the Spire title + map screen + card-played reveal"
```
**Artifact out**: friction-map.md + verdict.md telling you which rooms need new assets vs compositional-only fixes.

### Step 2 — Layer primitive port (Pillar 1)

```text
compose-run code-implement-and-review \
  --target /Users/zksoju/Documents/GitHub/compass \
  --inputs.brief "Port purupuru's lib/card-system/ to compass at lib/cards/layers/. Add face: 'front'|'back' axis to LayerDef. Register in lib/registry/index.ts as registry.cards.layers. Tests cover all 120 (5 elements × 4 rarities × 3 reveal × 2 faces) combinations."
```
**Artifact out**: PR commit with `lib/cards/layers/{registry.json, types.ts, resolve.ts, CardStack.tsx}` + tests + registry binding. Review verdict.

### Step 3 — Asset moodboard for the rooms that need it (Pillar 3)

Only run if Step 1's verdict said the room needs NEW ASSETS. Run once per room.

```text
compose-run direct-render \
  --target /Users/zksoju/Documents/GitHub/compass \
  --inputs.canon "app/globals.css,grimoires/loa/proposals/kickoff-next-session-2026-05-12.md,public/art/cards/scene-card-fire.png" \
  --inputs.brief "Slay the Spire-grade Lock screen background — same Tsuheji map texture but recomposed as a moody title card. 3-5 variants exploring: parchment vs ink-wash, day vs dusk, with/without water reflection. 1024x1024 PNG with transparent center vignette."
```
**Artifact out**: 3-5 candidate PNGs in `public/art/generated/lock-screen/v{N}/`, operator picks 1, picked PNG enters `lib/cards/layers/registry.json` as a `face: "back" / layer: "background"` variant.

Repeat for ElementQuiz card backgrounds if Step 1 verdict demanded.

### Step 4 — FEEL iterate per room (Pillar 2)

Run per room. Each invocation is one artisan ↔ the-mint loop with operator-marking via PixelMark or agent-browser screenshot.

```text
compose-run feel-iterate \
  --target /Users/zksoju/Documents/GitHub/compass \
  --inputs.surface "app/battle/_scene/EntryScreen.tsx" \
  --inputs.canon "Slay the Spire title screen feel — tight readable layout, modest VFX, super-clear status indicators" \
  --inputs.refs "screenshot:slay-spire-title.png" \
  --inputs.iteration_cap 3
```

Then again for ElementQuiz:

```text
compose-run feel-iterate \
  --target /Users/zksoju/Documents/GitHub/compass \
  --inputs.surface "app/battle/_scene/ElementQuiz.tsx" \
  --inputs.canon "Slay the Spire character-select feel — card snaps + glows + locks; rejected cards FADE not just dim" \
  --inputs.refs "screenshot:slay-spire-character-select.png" \
  --inputs.iteration_cap 3
```
**Artifact out per loop**: distilled component diff + pixelmark trail + curation log.

### Step 5 — Asset audit CLI (Pillar 4)

```text
compose-run code-implement-and-review \
  --target /Users/zksoju/Documents/GitHub/compass \
  --inputs.brief "Build pnpm cards:audit + pnpm assets:list (--filter, --missing, --orphan) as tsx scripts. Walk lib/assets/manifest.ts, HEAD every URL via existing scripts/check-assets.mjs, print markdown coverage tables to stdout. Reference world-purupuru's prior CLI before designing — operator says 'alot has already been built there.'"
```
**Artifact out**: `scripts/cards-audit.ts` + `scripts/assets-list.ts` + package.json bindings + clean-run output proving zero orphans + zero missing.

### Step 6 — Cleanup (operator-driven, agent assists)

```text
Walk the inventory in §Pillar 4 of the kickoff brief. For each honey/bera
asset folder (bears, bear-faces, bear-pfps, bear-costumes, banners,
boarding-passes, characters-hd, scenes-hd):
  - Confirm each PNG is a token-id-named file (numeric)
  - Confirm zero references in app/, lib/, components/, scripts/
  - Move to public/_archive/honey-collection/ (don't delete in case
    operator wants them later)
Commit the move as a single 'chore(assets):' commit.
```

### Step 7 — Goal-condition verification

```text
Run through each of the 6 done-conditions in /goal:
  1. Layer primitive files exist + registered + tested (120 combos)
  2. CardPetal · BattleHand · OpponentZone consume <CardStack>
  3. pnpm cards:audit clean, pnpm assets:list --orphan returns zero
  4. Lock + ElementQuiz pass operator's "feels like Slay the Spire" check
  5. construct-composition workflow demonstrated end-to-end (which: direct-render run
     in Step 3 OR feel-iterate run in Step 4)
  6. honey/bera PNGs cleaned (Step 6)
For each: print PASS/FAIL with evidence (git log, agent-browser snapshot, command output).
Goal hook should auto-clear when all 6 PASS.
```

### When something drifts mid-session

The compose-run loop is the work. Operator watches at the curation/iteration loops:

- **`generate` loop in `direct-render`** — operator sees 3-5 candidates per round; rejects → next prompt; accepts → moves to composite
- **`iterate` loop in `feel-iterate`** — operator marks pixel regions on the PixelMark canvas; the-mint reads the marks + renders next variation
- **`audit-feel` verdict** — operator can override; if "no new assets needed" was wrong, re-run with corrected scope

This is the Pixar-dailies pattern. The operator doesn't write code; the operator gives notes at the loops. The agent writes code only at Steps 2 + 5 (substrate work). Steps 1, 3, 4, 6 are operator-led.
