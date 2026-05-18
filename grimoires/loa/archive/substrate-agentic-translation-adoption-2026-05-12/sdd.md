---
status: post-bridgebuilder-r1-patched
type: sdd
cycle: substrate-agentic-translation-adoption-2026-05-12
mode: arch + adopt
prd: grimoires/loa/prd.md
review: .run/bridge-reviews/design-review-substrate-agentic-2026-05-12.md
created: 2026-05-12
revision: post-bridgebuilder-r1 · 3 HIGH (BB-001 BB-002 BB-003) + 6 MEDIUM patched · BB-012 REFRAME resolved (keep split + pattern-lock at S1 close)
operator: zksoju
---

# SDD · Substrate-Agentic Translation Layer · Compass Adoption Cycle

## 1 · Abstract (PRAISE-001 verbatim · load-bearing)

> **The original 5-doc Gemini synthesis (`grimoires/loa/context/07..11-*.md`) proposed inventing a translation layer. KEEPER pre-flight + grounding in upstream repos established that the translation layer already exists. This cycle is INTEGRATION, not invention.**

This SDD describes HOW compass conforms to three already-shipping upstream substrates per PRD D1-D6:
- **Hand-port** ~5 hounfour schemas as Effect Schemas owned in `compass/lib/domain/` (D1)
- **Vendor** rooms-substrate handoff envelope JSON files into `compass/lib/domain/schemas/` (D5)
- **Doc-only** force-chain mapping + compile-time TypeScript brand-type fence for verify⊥judge (D2)
- **In-memory only** persistence for new system layers (D4)
- **No new top-level folders** — chain-bindings stay in `lib/live/` (D5)
- **Envelope-shell first** then narrow `verdict` typing in S2 (D6)

The SDD's customer is the implementer agent in S1-S6 sprints and the operator pair-points at gates. Every section names file paths · code shapes · acceptance criteria · NOT design rationale (PRD owns rationale).

## 2 · Stack & decisions

### 2.1 · Confirmed stack (from compass repo state · NOT changed by cycle)

| Layer | Tech | Compass version |
|---|---|---|
| Runtime | Next.js | 16.2.6 (Turbopack default) |
| UI | React | 19.2.4 |
| Styles | Tailwind | 4.x (`@tailwindcss/postcss` · `@theme` in CSS, no JS config) |
| Schema/Effects | `effect` | from package.json (verify pin at S0) |
| Chain | Solana / Anchor / Metaplex | unchanged |
| Pkg manager | pnpm | 10.x |

### 2.2 · New dependencies introduced this cycle

| Package | Sprint | Purpose | Justification |
|---|---|---|---|
| `ajv` + `ajv-formats` | S1 | Validate vendored handoff envelope JSON Schemas at parse boundaries | NFR-SEC-3 · structural conformance · already-canonical JSON Schema validator |
| `expect-type` | S3 | Verify⊥judge compile-time fence assertion | Q6 / NFR-SEC-1 · pinned per BB-005 (composes with vitest · zero new infra · drop tstyche alternation) |
| `@octokit/rest` | S2 | Drift detection script GitHub API client (per BB-004 hardening) | SDD §9.1 |
| `json-schema-diff` | S2 | Structural diff between vendored + upstream schemas | SDD §9.1 |
| **NOT** `@sinclair/typebox` | — | — | PRD D1 explicitly forbids · compass does not host TypeBox |
| **NOT** `loa-hounfour` (npm) | — | — | PRD D1 hand-port pattern · upstream is reference, not import |
| **NOT** `loa-straylight` (npm) | — | — | PRD D2 doc-only · zero runtime imports |

### 2.3 · Resolved SDD-level decisions (PRD §11 closures)

**SDD-D1 · Single `Effect.provide` site** (PRD §11 Q1 · revised per BB-001 · LOAD-BEARING). Compass ALREADY has the canonical pattern at `lib/runtime/runtime.ts:10`: `export const runtime = ManagedRuntime.make(AppLayer)`. The existing file's own comment forbids parallel sites: *"THE single Effect.provide site for the app. Lint check: a grep for `ManagedRuntime.make` in lib/ or app/ should return exactly one match."* This cycle COMPOSES INTO that file, NOT parallel to it. S1 modifies `lib/runtime/runtime.ts` to add lifted `ActivityLive` + `PopulationLive` to the existing `AppLayer = Layer.mergeAll(WeatherLive, SonifierLive, ActivityLive, PopulationLive)`. S4 extends the same `AppLayer` with world-system Layers. The React-bridge already lives at `lib/runtime/react.ts` (existing) — no new hook files. **Zero new files in `lib/runtime/` this cycle.**

**SDD-D2 · Drift-detection mechanism** (PRD §11 Q2). GitHub Actions weekly cron at `.github/workflows/hounfour-drift.yml`. Runs `pnpm hounfour:drift` which: (a) reads each `lib/domain/*.hounfour-port.ts` · (b) reads its `Source: hounfour@<sha>:schemas/<file>` annotation · (c) fetches `https://raw.githubusercontent.com/0xHoneyJar/loa-hounfour/<sha>/schemas/<file>.schema.json` (or local clone if available) · (d) parses both, runs structural diff via `json-schema-diff` package · (e) writes report to `grimoires/loa/drift-reports/YYYY-MM-DD.md` · (f) opens GitHub issue if delta > 2 fields.

**SDD-D3 · Hand-port idiom: `Schema.Struct` baseline · `Schema.Class` for branded types** (PRD §11 Q3). Default to `Schema.Struct({...})` for plain records (matches existing compass pattern in `peripheral-events/src/world-event.ts`). Use `Schema.Class<T>("Name")({...})` ONLY when (a) the type needs nominal identity OR (b) the type is wrapped by a brand (e.g., `VerifiedEvent<T>`). Rationale: keeps imports light · matches compass's prevailing style · Class adds named identifier in error messages where it matters.

**Brand disambiguation** (per BB-010): use `S.brand("Name")` for value-tagging at decode-time (Solana pubkey, hex strings — see existing `packages/peripheral-events/src/world-event.ts:16`). Use `unique symbol` brand (§6.2) for security-grade brands the implementation refuses to construct except through one named function (`verify()`).

**SDD-D4 · Compass-as-fixture-vs-tutorial** (PRD §11 Q4 / IMP-016) · DEFER to S6 distill. SDD does not commit; S6 operator pair-point decides whether to PR a `compass-conformance.test.ts` upstream into hounfour CI.

## 3 · Type-system bridge implementation (D1)

### 3.1 · Hand-port file convention

For each candidate hounfour schema in PRD §5.1.1, ship one file at `lib/domain/<name>.hounfour-port.ts`:

```typescript
/**
 * Hand-port of hounfour `<name>` schema as Effect Schema.
 *
 * Source: hounfour@<resolved-S0-SHA>:schemas/<name>.schema.json
 * Drift policy: see lib/domain/__tests__/<name>.drift.test.ts
 *
 * DO NOT EDIT to match an evolving upstream — let the drift CI flag deltas.
 * Adopting an upstream change requires bumping the SHA + re-porting + operator pair-point.
 */
import { Schema as S } from "effect"
// ESM JSON import per BB-003 · NOT require()
import upstreamSchema from "./schemas/hounfour-<name>.schema.json" with { type: "json" }

export const <Name>Port = S.Struct({
  // 1:1 mapping of upstream JSON Schema fields
  // Optionality, nullability, enums match upstream semantics
})

export type <Name>Port = S.Schema.Type<typeof <Name>Port>

// Runtime conformance check at module load (NFR-SEC-3 surface)
export const <Name>UpstreamSchema = upstreamSchema
```

**Required tsconfig** (verify at S0 · likely already set): `resolveJsonModule: true` + `module: "esnext"` or higher.

### 3.2 · Per-port test substrate

Each `*.hounfour-port.ts` ships with:

| File | Role |
|---|---|
| `lib/domain/__tests__/<name>.port.test.ts` | Decode / encode round-trip · sample payload conformance |
| `lib/domain/__tests__/<name>.drift.test.ts` | Structural-diff test against vendored JSON Schema · runs on every CI |
| `lib/domain/<name>.mock.ts` | Factory function returning a valid mock instance |

### 3.3 · Vendored JSON Schema location

Vendored copies of upstream JSON Schemas live at `lib/domain/schemas/hounfour-<name>.schema.json`. These are NOT edited; they are refreshed by the operator at S6 (or when the SHA pin moves).

### 3.4 · Hand-port checklist for each schema (S2 task contract)

1. Read upstream `schemas/<name>.schema.json` at the pinned SHA.
2. Vendor as `lib/domain/schemas/hounfour-<name>.schema.json`.
3. Author `lib/domain/<name>.hounfour-port.ts` following §3.1.
4. Author `<name>.mock.ts` factory with realistic defaults.
5. Author `__tests__/<name>.port.test.ts` with decode + encode round-trip + 1 invalid-input case.
6. Author `__tests__/<name>.drift.test.ts` that asserts structural equivalence (uses `ajv.compile(upstreamSchema)` against `Schema.encode(<Name>Port)(mockInstance)`).
7. Run `pnpm test` — must stay green.
8. Operator pair-point review for Effect-Schema idiom-fit before marking sprint-task closed.

## 4 · Envelope vendoring implementation (D5)

### 4.1 · Vendoring procedure

Two JSON files copied verbatim from `~/Documents/GitHub/construct-rooms-substrate/data/trajectory-schemas/`:

| Source | Vendored at |
|---|---|
| `room-activation-packet.schema.json` | `lib/domain/schemas/room-activation-packet.schema.json` |
| `construct-handoff.schema.json` | `lib/domain/schemas/construct-handoff.schema.json` |

Both files are copy-only · no edits. Provenance comment in `lib/domain/schemas/README.md` names the source SHA (resolved at S0 per PRD §10.5).

### 4.2 · Effect Schema mirror at type level

`lib/domain/handoff.schema.ts`:

```typescript
import { Schema as S } from "effect"

const OutputType = S.Literal("Signal", "Verdict", "Artifact", "Intent", "Operator-Model")
const InvocationMode = S.Literal("room", "studio", "headless")

// Verdict starts as Unknown per PRD D6 · narrows in S2
export const ConstructHandoff = S.Struct({
  construct_slug: S.String,
  output_type: OutputType,
  verdict: S.Unknown, // S2 narrows to discriminated union of hand-ported types
  invocation_mode: InvocationMode,
  cycle_id: S.String,
  // optional fields per upstream schema
  persona: S.optional(S.String),
  output_refs: S.optional(S.Array(S.String)),
  evidence: S.optional(S.Unknown),
})
export type ConstructHandoff = S.Schema.Type<typeof ConstructHandoff>

// Vendored JSON Schema for runtime AJV validation · ESM import per BB-003
import handoffSchema from "./schemas/construct-handoff.schema.json" with { type: "json" }
export const ConstructHandoffSchema = handoffSchema
```

### 4.2.1 · Verdict narrowing migration (S1 → S2 · per BB-008)

S1 ships `verdict: S.Unknown`. S2 narrows to discriminated union of hand-ported types. To prevent breaking consumers between S1 merge and S2 merge:

1. **At S2 entry**: grep for `ConstructHandoff[\"\']*verdict` usage sites in `lib/` and `app/`. Expected count: 0 (no consumer should have read raw `verdict` yet · S1 is one sprint long).
2. **If grep returns 0**: narrow `verdict` field directly. Atomic commit.
3. **If grep returns >0**: ship narrowing as ADDITIVE field `typed_verdict: <NewUnion>` · deprecate `verdict: S.Unknown` in same commit · remove `verdict` field in next sprint.

Operator pair-point at S2 entry confirms grep result before proceeding.

### 4.3 · AJV validation utility

`lib/domain/validate-envelope.ts`:

```typescript
import Ajv from "ajv"
import addFormats from "ajv-formats"
import { ConstructHandoffSchema } from "./handoff.schema"

const ajv = new Ajv({ allErrors: true, strict: true })
addFormats(ajv)
const validate = ajv.compile(ConstructHandoffSchema)

export const validateEnvelope = (input: unknown) => {
  if (!validate(input)) throw new EnvelopeValidationError(validate.errors)
  return input as ConstructHandoff
}
```

### 4.4 · Output_type coverage rule (Q4 · per BB-007 · regex pinned · zero new deps)

S1 adds `scripts/check-envelope-coverage.sh`:

```bash
#!/usr/bin/env bash
# Counts S.Literal _tag occurrences vs output_type: occurrences in world-event.ts
# Asserts equality. Fragile by design: if the file shape changes, this breaks loudly.
set -e
FILE=packages/peripheral-events/src/world-event.ts
TAGS=$(grep -cE "_tag:\s*S\.Literal" "$FILE" || echo 0)
TYPES=$(grep -cE "output_type:\s*S\." "$FILE" || echo 0)
if [ "$TAGS" != "$TYPES" ]; then
  echo "FAIL: $TAGS _tag variants vs $TYPES output_type annotations in $FILE"
  exit 1
fi
echo "OK: $TAGS variants all tagged with output_type"
```

CI step in `.github/workflows/envelope-coverage.yml` runs this script. **NO ts-morph dependency.** Acceptable failure mode: future shape changes to world-event.ts break the regex loudly; operator decides whether to fix the script or restructure the file.

## 5 · Single Effect.provide site (SDD-D1 · COMPOSES INTO EXISTING per BB-001)

### 5.1 · Modify existing `lib/runtime/runtime.ts`

Current state (`lib/runtime/runtime.ts:1-11` · DO NOT replace):

```typescript
import { Layer, ManagedRuntime } from "effect";
import { WeatherLive } from "@/lib/live/weather.live";
import { SonifierLive } from "@/lib/live/sonifier.live";

// THE single Effect.provide site for the app. Lint check: a grep for
// `ManagedRuntime.make` in lib/ or app/ should return exactly one match
// — this file. A second site would fragment the service graph and
// fork the Layer scope.
export const AppLayer = Layer.mergeAll(WeatherLive, SonifierLive);
export const runtime = ManagedRuntime.make(AppLayer);
```

S1 modifies this file to extend `AppLayer`:

```typescript
import { Layer, ManagedRuntime } from "effect";
import { WeatherLive } from "@/lib/live/weather.live";
import { SonifierLive } from "@/lib/live/sonifier.live";
// S1 additions (after lifting per FR-S1-3.5):
import { ActivityLive } from "@/lib/activity/activity.live";
import { PopulationLive } from "@/lib/sim/population.live";

export const AppLayer = Layer.mergeAll(
  WeatherLive,
  SonifierLive,
  ActivityLive,
  PopulationLive,
);
export const runtime = ManagedRuntime.make(AppLayer);
```

S4 extends further:

```typescript
// S4 additions:
import { AwarenessLive } from "@/lib/world/awareness.live";
import { ObservatoryLive } from "@/lib/world/observatory.live";
import { InvocationLive } from "@/lib/world/invocation.live"; // renamed from "ceremony" per BB-011

export const AppLayer = Layer.mergeAll(
  WeatherLive, SonifierLive, ActivityLive, PopulationLive,
  AwarenessLive, ObservatoryLive, InvocationLive,
);
```

### 5.2 · React bridge (existing · `lib/runtime/react.ts`)

Existing pattern uses `runtime.runFork()` etc. NO new hook files this cycle. Components import from `@/lib/runtime/react` as they already do.

### 5.3 · Grep rule (FR-S1-4 enforcement · existing comment-as-spec)

The existing comment in `lib/runtime/runtime.ts:5-8` IS the spec. S1 adds CI step:

```bash
# .github/workflows/single-runtime.yml
COUNT=$(grep -rn "ManagedRuntime\.make" --include="*.ts" --include="*.tsx" lib/ app/ | wc -l)
if [ "$COUNT" != "1" ]; then echo "FAIL: $COUNT ManagedRuntime.make sites (expected 1)"; exit 1; fi
```

### 5.4 · S1 pattern-lock for S4 (per BB-012 operator decision)

S1 closes by shipping a **lift-pattern template** at `grimoires/loa/specs/lift-pattern-template.md` documenting:
- The 4-file canonical trio (`<name>.port.ts` · `<name>.live.ts` · `<name>.mock.ts` · `<name>.test.ts`)
- The Layer integration step (one line added to `runtime.ts` AppLayer)
- The example component pattern (`app/_components/<name>-example.tsx`)
- Naming conventions

S4 applies this template mechanically per system. Goal: a new system in `lib/world/` is droppable in 5 commands (see FR-S4-2 numbered procedure).

## 6 · Force-chain mapping + compile-time fence (D2 / FR-S3-1..3)

### 6.1 · Force chain doc shape

`grimoires/loa/context/13-force-chain-mapping.md` ships with this skeleton:

```markdown
| Step | Compass surface | Gate location | Status |
|---|---|---|---|
| observation | weather + activity events flow | lib/activity/index.ts | ✅ exists |
| memory | activity stream history | lib/activity/index.ts (Stream subscription) | ✅ exists |
| belief | KEEPER-style aggregation | NOT YET — placeholder for puruhani-aware | 🟡 doc-only |
| instruction | ceremony invocation | lib/ceremony/* | ✅ exists |
| plan | (no compass surface yet · post-cycle) | — | ⏳ deferred |
| permission | wallet signature gate | lib/blink/sponsored-payer.ts | ✅ exists (Solana scope) |
| action | claim message exec | lib/blink/claim-message.ts | ✅ exists |
| commitment | Solana tx confirmation | claim handler | ✅ exists (Solana scope) |
| permanence | on-chain state | Solana program | ✅ exists |
```

### 6.2 · Compile-time brand-type fence

`lib/domain/verify-fence.ts` (no straylight import per D2):

```typescript
import { Effect } from "effect"
import { Schema as S } from "effect"

// Branded marker — only constructable via verify()
declare const VerifiedBrand: unique symbol
export type Verified<T> = T & { readonly [VerifiedBrand]: true }

export class VerifyError extends S.TaggedError<VerifyError>()(
  "VerifyError",
  { reason: S.String },
) {}

export class JudgeError extends S.TaggedError<JudgeError>()(
  "JudgeError",
  { reason: S.String },
) {}

/**
 * Verify is pure · substrate-anchored. Accepts raw T, returns Verified<T>.
 * Implementation = AJV validation against the vendored JSON Schema.
 */
export const verify = <T>(
  schema: S.Schema<T>,
  input: unknown,
): Effect.Effect<Verified<T>, VerifyError, never> =>
  S.decodeUnknown(schema)(input).pipe(
    Effect.map((decoded) => decoded as Verified<T>),
    Effect.mapError((cause) => new VerifyError({ reason: String(cause) })),
  )

/**
 * Judge is LLM-bound (in future cycles) · revocable.
 * INVARIANT: signature requires Verified<T> · raw T won't typecheck.
 */
export const judge = <T, R>(
  e: Verified<T>,
  judgmentFn: (e: T) => Effect.Effect<R, JudgeError, never>,
): Effect.Effect<R, JudgeError, never> => judgmentFn(e)
```

### 6.3 · Compile-time fence assertion (Q6 surface · expect-type API per BB-005 / SP-001)

`lib/test/judge-fence.spec-types.ts`:

```typescript
import { expectTypeOf } from "expect-type"
import { describe, it } from "vitest"
import { verify, judge, type Verified } from "@/lib/domain/verify-fence"
import { Schema as S } from "effect"
import { Effect } from "effect"

const TestSchema = S.Struct({ id: S.String })
type Test = S.Schema.Type<typeof TestSchema>

describe("verify⊥judge fence", () => {
  it("judge accepts Verified<Test> at the type level", () => {
    const verified = {} as Verified<Test>
    expectTypeOf(judge(verified, (e) => Effect.succeed(e.id)))
      .toMatchTypeOf<Effect.Effect<string, never, never>>()
  })

  it("judge MUST reject raw Test at the type level", () => {
    const raw: Test = { id: "x" }
    // @ts-expect-error -- raw T is not assignable to Verified<T>
    expectTypeOf(judge(raw, (e) => Effect.succeed(e.id))).not.toBeAny()
  })
})
```

The `@ts-expect-error` directive IS the fence assertion — if the type-mismatch ever stops being an error, `tsc --noEmit` fails. expect-type composes inside vitest (no separate runner).

CI step in S3:

```bash
# package.json scripts
"test:types": "tstyche lib/test/judge-fence.spec-types.ts"
```

Failure of either expectation = CI red.

### 6.4 · Issue-on-straylight contract (FR-S3-4)

After landing the brand-type fence, sprint S3 closes by opening one issue on `0xHoneyJar/loa-straylight`:

> **Title**: compass adoption tracker [substrate-agentic-2026-05-12]
>
> **Body**: Compass implements a compile-time verify⊥judge fence at `lib/domain/verify-fence.ts:1` using a `Verified<T>` brand. When Phase 23b ships the signed-assertion API, is this brand-shape compatible with that contract — i.e., would `Verified<T>` correspond to a `RecallReceipt<T>` or do we need to refactor to a different shape?

## 7 · World substrate (S4 · D3)

### 7.1 · `lib/world/` umbrella (ceremony→invocation rename per BB-011)

NEW directory · 14 files maximum (G5b budget):

```
lib/world/
├── SKILL.md                       # FR-S4-4 · agent navigation surface
├── world.system.ts                # composes all systems · orchestrator
├── awareness.port.ts              # what does awareness expose
├── awareness.live.ts              # impl
├── awareness.mock.ts              # test substrate
├── awareness.test.ts
├── observatory.port.ts            # read-only projection of world state
├── observatory.live.ts
├── observatory.mock.ts
├── observatory.test.ts
├── invocation.port.ts             # write-only command surface (renamed from ceremony)
├── invocation.live.ts             # NOTE: lib/ceremony/ is reserved for UI animation utilities
├── invocation.mock.ts
└── invocation.test.ts
```

**Name collision avoided** (BB-011): existing `lib/ceremony/` contains `stone-copy.ts` (string utility) + `wedge-target.ts` (DOM geometry helper). These are pure functions for UI animation; not Services. The new write-only surface is named `invocation` to prevent name overload.

If S4 task analysis at S0 reveals more systems are needed, operator pair-point per FR-S4-6.

### 7.2 · Port shape contract

Every `*.port.ts` follows this Effect Service pattern:

```typescript
import { Context, Effect, Stream } from "effect"

export interface AwarenessShape {
  readonly currentState: Effect.Effect<AwarenessState, never, never>
  readonly stateChanges: Stream.Stream<AwarenessChange, never, never>
  readonly invoke: (cmd: AwarenessCommand) => Effect.Effect<AwarenessAck, AwarenessError, never>
}

export class Awareness extends Context.Tag("compass/Awareness")<
  Awareness,
  AwarenessShape
>() {}
```

Three primitives per port: read · subscribe · write. This is the contract every system honors so the agent grep test works (Q operator-vibe-check).

### 7.3 · Wiring example component (FR-S4-3)

For each new port, ship one Next.js component example at `app/_components/<system>-example.tsx`:

```typescript
"use client"
import { useEffect, useState } from "react"
import { runtime } from "@/lib/runtime/use-runtime"
import { Awareness } from "@/lib/world/awareness.port"
import { Effect, Stream } from "effect"

export function AwarenessExample() {
  const [state, setState] = useState<AwarenessState | null>(null)
  useEffect(() => {
    const fiber = runtime.runFork(
      Effect.gen(function* () {
        const awareness = yield* Awareness
        const initial = yield* awareness.currentState
        setState(initial)
        yield* Stream.runForEach(awareness.stateChanges, (change) =>
          Effect.sync(() => setState((s) => applyChange(s, change))),
        )
      }),
    )
    return () => runtime.runSync(fiber.interruptAsFork(fiber.id()))
  }, [])
  return <pre>{JSON.stringify(state, null, 2)}</pre>
}
```

Operator copy-pastes pattern into actual app routes when integrating.

### 7.4 · `lib/world/SKILL.md` template (FR-S4-4)

```markdown
# Compass · world substrate

Agent: this directory is the umbrella for compass's world experience.
Each system is one port + one live + one mock + one test.

## Systems

- `awareness` — what the world believes is happening (read+subscribe+write)
- `observatory` — read-only projection of awareness for display
- `invocation` — write-only command surface (NOT lib/ceremony/ which holds UI utilities)

## How to add one (S1 pattern-lock template)

1. Copy the awareness.* trio (port + live + mock + test).
2. Update `lib/runtime/runtime.ts` AppLayer to merge the new Live Layer.
3. Add a `<system>-example.tsx` showing how to wire it.
4. Update this SKILL.md (Systems list + ownership matrix).
5. Add the system to §7.7 state ownership matrix.

## State ownership matrix (per BB-006 · enforced by grep)

| System | Owns (writes) | Reads |
|---|---|---|
| awareness | awarenessRef · awarenessChanges PubSub | weather (read), activity (read) |
| observatory | (read-only · NO writes to any Ref/PubSub) | awareness (read), weather (read) |
| invocation | (publishes commandsPubSub) | (commands consumed by awareness) |

## Guarantees

- All cross-system events flow through `lib/runtime/runtime.ts` (single Effect.provide site).
- All envelopes carry `output_type` ∈ Signal/Verdict/Artifact/Intent/Operator-Model.
- No system reads or writes Solana directly; that's `lib/live/solana.live.ts`'s job.
- A system MAY NOT write to a Ref it doesn't declare ownership of in this matrix (CI lint enforced).
```

### 7.7 · State ownership matrix (NEW · BB-006)

Each system declares which Refs/PubSubs it OWNS (writes) vs READS. CI lint at S4 close:

```bash
# scripts/check-state-ownership.sh
# For each lib/world/<system>.live.ts, parse the SKILL.md ownership matrix
# Then grep for Ref.set\|PubSub.publish in <system>.live.ts
# Fail if a system writes to a Ref/PubSub it doesn't own per matrix
```

This catches the gen_server-style invariant violations Erlang solved 35 years ago. Without this, multi-system writes to the same Ref produce undefined ordering · the operator's iteration speed pays the debug-time tax.

### 7.5 · No persistence · no Solana writes (D4 enforcement)

CI grep rules:

```bash
# any new file in lib/world/ MUST NOT import @solana/web3.js OR write to KV
grep -rE "from ['\"]@solana|kvSet|kv\.put" lib/world/ # must be empty
```

### 7.6 · Operator iteration test (FR-S4-6)

After S4 ships:

```bash
# Operator runs:
git checkout -b test/rename-awareness
git mv lib/world/awareness.{port,live,mock,test}.ts lib/world/{a-rename}.{port,live,mock,test}.ts
# update lib/runtime/world.runtime.ts import path
pnpm test  # must stay green in 1 commit
```

Pass = ship S4. Fail = re-design system layout.

## 8 · Hand-port idiom guide (SDD-D3)

### 8.1 · Default: `Schema.Struct`

```typescript
export const AgentIdentityPort = S.Struct({
  agent_id: S.String,
  display_name: S.String,
  capabilities: S.Array(S.String),
})
```

### 8.2 · `Schema.Class` ONLY when nominal identity matters

```typescript
export class AuditTrailEntryPort extends S.Class<AuditTrailEntryPort>("AuditTrailEntryPort")({
  ts: S.DateFromString,
  actor: S.String,
  action: S.String,
  evidence: S.Unknown,
}) {}
```

Rationale: Class-based gives named identity in error messages, useful for audit-trail debugging. Plain Struct is enough for value types.

### 8.3 · Brand types for verify⊥judge fence

`Verified<T>` (§6.2) uses `unique symbol` brand. Operator-confirmed pattern · do NOT use `S.brand("...")` because we want the unbranding to happen ONLY through `verify()` not through arbitrary brand-stripping.

## 9 · Drift-detection mechanism (SDD-D2 / Q10 · hardened per BB-004)

### 9.1 · `pnpm hounfour:drift` script

Three hardenings vs naive draft (all per BB-004):

1. **Authenticate** with `GITHUB_TOKEN` (not raw URL) — uses GitHub API, gets authenticated rate limit
2. **404 on stale SHA = CI red** (not silent pass) — operator must know if pin moved
3. **Diff target = `vendored vs upstream-current-main`** (NOT vendored-SHA vs upstream-SHA) — what the operator actually wants to know is "has upstream evolved past my pin"

`scripts/hounfour-drift.ts`:

```typescript
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { Octokit } from "@octokit/rest"

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
const portFiles = readdirSync("lib/domain")
  .filter(f => f.endsWith(".hounfour-port.ts"))

const reports: DriftReport[] = []
const failures: Failure[] = []

for (const file of portFiles) {
  const content = readFileSync(join("lib/domain", file), "utf-8")
  const sourceMatch = content.match(/Source: hounfour@(\w+):schemas\/(\S+\.schema\.json)/)
  if (!sourceMatch) {
    failures.push({ file, reason: "no Source: header" })
    continue
  }
  const [, pinnedSha, schemaPath] = sourceMatch

  // Verify pinned SHA still resolves (BB-004 hardening 2)
  try {
    await octokit.repos.getContent({
      owner: "0xHoneyJar", repo: "loa-hounfour",
      path: schemaPath, ref: pinnedSha,
    })
  } catch (e) {
    failures.push({ file, reason: `pinned SHA ${pinnedSha} no longer resolves (404)` })
    continue
  }

  // Diff vendored vs upstream-CURRENT-MAIN (BB-004 hardening 3)
  const upstreamMain = await octokit.repos.getContent({
    owner: "0xHoneyJar", repo: "loa-hounfour",
    path: schemaPath, ref: "main",
  })
  const upstream = JSON.parse(Buffer.from((upstreamMain.data as any).content, "base64").toString())
  const vendored = JSON.parse(readFileSync(`lib/domain/schemas/hounfour-${file.replace(".hounfour-port.ts", ".schema.json")}`, "utf-8"))

  const diff = structuralDiff(upstream, vendored) // json-schema-diff package
  if (diff.changes.length > 0) reports.push({ file, pinnedSha, mainBehindBy: diff })
}

if (failures.length > 0) { console.error(failures); process.exit(1) }
// emit report · open issue if delta > threshold
```

### 9.2 · CI workflow (with auth)

`.github/workflows/hounfour-drift.yml`:

```yaml
name: hounfour drift detection
on:
  schedule:
    - cron: "0 6 * * 1"  # Mondays 6am UTC
  workflow_dispatch:

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm hounfour:drift
      - if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Hounfour drift detected ${new Date().toISOString().slice(0,10)}`,
              body: require('fs').readFileSync('grimoires/loa/drift-reports/latest.md', 'utf-8'),
              labels: ['drift']
            })
```

## 10 · Testing approach

### 10.1 · Layered tests

| Layer | Test kind | Tool |
|---|---|---|
| Schema decode | Round-trip + invalid input | vitest + Effect Schema decode |
| Schema drift | Structural diff against vendored JSON | json-schema-diff |
| Compile-time fence | Type-error assertion | expect-type (per BB-005 · pinned · drops tstyche alternation) |
| Port + Live + Mock | Effect Layer composition test | vitest + Effect Layer.provide test layer |
| World system integration | Composes all S4 systems · runs against mocks | vitest |
| Existing tests | Continue to pass | vitest (pnpm test) |

### 10.2 · No new test infrastructure

No Playwright. No Storybook. No new bench harness. Compass already has vitest; new tests slot in.

## 11 · CI / lint additions

### 11.1 · Per-sprint CI additions (per SP-005 · stale rule replaced)

| Sprint | New CI step | Purpose |
|---|---|---|
| S1 | `pnpm envelope-coverage` (regex bash script per §4.4) | FR-S1-2 100% output_type tagging |
| S1 | `grep -c "ManagedRuntime\.make"` lib/+app/ MUST equal 1 (per §5.3 · canonical primitive after BB-001) | FR-S1-4 single Effect.provide site |
| S2 | `pnpm hounfour:drift` (manual until S6 cron) | Q10 drift detection |
| S3 | `pnpm test:types` (vitest with expect-type · per BB-005) | Q6 compile-time fence |
| S4 | `find compass/lib -name '*card*' -o -name '*battle*'` empty | Q card-game-stays-out gate |
| S4 | `grep -rE "from ['\"]@solana\|kvSet" lib/world/` empty | D4 in-memory enforcement |
| S4 | `find lib -path '*adapter*'` empty | D5 no adapters folder |
| S4 | `scripts/check-state-ownership.sh` (per §7.7 · BB-006) | State ownership matrix enforcement |
| S4 | `scripts/check-system-name-uniqueness.sh` (excludes world.system.ts orchestrator · per SP-009) | System Layer naming discipline |
| S6 | `find . -path '*/construct-translation-layer*'` empty | §2.3 cuts list (CI lint forever) |

### 11.2 · Suffix discipline lint (NFR-MAINT-1)

NEW `eslint-plugin-local` rule OR simpler: `scripts/check-suffixes.sh`:

```bash
# every *.live.ts must have a sibling *.port.ts
# every *.live.ts SHOULD have a sibling *.mock.ts
# enforced as warning (not error) initially
```

## 12 · Deployment considerations

### 12.1 · Vercel-safe imports

All vendored JSON Schemas are bundled at build time (Next.js handles `require("./schemas/*.json")` natively). No operator-machine paths in compiled output.

### 12.2 · No new env vars this cycle

Hand-port pattern needs no API keys. Drift detection runs against public GitHub raw URLs (no auth).

### 12.3 · No Solana program changes

D4 in-memory enforcement preserves current Solana posture. The deployed Anchor program is untouched.

## 13 · File inventory by sprint

### 13.1 · S0 (no code · only docs)

- `grimoires/loa/context/12-hounfour-conformance-map.md` — FR-S0-1
- `grimoires/loa/specs/upstream-issue-templates.md` — FR-S0-3 templates
- `NOTES.md` decision log entry — FR-S0-4 + Q7 promotion gate result
- PRD §10.5 SHA-pin manifest filled in

### 13.2 · S1 (envelope shell + lift activity/population per FR-S1-3.5 · per BB-002)

NEW:
- `lib/domain/schemas/construct-handoff.schema.json` (vendored)
- `lib/domain/schemas/room-activation-packet.schema.json` (vendored)
- `lib/domain/schemas/README.md`
- `lib/domain/handoff.schema.ts`
- `lib/domain/validate-envelope.ts`
- `lib/activity/activity.port.ts` (NEW · BB-002 lift)
- `lib/activity/activity.live.ts` (NEW · BB-002 lift · wraps existing `activityStream` until callers migrate)
- `lib/activity/activity.mock.ts` (NEW)
- `lib/activity/__tests__/activity.test.ts` (NEW)
- `lib/sim/population.port.ts` (NEW · BB-002 lift)
- `lib/sim/population.live.ts` (NEW · BB-002 lift)
- `lib/sim/population.mock.ts` (NEW)
- `lib/sim/__tests__/population.test.ts` (NEW)
- `scripts/check-envelope-coverage.sh` (per §4.4 · regex · zero deps)
- `scripts/check-single-runtime.sh` (per §5.3)
- `.github/workflows/envelope-coverage.yml`
- `.github/workflows/single-runtime.yml`
- `grimoires/loa/specs/lift-pattern-template.md` (S1 pattern-lock per BB-012)

MODIFIED:
- `lib/runtime/runtime.ts` — extend AppLayer with `ActivityLive` + `PopulationLive` (NOT a new file per BB-001)
- `lib/activity/index.ts` — add re-exports of new Layer surface · keep legacy `subscribe(cb)` until `app/` callers migrate (deprecation comment)
- `lib/sim/population.system.ts` — add re-exports of new Layer surface · keep legacy `subscribe(cb)` until callers migrate
- `packages/peripheral-events/src/world-event.ts` — add `output_type: S.Literal(...)` annotation to every union variant
- `tsconfig.json` — verify `resolveJsonModule: true` + ESM JSON imports work

NOT added: `app/layout.tsx` does NOT need editing — runtime wiring is already in `lib/runtime/runtime.ts` and React bridge in `lib/runtime/react.ts` (per BB-001 verification).

LOC budget revision (per BB-002): S1 was undersized in v1. Realistic: +200 LOC for 8 new files (port+live+mock+test ×2) + ~30 LOC modified across runtime + activity + population + world-event. Counts toward G5a (conformance) budget · still fits ≤0 net IF the legacy `subscribe(cb)` removal happens at S2 close (-80 LOC).

### 13.3 · S2 (hand-port hounfour)

NEW (per candidate schema · §5.1.1 · ~5-8 schemas):
- `lib/domain/<name>.hounfour-port.ts`
- `lib/domain/<name>.mock.ts`
- `lib/domain/__tests__/<name>.port.test.ts`
- `lib/domain/__tests__/<name>.drift.test.ts`
- `lib/domain/schemas/hounfour-<name>.schema.json` (vendored copy)
- `scripts/hounfour-drift.ts`

MODIFIED:
- `lib/domain/handoff.schema.ts` — narrow `verdict: S.Unknown` → discriminated union of hand-ported types

### 13.4 · S3 (force-chain doc + compile-time fence)

NEW:
- `grimoires/loa/context/13-force-chain-mapping.md`
- `lib/domain/verify-fence.ts`
- `lib/test/judge-fence.spec-types.ts`
- (one issue opened on loa-straylight via FR-S3-4)

MODIFIED:
- `package.json` — `expect-type` added (per BB-005 · NOT tstyche) · `test:types` script
- `.github/workflows/test-types.yml` — CI step for compile-time fence

### 13.5 · S4 (world substrate · applies S1 pattern-lock per BB-012)

S4 = "apply S1 pattern N times." Each new system follows the lift-pattern-template (`grimoires/loa/specs/lift-pattern-template.md`).

NEW (per §7.1 · 14 files):
- `lib/world/SKILL.md` (with §7.7 state ownership matrix baked in)
- `lib/world/world.system.ts` (orchestrator)
- `lib/world/awareness.{port,live,mock,test}.ts` (4 files)
- `lib/world/observatory.{port,live,mock,test}.ts` (4 files)
- `lib/world/invocation.{port,live,mock,test}.ts` (4 files · renamed from ceremony per BB-011)
- `app/_components/awareness-example.tsx`
- `app/_components/observatory-example.tsx`
- `app/_components/invocation-example.tsx`
- `scripts/check-world-discipline.sh` (D4 enforcement grep · NO solana imports · NO KV writes)
- `scripts/check-state-ownership.sh` (per BB-006 §7.7)
- `scripts/check-system-name-uniqueness.sh` (per BB-009 · system names appear exactly once in runtime.ts AppLayer)

MODIFIED:
- `lib/runtime/runtime.ts` — extend AppLayer with `AwarenessLive` + `ObservatoryLive` + `InvocationLive` (NOT a new file)

### 13.6 · S5 (multi-world playbook)

NEW:
- `grimoires/loa/specs/per-world-adoption-playbook.md`

### 13.7 · S6 (distill upstream)

MODIFIED (in `~/Documents/GitHub/loa-constructs/packs/effect-substrate/` or wherever `construct-effect-substrate` lives):
- pack manifest: `status: candidate` → `status: validated · 1-project`
- SKILL.md: add hand-port pattern reference
- examples/: add `compass-adoption-example.md`

NEW:
- `.github/workflows/hounfour-drift.yml` (cron · per §9.2)
- Possibly: `compass-conformance.test.ts` PR'd upstream into hounfour CI (SDD-D4 · operator-decided)

## 14 · Sequencing & rollback (NFR-ROLLBACK)

### 14.1 · Per-sprint feature branches

```
main
└── feat/substrate-agentic-adoption
    ├── feat/sa-s0-conformance-audit       # PR · merge to feat/sa parent
    ├── feat/sa-s1-envelope-shell          # PR · merge to feat/sa parent
    ├── feat/sa-s2-hand-port-hounfour      # PR · merge to feat/sa parent
    ├── feat/sa-s3-force-chain-fence       # PR · merge to feat/sa parent
    ├── feat/sa-s4-world-substrate         # PR · merge to feat/sa parent
    ├── feat/sa-s5-multi-world-playbook    # PR · merge to feat/sa parent
    └── feat/sa-s6-distill-upstream        # PR · merge to feat/sa parent
# Final: PR feat/substrate-agentic-adoption → main · cycle close
```

### 14.2 · Atomic commit contract (NFR-ROLLBACK-3)

Each S2 hand-port = one commit per schema (`adopt-hounfour-<name>: hand-port + drift test + mock`). `git revert` of one commit removes one schema cleanly.

### 14.3 · Test-failure pause threshold (NFR-ROLLBACK-2)

If `pnpm test` fails > 5 simultaneously after any S1-S4 commit, sprint pauses + operator pair-point. CI auto-comments on the PR.

### 14.4 · Inter-sprint rollback

Each `feat/sa-sN-*` branch is independently revertable to `feat/substrate-agentic-adoption`. No cross-sprint commits in S0-S5.

## 15 · Bridgebuilder findings reconciliation (post-r1 patch)

| Finding | Sev | Where addressed |
|---|---|---|
| BB-001 (Runtime.fromLayer doesn't exist · use ManagedRuntime.make) | HIGH | §5 fully rewritten · §13.2 modified |
| BB-002 (5 Live Layers don't exist · S1 must lift) | HIGH | §13.2 NEW files for activity + population lift · LOC budget revision · FR-S1-3.5 (PRD update) |
| BB-003 (require() vs ESM JSON) | HIGH | §3.1 + §4.2 use `import ... with { type: "json" }` |
| BB-004 (drift detection auth/cache/error) | MED | §9 hardened · GITHUB_TOKEN auth · 404=CI red · diff vs main |
| BB-005 (drop tstyche alternation) | MED | §2.2 + §6.3 + §10.1 + §13.4 pin expect-type |
| BB-006 (state ownership matrix) | MED | NEW §7.7 + SKILL.md template + scripts/check-state-ownership.sh |
| BB-007 (envelope-coverage tooling) | MED | §4.4 pinned bash regex script · zero deps |
| BB-008 (verdict narrowing migration) | MED | NEW §4.2.1 grep-or-additive procedure |
| BB-009 (system name uniqueness CI) | LOW | §13.5 NEW scripts/check-system-name-uniqueness.sh |
| BB-010 (brand disambiguation) | LOW | SDD-D3 brand disambiguation paragraph added |
| BB-011 (ceremony name collision) | MED | §7.1 renamed to invocation throughout |
| BB-012 (S1+S4 same shape) | REFRAME | §5.4 pattern-lock template at S1 close · S4 applies mechanically |
| BB-013 (vendor + AJV pattern) | PRAISE | preserved · §4.3 unchanged |
| BB-014 (compile-time brand-type fence) | PRAISE | preserved · §6.2 unchanged |
| BB-015 (SOUL.md complement) | SPEC | captured for N+2 cycle · NOT in scope |

## 16 · Open SDD-level decisions (none currently · all PRD §11 closed via D1-D6 + SDD-D1-D4 · all bridgebuilder HIGH/MED resolved)

Anything that emerges during S0-S6 implementation surfaces via NOTES.md decision log + operator pair-point.
