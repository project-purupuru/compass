---
status: active
type: goal
cycle: purupuru-cycle-1-wood-vertical-2026-05-13
source: PRD r2 + SDD r1 (both flatline-integrated · post-orchestrator)
created: 2026-05-13 PM
operator: zksoju
---

# /goal · Purupuru Cycle 1 · Wood Vertical Slice

## Headline

Ship the **purupuru cycle-1 wood vertical slice**: a greenfield `lib/purupuru/` namespace implementing Gumi's architecture harness end-to-end, surfaced at `/battle-v2`, with the 11-beat wood activation sequence playing deterministically against 1 schema-backed `wood_grove` zone + 4 decorative locked tiles. Substrate (the 7-component ACVP application: reality + contracts + schemas + state machines + events + hashes + tests) validates end-to-end through golden replay.

## Done conditions (falsifiable)

1. **S0 calibration**: `pnpm s0:preflight` + `pnpm s0:spike` both exit 0. `lib/purupuru/schemas/PROVENANCE.md` exists with 17 SHA-256 entries. AJV validates `element.wood.yaml` against `element.schema.json`. Spike script deleted on audit. (AC-0 + AC-2b)
2. **S1 schemas + contracts + loader + design-lints**: 8 schemas vendored · `validation_rules.md` vendored · `types.ts` with 15-member SemanticEvent union · `loader.ts` two-pass · `pnpm content:validate` clean · 5 design lints green. (AC-1 / AC-2 / AC-2a / AC-3 / AC-3a / AC-4)
3. **S2 runtime**: 3 state machines + event-bus + input-lock (5-state lifecycle per SDD §6.5) + command-queue + resolver (5 ops + 5 commands · daemon_assist reserved as no-op stub) + golden replay test green. AC-7 sequence pattern matches `^CardCommitted,ZoneActivated,ZoneEventStarted,DaemonReacted(,RewardGranted)+$`. (AC-5 / AC-6 / AC-7 / AC-9 / AC-14 / AC-15)
4. **S3 presentation**: 4 target registries (anchor + actor + UI-mount + audio-bus) + sequencer with injectable Clock + 11-beat wood-activation sequence · all 11 beats fire at correct `atMs` offsets ±16ms with mock registries. (AC-8 / AC-9 / AC-15)
5. **S4 `/battle-v2` surface**: UiScreen (slot-driven from `ui.world_map_screen.yaml`) + WorldMap (1 real + 4 locked) + ZoneToken (10+6 state compose) + CardHandFan (via `harnessCardToLayerInput()` adapter) + SequenceConsumer + styles. Playwright E2E: hover wood card → grove pulses → click → 11-beat sequence → unlock → ZoneEvent active. Decorative tiles reject commands. Operator visual review at S4 close. (AC-10 / AC-11)
6. **S5 integration + telemetry + docs**: `PURUPURU_RUNTIME` + `PURUPURU_CONTENT` exports wired into `lib/registry/index.ts` · `CardActivationClarity` telemetry event emits via Node sink (JSONL) and browser sink (console.log) with shared shape · `app/kit/page.tsx` link to `/battle-v2` · cycle README · final gate at `/review-sprint sprint-5` + `/audit-sprint sprint-5`. (AC-12 / AC-13 / AC-16 / AC-17 / AC-18)
7. **Full audit-passing slice**: every sprint clears `/implement → /review-sprint → /audit-sprint`. Net LOC ≤ +4,500.
8. **Substrate property proven**: replay determinism · serializable game state · presentation never mutates · 15-member SemanticEvent union complete · golden fixture round-trip.

## Hard NO

- ❌ Three.js / R3F (cycle 2)
- ❌ Daemon AI behaviors (cycle 2 · `affectsGameplay: false` everywhere · `daemon_assist` reserved type slot only)
- ❌ 4 non-wood elements (cycle 2 × 4 sprints)
- ❌ Card play against decorative locked tiles (cycle 2 validation feedback path)
- ❌ Browser-to-server-to-JSONL telemetry (cycle 2 route handler)
- ❌ Transcendence cards (cycle 3)
- ❌ Soul-stage AI agents (cycle 3+)
- ❌ Real cosmic-weather oracles (cycle 4+)
- ❌ Daily-duel-against-friend retention loop (cycle 4+)
- ❌ Migration of `lib/honeycomb/` or `lib/cards/layers/` (cycle 2+)
- ❌ Refactor of existing `/battle` route
- ❌ Mobile-first polish (desktop-first cycle)
- ❌ Wallet / auth / Solana surface (sim-only)
- ❌ Naming harness creator (Gumi) or referencing indie games in code comments (sanitization)
- ❌ 4 other-element SKY EYES motifs (cycle 2 · `sky-eyes-motifs.ts` ships wood-only)

## Sequencing

| Sprint | Theme | Days | LOC | Gate |
|---|---|---|---|---|
| S0 | AJV + harness preflight + calibration spike (delete-after) | 0.5 | ~150 (net 0) | AC-0 + AC-2b |
| S1 | Schemas + contracts + loader + 5 design-lints | 2.5 | ~900 | AC-1/2/2a/3/3a/4 |
| S2 | Runtime · 3 state machines · resolver (5 ops + 5 commands) · input-lock lifecycle · golden replay | 3.0 | ~1100 | AC-4/5/6/7/9/14/15 |
| S3 | Presentation · 4 target registries · sequencer · 11-beat wood sequence | 2.0 | ~700 | AC-8/9/15 |
| S4 | `/battle-v2` surface · 1 real zone + 4 locked tiles · FR-21a adapter · operator visual review | 3.5 | ~1200 | AC-10/11 + R10/R11 review |
| S5 | Registry export · bifurcated telemetry · cycle README · final gate + E2E validation | 1.5 | ~400 | AC-12/13/16/17/18 |

**Critical path: 13 days strict sequential** (no parallelization · each layer fully built + audited before next consumes).

## Substrate properties to assert end-to-end

Per [[agentic-cryptographically-verifiable-protocol]] (vault parent concept):

| Property | How cycle-1 proves it |
|---|---|
| **Reality** | `GameState` typed + serializable; round-trips through JSON |
| **Contracts** | 15-member `SemanticEvent` union + 5 GameCommand union + 6 ResolverStep ops |
| **Schemas** | 8 vendored JSON schemas + AJV-validated YAML content |
| **State machines** | 3 transition tables with `never`-assert exhaustiveness · 10+6 state compose for zones |
| **Events** ⚡ | `CardCommitted → ZoneActivated → ZoneEventStarted → DaemonReacted → RewardGranted+` deterministic sequence emitted by pure resolver |
| **Hashes** 🔒 | `PROVENANCE.md` with SHA-256 per vendored file (S0-T0) · golden-fixture content-addressing (AC-7) |
| **Tests** | Vitest replay + state-machine + sequencer + input-lock + serialize · Playwright E2E |

## Cycle-1 boot prompt (for /run-bridge or sprint-by-sprint)

```text
Sprint plan: grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/sprint.md
PRD r2: grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/prd.md
SDD r1: grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/sdd.md
GOAL: grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/GOAL.md (this file)
Branch: feat/purupuru-cycle-1 (worktree at /Users/zksoju/Documents/GitHub/compass-cycle-1)

Substrate framing: this is the first named application of ACVP (agentic
cryptographically verifiable protocol). The 7-component substrate is what
makes /battle-v2 deterministic, replayable, and verifiable by agents 6 months
from now. Substrate work IS the cycle's value; the UI is dramatization of
substrate truth.

Hard NOs per GOAL.md must be respected. The 4 decorative locked tiles in S4
are render-only — they CANNOT accept commands (per D9 + AC-11 reject test).
The browser sink for telemetry is console.log ONLY in cycle-1 (Node sink
writes JSONL; cycle-2 adds route handler).
```

## Operator-runnable prompts (literal copy-paste)

### Step 0 — Run the calibration spike

```text
cd /Users/zksoju/Documents/GitHub/compass-cycle-1
pnpm s0:preflight
pnpm s0:spike
```

Both must exit 0 before S1 starts.

### Step 1 — /run-bridge sprint-plan (autonomous mode)

```text
/run-bridge sprint-plan --branch feat/purupuru-cycle-1
```

Or per-sprint:

```text
/run sprint-1
/review-sprint sprint-1
/audit-sprint sprint-1
# repeat for sprint-2 through sprint-5
```

### Step 2 — Cycle close

```text
/ship purupuru-cycle-1-wood-vertical-2026-05-13
/archive-cycle purupuru-cycle-1-wood-vertical-2026-05-13
```

## Acceptance condition for /goal hook

Clears automatically when all 6 `sprint-{0..5}-COMPLETED.md` markers exist AND `CYCLE-COMPLETED.md` exists at the cycle directory. Operator decides on cycle-2 kickoff from there.

---

*Substrate as agentic cryptographically verifiable protocol. Cards · zones · daemons · sequences · events · hashes · tests. 6 sprints. One canonical wood activation. Truth-seeking in a sandbox.*
