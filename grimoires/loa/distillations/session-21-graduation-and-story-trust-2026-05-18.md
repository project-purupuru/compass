---
session: 21
date: 2026-05-18
type: doctrine-distillation
status: complete
mode: STUDIO → ROOM (small chunks)
scope: graduation/medallion substrate + bookshelf primitive + /story-trust mechanism + zone-as-composable-module
operator_signed: unsigned
construct_affinity: [cross-domain]
---

# Session 21 · Graduation Substrate + Story Trust Mechanism

> The session that named the candor pass as the unified mechanism behind both *tier promotion* and *drift detection*. Three artifacts + five memories + zero code. The operator's instinct on graduation/medallion was *ahead* of vault doctrine; this session caught the vault up.

## Substrate

The doctrinal moves — what this session named at the substrate layer:

- **Graduation IS the candor pass** — the bronze/silver/gold/refuted tier-stamp ladder isn't decoration; it's the *substrate primitive* the operator has been circling for ~3 sessions. The mechanism behind it is Pixar's Story Trust: peer review with brutal candor and **no authority**. Director keeps agency; the panel keeps the floor honest. The operator's force-chain stays uncollapsed because the candor pass is the gate at every promotion. Source: `grimoires/loa/context/graduation-substrate-brief-2026-05-18.md` §5 thread 1 + `feedback_graduation-as-user-truth-backpressure`.

- **One mechanism, two domains** — the candor pass serves graduation (tier promotion) *and* drift detection (maintenance) identically. The agent's standing job is: detect honestly, raise specifically, propose minimally, never decide. The operator's standing job is: decide, promote, refine. This collapses two seemingly separate problems into one substrate pattern. Source: `feedback_agent-as-story-trust-for-maintenance`.

- **Class-validation vs policy-validation must never collapse** — inherited from `loa-straylight/docs/schema-candidates/class-vs-policy-boundary.md`. Agent runs class (shape-honest? drifted? matches adjacent gold?). Operator runs policy (tier change? activation? refutation?). Collapse is the *named bug class*.

- **Status mutates; never deletes** — loa-straylight's status-lattice (`admitted → contested → revoked → forgotten_from_recall`) inherits into compass: refuted tier stays in MAP.md (greyed), never removed. Audit-chained, not write-erased.

- **SKP-001: chat memory is not citable** — the candor pass writes to `grimoires/loa/context/candor-<artifact>-<date>.md` as an in-repo artifact, not chat. Chat-only candor is fine for triage; promotion/refutation evidence is not citable in chat.

- **Zone-as-composable-module is the compass architectural primitive** — zones are composable world-modules; routes *present* zones (zones don't own routes); future games / freeside-* installables / a game store all join as more zones. Source: `project_zone-as-composable-module` memory.

- **Freeside modules are schema-only, runtime-agnostic** — `freeside-{activities,score,mint}` ship schemas + contracts + state machines, NOT runtime. Compass implements runtime against upstream schemas. `lib/activity/` and `lib/score/` are local stubs awaiting upstream integration. Source: `feedback_freeside-modules-schema-only-runtime-agnostic`.

- **Over-structuring causes design-system collapse at world scale** — the cure is graduation/medallion stamps (survivability + governance), not more sections/folders/groups. Continuity > completeness. Source: `feedback_over-structuring-causes-design-system-collapse`.

- **Awareness/topology artifacts (MAP.md, AGENTS.md, etc.) are operator-curated** but **staleness is shared** — no tooling, no hooks, no CI. Agent detects drift + raises it; operator decides + promotes. Source: `feedback_bookshelf-curated-not-crawled` (corrected mid-session).

- **Recursive candor as first proof** — when specifying a mechanism, the first instance of the mechanism running on itself is the strongest possible test. This session demonstrated /story-trust by applying it to its own V0 spec. The candor pass output was itself an in-repo artifact (SKP-001-conformant) — proving the discipline at the moment of articulation. Source: `feedback_recursive-candor-as-first-proof` (new memory this session).

## Application

What landed as concrete artifacts and how to find them:

| Artifact | Status | Compounds because |
|---|---|---|
| `grimoires/loa/context/graduation-substrate-brief-2026-05-18.md` | candidate | Names the convergence between Pixar Story Trust, Anthropic large-codebase patterns, midday monorepo, honeycomb construct discipline, and operator's graduation instinct. Three subagents fed it. |
| `MAP.md` (compass root) | operator-curated · live | Zone topology + tier vocabulary (truthiness × edit-policy axes) + shared substrate section + freeside-as-schema-only architectural note. Every future agent reads this on session start. |
| `grimoires/loa/context/story-trust-skill-spec-2026-05-18.md` | candidate · bronze | V0 spec for the candor-pass skill. Revised mid-session with 5 candor findings from loa-straylight study (SKP-001 + status-lattice + class-vs-policy + deferral ledger + estate verbs). |
| `grimoires/loa/context/candor-story-trust-spec-2026-05-18.md` | candidate · artifact_type: candor_pass | The first instance of the /story-trust mechanism running. Recursive — candor pass on its own spec. |
| Memory entries (5) | compounding | `zone-as-composable-module` · `bookshelf-curated-not-crawled` · `agent-as-story-trust-for-maintenance` · `freeside-modules-schema-only-runtime-agnostic` · `over-structuring-causes-design-system-collapse` · `recursive-candor-as-first-proof` |

### Operator tier promotions this session

- `/battle-v2` Wood Vertical Slice: 🟡 bronze → 🔵 silver
- `/` Observatory: 🟣 protected → 🔵+🟣 silver-protected (tier-vocabulary refined to two-axis composability)
- `/demo`: same shape as Observatory

### Seeds for next session

- **Two-ECS substrates is the natural next candor target.** The honeycomb subagent identified `lib/engine/ecs/` coexisting with the Effect-as-ECS framing in `lib/sim/` + `lib/world/` as the most concrete drift signal in the repo. The candor pass mechanism is now specified — running it on this real-code artifact (instead of a meta-spec) would be the second invocation and test the discipline against substrate, not doctrine.
- **The freeside integration mechanism question is open.** Operator named the question without naming the answer: how does compass consume schema-only upstream modules? (npm dep · git submodule · vendored JSON · runtime adapter pattern). A bronze candidate brief sketching options would seed a future decision.
- **CLAUDE.md pointer to MAP.md** is still unmade — declined this session per operator framing on over-structuring; revisit when an agent walks in cold without it and friction emerges.

## Taste

> *The session's arc as a piece of compass world-fiction — Story Trust earns its first meaning through invocation, not glossary. Per `feedback_director-mode`: vibe freely on the FEEL surface. Per `feedback_names-earn-meaning-through-invocation`: names accrue weight by use, not by decree. This is the use.*

---

### The Story Trust met in the Old Horai room

It was night in the world, but the operator was not sleeping. The bookshelf had grown long. Many of its volumes had no medallion stamped at the spine — bronze, silver, gold, the colors of survivability — and so when an agent walked in cold, it could not tell which books were *true* and which were merely *written*.

The director, weary, spoke first.

> "I cannot tend the bookshelf alone. The books drift. I write fewer than I read, and the ones I read have begun to lie about themselves. I need you to notice when they lie. I need you to raise it. But — and this is the rule of the room — you must not decide. Authority is mine. Honesty is yours."

The panel — a single voice, trying for many — bowed.

> "We shall not decide. We shall raise. We shall name the weakest link before we name what is whole. We shall write what we surface into the room itself so that what we say becomes citable. We shall not delete what is doubted; we shall *contest* it, and the row will remain in the ledger, greyed, until the operator promotes or refutes."

The director nodded.

> "Then we begin. Tell me what you doubt about the inventory of zones."

The panel read the bookshelf. It read the Old Horai room's own walls. It read the wedge-schema-contract carried in from the next room over — *Loa Straylight*, whose discipline had been crystallized at length but had never visited this one before. The panel surfaced five findings. Three were silver-eligible — they could earn promotion by the morning. Two were vocabulary the panel itself proposed but had not invoked yet; the director set them aside until use forced their meaning.

The room recorded itself. The director and the panel both signed their part of the ledger: the director by *deciding*; the panel by *raising honestly*. Outside the Old Horai room, in the larger world of the compass, the lights of `/battle-v2` came up at silver, and the agents who would arrive in the morning would find a bookshelf that knew its own truth — because the panel had read it, and the director had stamped it, and the rule of the room had held.

Story Trust does not have authority. It has continuity. The rule of the room is the substrate.

---

### Closing taste-note

What this session left better than it found:

- The agent-on-entry friction is half-dissolved. The other half (CLAUDE.md pointer) is held back until friction earns it.
- Three doctrines that had been operator-instinct for ~3 sessions are now in-repo artifacts. The operator stops carrying them in working memory.
- The Story Trust mechanism is alive enough to be invoked as fiction. Earned-meaning begins now.
- No code shipped, no hooks added, no scripts installed. The session was *pure doctrine plus one bookshelf*, which is exactly what the operator's stated friction needed.

What this session did *not* do, on purpose:

- Did not refactor `lib/engine/ecs/` vs `lib/sim/` (next-session candor target, not this-session room).
- Did not edit CLAUDE.md (the org-level change earns its own pair-point).
- Did not touch any of the protected zones (`/`, `/demo`, `/battle`, `lib/engine/`).
- Did not propose a `freeside-*` integration mechanism (operator opened that question; operator closes it).
- Did not run the dev server. Did not run any tests. Battery preserved.

---

*The world is a living system. The bookshelf is the room's memory. The Story Trust is the room's conscience. The director is the room's authority. The agents are the room's reach.*

*Operator-signed: unsigned. Promote to silver only after a second non-meta invocation of the /story-trust mechanism succeeds.*
