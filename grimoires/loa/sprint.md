---
cycle: lab-evolution-2026-05-18
session: 22 (entry)
type: sprint plan
status: candidate (post-Flatline sprint review · operator-ratified 2026-05-18)
date: 2026-05-18
mode: ARCH (OSTROM) + craft lens (ALEXANDER)
simstim_id: simstim-20260518-f581af5a
prd: grimoires/loa/prd.md
sdd: grimoires/loa/sdd.md
branch_root: feat/ecs-leaves-2026-05-17
sprints:
  - id: S0
    title: Calibration spike (Playwright + Docker, half-day budget, self-deletes per cycle-1 doctrine)
  - id: S1a
    title: Regression substrate (port + Playwright + baselines + hooks · pre-commit + PostToolUse:WARN)
  - id: S1b
    title: UI substrate (IconRegistry + pointer-chain schema draft + adapter registry types + runtime wiring)
  - id: S2
    title: Pointer breadcrumb · Inspector right-rail · First adapter
  - id: S3
    title: Composability panel (3 sketched shapes · operator picks · schema locks here)
  - id: S4
    title: Workspaces tab switcher (Compose · Preview · Export)
  - id: S5
    title: Phosphor port · Legacy 9-effect retrofit · Determinism playbook applied · Cycle demo
pr_shape: one draft PR per sprint, merged on operator approval
constraints:
  - All sprints branch off feat/ecs-leaves-2026-05-17 (after operator commits in-flight work)
  - Per-sprint preflight verifies prior-merge base SHA before branching (per Flatline SKP-002 760)
  - NO edits to operator-validated render paths until S1a regression substrate is live + S0 spike passed
  - Beads task per FR; task lifecycle via `br` not TaskCreate
  - Bridgebuilder review runs on S1a PR (operator-elected — replaces Phase 3.5)
  - Pre-commit hook (.husky/pre-commit) is the AUTHORITATIVE gate · Claude hooks emit WARN only
  - RegressionCheckLive env-gated (production = noop layer)
flatline_reviews:
  - grimoires/loa/a2a/flatline/lab-evolution-prd-2026-05-18.json
  - grimoires/loa/a2a/flatline/lab-evolution-sdd-2026-05-18.json
  - grimoires/loa/a2a/flatline/lab-evolution-sprint-2026-05-18.json
---

# Sprint Plan · Lab Evolution Cycle — 2026-05-18

> Seven sprints. Substrate-first, calibration-first. Each sprint = one draft PR. The pre-commit hook is the substrate fuse — fires for ALL agents, can't self-lock, can't be bypassed by Bash.

## §0 · Pre-flight (before S0 branches)

| # | Task | Owner | Acceptance |
|---|---|---|---|
| P0.1 | Operator commits in-flight working-tree changes on `feat/ecs-leaves-2026-05-17` | operator | `git status` clean; HEAD references in-flight work |
| P0.2 | Agent confirms artifact paths + checksums | agent | PRD/SDD/sprint artifact present + checksums match `.run/simstim-state.json` |
| P0.3 | Per-sprint base-SHA template ready | agent | `grimoires/loa/cycles/lab-evolution-2026-05-18/preflight-template.md` enumerates the per-sprint preflight protocol |

---

## §S0 · Calibration spike (Playwright + Docker delta-check)

**Goal:** Validate the Playwright + Docker pipeline against a known fixture BEFORE any S1 baselines are authored. Per cycle-1 doctrine (FR-0 contract): script self-deletes post-audit.

**Budget:** half-day max. If non-zero pixel delta between local Playwright and Docker Playwright, ADR-1 / ADR-8 need revision before S1a commits.

**Branch:** `feat/lab-evolution-s0-spike` off `feat/ecs-leaves-2026-05-17`

**Acceptance gates:**
- Static fixture div (100×50 px, known background color) captured via local Playwright + Docker Playwright
- Geometry boundingBox matches exactly (±0px) across both
- PNG pixel delta documented (target: 0 px difference; tolerable: < 100 pixels with reason)
- Calibration script self-deletes after audit per cycle-1 FR-0 contract
- Spike artifact: `grimoires/loa/cycles/lab-evolution-2026-05-18/s0-calibration-report.md`

### Sprint S0 tasks

| Task | Title | Acceptance |
|---|---|---|
| **S0.T1** | Install Playwright + Chromium | `pnpm add -D playwright pixelmatch pngjs` + `pnpm playwright install chromium` succeeds |
| **S0.T2** | Write calibration script | `scripts/spikes/s0-calibration.ts` — renders static div, captures PNG, prints boundingBox + sha256 |
| **S0.T3** | Run local Playwright capture | Outputs `spike-output/local-fixture.png` + `local-fixture.json` |
| **S0.T4** | Build Docker image | `tests/snapshots/Dockerfile` (node:20-bookworm + playwright base image + repo fonts). `docker build` succeeds. |
| **S0.T5** | Run Docker Playwright capture | Mount host dir; outputs `spike-output/docker-fixture.png` + `docker-fixture.json` |
| **S0.T6** | Delta-check + report | pixelmatch on the two PNGs; boundingBox JSON compare. Write `s0-calibration-report.md` with: install times, capture times, delta px count, decisions for ADR-1/ADR-8. |
| **S0.T7** | Self-delete spike | Delete `scripts/spikes/s0-calibration.ts` per cycle-1 FR-0 contract. Audit + report retained. |
| **S0.T8** | Open draft PR for S0 | "S0 · Playwright + Docker calibration spike". Body includes the calibration report inline. |
| **S0.T9** | Operator pair-point | If delta > 100 px or boundingBox drift, operator decides: extend S0 to refine OR amend ADR-1/ADR-8 before S1a. |
| **S0.T10** | Merge S0 PR | Even if delta is acceptable, the report stays on record; the spike script does not. |

**Cut-line:** if S0 reveals Playwright/Docker pipeline is fundamentally broken (e.g., Docker can't load fonts, Chromium can't render cqw deterministically), HALT cycle + pair-point with operator on backend strategy revision. No silent proceed.

---

## §S1a · Regression substrate (post-Flatline-rewrite hook posture)

**Goal:** Land the substrate fuse using the post-Flatline posture: **pre-commit hook (`.husky/pre-commit`) is the authoritative gate; PostToolUse:WARN provides fast feedback**. Operator-validated surfaces baselined. Hooks fire for ALL agents.

**Branch:** `feat/lab-evolution-s1a-regression` off `feat/ecs-leaves-2026-05-17` (post-S0 merge)

**Acceptance gates:**
- Canary test (FR-S1.4) fails on intentional drift, passes on baseline state
- Pre-commit hook blocks commit on regression detection (verified with intentional drift)
- PostToolUse:Write|Edit|Bash hook emits WARN on regression detection (non-blocking)
- 3 representative primitives baselined (CodexCardFace · CardComposition · HexScene) + validated-surface baselines (`/`, `/demo`, `/battle-v2`, `/battle-v2/vfx-lab`)
- Determinism playbook applied: time mocks · animation freeze · locale lock · network isolation · font readiness · WebGL deterministic mode
- `pnpm regression:check`, `pnpm regression:approve`, `pnpm regression:canary`, `pnpm regression:bypass` scripts ship
- Rollback runbook at `grimoires/loa/runbooks/regression-hook-rollback.md`
- RegressionCheckLive is env-gated (NOT in production AppLayer)

### Sprint S1a tasks

| Task | Title | Acceptance |
|---|---|---|
| **S1a.T0** | Effect inventory + reference-commit lock | `grimoires/loa/cycles/lab-evolution-2026-05-18/effect-inventory.md` lists 9 effects + slug + path. Reference commit `7a179bce` recorded. |
| **S1a.T1** | Per-sprint preflight template active | Verify HEAD of `feat/ecs-leaves-2026-05-17` contains S0 merge commit (per SKP-002 760). Record base SHA in PR body when opened. |
| **S1a.T2** | `lib/regression/regression.port.ts` + schema | Context.Tag + Effect Schema for Snapshot/Baseline/DiffResult/RenderTarget. Typecheck passes. |
| **S1a.T3** | `lib/regression/regression.live.ts` (Playwright backend) | Implements port per SDD §5.2. Reuses browser per worker. DPR-locked viewport. |
| **S1a.T4** | `lib/regression/regression.noop.ts` (production layer · ADR-9) | No-op implementation. Production AppLayer uses this. Satisfies port interface. |
| **S1a.T5** | `lib/runtime/runtime.ts` env-gated layer wiring | `if (process.env.NODE_ENV === 'development' \|\| process.env.LOA_REGRESSION === '1') { RegressionCheckLive } else { RegressionCheckNoop }`. Production bundle does NOT include Playwright. |
| **S1a.T6** | `lib/regression/baseline-store.ts` | Read/write baselines under `tests/snapshots/lab/`. sha256-deterministic. |
| **S1a.T7** | `tests/regression/setup.ts` + render-helpers (determinism playbook applied) | `mountPrimitive(...)` with: time mock (`vi.useFakeTimers()`), animation-freeze (set `prefers-reduced-motion: reduce` via emulateMedia), locale lock (`navigator.language: en-US`), timezone lock (`TZ=UTC`), network isolation (Playwright `route("**", abort)` for external), font readiness (`document.fonts.ready`), WebGL deterministic flags. |
| **S1a.T8** | Vitest harness HTML | Self-contained page; exposes `window.__mount__(args)`. Loaded by Playwright. |
| **S1a.T9** | `pnpm regression:check` script | Filters Vitest to single primitive. JSON diff output. |
| **S1a.T10** | `pnpm regression:approve` script (Docker per ADR-8) | Runs capture inside Docker. Requires `--reason` flag (per IMP-010). Audits to `.run/audit.jsonl`. |
| **S1a.T11** | `pnpm regression:canary` script | Runs canary test (FR-S1.4) + reports outcome. |
| **S1a.T12** | `pnpm regression:bypass` script (rollback runbook) | Sets `LOA_REGRESSION_HOOK_BYPASS=1` for the operator session. Audited. |
| **S1a.T13** | Docker baseline-capture image | `tests/snapshots/Dockerfile` + `baseline-capture.sh`. S0 already verified this works. |
| **S1a.T14** | Capture 3 representative baselines | CodexCardFace · CardComposition · HexScene at scales [0.5, 1, 2] × theme [light, dark]. Commit. |
| **S1a.T15** | Capture validated-surface baselines | `/`, `/demo`, `/battle-v2`, `/battle-v2/vfx-lab` at 1280×800 dark. Commit. |
| **S1a.T16** | Canary test | `tests/regression/canary.test.ts` — proves substrate flags +5% width drift. |
| **S1a.T17** | Pre-commit hook (.husky/pre-commit) (ADR-10) | `.husky/pre-commit` calls `pnpm regression:check --staged-only`. BLOCKS commit if regression. Bypass: `LOA_REGRESSION_HOOK_BYPASS=1` env var. Fires for ALL agents. |
| **S1a.T18** | PostToolUse:Write|Edit|Bash hook (Claude Code · WARN-only) | `.claude/hooks/post-tool-use/lab-render-regression.sh` — non-blocking; emits stderr WARN; audits to `.run/audit.jsonl`. Best-effort early signal for Claude Code sessions. |
| **S1a.T19** | Hook registration in `settings.hooks.json` | PostToolUse hook registered. Settings file edit is itself outside the protected path set (no self-lock). |
| **S1a.T20** | Rollback runbook | `grimoires/loa/runbooks/regression-hook-rollback.md`: how to bypass via env var, how to git-revert the hook commit, how to verify hook is inactive. |
| **S1a.T21** | Approve governance (per IMP-010) | `regression:approve --reason "..."` required. CI advisory warning if >3 baselines or >50% updated in one PR. |
| **S1a.T22** | Open draft PR | "S1a · Regression substrate (pre-commit + PostToolUse:WARN)". PR body: base SHA, baseline list, canary status, hook tests run. |
| **S1a.T23** | Bridgebuilder review on S1a PR (per operator) | `bridge-orchestrator.sh` against the open PR. Iterate as findings surface. |
| **S1a.T24** | Sprint review + audit | `/review-sprint S1a` + `/audit-sprint S1a`. |

**Cut-line:** all tasks MUST-PASS. Bridgebuilder CRITICAL findings BLOCK merge until resolved.

---

## §S1b · UI substrate (IconRegistry · pointer-chain schema draft · adapter registry types)

**Goal:** Land the UI substrate primitives needed by S2-S5. Schema marked `@version draft-S1` per ADR-13; locked in S3.

**Branch:** `feat/lab-evolution-s1b-ui-substrate` off `feat/ecs-leaves-2026-05-17` (post-S1a merge)

**Acceptance gates:**
- IconRegistry swap demo flips Phosphor↔Stub live in vfx-lab
- ~30 V0 semantic names registered (per PRD FR-S2.2)
- Pointer-chain schema present as `@version draft-S1` (per ADR-13)
- Adapter registry types defined (`InspectorAdapter`, `ComposabilityAdapter`, `InspectableNode`, `EntityTreeNode`)
- AdapterRegistry port + live wired into AppLayer (dev-gated)
- IconRegistry + AdapterRegistry pass regression check via S1a hooks

### Sprint S1b tasks

| Task | Title | Acceptance |
|---|---|---|
| **S1b.T0** | Per-sprint preflight (base SHA) | Verify HEAD contains S1a merge commit. |
| **S1b.T1** | `lib/ui/icons/Icon.tsx` + registry | Public `<Icon name="..." />` API; map. Type-safe `IconName` union. |
| **S1b.T2** | Phosphor provider | `lib/ui/icons/providers/phosphor.ts` maps ~30 V0 semantic names per PRD FR-S2.2. |
| **S1b.T3** | Stub provider | `lib/ui/icons/providers/stub.ts` — text-fallback for swap demo. |
| **S1b.T4** | `<IconProvider>` context + persisted toggle | Reads/writes `lab.iconProvider` from sessionStorage (per SDD §2.2). |
| **S1b.T5** | `<IconSwapToggle>` in vfx-lab | Top-right of chrome; flips provider live. Visible swap demo (FR-S2.3). |
| **S1b.T6** | `lib/lab/pointer-chain/schema.ts` (`@version draft-S1`) | Per ADR-13: marked draft; `TODO: lock after S3.T9`. Effect Schema for `PointerSegment` union + `PointerChain`. |
| **S1b.T7** | `lib/lab/pointer-chain/pointer-chain.port.ts` + live | Resolver port; consumes adapter registry. |
| **S1b.T8** | `lib/lab/adapter-registry/types.ts` (per ADR-3) | `InspectorAdapter` + `ComposabilityAdapter` + `InspectableNode` + `EntityTreeNode`. JSDoc clarifies surface-side vs substrate boundary. |
| **S1b.T9** | `lib/lab/adapter-registry/adapter-registry.port.ts` + live | Registry stores adapters by primitive ID. **Static registration model (per ADR-12)** — adapters export from each effect's `index.ts`, registry imports them at module load (NOT at mount time). |
| **S1b.T10** | `lib/lab/state/inspector.port.ts` + live | Selection state via Effect Ref + Stream + `useInspectorSelection()` bridge. |
| **S1b.T11** | `lib/runtime/runtime.ts` wiring (env-gated) | Merge `IconRegistryLive` + `AdapterRegistryLive` + `InspectorStateLive`. Env-gated where applicable (IconRegistry is always-on; AdapterRegistry is always-on; RegressionCheckLive remains dev-gated from S1a). |
| **S1b.T12** | Regression check passes for S1b changes | S1a hooks gate the S1b edits. |
| **S1b.T13** | Open draft PR | "S1b · UI substrate (IconRegistry + schema draft + adapter registry)". |
| **S1b.T14** | Sprint review + audit | `/review-sprint S1b` + `/audit-sprint S1b`. |

**Cut-line:** all tasks MUST-PASS. Schema is `@version draft-S1` (NOT locked) — that's intentional per ADR-13.

---

## §S2 · Pointer breadcrumb · Inspector right-rail · First adapter

**Goal:** Pointer chain visible at the surface. First adapter ships using static-registration. Click-to-inspect works.

**Branch:** `feat/lab-evolution-s2-spine` off `feat/ecs-leaves-2026-05-17` (post-S1b merge)

**Acceptance gates:**
- `<PointerBreadcrumb>` renders sticky at top of vfx-lab viewport
- Click any node → Inspector slides in from right (~320px)
- Inspector tabs work (Pointer chain · Data · Render · Edit)
- CardComposition has registered adapter (static-registered per ADR-12); chain renders correctly
- All edits to CardComposition.tsx pass S1a regression substrate

### Sprint S2 tasks

| Task | Title | Acceptance |
|---|---|---|
| **S2.T0** | Per-sprint preflight (base SHA) | Verify HEAD contains S1b merge. |
| **S2.T1** | `<PointerBreadcrumb>` + segment renderer | Sticky top; reads active entity; renders `›`-separated segments with IconRegistry glyphs. |
| **S2.T2** | `<Inspector>` right-rail container | Width 320px, collapsible, persisted (sessionStorage per SDD §2.2). Slides in/out. |
| **S2.T3** | Inspector tab: Pointer chain | Full chain vertically; source-path per segment. |
| **S2.T4** | Inspector tab: Data | Read-only JSON tree of entity data. |
| **S2.T5** | Inspector tab: Render | className, dimensions, theme, scale. Read-only. |
| **S2.T6** | Inspector tab: Edit | V0: rename, copy-pointer, reset overrides. |
| **S2.T7** | First adapter: CardComposition (per ADR-2 surface-side · ADR-12 static-registration) | `app/battle-v2/_components/vfx/effects/CardComposition/adapter.ts`. Folder relocation from `CardComposition.tsx`. Exports `inspectorAdapter` + `composabilityAdapter`. |
| **S2.T8** | Static registration wiring | CardComposition's `index.ts` imports adapter; `app/battle-v2/_components/vfx/VfxRegistry.ts` (S0-locked inventory) imports + registers all adapters at module load. |
| **S2.T9** | Selection model wiring | Click in viewport → `select({primitiveId, nodeId, source})` → Inspector opens. |
| **S2.T10** | PointerChip → opt-in `data-inspectable` indicator | Hover affordance; click promotes to Inspector. |
| **S2.T11** | Vitest snapshot for new lab chrome | Baselines for PointerBreadcrumb + Inspector empty state. |
| **S2.T12** | Schema-shape validation against breadcrumb + inspector usage | Confirm S1b's `draft-S1` schema covers what S2 needs. Document any deltas in S3 schema-lock prep. |
| **S2.T13** | Open draft PR | "S2 · Pointer spine + Inspector + first adapter" |
| **S2.T14** | Sprint review + audit | `/review-sprint S2` + `/audit-sprint S2` |

**Cut-line:** PointerBreadcrumb + Inspector + CardComposition adapter all working.

---

## §S3 · Composability panel (3 sketched shapes · operator picks · schema locks)

**Goal:** Composability is visible. Operator picks canonical shape from 3 sketched live. **Pointer-chain schema locks here** (per ADR-13).

**Branch:** `feat/lab-evolution-s3-composability` off `feat/ecs-leaves-2026-05-17` (post-S2 merge)

**Acceptance gates:**
- 3 shapes (Figma-literal · Figma + pointer-chain · Godot-shaped tree) all render against the same active entity tree
- Header shape-switcher flips between them
- Operator names canonical shape; choice persists via sessionStorage (`lab.composabilityShape`)
- CardComposition + 1 additional primitive (HexScene) feed entity trees
- **Schema lock:** S1b's `draft-S1` schema validated against all 3 shape renderers; `@version draft-S1` marker removed; schema becomes `@version 1.0`

### Sprint S3 tasks

| Task | Title | Acceptance |
|---|---|---|
| **S3.T0** | Per-sprint preflight | Verify HEAD contains S2 merge. |
| **S3.T1** | `<ComposabilityPanel>` container + header | Left-rail 280px collapsible. Header includes ShapeToggle. |
| **S3.T2** | Shape A: Figma-literal layers panel | Flat-or-nested rows · eye/lock icons · click row = select. |
| **S3.T3** | Shape B: Figma + pointer-chain | Layers panel UX with full chain inline as subtitle. |
| **S3.T4** | Shape C: Godot-shaped tree | Nested tree with columns (label · scene-ref · override-state). |
| **S3.T5** | Shape-toggle persisted (sessionStorage) | `lab.composabilityShape`. Default: A. |
| **S3.T6** | `composabilityAdapter` on CardComposition (extend S2) | Returns `EntityTreeNode[]` for active card's layers. |
| **S3.T7** | `composabilityAdapter` on HexScene (new) | Demonstrates pattern beyond CardComposition. |
| **S3.T8** | Click entity → highlight viewport + open Inspector | Bidirectional wiring. |
| **S3.T9** | Schema validation against 3 shapes (per ADR-13) | Confirm `draft-S1` schema covers all fields needed by 3 shape renderers. Document any add fields. |
| **S3.T10** | Schema lock | Remove `@version draft-S1` marker. Update to `@version 1.0`. Commit as separate "schema lock" commit on the S3 PR for audit clarity. |
| **S3.T11** | Vitest snapshots for 3 shapes | Each shape's mount-state against a fixture entity tree. |
| **S3.T12** | Operator decision capture | `grimoires/loa/distillations/composability-shape-decision-2026-05-18.md` |
| **S3.T13** | Open draft PR | "S3 · Composability panel (3 shapes) + schema lock" |
| **S3.T14** | Sprint review + audit | `/review-sprint S3` + `/audit-sprint S3` |

**Cut-line:** All 3 shapes render. Operator names winner OR formally defers to S5 with rationale. Schema locks regardless.

---

## §S4 · Workspaces tab switcher (Compose · Preview · Export)

**Goal:** Multi-mode mental model gets a visual frame. Layout state preserved per workspace.

**Branch:** `feat/lab-evolution-s4-workspaces` off `feat/ecs-leaves-2026-05-17` (post-S3 merge)

**Acceptance gates:**
- 3 workspaces accessible via top tabs (Compose / Preview / Export)
- Keyboard `Cmd+1/2/3` switches
- Each workspace preserves: active entity · panel collapse · knob values · camera/scrub
- Switch round-trip preserves state perfectly

### Sprint S4 tasks

| Task | Title | Acceptance |
|---|---|---|
| **S4.T0** | Per-sprint preflight | Verify HEAD contains S3 merge. |
| **S4.T1** | `<WorkspacesTabs>` top bar | Horizontal tabs · IconRegistry glyphs · active style OKLCH. |
| **S4.T2** | `lib/lab/state/workspace.port.ts` + live | Per-workspace state Ref. `useWorkspace(id)` hook. |
| **S4.T3** | `<ComposeWorkspace>` | Inspector right · Composability left · Breadcrumb top · KnobPane bottom. |
| **S4.T4** | `<PreviewWorkspace>` | Primitive centered · minimal chrome · theme switcher. |
| **S4.T5** | `<ExportWorkspace>` | Meta panel · placeholders for export flows (V0 stub). |
| **S4.T6** | Workspace state persistence | `panelCollapse` → sessionStorage per workspace · `activeWorkspace` → sessionStorage. |
| **S4.T7** | Keyboard shortcuts | Cmd/Ctrl + 1/2/3 (Mac/Win aware). Documented in lab help. |
| **S4.T8** | Round-trip preservation test | Snapshot: switch Compose → Preview → Compose; assert same DOM. |
| **S4.T9** | Active-entity context bridges workspaces | Compose Selection preserved when entering Preview/Export. |
| **S4.T10** | Empty/loading/error states | Reasonable empty state per workspace. |
| **S4.T11** | Vitest snapshots for workspaces | Each workspace gets a baseline. |
| **S4.T12** | Open draft PR | "S4 · Workspaces tab switcher" |
| **S4.T13** | Sprint review + audit | `/review-sprint S4` + `/audit-sprint S4` |

**Cut-line:** 3 workspaces with state preservation. Export V0 stub acceptable.

---

## §S5 · Phosphor port · Legacy 9-effect retrofit · Determinism playbook applied · Cycle demo

**Goal:** Cycle DoD met. All 9 effects participate. Determinism playbook applied to ALL effects (S1a established it for 3; S5 extends to remaining 6). Demo recorded.

**Branch:** `feat/lab-evolution-s5-port-retrofit` off `feat/ecs-leaves-2026-05-17` (post-S4 merge)

**Acceptance gates (per PRD §7 + IMP-006):**
- ALL 9 effects retrofitted (inspectorAdapter · composabilityAdapter · `data-inspectable` · regression snapshot baseline)
- All Three.js / animated primitives apply determinism playbook (animation freeze · time mock · WebGL deterministic flags)
- `lucide-react` imports only inside `lib/ui/icons/providers/lucide.ts` (ESLint passes)
- All lab chrome + game UI routes icons via `IconRegistry`
- `/`, `/demo`, `/battle-v2` baselines pass — no regressions
- Demo recorded; distillation written
- **NO silent deferral** (per IMP-006)

### Sprint S5 tasks

| Task | Title | Acceptance |
|---|---|---|
| **S5.T0** | Per-sprint preflight | Verify HEAD contains S4 merge. |
| **S5.T1** | Adapter retrofit · card-lab | Static registration · folder structure · baseline · determinism applied. |
| **S5.T2** | Adapter retrofit · hex-scene (extend S3) | Existing adapter from S3 extended for inspector use. |
| **S5.T3** | Adapter retrofit · mini-scene | Static registration · baseline. |
| **S5.T4** | Adapter retrofit · big-realm-scene (Three.js) | Adapter + scene-root as opaque InspectableNode. Determinism: WebGL deterministic flags · animation freeze · scene-frame-mock. |
| **S5.T5** | Adapter retrofit · realm-scene (Three.js) | Same as big-realm-scene. |
| **S5.T6** | Adapter retrofit · zone-scene (Three.js) | Same shape. |
| **S5.T7** | Adapter retrofit · tree-fall (animation) | Determinism: time-mock, freeze at known frame. |
| **S5.T8** | Adapter retrofit · water-splash (animation) | Same shape. |
| **S5.T9** | Phosphor port · vfx-lab top bar | Replace lucide imports; visual diff check. |
| **S5.T10** | Phosphor port · KnobPane | Audit label affordances. |
| **S5.T11** | Phosphor port · battle-v2 HUD | Replace lucide imports. |
| **S5.T12** | Phosphor port · CardFace + CardShowcase + HandRack | Replace lucide imports; substrate gates edits. |
| **S5.T13** | Phosphor port · ZoneOverlay / MapHUD | Replace lucide imports. |
| **S5.T14** | ESLint `no-restricted-imports` rule | Active; passes. |
| **S5.T15** | Cleanup unselected composability shapes | If operator chose canonical shape in S3, remove other 2 shape files + tests. |
| **S5.T16** | Validated-surface regression report | `/`, `/demo`, `/battle-v2`, `/battle-v2/vfx-lab` against S1a baselines. Operator inspects. |
| **S5.T17** | Cycle demo recording | Operator demoes workspaces · breadcrumb · inspector · composability · icon swap · pre-commit hook blocks intentional drift. |
| **S5.T18** | Distillation | `grimoires/loa/distillations/session-22-lab-evolution-demo.md`. Substrate/application/taste separated. |
| **S5.T19** | Final polish pass | Empty/loading/error sweeps. Status footer audit. |
| **S5.T20** | Open draft PR | "S5 · Phosphor port + legacy retrofit + cycle demo" |
| **S5.T21** | Sprint review + audit | `/review-sprint S5` + `/audit-sprint S5` |
| **S5.T22** | Final cycle PR | `feat/ecs-leaves-2026-05-17` → `main` after all sprint PRs merged + demo + distillation. |

**Cut-line (CRITICAL · per IMP-006):** ALL 9 effects retrofit OR operator formally amends PRD G6. NO silent deferral.

---

## §M · Cross-cycle dependency diagram (post-Flatline)

```
       P0 (operator commits in-flight)
        │
        ▼
   ┌────S0 [calibration spike]──┐
   │  • Playwright + Docker     │
   │  • static-fixture delta    │
   │  • half-day budget · self- │
   │    deleting script         │
   │  • CYCLE-1 DOCTRINE        │
   └────────────┬───────────────┘
                │ (merge · or HALT if pipeline broken)
                ▼
   ┌────S1a [regression substrate]───┐
   │  • Playwright port + live       │
   │  • Noop layer (prod gate ADR-9) │
   │  • baselines (3 + 4 surfaces)   │
   │  • pre-commit hook (ADR-10)     │
   │  • PostToolUse:WARN             │
   │  • rollback runbook             │
   │  • approve governance           │
   │  • determinism playbook         │
   └────────────┬────────────────────┘
                │ (merge)
                ▼
   ┌────S1b [UI substrate]───────┐
   │  • IconRegistry             │
   │  • pointer-chain @draft-S1  │
   │  • adapter registry types   │
   │  • static-registration      │
   └────────────┬────────────────┘
                │ (merge)
                ▼
   ┌────S2 [spine]─────────────────┐
   │  • PointerBreadcrumb          │
   │  • Inspector + tabs           │
   │  • CardComposition adapter    │
   │    (static-registered)        │
   └────────────┬──────────────────┘
                │ (merge)
                ▼
   ┌────S3 [composability]─────────────┐
   │  • 3 shapes side-by-side          │
   │  • operator picks canonical       │
   │  • SCHEMA LOCKS (@version 1.0)    │
   │  • 2 adapters (CC + HexScene)     │
   └────────────┬──────────────────────┘
                │ (merge)
                ▼
   ┌────S4 [workspaces]────────────┐
   │  • 3 workspaces               │
   │  • per-workspace state        │
   │  • Cmd+1/2/3 shortcuts        │
   └────────────┬──────────────────┘
                │ (merge)
                ▼
   ┌────S5 [port + retrofit]──────────┐
   │  • 8 more adapters               │
   │  • determinism for Three.js/anim │
   │  • lucide → IconRegistry         │
   │  • ESLint enforcement            │
   │  • demo + distillation           │
   └────────────┬─────────────────────┘
                │ (merge)
                ▼
        feat/ecs-leaves-2026-05-17
                │
                ▼
        final cycle PR → main
```

Strict sequence: S0 → S1a → S1b → S2 → S3 → S4 → S5. No parallel sprints. Each sprint preflight verifies prior-merge base SHA (per SKP-002 760).

---

## §V · Verification per sprint (Loa gates)

| Gate | When | Mechanism |
|---|---|---|
| Pre-commit hook | Every commit | `.husky/pre-commit` — authoritative substrate fuse · fires for ALL agents |
| PostToolUse:WARN | Every Write/Edit/Bash on protected paths in Claude Code sessions | Non-blocking warning · best-effort fast feedback |
| `/run sprint-plan` | Implementation start | Wraps implement + review + audit with circuit breaker |
| `/review-sprint S<N>` | End of implementation | Per Loa standard |
| `/audit-sprint S<N>` | After review | Per Loa standard |
| Operator approval | Draft PR | Operator reviews + merges |
| Bridgebuilder | S1a PR (per operator) | `bridge-orchestrator.sh` against S1a draft PR |
| Per-sprint base-SHA preflight | Each sprint branch open | Verifies prior merge present; records base SHA in PR body |

---

## §R · Risks consolidated (post-Flatline)

| ID | Risk | Surfaced |
|---|---|---|
| R1 | Playwright cold-start exceeds 8s budget | SDD §11 |
| R2 | Hook latency in CI fail-closed | SDD ADR-7 |
| R3 | Docker baseline-capture fails on macOS | SDD ADR-8 |
| R4 | Adapter pattern leaks effect internals | SDD §11 |
| R5 | Composability shape-picker leaves dead code | S5.T15 mitigation |
| R6 | Workspace state restore stale-knob bug | S4.T8 round-trip test |
| R7 | Adapter retrofit for Three.js effects awkward | SDD §11 — `kind: "scene"` opaque V0 |
| R8 | S5 budget overrun on 8-effect retrofit | NO silent deferral per IMP-006 |
| R9 | Edit-patch reconstruction (PostToolUse WARN) fails on multi-hunk | Non-blocking; pre-commit catches at commit time anyway |
| R10 | Bash bypass | PostToolUse:Bash + pre-commit hook (universal coverage) |
| R11 | S0 calibration reveals fundamental Playwright/Docker mismatch | HALT + reframe pair-point per S0 cut-line |
| R12 | Pre-commit hook false-positive blocks operator | Rollback runbook (S1a.T20) + bypass env var (S1a.T12) |
| R13 | Static adapter registration causes import-graph cycles | S1b.T9 design verifies; deferred concern |
| R14 | Schema draft → lock transition (S1b → S3) breaks adapters | S3.T10 commit explicitly audits change |
| R15 | Determinism playbook insufficient for some effects | S5.T4-T8 adapter retrofit surfaces this; document workarounds |

---

## §C · Construct composition

Per OperatorOS v3.3:
- **Primary:** the-arcade (BARTH) — sprint discipline, cycle DoD
- **Lens:** artisan (ALEXANDER) — taste, OKLCH, IconRegistry/UX
- **Lens:** vfx-playbook — P2/P3/P6 inputs in PRD §1
- **Lens (S1a PR):** bridgebuilder-persona — architectural fresh-eyes via PR review

`construct_affinity: [cross-domain]`.

---

## §F · Flatline review integration log

| Phase | Doc | BLOCKERS | HIGH | DISPUTED | Result |
|---|---|---|---|---|---|
| 2 | PRD | 0 | 7 | 3 | All 7 HIGH integrated + 3 DISPUTED ratified |
| 4 | SDD | 12 real (1 false) | — | — | 8 closed-ADRs (ADR-1 through ADR-8) added; revised §2, §3.4, §4, §5, §11 |
| 6 | Sprint | 10 (4 critical + 6 high) | — | — | Hook posture rewritten · S0 added · S1 split · 5-finding bundle accepted |

Closed-ADRs from sprint review:

| ADR | Decision | Source |
|---|---|---|
| ADR-9 | RegressionCheckLive env-gated; production = RegressionCheckNoop layer | SKP-004 (750) |
| ADR-10 | Pre-commit hook is authoritative fuse; PostToolUse is WARN-only | SKP-001 (920) + SKP-001 (880) |
| ADR-11 | Rollback runbook + bypass env var prevents self-locking loop | SKP-002 (820) |
| ADR-12 | Static adapter registration (module-load, not mount-time) | SKP-002 (780) |
| ADR-13 | Pointer-chain schema marked `@version draft-S1` in S1b; locks in S3 | SKP-005 (720) |
| ADR-14 | Determinism playbook (time-mock · animation-freeze · locale · timezone · network-isolate · font-ready · WebGL deterministic) | SKP-004 (710) |

---

*Sprint plan authored 2026-05-18 during /simstim Phase 5. Post-Flatline-rewrite (10 BLOCKERs → operator-ratified resolutions). Branch root: `feat/ecs-leaves-2026-05-17`. Bridgebuilder runs on S1a PR.*
