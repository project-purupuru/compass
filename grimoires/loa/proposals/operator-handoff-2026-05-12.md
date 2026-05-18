---
status: draft-r0
type: operator hand-off brief
author: claude (Opus 4.7 1M)
created: 2026-05-12
cycle: battle-foundations-2026-05-12 (post-PR /remote-control session)
companions: foundation-vfx-camera-audio-2026-05-12.md, registry-doctrine-2026-05-12.md
---

# Operator Hand-off — What's Yours, What's the Agent's

The user's directive was to "set down the foundations and get more clarity on the
exact pieces involved where I will need to come in and refine with asset packs and
more precision but leave the engine work to the agent." This is that brief.

## Engine work that is now DONE (agent shipped)

- **Three engines** with full lifecycle: `cameraEngine`, `vfxScheduler`, `audioEngine`
- **Three Tweakpane panels** binding live to each engine: CAMERA · VFX · AUDIO
- **Registry doctrine + MutationGuard primitive** — defensive structure for AI co-development
- **Fagan-grade hardening pass** on every singleton (4 CRITICAL + 10 MAJOR closed)
- **Camera weight primitives** (hitstop / trauma-squared shake / Perlin noise / FRI decay)
- **Pixi water burst** as proof of the "procedural shader" path — water clashes only
- **dig-search.ts CLI fallback** so research pipelines no longer silently 403

## Engine work in the QUEUE (next bites — agent will ship)

Ordered by ROI from this session's research:

1. **Audio voice priority + atomic snapshot timing** (research §3 audio)
   Replace FIFO eviction with priority-aware. Atomic snapshot ramps from one
   `ctx.currentTime`. ~80 LOC.

2. **`bindSchema(target, schema)` Tweakpane helper** (research §1 tweakpane)
   Define config shape once next to defaults; pane gets generated. Removes
   ~150 LOC of hand-wired bindings across the 3 panes. ~50 LOC.

3. **Phantom-type EngineState** (research §1 registry)
   `Engine<"Started">` vs `Engine<"Created">` — calling `engine.emit()` before
   `engine.start()` becomes a TypeScript error, not a runtime no-op. ~30 LOC × 3 engines.

4. **Hot-reload-aware MutationGuard** (research §3 registry)
   `import.meta.hot.dispose()` preserves accumulated state across HMR.
   Today every Vite reload re-throws "already registered." ~10 LOC per registry.

5. **VFX `addToTop`/`addToBottom` semantics + Balatro blocking-matrix**
   (Slay-the-Spire's ActionManager + Balatro's `blocking`/`blockable` per-event).
   Lets sub-effects inject ahead of pending; lets ambient run concurrent.
   ~120 LOC.

6. **Hitstop into substrate** (currently camera-only)
   Wire `cameraEngine.isHitstopActive()` into `clash-staging.ts` so the
   reducer also pauses during freeze-frames. The visual hitstop without
   the substrate hitstop reads as a hitch. ~30 LOC.

7. **VFX scheduler subscription wire**
   The VFX panel's "▶ water burst" test buttons currently fire scheduler
   requests but renderers gate on substrate. Make `<PixiClashVfx>` and
   `<ClashVfx>` ALSO subscribe to scheduler-admitted effects so test
   buttons actually visualize. ~40 LOC.

## What's YOURS (operator decisions / asset sourcing)

### Visual direction (one of these, then the agent finishes)

**Path A — sprite asset packs (you source, agent integrates)**
- itch.io creators to audition (in priority order):
  - `xyezawr` Free Pixel Effects Pack — baseline
  - `pimen` Magic Pack — water + lightning
  - `ansimuz` Chrono Magic Effects — broader magic
  - `brullov` Spells Bundle — pixel-art VFX
- Drop into `public/vfx/{element}/frame-NN.png`
- Agent will write the sprite-sheet renderer (~80 LOC, mirror of `pixi-water-burst.ts` but reading frames from PNG sheets)

**Path B — full Pixi procedural (no assets, all agent work)**
- Agent writes `pixi-fire-burst.ts`, `pixi-earth-burst.ts`, etc. (~150 LOC each, 4 elements remaining)
- Same pattern as the water proof
- Looks good but distinctive; not "indie game studio" feel without art

**Hybrid (recommended)**: Pixi procedural for atmosphere + sprite kits for the impact frame. Best of both.

### Sound (operator sources, agent integrates)

- Procedural fallback ships today (in `lib/audio/registry.ts`) for all 19 SFX
- When you have MP3s: drop in `public/sounds/sfx/<name>.mp3`, flip `kind: "procedural"` → `kind: "file"` in registry
- Sources: itch.io audio packs, freesound.org, Sonniss GDC bundles
- Agent will not touch the registry IDs (they're stable across the swap)

### Music (operator sources)

- 5 named tracks expected: `entry-ambient`, `arrange-tension`, `clash`, `result`, `idle`
- Drop in `public/sounds/music/<name>.mp3`
- Phase router (`lib/audio/music-director.ts`) already crossfades between them on `MatchPhase` events

### Brand decisions

- Dev-panel cosmetic polish (the panes WORK; their look is generic Tweakpane chrome)
- Production-facing Settings UI (the panes are dev-only by NODE_ENV gate)
- Final per-element power balance (numbers in `lib/honeycomb/cards.ts`)
- Combo discovery copy (the metadata text in `lib/honeycomb/discovery.ts`)

### Friction-points captured this session (defects you don't have to fix again)

These were converted to engineering work the agent now owns:

| Friction (your words) | Root cause | Agent's response |
|---|---|---|
| "really bad mix of effects that render and derender poorly" | 4 effect systems firing without coordinator | VfxScheduler with caps + per-element XOR routing |
| "parallax camera movement is glitchy and feels poorly done" | Direct mouse → CSS write + CSS transition fighting JS LERP | CameraEngine LERP loop + transition removal + FRI decay + Perlin shake |
| "tweakpane crashes on tab switch" | Module-level plugin registration flag | Per-pane `registerEssentials(pane)` + `makePane()` helper |
| "I'm not exactly registering anything" (Pixi water never showed) | Two renderers competing for cap=1 family slot | Per-element renderer config (XOR routing) |
| "ai creates too many sources of truth" | Module-scope mutables, no governance | Registry-of-Registries + MutationGuard + ESLint rule |
| "DIG broken silently" | Gemini REST 403, no fallback | CLI tier added (third-tier, OAuth path) |
| "static lines instead of real effects" | CSS-only VFX kit | Pixi procedural path proved on water; Path A or B decision yours |

## What I'm NOT doing without your sign-off

- **Source-of-truth changes to MatchSnapshot** — the substrate reducer is correct; not touching it
- **Production-facing UI changes** — dev panels only this cycle
- **Backend integrations** (Solana, Convex, Dynamic auth) — out of cycle scope
- **Per-element art commissions** — you decide if/who/budget
- **Custom audio tracks** — you decide if/who/budget
- **PR merge** — branch is `feat/hb-s7-devpanel-audit`, commits up to `a927372a`, you control the merge

## Receipts (verify any of these)

```bash
# tsc clean
pnpm tsc --noEmit; echo "exit $?"

# tests
pnpm test

# lint (oxlint, fast)
pnpm lint

# eslint with custom registry rule
npx eslint lib/

# /battle smoke
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/battle

# Open dev panel + click through 3 new tabs
agent-browser open "http://localhost:3000/battle?dev=1"
# backtick to open the panel; click CAMERA / VFX / AUDIO tabs

# Try the dig (now via CLI fallback)
npx tsx .claude/constructs/packs/k-hole/scripts/dig-search.ts \
  --query "test" --depth 1 --model gemini-3-pro-preview
```

## What this turn cost

- Subagents spawned: 7 (1 Explore × 2 + 5 general-purpose research + 1 fagan-emulated review)
- Background bash jobs: 6 (1 gemini smoke + 5 dig refire)
- Files created: 7 (registry doctrine + handoff + lib/registry × 2 + 3 panes + Pixi water + ESLint rule)
- Files modified: ~10
- LOC added: ~1500
- Commits: 1 (a927372a) + this commit when finalized
- Test suite: 234/234 passing through every checkpoint
- TypeScript: clean through every checkpoint
