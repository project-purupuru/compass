---
session: 13
date: 2026-05-16
type: kickoff-build-doc
topic: substrate-graduation-utc
status: ready
mode: ARCH (OSTROM) + craft lens (ALEXANDER) + DIG synthesis
run_id: 20260516-e77b8c
constructs_referenced:
  - construct-purupuru-codex (installed at .claude/constructs/packs/purupuru-codex)
  - construct-gauntlet (~/Documents/GitHub/construct-gauntlet · old, lessons only)
  - loa-hounfour (~/Documents/GitHub/loa-hounfour · schema substrate)
  - hivemind-laboratory (~/Documents/GitHub/hivemind-laboratory · UTC source)
  - observer pack (.claude/constructs/packs/observer · UTC producer)
upgrade_sources:
  - loa-constructs (~/Documents/GitHub/loa-constructs · v2.41.0 · pipe-doctrine v4 · the registry)
  - construct-base (~/Documents/GitHub/construct-base · the template + latest construct patterns)
execution_shape: "single session · 3 construct subagents in INTERACTIVE distillation loop · operator pulls threads via /dig · construct upgrades happen FIRST"
---

# Session 13 — Substrate: Graduation Tier as User-Truth Backpressure

> The next session does ONE thing: lay the schema substrate so every artifact
> (taste tokens, VFX configs, lore entries, codex entities) carries a tier +
> grounding linkage that ties agent forward-generation back to validated user
> truth. Research compounds into the arcade + vfx-playbook + easel constructs
> in the same pass. UI features (heavy cards, combo VFX, environmental
> effects) ship in a SEPARATE follow-on session against this substrate.

## Context

Operator direction 2026-05-16: agents over-generate without backpressure. The
graduation tier system (gold/silver/bronze) is the load-bearing fix — NOT a
quality rank, a GROUNDING rank. Tiers tell the agent which taste tokens, design
patterns, and lore entries are anchored to user-truth canvases vs. unmoored
generation.

This session establishes the SUBSTRATE for that backpressure. UI work waits a
session — once the schema exists, building against it is mechanical.

## Load Order (read in this order)

1. `grimoires/loa/specs/enhance-substrate-graduation-utc.md` — **this doc** (build sequence + design rules)
2. **NEW Phase-0 sources**: `~/Documents/GitHub/loa-constructs/README.md` + `grimoires/loa-constructs-seed-2026-04-21/bonfire-construct-pipe-doctrine.md` (or latest pipe-doctrine v4 path) — the registry's current shape · what "upgraded" means in 2026-05
3. **NEW Phase-0 sources**: `~/Documents/GitHub/construct-base/CLAUDE.md` + `construct.yaml` + `skills/example-simple/SKILL.md` — the construct-base template every pack should align to
4. `~/Documents/GitHub/hivemind-laboratory/.claude/schemas/labels.schema.json` — canonical UTC frontmatter shape (11 artifact types)
5. `~/Documents/GitHub/hivemind-laboratory/labs/README.md` — UTC organization + cross-repo URL reference pattern
6. `~/Documents/GitHub/loa-hounfour/README.md` + `docs/patterns/epistemic-tristate.md` — envelope conventions + tristate verdict pattern
7. `~/Documents/GitHub/loa-hounfour/schemas/audit-trail-entry.schema.json` — the envelope shape to mirror
8. `.claude/constructs/packs/observer/README.md` + `templates/canvas-template.md` — UTC producer (the cross-construct interface for promoting tiers)
9. `.claude/constructs/packs/purupuru-codex/construct.yaml` — codex's existing `canon_tier` enum (4 levels) that graduation tier maps onto
10. `MEMORY.md` at `~/.claude/projects/-Users-zksoju-Documents-GitHub-compass/memory/` — for current taste/feedback context

## Persona

**ARCH (OSTROM)** lead for the schema design — invariants, blast radius, contract shape.
**Lens**: hounfour discipline (tristate verdicts, SHA256 evidence hashes, additionalProperties:false + metadata escape hatch).
**Lens**: ALEXANDER for any UI-facing surfaces this session touches (tier badges, sandbox knobs, preset library).
**Construct subagents dispatched in this session**: observer (for UTC schema patterns), the-arcade (game design distillation), vfx-playbook (effect taxonomy distillation), the-easel (taste-token tier compound).

## Invariants (Ostrom — what MUST NOT change)

1. **Backward-compat**: existing taste files without `tier:` frontmatter default to `bronze` automatically (no silent breakage)
2. **Operator authority is supreme**: tier promotion past `silver` REQUIRES operator-signed activation receipt (no agent self-promotion to gold)
3. **Tristate, never boolean**: `grounding_status: grounded | refuted | unverifiable` (mirrors hounfour epistemic-tristate doctrine)
4. **Schema closed**: `additionalProperties: false` on every envelope; extension only via `metadata` open object (10KB cap)
5. **construct-purupuru-codex owns lore + entities only**: design taste lives in a SEPARATE construct (operator-owned, future); for cycle-1 those artifacts stay in compass grimoires
6. **UTC linkage is a property of the link, not the file**: when a UTC moves or is superseded, downstream artifacts auto-demote (drift detection)
7. **Hivemind-laboratory remains the canonical UTC store**: compass refers to UTCs by URL (cross-repo contract), not by local copy

## Blast Radius

| Artifact | Change | Risk |
|----------|--------|------|
| `lib/schemas/graduation-tier.schema.json` | NEW (JSON Schema 2020-12) | low |
| `lib/schemas/graduation-tier.constraints.json` | NEW (constraint DSL, mirrors hounfour) | low |
| `lib/schemas/graduation-tier.types.ts` | NEW (TypeBox or Zod-derived types) | low |
| `lib/schemas/validate-graduation.ts` | NEW (validation entrypoint) | low |
| `.claude/constructs/packs/purupuru-codex/construct.yaml` | EDIT — add `linked_utcs` to base-entity schema + map graduation tiers onto canon_tier promotion gates | medium · upstream pack |
| `.claude/constructs/packs/observer/skills/observing-users/` | EDIT (optional) — emit `tier-promotion-candidate` events when a UTC is created | medium |
| `.claude/constructs/packs/the-arcade/` | EDIT — distill heavy-card + combo + engagement-loop research from DIG into doctrine entries | low (additive) |
| `.claude/constructs/packs/vfx-playbook/` | EDIT — distill effect taxonomy + composition-graph patterns from DIG | low (additive) |
| Existing taste files in `grimoires/loa/context/*.md` | NO EDIT — backward-compat means no `tier:` defaults to bronze | none |
| Future taste files | ADD `tier:` + `linked_utcs:` frontmatter | none (forward-only) |

NEW dependencies: none required for substrate (pure schema + validation). Future VFX sandbox session will add `leva` or `tweakpane` + `reactflow` (Phase 2).

## Data Architecture

### The grounding chain

```
agent forward-generation
       ↓ produces
   artifact (taste token / VFX config / codex entry)
       ↓ tagged with
   tier: bronze        ← unanchored generation (default)
       ↓ operator promotes via activation receipt
   tier: silver        ← operator-intuition-backed (no UTC yet)
       ↓ observer captures real user feedback → produces UTC
       ↓ link added: linked_utcs: [labs/<domain>/UTC-<slug>-<date>.md]
   tier: gold          ← backed by UTC with learning_status >= directionally-correct
       ↓ UTC moves or learning_status drops to hypothesis-failed
   AUTO-DEMOTE to silver (drift detection)
```

### Schema sketch (mirrors hounfour discipline)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.thj/compass/1.0.0/graduation-tier",
  "x-cross-field-validated": true,
  "additionalProperties": false,
  "type": "object",
  "required": ["envelope_id", "artifact_path", "tier", "grounding_status", "asserted_at", "contract_version"],
  "properties": {
    "envelope_id":      { "format": "uuid", "type": "string" },
    "artifact_path":    { "minLength": 1, "type": "string" },
    "tier":             { "enum": ["gold", "silver", "bronze"], "type": "string" },
    "grounding_status": { "enum": ["grounded", "refuted", "unverifiable"], "type": "string" },
    "linked_utcs": {
      "type": "array",
      "items": {
        "additionalProperties": false,
        "type": "object",
        "required": ["canvas_url", "quote_hash"],
        "properties": {
          "canvas_url":  { "minLength": 1, "type": "string" },
          "quote_hash":  { "pattern": "^sha256:[0-9a-f]{64}$", "type": "string" },
          "confidence":  { "minimum": 0, "maximum": 1, "type": "number" },
          "learning_status": {
            "enum": ["strongly-validated", "directionally-correct", "hypothesis-failed", "smol-evidence", "cant-make-a-conclusion"],
            "type": "string"
          }
        }
      }
    },
    "blessed_by":       { "enum": ["operator", "auto-derived", "construct-consensus"], "type": "string" },
    "operator_signed":  { "type": "boolean" },
    "asserted_at":      { "format": "date-time", "type": "string" },
    "contract_version": { "pattern": "^\\d+\\.\\d+\\.\\d+$", "type": "string" },
    "metadata":         { "type": "object", "patternProperties": {"^.*$": {}} }
  }
}
```

### Cross-field constraints (mirror hounfour `*.constraints.json`)

- `tier=gold ⇒ linked_utcs.length >= 1 AND any(linked_utcs[].learning_status in [strongly-validated, directionally-correct]) AND grounding_status=grounded`
- `tier=silver ⇒ operator_signed=true OR (blessed_by=construct-consensus AND metadata.consensus_voices.length >= 2)`
- `tier=bronze ⇒ grounding_status != refuted`
- `grounding_status=refuted ⇒ tier=bronze` (forced demotion)

## Execution Shape — INTERACTIVE distillation, not fire-and-forget

Operator direction 2026-05-16 (clarification on top of the kickoff): the
sub-agent dispatch is NOT autonomous-report-back. It's an **interactive
distillation loop** where the operator pulls threads via `/dig`, brings
external artifacts in, and compounds expertise into the constructs themselves.
The construct subagents are collaborators in the iteration, not background
workers — they propose, the operator pulls threads, doctrine lands at the
construct level.

**The doctrine the operator named in confirmation**: k-hole construct is the
**resonant-distiller / researcher / teacher** that OTHER constructs invoke
when they need to teach the operator a new domain. Resonance is the operator's
signal; surface area is the construct's offering. See memory
`feedback_khole-as-resonant-distiller`.

### The PullThread schema (standardized teacher-mode return format)

Every teacher-mode subagent dispatch returns an array of PullThreads instead
of a 1500-word synthesis essay. This is the surface area the operator scans
in 60 seconds to find what resonates:

```yaml
PullThread:
  id: string                # unique slug
  name: string              # short topic name
  hypothesis: string        # WHY this might resonate (1-2 sentences)
  surface_area:
    examples:               # what the operator can SEE/READ
      - { kind: screenshot|code|gif|quote, path_or_content, caption }
    videos:                 # timestamped — never "watch the whole thing"
      - { url, t_range: "MM:SS-MM:SS", what_to_watch_for }
    links:                  # annotated, never bare URLs
      - { url, why_relevant }
    vocabulary:             # terms that unlock further search
      - { term, definition, why_unlocks }
  next_query_seeds: string[]  # if operator picks this, dig with these
```

Counter to the failure mode where a subagent returns a long essay and the
operator must read linearly. PullThread = 3-5 short offerings, operator picks
the one that ignites, loop iterates with TIGHTER signal.

### PullThread digestibility rules (load-bearing — operator-named 2026-05-16)

Per memory `feedback_pullthread-digestibility`:

1. **3-5 threads per iteration** (5 = ceiling, 3 = sweet spot). NEVER multiply.
2. **Going deeper means TIGHTENING** — if iteration N has 5 threads and
   iteration N+1 has 6, you went wider not deeper. Pick the 1 tightest
   sub-thread per pulled parent; park the rest as named tracks.
3. **≤8 lines per thread · ≤400 words total per iteration**. Anything more,
   the operator drops out of scan-mode into read-mode (the failure the
   protocol was designed to counter).
4. **Hard stop on operator signal** ("stop" · "we're going deep" · "close
   out") — immediate, no defense, no last-thread-just-in-case. Save state,
   refresh clipboard, surface what was learned.

### Doctrines harvested in this kickoff (post-confirmation rounds)

3 operator-named doctrines were saved to memory during the kickoff loop and
now drive session 13's construction:

1. **`feedback_graduation-as-user-truth-backpressure`** — tiers
   (gold/silver/bronze) anchor artifacts back to validated user-truth
   canvases; counter agent forward-generation drift; gold requires UTC
   linkage with `learning_status ≥ directionally-correct`.
2. **`feedback_khole-as-resonant-distiller`** — k-hole = teacher-of-constructs;
   other constructs INVOKE k-hole when they need to teach the operator a new
   domain; PullThread schema is the standard return format.
3. **`feedback_eval-before-lock-and-breadth-depth-tension`** — novel cognitive
   structures (the k-hole 7 voices being the worked example) are HYPOTHESES
   until evals prove them; default not-load-bearing. The breadth↔depth
   alternation **TOWARDS CONVERGENCE** is the general research principle —
   k-holing AND /spiraling share this core. Without the convergence
   orientation, the loop becomes "rabbit holing into death and losing
   yourself" (operator phrase). With it, the loop SPIRALS toward an
   artifact/decision/landing. Every teacher-mode dispatch must declare a
   `convergence_target`; no target = no protocol.
4. **`feedback_pullthread-digestibility`** — the protocol's value is the
   60-second scan; density rules above.

### K-hole audit summary (one paragraph)

K-hole is MATURE (v1.4.0) — already has surface contract
(`schemas/dig-surface.schema.json`), creative-resonance-envelope schema with
composes_with/contradicts_with graph edges, auto-emit envelope loop, typed
streams in pipe-doctrine, NDJSON streaming with SIGINT-abort-with-partial,
visual-dig + visual-review multimodal extensions, /dig + /forge paired modes.
**The gap to close in session 13**: zero cross-construct callers exist
(verified via grep). The teacher-protocol surface (a `--teach-mode` flag or
new `teach()` skill returning PullThread[]) needs to ship + at least one
other construct needs to invoke it. The 7 voices are PARKED as
hypothesis-unproven; no construct should depend on them until evals land
(memory `feedback_eval-before-lock`). The breadth↔depth toggle is already
codified in --scout vs --depth N; the protocol-level encoding of
breadth/depth as a thread-MODE attribute lands as part of teacher-mode shape.

### 3 PullThreads from k-hole audit pulled forward to session 13

1. **`cross-construct-invocation-gap`** — load-bearing fix; ship `teach()`
   skill OR `--teach-mode` flag (cheapest: flag); at least one other
   construct invokes it during session 13
2. **`research-envelope-as-parent-type`** — generalize beyond design refs
   (CRE); ResearchEnvelope parent with specializations for game mechanics,
   VFX, code patterns, user-truth; discriminator on `ref.type`
3. **`operator-learning-telemetry`** — read `thread_pulled` events into
   resonance clusters; mirror-not-prediction; counter-bias toward unexplored
   space (compose with breadth↔depth toggle); MVP = session-close summary

Parked tracks (not pulled): voices-eval framework, voice-as-protocol surface,
rooms-substrate-handoff-actualization. Each is named in this doc and gets
addressed when evals land OR when a downstream construct needs them.

**Construct-upgrade FIRST**: before any distillation, each relevant construct
(arcade, vfx-playbook, easel, observer, codex) gets upgraded to the latest
pipe-doctrine v4 / construct-base patterns from:
- `~/Documents/GitHub/loa-constructs` (v2.41.0 · the registry)
- `~/Documents/GitHub/construct-base` (the template)

This ensures the doctrine entries we distill INTO them land on a current,
compliant construct shape, not a stale one.

## What to Build (in dependency order)

### 0. CONSTRUCT UPGRADE PASS (new — happens first)

For each construct that will receive distillation, **k-hole goes first** as
the first-class upgrade because it becomes the teacher-protocol substrate the
others depend on:

**0a. k-hole** (`.claude/constructs/packs/k-hole`) — FIRST CLASS
   - upgrade to pipe-doctrine v4 + construct-base latest
   - codify the PullThread schema (see Execution Shape above) as a
     first-class output type that the `dig` skill returns
   - add a `teach(topic, context)` skill that other constructs INVOKE
     when they need to surface a domain to the operator
   - expose `teach_mode: true` flag on dig dispatches — when set, return
     PullThread[] instead of synthesis essay

**0b-f. other 4 constructs** (`the-arcade`, `vfx-playbook`, `the-easel`,
`observer`, `purupuru-codex`):
1. Diff the construct's current shape against latest pipe-doctrine v4
   (`bonfire-construct-pipe-doctrine.md` in loa-constructs)
2. Diff against `construct-base` template — identify gaps (CLAUDE.md identity?
   construct.yaml validity? skill manifest shape? CI green?)
3. Apply minimum-viable upgrade (DON'T rewrite from scratch — patch)
4. Add a `dig_loop` capability that wraps `k-hole.teach()` — when the
   construct needs to teach the operator a new domain, it dispatches via
   k-hole and gets PullThreads back in the standard format
5. Run construct-base CI checks (placeholder text blocked, schema valid)
6. Operator reviews + greenlights before proceeding to next construct

Per-construct ETA: k-hole gets ~30-45min (first-class upgrade) · others
~15-25min each. Total ~2-2.5h. Operator-gated at each construct boundary.

### 1. `lib/schemas/graduation-tier.schema.json` + `.constraints.json`
Mirror hounfour's authoring pattern. JSON Schema 2020-12, constraint DSL for cross-field rules, closed shape with `metadata` escape hatch. Validate against golden vectors in `lib/schemas/__vectors__/graduation/`.

### 2. `lib/schemas/validate-graduation.ts`
Single-entry validation function: `validate(artifact: unknown): { valid: boolean; errors?: ValidationError[]; warnings?: string[] }`. Same shape as hounfour's `validate()` (README:98-108). Two modes: `strict` (block on invalid) and `warn` (emit `[SCHEMA-WARNING]` to .run/audit.jsonl).

### 3. `lib/schemas/__vectors__/graduation/`
Golden vectors per category:
- `bronze-unanchored.json` — pure agent generation, no UTC, valid
- `silver-operator-blessed.json` — operator_signed=true, no UTC, valid
- `gold-utc-backed.json` — linked_utcs with directionally-correct learning, valid
- `gold-missing-utc.json` — invalid (tier=gold + linked_utcs empty)
- `refuted-forced-demote.json` — grounding_status=refuted with tier=silver → invalid

### 4. Update `purupuru-codex` construct.yaml
- Add optional `linked_utcs[]` to `base-entity.schema.json`
- Map graduation tier → canon_tier promotion gates:
  - bronze → `speculative` (default for new entries)
  - silver → `exploratory` (operator-blessed)
  - gold → `established` (UTC-backed, `learning_status >= directionally-correct`)
  - canonical → unchanged (lore-bible only, separate from graduation)
- `validate_world_element` MCP tool refuses promotions past `exploratory` when `linked_utcs` is empty

### 5. INTERACTIVE distillation loop — arcade + vfx-playbook + the-easel

NOT fire-and-forget. The loop:

```
operator drives ↔ construct subagent collaborates ↔ /dig pulls threads
                                ↓
                  artifact crystallized → operator reviews
                                ↓
                  doctrine landed in construct (gated by operator)
```

Per construct, the iteration:
1. Dispatch construct subagent with a SCOPED brief (one topic at a time, not
   a 6-bullet shopping list)
2. Subagent returns initial pass + 3-5 PULL THREADS
3. Operator picks 1-2 threads to chase → invokes `/dig` (operator-driven, not
   subagent-self-dispatched) → brings results back
4. Operator brings external artifacts in (game refs, screenshots, doc URLs)
5. Subagent + operator synthesize → doctrine entry drafted
6. Operator reviews + greenlights → entry lands in construct
7. Next topic / next construct

**arcade construct distillation** (game design — Hearthstone BG / Balatro /
Inscryption / Marvel Snap / Slay the Spire patterns on heavy cards + combos +
engagement loops). Initial scope: ONE topic only (e.g., "Balatro's combo
scoring escalation"). Pull-thread examples: "Marvel Snap's reveal sequencing,"
"Inscryption's dread-economy in card play." Output: doctrine entries in
`.claude/constructs/packs/the-arcade/doctrine/` tagged `tier: silver` default.

**vfx-playbook construct distillation** (composition graphs — Unity VFX Graph,
Godot GPUParticles3D, ComfyUI DAGs, react-flow, Leva/Tweakpane). Initial
scope: ONE topic (e.g., "Unity VFX Graph's Spawn→Init→Update→Output grammar
as portable JSON DAG"). Pull threads: "Babylon.js particle loadFromFile,"
"react-flow custom node patterns." Output: `vfx-playbook/doctrine/` entries
with concrete `/battle-v2/vfx-lab` (Phase 2 session) recommendations.

**the-easel construct distillation** (existing-taste-token audit + tier
proposal). Initial scope: audit `app/globals.css` + context taste docs;
propose tier per token with rationale + UTC link (or absence). Pull threads:
operator may want a specific token re-examined or a comparison against a
locked reference. Output: `grimoires/loa/taste-token-graduation-2026-05-16.md`
+ tier badges proposed in `.claude/constructs/packs/the-easel/doctrine/`.

### 6. Hivemind-laboratory bridge
- Decide: does compass clone hivemind-laboratory as a sibling, or reference UTCs by GitHub URL only? Recommend URL-by-default (cross-repo contract), local clone optional for operator workflow.
- Add a `compass/grimoires/loa/utc-references.md` index — first 5 UTCs the operator wants to author for cycle-2 (placeholders are fine for now).

### 7. Operator activation receipt for first promotions
After DIG distillation lands, operator runs `/promote` (new command, see below) on 3-5 tokens to validate the silver → operator-signed flow.

## Design Rules (Alexander)

- **Tier badges** (when surfaced visually): solid 1px border, NO opacity. Gold = `oklch(0.85 0.170 80)` warm honey · Silver = `oklch(0.78 0.020 240)` cool grey-blue · Bronze = `oklch(0.65 0.080 50)` warm umber. Element-vivid for accents only.
- **Tier badge typography**: `--font-puru-mono`, `text-2xs`, `letter-spacing: 0.22em`, `text-transform: uppercase`. Matches Observatory taste-tokens doctrine.
- **Tier badge size**: 4px vertical padding, 6px horizontal. Pill-shape (border-radius full).
- **Tier badge placement** (in inspector or docs): top-right of artifact preview, never blocking content.
- **No glow / no opacity layering** on tier surfaces (the operator's "cheap" pushback from 2026-05-16 applies).

## What NOT to build (Barth's scope discipline)

- NO VFX sandbox UI this session (it gets its own session)
- NO graph editor (vfx-lab Phase 2)
- NO automatic gold promotion (only operator-signed)
- NO modification of EXISTING taste files to add `tier:` — backward-compat means absence defaults to bronze. Forward-only adoption.
- NO codex entity additions — schema work only on the construct
- NO heavy-cards / combo-emphasis UI in compass — defer to follow-on session against this substrate

## Sub-agent dispatch plan (next session)

Subagents are SCOPED + ITERATIVE, not fire-and-forget. Each dispatch is one
topic with explicit pull-threads expected back. Operator-driven from there.

**Phase order**:

1. **Phase 0 · construct-upgrade pass** — per-construct upgrade against latest
   pipe-doctrine v4 (5 constructs · gated by operator at each boundary)
2. **Phase 1 · interactive distillation loop** — one construct subagent at a
   time, one topic at a time. Operator pulls threads via `/dig`, brings
   artifacts in, doctrine lands at the construct level per iteration.
3. **Phase 2 · schema substrate build** — graduation-tier.schema.json +
   constraints + validators + golden vectors (after constructs are upgraded
   and seeded with distilled doctrine)
4. **Phase 3 · purupuru-codex wiring** — map graduation tier onto codex's
   canon_tier promotion gates · `validate_world_element` refuses promotion
   past `exploratory` when `linked_utcs` is empty
5. **Phase 4 · operator activation** — operator runs `/promote` on 3-5 tokens
   to validate the silver → operator-signed flow

No autonomous synthesis at session-close. The synthesis happens IN the
distillation loop, iteration by iteration, gated.

## Verify (how to confirm it works)

```bash
# Schema validation
cd /Users/zksoju/Documents/GitHub/compass-cycle-1
pnpm tsx lib/schemas/validate-graduation.ts lib/schemas/__vectors__/graduation/

# Cross-field rules engaged
pnpm tsx lib/schemas/validate-graduation.ts --vector gold-missing-utc.json
# expect: { valid: false, errors: [{ rule: "gold-requires-utc", ... }] }

# purupuru-codex construct compiles + validates
cd .claude/constructs/packs/purupuru-codex && pnpm test
```

## Key References

| Topic | Path |
|-------|------|
| Build doc (this) | `grimoires/loa/specs/enhance-substrate-graduation-utc.md` |
| Hivemind labels schema | `~/Documents/GitHub/hivemind-laboratory/.claude/schemas/labels.schema.json` |
| Hounfour envelope | `~/Documents/GitHub/loa-hounfour/schemas/audit-trail-entry.schema.json` |
| Hounfour tristate doctrine | `~/Documents/GitHub/loa-hounfour/docs/patterns/epistemic-tristate.md` |
| Observer canvas template | `.claude/constructs/packs/observer/templates/canvas-template.md` |
| Codex canon_tier (existing) | `.claude/constructs/packs/purupuru-codex/construct.yaml:80-82` |
| Construct-gauntlet lessons | `~/Documents/GitHub/construct-gauntlet/.claude/commands/compound.md` |
| loa-constructs registry | `~/Documents/GitHub/loa-constructs` · v2.41.0 · pipe-doctrine v4 |
| construct-base template | `~/Documents/GitHub/construct-base` · the upgrade-target shape |
| 4-construct synthesis (this session) | See DIG findings inline in this doc |
| Run trail | `.run/compose/20260516-e77b8c/orchestrator.jsonl` |

## DIG findings — synthesis (verbatim from 4 parallel subagents)

### A. construct-gauntlet (graduation prior art)
- Has 3 related lifecycle ladders: compound-learning promotion (`pending/`→`live/`→`archived/`), 2-tier weighting (framework 1.0 / project 0.9), shadow classification (Orphaned/Partial/Drifted)
- **Carry forward**: 3-bucket filesystem lifecycle (visible via `ls`), 4-orthogonal-gates vector (Depth/Reusability/Trigger/Verification), operator-gated promotion default, authority-on-retrieval (lower tiers still surface, just lose ties), similarity-thresholded with operator-tunable cutoffs
- **Skip**: pack `free`/`pro` (commercial), Beads coupling, single-similarity-score classification

### B. loa-hounfour (envelope substrate)
- 53 TypeBox schemas + JSON Schema 2020-12 + 31-builtin constraint DSL
- Envelope conventions: `*_id` (UUID), `contract_version` (regex), `*_at` (date-time), `additionalProperties: false`, `metadata` 10KB escape hatch, `x-cross-field-validated: true` flag, `x-references[]` for bidirectional provenance
- **Tristate doctrine**: `conserved | violated | unverifiable` — never boolean. Applied to `grounding_status`
- **SHA256 quote hashes** (mirrors `req-hash.ts`) for evidence integrity

### C. hivemind-laboratory (UTC source)
- UTC is "anti-spiral tether — binds artifact outputs to user truth so AI work doesn't drift"
- Produced by observer pack: `observing-users`, `ingesting-dms`, `feedback-observing`, `batch-observing`, `concierge-testing`, `level-3-diagnostic`, `daily-synthesis`
- Schema: `artifact_type: user-truth-canvas` + `learning_status: strongly-validated | directionally-correct | hypothesis-failed | smol-evidence | cant-make-a-conclusion`
- Already used pattern: `[EXP]` artifacts reference UTCs via `## Linked Canvas` section. Missing canvas = experiment is operator-intuition only.
- Cross-repo via URL reference (labs/README pattern)

### D. VFX sandbox architecture (Phase 2 reference)
- 4 invariants: effect-as-data · pipeline grammar (spawn→init→update→output) · live preview · save/load via same serializer the runtime consumes
- Leva > Tweakpane for compass (r3f-native, less ceremony)
- Compose: Unity grammar + ComfyUI JSON DAG + React Flow editor + Leva knobs
- Starter 6 effects: card-summon-flourish, combo-link-pulse, hit-flash, tree-fall, anvil-strike, weather-tint
- **Defer graph editor to Phase 2** — ship isolation surface (Picker + Leva + Preview) first
- Open: Leva vs Tweakpane (recommend Leva), TS-with-Zod (recommend) vs JSON, presets in lib or grimoires

## Open Creative Questions (for the operator at next session start)

1. **Schema location**: `lib/schemas/` (project-local, ports nowhere) OR introduce a new repo `construct-graduation-substrate` (reusable across projects)?
2. **Auto-demotion mechanic**: when a UTC moves/supersedes, demote linked artifacts → bronze AUTOMATICALLY, or just warn?
3. **Tier surfacing in UI**: surface tier badges in /battle-v2 (visible to operator while playing) or only in dev/inspector tools?
4. **The-easel split**: should the taste-token-design construct be SPUN OUT of the-easel into its own construct, or stay as a doctrine surface inside it?

## Cuts from V1 (Barth)

- Hivemind-laboratory clone into compass (URL reference is enough for cycle-1)
- Auto-promotion logic (only operator-signed in V1)
- VFX sandbox build (separate session, scoped from this substrate's data model)
- All compass /battle-v2 UI changes (next-next session)
- Operator-facing tier-promotion CLI (`/promote` command is in scope but UI is just CLI flag for now)
