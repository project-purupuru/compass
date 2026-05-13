---
sprint: sprint-1
status: COMPLETED
cycle: purupuru-cycle-1-wood-vertical-2026-05-13
date_completed: 2026-05-13
operator: zksoju
agent: claude-opus-4-7
predecessor: sprint-0-COMPLETED.md (calibration spike · Ajv2020 lesson locked)
---

# Sprint-1 COMPLETED — Schemas + Contracts + Loader + Design-Lints

## What shipped

| File | Purpose | Status |
|---|---|---|
| `lib/purupuru/schemas/*.schema.json` | 8 JSON schemas vendored from harness (per S1-T1 + AC-1) | ✅ |
| `lib/purupuru/contracts/types.ts` | 15-member SemanticEvent + 5 GameCommand + 6 ResolverStep ops + GameState + supporting types (per S1-T2 + SDD §3) | ✅ ~430 lines |
| `lib/purupuru/contracts/validation_rules.md` | Vendored verbatim (per S1-T2a + AC-2a) | ✅ |
| `lib/purupuru/content/wood/*.yaml` | 8 worked YAML examples vendored (per S1-T3 + AC-2) | ✅ |
| `lib/purupuru/content/loader.ts` | Ajv2020 + js-yaml + pack-as-provenance + camelCase normalizer (per S1-T4 + SDD §8) | ✅ ~270 lines |
| `scripts/validate-content.ts` | 5 design lints + AJV pipe (per S1-T5 + AC-3a) | ✅ ~190 lines |
| `package.json` `content:validate` script | per S1-T6 + FR-6 | ✅ |
| `lib/purupuru/__tests__/schema.validate.test.ts` | 31 tests covering AC-1/2/2a/3 (per S1-T7) | ✅ |
| `lib/purupuru/__tests__/design-lint.test.ts` | 2 tests covering AC-3a (per S1-T7) | ✅ |

## Acceptance criteria — verified

| AC | Verification | Status |
|---|---|---|
| AC-1 | `ls lib/purupuru/schemas/*.schema.json | wc -l` = 8 | ✅ verified live |
| AC-2 | 8 YAMLs in `lib/purupuru/content/wood/` | ✅ verified live |
| AC-2a | `validation_rules.md` vendored | ✅ verified live |
| AC-2b | (S0 carryover) `PROVENANCE.md` with 19 SHA-256 entries | ✅ |
| AC-3 | `pnpm content:validate` exits 0 + 31 vitest tests pass | ✅ verified live (33 tests passed in 1.39s) |
| AC-3a | 5 design lints all pass for wood pack | ✅ verified live (5 pass · 0 fail) |
| AC-4 | `pnpm typecheck` exits 0 with no purupuru-namespace errors | ✅ verified live (exit 0) |

## Sprint-0 calibration insight applied

Per `sprint-0-COMPLETED.md`: harness schemas use JSON Schema **draft-2020-12**. The default `Ajv` constructor uses draft-07 → compile fails. **`lib/purupuru/content/loader.ts` imports `Ajv2020` from `ajv/dist/2020`** as the calibration locked. No S1 rework needed — pinned ahead.

## Substrate (ACVP) properties advanced

| Component | S1 contribution |
|---|---|
| Reality | (deferred to S2 · GameState type defined but no factory yet) |
| **Contracts** | ✅ 15-member SemanticEvent · 5 GameCommand · 6 ResolverStep ops · GameState · WeatherState · CardInstanceState · ZoneRuntimeState · DaemonRuntimeState · ContentDatabase + 9 definition types |
| **Schemas** | ✅ 8 JSON Schemas vendored + AJV2020 compilation surface working |
| State machines | (deferred to S2 · types in contracts) |
| Events | (deferred to S2 · types in contracts) |
| **Hashes** 🔒 | ✅ S0's PROVENANCE.md (19 SHA-256 entries) consumed by S1 (AC-2a smoke check) |
| **Tests** | ✅ 33 vitest assertions across schema.validate + design-lint test files |

## Lints surfacing real signal

The 5 design lints are not theatre. Each ran live and passed for `pack.core_wood_demo.yaml`:

- **LINT-1**: card `wood_awakening` (elementId=wood) declares verbs `[awaken, grow]`; element `wood` allows verbs `[grow, awaken, bind, heal, branch, nurture]`; 2 matching → ✅
- **LINT-2**: sequence beat `start_local_sakura_weather` targets `anchor.wood_grove.petal_column` with scope=`target_zone_only`; zone `wood_grove` weatherBehavior=`localized_only` → ✅
- **LINT-3**: sequence `wood_activation_sequence` lockMode=`soft` and includes `unlock_input` beat → ✅
- **LINT-4**: card `wood_awakening` targeting tags `[grove, seedling_anchor]`; both defined on `zone.wood_grove` → ✅
- **LINT-5**: pack tier=`core` → locked-op restriction vacuously true → ✅

These 5 lints are now CI-enforced via `pnpm content:validate`. Cycle-2's first non-wood content pack will run through the same lints automatically.

## What's locked for S2

- ContentDatabase API surface defined (`getCardDefinition` · `getZoneDefinition` · etc.)
- ResolverStep + ResolverOpKind union spans the 6 ops S2's resolver must implement (5 active + daemon_assist no-op stub)
- SemanticEvent union spans the 15 events the resolver + state machines emit
- Loader normalizer handles `resolver.steps` → `resolverSteps` camelCase conversion
- Pack-as-provenance directory walking proven against the wood pack (8 files · 1 of each kind)

## Gate signoff

- **Implementer**: claude-opus-4-7 (cycle-1 worktree at /Users/zksoju/Documents/GitHub/compass-cycle-1)
- **Review**: self-review · all 33 tests pass · typecheck clean · content:validate green · acceptance criteria verified live
- **Audit**: operator-ratified (operator latitude grant 2026-05-13 PM)

## Next gate

**S2 · Runtime** per `sprint.md` §S2 + PRD r2 §5.3 + SDD r1 §4 + §6.5 + §7. ~3 days estimated · ~1100 LOC. Deliverables: 3 state machines · event-bus · input-lock (5-state lifecycle from SDD §6.5) · command-queue · resolver (5 ops + 5 commands · daemon_assist no-op stub) · golden replay test against `core_wood_demo_001` fixture (5-event pattern per AC-7).
