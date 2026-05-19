---
type: doctrine
status: active
authored: 2026-05-19
audience: agents · operator
relates_to:
  - feedback_director-mode (operator vault)
  - feedback_substrate-not-ui-islands
  - feedback_substrate-trust-over-measurement
  - construct-fagan
---

# Architectural ↔ Creative Split

> The operator works in two modes that need different scaffolding. Architecture wants rigor. Creative wants flow. The substrate must serve both without collapsing them.

## The split

| Lens | Driver | Substrate | Auto-checkpoint |
|---|---|---|---|
| **Architectural** | FAGAN (codex CLI, GPT-5.5, subscription auth) | invariants, schemas, contracts, state machines, hashes, tests | `.claude/hooks/fagan-checkpoint.sh` (PostToolUse) |
| **Creative (FEEL)** | Claude Opus 4.7 (you) | perception, motion, material, taste, atmosphere | none — Opus IS the checkpoint |

This is not a hierarchy. It is two halves of the same loop. Architectural work without creative sense ships brittle substrates that no one wants to use. Creative work without architectural rigor ships beautiful things that break under load. The operator oscillates between the two; agents must do the same.

## What the path filter sees

The classifier in `.claude/hooks/fagan-checkpoint.sh` fires on paths matching architectural shape. It is a coarse first pass — when in doubt, it defaults to **SKIP** because Opus is the better default. Operator-corrected misses can be added to the explicit allowlist below.

**Architectural (fires FAGAN reminder):**

- Effect substrate naming: `*.schema.ts`, `*.schema.tsx`, `*.port.ts`, `*.live.ts`, `*.config.ts`
- `lib/*/state/**` — Effect state ports and live impls
- `lib/cards/codex/**` — canonical pantry primitives
- `lib/lab/adapter-registry/**` — adapter pattern surface
- `lib/lab/pointer-chain/**` — pointer schema
- `lib/lab/state/**` — lab substrate
- `app/*/state/**` — app-local state machines
- `**/__tests__/*.test.ts` — substrate verification
- `scripts/**` (excluding `scripts/spikes/**` — exploration is not contract)
- `.claude/hooks/**`, `.claude/scripts/**` — hook authoring
- `.claude/constructs/packs/*/scripts/**`, `**/schemas/**` — construct logic

**Creative / FEEL (silent — Opus territory):**

- `*.css`, `**/globals.css`, `**/tailwind.config.*` — tokens
- `**/effects/CardComposition.tsx`, `**/effects/TreeFall.tsx`, `**/effects/WaterSplash.tsx` — visual effect implementations
- `**/_components/vfx/effects/*.tsx` — VFX layer in general
- `**/components/theme/**` — theme materialization
- `**/AnimatedFavicon.tsx` — pure presentation
- `*.spikes/**` — sandboxed exploration
- Everything else in `app/`, `components/` by default

**Borderline (default to SKIP, operator promotes case-by-case):**

- `app/**/_components/**/dock-shell/**.tsx` — layout primitives that encode invariants. Today's session was architectural; tomorrow's edit might be a color tweak. Classifier can't tell from the path alone.

## How the hook behaves

1. PostToolUse fires after `Edit`/`Write`/`MultiEdit`.
2. Path is classified. If creative → silent exit. If architectural → continue.
3. Touched file is appended to `.run/fagan-checkpoint/session.jsonl`.
4. **Debounce:** if a reminder fired in the last 5 minutes (`FAGAN_DEBOUNCE_SECONDS` overrides), this fire is silent — the file is still logged for batch review, but no new reminder injected. Avoids spamming mid-cluster.
5. Otherwise: inject `hookSpecificOutput.additionalContext` with a soft prompt — "consider running `/reviewing-diffs` or `/reviewing-files` before declaring done." Agent decides.

## What the agent should do when prompted

1. **Don't reflexively run review.** A typo fix is not architectural. A schema change is.
2. **Look at the session log** — `.run/fagan-checkpoint/session.jsonl` shows the accumulated arch surface. If it's grown to 3+ files, batch-review the cluster.
3. **Prefer `/reviewing-diffs` over `/reviewing-files`** when there's a committed or staged diff — diff context catches what file-level audit misses (e.g., a deleted invariant).
4. **Skip without guilt** if the change was mechanical (rename, typo, import order, single dead-code removal).
5. **Surface FAGAN's verdict to the operator** — don't paraphrase. Either APPROVED → continue, or CHANGES_REQUIRED → fix before moving on.

## What this doctrine does NOT prescribe

- **What "creative" Opus should do.** That's not the hook's business. Opus self-steers; this doctrine just keeps FAGAN from intruding.
- **Pre-commit gating.** The hook is a *reminder*, not a *gate*. Operator velocity > enforcement.
- **Cross-domain review.** A change that's BOTH architectural AND creative (DockShell tightening invariants + a color tweak) is rare enough to handle ad hoc.

## Why this exists

Operator 2026-05-19: *"I think a GPT review, as a rigorous review from a software engineer or expert software engineer on the actual game engineering elements that we will go through here, will be valuable. … Claude Opus itself is still the best for steering on the creative domains."*

The hook materializes that split as substrate, not as discipline the agent has to remember. The substrate is the discipline.

## Tuning

| Setting | Default | Purpose |
|---|---|---|
| `.loa.config.yaml::fagan_review.enabled` | `true` | Master toggle |
| `FAGAN_DEBOUNCE_SECONDS` env | `300` | Min seconds between reminders in a session |
| `.run/fagan-checkpoint/session.jsonl` | — | Touched-arch-file log; agent reads to batch |
| `.run/fagan-checkpoint/last-fire.epoch` | — | Last reminder fire timestamp |

Delete `.run/fagan-checkpoint/last-fire.epoch` to force-fire the next reminder.
