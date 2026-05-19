---
cycle: lab-evolution-2026-05-18
session: 22 (entry)
type: SDD
status: candidate
date: 2026-05-18
mode: ARCH (OSTROM) + craft lens (ALEXANDER)
simstim_id: simstim-20260518-f581af5a
prd: grimoires/loa/prd.md
branch_root: feat/ecs-leaves-2026-05-17
operator_pacing: kaironic + simstim (pair-points at sprint boundaries)
load_bearing_decisions:
  - "@phosphor-icons/react ^2.1.10 already installed (lab + game-UI provider)"
  - "Effect ^3.10.0 already installed — Effect/Schema via `effect` namespace, not @effect/schema"
  - "No zustand in repo — state primitive = Effect.Context + React Context bridge (substrate-consistent)"
  - "Vitest ^3.2.4 installed; @vitest/snapshot built-in"
  - "lib/honeycomb/*.{port,live,mock}.ts is the canonical Effect substrate pattern"
references:
  - prd.md (this cycle)
  - lib/honeycomb/battle.port.ts (reference port pattern)
  - lib/cards/codex/* (consumer pattern for substrate primitives)
  - app/battle-v2/_components/vfx/VfxRegistry.ts (canonical registry pattern)
---

# SDD · Lab Evolution Cycle — 2026-05-18

> Six threads, one cycle, substrate-first. This SDD specifies how each PRD functional requirement lands in code: file paths, port signatures, hook integration, adapter contracts, state model, migration mechanics.

---

## §1 · Architecture overview

### §1.1 — System map

```
┌─────────────────────────────────────────────────────────────────────┐
│                       VFX LAB SHELL (app/battle-v2/vfx-lab)         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  WorkspacesTabs (S4)        IconSwapToggle (S1.demo)          │  │
│  │  PointerBreadcrumb (S2)                                       │  │
│  │  ┌────────────┬─────────────────────────────┬────────────┐    │  │
│  │  │            │                             │            │    │  │
│  │  │ Composab.  │       Viewport              │ Inspector  │    │  │
│  │  │ Panel (S3) │   (Effect Preview)          │  (S2)      │    │  │
│  │  │ [A/B/C]    │                             │            │    │  │
│  │  │            │                             │            │    │  │
│  │  └────────────┴─────────────────────────────┴────────────┘    │  │
│  │  KnobPane (existing)                                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
           ▲           ▲           ▲                ▲
           │           │           │                │
   ┌───────┴───┐  ┌────┴────┐  ┌───┴─────┐  ┌──────┴────────┐
   │ lib/ui/   │  │ lib/    │  │ lib/    │  │ lib/regress./ │
   │ icons     │  │ lab/    │  │ lab/    │  │ port + live   │
   │ (S1)      │  │ pointer │  │ adapt.  │  │ (S1)          │
   │           │  │ chain   │  │ registry│  │               │
   │ Registry  │  │ (S2)    │  │ (S2-S5) │  │ + Hook (S1)   │
   │           │  │         │  │         │  │ + Vitest (S1) │
   └───────────┘  └─────────┘  └─────────┘  └───────────────┘
                      ▲                          ▲
                      │                          │
                      └────────── effects ───────┘
                       (CardComposition · CardLab · HexScene · MiniScene ·
                        BigRealmScene · RealmScene · TreeFall ·
                        WaterSplash · ZoneScene)
                                  │
              ┌───────────────────┴───────────────────┐
              │       .claude/hooks/pre-tool-use/     │
              │   lab-render-regression.sh (S1)       │
              │   ← triggers on Write/Edit to         │
              │     validated render paths            │
              └───────────────────────────────────────┘
```

### §1.2 — Construct discipline

- **lib/** = substrate (port/live/mock pattern, Effect-based)
- **app/battle-v2/** = surface (renders substrate output)
- **.claude/hooks/** = enforcement (substrate fuse)
- **tests/** = baseline + canary (substrate proof)

Adapter pattern is the seam between any new effect/primitive and the substrate. Substrate never reaches into `app/`; surface registers adapters.

### §1.3 — Substrate composition (Effect substrate-style)

All cycle primitives compose via the existing Effect Context.Tag pattern:

```ts
// lib/regression/regression.port.ts
export interface RegressionCheck {
  readonly snapshot: (target: RenderTarget) => Effect.Effect<Snapshot, RegressionError>;
  readonly diff: (a: Snapshot, b: Baseline) => Effect.Effect<DiffResult, never>;
  readonly approve: (target: RenderTarget, snapshot: Snapshot) => Effect.Effect<void, never>;
}
export const RegressionCheck = Context.GenericTag<RegressionCheck>("RegressionCheck");

// lib/runtime/runtime.ts — single provide site
const AppLayer = Layer.mergeAll(
  /* existing */ BattleLive, /* ... */,
  RegressionCheckLive,
  IconRegistryLive,
  InspectorAdapterRegistryLive,
);
```

---

## §2 · Tech stack (confirmed)

| Concern | Tech | Status |
|---|---|---|
| Effect primitives | `effect` ^3.10.0 | Installed; use `Schema as S` from `effect` namespace |
| Icon provider 1 | `@phosphor-icons/react` ^2.1.10 | **Already installed** (no new install) |
| Icon provider legacy | `lucide-react` ^1.14.0 | Installed; phased out into IconRegistry |
| Test runner | `vitest` ^3.2.4 + `@vitest/snapshot` | Installed |
| Image diff | `pixelmatch` ^7.x | **NEW install** (S1) |
| PNG codec | `pngjs` ^7.x | **NEW install** (S1, peer of pixelmatch) |
| **Snapshot rendering backend** | **`playwright` ^1.x — REQUIRED** | **NEW install** (S1, locked decision per Flatline cluster-A) |
| Layout testing only (no rendering) | `happy-dom` (already in repo via vitest) | Existing — used ONLY for non-layout unit tests |
| Baseline pinning | Docker (commits Dockerfile to tests/snapshots/) | **NEW** (S1, per Flatline SKP-002) |
| State (panel selection, workspace) | Effect.Context + React Context bridge | No zustand; bridge pattern below |

**Locked decision (Flatline SDD review · 2026-05-18): Playwright is the snapshot backend.** Earlier draft listed jsdom as primary with Playwright optional. Multi-model Flatline review (SKP-001 950 / SKP-001 920 / SKP-003 720 / SKP-003 710) converged: jsdom cannot compute cqw, render canvas, load fonts faithfully, or run Three.js. The session-22 F5#4 regression (cqw fallback bug) is exactly what jsdom would silently approve. Baselines MUST be browser-faithful. Playwright runs headless Chromium for every snapshot capture; jsdom is reserved for non-layout unit tests only.

### §2.1 — State management decision: NO zustand

The repo doesn't use zustand. To stay substrate-consistent and avoid introducing a new state library:

```ts
// lib/lab/state/inspector.port.ts
export interface InspectorState {
  readonly current: Effect.Effect<Selection | null, never>;
  readonly select: (selection: Selection) => Effect.Effect<void, never>;
  readonly clear: () => Effect.Effect<void, never>;
  readonly stream: Stream.Stream<Selection | null>;
}

// app/battle-v2/_components/lab/InspectorContext.tsx
// React Context wraps a Ref-backed Effect implementation.
// useInspectorSelection() returns the current selection + setters.
```

Rationale: this pattern already exists in `lib/honeycomb/` (battle.port.ts uses Ref + Stream for state). We reuse the substrate idiom. If a flat-state primitive is needed and the substrate idiom is awkward, S2 may introduce a tiny wrapper (`lib/lab/use-ref-state.ts`) — NEVER a 3rd-party state library.

### §2.2 — Persistence layer per state slice (per Flatline IMP-011 · operator-ratified)

Inconsistent persistence boundaries would produce reproducibility bugs that surface worst during demos. The table below LOCKS storage layer per cycle-introduced slice. Default is memory; sessionStorage is reserved for chrome-toggles that must survive a navigation but not a tab close.

| State slice | Storage layer | Reset on |
|---|---|---|
| `Selection` (active inspector target) | memory (Ref) | Tab close · workspace switch · primitive switch |
| `ActiveEntity` (breadcrumb anchor) | memory (Ref) | Tab close · primitive switch |
| `WorkspaceState.activeEntity` | memory (Ref, keyed by workspace) | Tab close |
| `WorkspaceState.panelCollapse` | sessionStorage (key: `lab.workspace.<id>.panelCollapse`) | Tab close |
| `WorkspaceState.knobValues` | memory (delegated to existing effect knob system) | Workspace switch · effect switch |
| `WorkspaceState.camera/scrub` | memory (Ref) | Tab close · workspace switch |
| `IconProvider` toggle (Phosphor / Stub) | sessionStorage (key: `lab.iconProvider`) | Tab close |
| `ActiveWorkspace` (Compose/Preview/Export) | sessionStorage (key: `lab.activeWorkspace`) | Tab close |
| `ComposabilityShape` (A / B / C selection) | sessionStorage (key: `lab.composabilityShape`) | Tab close |
| `PointerChain` resolution cache | memory (in-memory Map) | Effect adapter unmount |
| Snapshot baselines (test infra) | filesystem (`tests/snapshots/lab/`) | git commit |
| Audit log (hook events) | filesystem (`.run/audit.jsonl`) | manual rotation |

Rule: NO `localStorage` (avoids cross-session bleed that breaks demos). NO URL params (avoids encoding state in routes — those are zone-owned per `project_zone-as-composable-module.md`).

Implementation: a single helper `lib/lab/state/persisted-ref.ts` wraps `sessionStorage.{getItem,setItem}` with a Ref-backed Effect; consumed by the 3 sessionStorage slices above.

---

## §3 · Component / module design

### §3.1 — `lib/regression/` (Sprint 1)

```
lib/regression/
  ├─ regression.port.ts        Effect Context.Tag + interface
  ├─ regression.live.ts        Production implementation (Vitest + pixelmatch)
  ├─ regression.mock.ts        In-memory mock for non-snapshot tests
  ├─ schema.ts                 Effect Schema for Snapshot/Baseline/DiffResult/RenderTarget
  ├─ baseline-store.ts         Read/write tests/snapshots/lab/*.{png,json}
  ├─ matrix-permutations.ts    Scale matrix: [0.5, 1, 2] × theme: [light, dark]
  ├─ inspector-adapter.ts      Type contract for primitives
  ├─ composability-adapter.ts  Type contract for primitives
  ├─ adapter-registry.ts       Effect Context.Tag for AdapterRegistry
  └─ __tests__/
      ├─ regression.port.test.ts
      ├─ baseline-store.test.ts
      └─ matrix-permutations.test.ts
```

**Snapshot envelope schema:**

```ts
const Snapshot = S.Struct({
  imageRef: S.String,            // path under tests/snapshots/lab/
  boundingBox: S.Struct({        // PRIMARY assertion source (geometry as invariant)
    width: S.Number,
    height: S.Number,
    x: S.Number,
    y: S.Number,
  }),
  metadata: S.Struct({
    primitive: S.String,         // "CodexCardFace", "DustPuff", etc.
    scale: S.Number,             // 0.5 | 1 | 2
    theme: S.Literal("light", "dark"),
    props: S.Record({ key: S.String, value: S.Unknown }),
  }),
  capturedAt: S.String,          // ISO timestamp
  sha256: S.String,              // image hash (deterministic regen check)
});
```

Per dig 2 finding: **boundingBox is the primary assertion**, image diff is the secondary. This collapses the antialiasing-noise problem (Olah/Nguyen Chromatic finding) by checking geometry mathematically, falling back to image diff only for visual changes that aren't dimensional.

**DiffResult discriminated union:**

```ts
const DiffResult = S.Union(
  S.TaggedStruct("Match", {}),
  S.TaggedStruct("GeometryDrift", {
    dimension: S.Literal("width", "height", "x", "y"),
    expected: S.Number,
    actual: S.Number,
    deltaPx: S.Number,
    deltaPct: S.Number,
  }),
  S.TaggedStruct("PixelDrift", {
    diffPixels: S.Number,
    diffPct: S.Number,
    diffImagePath: S.String,
  }),
  S.TaggedStruct("BaselineMissing", {
    primitive: S.String,
  }),
);
```

**Tolerance defaults:**
- Geometry: ±0.5px (anti-floating-point) per dimension
- Pixel: < 0.5% diff pixels (anti-antialiasing) before flagging

### §3.2 — `lib/ui/icons/` (Sprint 1, parallel)

```
lib/ui/icons/
  ├─ Icon.tsx                  Public consumer surface: <Icon name="pantry" size={16} />
  ├─ registry.ts               Map<SemanticName, IconResolver>
  ├─ provider.tsx              <IconProvider value="phosphor" | "stub">
  ├─ providers/
  │   ├─ phosphor.ts           Map semantic names to Phosphor components
  │   ├─ stub.ts               Text-fallback renderer (proves the swap)
  │   └─ lucide.ts             For migration of existing lucide-react usages (transitional)
  ├─ names.ts                  TS literal union of all valid semantic names
  └─ __tests__/
      └─ registry.test.ts
```

**Public API:**

```tsx
<Icon name="pantry" size={16} weight="regular" />
<Icon name="workspace-compose" />  // size + weight default to provider defaults
```

**Provider toggle (for the swap demo, FR-S2.3):**

```tsx
<IconProvider value={iconProvider}>
  <App />
</IconProvider>
```

The provider is read via React Context. Lab chrome renders an `<IconSwapToggle />` that flips between providers. Game-UI (battle-v2) inherits the same provider.

**Lint rule (FR-S2.4 hard-stop):**

S5 will add an ESLint rule `no-direct-icon-imports`:
```ts
// .eslintrc.js
"no-restricted-imports": ["error", {
  paths: [
    { name: "@phosphor-icons/react", message: "Use `Icon` from lib/ui/icons" },
    { name: "lucide-react", message: "Use `Icon` from lib/ui/icons" },
  ],
}]
```
Exception: `lib/ui/icons/providers/*` files.

### §3.3 — `lib/lab/pointer-chain/` (Sprint 2 · Thread A)

```
lib/lab/pointer-chain/
  ├─ pointer-chain.port.ts     Effect Context.Tag
  ├─ pointer-chain.live.ts     Resolves chains from adapter registry
  ├─ types.ts                  PointerSegment, PointerChain, ChainKind
  └─ __tests__/

app/battle-v2/_components/lab/
  ├─ PointerBreadcrumb.tsx     Sticky breadcrumb at top of viewport
  ├─ PointerSegment.tsx        Single segment renderer
  └─ active-entity-context.tsx React Context bridging substrate stream
```

**PointerSegment shape:**

```ts
type ChainKind =
  | { kind: "pantry"; slug: string; path: string }            // "/codex/cards/earth-jani"
  | { kind: "primitive"; name: string; path: string }         // "vfx/effects/CardComposition"
  | { kind: "consumer"; consumers: string[] }                 // ["card-lab", "battle"]
  | { kind: "scene"; name: string; path: string };            // future: scene composition

type PointerSegment = ChainKind & { displayLabel: string };
type PointerChain = readonly PointerSegment[];
```

### §3.4 — `lib/lab/adapter-registry/` (Sprint 2-5)

The substrate-to-surface seam. Each effect registers its inspector and composability adapters.

```
lib/lab/adapter-registry/
  ├─ adapter-registry.port.ts
  ├─ adapter-registry.live.ts
  └─ types.ts

// types.ts — types LOCKED per Flatline SDD review (closed-ADR)
export interface InspectorAdapter {
  readonly primitiveId: string;
  readonly listInspectableNodes: (state: unknown) => readonly InspectableNode[];
  readonly resolveChain: (nodeId: string) => PointerChain;
}

export interface ComposabilityAdapter {
  readonly primitiveId: string;
  readonly tree: (state: unknown) => readonly EntityTreeNode[];
}

// Defined explicitly per Flatline SKP-005 · was phantom-type in earlier draft.
// Aligned with EntityTreeNode shape so shared rendering primitives work across
// ComposabilityPanel and Inspector.
export interface InspectableNode {
  readonly id: string;                           // primitive-local node identifier
  readonly label: string;                        // human-readable label
  readonly kind: "entity" | "layer" | "knob" | "param" | "scene";
  readonly pointerChain: PointerChain;           // FULL chain from pantry/source to this node
  readonly inspectable: boolean;                 // false = visible but read-only (e.g., scene roots)
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface EntityTreeNode {
  readonly id: string;
  readonly label: string;
  readonly kind: "layer" | "effect" | "scene" | "group";
  readonly children: readonly EntityTreeNode[];
  readonly pointerChain: PointerChain;
  readonly inspectable: boolean;
}
```

**Adapter location LOCKED (closed-ADR · per Flatline SKP-006):**

Adapters live at `app/battle-v2/_components/vfx/effects/<effect>/adapter.ts` (**surface-side**). Each effect owns its adapter file alongside its component.

Rationale: adapters reference effect-specific React state and render context that `lib/` cannot know about. The substrate contract is enforced by the TypeScript interface in `lib/lab/adapter-registry/types.ts` — file location is independent of contract enforcement. `AdapterRegistryLive` (lib/) accepts adapter values matching the interface at registration time. This pattern matches the existing `lib/honeycomb/*.live.ts` convention where the live implementation imports the port type but lives where the operational details require.

Migration: §7 file map updated to reflect surface-side adapter locations. S2 Thread B ships first adapter at `app/battle-v2/_components/vfx/effects/CardComposition/adapter.ts` (effect folder may need to be created — currently the file is `CardComposition.tsx`; S2 normalizes to a folder).

Each effect's `index.ts` exports an `adapter` object; `VfxRegistry` adds a single line per effect to wire it.

### §3.5 — `app/battle-v2/_components/lab/Inspector.tsx` (Sprint 2 · Thread B)

```
app/battle-v2/_components/lab/
  ├─ Inspector.tsx             Right-rail panel, ~320px
  ├─ inspector/
  │   ├─ PointerChainTab.tsx
  │   ├─ DataTab.tsx
  │   ├─ RenderTab.tsx
  │   └─ EditTab.tsx
  └─ inspector-context.tsx     Wraps selection-port state
```

**Selection model:**

```ts
type Selection = {
  primitiveId: string;
  nodeId: string;
  source: "viewport-click" | "composability-click" | "breadcrumb-click";
};
```

### §3.6 — `app/battle-v2/_components/lab/ComposabilityPanel.tsx` (Sprint 3 · Thread C)

```
app/battle-v2/_components/lab/composability/
  ├─ ComposabilityPanel.tsx    Container + shape switcher (header)
  ├─ shapes/
  │   ├─ ShapeA-FigmaLiteral.tsx
  │   ├─ ShapeB-FigmaPointerChain.tsx
  │   └─ ShapeC-GodotTree.tsx
  └─ shape-context.tsx         Persists active shape choice
```

**Shape switcher header (FR-S5.2):**

```tsx
<div className="panel-header">
  <Icon name="layers" />
  <span>Composability</span>
  <ShapeToggle value={shape} onChange={setShape}>
    <ShapeToggle.Option value="A">Figma layers</ShapeToggle.Option>
    <ShapeToggle.Option value="B">Figma + chain</ShapeToggle.Option>
    <ShapeToggle.Option value="C">Tree</ShapeToggle.Option>
  </ShapeToggle>
</div>
```

### §3.7 — `app/battle-v2/_components/lab/WorkspacesTabs.tsx` (Sprint 4 · Thread D)

```
app/battle-v2/_components/lab/workspaces/
  ├─ WorkspacesTabs.tsx        Top horizontal tabs
  ├─ workspace-context.tsx     Per-workspace layout state
  ├─ ComposeWorkspace.tsx
  ├─ PreviewWorkspace.tsx
  └─ ExportWorkspace.tsx
```

**Workspace state shape:**

```ts
type WorkspaceState = {
  activeEntity: Selection | null;
  panelCollapse: {
    composability: boolean;
    inspector: boolean;
  };
  knobValues: Record<string, unknown>;  // delegated to effect's existing knob system
};

type WorkspacesState = Record<WorkspaceId, WorkspaceState>;
```

Stored in a Ref-backed Effect inside `lib/lab/state/workspace.port.ts`. Workspace switches re-hydrate the new workspace's state.

---

## §4 · Hook integration (re-spec per Flatline sprint review · ADR-10)

**Hook posture (post-Flatline-sprint-review):** Pre-commit hook in `.husky/pre-commit` is the **authoritative substrate fuse**. PostToolUse:Write|Edit|Bash hook in Claude Code emits **WARN-only** (non-blocking) for fast feedback. This decouples the fuse from the per-edit latency budget and covers ALL agents (Codex, Loa autonomous, manual) — not just Claude Code sessions.

Earlier draft sections describing PreToolUse:Write|Edit as the blocking gate are SUPERSEDED by ADR-10.

### §4.1 — Hook 1: Pre-commit (`.husky/pre-commit`) · AUTHORITATIVE GATE per ADR-10

**Contract:**
```bash
#!/usr/bin/env bash
# Triggered by git commit (any agent: Claude Code, Codex, Loa, manual)
# Exits 0 (allow commit) or 1 (BLOCK commit) with stderr message
# Bypass: LOA_REGRESSION_HOOK_BYPASS=1 (audited per ADR-11)
```

**Behavior:**
```bash
[[ "$LOA_REGRESSION_HOOK_BYPASS" == "1" ]] && { audit_emit "regression-bypass" "$USER"; exit 0; }

# Find staged files matching protected paths
STAGED_PROTECTED=$(git diff --cached --name-only | grep -E "$(IFS='|'; echo "${PROTECTED_PATHS[*]}")")
[[ -z "$STAGED_PROTECTED" ]] && exit 0  # nothing to check

# Run regression check on staged content
PRIMITIVES=$(resolve_primitives_for_paths "$STAGED_PROTECTED")
pnpm regression:check --staged-only --primitives "$PRIMITIVES"
RC=$?

if [[ $RC -ne 0 ]]; then
  echo "[regression-substrate] commit BLOCKED: regression detected on $PRIMITIVES" >&2
  echo "  To approve baseline changes: pnpm regression:approve <primitive> --reason '...'" >&2
  echo "  To bypass (audited): LOA_REGRESSION_HOOK_BYPASS=1 git commit ..." >&2
  exit 1
fi
exit 0
```

**Why this works as the authoritative fuse:**
- Fires on every `git commit` regardless of which agent (Claude/Codex/Loa) wrote the changes — resolves SKP-001 (880) coverage gap
- Cannot create self-locking loop: bypass via env var works even if hook itself is broken; revert the offending commit recovers fully (resolves SKP-002 820)
- Latency cost paid at commit time, not per-Edit — agent autonomy preserved (resolves SKP-001 920)
- Audit trail to `.run/audit.jsonl` for every block + bypass

### §4.1b — Hook 2: PostToolUse:Write|Edit|Bash (`.claude/hooks/post-tool-use/lab-render-regression.sh`) · WARN-only

**Contract:**
```bash
# Triggered by Claude Code PostToolUse:Write|Edit|Bash (fires AFTER mutation)
# Non-blocking — always exit 0 — emits stderr WARN for operator awareness
# stdin JSON: { tool, file_path | command, ... }
```

**Path matching (shared by both hooks):**
```bash
PROTECTED_PATHS=(
  "app/battle-v2/_components/cards/"
  "app/battle-v2/_components/vfx/effects/"
  "app/battle-v2/_components/CardFace.tsx"
  "lib/cards/codex/"
)
```

NOT in protected-path set: `.claude/hooks/settings.hooks.json`, `lib/regression/*`, `lib/ui/icons/*` — so the hook can never lock itself out of its own configuration (per ADR-11).

**PostToolUse behavior (WARN-only):**
- Resolve affected primitives from `file_path` or `git diff --name-only HEAD` (Bash case)
- Run `pnpm regression:check --primitives "$AFFECTED" --post-mutation`
- If regression detected, emit stderr WARN with diff summary + remediation steps
- Always exit 0 — never block (the pre-commit hook is the gate)
- Audit emit `regression.warn` with primitive + outcome
- Latency: best-effort; not load-bearing on the iteration loop

The earlier section's Edit-patch reconstruction (now retained for the PostToolUse:Write case where reconstruction adds context to the WARN message) and worktree staging remain valid technique — they just don't BLOCK anymore.

**Edit-patch reconstruction (per Flatline SKP-003 · 840):**

The hook MUST reconstruct the proposed file content before staging:
```bash
case "$tool" in
  Write)
    # Full content provided
    PROPOSED_CONTENT="$content"
    ;;
  Edit)
    # Read current on-disk file
    CURRENT=$(cat "$file_path")
    # Apply patch: replace old_string with new_string (respecting replace_all flag)
    PROPOSED_CONTENT=$(apply_edit_patch "$CURRENT" "$old_string" "$new_string" "$replace_all")
    # If reconstruction fails (e.g., old_string not found), exit 1 — Claude Code's
    # own Edit semantics would also fail, but we surface BLOCK explicitly with reason.
    ;;
esac
```

`apply_edit_patch` is a small helper in `.claude/scripts/edit-patch-apply.sh` — deterministic search-replace honoring the `replace_all` flag exactly as the Claude Code Edit tool does.

**Staging (per Flatline SKP-002 · 780 · resolves import-break):**

The previous draft used file-copy, which breaks relative imports. Re-spec uses **git worktree-based staging**:
```bash
WORKTREE_DIR=".run/regression-staging/$$"  # per-process worktree
git worktree add -q "$WORKTREE_DIR" HEAD
# Apply proposed content to worktree's copy of the file
echo "$PROPOSED_CONTENT" > "$WORKTREE_DIR/$file_path"
# Run vitest from worktree root — imports resolve correctly
(cd "$WORKTREE_DIR" && pnpm regression:check --primitive "$primitive_name")
RC=$?
# Always clean up
git worktree remove -f "$WORKTREE_DIR"
```

Worktree gives a faithful repository state with the proposed change applied — relative imports, tsconfig paths, Next.js transforms all resolve correctly. Cost: ~200-500ms worktree add/remove overhead, comfortably inside the 8s budget for a single-primitive snapshot.

**Timeout policy (per Flatline SKP-001 · 760 · fail-open is a bypass):**

Fail-open is the bypass-by-attrition problem. Re-spec uses **CI-vs-local policy**:
```bash
if [[ -n "$CI" || -n "$GITHUB_ACTIONS" ]]; then
  TIMEOUT_POLICY="fail-closed"  # CI BLOCKS if timeout exceeded
else
  TIMEOUT_POLICY="fail-open"    # Local interactive ALLOWS with WARN + audit
fi
```

Local fail-open is acceptable for iterative work; CI fail-closed makes the gate real for merges. Both record the timeout to `.run/audit.jsonl`.

**Override pathway:**

When BLOCK fires, the hook stderr includes:
```
[regression-substrate] BLOCKED: CodexCardFace width drift +12.3px (2.6%)
  Baseline: tests/snapshots/lab/CodexCardFace@1x.json (boundingBox)
  Diff:     tests/snapshots/lab/diffs/CodexCardFace@1x.diff.png (advisory)
  Edit reconstruction: OK (8 lines changed)
  Worktree staging: OK (412ms)
  Snapshot capture: 3.2s
  To approve: pnpm regression:approve CodexCardFace
  To override (operator only): LAB_REGRESSION_OVERRIDE=1 (audited)
```

### §4.2 — Hook 2: PostToolUse:Bash (`.claude/hooks/post-tool-use/lab-render-regression-bash.sh`)

Per Flatline SKP-004 (820), the PreToolUse hook only intercepts Claude Code's native Write/Edit tools. Bash-mediated file writes (`sed -i`, `cat > file`, `echo >> file`) bypass it entirely. The PostToolUse:Bash hook closes this:

**Contract:**
```bash
# Triggered by Claude Code PostToolUse:Bash (fires AFTER bash command completes)
# stdin JSON: { tool: "Bash", command, exit_code, stdout, stderr }
# Exits 0 (always, this is a post-mutation alert, not a block)
```

**Behavior:**
```bash
# Did this bash command touch a protected path?
CHANGED_PROTECTED=$(git diff --name-only HEAD 2>/dev/null | grep -E "$(IFS='|'; echo "${PROTECTED_PATHS[*]}")")
if [[ -z "$CHANGED_PROTECTED" ]]; then
  exit 0  # nothing to check
fi

# Run regression check against current working tree (post-bash state)
for primitive in $(resolve_primitives_for_paths "$CHANGED_PROTECTED"); do
  pnpm regression:check --primitive "$primitive" > "$AUDIT_LOG" 2>&1
  RC=$?
  if [[ $RC -ne 0 ]]; then
    # Cannot block (already mutated); emit BLOCKER-level WARN to surface
    echo "[regression-substrate] WARN: bash-mediated change to $primitive triggered regression check fail." >&2
    echo "  Run: git diff -- $CHANGED_PROTECTED" >&2
    echo "  To revert: git restore -- $CHANGED_PROTECTED" >&2
    echo "  To approve: pnpm regression:approve $primitive" >&2
    # Audit: severe, operator-flag
    audit_emit "lab-render-regression-bash" "warn" "$primitive" "..."
  fi
done
```

This matches the existing `mutation-logger.sh` defense-in-depth pattern documented in CLAUDE.loa.md §Safety Hooks.

### §4.3 — Audit

Every block/allow/warn event logged to `.run/audit.jsonl`:
```json
{
  "ts": "2026-05-18T...",
  "kind": "lab-render-regression" | "lab-render-regression-bash",
  "outcome": "blocked" | "allowed" | "override" | "warn",
  "primitive": "CodexCardFace",
  "file_path": "...",
  "tool": "Write" | "Edit" | "Bash",
  "diff_summary": "..."
}
```

---

## §5 · Vitest snapshot strategy

### §5.1 — Test layout

```
tests/regression/
  ├─ setup.ts                          Vitest globals + jsdom DOM
  ├─ render-helpers.ts                 mountPrimitive(props, scale, theme) -> { dom, boundingBox }
  ├─ canary.test.ts                    The substrate's self-proof (FR-S1.4)
  ├─ cards/
  │   ├─ CodexCardFace.snapshot.test.ts
  │   ├─ CardFace.snapshot.test.ts
  │   └─ CardComposition.snapshot.test.ts
  └─ effects/
      ├─ DustMotes.snapshot.test.ts   (S5)
      ├─ Embers.snapshot.test.ts       (S5)
      └─ ...

tests/snapshots/lab/
  ├─ CodexCardFace@1x.png
  ├─ CodexCardFace@1x.json             { boundingBox, metadata, sha256 }
  ├─ CodexCardFace@2x.png
  ├─ ...
  └─ diffs/                            Generated on mismatch (gitignored)
```

### §5.2 — Render helper (Playwright-backed · per Flatline cluster-A)

```ts
import { chromium, type Browser, type Page } from "playwright";

let _browser: Browser | undefined;
async function getBrowser(): Promise<Browser> {
  // Reused across tests in the same vitest worker
  return (_browser ??= await chromium.launch({ headless: true }));
}

export async function mountPrimitive<P>(
  Component: React.ComponentType<P>,
  props: P,
  opts: { scale: 0.5 | 1 | 2; theme: "light" | "dark" }
): Promise<{ page: Page; boundingBox: BoundingBox; pngBuffer: Buffer; sha256: string }> {
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,    // DPR-locked (per Flatline SKP-003 · 710)
  });

  // Inject globals.css + theme + render the component via a small harness page
  await page.goto(`file://${HARNESS_HTML}`);
  await page.evaluate((args) => window.__mount__(args), {
    componentRef: Component.name,
    props: JSON.stringify(props),
    scale: opts.scale,
    theme: opts.theme,
  });
  await page.waitForSelector("[data-mounted]", { state: "attached", timeout: 5000 });

  // Geometry — Playwright's boundingBox() returns DPR-normalized px, NOT the
  // problematic getBoundingClientRect with subpixel float drift.
  const handle = await page.locator("[data-mounted]").first();
  const boundingBox = await handle.boundingBox();
  if (!boundingBox) throw new Error("primitive failed to mount");

  // Image (advisory — primary assertion is boundingBox per §3.1 hierarchy)
  const pngBuffer = await handle.screenshot({ type: "png" });
  const sha256 = createHash("sha256").update(pngBuffer).digest("hex");

  return { page, boundingBox, pngBuffer, sha256 };
}
```

**Why Playwright resolves cluster-A:**
- cqw / container queries: real Chromium computes them correctly
- Three.js: real WebGL via Chromium (vfx-lab effects with 3D scenes work)
- Canvas: native canvas APIs
- Fonts: same font-loading pipeline as production (operator's brand fonts via globals.css load identically)
- DPR: locked to 1.0 in viewport — no Retina/standard-DPR drift (resolves SKP-003 · 710)

**Baseline pinning (per Flatline SKP-002 · 880 · platform-sensitive PNGs):**

PNG snapshots vary across OS (macOS dev vs Linux CI). Resolution: **Docker for baseline capture**.

```
tests/snapshots/
  Dockerfile                   # node:20-bookworm + playwright + repo fonts
  baseline-capture.sh          # entrypoint: clean install, run capture, dump to host
  lab/
    *.png
    *.json
```

Capture and approval flow:
```bash
# Local dev wants to UPDATE a baseline → must use Docker
pnpm regression:approve CodexCardFace    # internally runs the Docker capture
# Hot path (just running tests) does NOT need Docker — the same Chromium build
# inside Docker also runs locally; PNG sha256 drift between local and CI is the
# pixel-diff advisory only, not the geometry block.
```

Geometry assertions remain valid cross-platform (Chromium's layout is deterministic across hosts for the same DPR/viewport). Pixel-diff is the cross-platform-noisy layer; we already demoted it to ADVISORY in §3.1, so platform drift doesn't BLOCK builds.

### §5.2.a — Determinism playbook (per ADR-14)

Visual regression baselines must be deterministic across runs OR the hook surfaces noise that erodes confidence. Render helpers MUST apply the following standard suite:

| Concern | Applied via | Note |
|---|---|---|
| Animation freeze | Playwright `emulateMedia({ reducedMotion: 'reduce' })` + per-effect `playState.paused` for CSS animations | Three.js effects: render at known frame (frame 0 by default; per-effect override) |
| Time mock | `vi.useFakeTimers()` (Vitest layer) + Playwright `addInitScript` setting `Date.now`-poison if any test cares | Required for animation-driven primitives |
| Locale lock | `await page.setExtraHTTPHeaders({'Accept-Language': 'en-US'})` + `locale: 'en-US'` in browser context | Resolves font-substitution + number-format drift |
| Timezone lock | `TZ=UTC` env var on the Vitest process | Resolves date display drift |
| Network isolation | `await page.route('**', route => { if (route.request().resourceType() !== 'document' && !route.request().url().startsWith('file://')) route.abort(); else route.continue(); })` | Blocks external network; allows local file: scheme |
| Font readiness | `await page.evaluate(() => document.fonts.ready)` before snapshot | Required for OKLCH-aware font stacks |
| WebGL determinism | `--use-gl=swiftshader` + `--enable-deterministic-mode` Chromium flags | Required for Three.js scene primitives |
| Image loading | Disable lazy loading via `await page.setExtraHTTPHeaders({ 'X-Force-Eager-Load': '1' })` + harness HTML uses `loading="eager"` | Resolves "snapshot captured before image rendered" |
| Scene-frame seek | Per-effect adapter `freezeAtFrame(frameNum: number)` for animated effects | S5 retrofit task: each animated/Three.js effect implements this |

These apply to ALL primitive baselines from S1a onward. S5.T4-T8 explicitly extend per-effect for Three.js scene-frame freezing.

### §5.3 — Cross-platform robustness summary

| Concern | Where it shows up | Resolution |
|---|---|---|
| cqw rendered as 0 (jsdom) | Geometry baseline wrong | Playwright (real Chromium) |
| Retina vs standard DPR | Geometry varies by ~2× | Viewport `deviceScaleFactor: 1` locked |
| Font hinting (macOS/Linux) | PNG sha256 differs | PNG diff is ADVISORY; Docker for baseline updates |
| Subpixel antialiasing | Per-pixel drift | Pixelmatch tolerance + geometry-first hierarchy |
| Three.js / canvas in jsdom | "not implemented" errors | Playwright renders real WebGL/canvas |

### §5.3 — Canary contract (FR-S1.4)

```ts
// tests/regression/canary.test.ts
import { expect, test } from "vitest";
import { CodexCardFace } from "../../app/battle-v2/_components/cards/CodexCardFace";
import { mountPrimitive, runRegressionCheck } from "./render-helpers";

test("canary: intentional CodexCardFace mutation triggers BLOCK", async () => {
  // Render with mutated props (e.g., explicit width override that breaks ratio)
  const result = await runRegressionCheck(CodexCardFace, {
    slug: "earth-jani",
    debugOverrideWidthPct: 105,  // intentional drift
  }, { scale: 1, theme: "dark" });

  expect(result._tag).toBe("GeometryDrift");
  expect(result.deltaPct).toBeGreaterThan(2);
});

test("baseline: stock CodexCardFace passes", async () => {
  const result = await runRegressionCheck(CodexCardFace, {
    slug: "earth-jani",
  }, { scale: 1, theme: "dark" });

  expect(result._tag).toBe("Match");
});
```

---

## §6 · Data flow

### §6.1 — Effect render path

```
User opens vfx-lab
   │
   ▼
WorkspacesTabs reads useWorkspace().active → "compose"
   │
   ▼
ComposeWorkspace mounts:
   • ComposabilityPanel  (left, ~280px)
   • Viewport (center)
   • Inspector (right, ~320px, may be collapsed)
   • PointerBreadcrumb (top sticky)
   • KnobPane (bottom)
   │
   ▼
Effect's Preview component mounts in Viewport
   • Preview registers `inspectorAdapter` + `composabilityAdapter`
     via AdapterRegistry on mount
   │
   ▼
User clicks an entity in the viewport
   │
   ▼
viewport-click handler dispatches Selection.select(...)
   │
   ▼
Selection state updates (Effect Ref)
   │
   ▼
Inspector + Breadcrumb + ComposabilityPanel re-read selection,
re-resolve pointer chains via adapter, render their pieces.
```

### §6.2 — Hook fire sequence

```
Claude Code about to Write/Edit a file
   │
   ▼
PreToolUse hook fires with { tool, file_path, content }
   │
   ▼
.claude/hooks/pre-tool-use/lab-render-regression.sh
   │
   ▼
Path match? ─NO─→ exit 0 (allow)
   │ YES
   ▼
Stage proposed content to temp + run `pnpm regression:check <primitive>`
   │
   ▼
DiffResult: Match? ─YES─→ exit 0 (allow, log to audit)
                │ NO
                ▼
GeometryDrift or PixelDrift > tolerance?
   │ YES
   ▼
Print BLOCK message to stderr; exit 1
(Operator may set LAB_REGRESSION_OVERRIDE=1 to bypass once)
```

---

## §7 · File map (all cycle deliverables)

```
NEW substrate (lib/):
  lib/regression/
    regression.port.ts
    regression.live.ts
    regression.mock.ts
    schema.ts
    baseline-store.ts
    matrix-permutations.ts
    inspector-adapter.ts
    composability-adapter.ts
    adapter-registry.ts
    adapter-registry.port.ts
    adapter-registry.live.ts
    __tests__/

  lib/ui/icons/
    Icon.tsx
    registry.ts
    provider.tsx
    names.ts
    providers/phosphor.ts
    providers/stub.ts
    providers/lucide.ts
    __tests__/

  lib/lab/pointer-chain/
    pointer-chain.port.ts
    pointer-chain.live.ts
    types.ts
    __tests__/

  lib/lab/state/
    inspector.port.ts
    inspector.live.ts
    workspace.port.ts
    workspace.live.ts
    composability-shape.port.ts
    composability-shape.live.ts

NEW surface (app/battle-v2/_components/lab/):
  PointerBreadcrumb.tsx
  PointerSegment.tsx
  active-entity-context.tsx
  Inspector.tsx
  inspector-context.tsx
  inspector/PointerChainTab.tsx
  inspector/DataTab.tsx
  inspector/RenderTab.tsx
  inspector/EditTab.tsx
  composability/ComposabilityPanel.tsx
  composability/shape-context.tsx
  composability/shapes/ShapeA-FigmaLiteral.tsx
  composability/shapes/ShapeB-FigmaPointerChain.tsx
  composability/shapes/ShapeC-GodotTree.tsx
  workspaces/WorkspacesTabs.tsx
  workspaces/workspace-context.tsx
  workspaces/ComposeWorkspace.tsx
  workspaces/PreviewWorkspace.tsx
  workspaces/ExportWorkspace.tsx
  IconSwapToggle.tsx

MODIFIED:
  app/battle-v2/vfx-lab/page.tsx  (mounts new lab shell)
  app/battle-v2/_components/vfx/VfxRegistry.ts  (wires adapters per effect)
  app/battle-v2/_components/vfx/effects/*.tsx  (S5: each gets adapter exports)
  lib/runtime/runtime.ts  (S1: provides RegressionCheckLive, IconRegistryLive, AdapterRegistryLive)
  app/battle-v2/_components/CardFace.tsx  (S5: imports via IconRegistry)
  .eslintrc.js  (S5: no-restricted-imports rule)

NEW infrastructure:
  .claude/hooks/pre-tool-use/lab-render-regression.sh
  .claude/hooks/settings.hooks.json  (registers new hook)
  package.json scripts: regression:check, regression:approve, regression:canary
  tests/regression/setup.ts
  tests/regression/render-helpers.ts
  tests/regression/canary.test.ts
  tests/regression/cards/*.snapshot.test.ts
  tests/regression/effects/*.snapshot.test.ts  (S5)
  tests/snapshots/lab/*.{png,json}  (baselines)

DOCS:
  grimoires/loa/distillations/session-22-lab-evolution-demo.md  (S5: final)
```

---

## §8 · Migration plan

### §8.1 — IconRegistry adoption order

| Surface | Sprint | How |
|---|---|---|
| New lab chrome (S2-S4 components) | S2-S4 | Born using `<Icon>` from day 1 |
| vfx-lab existing top bar | S5 | Replace inline lucide imports with `<Icon>` |
| KnobPane labels | S5 | Audit + add icon prefixes where labels are verbose |
| Battle-v2 HUD | S5 | Replace lucide imports; preserve current visual |
| CardFace / CardShowcase / HandRack | S5 | Replace lucide imports |
| ZoneOverlay / MapHUD | S5 | Replace lucide imports |
| ESLint rule activation | S5 | `no-restricted-imports` flips on AFTER replacements ship |

### §8.2 — Effect retrofit order (S5)

| Effect | Priority | Notes |
|---|---|---|
| CardComposition | ALREADY done in S2 (first adapter) | Drives adapter pattern design |
| CardLab | S5 high | Closely related to CardComposition |
| HexScene | S5 high | Existing strong test coverage |
| MiniScene | S5 med | |
| BigRealmScene | S5 med | |
| RealmScene | S5 med | |
| ZoneScene | S5 med | |
| TreeFall | S5 low | Animation primitive, less inspector value |
| WaterSplash | S5 low | Animation primitive, less inspector value |

**Cut-line:** If S5 budget exceeded, defer TreeFall + WaterSplash to a follow-up cycle with explicit retrofit-debt entry in `grimoires/loa/NOTES.md`.

### §8.3 — Branch / git workflow

1. **Before S1**: Operator commits in-flight working-tree changes on `feat/ecs-leaves-2026-05-17` (CardFace.tsx, VfxConfig.ts, VfxRegistry.ts, palette.ts, MAP.md, CardComposition.tsx + new cards/ folder).
2. **Sprint S1**: Branch `feat/lab-evolution-s1-substrate` off the clean state. Draft PR. Operator review. Merge to `feat/ecs-leaves-2026-05-17`.
3. **Sprint S2-S5**: Each branches off `feat/ecs-leaves-2026-05-17` HEAD after prior sprint merges. Same draft-PR flow.
4. **Cycle close**: Final PR from `feat/ecs-leaves-2026-05-17` → `main` after operator demo + distillation.

---

## §9 · Security / privacy considerations

- Hook reads stdin JSON only (existing pattern); no network calls
- Baseline images contain only lab-rendered content (mock data, no PII)
- IconRegistry has no runtime IPC; pure component mapping
- All new state lives in-memory; no persistence outside session

---

## §10 · Performance budgets

| Op | Budget | Enforcement |
|---|---|---|
| Hook latency P95 | < 8s for affected-primitive subset | Hook fail-open with WARN if exceeded |
| Vitest full snapshot run (CI) | < 60s for all primitives | Vitest concurrency + scale-matrix parallelization |
| Inspector mount | < 16ms | React profiler in dev; no heavy compute in render |
| Workspace switch | < 100ms | State restore via Ref; no re-mount of viewport |
| IconRegistry lookup | O(1) | Static map; no runtime fallback walks |
| Pointer breadcrumb compute | < 4ms per segment | Memoized chain resolution |

---

## §11 · Risks (technical · post-Flatline-review)

| Tech risk | Mitigation |
|---|---|
| Playwright cold-start adds latency | Reuse browser per vitest worker (`getBrowser()` singleton); CI parallelism unaffected; pre-warm before first snapshot per test file |
| Docker baseline-capture is slower than local | Only required on baseline updates (`pnpm regression:approve`), not on hot-path checks. Hot path runs same Chromium build locally. |
| Pixelmatch antialiasing flakiness | Geometry-first assertion (boundingBox) is PRIMARY; pixel diff is ADVISORY (§3.1 hierarchy) |
| Adapter pattern leaks effect internals | First adapter (CardComposition) ships with explicit "what's allowed" doc in `lib/lab/adapter-registry/types.ts` JSDoc; surface-side adapter location keeps effect internals where they belong |
| Workspace state restore causes stale knob bugs | Per-workspace reset action; documented as "if knobs feel off, switch and back to reset" |
| Hook blocks legit work mid-iteration | `LAB_REGRESSION_OVERRIDE=1` env escape hatch + clear approval-flow message + audit trail |
| Composability shape-picker leaves dead code | S5 cleanup removes unselected shapes; tracked as S5 punchlist item |
| Three.js scene primitives don't fit 2D inspector model | InspectableNode `kind: "scene"` is rendered as opaque "scene root" with no further drill-in (acceptable V0; future ADR for scene-graph inspector) |
| Effect 3.10 vs 3.x patterns drift | Use `import { Schema } from "effect"` style consistently; SDD pins one idiom |
| Edit-patch reconstruction races a write that already happened | `apply_edit_patch` is deterministic; if `old_string` not found in current content, BLOCK with reason — same failure mode Claude Code itself produces |
| Worktree staging adds ~500ms per hook fire | Inside 8s budget; alternative (in-place file copy) broke imports per SKP-002 |
| Bash-mediated mutation slips through PreToolUse | PostToolUse:Bash hook (§4.2) provides defense-in-depth; alerts even though cannot block |

---

## §12 · Closed ADRs (resolved during Flatline SDD review · 2026-05-18)

These questions were OPEN in the first SDD draft and are now LOCKED via Flatline review + operator ratification.

| # | Question | Decision | Source |
|---|---|---|---|
| ADR-1 | Snapshot backend (jsdom vs Playwright) | **Playwright** — only path that handles cqw, fonts, canvas, Three.js. jsdom reserved for non-layout unit tests. | Flatline cluster-A + operator (2026-05-18) |
| ADR-2 | Adapter location (lib vs surface) | **Surface-side**: `app/battle-v2/_components/vfx/effects/<effect>/adapter.ts`. Contract enforced by TS interface in `lib/lab/`, not file location. | Flatline SKP-006 + operator (2026-05-18) |
| ADR-3 | InspectableNode type contract | **Explicit struct** with `{id, label, kind, pointerChain, inspectable, metadata}` (see §3.4). Aligned with EntityTreeNode for shared rendering. | Flatline SKP-005 + operator (2026-05-18) |
| ADR-4 | Hook Edit-tool handling | **Reconstruct via `apply_edit_patch` helper** in `.claude/scripts/edit-patch-apply.sh`. Failure to apply patch → BLOCK with reason. | Flatline SKP-003 + operator |
| ADR-5 | Hook staging strategy | **Git worktree** (`.run/regression-staging/$$`). Preserves imports + tsconfig + Next.js transforms. | Flatline SKP-002 + operator |
| ADR-6 | Bash bypass coverage | **PostToolUse:Bash hook** (§4.2). Cannot block (post-mutation), but emits WARN + audit trail. | Flatline SKP-004 + operator |
| ADR-7 | Timeout policy | **CI fail-closed, local fail-open + audit**. Detection of CI via `$CI` / `$GITHUB_ACTIONS`. | Flatline SKP-001 + operator |
| ADR-8 | Platform-sensitive baselines | **Docker for baseline capture only** (`pnpm regression:approve`). Hot-path uses local Chromium. PNG diff is ADVISORY in §3.1 hierarchy. | Flatline SKP-002 (PNG cluster) + operator |
| ADR-9 | RegressionCheckLive in production AppLayer | **Env-gated**: `if (NODE_ENV === 'development' \|\| LOA_REGRESSION === '1')` use `RegressionCheckLive`; otherwise `RegressionCheckNoop`. Production bundle does NOT include Playwright. | Flatline sprint SKP-004 (750) + operator |
| ADR-10 | Hook posture (PreToolUse vs pre-commit) | **Pre-commit hook (`.husky/pre-commit`) is the authoritative fuse**. PostToolUse:Write\|Edit\|Bash is WARN-only (non-blocking, fast feedback). Pre-commit fires for ALL agents (Codex/Loa/manual). | Flatline sprint SKP-001 (920) + SKP-001 (880) + operator |
| ADR-11 | Hook self-locking loop prevention | Rollback runbook at `grimoires/loa/runbooks/regression-hook-rollback.md` + `LOA_REGRESSION_HOOK_BYPASS=1` env var + `settings.hooks.json` is NOT in protected-path set. Bypass audited. | Flatline sprint SKP-002 (820) + operator |
| ADR-12 | Adapter registration model | **Static** (module-load time). Adapters export from each effect's `index.ts`; `VfxRegistry.ts` imports and registers at startup. Lab can query inactive effects' capabilities. No mount-time race conditions. | Flatline sprint SKP-002 (780) + operator |
| ADR-13 | Schema lock timing | S1b ships `lib/lab/pointer-chain/schema.ts` with `@version draft-S1` marker + `TODO: lock after S3.T9`. S3.T10 removes draft marker after 3 shape renderers validate. Schema versioned 1.0 from S3 onward. | Flatline sprint SKP-005 (720) + operator |
| ADR-14 | Visual regression determinism playbook | Playwright render helpers MUST apply: `vi.useFakeTimers()` for time mocks · `emulateMedia({reducedMotion: 'reduce'})` · `locale: 'en-US'` · `TZ=UTC` · `route('**', abort)` for external network · `await document.fonts.ready` · WebGL deterministic flags. Three.js / animated effects (S5 retrofit) extend with per-effect freeze-at-known-frame. | Flatline sprint SKP-004 (710) + operator |

### §12.1 — Still-open (lower-stakes, deferred to runtime decisions)

| Q | Status | Plan |
|---|---|---|
| Composability tree denormalization (render-time vs build-time) | OPEN | Ship render-time in S3; capability-driven rendering is a future cycle topic |
| Selection.nodeId opaque-per-primitive vs substrate-wide ID space | OPEN | S2 ships opaque-per-primitive; revisit if a cross-primitive selection use case appears |
| Workspace ID stability (string vs enum vs symbol) | OPEN | Ship string literals in S4; if plugin model materializes, ADR-9 follows |
| PR baseline drift visualization (inline PNGs vs file refs) | OPEN | S1 ships file refs; S5 evaluates if inline rendering needed for review-flow |

---

## §13 · Acceptance gates (per sprint)

| Sprint | Must-pass to close |
|---|---|
| S1 | Canary test fails before fix and passes after · hook blocks an intentional drift · IconRegistry swap demo works (Phosphor↔Stub) · 5 sentinel icons usable |
| S2 | PointerBreadcrumb renders for CardComposition · Inspector right-rail opens on click · first adapter registered |
| S3 | All 3 composability shapes render · header switcher works · operator can name canonical shape |
| S4 | 3 workspaces present · keyboard shortcuts work · state preserved across switches |
| S5 | All 9 effects have adapters + baselines · no direct icon imports outside `lib/ui/icons/` (ESLint passes) · cycle demo recorded · distillation written |

---

## §14 · Composition with constructs (OperatorOS v3.3)

- **the-arcade** (BARTH primary): SHIP discipline, sprint plan, cycle DoD enforcement
- **artisan** (ALEXANDER lens): craft compliance — pointer chain UX taste, icon weight/size choices, OKLCH palette adherence
- **k-hole** (STAMETS lens): 3 digs returned, findings folded into §3 (boundingBox primary), §3.7 (Figma layers shape), §3.5 (Inspector adapter doctrine)
- **vfx-playbook** (lens): P2 pointer-chain at title-bar → §3.3, P3 reference pane → §3.6 Shape B, P6 tier-stamp gate → DEFERRED to graduation cycle

Per construct-domain-boundaries doctrine: `construct_affinity` on this SDD = `[cross-domain]` (spans the-arcade, artisan, k-hole, vfx-playbook).

---

## §16 · Flatline sprint review integration (2026-05-18 · second review)

A second Flatline 3-model run on the sprint plan surfaced 10 BLOCKERs (4 CRITICAL + 6 HIGH). All operator-ratified resolutions integrated into ADR-9 through ADR-14 and into the sprint structure:

| Cluster | Issue | Resolution | SDD section |
|---|---|---|---|
| Hook latency (920) | PreToolUse + Playwright = 10-20s/edit cripples agent autonomy | Pre-commit hook is authoritative; PostToolUse is WARN-only | §4 + ADR-10 |
| Hook coverage (880) | Claude hooks don't fire for Codex/Loa | Pre-commit (git hook) covers ALL agents | ADR-10 |
| Self-lock (820) | False-positive blocks editing settings.hooks.json | Rollback runbook + bypass env var + settings excluded from protected paths | ADR-11 |
| S0 missing (800) | No calibration spike for Playwright + Docker | S0 added per cycle-1 doctrine | sprint.md §S0 |
| Mount-time adapters (780) | Race + can't query inactive effects | Static module-load registration | ADR-12 |
| Per-sprint preflight (760) | Branch base-SHA verification missing | Per-sprint preflight protocol | sprint.md §M |
| Prod pollution (750) | RegressionCheckLive in production AppLayer | RegressionCheckNoop layer for production | ADR-9 |
| S1 too broad (735) | 30 tasks in one sprint | Split S1a (regression) + S1b (UI substrate) | sprint.md §S1a + §S1b |
| Schema too early (720) | S1 lock blocks S3 evolution | `@version draft-S1` in S1b; locks in S3 | ADR-13 |
| Determinism (710) | Time/animation/locale/WebGL underspecified | Determinism playbook | §5.2.a + ADR-14 |

---

## §15 · Flatline SDD review integration (2026-05-18)

3-model Flatline (codex-headless + claude-headless + gemini-3.1-pro-preview) ran on the first SDD draft. Result: **13 BLOCKERS surfaced (12 real, 1 false-alarm verified by Bash)**. Full output at `grimoires/loa/a2a/flatline/lab-evolution-sdd-2026-05-18.json`.

Operator ratified all three cluster resolutions (2026-05-18):

| Cluster | Issue | Resolution | SDD section |
|---|---|---|---|
| A | jsdom can't render cqw/canvas/Three.js/fonts (4 findings · top 950) | Lock Playwright as snapshot backend | §2 + §5.2 + ADR-1 |
| B | Hook spec missed Edit-patches / Bash / platform / imports / timeout (5 findings · top 880) | Re-spec hook with Edit reconstruction · PostToolUse:Bash · Docker baselines · worktree staging · CI fail-closed | §4 + ADR-4–ADR-8 |
| C | InspectableNode phantom · adapter location open (2 findings · top 760) | Define InspectableNode struct · lock adapter location surface-side | §3.4 + ADR-2 + ADR-3 |

Net effect: SDD is significantly more rigorous than first draft. The 5 minutes of Flatline + 30 minutes of integration saved the cluster-A / cluster-B rework that would have surfaced in S1 implementation (estimated cost: 1-2 days of debugging + baseline re-capture).

---

*SDD authored 2026-05-18 during /simstim Phase 3. Flatline SDD review (Phase 4) caught 12 real BLOCKERs; all resolved via 8 closed-ADRs (§12). Ready for Bridgebuilder 3.5 design review next. Branch `feat/ecs-leaves-2026-05-17`.*
