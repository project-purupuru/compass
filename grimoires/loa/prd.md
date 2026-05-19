---
cycle: lab-evolution-2026-05-18
session: 22 (entry)
type: PRD
status: candidate
date: 2026-05-18
mode: ARCH (OSTROM) + craft lens (ALEXANDER) + DIG (returned)
operator_pacing: kaironic + simstim (operator-paced, pair-points at sprint boundaries)
branch_root: feat/ecs-leaves-2026-05-17 (commit in-flight before S1 branches off)
simstim_id: simstim-20260518-f581af5a
brief: grimoires/loa/context/lab-evolution-brief-2026-05-18.md
operator_quotes:
  - "We should 100% leave off the UI better than we started it here with clarity."
  - "I need to understand the reasoning for changes and sources of truth in terms of pointers."
  - "Strengthening the engine/substrate enables cohesion and agentic agency."
  - "When things break, then there's a check in place for that, like there's a test or there is a Claude Code hook."
  - "Having a visual panel to see how things are composed together."
  - "Since this is a chunky one let's /simstim it."
load_bearing_constraints:
  - paper-puppet doctrine LOCKED (no 3D character geometry — applies to all art surfaces touched)
  - regression substrate ships BEFORE any edit to operator-validated render paths (§5.1 pointer-trace doctrine)
  - additive-only on existing primitives until substrate fuse is live
  - subscription CLI only (no API keys) — cheval routes adversarial reviews; Flatline degraded acceptable
  - one PR per sprint, merged on operator approval (kaironic pair-points)
  - figma mental anchor (NOT Blender/Godot/Unity) for inspector/composability/version surfaces
references:
  - grimoires/loa/context/lab-evolution-brief-2026-05-18.md (the source brief)
  - grimoires/loa/distillations/session-21-graduation-and-story-trust-2026-05-18.md
  - grimoires/k-hole/research-output/dig-dcc-primitives-2026-05-18.md
  - grimoires/k-hole/research-output/dig-pointer-visibility-2026-05-18.md
  - grimoires/k-hole/research-output/dig-authoring-pipeline-2026-05-18.md
predecessors:
  - feedback_kitchen-as-backend-composition-pattern.md (session 22 doctrine)
  - feedback_pointers-as-agentic-engine-infrastructure.md
  - feedback_figma-mental-anchor-for-composability.md
  - feedback_regression-checks-are-substrate-not-ceremony.md
---

# PRD · Lab Evolution Cycle — 2026-05-18

> The vfx-lab is the kitchen. The kitchen earned the right to a substrate. This cycle ships that substrate: regression fuse · icon registry · pointer-chain spine · composability surface · workspaces · cohesion port. Six threads, one cycle, substrate-first.

---

## §1 · Why this cycle now

Session 22 (2026-05-18) shipped a card-composition kitchen primitive but burned **four sequential render regressions** on the same component (`CodexCardFace`). Each fix introduced the next bug. None were caught by typecheck or HTTP smoke — only by the operator's visual review post-deploy. The brief at `grimoires/loa/context/lab-evolution-brief-2026-05-18.md` distilled the frictions; this PRD turns them into a cycle.

Two doctrine commitments from session 22 make this cycle structural, not cosmetic:

1. **Pointers are agentic-engine infrastructure** (operator verbatim) — visible pointer chains at the surface are co-equal with Honeycomb substrate, not UI polish.
2. **Regression checks are substrate, not ceremony** (operator verbatim) — render-path mutations need an automated check, not just visual review.

Both are reframes of "agentic gaming engine." This cycle is the first instance of those reframes shipping as code.

---

## §2 · Goals

### G1 · The fuse exists before the next refactor
Land a regression-check substrate (Claude Code hook + Vitest snapshot, both as substrate via `lib/regression/`) that catches geometry regressions on `app/battle-v2/_components/cards/*` AND `app/battle-v2/_components/vfx/effects/*` BEFORE the operator sees the bug. The four-regression cascade from session 22 must not be reproducible after S1.

### G2 · Every entity exposes its pointer chain at the surface
PointerChip V0 (session 22) graduates to a persistent breadcrumb (Thread A) + a click-to-inspect side panel (Thread B). By cycle end, every card, layer, and effect in vfx-lab and battle surfaces its pointer chain at the surface — not in devtools. Confirmed by Prokopov's "Pointer Chips" + "Inspector Breadcrumbs" doctrine (dig 2).

### G3 · Composability is visible
A composability panel (Thread C) makes scene composition legible. The lab ships **three sketched shapes** of the panel (Figma-literal · Figma + pointer-chain · Godot-shaped tree) and lets the operator pick from rendered samples — per `feedback_explore-dont-lock.md`. Figma is the mental anchor; sketches respect it.

### G4 · The multi-mode mental model gets a visual frame
Workspaces tab switcher (Thread D) surfaces the Compose / Preview / Export postures the operator already holds mentally. Tabs are top-anchored, Figma-shaped, layout-state lifted to per-workspace zustand slice.

### G5 · Icon swappability is substrate, not ceremony
`IconRegistry` primitive (operator-named: *"should not take this much effort to change things"*) — semantic icon aliases (`<Icon name="pantry" />`) decoupled from any specific icon library. Phosphor is the first provider. Swap the provider, every icon in lab + game-UI updates. Visible swap demo in vfx-lab proves it.

### G6 · All 9 vfx-lab effects participate in the new substrate

**Pre-sprint inventory task (per Flatline IMP-004):** before S1 starts, S1 first task is `S1.T0 — Effect inventory`:
- Run `grep -E "VfxEffectDefinition<" app/battle-v2/_components/vfx/VfxRegistry.ts` to enumerate registered effects
- Lock the canonical count + slugs in `grimoires/loa/cycles/lab-evolution-2026-05-18/effect-inventory.md`
- Verified inventory (2026-05-18): **9 effects** — card-composition, card-lab, hex-scene, mini-scene, big-realm-scene, realm-scene, tree-fall, water-splash, zone-scene

By S5, every effect in the locked inventory has been retrofitted to:
- expose a pointer chain at the surface
- be selectable in the Inspector
- import icons via `IconRegistry`
- have at least one regression snapshot baseline

This is the cycle's "definition of done" gate.

### G7 · No-regression on operator-validated work

Threads `/`, `/demo`, and battle-v2 visual surfaces validated before session 22 must not regress.

**Reference commit + drift threshold (per Flatline IMP-005 · resolves "unenforceable DoD" concern):**

- **Reference commit:** `7a179bce` (production hotfix on `feat/ecs-leaves-2026-05-17`, last validated by operator pre-session 22). This is the baseline commit.
- **Capture method:** S1 captures snapshots of `/`, `/demo`, and battle-v2 visual surfaces by running the regression substrate against the working tree AT reference-commit state (operator stash + checkout for capture; restore working tree after).
- **Acceptable drift:** `boundingBox` ±0.5px / pixel diff < 0.5% per the FR-S1.3 hierarchy. ANY drift above tolerance fails the gate.
- **Routes covered:** `/`, `/demo`, `/battle-v2`, `/battle-v2/vfx-lab` (the four operator-validated surfaces). Each captured at viewport widths 1280×800 (desktop) and 390×844 (mobile preview) in dark theme.
- **Re-validation cadence:** post-each-sprint, the cycle PR diff includes a "validated-surface regression report" generated from the baselines above. Operator inspects.

Any edit to a validated render path must pass the S1 regression substrate.

---

## §3 · Non-goals

- **Scene composition primitive** (Godot-shaped scene nesting) — deferred to a follow-up cycle. The-arcade's "I made one" precedent isn't met; ship the spine + composability surface first.
- **Variant system** (Unity prefab variants) — codex side hasn't shipped variants yet; wait for second codex card before designing.
- **Node graph for composition** — gated behind the-arcade's 3-wins rule; revisit after this cycle.
- **Consumer-context mini-viewports** (vfx-playbook P5) — sequence after pointer spine ships.
- **Viewport-state persistence per-primitive** (vfx-playbook P4) — boring-but-compounding; pick up if S5 has slack.
- **Codex pack changes** — this cycle does not modify `purupuru-codex` pack. Spec gaps raised on PR #1 are tracked separately.
- **Hackathon/`/`/`/demo` route changes** — protected per `project_hackathon-submitted-pivot.md`.
- **Three.js / 3D character geometry** — paper-puppet doctrine LOCKED; this cycle is 2D card/UI substrate.
- **Real backend wiring** — score, auth, on-chain remain mocked per project CLAUDE.md.

---

## §4 · Users

| Role | Need served |
|---|---|
| **Operator** (zksoju) | Daily-flow tooling: see pointer chains, pick from rendered samples, swap icons easily, never burn a session on a render regression again |
| **Gumi** (asset author, via codex pack) | Implicit: better lab = better feedback loop on card authoring; spec gaps surface faster |
| **Future-self (Operator)** | When a 2nd codex card lands or a new VFX effect ships, substrate adopts it without code changes (capability-driven rendering vs asset-driven, per dig 3) |
| **Downstream projects** (honeycomb · sprawl · freeside) | `lib/regression/` and `lib/ui/icons/` are substrate-shaped to graduate into reusable primitives once proven |

---

## §5 · Functional requirements

### FR-S1 · Regression substrate (Sprint 1, ships first)

**FR-S1.1 — `lib/regression/` primitive (Effect-style port)**
- Type definitions for `RegressionCheckPort`, `Snapshot`, `Baseline`, `DiffResult`
- Effect Schema for snapshot envelope (image bytes ref · boundingBox JSON · metadata)
- Per dig 2 finding: **boundingBox JSON snapshots over fuzzy pixel-diffing** for geometry asserts (Mark Dalgleish / Playwright pattern)
- Port has two live implementations: `VitestSnapshotLive`, `HookCheckLive`

**FR-S1.2 — Claude Code PreToolUse hook**
- Hook registered at `.claude/hooks/pre-tool-use/lab-render-regression.sh`
- Triggers on `Write` / `Edit` of paths matching:
  - `app/battle-v2/_components/cards/**`
  - `app/battle-v2/_components/vfx/effects/**`
  - `app/battle-v2/_components/CardFace.tsx`
  - `lib/cards/codex/**`

**Execution model (per Flatline IMP-001 · resolves causal-inversion concern):**

PreToolUse fires BEFORE the file is written, so the hook cannot read post-write rendered geometry directly. The hook resolves this via a **stage-and-render** flow:

1. Hook reads the proposed `content` from stdin JSON (Claude Code passes the full proposed file content on Write/Edit).
2. Hook writes proposed content to a temp shadow path (`.run/regression-staging/<primitive>.staged.tsx`).
3. Hook invokes a focused vitest run that mounts the staged primitive (via a render-helper that prefers the staged path) and captures snapshot.
4. Hook compares against the on-disk baseline.
5. If geometry/pixel diff exceeds tolerance → exit 1 (BLOCK with summary). If within tolerance → exit 0 (allow). If render fails to stage (compile error, missing dep) → exit 0 with WARN to audit log (fail-open; the actual write will surface the compile error to Claude Code anyway).
6. Staging temp files cleaned up on hook exit.

Post-hook flow: Claude Code applies the write normally; the file is then on-disk for any subsequent Vitest CI run (which uses the same baselines).

- Latency budget: < 8s for the affected primitive's snapshot subset (not the full lab); fail-open with warning if > 8s.
- Override: `LAB_REGRESSION_OVERRIDE=1` env var bypasses the block once (audited).

**FR-S1.3 — Vitest snapshot tests**
- At least one snapshot test per primitive in `app/battle-v2/_components/cards/*` and `app/battle-v2/_components/vfx/effects/*`
- Baselines stored under `tests/snapshots/lab/`
- Each baseline carries: render image + boundingBox JSON + metadata (props, scale, theme)
- "Matrix view" permutation per Linear/Kowalski pattern (dig 2): cards/effects rendered at fixed scales (0.5×, 1×, 2×) — catches container-query regressions like F5 #4

**Assertion hierarchy (per Flatline IMP-002 · resolves dual-invariant ambiguity):**

`boundingBox` JSON is the **PRIMARY** assertion gate. `pixel diff` is **ADVISORY**.

| Tier | What | When it fires | Outcome |
|---|---|---|---|
| **Primary** | `boundingBox` JSON match within ±0.5px per dimension | Always — every snapshot check | BLOCK on miss |
| **Secondary** | SHA-256 of normalized PNG (image identity) | When boundingBox matches | Logs only — does NOT block |
| **Tertiary** | Pixel diff (pixelmatch) — count of differing pixels above antialiasing threshold | When SHA-256 differs | Surface in PR review as advisory; does NOT block CI |

Rationale: dig 2 finding (Olah/Nguyen Chromatic) — pixel diff is noise-prone (antialiasing). Geometry is mathematical invariant; treat as truth source. Pixel changes that preserve geometry are "visual updates," not regressions — flag for review but don't block.

**FR-S1.4 — Canary test (proof the substrate works)**
- A dedicated test that introduces an intentional mutation to `CodexCardFace` (e.g., +5% width) and verifies the substrate flags it. Lives at `tests/regression/canary.test.ts`. Documented as the proof artifact for cycle DoD.

**FR-S1.5 — Operator-facing failure surface**
- When a hook blocks an edit, the message includes: file path · primitive name · baseline path · diff summary (which dimension changed by how much) · "to update baseline, run: pnpm regression:approve <primitive>"

**FR-S1.6 — Baseline approval governance (per Flatline IMP-010 · operator-ratified)**

`pnpm regression:approve` is the one operation that blesses a baseline change as intentional. Governance required to make the safety mechanism real, not formal:

- **Who:** any contributor running the script locally. Override (`LAB_REGRESSION_OVERRIDE=1`) is operator-tier; audited.
- **Evidence in PR:** when a PR includes baseline updates under `tests/snapshots/lab/`, the PR description MUST contain:
  - List of affected primitives
  - Per-primitive: before/after PNG attachments (or rendered URLs) inline
  - One-line rationale per change ("intentional: added Phosphor icon"; NOT "baseline refresh")
- **Suspicious-churn heuristic:** CI surfaces a warning if a single PR updates `>3` baselines OR `>50%` of existing baselines — flagged for extra reviewer attention; does NOT block merge.
- **Audit trail:** every approve invocation logs to `.run/audit.jsonl` with operator + primitive + reason.

Implementation lives in `package.json` script + `.claude/scripts/regression-approve.sh` (S1 deliverable).

**FR-S1.7 — S1 baseline scope (per Flatline IMP-012 · operator-ratified: minimum viable)**

S1 ships baselines for **3 representative primitives** + validated-surface coverage:

| Baseline | Primitive | Why this one |
|---|---|---|
| 1 | `CodexCardFace` (already validated render) | The session-22 regression target — proves the fuse on the actual bug surface |
| 2 | `CardComposition` (kitchen primitive) | Most-recent operator-validated; the kitchen entry-point |
| 3 | `HexScene` (highest test coverage) | Existing test infrastructure to lean on; representative of effect-shape primitives |

Validated-surface baselines: `/`, `/demo`, `/battle-v2`, `/battle-v2/vfx-lab` (per FR-G7).

Canary: on `CodexCardFace` (per FR-S1.4).

S2-S5 add the remaining 6 effect baselines incrementally as each effect is touched (S2 adds CardComposition's full adapter coverage, S5 retrofit pass adds the rest). S5 close-gate requires all 9 effect baselines present.

### FR-S2 · IconRegistry substrate (Sprint 1, parallel)

**FR-S2.1 — `lib/ui/icons/` primitive**
- `<Icon name="pantry" size={16} weight="regular" />` API (no library coupling at consumer)
- Internal registry maps semantic names → provider components
- First provider: `@phosphor-icons/react` (operator-confirmed)
- Stub provider available (renders text fallback) for the swap demo
- Type-safe icon names (TS literal union from registry keys)

**FR-S2.2 — Semantic icon vocabulary (V0)**
- Cycle ships ~30 semantic names covering lab + game UI surfaces:
  - Pantry/codex: `pantry`, `codex-card`, `ingredient`
  - Kitchen/lab: `kitchen`, `effect`, `compose`, `preview`, `export`
  - Pointers: `pointer-source`, `pointer-render`, `pointer-consumer`, `breadcrumb-separator`
  - Inspector: `inspect`, `select`, `data`, `raw`, `edit`
  - Workspaces: `workspace-compose`, `workspace-preview`, `workspace-export`
  - Game (battle): `play`, `draw`, `discard`, `wuxing-wood`, `wuxing-fire`, `wuxing-earth`, `wuxing-metal`, `wuxing-water`
  - Status: `success`, `warning`, `error`, `info`
  - (Final list locked in SDD; this is the target shape, not exhaustive)

**FR-S2.3 — IconRegistry swap demo in vfx-lab**
- Visible toggle in vfx-lab (top-right of chrome) that swaps between `Phosphor` and `Stub` providers live, without page reload
- Persists per session
- Operator-aligned proof: *"should not take this much effort to change things"*

**FR-S2.4 — Migration path**
- S1 ships registry + ~5 sentinel icons (used by S2-S4 new components)
- S5 retrofits existing `lucide-react` usages across lab + game UI to use the registry. Where a semantic name doesn't exist yet, add it.
- Hard rule: by cycle end, **no direct `lucide-react` or `@phosphor-icons/react` imports outside `lib/ui/icons/`**.

### FR-S2.5 · Shared pointer-chain schema (Sprint 1 deliverable · per Flatline IMP-007)

Before S3 starts, the pointer-chain schema must be locked. All three downstream sprints (S2 breadcrumb, S3 composability, S4 workspaces) read from the same schema; divergent interpretations across sprints would produce inconsistent pointer representations at the seams.

**Schema location:** `lib/lab/pointer-chain/schema.ts` (Effect Schema)

```ts
// Schema shape (locked in S1, consumed by S2/S3/S4):
const PointerSegment = S.Union(
  S.TaggedStruct("Pantry", { slug: S.String, path: S.String }),
  S.TaggedStruct("Primitive", { name: S.String, path: S.String }),
  S.TaggedStruct("Consumer", { consumers: S.Array(S.String) }),
  S.TaggedStruct("Scene", { name: S.String, path: S.String }),
);
const PointerChain = S.Array(PointerSegment);
```

**Required surface coverage:**
- Breadcrumb: full chain rendered left-to-right with `›` separators
- Composability panel: per-entity chain rendered as inline subtitle under entity label
- Inspector: full chain rendered vertically in Pointer-chain tab with source-path detail per segment
- Workspaces: chain context used to scope per-workspace state

**S1 ships:** schema file + at least one populated example (CardComposition's chain) + reader functions used by S2/S3/S4.

### FR-S3 · Pointer breadcrumb (Sprint 2 · Thread A)

**FR-S3.1 — Breadcrumb component**
- `<PointerBreadcrumb chain={[...]} />` at the top of vfx-lab viewport (sticky)
- Renders as: `pantry/earth-jani › effect:card-composition › consumers: [card-lab · battle · showcase]`
- Each segment is clickable: navigates to that entity in the current workspace
- Uses `IconRegistry` for segment-kind glyphs
- Persists across primitive switches (active entity tracked in zustand)

**FR-S3.2 — Active-entity context**
- Zustand slice `useActiveEntity` storing `{slug, primitive, consumers}` for the currently focused entity
- All consumers (CardFace, CodexCardFace, CardComposition) emit `activeEntity` changes when rendered in lab context

**FR-S3.3 — Per session 22 §5.1 doctrine compliance**
- Editing any path on the breadcrumb that touches a validated render path triggers the regression check from FR-S1.2

### FR-S4 · Inspector side panel (Sprint 2 · Thread B)

**FR-S4.1 — Right-rail inspector** (Q4 ratified: side panel, NOT hover-modal)
- Slides in from right on selection
- Tabs (Figma-shaped):
  - **Pointer chain**: full pointer hierarchy with source paths
  - **Data**: raw layers.json (or whatever spec the entity has)
  - **Render**: read-only summary of computed render properties (className, dimensions, theme)
  - **Edit**: minimal affordances (rename, override, copy-pointer)
- Width: ~320px, collapsible, persisted

**FR-S4.2 — Selection model**
- Click any card/layer/effect in vfx-lab → opens Inspector
- Replaces always-on `PointerChip` overlay with click-to-inspect surface (PointerChip becomes opt-in `data-inspectable` indicator)
- Selection state in `useSelection` zustand slice

**FR-S4.3 — Inspector for all 9 effects** (cycle DoD precondition)
- Each effect must register an `inspectorAdapter` describing its inspectable nodes + their pointer chains
- Adapter signature lives in `lib/lab/adapter-registry/inspector-adapter.ts` (per Flatline IMP-003 — adapter contracts belong in `lib/lab/`, not `lib/regression/`; regression substrate concerns geometry, adapters concern composability/inspection)

### FR-S5 · Composability panel (Sprint 3 · Thread C)

**FR-S5.1 — Three sketched shapes**
- Shape A: **Figma-literal** layers panel (flat-or-nested, eye/lock icons, click to select)
- Shape B: **Figma + pointer-chain** layers panel (entity rows show full pointer chain inline)
- Shape C: **Godot-shaped tree** (nested tree with columns: scene-ref, override-state, source-path)

**FR-S5.2 — Live shape-switcher in vfx-lab**
- Toggle in panel header switches between A/B/C
- Renders against the same active entity tree
- Operator picks the canonical shape; the other two ship as available-but-unused (cleanup in next cycle once decided)

**FR-S5.3 — Placement** (Q5 ratified: left rail)
- Left-anchored panel, ~280px wide, collapsible
- Mirrors Figma's layers-panel position
- Persists collapse state per workspace

**FR-S5.4 — Entity discovery**
- Each primitive registers a `composabilityAdapter` (shape-mirror of inspectorAdapter) returning the entity tree for its current state
- Adapter signature lives in `lib/lab/adapter-registry/composability-adapter.ts` (per Flatline IMP-003 — same location move as FR-S4.3)

### FR-S6 · Workspaces tab switcher (Sprint 4 · Thread D)

**FR-S6.1 — Three workspaces** (Q6 ratified: top tabs)
- `Compose` — current vfx-lab default; inspector right, composability left, breadcrumb top
- `Preview` — primitive at viewport center, no chrome, theme switcher visible
- `Export` — meta panel for asset generation / handoff to codex

**FR-S6.2 — Layout state per-workspace**
- `useWorkspace` zustand slice keyed by workspace ID
- Each workspace persists: active entity · panel collapse state · knob values · camera/scrub state
- Switching workspaces preserves state of the workspace you left

**FR-S6.3 — Tab UI**
- Top-of-viewport horizontal tabs with `IconRegistry` glyphs (compose / preview / export)
- Active tab visually distinct (active-tab style follows OKLCH palette token)
- Keyboard: `Cmd/Ctrl + 1/2/3` switches workspaces

### FR-S7 · Phosphor port + legacy retrofit (Sprint 5 · Thread F + cycle DoD)

**FR-S7.1 — Full IconRegistry adoption across lab + game UI**
- All lab chrome (vfx-lab, KnobPane, effect picker) routes icons through `IconRegistry`
- Game UI (battle-v2 HUD, HandRack, CardFace overlays, CardShowcase, ZoneOverlay) routes icons through `IconRegistry`
- `lucide-react` allowed only inside `lib/ui/icons/` provider modules

**FR-S7.2 — Legacy 9 effects retrofit**
- All 9 effects in `app/battle-v2/_components/vfx/effects/*`:
  - register an `inspectorAdapter`
  - register a `composabilityAdapter`
  - render a `data-inspectable` attribute on root
  - have at least one regression snapshot baseline (FR-S1.3)
- Retrofit is additive; the existing render path is preserved (operator-validated → no risk).

**FR-S7.3 — Final polish pass**
- Knob labels audit for icon affordances
- Status footer consistency check
- Empty/loading/error states across new chrome
- Final visual sweep against `composite.webp` baselines for known cards

**FR-S7.4 — Cycle demo**
- Operator demoes the lab end-to-end: workspaces · breadcrumb · inspector · composability shape-picker · icon swap demo · canary regression triggers a block
- Demo recording committed to `grimoires/loa/distillations/session-22-lab-evolution-demo.md`

---

## §6 · Non-functional requirements

### NFR-Perf

- Hook latency budget: < 8s P95 for affected-primitive snapshot subset; fail-open with warning above
- Inspector / breadcrumb / composability render: < 16ms (60fps) on M4
- IconRegistry lookup: O(1) constant-time; no runtime tree walks
- Workspace switch: < 100ms (state restore, not re-mount)

### NFR-Stability

- Zero-regressions on operator-validated surfaces (`/`, `/demo`, battle-v2 working tree as of HEAD)
- All snapshot baselines version-controlled; updates require explicit `pnpm regression:approve <primitive>`
- The canary test (FR-S1.4) must fail before fix and pass after — proves substrate works

### NFR-Substrate-discipline

- All cycle-introduced primitives ship as `lib/<thing>/` (Effect port/live/mock pattern)
- No primitive lives in `app/battle-v2/*` if it's reusable across zones
- Adapter pattern (inspectorAdapter, composabilityAdapter) is the contract surface between primitives and substrate
- Per `feedback_compass-learns-honeycomb-graduates.md`: substrate proven here is graduation-eligible to honeycomb/freeside after cycle end

### NFR-Pointer-visibility (operator-named structural)

- No render entity ships without a visible pointer chain at the surface
- "Surface" = top-of-viewport, side-panel, or composability panel — NOT devtools, NOT inline HTML comments
- The pointer chain is itself authored data, not duplicated inline (single source of truth for each pointer segment)

### NFR-Figma-anchor (operator-stated)

- All new UX patterns lead with Figma analogue
- When a Figma equivalent doesn't exist, document the deviation in SDD with rationale
- Inspector right-rail · Composability left-rail · Workspaces top-tabs are Figma-aligned positions

### NFR-Construct-domain-boundaries

- Cycle composes constructs explicitly per `OperatorOS v3.3`:
  - **the-arcade** (primary, BARTH) — SHIP discipline
  - **artisan** (lens, ALEXANDER) — craft / taste compliance
  - **k-hole** (lens, STAMETS) — dig grounding (3 digs returned)
  - **vfx-playbook** (lens) — pointer-chain at title-bar (P2), reference pane (P3), tier-stamps as gate (P6)
- Cross-construct findings (vfx-playbook + the-arcade convergence) carry forward in PRD section §1

---

## §7 · Acceptance criteria (cycle DoD)

Cycle ships when all of the following pass:

1. **Substrate fuse live** — Canary test (FR-S1.4) blocks an intentional CodexCardFace mutation. Hook + Vitest both fire on the canary.
2. **Pointer chain at the surface** — Open vfx-lab on any of the 9 effects → see the breadcrumb · open Inspector → see the chain · open Composability panel → see the tree.
3. **Composability shape picked** — Operator has selected one of A/B/C shapes and confirmed it as canonical.
4. **Workspaces multi-mode** — Switch between Compose/Preview/Export · each preserves layout state · keyboard shortcuts work.
5. **Icon swap demo works** — Toggle Phosphor↔Stub in vfx-lab; all icons across lab + game UI flip live.
6. **All 9 effects retrofitted** — Each has `inspectorAdapter`, `composabilityAdapter`, snapshot baseline, and Phosphor icons via registry.
7. **No `/` or `/demo` regressions** — Pre/post visual sweep clean.
8. **One PR per sprint merged** — S1·S2·S3·S4·S5 each have their own draft PR landed on `feat/ecs-leaves-2026-05-17` with operator approval.
9. **Distillation written** — `grimoires/loa/distillations/session-22-lab-evolution-demo.md` captures the cycle's substrate commitments and what survived.

---

## §8 · Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Hook latency exceeds budget on full snapshot run | Med | Med | Per-primitive snapshot subset (not full lab); fail-open with warning; budget enforced |
| R2 | Canary test pattern doesn't generalize beyond CodexCardFace | Med | Med | Each primitive gets its own canary in S5 retrofit; pattern documented for reuse |
| R3 | IconRegistry abstraction over-engineered vs ROI | Low | Low | Stub provider proves the swap; if registry feels heavy in practice, post-cycle distill captures the over-engineering |
| R4 | Composability shape-picker leaves vfx-lab cluttered | Med | Low | Header toggle; only one shape rendered at a time; the other two are dead code until cycle 23 cleanup |
| R5 | Workspace state restoration causes stale-knob bugs | Low | Med | Per-workspace zustand slice with explicit reset action; documented reset affordance |
| R6 | Legacy 9-effect retrofit takes longer than S5 budget | High | Med | Substrate ships with 1 effect retrofitted (proof) by end of S2; remaining 8 in S5 with explicit cut-line. **Cycle DoD is ALL 9 retrofitted (G6 invariant). If S5 budget is exceeded, the cycle does not close — operator pair-points to either extend S5 or formally amend the PRD to a smaller inventory (revising G6 + the inventory lock). Per Flatline IMP-006: no silent deferral.** |
| R7 | Adapter pattern misaligned with how effects actually compose | Med | Med | First adapter (CardComposition) drives the design; pattern hardens before retrofit pass |
| R8 | Branch state messy (uncommitted in-flight work) collides with sprints | Med | Med | Operator commits in-flight work before S1 branches (per branch-strategy decision); each sprint branches off a clean state |
| R9 | Flatline degraded mode misses architectural issues | Med | High | Bridgebuilder 3.5 runs on SDD (operator opted in); architectural fresh-eyes covers degraded Flatline |
| R10 | Vitest snapshot baselines drift quietly | Med | Med | `pnpm regression:approve` is explicit ceremony; PR diff shows baseline changes; reviewer flags suspicious updates |

---

## §9 · Dependencies

### Internal
- `lib/effect-substrate/*` — existing Effect port/live patterns (consume; do not modify)
- `app/battle-v2/_components/cards/CodexCardFace.tsx` — session 22 deliverable, validated baseline
- `app/battle-v2/_components/vfx/effects/CardComposition.tsx` — session 22 deliverable, validated baseline
- `lib/cards/codex/*` — session 22 substrate; consumed unchanged
- `public/codex/cards/earth-jani/*` — vendored content; provides composite.webp baseline
- `app/globals.css` — OKLCH palette tokens; consumed unchanged

### External (npm)
- `@phosphor-icons/react` — new (first provider for IconRegistry)
- `vitest` + `@vitest/snapshot` — already in repo (confirm in SDD)
- `pixelmatch` or `looks-same` — new (for boundingBox + image diff in regression substrate; choose in SDD per perf budget)
- `zustand` — already in repo

### Tooling
- Claude Code PreToolUse hook infrastructure (existing per `.claude/hooks/`)
- pnpm 10.x (existing)
- TypeScript 5 (existing)

### Process
- One PR per sprint via `gh pr create --draft`; merged on operator approval
- Bridgebuilder 3.5 design review on SDD (operator opted in)
- Sprint review + audit gates per `/run sprint-plan` standard

---

## §10 · Sprint shape (preview; sprint plan authoritative)

**Post-Flatline-sprint-review shape (7 sprints):**

| Sprint | Threads | Goal | Risk |
|---|---|---|---|
| **S0** | Calibration spike (Playwright + Docker, self-deletes per cycle-1 doctrine) | Pipeline validated · delta-check passes · spike script removed | R11 |
| **S1a** | Regression substrate (pre-commit hook + PostToolUse:WARN + baselines + governance) | Fuse live (authoritative pre-commit gate · WARN-only PostToolUse) · 3 representative baselines + validated-surface baselines · canary passes · rollback runbook | R1, R12 |
| **S1b** | UI substrate (IconRegistry · pointer-chain schema **@draft-S1** · adapter registry types · runtime wiring) | Icon swap demo works · schema in draft · static adapter-registration model | R3 |
| **S2** | Thread A breadcrumb · Thread B inspector | First inspector adapter on CardComposition (static-registered); pointer chain visible | R7 |
| **S3** | Thread C composability panel (3 shapes) · **schema locks here** | Shape-picker live; operator selects canonical shape; schema goes to @v1.0 | R4, R14 |
| **S4** | Thread D workspaces tab switcher | Multi-mode validated; layout state persists | R5 |
| **S5** | Thread F phosphor port + legacy 9-effect retrofit + **determinism playbook** + demo | Cycle DoD met (all 9 retrofitted, NO silent deferral per IMP-006); demo recorded | R6, R8 |

See `grimoires/loa/sprint.md` for the full task list, dependency diagram, and ADR-9 through ADR-14 (added post-sprint-review).

---

## §11 · Open questions resolved in clarification round

All §8 brief questions answered by operator during PRD-prep AskUserQuestion round (2026-05-18):

| Q | Resolution |
|---|---|
| Q4 inspector shape | Side panel (Figma right-rail) |
| Q5 composability placement | Left rail (Figma layers position) |
| Q6 workspaces visual | Top tabs (Figma-shaped) |
| Q7 regression mech | Hook + Vitest dual layer, both as substrate (`lib/regression/`) |
| Q8 phosphor scope | Full lab + game-UI port via `IconRegistry` |
| Q9 legacy 8 effects | S5 retrofit (overrides brief's "grandfather" recommendation) |
| Composability panel shape | Sketch all 3 in vfx-lab, operator picks (explore-don't-lock) |
| Cycle DoD | All 9 effects expose pointer chains + participate in Inspector |
| PR shape | One draft PR per sprint, merged on operator approval |
| Branch root | Commit in-flight · sprints branch off feat/ecs-leaves-2026-05-17 |
| Bridgebuilder 3.5 | Run it |

---

## §12 · Doctrine grounding (load-bearing references)

The cycle materializes these doctrine commitments:

- `feedback_kitchen-as-backend-composition-pattern.md` — the lab IS the kitchen; this cycle hardens its surface
- `feedback_pointers-as-agentic-engine-infrastructure.md` — pointer-chain spine is the cycle's defining commitment
- `feedback_figma-mental-anchor-for-composability.md` — Figma analogues lead every UX decision
- `feedback_regression-checks-are-substrate-not-ceremony.md` — Sprint 1 ships this commitment as code
- `feedback_compass-learns-honeycomb-graduates.md` — `lib/regression/` and `lib/ui/icons/` are graduation candidates
- `feedback_substrate-not-ui-islands.md` — adapters are the seam between primitives and substrate
- `feedback_explore-dont-lock.md` — Thread C ships 3 shapes for operator pick
- `feedback_pair-validate-questions-before-firing.md` — pointer-trace before mutating validated surfaces
- `feedback_creative-teaching-needs-visuals-not-text.md` — digs returned with visual refs (Prokopov screenshots, Linear Matrix View, Chromatic samples)
- `feedback_recursive-candor-as-first-proof.md` — the canary test IS the regression substrate inhabiting its own spec

External grounding (from digs):
- Prokopov "Pointer Chips" + "Inspector Breadcrumbs" — validates our naming + structural choices
- Mark Dalgleish / Playwright `boundingBox` JSON snapshots — direction-forming for FR-S1.3 (geometry as mathematical invariant)
- Linear "Matrix View" + Storybook Addon Measure — direction-forming for permutation testing
- Godot NodePath / RID + Unity `m_Modifications` — long-horizon doctrine for pointer-stability (cycle 23+)
- Pixar Hydra Scene Delegate · Figma Component Properties · Bret Victor live-link — capability-driven rendering vision (post-cycle)

---

## §13 · Success metrics

| Metric | Target | Measurement |
|---|---|---|
| Render regressions caught by substrate | ≥1 in canary, 0 in operator review | Canary test status + post-cycle distillation |
| Time to swap icon library | < 5 minutes end-to-end | Manual timing of provider swap in S5 |
| Effects participating in inspector | 9/9 | Adapter registry count |
| Hook latency P95 | < 8s | Hook telemetry to `.run/audit.jsonl` |
| Operator-stated friction reduction | Operator names ≥2 of the 5 frictions (F1-F5) as resolved | Session 22+1 distillation |
| Substrate ports graduation-ready | 2 (`lib/regression/`, `lib/ui/icons/`) | Honeycomb construct intake review post-cycle |

---

## §14 · Flatline PRD review integration (2026-05-18)

3-model Flatline (codex-headless + claude-headless + gemini-3.1-pro-preview) ran on this PRD. Result: **75% model agreement, 7 HIGH_CONSENSUS, 3 DISPUTED, 0 BLOCKERS**. Full output at `grimoires/loa/a2a/flatline/lab-evolution-prd-2026-05-18.json`.

HIGH_CONSENSUS findings integrated into PRD:

| Finding | Score | Resolved in |
|---|---|---|
| IMP-001 hook-timing causal inversion | 900 | FR-S1.2 stage-and-render execution model |
| IMP-002 boundingBox vs pixel-diff hierarchy | 860 | FR-S1.3 assertion hierarchy table |
| IMP-003 adapter location (lib/regression vs lib/lab) | 790 | FR-S4.3 + FR-S5.4 path corrections |
| IMP-004 pre-sprint inventory task | 770 | G6 + S1.T0 + sprint shape preview |
| IMP-005 zero-regression reference + threshold | 860 | G7 reference commit + capture method block |
| IMP-006 R6/G6 contradiction (defer vs all-9) | 845 | R6 row revised to "no silent deferral" |
| IMP-007 shared pointer-chain schema before S3 | 860 | New FR-S2.5 schema-lock requirement |

DISPUTED items (3) presented to operator for ratification during Phase 2 HITL — outcomes folded into SDD §11 open questions.

---

*PRD authored 2026-05-18 during /simstim Phase 1. Direction crystallized via 4-round AskUserQuestion clarification with operator. Flatline PRD review integrated (Phase 2). Sprints branch off `feat/ecs-leaves-2026-05-17` after in-flight work commits. Bridgebuilder 3.5 enabled for SDD review.*
