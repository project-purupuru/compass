# Codex Skeptic Review — Purupuru Cycle 1 PRD
> Fallback review because flatline-orchestrator.sh is broken in this repo (issue #774 PROVIDER_DISCONNECT class).
> Reviewer voice: GPT-5/Codex via codex CLI.
> Document: grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/prd.md (413 lines, r0)
> Date: 2026-05-13

## BLOCKERS (severity >= 750)

**SKP-BLOCKER-001 — The PRD requires a 12-beat sequence, but the harness sequence has 11 beats.**

- PRD line ref: `prd.md:27`, `prd.md:130`, `prd.md:185`, `prd.md:333`
- Grounding source: `sequence.wood_activation.yaml:30`, `:38`, `:48`, `:63`, `:71`, `:82`, `:91`, `:100`, `:109`, `:120`, `:129`
- Problem: The PRD repeatedly gates the slice on "all 12 beats" and names a "12-beat sequence"; FR-17 then enumerates only 11 beats. The actual harness YAML also contains 11 `beats[]` entries: `lock_input`, `card_anticipation`, `launch_petal_arc`, `play_launch_audio`, `impact_seedling`, `start_local_sakura_weather`, `activate_focus_ring`, `kaori_gesture`, `daemon_reaction`, `reward_preview`, `unlock_input`. A sprint-plan test based on PRD AC-8 will fail if it expects 12, or silently diverge if the implementer decides the harness is canonical.
- Remediation: Before SDD, choose one source of truth. Either change PRD "12" to "11" everywhere and make AC-8 assert the 11 harness beats, or add the missing 12th beat to the harness-derived sequence and name it explicitly in FR-17.

**SKP-BLOCKER-002 — The resolver acceptance stream omits the event required to start presentation.**

- PRD line ref: `prd.md:88`, `prd.md:129`, `prd.md:184`, `prd.md:204`
- Grounding source: `sequence.wood_activation.yaml:5-7`; `contracts/purupuru.contracts.ts:151-166`; `card.wood_awakening.yaml:35-53`
- Problem: G5/AC-7 require the deterministic resolver sequence to be exactly `ZoneActivated -> ZoneEventStarted -> RewardGranted`. But FR-16 says the sequencer starts on `CardCommitted`, and the sequence YAML declares trigger events `CardCommitted` and `ZoneActivated`. `CardCommitted` exists in the TypeScript contract, but the card YAML resolver steps only emit `ZoneActivated`, `ZoneEventStarted`, and `RewardGranted`. As written, the core demo can pass AC-7 while never emitting the event FR-16 needs to launch the presentation sequence.
- Remediation: Define the full semantic event contract for one play, including whether `CardCommitted` is emitted by UI command acceptance, resolver, or command queue. Update AC-7 to assert the complete stream, not only the three resolver-step emissions, or update FR-16 to trigger from `ZoneActivated` only.

**SKP-BLOCKER-003 — The five-zone world-map requirement is not backed by five zone definitions.**

- PRD line ref: `prd.md:67`, `prd.md:87`, `prd.md:123-124`, `prd.md:132`, `prd.md:193`
- Grounding source: `zone.wood_grove.yaml:1-21`; harness README `README.md:722-733`; harness file list shows only `examples/zone.wood_grove.yaml`
- Problem: The PRD says `zone.wood_grove.yaml` declares 5 zones around Sora Tower, but the file defines only `wood_grove` plus graph neighbors `sora_tower` and `water_harbor`. The README vertical-slice gate does require five zones, but the worked examples only provide one zone YAML. That leaves S4 with an unstated choice: hardcode four non-validated visual placeholders, invent four new zone content files, or reduce the surface to one real zone. All three change the sprint graph and acceptance semantics.
- Remediation: Add an explicit S1 deliverable for four placeholder zone YAMLs, or rewrite AC-10/FR-20 to say "one schema-backed wood_grove plus four decorative locked placeholders." If placeholders are allowed, mark their non-gameplay status and exclude them from resolver/content validation.

**SKP-BLOCKER-004 — Cycle-1 CardStack integration is type-incompatible with harness cards.**

- PRD line ref: `prd.md:23`, `prd.md:110`, `prd.md:194`, `prd.md:397`
- Grounding source: `lib/cards/layers/types.ts:15`, `:30-40`, `:91-101`; `lib/cards/layers/CardStack.tsx:32-44`; `card.schema.json:115-124`; `card.wood_awakening.yaml:6-7`
- Problem: FR-21 requires `CardHandFan` to use existing `<CardStack>` in cycle 1. Existing `CardStack` takes `cardType` from `lib/honeycomb/cards`, whose layer mapping expects `jani`, `caretaker_a`, `caretaker_b`, or `transcendence`. The harness card schema uses `activation`, `modifier`, `daemon`, `ritual`, `tool`, and `event`; `card.wood_awakening.yaml` is `cardType: activation`. The PRD also says `art_anchor` binding to `lib/cards/layers/` is cycle 2, which contradicts using CardStack as the cycle-1 hand primitive without an adapter.
- Remediation: Add a cycle-1 adapter contract, e.g. `harnessCardToLayerInput(card): { element, cardType, rarity }`, with a deliberate mapping for `activation`. Or defer CardStack usage and render a harness-native placeholder card face in S4.

## HIGH-SEVERITY (500-749)

**SKP-HIGH-001 — `SemanticEvent` count and contents are falsified/ambiguous.**

- PRD line ref: `prd.md:160`
- Grounding source: harness README `README.md:410-433`; `contracts/purupuru.contracts.ts:151-166`
- Problem: FR-2 says `SemanticEvent` union has "18 event types per harness §9." The README recommends 20 event names, while `contracts.ts` defines 15 union members. The missing/extra names are not harmless: README includes `CardConsumed`, `ZoneBecameValidTarget`, `ZonePreviewed`, `DaemonRoutineChanged`, and `TurnEnded`; `contracts.ts` does not. Sprint 1 cannot hand-author a correct union without choosing whether README §9 or contracts.ts is canonical.
- Remediation: In the PRD, replace "18 event types" with a concrete table of the event union for cycle 1 and a source-of-truth decision. If contracts.ts wins, explicitly mark README-only events as deferred.

**SKP-HIGH-002 — The PRD treats `contracts.ts` as canonical runtime TypeScript, but the file says it is pseudocode/sketch.**

- PRD line ref: `prd.md:38`, `prd.md:160`, `prd.md:413`
- Grounding source: `contracts/purupuru.contracts.ts:1-6`; harness README `README.md:381-395`
- Problem: The PRD calls the contracts file canonical TypeScript and requires hand-authoring types from it, but the file header says it is engine-agnostic TypeScript-style pseudocode that describes boundaries, not a runtime mandate. The README calls it a "TypeScript interface sketch." This matters because the JSON schemas/examples and TS sketch already diverge: TS has `resolverSteps`, while schema/YAML use `resolver.steps`.
- Remediation: Name the JSON schemas as canonical for persisted content shape, and the TS sketch as advisory for runtime boundaries. Add a mapper/normalizer requirement for `resolver.steps -> resolverSteps` if the runtime type chooses camelCase.

**SKP-HIGH-003 — Telemetry is over-specified in PRD but underspecified in the harness.**

- PRD line ref: `prd.md:94`, `prd.md:135`, `prd.md:204`, `prd.md:357`, `prd.md:399`
- Grounding source: `telemetry.card_activation_clarity.yaml:1-38`; build doc `arch-enhance-purupuru-cycle-1-wood-vertical.md:344`
- Problem: The PRD says telemetry fires four event types at beat offsets: `CardCommitted`, `ZoneActivated`, `RewardGranted`, `InputUnlocked`. The harness telemetry example defines one telemetry event, `CardActivationClarity`, with aggregate properties such as `timeFromCardArmedToCommitMs`, `invalidTargetHoverCount`, `sequenceSkipped`, and `inputLockDurationMs`; it does not define four telemetry event types. The build doc leaves telemetry destination open, but the PRD both commits to JSONL and asks Q-SDD-5 to choose the cycle-1 destination.
- Remediation: Change FR-26/AC-13 to either emit one `CardActivationClarity` record populated from semantic events, or define four explicit telemetry records outside the harness example. Resolve Q-SDD-5 before sprint-plan if telemetry remains in S5.

**SKP-HIGH-004 — The S5 gate text repeats sprint-4 review/audit, so the final sprint can appear ungated.**

- PRD line ref: `prd.md:347-353`
- Grounding source: build doc `arch-enhance-purupuru-cycle-1-wood-vertical.md:258-264`, `:309-313`; PRD global gate claim `prd.md:25`
- Problem: The PRD says every sprint independently passes review/audit, but the S5 sprint graph says `/review-sprint sprint-4 + /audit-sprint sprint-4 gate the cycle`. The build doc contains the same typo. This is not cosmetic in a Loa cycle: it gives the next agent contradictory instructions at the final gate.
- Remediation: Change both PRD and build doc references to `/review-sprint sprint-5` and `/audit-sprint sprint-5`, or state that S5 has a different gate shape and why.

**SKP-HIGH-005 — Anchor-binding acceptance claims more than the sequence declares.**

- PRD line ref: `prd.md:130`, `prd.md:183-185`, `prd.md:334`
- Grounding source: `sequence.wood_activation.yaml:22-28`, `:100-128`
- Problem: AC-8 and FR-17 require all beats to bind to declared anchors with 100% success. The sequence declares five `requiredAnchors`, but several beats target non-anchor identifiers such as `actor.kaori_chibi`, `daemon.wood_puruhani_primary`, and `ui.reward_preview`. Some beats have `requiresAnchors`; others do not. A 100% "anchor-binding" test is therefore ill-defined unless the SDD distinguishes anchors, actors, UI targets, VFX targets, and semantic presentation targets.
- Remediation: Replace "all beats bind anchors" with a per-target contract: anchor-required beats must resolve anchors; actor/UI/audio beats must resolve through separate registries or be validated as non-anchor presentation targets.

## MEDIUM-SEVERITY (300-499)

**SKP-MEDIUM-001 — The rAF accuracy rationale is technically too strong.**

- PRD line ref: `prd.md:42`, `prd.md:130`, `prd.md:247-249`
- Grounding source: build doc `arch-enhance-purupuru-cycle-1-wood-vertical.md:170-178`; harness README `README.md:456-468`
- Problem: D6 says `requestAnimationFrame` gives `<2ms` drift and is required for sub-frame accuracy. The acceptance metric later uses ±16ms, which is a single-frame tolerance at 60Hz and is the realistic bar. The harness requires declared beat timing and an end-state lock policy; it does not require rAF or sub-frame timing.
- Remediation: Keep rAF if desired, but change the rationale to frame-aligned scheduling with ±16ms tolerance. Test with fake timers or an injectable clock, not wall-clock rAF in Vitest.

**SKP-MEDIUM-002 — Vendoring the pack manifest verbatim will preserve stale `examples/` paths.**

- PRD line ref: `prd.md:45`, `prd.md:162`, `prd.md:274-275`
- Grounding source: `pack.core_wood_demo.yaml:22-43`
- Problem: The PRD says YAML examples are vendored into `lib/purupuru/content/wood/` and "match harness worked examples verbatim." The pack manifest references `examples/*.yaml` paths. If copied verbatim, the manifest will validate structurally but point to the wrong runtime location.
- Remediation: Either rewrite manifest paths during vendoring, or explicitly treat the manifest as provenance-only in cycle 1 and have the loader discover colocated YAMLs.

**SKP-MEDIUM-003 — Dependency deltas are stale against the actual package.**

- PRD line ref: `prd.md:223-226`, `prd.md:164`
- Grounding source: `package.json` current scripts/dependencies read during review
- Problem: The PRD lists `ajv` as a new Sprint 1 dependency, but the current package already has `ajv` in dependencies. `ajv-formats` and `js-yaml` are absent. There is also no `content:validate` script yet. This will not block architecture, but it will create noisy sprint diffs and review comments if the implementer follows the PRD mechanically.
- Remediation: Change FR-6 to "add missing `ajv-formats` and `js-yaml`; keep existing `ajv`; add `content:validate` script."

**SKP-MEDIUM-004 — Harness design-lint governance is named but not gated.**

- PRD line ref: `prd.md:160`, `prd.md:123-140`
- Grounding source: harness README `README.md:586-604`; `contracts/purupuru.contracts.ts:287-307`
- Problem: The harness has validation layers beyond schema validation, including design lint examples for Wood verbs, localized weather scope, input unlocks, undefined zone tags, and locked resolver ops. The PRD includes `DesignLintResult` in the type list but has no FR/AC requiring lints to run. Schema validation alone will not catch several harness-level invalid patterns.
- Remediation: Add a narrow S1/S2 lint check for the wood demo pack: Wood card has Wood verbs, localized weather is target-zone-only, input lock ends in unlock/fallback, no undefined zone tags, and no locked resolver ops.

**SKP-MEDIUM-005 — Operator memory/doctrine claims are not grounded in the requested source set.**

- PRD line ref: `prd.md:74`, `prd.md:148`, `prd.md:380-384`
- Grounding source: no provided grounding file directly verifies these memory anchors
- Problem: The PRD uses memory anchors such as `[[purupuru-world-org-shape]]`, `[[purupuru-daemon-deferral]]`, and Eileen validation. The current review did not read a doctrine activation receipt or source file for those claims. Under the project instructions, memory is not truth by default. These lines are acceptable as background if explicitly labeled, but they should not drive requirements.
- Remediation: Mark these as background-only, or add an activation/source receipt in the planning artifact before they become load-bearing.

## SCOPE / FRAMING CHALLENGES

1. **SPECULATIVE — The 5-sprint graph may be too compressed for this much contract repair.** The predecessor PRD added an S0 calibration spike after Flatline because the plan had too many unknowns (`card-game-in-compass-2026-05-12/prd.md:42-44`, `:276-287`, `:289-333`). This PRD has greenfield schemas, content loading, runtime, presentation sequencer, a new route, telemetry, docs, and 18 ACs, but no calibration sprint. The actual review found several source-of-truth mismatches before implementation starts.

2. **D1 is directionally reasonable, but it is doing too much rhetorical work.** Greenfield `lib/purupuru/` is a good isolation move, but the route still depends on existing `CardStack`, registry shape, OKLCH globals, and kit navigation. The PRD should stop saying "zero risk to existing code" and say "low blast radius with named integration seams."

3. **D11 does not hold for telemetry.** The PRD says all five §13 questions are deferred to SDD and do not block sprint authoring, but Q-SDD-5 asks the telemetry destination for cycle 1 while FR-26/AC-13 already commit to JSONL. Either make JSONL a PRD decision or leave telemetry out of the sprint graph until SDD resolves it.

4. **The "data-first" claim is stronger than the actual Wood slice content.** One card, one zone, one event, and one sequence can prove the pipe. They do not prove the five-zone world-map grammar unless four more zone definitions or explicit placeholder rules are added.

5. **FRs do not cleanly map to the de-scope ladder.** Telemetry is first to drop, but AC-13 remains an acceptance metric. Reward preview can drop, but it is one of the named beats inside the sequence acceptance. The sprint plan needs conditional AC language for de-scoped items.

## GROUNDING AUDIT

- **Verified:** The core craft target quote exists in the harness README at `README.md:11-13`; PRD `prd.md:56-58` quotes it accurately.
- **Verified:** The build doc supports the main architecture direction: greenfield `lib/purupuru/`, hand-authored types, AJV validation, pure resolver, tiny event bus, sequence player, `/battle-v2`, no Three.js, and YAML content (`arch-enhance...md:51-64`).
- **Verified with caveat:** The harness directory has 8 schema files and 8 YAML examples on disk. The README package map lists schemas correctly (`README.md:864-888`) but omits `telemetry.card_activation_clarity.yaml` from the examples map even though the file exists.
- **Falsified:** "12-beat sequence" is not grounded. The actual `sequence.wood_activation.yaml` has 11 beats.
- **Falsified:** `zone.wood_grove.yaml` does not declare 5 zones around Sora Tower. It declares one `wood_grove` zone and two graph neighbors.
- **Falsified/paraphrased too loosely:** "SemanticEvent union (18 event types per harness §9)" is not grounded. README §9 lists 20 recommended names; `contracts.ts` defines 15.
- **Paraphrased too strongly:** Calling `contracts.ts` "canonical TypeScript" overstates the source. Its own header says it is engine-agnostic pseudocode/sketch.
- **Paraphrased too loosely:** Telemetry "events fire at CardCommitted / ZoneActivated / RewardGranted / InputUnlocked" does not match the telemetry YAML, which defines one aggregate `CardActivationClarity` event and properties.
- **Carried-forward build-doc bug:** The S5 gate typo (`sprint-4` review/audit under Sprint 5) exists in both the build doc and the PRD, so it should be fixed at the source rather than treated as PRD-only noise.

## OVERALL VERDICT

**BLOCK.** The direction is coherent, but the PRD is not ready for `/architect` because several acceptance criteria are currently impossible or ambiguous against the harness: 12 vs 11 beats, missing `CardCommitted` in the resolver acceptance stream, one zone definition vs a five-zone route, and incompatible harness card types vs existing `CardStack`. Fix those source-of-truth mismatches first, then rerun a smaller skeptic pass before SDD.
