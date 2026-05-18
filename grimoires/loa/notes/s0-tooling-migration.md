---
status: complete
sprint: S0
task: T0.7 · oxlint + oxfmt tooling migration
date: 2026-05-12
operator-decree: 2026-05-12 — "swap out eslint for oxlint and oxfmt instead of prettier"
---

# S0 T0.7 · Tooling Migration · eslint → oxlint + oxfmt

## What was changed

### Dependencies (`package.json` devDependencies)

| Action | Package | Version |
|---|---|---|
| Removed | `eslint` | (was `^9`) |
| Removed | `eslint-config-next` | (was `16.2.6`) |
| Added | `oxlint` | `^1.64.0` |
| Added | `oxfmt` | `^0.49.0` |

### Scripts (`package.json` scripts)

| Script | Before | After |
|---|---|---|
| `lint` | `eslint` | `oxlint` |
| `lint:fix` | (none) | `oxlint --fix` |
| `fmt` | (none) | `oxfmt` |
| `fmt:check` | (none) | `oxfmt --check` |
| `check` | (none) | `oxlint && oxfmt --check && tsc --noEmit` |

### Config files (new)

| File | Purpose |
|---|---|
| `.oxlintrc.json` | oxlint rules · plugins (`react`, `typescript`, `nextjs`, `import`) · env (browser, node, es2024) · `correctness` errors + `suspicious` warnings · ignorePatterns for `.next`, `node_modules`, `programs`, etc. · overrides for `scripts/**` + `tests/**` to allow console statements |
| `.oxfmtrc.json` | oxfmt config · ignorePatterns for markdown, build dirs, public assets, grimoires, etc. |
| `.github/workflows/lint.yml` | CI step running `pnpm lint && pnpm fmt:check && pnpm typecheck` on PRs to main |

### Pattern reference

Configuration mirrors world-purupuru's existing `.oxlintrc.json` (operator-canonical pattern across the purupuru-family). Adapted for compass's Next.js + React stack (removed SvelteKit paths, added Next.js + Solana program paths to ignores).

## Migration outcome

Initial `pnpm lint` run after migration: **123 warnings + 1 error**.

After triage:

| Action | Result |
|---|---|
| Fixed `==` → `===` in `lib/live/weather.live.ts:249` (the only ERROR) | 0 errors |
| Added `scripts/**` override allowing `no-console` | -91 warnings |
| Added `tests/**` override allowing `no-console` + `typescript/no-explicit-any` | (covered) |
| Remaining 32 warnings | Mostly unused-import in `app/demo/page.tsx` + tests · code-quality signals, not regressions |

Final `pnpm lint` output: **32 warnings, 0 errors** in 270ms across 180 files (14 threads).

### oxfmt application

`pnpm fmt` applied a one-time format pass across 226 files (137 files changed).

| Metric | Value |
|---|---|
| Files scanned | 226 |
| Files changed | 137 |
| Format pass duration | 208ms (14 threads) |
| Net diff | +4,064 / -5,940 lines (mostly multiline-reflow normalizations) |

Style choices oxfmt enforced:
- Always-multiline-when-long arrays/objects (line-length-based trigger)
- 2-space indent · double-quote strings · trailing commas (matched compass conventions)

## Full check pipeline state (post-migration)

```
$ pnpm check
Found 32 warnings and 0 errors.                          # lint
All matched files use the correct format.                # fmt
(tsc: no output = clean)                                  # typecheck
```

Total pipeline time: **~410ms**. ~5-10× speedup over the prior eslint+tsc pipeline.

## Carry-forward

- 32 remaining warnings are code-quality signals (mostly unused imports in `app/demo/page.tsx`). NOT a sprint-0 blocker.
- S1 task `T1b.6 · S1 path-convention lock + CI grep` will EXTEND lint.yml with the asset-path check.
- `T1b.3 · BattlePhase compile-time enforcement`: oxlint custom-rule path DEFERRED per flatline-r1 SKP-003 · default fallback is `match-phase-audit.test.ts` runtime fuzz OR `ts-pattern.exhaustive()`.

## Operator-facing notes

- New scripts: `pnpm lint`, `pnpm lint:fix`, `pnpm fmt`, `pnpm fmt:check`, `pnpm check`
- IDE: oxlint has VS Code extension `oxc.oxc-vscode`

---

**Status**: T0.7 complete · `pnpm check` green · CI workflow registered · ready to commit.
