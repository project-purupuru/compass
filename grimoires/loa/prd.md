---
title: PRD · Blender Adapter · Python Addon (v0)
cycle: blender-adapter-2026-05-18
status: candidate r2 · FR-12 escape hatch dropped from v0 · sprint.md r3 authored
revision: r2
revised: 2026-05-19
revision_source: a2a/flatline/prd-review.json (r1) · a2a/flatline/sprint-review-r2.json SKP-001-cluster (r2 · FR-12 drop)
tier: bronze
operator_signed: unsigned
authored_by: opus-4-7-1m via /plan-and-analyze (minimal mode) · r1 direct-edit integration
created: 2026-05-18
prior_artifacts:
  - lib/blender/wire.ts (TS substrate · landed 2026-05-18)
  - lib/blender/data.port.ts (TS substrate · landed 2026-05-18)
  - lib/blender/data.mock.ts (TS substrate · landed 2026-05-18)
  - lib/blender/SKILL.md (TS substrate · landed 2026-05-18)
  - lib/blender/__tests__/data.test.ts (10/10 tests passing)
  - grimoires/loa/context/blender-adapter-design-brief-2026-05-18.md (canonical design doc)
  - grimoires/k-hole/research-output/dig-session-2026-05-18.md (foundational research)
related_memory:
  - design-adapter-not-integrate-broken-tool
  - length-prefixed-framing-tcp-bug-class
  - compass-learns-honeycomb-graduates
  - over-structuring-causes-design-system-collapse
  - honeycomb-substrate
---

# PRD · Blender Adapter · Python Addon (v0)

> Cycle: `blender-adapter-2026-05-18`. This PRD scopes ONLY the Python-addon side of the compass↔Blender adapter. The TypeScript substrate already landed today (`lib/blender/`); this PRD specifies the Python implementation that makes the substrate actually drive Blender.

## TL;DR

- Build `tools/blender-addon/` in compass repo · single-file Blender addon (`addon.py`)
- Mirrors `lib/blender/wire.ts` framing protocol (length-prefixed 4-byte BE uint32 + UTF-8 JSON body) ON THE PYTHON SIDE
- Mirrors `lib/blender/data.port.ts` 5 CRUD ops · 1:1 parity with the TS mock
- ~~Adds `run_python_code` escape hatch for the long tail~~ **r2: FR-12 escape hatch DEFERRED to v1** (see Revision Notes r2)
- Test-driven · pytest discipline · mock parity with `data.mock.ts` is the test contract
- Avoids the 6 anti-patterns from the design brief (length-prefix · main-thread queue · idempotent cmdId · try/except · module-private state · platform-independent asyncio)

## Revision Notes (r1 · 2026-05-18)

Integrates 8 findings from `a2a/flatline/prd-review.json` + `a2a/flatline/sdd-review.json` (12+11 blockers · 6+10 high-consensus · 2+3 disputed · 83%/76% agreement · full confidence · 3-model: codex + claude + gemini).

| Finding | Sources | r0 problem | r1 resolution |
|---|---|---|---|
| **ESCAPE-RCE** | PRD SKP-001 (950) · SKP-004 (820) · SDD SKP-001 (900) | `run_python_code` is zero-auth · "localhost-only" is NOT a security boundary (DNS rebind · local malware · compromised dependency) | **FR-12 rewritten**: DEFAULT-OFF · per-session bearer token written to `~/.blender-mcp/<session>.auth` (mode 0600) at addon-start · client supplies token in every frame · `__builtins__` restricted to a small allowlist · every invocation audit-logged with sanitized code preview. Off-switch via `BLENDER_MCP_ENABLE_ESCAPE=0` (default) |
| **TIMEOUT-MAIN-THREAD** | PRD SKP-003 (830) · SDD SKP-002 (850) · IMP-006 (835) | CPython+GIL: threading cannot preempt main-thread Python · `signal.alarm()` POSIX-only · timer callback can't hard-interrupt itself | **FR-12 honest mechanism**: timeout is enforced via (a) AST pre-scan rejecting unbounded loop constructs (`while True`, `for x in itertools.count()`, `while 1`, naked recursion without depth cap) · (b) cooperative-only runtime semantics documented · (c) new **AP-7** in the regression suite |
| **QUEUE-BACKPRESSURE** | SDD SKP-001 (870) · IMP-005 (845) · SKP-001 main-thread-freeze (850) | both queues default `maxsize=0` (unbounded) · G-5 stress + main-thread stall → OOM growth · bounded queue with blocking `put()` on main thread → UI freeze | **FR-16 (new)**: `inbox` and `outbox` constructed with `maxsize=512` (tunable via config) · BG-thread uses `inbox.put_nowait()` + on `queue.Full` emits `WireResponseError(kind="Backpressure")` · main-thread `outbox.put_nowait()` + on `queue.Full` drops response + signals BG-thread to close stalled connection |
| **SCHEMA-DRIFT** | PRD IMP-008 (777.5) · SDD IMP-001 (905) | Python snake_case ↔ TS camelCase · "3am production defect class" · no explicit cross-language field-map | **FR-14 (new)**: explicit Python ↔ TS field-mapping table is **SDD §4 normative** · round-trip parity fixture (TS encodes → Python decodes → re-encodes → byte-identical) checked in CI · top-level `protocol_version` constant in every frame · CI drift gate fails the build on mismatch |
| **LIFECYCLE-CORRELATION** | PRD IMP-005 (810) · SKP-003 (735) · SDD IMP-004 (875) · IMP-009 (800) | BG threads + `bpy.app.timers` survive `unregister()` → port 9876 stays bound across addon-reload · global outbox without per-connection correlation → client receives responses to commands it never issued | **FR-15 (new)**: `unregister()` MUST: (a) set `stop_event` · (b) join BG thread with ≤2s timeout (force-mark daemon if exceeded) · (c) `bpy.app.timers.unregister(drainer)` · (d) close listening socket · (e) per-connection response queue replaces shared outbox · (f) on new connection: stale outbox entries purged |
| **MAX-FRAME-BYTES** | PRD SKP-006 (740) · SDD SKP-003 (820) · SKP-002 (750) | 4-byte BE uint32 length → adversarial header can request 4GB allocation · OOM-DoS · slow-recv on incomplete frame hangs thread | **FR-17 (new)**: `MAX_FRAME_BYTES = 10 * 1024 * 1024` (10MB · tunable) · header exceeding → connection closed immediately (stream is untrustworthy · do NOT just drop frame) · idle/incomplete-frame deadline 30s · new error `kind="FrameError"` |
| **TIMER-LATENCY** | PRD SKP-001 (870) | `bpy.app.timers` poll at 0.1s queues commands behind ≤100ms latency floor · p50 ≤ 50ms SLA architecturally impossible | **FR-5 revised**: timer interval = **0.016s** (60-FPS-equivalent · safe for Blender main thread · brings queuing overhead < 16ms) · §5.5 SLA stands · note added: p99 degrades under main-thread CPU pressure (large mesh ops) |
| **DATA.LIVE.TS-SCOPE** | PRD IMP-001 (902.5) | G-1 + G-2 gate on TS `data.live.ts` existing · framed as Risk R-4 not dependency · acceptance unverifiable | **§6.1 + §7.2 revised**: `lib/blender/data.live.ts` scoped into **S1 deliverable** (the TS socket client + reconnect logic mirroring this PRD's Python wire) · R-4 removed from risk table · §3.2 secondary-users updated |

## Revision Notes (r2 · 2026-05-19 · FR-12 escape hatch dropped)

During `/sprint-plan` for this cycle, the sprint plan was Flatline-reviewed twice (`a2a/flatline/sprint-review.json` + `sprint-review-r2.json`). The **SKP-001 finding cluster** (3 CRITICALs · severity 970/920/850) established that the FR-12 `run_python_code` escape hatch — as specified in r1 §4.4 — **cannot be made safe within v0 scope**:

- **MRO traversal sandbox escape**: restricting `__builtins__` + AST pre-scanning does NOT prevent `().__class__.__mro__[-1].__subclasses__()` chains, a published CPython sandbox-escape class that recovers unrestricted builtins via attribute access alone. The AST scan permits exactly this syntax.
- **Cooperative-timeout cannot contain CPU-bound code**: the r1 "honest mechanism" (AST pre-scan + cooperative budget) is a speedbump, not a containment boundary.
- **The framing is the danger**: a feature documented as security-gated, but which provides arbitrary in-process code execution, is the most dangerous outcome — operators enable it believing the restricted namespace isolates, when it does not.

**Operator decision 2026-05-19**: drop FR-12 from v0 entirely. A credible escape hatch needs OS-level isolation (subprocess + seccomp/AppArmor on Linux · restricted job object on Windows) — that is a v1 design effort, not a v0 sprint task.

| r1 element | r2 disposition |
|---|---|
| **FR-12 a–g** (§4.4 Escape Hatch) | **DEFERRED to v1.** §4.4 retained below under a DEFERRED banner — the spec is preserved as v1 design input, NOT a v0 requirement. |
| **G-3** (§2.1 · escape hatch returns structured success/error · never crashes) | **DEFERRED to v1.** The underlying safety property (handler errors are structured · never crash the addon) is preserved by FR-6 try/except discipline + traceback sanitization (still in v0). |
| **AP-7** (§4.9 · unbounded-loop escape code crashes timer drain) | **REMOVED.** Scoped entirely to FR-12. v0 regression suite is 7 anti-patterns (AP-1..AP-6, AP-8). |
| **ESCAPE-RCE / TIMEOUT-MAIN-THREAD** (r1 notes rows) | Superseded — those r1 mitigations were FR-12-internal. The honest mitigation is non-existence in v0. |
| `~/.blender-mcp/` directory · bearer-token auth files · `BLENDER_MCP_ENABLE_ESCAPE` · `BLENDER_MCP_ESCAPE_IMPORTS` env vars | **REMOVED from v0.** No `~/.blender-mcp/` directory is created. |
| §6.1 In Scope "escape hatch with security gates" | Moved to §6.2 Out of Scope (v1+). |

Sprint plan r3 (`sprint.md`) is the companion artifact: S4 collapses LARGE→SMALL (safety hardening only — traceback sanitizer + FR-6 audit). SDD r2 carries the matching §-level deferrals.

### Findings NOT integrated (operator-decide / scope-deferred)

- **IMP-011** (single-file-addon vs module-tree · DISPUTED 790/0/890 · PRD): TL;DR-vs-§5.3 contradiction is real but resolution is S0 spike output — Blender's addon loader supports module-trees when the addon registers a package; S0 validates this before S1 commits to layout. PRD §5.3 unchanged; SDD r1 adds the explicit packaging-validation gate to S0. **r2 note**: sprint.md r3 resolved the related `lib/wire.py`/`lib/wire/` collision (IMP-003) — `lib/wire/` is a package.
- **IMP-012** (handshake op · DISPUTED 715/0/840 · PRD): explicit handshake op deferred to v1. v0 ships `protocol_version` in every frame (FR-14) which provides comparable protocol-mismatch coverage at lower complexity.
- **IMP-002 SDD** (cmd_id required in malformed-JSON response · HIGH 900): adopted at SDD r1 §5.2 — for un-parseable frames, response is connection-level `kind="FrameError"` with `cmd_id="<unparseable>"` sentinel. Closed without separate PRD FR.
- **IMP-007 SDD** (CRUD schemas to sprint plan · 770): kept as sprint-plan deliverable since SDD r1 §4 now pins the field-mapping table normatively · sprint-plan inherits.
- **IMP-013 SDD** (Blender integration fixture spec · DISPUTED 0/740/750): tabled to S5 sprint-task — fixture-shape decisions need real-Blender feedback that S0 surfaces.

## 1. Problem & Vision

### 1.1 The Problem

The TypeScript substrate (`lib/blender/`) defines a typed adapter surface to Blender but has nothing to talk to. Without the Python-addon side, the substrate is "great types for nothing" — the 10/10 tests pass against the mock, but agents cannot drive a real Blender from compass.

**Cited evidence**:
- `lib/blender/SKILL.md` §"What's NOT in v0" L77-86: *"data.live.ts · actual socket client (next chunk · biggest single piece of work)"* — TS-side gap that this Python addon enables
- `grimoires/loa/context/blender-adapter-design-brief-2026-05-18.md` §"Compass design" L165-180: *"compass implements runtime against these schemas"* — the runtime is what's missing

### 1.2 Vision

A minimal Python addon that bridges agent-driven typed commands (via the TypeScript adapter) to real `bpy` operations inside a running Blender 4.x. The addon ships with the same anti-bug discipline that the TypeScript substrate already enforces — length-prefixed framing on day 1, idempotent commands, schema-validated boundary.

**Source**: `feedback_design-adapter-not-integrate-broken-tool` memory + operator directive 2026-05-18: *"build out our own in house from scratch with best practices in mind as it can be an adapter for our agentic infra."*

### 1.3 Why Now

The Sora Tower asset spike (in progress) hit the ahujasid/blender-mcp "Incomplete JSON response" wall mid-session. The operator named the architectural reframe: don't integrate broken tools, design our own. The TypeScript substrate landed in ~2 hours; the Python side completes the loop in the next chunk.

**Source**: Phase 1 interview · session log 2026-05-18 · also `grimoires/k-hole/research-output/dig-session-2026-05-18.md` lines 1-24 *"3D agentic architectures only succeed through severe limitation"*

---

## 2. Goals & Success Metrics

### 2.1 Goals

| ID | Goal | Validation |
|---|---|---|
| G-1 | Length-prefixed wire protocol works end-to-end (TS → addon → bpy → addon → TS) | Integration test: TS adapter sends `listObjects` cmd · addon returns real `bpy.data.objects` payload · TS schema-decodes successfully |
| G-2 | All 5 data-seam CRUD ops have full parity with `data.mock.ts` | Test contract: every test in `lib/blender/__tests__/data.test.ts` passes against `BlenderDataLive` Layer when Blender is running (NO test changes) |
| ~~G-3~~ | ~~Escape hatch `run_python_code` returns structured success or error · NEVER crashes the session~~ **r2: DEFERRED to v1** (FR-12 dropped). Handler-level safety (structured errors · never crash) preserved by FR-6 try/except + traceback sanitizer. | — (deferred) |
| G-4 | All 6 anti-patterns from the design brief are demonstrably absent | One regression test per anti-pattern (the "negative test suite") |
| G-5 | Addon survives 1000-cmd stress test without socket drift or memory growth | Stress test: random ops with random payloads ≤ 1MB · 1000 cmds · zero "Incomplete JSON" errors · zero deadlocks |

**Source**: Phase 2 interview Q1 (operator selected "Handshake + all 5 CRUD ops + escape hatch")

### 2.2 Success Metrics

| Metric | Target |
|---|---|
| TS mock tests passing against TS live layer (with addon running) | 10/10 (parity contract) |
| Python addon test coverage | ≥ 85% (pytest --cov) |
| Wire-frame round-trip latency p50 | ≤ 50ms (LAN · same machine) |
| Wire-frame round-trip latency p99 | ≤ 200ms |
| Stress-test success rate at 1000 cmds | 100% |
| Anti-pattern regression suite | 6/6 tests passing |

---

## 3. Users & Stakeholders

### 3.1 Primary Users

**Agent · primary user of the typed surface**

The TypeScript adapter's typed surface is consumed by Claude (running in Claude Code sessions) when an agent needs to drive Blender. The agent reads `lib/blender/SKILL.md` for the surface description, calls into `BlenderData` Context.Tag operations, and receives typed responses.

**Cited evidence**: operator directive 2026-05-18: *"with agent navigation as the focus I'm sure you will have no problems building out performant tools for yourself"*

### 3.2 Secondary Users

**Operator (zksoju) · manual integration tester**

The operator drives manual end-to-end validation: open Blender, enable the addon, run the TS-side integration tests, watch behavior in the viewport. Eventually the operator drives Sora Tower refinement directly via the adapter.

**Effect runtime · mock-tier user**

Existing `lib/blender/__tests__/data.test.ts` tests treat the mock as the user. Those tests are the source-of-truth contract for what the live addon must replicate.

---

## 4. Functional Requirements

### 4.1 Wire Protocol Implementation (Python side)

**FR-1 · Length-prefixed framing**
Addon receives bytes from socket. Parses 4-byte BE uint32 header. Loops `recv()` appending chunks until full body length is read. Then `json.loads()` the body. Returns response framed the same way.

**Cited evidence**: `lib/blender/wire.ts:60-78` (encoder reference) + `memory/reference_length-prefixed-framing-tcp-bug-class` (root cause + canonical fix)

**FR-2 · Schema-conformant payloads**
Addon emits `WireResponseSuccess` or `WireResponseError` per the TS Schema. Every field is present and correctly typed. Error responses carry one of 6 enum `kind` values (`BadParams` · `PollFailed` · `BlenderError` · `Timeout` · `UnknownOp` · `EscapeHatchError`).

**Cited evidence**: `lib/blender/wire.ts:35-55` (WireResponseError schema)

**FR-3 · Idempotent cmdId dedup**
Addon maintains in-memory `dict[cmd_id → response]` with bounded size (LRU 256 entries). If a cmdId arrives twice, the cached response is returned · the op is NOT re-executed.

**Cited evidence**: design brief §Substrate principle (length-prefix subsection) + operator argument: *"idempotent cmdId dedup"*

### 4.2 Threading & Runtime

**FR-4 · Socket runs on daemon background thread**
Socket accept loop + recv loop run on a `threading.Thread(daemon=True)`. NO blocking I/O on Blender's main thread.

**Cited evidence**: design brief §Substrate principle 2 · operator argument: *"main-thread queue via bpy.app.timers"*

**FR-5 · Main-thread queue via bpy.app.timers**
Incoming commands are pushed to a `queue.Queue` (capacity bounded · see FR-16). A `bpy.app.timers.register(drain, persistent=True)` callback polls the queue every **0.016s (60-FPS-equivalent)** on Blender's main thread and executes commands. The drain function returns within `MAX_DRAIN_PER_TICK` items (default 20) to avoid timer-callback overrun.

**Cited evidence**: design brief §Substrate principle 2 + `dig-session-2026-05-18.md` L9: *"the addon uses `bpy.app.timers.register` to run a polling function … executing the commands safely"*. r1 revision: dig's 0.1s reference is a starting point not a floor · 0.016s brings queuing overhead under the §5.5 p50 ≤ 50ms SLA (per PRD-flatline finding SKP-001 severity 870).

**FR-6 · try/except around every bpy invocation**
Every `bpy.ops.*` call and every `bpy.data.*` mutation is wrapped in `try/except Exception`. Exceptions are captured, traceback is sanitized (strip `os.getcwd()`, `os.environ['HOME']`, user identifiers), and returned as `WireResponseError` with `kind="BlenderError"`. Addon NEVER crashes the addon process.

**Cited evidence**: design brief §Substrate principle 2 · operator argument: *"try/except wrapping all bpy.ops"*

### 4.3 Data-Seam Op Handlers (5 ops · full parity with mock)

**FR-7 · `blender.data.listObjects`**
Returns `BlenderObject[]` projection of `bpy.data.objects`. Projection follows `lib/blender/data.port.ts:53-67` `BlenderObject` interface — name · type · location · rotation · scale · meshName · materialNames · visible · parentName. Lossy by design (no full bpy props).

**Cited evidence**: `lib/blender/data.port.ts:120-122` `listObjects` signature

**FR-8 · `blender.data.getObject`**
Params: `{ name: string }`. Returns `BlenderObject` or `WireResponseError(kind="BlenderError")` with `BlenderDataError._tag="ObjectNotFound"` payload.

**Cited evidence**: `lib/blender/data.port.ts:124` `getObject` signature

**FR-9 · `blender.data.createObject`**
Params: `BlenderObjectSpec`. Creates the object via `bpy.data.objects.new(name, mesh)` + appropriate type-specific creation. Applies location/rotation/scale defaults. Returns the created `BlenderObject`. Failures: `ObjectAlreadyExists` if name taken.

**Cited evidence**: `lib/blender/data.port.ts:126-128` `createObject` signature

**FR-10 · `blender.data.updateObject`**
Params: `{ name: string, patch: BlenderObjectPatch }`. Applies partial patch to existing object. Returns updated `BlenderObject`. Failures: `ObjectNotFound`, `InvalidPatch` if patch has unknown fields.

**Cited evidence**: `lib/blender/data.port.ts:130-133` `updateObject` signature

**FR-11 · `blender.data.deleteObject`**
Params: `{ name: string }`. Deletes via `bpy.data.objects.remove(obj, do_unlink=True)`. Idempotent at op level (same cmdId dedupes). Returns `null` on success. Failures: `ObjectNotFound`.

**Cited evidence**: `lib/blender/data.port.ts:135` `deleteObject` signature

### 4.4 Escape Hatch (the long-tail surface) — ⚠️ DEFERRED TO v1 (r2)

> **r2 · 2026-05-19 · DEFERRED**: FR-12 is **NOT a v0 requirement**. The sprint-Flatline SKP-001 cluster established that the r1 security stack (restricted `__builtins__` + AST pre-scan + cooperative timeout) is a speedbump, not a sandbox — MRO traversal (`().__class__.__mro__[-1].__subclasses__()`) defeats it. A credible escape hatch needs OS-level isolation (subprocess + seccomp/AppArmor) which is a v1 design effort. **The FR-12 a–g spec below is RETAINED verbatim as v1 design input — it is not a v0 requirement and no v0 task implements it.** See Revision Notes (r2).

**FR-12 · `blender.escape.run_python_code` (r1 revised · security-gated) — v1 DESIGN INPUT, not v0**

`run_python_code` is the highest-risk surface in the addon. r0 framed it as "single-user dev environment safe"; flatline-review (PRD SKP-001 severity 950 · SKP-004 severity 820 · SDD SKP-001 severity 900) escalated this to **zero-auth RCE on localhost**, which is NOT a defensible v0 posture. r1 attempted to fix the surface with the security stack below; r2 sprint-Flatline established that stack is insufficient and deferred the whole feature to v1:

**FR-12a · Disabled by default**
The escape hatch is **off** unless the operator sets `BLENDER_MCP_ENABLE_ESCAPE=1` before launching Blender. With the flag unset, the registry registers a stub that returns `WireResponseError(kind="EscapeHatchError", message="run_python_code disabled — set BLENDER_MCP_ENABLE_ESCAPE=1")` immediately.

**FR-12b · Bearer-token gate**
When enabled, at addon-start the addon generates 32 random bytes via `secrets.token_hex(32)`, writes the hex string to `~/.blender-mcp/<session-id>.auth` (mode 0600 · parent dir mode 0700 · session-id is the addon-startup wall-clock + pid), and emits the path to Blender's text console. Every `blender.escape.run_python_code` command frame MUST include `auth_token: <hex>` in `params`; frames without the token (or with a stale token from a prior session) get `WireResponseError(kind="AuthFailed")` and are NOT executed. Token files are deleted on `unregister()`.

**FR-12c · Restricted builtins**
Code executes in a namespace with `__builtins__` explicitly replaced by an allowlist: `{"len", "range", "enumerate", "zip", "map", "filter", "list", "dict", "tuple", "set", "str", "int", "float", "bool", "print", "round", "min", "max", "sum", "abs", "all", "any", "sorted", "reversed", "isinstance", "type"}`. `__import__` is NOT in the allowlist (blocks `os` / `subprocess` / `sys` exfiltration). The namespace pre-binds `bpy`, `mathutils`, `math`. The operator can add modules via `BLENDER_MCP_ESCAPE_IMPORTS=mathutils,math` env (deny-by-default; explicit additions only).

**FR-12d · AST pre-scan**
Before `exec()`, the code string is parsed via `ast.parse()` and walked. Patterns rejected with `kind="EscapeHatchError"` (NOT executed):

- `ast.While` with `test=ast.Constant(value=True)` or `test=ast.Constant(value=1)` (unbounded `while True` / `while 1`)
- `ast.For` whose iter resolves to `itertools.count(...)` (unbounded counter)
- `ast.FunctionDef` calling itself with no decrement-toward-base-case detectable (best-effort heuristic · false negatives acceptable since cooperative semantics catch the rest)
- Any `ast.Import` / `ast.ImportFrom` referring to a module not in the allowlist
- Any `ast.Attribute` access on `__builtins__`, `__import__`, `globals`, `locals`, `vars`, `eval`, `exec`, `compile`

**FR-12e · Cooperative timeout · params still accepted**
Params: `{ code: string, timeout_ms?: number (default 5000), auth_token: string }`. Timeout is **cooperative-only** in v0: the AST pre-scan rejects unbounded loops; for code that passes the pre-scan, `timeout_ms` is enforced as a budget the addon tracks but cannot hard-interrupt (CPython + GIL constraint). README documents this honestly. v1 may add subprocess isolation; v0 does not.

**FR-12f · Audit log**
Every invocation (whether allowed or denied) appends one line to `~/.blender-mcp/<session-id>.audit.log` with: timestamp · cmdId · auth-token-prefix-8 · code-preview (first 200 chars, traceback-sanitized) · result (`ok` / `denied:<reason>` / `error:<kind>`). Audit log mode 0600.

**FR-12g · Response shape**
On success: `{ stdout, stderr, return_value, executed_ok: true }`. On AST-rejected: `WireResponseError(kind="EscapeHatchError", message="unbounded-loop detected: <reason>")`. On exception during exec: `WireResponseError(kind="EscapeHatchError", traceback=sanitized)`. On auth failure: `WireResponseError(kind="AuthFailed")`. On budget exceeded: `WireResponseError(kind="Timeout", message="cooperative budget exceeded")`.

**Cited evidence**: design brief §Substrate principle 3 *"Escape hatch handles the long tail"* + operator argument: *"escape hatch (run_python_code op)"* + flatline-review SKP-001/SKP-004 (PRD) · SKP-001 (SDD) · SKP-002 (Windows-signal infeasibility) · SKP-003 (timeout-main-thread).

### 4.5 Cross-Language Schema Discipline (r1 · new)

**FR-14 · Schema-conformance NFR**
The Python wire payloads MUST remain schema-conformant with the TypeScript `WireCommand` / `WireResponse` Effect Schemas. SDD §4 ships a normative Python ↔ TS field-mapping table. Drift detection is enforced via:

- a round-trip parity fixture (`tools/blender-addon/tests/fixtures/ts-roundtrip-cases.json`) committed to git
- a CI step (`pnpm test --filter blender-wire-parity`) that generates the fixture from TS, hands it to Python, and asserts byte-identical re-encoding
- a top-level `protocol_version: "1.0"` field in every frame; mismatched versions → `WireResponseError(kind="ProtocolMismatch")`
- a pre-commit hook (informational, non-blocking in v0) that warns if `lib/blender/wire.ts` is newer than the fixture

**Cited evidence**: PRD-flatline IMP-008 (777.5) · SDD-flatline IMP-001 (905) · "snake_case Python ↔ camelCase TS · 3am production defect class".

### 4.6 Lifecycle & Connection Correlation (r1 · new)

**FR-15 · Addon lifecycle invariants**
`unregister()` MUST execute, in order, with 2-second hard timeout per step:

1. Set `stop_event` (signals BG thread + drainer to exit)
2. `bpy.app.timers.unregister(drainer)` if registered (idempotent: try/except `ValueError`)
3. Wait for BG thread join with `thread.join(timeout=2.0)` — if exceeded, log warning + rely on daemon-thread auto-cleanup at process exit
4. Close listening socket explicitly (release port 9876)
5. ~~Delete `~/.blender-mcp/<session-id>.auth` (FR-12b)~~ **r2: REMOVED — auth file was FR-12 infra; no `~/.blender-mcp/` directory exists in v0**
6. Drop in-memory cmdId LRU cache + per-connection response queues

**Connection-correlation**: a global outbox produces wrong-cmd responses when a client reconnects. r1 replaces the single outbox with **per-connection response queues**:

- Each `ConnHandler` owns a private `out_queue: queue.Queue(maxsize=512)`
- Inbound cmd envelope at enqueue-time includes `(cmd, conn_id, out_queue_ref)`
- Main-thread `TimerDrainer` puts response onto `cmd.out_queue_ref` not a shared outbox
- On client disconnect: `ConnHandler` drains its queue and discards (purge-on-disconnect)
- On reconnect: new `conn_id` · new queue · no stale responses

**Cited evidence**: PRD-flatline IMP-005 (810) + SKP-003 (735) · SDD-flatline IMP-004 (875) + IMP-009 (800) + SKP-002 (PRD 855 · explicit response-correlation gap).

### 4.7 Queue Capacity & Back-Pressure (r1 · new)

**FR-16 · Bounded queues + back-pressure protocol**

- Inbox queue (BG-thread → main-thread): `queue.Queue(maxsize=512)`
- Outbox queue (per-connection · main-thread → BG-thread): `queue.Queue(maxsize=512)`
- BG-thread puts: `inbox.put_nowait(cmd)`; on `queue.Full` → emit `WireResponseError(kind="Backpressure", message="server inbox full · retry after backoff")` directly (skip main-thread roundtrip), continue serving
- Main-thread puts: `out_queue.put_nowait(resp)`; on `queue.Full` → drop response + signal BG-thread to close that connection (operator-experience: stalled client gets disconnected, not Blender frozen)

**Memory budget**: 512 entries × max ~10MB per cmd-or-resp (FR-17 cap) = ≤5GB worst case per queue. Realistic case at <50KB avg payload ≈ 25MB per queue. Tunable via `BLENDER_MCP_QUEUE_SIZE` env.

**Cited evidence**: SDD-flatline SKP-001 (CRIT 870 unbounded-queue OOM) · IMP-005 (845) · SKP-001 main-thread-freeze (CRIT 850).

### 4.8 Frame Size Limits (r1 · new)

**FR-17 · MAX_FRAME_BYTES + stream-corruption recovery**

- Constant `MAX_FRAME_BYTES = 10 * 1024 * 1024` (10MB · tunable via `BLENDER_MCP_MAX_FRAME_BYTES`)
- On header decode: if `body_length > MAX_FRAME_BYTES`, immediately close the connection (stream is untrustworthy after corrupted length field · do NOT just drop frame · downstream offsets are misaligned)
- Incomplete-frame deadline: 30s from header receipt; exceeded → close connection
- New error `WireResponseError(kind="FrameError", cmd_id="<unparseable>")` for connection-level errors where the command identity is unknown (sent as a final frame before close)

**Cited evidence**: PRD-flatline SKP-006 (740) · SDD-flatline SKP-003 (CRIT 820) · SKP-002 (HIGH 750) · concrete attack: 4-byte length 0xFFFFFFFF → 4GB OOM-DoS.

### 4.9 Anti-Pattern Negative Test Suite

**FR-13 · Regression tests for anti-patterns** *(r1 added AP-7 + AP-8 · **r2 removes AP-7** with FR-12 → v0 suite is 7 anti-patterns: AP-1..AP-6, AP-8)*

| # | Anti-pattern | Negative test |
|---|---|---|
| AP-1 | No length-prefix framing → "Incomplete JSON response" | Send 1MB payload + assert successful round-trip (would fail without framing) |
| AP-2 | bpy off main thread | Test inspects addon code for `bpy.` calls outside the timer callback (static check via AST scan) |
| AP-3 | State on `bpy.types` | Test inspects addon for `bpy.types.X = ...` assignments (static check) |
| AP-4 | No schema validation at wire | Send malformed JSON → addon returns `WireResponseError(kind="BadParams")`, never crashes |
| AP-5 | Stdio TaskGroup brittleness | N/A · addon uses TCP not stdio · marker test ensures no `anyio` import |
| AP-6 | Platform-specific asyncio internals | Static check: no `ProactorEventLoop` references; addon uses stdlib `socket` + `threading`, not asyncio |
| ~~AP-7 (r1)~~ | ~~Unbounded-loop escape code crashes the timer drain~~ | **r2: REMOVED — scoped entirely to the FR-12 escape hatch, deferred to v1** |
| **AP-8 (r1)** | **Top-level `import bpy` in handler modules breaks `fake_bpy` fixture** | **AST-walk all files under `lib/ops/`; fail on any `ast.Import` / `ast.ImportFrom` at module-level whose name resolves to `bpy`. Handlers MUST lazy-import `bpy` inside function bodies (per SDD-flatline SKP-005).** |

**Cited evidence**: design brief §Anti-patterns L138-145 (the source list) · r1 additions per PRD-flatline SKP-003 (timeout) + SDD-flatline SKP-005 (lazy-import).

---

## 5. Technical & Non-Functional Requirements

### 5.1 Platform

- **Blender**: **5.1.x** (operator's machine · ratified by S0 calibration 2026-05-19 · `bl_info` min declared `4.5.0` so 4.x also loads). *r2-note: r1 assumed 4.5 LTS — S0 surfaced the operator runs 5.1.1; cycle retargeted to empirical reality per operator decision.*
- **Python**: **3.13** (Blender 5.1.x bundled version · ratified by S0 Probe D). *r2-note: r1 assumed 3.11 — addon uses stdlib only, ran clean on 3.13.*
- **OS**: macOS 14+ (operator's machine) · should work on Linux + Windows with minor port (don't break for them, but don't validate either)

### 5.2 Wire Protocol

- TCP socket · localhost · default port 9876 (override via `BLENDER_MCP_PORT` env)
- Length-prefixed framing: `[4-byte BE uint32 body-length][UTF-8 JSON body]`
- Schema-validated payloads conforming to TS `WireCommand` / `WireResponse` Effect Schemas

### 5.3 Module Layout

> **r2 note**: indicative only — the **normative, current** file tree is `sprint.md` r3 Appendix D. r2/r3 changes: `lib/wire/` is a package (not flat `wire.py`); `escape.py` + `timeout.py` + `test_escape.py` removed (FR-12 deferred); `wire/schemas.py` + `wire/wire.schema.json` added (schema source-of-truth).

```
tools/blender-addon/
├── README.md              # install + connect instructions
├── addon.py               # main file · bl_info + registration + addon UI
├── lib/                   # importable Python modules (NOT addon-loaded)
│   ├── __init__.py
│   ├── wire/              # r3: PACKAGE — framing.py + case.py + schemas.py + wire.schema.json
│   ├── socket_server.py   # daemon socket thread + accept/recv loop
│   ├── main_thread.py     # bpy.app.timers drain + main-thread execution
│   ├── cmd_cache.py       # cmdId LRU
│   ├── config.py          # constants + env overrides
│   ├── ops/
│   │   ├── __init__.py
│   │   ├── data_handlers.py  # 5 CRUD op handlers
│   │   │                     # r2: escape.py REMOVED (FR-12 deferred to v1)
│   │   └── registry.py       # op-name → handler map
│   └── safety/
│       ├── __init__.py
│       └── traceback_sanitizer.py
│                          # r2: timeout.py REMOVED (cooperative-timeout was FR-12-only)
├── tests/                 # see sprint.md r3 Appendix D for the full test list
├── pyproject.toml         # pytest config · ruff config
└── requirements-dev.txt   # pytest, ruff, fake-bpy-module-latest (r2: no jsonschema)
```

**Cited evidence**: Phase 5+6 interview Q3 (operator selected "tools/blender-addon/")

### 5.4 Test Discipline

- Test-first (per operator Q2 response *"Test driven is important"*)
- pytest as test runner · Assumption 1 ratified
- Unit tests for wire + ops handlers run WITHOUT Blender (mocked `bpy` module)
- Integration tests run WITH Blender (manual fixture + `bpy` available)
- Coverage target: ≥ 85% via `pytest --cov=tools/blender-addon/lib`

### 5.5 Performance

- Single-machine localhost · latency budget p50 ≤ 50ms · p99 ≤ 200ms
- Throughput target ≥ 50 cmds/sec (sufficient for interactive agent driving)
- Memory growth: ≤ 100 KB / 1000 cmds (i.e., cmdId LRU prevents unbounded growth)
- **r1 honesty note**: p99 ≤ 200ms is met when main thread is idle. Under main-thread CPU pressure (large mesh ops · 100k+ vertex mutations · complex modifier stack evaluation), p99 may exceed budget — `bpy.app.timers` callbacks yield only between Blender's UI-tick cycles. README documents this; not a regression.

### 5.6 Security (r2 · revised)

- **Network exposure**: localhost-only · listening socket binds to `127.0.0.1` exclusively. `BLENDER_MCP_BIND_HOST` override **removed from v0 scope** (PRD-flatline SKP-005 severity 790 · "YOLO mode is not adequate security documentation").
- **No arbitrary code execution surface in v0 (r2)**: FR-12 `run_python_code` is deferred to v1. v0 exposes only the 5 data-seam CRUD ops — there is no `exec()`, no bearer-token auth file, no `~/.blender-mcp/` directory. This is the honest closure of the SKP-001 sandbox-escape cluster: the safest sandbox is the one that doesn't exist yet. v1 will add the escape hatch with OS-level isolation (subprocess + seccomp/AppArmor), not in-process restricted namespaces.
- **Traceback sanitization**: every error response strips `$HOME` · `$CWD` · `$USER` · `$BLENDER` paths from traceback strings (SDD §3.4) — applies to all CRUD-op `kind="BlenderError"` responses.
- **CRUD ops (FR-7..FR-11)**: NOT gated by bearer token in v0 — they mutate `bpy.data` only · no filesystem/network/exec surface · risk class is "operator accidentally deletes Suzanne via local script", which is already the operator's call.
- **Threat model out of scope**: malicious websites bypassing localhost via DNS rebinding · compromised dependencies on operator's machine · privilege escalation from Blender's process scope.

---

## 6. Scope & Prioritization

### 6.1 In Scope (v0 · r1 expanded)

- Length-prefixed framing (FR-1 to FR-3)
- Main-thread queue + threading (FR-4 to FR-6)
- 5 data-seam CRUD ops (FR-7 to FR-11)
- ~~Escape hatch with security gates (FR-12 a-g)~~ **r2: moved to §6.2 Out of Scope — DEFERRED to v1**
- Handler-level safety hardening: FR-6 try/except discipline + traceback sanitizer (r2 · S4 collapsed scope)
- 7 anti-pattern regression tests (FR-13 · AP-1..AP-6, AP-8 · **r2: AP-7 removed with FR-12**)
- **Schema-conformance + drift gate (FR-14 · r1 new)**
- **Lifecycle + per-connection correlation (FR-15 · r1 new)**
- **Bounded queues + back-pressure (FR-16 · r1 new)**
- **MAX_FRAME_BYTES + stream-corruption recovery (FR-17 · r1 new)**
- **TS-side `lib/blender/data.live.ts` (r1 · promoted from Risk R-4 to S1 deliverable)** — socket client mirroring this PRD's wire protocol · bounded reconnect (max-5-retry + exponential backoff · r2) · 10/10 TS test suite passes against live addon
- Stress test (G-5)
- README with install + connect instructions

### 6.2 Out of Scope (v1+)

- **`run_python_code` escape hatch (FR-12 · r2 · deferred from v0)** — needs OS-level isolation (subprocess + seccomp/AppArmor), not the in-process restricted-namespace approach r1 attempted. §4.4 retains the spec as v1 design input.
- Operator seam (`bpy.ops` dispatch)
- Context seam (workspace · area · mode)
- Node-graph seam (shader · geometry · compositor)
- Asset seam (asset library + UUID catalog)
- Modal operators (explicitly NOT supported in v0 per design brief)
- MCP-protocol export (so other agents can use this as MCP) · deferred until adapter is real
- Multi-user / multi-instance Blender
- Authentication / authorization
- Cross-platform CI (Linux/Windows tested manually only)

### 6.3 What v0 Does NOT Decide

- Whether the addon eventually graduates to a separate repo (per `compass-learns-honeycomb-graduates` memory, that's a later cycle)
- Whether the wire protocol becomes MCP-compatible
- The shape of operator/context/node-graph/asset seams (their own cycles)

---

## 7. Risks & Dependencies

### 7.1 Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | bpy threading API differences across Blender minor versions | Medium | Medium | Test against 4.5 LTS as primary; document 4.6 + 5.0 as "untested but should work" |
| R-2 | Operator-driven manual integration tests are tedious; manual-fixture rot | Medium | High | Document the fixture clearly in README; add a one-shot smoke test script (`./tools/blender-addon/smoke-test.sh`) |
| R-3 | Stress test reveals genuine architectural issue (deadlock under load) | Low | High | If hit, halt v0 + redesign threading model; do NOT ship a known-broken stress profile |
| ~~R-4~~ | ~~TypeScript-side `data.live.ts` not built yet~~ | ~~High~~ | ~~Low~~ | **r1: PROMOTED to S1 in-scope deliverable per PRD-flatline IMP-001 (902.5). Goals G-1+G-2 are unverifiable without it; no longer a risk to mitigate, it's a thing to build.** |
| R-5 | Operator decides to fork sandraschi after all if minimal-build hits unexpected complexity | Low | Medium | Operator pair-point at S2 close · explicit "continue or pivot" check |

### 7.2 Dependencies

- **Blender 4.x installed** on operator's machine (already true)
- **TypeScript substrate** at `lib/blender/` (landed today)
- **Python 3.11** (bundled with Blender 4.x)
- **pytest + ruff** in dev dependencies (new pyproject.toml in tools/blender-addon/)
- **TCP socket port 9876** available on localhost (default; override via env)

### 7.3 Negative Dependencies (things we intentionally do NOT depend on)

- NO MCP framework (FastMCP, mcp-python-sdk, etc.) · stays raw socket for control
- NO asyncio (per AP-6 · use stdlib threading instead)
- NO ahujasid/blender-mcp code (build from scratch, don't fork)

---

## 8. Open Questions

These are deferred to /architect (SDD) phase, NOT blocking PRD generation.

- Q-SDD-1: Exact threading shape · how does the timer drain interact with `bpy.context_override` for ops requiring specific context?
- Q-SDD-2: Connection lifecycle · accept multiple sequential TS clients (e.g., test process disconnects, integration test reconnects)? Or single persistent connection only?
- Q-SDD-3: cmdId LRU eviction policy · 256 entries seems right but what's the eviction shape (insertion order vs LFU)?
- Q-SDD-4: Traceback sanitizer · regex-based path replacement vs structured AST walk?
- Q-SDD-5: pytest with bpy mocked · do we install `fake-bpy-module` or hand-roll the stub?

---

## 9. References

### Source-of-Truth Citations

- TypeScript substrate (just landed):
  - `lib/blender/wire.ts` (length-prefix framing + Schema types)
  - `lib/blender/data.port.ts` (5 CRUD op signatures)
  - `lib/blender/data.mock.ts` (parity contract)
  - `lib/blender/__tests__/data.test.ts` (10/10 tests · contract)
  - `lib/blender/SKILL.md` (state-ownership matrix + named deferrals)

- Design rationale:
  - `grimoires/loa/context/blender-adapter-design-brief-2026-05-18.md` (canonical design doc · 4 substrate principles · 5 seams · 6 anti-patterns)
  - `grimoires/k-hole/research-output/dig-session-2026-05-18.md` (foundational research · length-prefix framing pattern · main-thread queue pattern · DSL > raw code)

- Memory primitives:
  - `feedback_design-adapter-not-integrate-broken-tool`
  - `reference_length-prefixed-framing-tcp-bug-class`
  - `feedback_compass-learns-honeycomb-graduates`
  - `feedback_over-structuring-causes-design-system-collapse`
  - `honeycomb-substrate`

### External Reference

- Blender Python API: `docs.blender.org/api/current/`
- ahujasid/blender-mcp (MIT) · structural reference for `addon.py` patterns (do NOT inherit bugs)
- Effect Schema: `effect.website/docs/schema/introduction/`
- UnrealMCP · prior art for length-prefixed framing in 3D-tool MCP space
- FIX protocol · gold standard for zero-loss reconstruction over raw TCP

### Phase:Question References

- Phase 2 Q1 → operator selected "Handshake + all 5 CRUD ops + escape hatch"
- Phase 4 Q2 → operator confirmed "test driven is important" → pytest discipline + parity-with-mock contract
- Phase 5+6 Q3 → operator selected "tools/blender-addon/ in compass repo"

---

## Authoring note

Authored 2026-05-18 via `/plan-and-analyze` (minimal mode · batch pacing · 3 questions asked · 3 assumptions named + ratified · gate before generation honored).

Same session as: TypeScript substrate (`lib/blender/` v0 landed · 10/10 tests passing) + design brief + 3 subagent dig + 9 candidate briefs across the day.

Next: `/architect` produces the SDD that translates these 13 functional requirements into module-level design decisions (threading shape · accept-loop lifecycle · pytest fixture pattern · error-handling envelope).
