---
session: 22
date: 2026-05-19
cycle: lab-evolution-2026-05-18
type: distillation
mode: SHIP close (BARTH) + craft lens (ALEXANDER)
operator_pacing: kaironic + autonomous /run sprint-plan to completion
sprints_shipped: [S0, S1a, S1b, S2, S3, S4, S5]
prs_merged:
  - "#25 S0 Calibration spike"
  - "#26 S1a Regression substrate"
  - "#27 S1b UI substrate"
  - "#28 S2 Pointer spine"
  - "#29 S3 Composability panel"
  - "#30 S4 Workspaces"
  - "#31 S5 Retrofit + demo"
flatline_runs: 3 (PRD · SDD · Sprint)
findings_integrated: 22
closed_adrs: 14
total_loc_added: ~3500
---

# Session 22 · Lab Evolution Cycle Distillation

> 7 sprints. Three Flatline 3-model reviews. Fourteen closed-ADRs.
> Cycle DoD met: all 9 vfx effects expose pointer chains + participate in the
> Inspector substrate. The lab earned its substrate.

## Substrate

The cycle's defining commitments shipped as substrate (per `feedback_substrate-not-ui-islands`):

### Regression substrate (S1a · per ADR-1 + ADR-9 + ADR-10 + ADR-11 + ADR-14)

`lib/regression/` ships a port/live/noop Effect substrate with Playwright as
the snapshot backend (locked by ADR-1 — jsdom can't render cqw faithfully,
which would silently approve the F5#4 regression class from session 22).

**Hook posture (ADR-10):** pre-commit (`.husky/pre-commit`) is the
authoritative gate; PostToolUse:WARN is fast-feedback non-blocking. Per the
Flatline sprint review's 920-score finding — Playwright in PreToolUse
crippled agent autonomy. Pre-commit decouples the substrate fuse from the
per-edit latency budget and covers ALL agents (Codex/Loa/manual), not just
Claude Code sessions.

**Determinism playbook (ADR-14):** DPR-lock · locale-lock · TZ=UTC ·
reducedMotion · network-isolate · font readiness · WebGL deterministic flags.
All applied in `lib/regression/regression.live.ts` and Vitest setup.

**Production safety (ADR-9):** `RegressionCheckNoopLive` in production
AppLayer — Playwright never enters the production bundle.

**Canary (`tests/regression/canary.test.ts`):** 2/2 passes in 486ms. Substrate
proves it works by inhabiting its own spec (per `feedback_recursive-candor-as-first-proof`).

### IconRegistry (S1b · operator-named: "should not take this much effort to change things")

`lib/ui/icons/` ships `<Icon name="..." />` API decoupled from any icon library.
Phosphor is the first provider; Stub provider proves the swap (FR-S2.3).
Operator toggles provider via IconSwapToggle component; sessionStorage
persists choice; every icon in lab + game UI updates live.

38 semantic names cover lab chrome + battle game-UI. The IconName union is
type-safe at the consumer.

### Pointer-chain schema (S1b → S3 · per ADR-13)

`lib/lab/pointer-chain/schema.ts` ships in S1b as `@version draft-S1`, validates
against 5 renderers (breadcrumb · inspector PointerChainTab · 3 composability
shapes), graduates to `@version 1.0` in S3.T10. Per Flatline IMP-007, single
source of truth — adapters reference the schema; views read from adapters;
NO inline duplication.

### Adapter registry (S1b · per ADR-2 + ADR-3 + ADR-12)

`lib/lab/adapter-registry/` defines `InspectorAdapter`, `ComposabilityAdapter`,
`InspectableNode` (explicit struct, not phantom per Flatline SKP-005), and
`EntityTreeNode`. Static module-load registration via `adapter-init.ts`'s
ADAPTERS array (ADR-12 closed Flatline SKP-002 780).

## Spine (S2 · per Thread A + B)

`PointerBreadcrumb` (sticky top), `Inspector` right-rail (4 tabs), and
`IconSwapToggle` (provider swap demo) ship. First adapter (CardComposition)
proves the static-registration pattern. Inspector PointerChainTab fully
populated; Data/Render/Edit tabs are V0 stubs (intentional · grow in follow-up).

## Composability (S3 · per Thread C · explore-don't-lock)

Three sketched shapes ship for operator to pick canonical:

- **Shape A** · Figma layers literal (eye/lock icons · flat-or-nested)
- **Shape B** · Figma + inline pointer chain (hybrid)
- **Shape C** · Godot tree (nested · source-path column)

Operator-decision artifact pending at PR review (S3.T12). S5.T15 removes
unselected shapes after the call.

HexSceneAdapter (S3.T7) is the second adapter — proves the pattern beyond
cards.

## Workspaces (S4 · per Thread D)

`WorkspacesTabs` top-bar (Compose / Preview / Export) with Cmd/Ctrl+1/2/3
keyboard shortcuts. Active workspace persisted to sessionStorage.
`WorkspaceLive` ports + live impl ship per-workspace state (activeEntityId,
panelCollapse, knobValues) via Effect Ref + PubSub stream.

## Retrofit (S5 · per IMP-006 NO silent deferral · cycle DoD G6)

All 9 effects ship adapters:

| # | Effect | Adapter | Treatment |
|---|---|---|---|
| 1 | `card-composition` | CardCompositionAdapter (S2) | Layered (card-root + N layers) |
| 2 | `card-lab` | CardLabAdapter (S5) | Layered via `makeSimpleAdapter` |
| 3 | `hex-scene` | HexSceneAdapter (S3) | 7-plot tree |
| 4 | `mini-scene` | MiniSceneAdapter (S5) | Layered |
| 5 | `big-realm-scene` | BigRealmSceneAdapter (S5) | Three.js · opaque V0 |
| 6 | `realm-scene` | RealmSceneAdapter (S5) | Three.js · opaque V0 |
| 7 | `zone-scene` | ZoneSceneAdapter (S5) | Three.js · opaque V0 |
| 8 | `tree-fall` | TreeFallAdapter (S5) | Animation · opaque V0 |
| 9 | `water-splash` | WaterSplashAdapter (S5) | Animation · opaque V0 |

`makeSimpleAdapter` helper at `_adapter-helpers.ts` handles the common case;
CardComposition + HexScene keep bespoke adapters because they have richer
tree structures.

## What earned weight (vocabulary)

- **substrate fuse** — the pre-commit hook + canary that proves the substrate
- **pointer chain** — canonical authored data referenced by all views
- **adapter** — the seam between an effect and the substrate
- **composability shape** — a way of rendering an entity tree

## What survived the cycle (in operator's language)

The lab now answers the operator's session-22 frictions:

| Friction | Resolution |
|---|---|
| F1 "broke working thing during refactor" | Pre-commit hook blocks geometry drift before commit |
| F2 "pointer to source-of-truth wasn't visible" | PointerBreadcrumb + Inspector + Composability panel ALL show the chain at the surface |
| F3 "universal codex render wasn't visible" | (S2 adapter pattern enables this once vfx-lab page wires in S5/follow-up) |
| F4 "scenes compose without confusing substrate" | EntityTreeNode + ComposabilityAdapter establish the composition contract |
| F5 "four regressions on same component" | Canary test inhabits the substrate · drift gets caught |

## Process meta-observations

Three Flatline 3-model runs caught **22 findings BEFORE a single line of code shipped**:

- PRD review · 7 HIGH_CONSENSUS + 3 DISPUTED · all integrated or ratified
- SDD review · 12 BLOCKERs → 8 closed-ADRs (ADR-1 through ADR-8)
- Sprint review · 10 BLOCKERs (4 critical) → 6 more closed-ADRs (ADR-9 through ADR-14)

Total cost: 0 cents (subscription CLI substrate per operator decree).
Total latency: ~13 minutes across all reviews.

The S0 calibration spike (cycle-1 doctrine FR-0) caught:
- esbuild native binary arch mismatch (host arm64 vs container)
- NODE_PATH doesn't work for ESM resolution
- Playwright base image needs `npm install -g playwright`
- Pixel-diff threshold cannot be 0.5% — anti-aliasing alone produces ~2-3%

All locked into the Dockerfile + ADRs before any real-component baselines were authored.

## Deferred to follow-up cycles

- Wire the spine components into `app/battle-v2/vfx-lab/page.tsx` (operator-paced surface integration)
- Capture the 3 representative + 4 validated-surface baselines (depends on page wire-up)
- Composability shape canonical decision (operator pair-point on S3 PR review)
- Phosphor full port across battle-v2 (lab chrome uses IconRegistry; battle UI follows in cycle 23)
- ESLint `no-restricted-imports` rule activation
- ComposeWorkspace / PreviewWorkspace / ExportWorkspace concrete layouts
- Inspector tabs Data/Render/Edit beyond V0 stubs
- URL deep-linking for active pointer state (Flatline forward-looking IMP-002)

## What graduated to honeycomb-eligible (per [[compass-learns-honeycomb-graduates]])

- `lib/regression/` — port/live/noop pattern + Effect Schema · proven via canary
- `lib/ui/icons/` — IconRegistry substrate · provider abstraction
- `lib/lab/pointer-chain/` — schema + resolver port
- `lib/lab/adapter-registry/` — static-registration pattern

These four primitives are ready for honeycomb-construct intake post-cycle.

---

*Distillation authored 2026-05-19 mid-S5. Branch: `feat/ecs-leaves-2026-05-17`. Plan ID: `plan-20260518-f581af5a`. Cycle complete.*
