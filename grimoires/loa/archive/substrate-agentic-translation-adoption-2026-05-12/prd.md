---
status: post-flatline-r1-patched
type: prd
cycle: substrate-agentic-translation-adoption-2026-05-12
mode: arch + adopt
input_brief: grimoires/loa/specs/simstim-brief-substrate-agentic-2026-05-12.md
review: grimoires/loa/a2a/flatline/prd-review-2026-05-12.md
created: 2026-05-12
revision: post-flatline-r1 · 4 BLOCKERS resolved by operator HITL · 12 HIGH_CONSENSUS auto-integrated · grounding errors corrected
operator: zksoju
---

# PRD · Substrate-Agentic Translation Layer · Compass Adoption Cycle

## 0 · TL;DR

Conform compass to canonical loa substrates — `loa-hounfour` typed schemas (hand-ported · v7.0.0 SHA-pinned · Effect Schema reimplementation) · `construct-rooms-substrate` handoff envelope (vendored as JSON for production) · `loa-straylight` continuity-under-authorization doctrine (compile-time + doc-only · zero runtime imports until Phase 23b lands) — so that compass's **world experience** (observatory · ceremony · awareness · weather · activity · sim) gains a Next.js substrate + agent-navigable system layers that the operator can iterate on quickly. The **purupuru card game already exists** at `purupuru-game` (SvelteKit prototype · 18 cards · Wuxing battle mechanics) — compass does NOT host the card game; compass hosts the world that the card game eventually composes into.

**Core reframe** (PRAISE-001 · load-bearing through SDD): the original 5-doc Gemini synthesis (`grimoires/loa/context/07..11-*.md`) proposed inventing a translation layer. KEEPER pre-flight + grounding in upstream repos established that the translation layer **already exists**. This cycle is INTEGRATION, not invention.

## 0.5 · Pre-decided architecture choices (NEW · operator-ratified · supersedes §11 deferrals)

These four choices are PRD-level commitments. SDD elaborates HOW; SDD does not re-open WHAT.

| Decision | Choice | Rationale |
|---|---|---|
| **D1 · Type-system bridge** (was §11 Q1) | **Hand-port** ~5 hounfour schemas as compass-owned Effect Schemas | compass uses `effect/Schema`; hounfour uses `@sinclair/typebox` — incompatible. Hand-porting honors G5 LOC math, gives compile-time wins, accepts drift-detection as a quarterly CI rule |
| **D2 · Straylight S3** | **Doc-only force-chain mapping + compile-time brand-type fence · zero runtime imports** | Phase 23a is "schema-contract draft only · runtime BLOCKED on hounfour v8.6 delta #8 (estate-transition.schema)." When 23b lands, swap implementation. Honors PRAISE-001 |
| **D3 · S4 scope** | **Next.js substrate + agent-navigable system layers for the WORLD experience · NOT card game design** | Card game already exists at `~/Documents/GitHub/purupuru-game` (SvelteKit · 18 cards · transcendence). Compass hosts the world; the game composes in via separate cycle. S4's customer is the operator's iteration speed + the agent's navigation clarity |
| **D4 · Persistence** (was §11 Q4) | **In-memory only** for any new system layer in this cycle. Future world↔game integration is its own cycle | Compass's existing Solana/KV bindings unchanged. New systems are pure |
| **D5 · Adapter location** (was §11 Q5) | **No new `lib/adapters/` folder** — chain bindings live in `lib/live/solana.live.ts` (a Live Layer like any other consuming hounfour-typed envelopes via ports) | Preserves four-folder discipline (PRAISE-005). `*.solana.live.ts` suffix when chain-disambiguation needed |
| **D6 · Adoption order** | **Envelope SHELL first (S1) · backfill verdict typing (S2) · doc-only force-chain (S3) · world substrate (S4)** | S1 ships envelope with `verdict: Type.Unknown()` placeholder; S2 narrows to hand-ported hounfour union. Avoids back-references |

## 1 · Problem

### 1.1 · Surface symptom

Compass shipped a substrate-simplification cycle (commit `f4ce25e` · 2026-05-10) that ECS-ified domain code under the four-folder pattern (`domain/ports/live/mock`). Two surfaces remain hand-rolled (`lib/activity/index.ts:42-48` · `lib/sim/population.system.ts:69`) using a `subscribe(cb)` pattern. The substrate doctrine names this exact pattern as a SIGNAL TO ADOPT into Effect's `PubSub` + `Stream` primitives.

If we migrate without alignment, the envelope shape compass invents will diverge from the rest of the loa ecosystem.

### 1.2 · Root problem (verified counts)

Three loa repos provide what compass needs · all verified 2026-05-12:

| Need | Provided by | Verified state |
|---|---|---|
| Cross-construct envelope shape | `construct-rooms-substrate` · `data/trajectory-schemas/construct-handoff.schema.json` (5 enum: Signal/Verdict/Artifact/Intent/Operator-Model) + `room-activation-packet.schema.json` | Operator-machine path · NOT npm-published · vendored as JSON for compass production deploy (D5) |
| Typed schemas for agent identity, lifecycle, capabilities, audit | `loa-hounfour@7.0.0` · **92 .schema.json files** (14 dist .d.ts exports) including `agent-identity` · `agent-lifecycle-state` · `agent-descriptor` · `agent-capacity-reservation` · `audit-trail-entry` · `capability-scoped-trust` · `bridge-invariant` · `domain-event` · `lifecycle-transition-payload` · `conformance-vector` | TypeBox schemas · NOT compatible with compass's `effect/Schema` · hand-port the candidate set (D1) |
| Verify⊥judge fence · governed memory · signed assertions · recall receipts | `loa-straylight` · Phase 23a continuity-under-authorization | **Schema-contract DRAFT only · runtime BLOCKED on hounfour v8.6 delta #8 (estate-transition.schema not yet authored)** · zero npm release · S3 is doc-only (D2) |

Authoring a parallel `construct-translation-layer` pack would duplicate all three. The operator's stated constraint — "we don't want to end up creating more modules than we need to" — names this risk explicitly.

### 1.3 · Strategic problem

Compass is one of three purupuru-family repos · **`compass` (Next.js · this hackathon submission) · `world-purupuru` (SvelteKit · Spiral engine · canonical world) · `purupuru-game` (SvelteKit · 18-card battle prototype)**. They speak different stacks but should share substrate vocabulary. If compass conforms to canonical schemas + envelopes, the adoption pattern compounds. Sprawl, Mibera, Pru worlds get the playbook for free. If compass diverges, every subsequent world chooses between upstream canonical and compass-specific drift.

## 2 · Goals

### 2.1 · Primary goals

- **G1** · Compass conforms to `construct-rooms-substrate` handoff envelope at every cross-bounded-context emission · grep-verifiable · 100% of `world-event.ts` discriminated-union variants tagged with one of 5 typed-stream values (IMP-014)
- **G2** · Compass hand-ports a named candidate set (~5 schemas) of `loa-hounfour@7.0.0` types as Effect Schemas (D1) · structural conformance verified via runtime AJV against upstream JSON Schema
- **G3** *(reframed)* · Compass's verify⊥judge fence is documented as a 9-step force-chain mapping (per straylight doctrine) AND enforced as a compile-time TypeScript brand-type fence · ZERO straylight runtime imports until Phase 23b unblocks
- **G4** *(reframed)* · Compass gains a **Next.js substrate + agent-navigable system layers** for the world experience (observatory · ceremony · awareness · weather · activity · sim) such that the operator can iterate any system and the agent can navigate the structure via grep alone. Card game integration is a SEPARATE downstream cycle
- **G5a** *(revised post-sprint-review SP-002/SP-003)* · Substrate-conformance LOC delta (S0+S1+S2+S3+S6 · scoped to `lib/` and `packages/peripheral-events/`) ≤ **+500 net** (includes hand-port floor +400 + envelope shell +200 + fence +50 - legacy removal -80 - other shrinkage). Honest accounting after sprint review caught the math wasn't closing. **Target: -100 LOC of NON-hand-port code** (net ALL substrate-refactor work that isn't hand-ports themselves should shrink by 100). Measured per-category at S6 close.
- **G5b** *(split)* · World-substrate LOC budget (S4 · `lib/world/`) ≤ **+600** · operator pair-point if exceeded
- **G5c** · Cycle net LOC ≤ **+1200** including world substrate · soft-fail requiring justification

### 2.2 · Secondary goals

- **G6** · Multi-world adoption playbook drafted at `grimoires/loa/specs/per-world-adoption-playbook.md` · 1-page checklist · Pru/Sprawl/Mibera each get 1 paragraph naming what adoption would mean · references real file:line per target (otherwise the paragraph is theater · IMP-S5)
- **G7** · `construct-effect-substrate` doctrine pack updated with the integration story · status promoted from `candidate` → `validated · 1-project · adopting hounfour as canonical schema source`
- **G8** *(restructured · IMP-009)* · Tracking issues opened on `loa-hounfour` + `loa-straylight` + `construct-rooms-substrate` (3/3) within 24h of S0 close. Eileen/Jani sign-off captured if received within 7 days; absence of NACK = passive accept; cycle ships independently

### 2.3 · Non-goals (explicit cuts)

- ❌ NO new `construct-translation-layer` pack (CI lint enforces · `find . -path '*/construct-translation-layer*'` returns empty)
- ❌ NO new `lib/adapters/` folder (D5)
- ❌ NO card game design or implementation (D3 · `purupuru-game` already ships this)
- ❌ NO straylight runtime imports (D2 · zero `assert()` / `recall()` calls)
- ❌ NO TypeBox in compass dependencies (D1 · effect/Schema only)
- ❌ NO puppet theater MVP (deferred · cycle N+2 candidate)
- ❌ NO daemon NFT contract (puruhani materialization stays at "follows hounfour shape; ERC-6551 mint-on-demand · later cycle")
- ❌ NO multi-chain envelope abstraction (Solana stays Solana for compass · hounfour types are chain-agnostic)
- ❌ NO straylight implementation fork
- ❌ NO Solana state changes for new systems (D4 · in-memory only this cycle)
- ❌ NO active multi-world build (Pru/Sprawl/Mibera get the playbook only)
- ❌ NO LLM-bound judgment in any new system (preserves verify⊥judge fence)

## 3 · Success metrics

### 3.1 · Quantitative gates (binary pass/fail · all measurable)

| ID | Metric | Target | How measured |
|---|---|---|---|
| Q1 | Conformance LOC delta | ≤ +500 net (revised per SP-002/SP-003 · target -100 for non-hand-port substrate refactor only) | `git diff --stat f4ce25e...HEAD -- lib/ packages/peripheral-events/ ':!lib/world/' \| tail -1` AND `git diff --stat f4ce25e...HEAD -- lib/ packages/peripheral-events/ ':!lib/world/' ':!*.hounfour-port.ts' ':!*hounfour-*.schema.json' \| tail -1` |
| Q2 | World-substrate LOC budget | ≤ +600 | `git diff --stat f4ce25e...HEAD -- lib/world/ \| tail -1` |
| Q3 | Hand-ported hounfour schemas | ≥ 5 distinct (named in §5.1.1) | `grep -lE "hounfour-port" lib/domain/*.ts \| wc -l` |
| Q4 | Envelope conformance | 100% of `world-event.ts` variants tagged with `output_type` ∈ {Signal, Verdict, Artifact, Intent, Operator-Model} | `count(union variants) == grep -c 'output_type:' packages/peripheral-events/src/world-event.ts` |
| Q5 | Tests baseline | 24/24 → S4 close ≥ N (N defined at S0 from world-substrate task list) | `pnpm test` |
| Q6 | Verify⊥judge compile-time fence | `tsc --noEmit lib/test/judge-fence.spec-types.ts` emits expected type-error per `expect-type` (IMP-008) | CI step |
| Q7 | S0→S1 promotion gate | (a) ≥80% compass domain types map to a hounfour schema with ≤2-field delta · (b) zero blockers requiring hounfour breaking change · (c) straylight Phase 23a status verified | NOTES.md decision record (IMP-006) |
| Q8 | Tracking issues filed | 3/3 (one per upstream repo · each cites compass file:line + reproducible fixture · NOT just count of issues per IMP-009 quality bar) | `gh issue list --search "compass adoption tracker [substrate-agentic-2026-05-12]"` |
| Q9 | Sprint commits atomic | Each substrate adoption is one commit, independently revertable | `git log --oneline f4ce25e..HEAD` review |
| Q10 | Drift-detection CI rule | Quarterly job compares hand-ported Effect Schemas to upstream JSON Schema structurally; emits diff report | `.github/workflows/hounfour-drift.yml` exists post-S2 |

### 3.2 · Qualitative gates (operator pair-point checks)

| Gate | Test |
|---|---|
| Reframe held | No file in `lib/` defines a parallel translation primitive that hounfour or rooms-substrate already provides |
| Card game stays out | `find compass/lib -name '*card*' -o -name '*battle*' -o -name '*deck*'` returns empty |
| Adopt-don't-invent honored | Every PR title in cycle includes `[adopt:<substrate>]` tag (PRAISE-001) |
| Multi-world cross-applies | Adoption playbook (G6) reads as a checklist a contractor could execute against world-purupuru / world-sprawl / world-mibera |
| Operator iteration test | After S4 close, operator can rename/move/refactor a system in `lib/world/` in one commit without cascading test failures (IMP-007 rollback) |
| Agent navigation test | A fresh agent (no context) can answer "what does the awareness system do, and what ports does it expose?" in ≤3 grep calls (D3 north star) |

## 4 · Users / stakeholders

(Unchanged from v1 except §4.4)

### 4.1 · Operator (zksoju · primary builder)

- Wants Next.js substrate + system clarity that lets him iterate compass's world experience fast
- Wants compass to be a worked example, not a one-off
- Wants the cycle to honor "we don't want to end up creating more modules than we need to"
- Pair-points: after S0 (audit + S0→S1 gate · Q7), S2 (hounfour hand-port reviewed), S3 (force-chain doc reviewed), S4 (world substrate reviewed for navigation clarity), S6 (doctrine ratification)

### 4.2 · Eileen (`construct-rooms-substrate` + `loa-straylight` author)

- Owns the verify⊥judge framework's canonical implementation
- Will signal acceptance of compass-as-consumer via straylight issue thread (G8)
- Reference: `~/vault/wiki/entities/eileen-dnft-conversation.md`

### 4.3 · Jani (`loa-hounfour` author)

- Owns the schema substrate · 92 .schema.json files
- Will signal acceptance of compass conformance via hounfour PR comments (G8)

### 4.4 · Gumi (purupuru lore + art · `world-purupuru` + `purupuru-game` collaborator)

- Card game design happens at `purupuru-game` · NOT this cycle
- Compass world experience (observatory · ceremony) gets her review when world substrate (S4) ships polish-ready scaffolding

### 4.5 · Future world pilot (`world-sprawl` / `world-mibera` / `world-purupuru` curator)

- Will execute the adoption playbook (G6) to bring their world onto canonical substrate
- Should not need to learn loa internals to follow the checklist

## 5 · Functional requirements (sprint-mapped · revised per D1-D6)

### 5.1 · S0 — Conformance audit (no code change · operator pair-point gate)

**FR-S0-1** · Map every compass domain type in `peripheral-events/src/world-event.ts`, `lib/sim/types.ts`, `lib/weather/types.ts`, `lib/activity/types.ts` to a hounfour schema OR mark "no upstream equivalent." Output: `grimoires/loa/context/12-hounfour-conformance-map.md`.

**FR-S0-2** · Identify compass behaviors that are straylight-shaped (cross-session persistence · signed memory · governed recall). Append to map · mark each as "doc-only this cycle" or "defer to N+2."

**FR-S0-3** *(time-boxed · IMP-013)* · For every blocker, file an issue against the upstream repo. If upstream issue is open >72h without comment, operator decides defer/fork/shim unilaterally; record in NOTES.md.

**FR-S0-4** · Operator pair-point at S0 close. Decide: which schemas adopt now, which wait, which file upstream.

**FR-S0-5** *(NEW · IMP-006)* · S0→S1 promotion gate (Q7). Cycle proceeds to S1 ONLY if all 3 sub-conditions pass. Otherwise pivots to S0.5 (negotiation cycle with upstream).

#### 5.1.1 · Candidate hounfour schemas (working set · refined in S0)

These are the hand-port candidates · S0 audit confirms or contests:

| Schema | Adopt at | Rationale |
|---|---|---|
| `agent-identity` | S2 | Puruhani identity binding |
| `agent-lifecycle-state` | S2 | Dormant/stirring/breathing/soul lifecycle |
| `agent-descriptor` | S2 | Persona + voice file binding |
| `audit-trail-entry` | S2 | Cross-context event provenance |
| `capability-scoped-trust` | S3 | Verify⊥judge boundary contract |
| `bridge-invariant` | S3 | Force-chain step gating |
| `domain-event` | S1 | Envelope payload type |
| `lifecycle-transition-payload` | S2 | Stage-transition events |

S0 audit may add or remove from this set with operator pair-point. Final list locks at S0→S1 gate.

### 5.2 · S1 — Adopt rooms-substrate handoff envelope (envelope shell first per D6)

**FR-S1-1** · Vendor `construct-handoff.schema.json` + `room-activation-packet.schema.json` as JSON files in `compass/lib/domain/schemas/` (D5 · production-deployable).

**FR-S1-2** *(IMP-014 coverage gate)* · Annotate `world-event.ts` discriminated union with `output_type` ∈ {Signal, Verdict, Artifact, Intent, Operator-Model}. CI rule: count of union variants must equal count of `output_type:` annotations.

**FR-S1-3** · Migrate hand-rolled `subscribe(cb)` (`lib/activity/index.ts:42-48` · `lib/sim/population.system.ts:69`) to Effect's `PubSub` + `Stream` riding the canonical envelope.

**FR-S1-4** · Single `Effect.provide` site for the new envelope (substrate doctrine invariant). Enforced via grep rule.

**FR-S1-5** *(D6)* · Envelope `verdict` field typed as `Type.Unknown()` placeholder. S2 narrows to hand-ported hounfour union.

### 5.3 · S2 — Hand-port hounfour schemas

**FR-S2-1** *(D1)* · Hand-port the 5+ candidate schemas from §5.1.1 as Effect Schemas in `lib/domain/`. Suffix `*.hounfour-port.ts` for grep-discoverability.

**FR-S2-2** · Each hand-ported schema ships with: (a) `*.mock.ts` factory · (b) runtime AJV validator that parses the upstream JSON Schema as a structural conformance check at module load · (c) inline doc comment with `Source: hounfour@<sha>:schemas/<file>.schema.json`.

**FR-S2-3** · S1's `verdict: Type.Unknown()` placeholder narrows to a discriminated union of the hand-ported types.

**FR-S2-4** · Operator pair-point: review hand-ports for Effect-Schema idiom-fit before sealing.

### 5.4 · S3 — Doc-only force-chain mapping + compile-time fence (D2)

**FR-S3-1** · Read straylight Phase 23a `docs/specs/recall-wedge-schema-contract.md`. Document the 9-step force chain (memory → belief → instruction → plan → permission → action → commitment → permanence) as it applies to compass's puruhani lifecycle. Output: `grimoires/loa/context/13-force-chain-mapping.md`.

**FR-S3-2** · Each force-chain step gets a one-line answer: "Where does this gate live in compass?" Some answers may be "no compass surface yet · placeholder."

**FR-S3-3** *(D2 · IMP-008)* · Implement compile-time verify⊥judge fence as a TypeScript brand-type:
```typescript
// lib/domain/verify-fence.ts (no straylight import)
declare const VerifiedBrand: unique symbol
export type VerifiedEvent<T> = T & { readonly [VerifiedBrand]: true }

export const verify = <T>(e: T): Effect.Effect<VerifiedEvent<T>, ...> => ...
export const judge = <T>(e: VerifiedEvent<T>) => ... // refuses unbranded T
```
Ship `lib/test/judge-fence.spec-types.ts` containing both passing AND failing type assertions verified by `expect-type` or `tstyche` (Q6 / NFR-SEC-1).

**FR-S3-4** · Open issue on `loa-straylight` · subject "compass adoption tracker [substrate-agentic-2026-05-12]" · cite `lib/domain/verify-fence.ts:1` and ask: "Is this brand pattern compatible with Phase 23b signed-assertion API as currently drafted?"

### 5.5 · S4 — Next.js substrate + agent-navigable system layers for the WORLD experience (D3 · MAJOR REFRAME)

**Customer**: operator's iteration speed + agent's navigation clarity. NOT a card game.

**FR-S4-1** · Audit existing `lib/{sim,weather,activity}/` for: (a) which systems have ports, which are direct imports · (b) which systems mix concerns (UI + state + IO) · (c) which need test substrate (`*.mock.ts`).

**FR-S4-2** · Define `lib/world/` as the umbrella for system layers that compose the world experience:
- `lib/world/world.system.ts` — composes weather + activity + sim into one observable world state Effect Layer
- `lib/world/awareness.port.ts` + `lib/world/awareness.live.ts` + `lib/world/awareness.mock.ts` — the awareness layer as a typed surface
- `lib/world/observatory.port.ts` + `*.live.ts` + `*.mock.ts` — observatory as a typed surface (read of world state)
- `lib/world/ceremony.port.ts` + `*.live.ts` + `*.mock.ts` — ceremony as a typed surface (write into world state)

**FR-S4-3** · Each system port ships with one Next.js component example showing how the operator wires it (`app/_components/<system>-example.tsx`) — so the operator can copy-paste the pattern into actual app routes.

**FR-S4-4** · `lib/world/SKILL.md` describes the world substrate for an agent: (a) what each system exposes · (b) which port to import for which use case · (c) which systems depend on which others. Agent navigation test (Q operator-vibe-check): a fresh agent can answer "what does awareness do?" via 3 grep calls.

**FR-S4-5** *(D4)* · No persistence beyond what compass already has. New systems are pure Effect Layers; no Solana writes; no new KV keys.

**FR-S4-6** · Operator pair-point at S4 close: "Can I move/rename a system in 1 commit without cascading test failures?" YES = ship; NO = re-think.

### 5.6 · S5 — Multi-world readiness (light touch · evidence-grounded per IMP-S5)

**FR-S5-1** · `grimoires/loa/specs/per-world-adoption-playbook.md` · 1-page checklist.

**FR-S5-2** · Stub `world-purupuru` / `world-sprawl` / `world-mibera` (1 paragraph each) under the playbook. Each paragraph MUST cite ONE actual file:line in the target world that demonstrates the shape compass adopted (or the absence). Otherwise it's documentation theater.

### 5.7 · S6 — Distill upstream

**FR-S6-1** · Update `construct-effect-substrate` (existing pack) with the integration story.

**FR-S6-2** · Pack status: `candidate` → `validated · 1-project · adopting hounfour as canonical schema source · hand-port pattern documented`.

**FR-S6-3** · Operator pair-point ratifies before publishing.

## 6 · Non-functional requirements

### 6.1 · Security

- **NFR-SEC-1** · Verify⊥judge compile-time fence is mandatory (Q6 · IMP-008). `judge` cannot consume unbranded events.
- **NFR-SEC-2** · No private keys committed.
- **NFR-SEC-3** *(updated · IMP-019)* · Schema-bound validation at parse boundaries via `Schema.decodeUnknown` (Effect Schema). NOT TypeBox `Type.Check` (compass does not depend on TypeBox per D1).
- **NFR-SEC-4** · OWASP Top 10 review at each PR.
- **NFR-SEC-5** · Force-chain mapping (FR-S3-1) MUST hold for any future puruhani state transition. Skipping a step = security defect.

### 6.2 · Performance

- **NFR-PERF-1** *(deferred per IMP-013)* · World system layer composition does not regress current weather/sonifier pipeline latency. Vibe-check operator gate. Numerical p95 deferred until benchmark harness exists (not in this cycle).
- **NFR-PERF-2** · Envelope validation overhead is bounded · measured at S1 close via spot-check (not p95 with no infra).

### 6.3 · Compatibility

- **NFR-COMPAT-1** · MIN_SUPPORTED hounfour: v6.0.0 (per SCHEMA-CHANGELOG). Compass pins to SHA at S0 close (§10.5).
- **NFR-COMPAT-2** · Compass owns hand-ported types after S2 (D1). Upstream version bumps trigger drift-detection report (Q10), not auto-merge.
- **NFR-COMPAT-3** · Solana adapter layer remains in `lib/live/solana.live.ts` (D5). Hounfour-typed envelopes are chain-agnostic.

### 6.4 · Maintainability

- **NFR-MAINT-1** · Suffix discipline: `*.port.ts` · `*.live.ts` · `*.mock.ts` · `*.system.ts` · `*.schema.ts` · `*.hounfour-port.ts` · `*.spec-types.ts`.
- **NFR-MAINT-2** · Every package (`lib/world/` for S4) keeps a SKILL.md current.
- **NFR-MAINT-3** · NOTES.md decision log captures every substrate-adoption choice.

### 6.5 · Rollback (NEW · IMP-007)

- **NFR-ROLLBACK-1** · Each sprint ships behind a feature branch off `feat/substrate-agentic-adoption`.
- **NFR-ROLLBACK-2** · Test failures > 5 simultaneous trigger automatic pause + operator pair-point.
- **NFR-ROLLBACK-3** · Each sprint commit is atomic and independently revertable. No entangled cross-sprint commits.
- **NFR-ROLLBACK-4** · S2 hand-port commits are reversible by `git revert` of one `adopt-hounfour-<schema>` commit per schema · until S3 lands.

## 7 · Risks

| ID | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R-1 | Hounfour candidate schemas don't fit compass needs · adoption stalls | M | H | S0 audit surfaces BEFORE code · time-boxed upstream issue (FR-S0-3) |
| R-2 | Straylight Phase 23a contract changes mid-cycle | M | M | S3 is doc-only (D2); no runtime coupling to invalidate |
| R-3 | Eileen/Jani pair-point delayed | H | L | G8 ships independently · 7-day silent-no protocol |
| R-4 | World substrate (S4) bloats · LOC budget G5b exceeded | M | M | Operator pair-point if >+600; cut scope to top-3 systems |
| R-5 | LOC delta goes positive on conformance side | M | M | G5a is split from G5b; conformance side measured separately · should not have card-game contamination |
| R-6 | Vendoring vs hard-importing hounfour: drift detection fails | M | M | Drift-detection CI rule (Q10) · quarterly comparison · NOT auto-merge |
| R-7 | Card game accidentally gets implemented in compass | L | H | CI lint blocks `find compass/lib -name '*card*' -o -name '*battle*'` non-empty |
| R-8 | Cycle scope creeps to puppet theater | L | H | CI lint blocks `puppet-*.ts` files · §2.3 explicit cut |
| R-9 | Straylight Phase 23b lands mid-cycle and supersedes the brand-type fence | L | M | D2 brand-type is forward-compatible · swap implementation when 23b stabilizes |
| R-10 | Multi-world playbook (S5) becomes premature standardization | L | M | S5 evidence requirement (FR-S5-2 · file:line per world) · or playbook stays as draft |
| R-11 *(NEW)* | Effect-Schema idiom drift (S2 hand-ports diverge from canonical Effect-Schema patterns) | M | L | Operator pair-point S2 close · review for idiom-fit |
| R-12 *(NEW)* | Hounfour ships v8.0.0 mid-cycle · breaking change | L | H | NFR-COMPAT-1 pins SHA at S0 · NFR-COMPAT-2 prohibits auto-merge · drift report at S6 distill |

## 8 · Dependencies

### 8.1 · Upstream

- **`loa-hounfour@7.0.0`** · 92 schemas · 14 dist exports · MIN_SUPPORTED 6.0.0 · TypeBox · authoritative source of agent/capability types · SHA pinned at S0 (§10.5)
- **`construct-rooms-substrate`** · canonical envelope schemas · vendored as JSON in compass for production
- **`loa-straylight`** Phase 23a · doc-only reference · no runtime dependency

### 8.2 · Internal compass state

- Current `compass/lib/` four-folder discipline (commit `f4ce25e`)
- 24 passing tests baseline (Q5)
- Solana Anchor + Metaplex Token Metadata stack (untouched this cycle)

### 8.3 · Tools

- Loa framework v1.39+
- 3 model providers READY (opus + gpt-5.3-codex + gemini-2.5-pro) · flatline currently degraded (#759) · 2-agent fallback in use

## 9 · Out-of-scope (explicit · canonical)

Per IMP-015: this list is derived from §2.3. If conflict, §2.3 wins.

- Puppet theater MVP
- Three.js renderer for daemon visualization
- Multi-chain envelope abstraction
- ERC-6551 TBA materialization
- Straylight implementation fork
- Card game UI · animations · art · sound (handled in `purupuru-game`)
- Card game design (handled in `purupuru-game`)
- Multi-world active pilots
- LLM-in-system-layers
- Cross-construct messaging beyond rooms-substrate
- Anchor program changes
- Onboarding flow changes
- Gamified UI flourishes for existing observatory/ceremony pages

## 10 · References

- **Input brief**: `grimoires/loa/specs/simstim-brief-substrate-agentic-2026-05-12.md`
- **Patched aspiration docs**: `grimoires/loa/context/07..11-*.md` (reference only · superseded)
- **PRD review** (this revision driver): `grimoires/loa/a2a/flatline/prd-review-2026-05-12.md`
- **Substrate cycle predecessor**: `grimoires/loa/specs/enhance-substrate-ecs-2026-05-11.md` + commit `f4ce25e`
- **PRD v1 backup**: `grimoires/loa/prd.v1.pre-flatline-patches.md`
- **Canonical envelope**: `~/Documents/GitHub/construct-rooms-substrate/data/trajectory-schemas/`
- **Schema substrate**: `~/Documents/GitHub/loa-hounfour/` (`@0xhoneyjar/loa-hounfour@7.0.0` · npm publish status verified at S0)
- **Governance substrate**: `https://github.com/0xHoneyJar/loa-straylight` Phase 23a
- **Card game canonical home**: `~/Documents/GitHub/purupuru-game/` (SvelteKit · 18 cards · WORKING prototype)
- **World canonical home**: `~/Documents/GitHub/world-purupuru/` (Spiral engine)
- **Vault doctrine**: `~/vault/wiki/concepts/multi-axis-daemon-architecture.md` · `continuous-metadata-as-daemon-substrate.md` · `mibera-as-npc.md` · `puruhani-as-spine.md` · `eileen-dnft-conversation.md` · `freeside-as-layered-station.md`
- **Operator decree** (KEEPER pre-flight 2026-05-12): "we don't want to end up creating more modules than we need to" · "lay the foundations to focus on building the purupuru card game NOT some random observational agent surface"
- **Operator decree** (post-flatline 2026-05-12): "the game is technically already done, and it just needs to be refined, polished" · "I just want to create the underlying layer so I can start to actually dig in and work with NextJs and the different components"

## 10.5 · Upstream provenance pin manifest (NEW · IMP-012 · resolved at S0 close)

| Substrate | Pin | Resolved at |
|---|---|---|
| `loa-hounfour` | git SHA: `<TBD-S0>` (tag v7.0.0 OR HEAD-of-main with operator confirmation) | S0 close |
| `construct-rooms-substrate` | git SHA: `<TBD-S0>` (operator-machine clone HEAD) | S0 close |
| `loa-straylight` | git SHA: `<TBD-S0>` (Phase 23a draft commit) | S0 close |

All conformance work resolves against these SHAs. Mid-cycle upstream changes do NOT auto-rebase. Pin moves only at S6 distill or operator decree.

## 11 · Open questions for SDD phase (reduced)

Most v1 questions resolved by D1-D6 in §0.5. Remaining:

1. **Single Effect.provide site location** · `app/layout.tsx` (current host) OR new `lib/runtime/world.runtime.ts`? SDD §5 decision.
2. **Drift-detection CI rule shape** (Q10) · structural diff via JSON Schema parse? SHA-based? SDD names tooling.
3. **Sprint-2 hand-port idiom guide** · do we follow effect-school's "Schema.Class" pattern, or simpler `Schema.Struct({...})`? SDD recommends · operator ratifies.
4. **Compass-as-fixture-vs-tutorial** *(IMP-016)* · does compass become a downstream CI gate for hounfour (so hounfour breaking changes show as compass test failures BEFORE hounfour merges)? Operator decision at S6.

## 12 · Acceptance summary (aligned to §2 goals · IMP-022)

This PRD is accepted when:

- All 6 sprint scopes are grounded in concrete file lists (handled in Sprint Plan)
- D1-D6 are preserved load-bearing through SDD
- Eileen + Jani receive tracking issues (G8 · 7-day passive-accept protocol)
- The reframe ("adopt, don't invent") is captured in NOTES.md
- Gumi is informed compass world substrate ships polish-ready scaffolding by S4 close (her domain is `purupuru-game` · NOT compass)
- G1 · G2 · G3 (reframed) · G4 (reframed) · G5a · G5b · G5c are each independently verifiable per §3.1 metrics

## 13 · Sprint dependency graph (NEW · IMP missing-section)

```
S0 (audit · no code)
  │ S0→S1 promotion gate (Q7)
  ▼
S1 (envelope shell · verdict: unknown)
  │ envelope shape locked
  ▼
S2 (hand-port hounfour · narrow verdict union)
  │ types stable
  ├──────────────┐
  ▼              ▼
S3 (doc-only)  S4 (world substrate · uses S1 envelope · uses S2 types)
  │              │
  └──────┬───────┘
         ▼
       S5 (multi-world playbook · light touch)
         │
         ▼
       S6 (distill upstream · doctrine update)
```

S3 and S4 are independent after S2. S5 + S6 are sequential.

## 14 · Fallback / scope-degradation tree (NEW · IMP missing-section)

If at S0:
- **Hounfour blocking issue** → S0.5 negotiation cycle · cycle pauses
- **Straylight Phase 23a unstable** → S3 downgrades to "1-paragraph mention in NOTES.md · zero deliverables"
- **Rooms substrate unavailable for vendoring** → S1 vendors operator's hand-typed envelope schema · file upstream issue

If at S2:
- **Hand-port count <5 viable** → cut to N viable (operator confirms) · adjust Q3
- **Hand-port idiom drift** → S2 close pair-point reworks before S3 starts

If at S4:
- **G5b LOC budget +600 exceeded by 50%** → cut to top-3 systems (world.system, awareness, observatory · drop ceremony to N+1)
- **Operator iteration test fails** → re-design system layout · do NOT ship S4 until test passes

If at S6:
- **construct-effect-substrate doctrine ratification stalls** → ship cycle as `candidate · 1-project-validated` · operator promotes later
