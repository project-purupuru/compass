# MAP.md — Compass Zone Topology

> **Operator-curated, agents read-and-raise.** Read this on session start *before* opening code. Knowing the zone topology + tier stamps + protected boundaries first orients the entire session.
>
> **Staleness is shared responsibility.** Agents *detect* drift and *raise* it; the operator *decides* and *promotes*. No auto-generation. No CI hooks. No tooling. The agent's candor pass is the maintenance mechanism — the same mechanism as tier promotion (see `graduation-substrate-brief-2026-05-18.md` §5 thread 1 · Pixar Story Trust). When an agent walks in cold and the inventory looks stale, the agent surfaces it. The operator should never have to track this file while in flow.

---

## What is a zone?

A **zone** is a composable world-module. Zones are *not* routes; routes are *presentations* of zones. The same zone can be remounted on new routes as the world grows. Multiple routes can present the same zone.

Every zone owns four things:

| | what | example |
|---|---|---|
| 1 · **Substrate** | the `lib/*` modules it lives on (ports / live / mock / schemas / systems) | The Tide → `lib/honeycomb/{battle,clash,match}` + `lib/cards` + `lib/purupuru` |
| 2 · **Content** | the data pack(s) it consumes | Wood Slice → `lib/purupuru/content/wood/` |
| 3 · **Presentation** | one or more `app/*` routes that mount it | Wood Slice → `/battle-v2` (today; route may move) |
| 4 · **Tier-stamp** | its current truthiness/promotion state | bronze / silver / gold / protected / sandbox / refuted |

Zones compose. A "Game Store" zone in the future presents many smaller zones (catalog tiles for The Tide, future games, freeside modules). An "Observatory" zone presents world-state from many zones at once.

---

## The pattern (zone-as-composable-module)

This pattern is the bridge between operator vision and agent execution. It is drawn from:

- `~/vault/wiki/concepts/freeside-modules-as-installables.md` — sealed schemas + typed ports
- `~/vault/wiki/concepts/engine-and-product-split.md` — substrate is open and minimal; product is curated and sellable
- `~/vault/wiki/concepts/agentic-game-infrastructure.md` — 7-component substrate (reality + contracts + schemas + state machines + events + hashes + tests)
- `~/vault/wiki/concepts/agent-first-web-game-engine-thesis.md` — the editor IS the app; the engine outlives any single world
- `~/vault/wiki/concepts/purupuru-world-vs-the-game.md` — the world (TTRPG-shaped) contains games (ruled activities)

### The five rules of zone composition

1. **Zones are route-agnostic.** A zone owns its substrate and content. Routes mount zones; zones don't own routes. When a zone moves to a new route, the substrate doesn't change.
2. **Zones own their substrate explicitly.** Every zone declares which `lib/*` modules it depends on. Cross-zone substrate sharing is allowed (multiple zones consume `lib/cards`); cross-zone *coupling* is not (one zone reaching into another zone's content pack).
3. **Tier-stamps reflect operator-promoted truthiness, not aspiration.** A zone is bronze until the operator says otherwise. Auto-promotion is forbidden.
4. **Protected boundaries are inviolable.** `lib/engine/`, post-hackathon-submission `/` + `/demo`, `.claude/` system zone — agents do not edit these without explicit per-session grant.
5. **Sandboxes are not zones in production world fabric.** VFX Lab, Motion Lab, HUD Preview, etc. are tools for tuning zones. They live under `app/<zone>/<lab>/` not at peer level. They mount the same substrate as the production zone they sandbox.

---

## Current zone inventory (DRAFT · operator-to-confirm)

> All tier-stamps below are **bronze (proposed)** until operator promotes. Editing this table is operator-only.

| Zone | Substrate (today) | Presentation (today) | Tier (proposed) |
|---|---|---|---|
| **Observatory** | `lib/celestial` + `lib/world/observatory.{port,live,mock}.ts` + `app/_components/observatory-example.tsx` | `/` (root) | 🔵+🟣 silver · protected (hackathon-submitted) |
| **Hackathon Demo** | composes Observatory + others | `/demo` | 🔵+🟣 silver · protected (hackathon-submitted) |
| **The Tide (original)** | `lib/cards` + `lib/honeycomb/{battle,clash,match,collection,opponent}` | `/battle` | 🔵 silver (preserved, paused) |
| **The Tide v2 / Wood Vertical Slice** | `lib/purupuru/content/wood` + `lib/purupuru/contracts/types` + `lib/world/awareness.*` + `lib/cards/layers` + `lib/honeycomb/{battle,clash}` | `/battle-v2` | 🔵 silver (operator-promoted 2026-05-18) |
| **VFX Lab** | `lib/vfx/*` + `app/battle-v2/vfx-lab/_components/vfx/*` (8 effects: tree-fall · water-splash · mini-scene · hex-scene · zone-scene · realm-scene · big-realm-scene · card-lab) | `/battle-v2/vfx-lab` | 🔶 sandbox |
| **HUD Preview** | `app/battle-v2/_components/hud/*` | `/battle-v2/hud-preview` | 🔶 sandbox |
| **Motion Lab** | `app/battle-v2/motion-lab/` | `/battle-v2/motion-lab` | 🔶 sandbox |
| **Puppet 3D** | `lib/honeycomb/grounding/*` (?) + `app/battle-v2/_components/puppet/*` + `public/art/{puruhani,jani,characters}/` | `/battle-v2/puppet-3d` | 🔶 sandbox |
| **World Preview** | `lib/world/*` + `app/battle-v2/world-preview/` | `/battle-v2/world-preview` | 🔶 sandbox |
| **Kit** | mixed | `/kit` (sub-routes: `/kit/ui-explorer`, etc.) | 🔶 sandbox |
| **Quiz** | adjacent | `/quiz` | 🟡 bronze (operator confirms) |
| **Today** | adjacent | `/today` | 🟡 bronze (operator confirms) |
| **Burn** | adjacent | `/burn` | 🟡 bronze (operator confirms) |
| **Preview** | adjacent | `/preview` | 🟡 bronze (operator confirms) |

### Future zones (vision · pre-bronze)

These are operator-named-but-not-built at the *zone* tier (substrate stubs may exist; see "Shared substrate" below). They join via the freeside-* installable pattern when their cycle lands:

| Zone (vision) | Composes with | Notes |
|---|---|---|
| **Freeside Auth** | `freeside-auth` installable (schema-only upstream) | wallet/account spine across all zones |
| **Freeside Activities** | `freeside-activities` installable (schema-only upstream) | per-zone activity tracking; `lib/activity/` is the local stub awaiting integration |
| **NowPayments Economy** | `freeside-payment` (or similar) installable | fiat/crypto economy bridge inside the world |
| **Freeside Mint** | `freeside-mint` installable (schema-only upstream) | minting flow inside the world; operator-referenced as useful |
| **Game Store** | catalog of zones; meta-zone | presents many smaller game zones (The Tide + future) |
| **Future games (N)** | one substrate (honeycomb) + per-game content packs | additive; same shape as Wood Slice |

## Shared substrate (cross-zone modules)

These `lib/*` modules are not zones themselves — they are reusable substrate that zones compose. Tier-stamps reflect *substrate maturity*, not zone-level promotion.

| Module | Purpose | Tier (proposed) |
|---|---|---|
| `lib/world/` | Canonical port/live/mock + state-ownership matrix (awareness · invocation · observatory) + `world.system.ts` + SKILL.md | 🔵 silver (cycle-2 worked-example; gold-standard for new modules) |
| `lib/honeycomb/` | Effect-port substrate for battle/clash/match/collection/opponent (cycle-1 ECS≡Effect surface; 15 port/live/mock files colocated) | 🔵 silver |
| `lib/cards/` | Layer registry (face × element × rarity × reveal); 429-test coverage | 🔵 silver |
| `lib/runtime/` | The ONE `ManagedRuntime.make(` composition root | 🔵 silver |
| `lib/sim/` | Population system + per-frame ECS pipelines (`population.{port,live,mock,system}.ts`) | 🟡 bronze |
| `lib/purupuru/` | Cycle-1 content pack + contracts/types + loader (greenfield) | 🔵 silver |
| `lib/celestial/` | Cosmic weather / sky systems for Observatory | 🟡 bronze |
| `lib/vfx/` · `lib/scene/` · `lib/juice/` · `lib/choreography/` | Visual + motion primitives across zones | 🟡 bronze (port/live/mock discipline not yet applied) |
| `lib/registry/` | Cross-module typed registry | 🟡 bronze |
| `lib/activity/` | **Stub awaiting freeside-activities upstream.** Has port/live/mock + radar-source locally; not yet bound to upstream schemas. | 🟡 bronze (stub) |
| `lib/score/` | **Stub awaiting freeside-score upstream.** Thin index/mock/types only. | 🟡 bronze (stub) |
| `lib/engine/` | Operator lane — agentic ECS work, edit-locked | 🟣 protected (truthiness deferred to operator) |

### Freeside modules are schema-only (operator-named 2026-05-18)

Freeside modules (`freeside-activities`, `freeside-score`, `freeside-mint`, etc.) are **schemas + contracts + state machines, NOT runtime**. They are deliberately runtime-agnostic for flexibility. Compass implements the runtime against the upstream schemas. The integration mechanism is **not yet figured out** — it's an open zone-as-composable-module question that the operator is willing to spend rigorous upfront effort to resolve.

Upstream references:
- https://github.com/0xHoneyJar/freeside-activities — schema-only
- https://github.com/0xHoneyJar/freeside-score — schema-only
- https://github.com/0xHoneyJar/freeside-mint — schema-only (operator-referenced as useful)

This pattern echoes the [[engine-and-product-split]] doctrine at the freeside altitude: schemas + contracts in the open substrate, runtime implementations in each consumer.

---

## How to add a new zone (recipe)

1. **Decide substrate.** Reuse existing `lib/*` modules where possible; only add new ones when no existing module covers the responsibility. The honeycomb construct's four-folder pattern (`domain` · `ports` · `live` · `mock`) is the canonical shape — follow it.
2. **Decide content shape.** If the zone has a content pack, place it under `lib/<namespace>/content/<pack-name>/`. Schema-validate via the existing harness (vendored upstream schemas + AJV).
3. **Stamp the zone bronze.** Add a row to the inventory table above. Bronze means "exists, not operator-promoted yet."
4. **Mount a presentation.** Add `app/<route>/` (route can move later). Page should be thin — load content server-side, hand to client component, no game state in components (per memory `feedback_substrate-not-ui-islands`).
5. **Optional: per-zone CLAUDE.md** in the relevant `lib/<zone>/` folder. Layered-CLAUDE.md pattern per Anthropic large-codebase doctrine. Keep it lean.
6. **Operator-promotes the tier** when (a) substrate is stable, (b) content passes operator candor pass, (c) presentation matches taste direction.

### When NOT to add a new zone

- For a tuning sandbox → not a zone; add as `app/<parent-zone>/<lab-name>/` instead. Sandboxes do not get tier-stamps.
- For a one-off experiment → not a zone; live in `grimoires/loa/distillations/` or `app/_experiments/` (if needed).
- For an alternate presentation of an existing zone → not a new zone; add a new route that mounts the existing substrate.

---

## Protected boundaries

Agents do **not** edit these without explicit per-session grant from the operator.

| Path | Reason |
|---|---|
| `lib/engine/` | Operator lane — agentic ECS work; operator-controlled |
| `app/page.tsx` + `app/(root)/*` | Hackathon-submitted Observatory zone |
| `app/demo/` | Hackathon-submitted Demo zone |
| `.claude/` | Loa system zone (per `.claude/rules/zone-system.md`); never edit, use `.claude/overrides/` |
| `public/_archive/` | Historical artifacts; reference only |
| `MAP.md` (this file) | **Operator-curated**; agents read-and-raise (detect drift, surface to operator, never silently edit) |

---

## Tier vocabulary

The tier-stamp is **user-truth backpressure**, not quality rank. Per `feedback_graduation-as-user-truth-backpressure`: the tier reflects how anchored the zone is to validated operator truth, not how polished it looks.

| Tier | Meaning |
|---|---|
| 🟢 **gold** | Operator-promoted as canonical. Substrate is stable, content is taste-locked, presentation matches direction. Mutation requires deliberate operator authorization. |
| 🔵 **silver** | Operator-confirmed and in active use. Tuning and refinement allowed. Tier rises to gold when the zone has been on operator-promoted ground for at least one full cycle. |
| 🟡 **bronze** | Exists, not yet operator-confirmed. Substrate may still drift. Agent-edits allowed within scope, but agent should not promote work that depends on this zone past bronze without operator pair-point. |
| 🟣 **protected** | Out of agent edit scope. Hackathon-submitted artifacts, operator lanes, system zones. Read-only for agents. |
| 🔶 **sandbox** | Labs and previews. Tuning surface for one or more zones; not part of production world fabric. Agent-edits allowed; not promoted into world fabric without operator decision. |
| ⚫ **refuted** | Explicitly removed from the world. Kept as reference. Do not extend, restore, or compose into new zones without operator review. |

### Tier-stamps compose along two orthogonal axes

Stamps capture two questions; one zone can carry both:

1. **Truthiness** — how operator-validated is this? (🟡 bronze · 🔵 silver · 🟢 gold · ⚫ refuted)
2. **Edit-policy** — what can agents do here? (open by default · 🟣 protected · 🔶 sandbox)

A zone or substrate module can carry one stamp from each axis. Example: 🔵+🟣 means "silver-truthiness, protected-edit-policy" (e.g. the `/` Observatory zone — operator-confirmed AND hackathon-locked). Refuted overrides edit-policy (don't extend the dead).

### Promotion mechanics

Tier promotion is operator-only. Agents may *propose* promotion via Pixar-Story-Trust-style candor pass (see `grimoires/loa/context/graduation-substrate-brief-2026-05-18.md` §5 thread 1). Until operator promotes, the tier-stamp does not change. Same mechanism applies to drift detection: agent raises, operator decides.

---

## How agents read this file (and raise drift)

On session start, before opening any code file:

1. Read `MAP.md` (this file) first.
2. Note which zone(s) the operator's prompt likely touches.
3. Note tier-stamps and protected boundaries.
4. Read `CLAUDE.md` next for prescriptive rules.
5. Read per-zone `lib/<zone>/CLAUDE.md` or `SKILL.md` if present (layered convention).
6. Only then open code.

If the operator's intent touches a 🟣 protected zone, surface the constraint *before* proposing changes. If the operator's intent touches a 🟡 bronze zone, flag that the zone is not yet operator-promoted and ask if a candor pass is wanted before extending.

### Agent-raised drift awareness

Staleness is shared responsibility. If, while orienting on this file, an agent notices ANY of the following — surface it briefly to the operator and propose the smallest possible fix. Do NOT silently edit this file.

- A zone listed here no longer exists in the codebase (or has moved substrate)
- A new zone exists in the codebase but is not listed here
- A protected boundary listed here no longer matches the actual repo state
- A tier-stamp that was bronze has been operator-promoted in conversation but not yet stamped here
- A "Future zones (vision)" entry has graduated to actual scaffolded substrate
- A `see also` reference is broken (file moved, renamed, or deleted)

The agent's role is the **candor pass**: detect, raise, propose. The operator decides and promotes. Same mechanism as Pixar Story Trust applied to artifact maintenance, not just artifact graduation.

---

## Open questions / operator input needed

These are bronze guesses that need operator confirmation:

- [ ] Confirm the **current zone inventory** above. Is anything missing? Is anything mis-classified?
- [ ] Confirm **tier-stamps**. Should The Tide (original `/battle`) really be silver, or has it dropped to bronze? Should the Wood Vertical Slice rise to silver yet?
- [ ] Confirm **protected boundaries**. Is `lib/engine/` still the operator lane (yes per memory but worth verifying)? Are `/`, `/demo`, `/battle-v2` framing correct?
- [ ] Confirm **future-zone naming**. Is "Game Store" the right name for the meta-zone catalog?
- [ ] Decide whether **`CLAUDE.md` should add a pointer** to this file ("On session start, agents read MAP.md first"). One-line addition.

---

## See also

- `grimoires/loa/context/graduation-substrate-brief-2026-05-18.md` — this file's pre-rationale (the studio brief that argued for the bookshelf primitive)
- `~/vault/wiki/concepts/freeside-modules-as-installables.md` — the installable-module doctrine zones inherit
- `~/vault/wiki/concepts/engine-and-product-split.md` — why substrate is open and product is curated
- `~/vault/wiki/concepts/agentic-game-infrastructure.md` — the 7-component substrate zones live on
- `~/vault/wiki/concepts/agent-first-web-game-engine-thesis.md` — the engine outlives any single world
- `~/vault/wiki/concepts/purupuru-world-vs-the-game.md` — the world contains games; The Tide is one zone among many
- `grimoires/loa/distillations/session-13-grounding-envelope-collapse-2026-05-16.md` — bronze/silver/gold ladder origin
- `~/.claude/projects/-Users-zksoju-Documents-GitHub-compass/memory/feedback_graduation-as-user-truth-backpressure.md` — tiers = user-truth backpressure, not quality rank
- `https://github.com/0xHoneyJar/loa-straylight` — memory architecture + ADRs · operator-recommended reference for continuity and survivability-based governance

---

*Compass is a living system. This file evolves with the world. Operator-curated, agent-read.*
