# Agent Working Memory (NOTES.md)

> This file persists agent context across sessions and compaction cycles.

## Active Sub-Goals

- Build live-observatory visualization layer for Solana Frontier hackathon (ship 2026-05-11)
- Mock the Score data layer through FE — no real backend wiring for hackathon

## Discovered Technical Debt

## Blockers & Dependencies

- Going Next.js + React + Tailwind 4 + Pixi.js v8 (vanilla, not @pixi/react). 3D path (react-three-fiber) is optional polish if time permits.

## Session Continuity
| Timestamp | Agent | Summary |
|-----------|-------|---------|
| 2026-05-07 | mounting-framework | Mounted Loa v0.6.0 on empty repo |
| 2026-05-07 | scaffold | Next.js 16.2.6 + React 19.2.4 + Tailwind 4 + Pixi 8.18.1 scaffold. Design system established in app/globals.css (OKLCH wuxing palette × 4 shades, light + Old Horai dark, per-element breathing rhythms, motion vocabulary keyframes, fluid typography scale, 5 brand font stacks). Local fonts (FOT-Yuruka Std, ZCOOL KuaiLe) via @font-face; Inter + Geist Mono via next/font/google. Brand wordmark + 5 puruhani PNGs + 5 jani sister PNGs + 30+ card-system SVG layers + tsuheji map + 18 Threlte material configs in /public. Score read-adapter contract + deterministic mock at lib/score. cn() utility at lib/utils. Build clean. Kit landing at app/page.tsx showcases brand wordmark, full typography (incl. JP/CN), wuxing roster, and jani sister roster. |
| 2026-05-07 PM | plan-and-analyze | PRD authored across 6 revisions (r1 strawman → r6 post-flatline-r3 · 941 lines · `grimoires/loa/prd.md`). Demo-frame locked: bazi-style archetype quiz (GET-chain · 1 signing prompt at mint) → archetype card → Solana Genesis Stone twin mint (devnet · Metaplex Token Metadata · visible NFT). Eileen's separation-as-moat doctrine = deck punchline. Three-view architecture: substrate (sonar/score/anchor) · operator surface (Score dashboard · zerker parallel) · member surface (Blinks · v0 ship). |
| 2026-05-07 PM | flatline-review (r1+r2+r3) | 3 rounds adversarial multi-model review (claude-opus-4-8 + gpt-5.4-codex + gemini-3.0-pro · subscription auth · $0 each · 147-190s). r1: 7 high-consensus + 9 blockers · r2: 17 high + 16 blockers · r3: 4 critical + 4 high. All findings integrated. Reviews preserved at `grimoires/loa/a2a/flatline/`. |
| 2026-05-07 PM | ride | Companion SDD authored at `grimoires/loa/sdd.md` (PRD untouched · canonical preserved). Reality reports + drift + consistency + governance + trajectory-audit at `grimoires/loa/{reality,drift-report,consistency-report,governance-report,trajectory-audit}.md`. Drift 1/10 · Consistency 8/10 (3 README-vs-PRD naming conflicts pre-zerker-merge · resolved by reset). |
| 2026-05-07 PM | butterfreezone-gen | Agent-grounded summary at `BUTTERFREEZONE.md` (898 words · Tier 1 · 13 pass / 1 fail / 2 warn). |
| 2026-05-07 PM | merge-resolution | TWO parallel scaffolds collided — zerker's f3c040d (this scaffold · Next.js+Pixi+brand assets · canonical) + my 61207a7 (PRD r6 + flatline reviews · pure additions). Reset to zerker · re-applied PRD work additively at `grimoires/loa/`. Did NOT overwrite zerker's CLAUDE.md, NOTES.md (this file), .gitignore, .loa-version.json, .loa.config.yaml, or any of his app/lib/public scaffolding. |
| 2026-05-09 | three-deliverables (adapted simstim) | Closed: (1) `grimoires/loa/learning/anchor-program-walkthrough.md` · pedagogical tour of `lib.rs` + Solana/Anchor primer (PDAs · CPI · sysvars · ed25519-via-instructions-sysvar pattern · Metaplex CreateV1 · runtime e2e flow). (2) `grimoires/loa/context/prd-gap-map.md` · FR-1..FR-12 + NFRs vs current state · 6 explicit drift items + 13-item critical-path punch list. (3) Zerker indexer issue filed at https://github.com/project-purupuru/purupuru-ttrpg/issues/5 · learning brief + spec hybrid · references reference TS implementation pattern. |
| 2026-05-09 | sprint-3 T1 close | Replaced `app/api/actions/mint/genesis-stone/route.ts` mock-memo path with real `claim_genesis_stone` integration via Anchor's typed TS client. New helpers: `lib/blink/anchor/{program,build-claim-tx,purupuru_anchor.idl.json,purupuru_anchor.types.ts}` · vendored IDL/types since `programs/**` is excluded from app tsconfig · `KeypairWallet` shim avoids ESM-broken `anchor.Wallet` import · `getPurupuruProgram` returns `Program<PurupuruAnchor>` for type-safe instruction encoding. Renderer threads validated answers into claim button URL (`renderQuizResult({answers, ...})`) so mint POST receives full URL state. Silent improvements baked in: `StoneClaimedSchema` exported from `@purupuru/peripheral-events` (Zerker indexer issue #5 unblocked) · `[mint-success]/[mint-error]` console logs throughout mint route. Next.js build passes · 79 + 23 + 24 = 126 tests green. NOT covered by T1: HMAC mac verify across routes (T2 scope · current parity with prior mock-memo path) · upgrade-authority freeze (operator-run · post-T2 + e2e devnet validation). |
| 2026-05-09 | sprint-3 T2 close (autonomous SHIP run) | HMAC mac verify wired end-to-end across `quiz/step` + `quiz/result` + `mint/genesis-stone`. Bumped `QuizStep` schema to `1..9` with `QUIZ_COMPLETED_STEP=9` sentinel · invariant `answers.length === step - 1` holds across full range. Renderer `signQuizState`s real macs at every button (was `PLACEHOLDER_MAC`) · accepts optional `hmacKey` config for test injection (env fallback for prod). Result endpoint threads validated mac into claim URL → mint route verifies same canonical state. Tampered URL → 400 with friendly "begin again" fallback. Added `lib/blink/env-check.ts` · single preflight at mint route that surfaces ALL missing env vars in one error (CLAIM_SIGNER_SECRET_BS58 · SPONSORED_PAYER_SECRET_BS58 · QUIZ_HMAC_KEY · KV_REST_API_URL · KV_REST_API_TOKEN) with actionable hints · never echoes values. `quiz/start` route wraps renderer in try/catch with friendly fallback action (handles missing QUIZ_HMAC_KEY gracefully). Next.js build clean · 80 + 23 + 24 = 127 tests pass (added 1 new test for step=9 acceptance · existing test asserting "step=9 throws" updated to "step=10 throws"). Operator note: any in-flight Vercel preview URLs with old PLACEHOLDER_MAC are now invalid · fresh deploy + fresh quiz start required. |
| 2026-05-09 PM | deployment split · zerker observatory + quiz Blink coexist | Discovered while running `/bridgebuilder-review` on PR #4: zerker merged `feature/observatory-v0` to main with ~100 commits of dashboard work (KPI cards · music · rails · weather UI) AND took the `purupuru-blink.vercel.app` canonical URL with their production deploy. Indexer pivoted to `project-purupuru/radar` repo (per main commit `06636c2`). Resolution: created NEW Vercel project `0xhoneyjar-s-team/purupuru-quiz` · canonical URL `https://purupuru-quiz.vercel.app` · `purupuru-blink.vercel.app` stays with zerker's observatory · operator wires DNS via `purupuru.world` later. Quiz Blink env vars (QUIZ_HMAC_KEY · NEXT_PUBLIC_APP_URL) set on new project · live verified · mint route still missing CLAIM_SIGNER_SECRET_BS58 + SPONSORED_PAYER_SECRET_BS58 + KV_REST_API_URL + KV_REST_API_TOKEN on new project (operator-paste). Issue #5 (purupuru-ttrpg) closed-as-superseded with redirect to radar repo. Issue #6 (purupuru-ttrpg) filed as v1 hardening backlog tracker for relevant bridgebuilder CRITICAL/HIGH findings (eval fixture markers · `.loa-version.json` migration · ESLint flat-config · adversarial-review out_of_scope routing · bedrock probe history · argv-safety race window). Bridgebuilder run cost ~$6-7 against operator's mcv-interface API key. |
| 2026-05-13 | sprint-plan (purupuru cycle 1) | Authored `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/sprint.md` (609 lines · 6 sprints · 38 tasks · ~4,300 LOC vs +4,500 cap). Faithful translation of PRD r1 (flatline-integrated · 441 lines) + SDD r0 (724 lines). All 10 PRD goals (G-1 through G-10) mapped to contributing tasks with per-goal validation matrix in Task 5.E2E. Per-sprint structure: S0 calibration spike (FR-0 · 0.5d · delete-after-spike) → S1 schemas+contracts+loader+design-lint (~900 LOC · AC-1/2/2a/3/3a/4) → S2 runtime+state-machines+resolver (~1100 LOC · AC-4/5/6/7/9/14/15) → S3 presentation+sequencer+11-beat (~700 LOC · AC-8/9/15) → S4 /battle-v2 surface+adapter+E2E (~1200 LOC · AC-10/11) → S5 integration+ONE-event-telemetry+docs+final-gate (~400 LOC · AC-12/13/16/17/18). Combined risk register (PRD R1-R11 + SDD-R1-R3) preserves all flatline-integrated mitigations. Audit feedback from prior sprint APPROVED · ledger NOT updated (purupuru cycle uses date-suffixed dir per D12 · ledger tracks Loa-internal cycles only). Beads DEGRADED (stale JSONL 38h) non-blocking. Trajectory at `grimoires/loa/a2a/trajectory/sprint-plan-2026-05-13.jsonl`. |
| 2026-05-11 | ride (post-shipped) | `/ride compass` against near-shipped state (110 commits since 2026-05-07 prior ride). Reality files regenerated (7-file token-optimized set · 7,180 / 8,500 budget): index, api-surface, types, interfaces, structure, entry-points, architecture-overview. PRD r6 + SDD r2 PRESERVED (ride does not overwrite operator-curated flatline-reviewed planning artifacts). Drift score 8.5/10 · 12 aligned · 1 stale (`.loa-version.json` says v1.116.1 but commit `0316560` updated framework to v1.130.0+649f8e4 · pin not bumped) · 1 hallucinated (README "127 unit tests" vs ~82 *.test.ts files) · 1 ghost (BLINK_DESCRIPTOR upstream PR deferred) · 1 missing (PRD §tl;dr says "3 v0 WorldEvent variants" but code has 4 with `QuizCompletedEvent` added in sprint-2). Consistency 8/10 · 5 BC flags (CLAIM_MESSAGE_SIGNED_BYTES=98 · `_tag` discriminator · Element literals · KV nonce key · CLAIM_SIGNER_PUBKEY hardcoded). HYGIENE FLAG · 4.2 GB of stale `.next.OLD-1778465846/` (1.1 GB) + `.next.OLD2-1778467960/` (3.1 GB) at root · operator should `rm -rf .next.OLD-*` and add `.next.OLD*` to .gitignore. Governance gaps: CHANGELOG.md at root contains LOA framework changelog not project · no semver tags · no project ADRs (only `ADR-001-cycle-099-model-registry.md` is Loa-internal). 11/11 ride artifacts persisted. Trajectory: `grimoires/loa/a2a/trajectory/riding-20260510.jsonl`. |

## Decision Log
| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-05-07 | 2D Pixi.js for main sim | 4-day clock; thousands of entities; 3D as optional polish | zerker |
| 2026-05-07 | Use Loa framework (trimmed path) | Discipline + scope control on tight clock | zerker |
| 2026-05-07 | Defer PRD to next session | Scope this session to scaffold only; user will run /plan separately for the actual implementation | zerker |
| 2026-05-07 | Skip shadcn init | Tailwind 4 setup differs; use cn() helper + copy individual primitives later as needed | claude (acked) |
| 2026-05-07 | Hackathon interview mode (minimal+batch) | Saves ~12 conversational rounds across /plan, /architect, /sprint-plan — wired in .loa.config.yaml | claude (acked) |
| 2026-05-07 PM | T1 NFT shape: Metaplex Token Metadata (visible) | Stone is on-chain artifact users SEE in Phantom collectibles; PDA-only loses "visible NFT" demo claim; cNFT adds Bubblegum complexity on 4d clock | operator |
| 2026-05-07 PM | T2 MVD spine-first model | flatline r1+r2+r3 critical finding (900-930 across rounds): trigger-tree fired too late; spine-first gates stretch goals on day-1 spine running end-to-end | operator + flatline |
| 2026-05-07 PM | T3 quiz chain via GET (not POST) | Solana Actions spec: POSTs require wallet signing; GETs don't. 5-step quiz via GET-chain = 1 signing prompt total (at final mint) instead of 6 | spec-resolved |
| 2026-05-07 PM | D-3 anchor program devnet locked v0 | Mainnet-beta unaudited on 4d clock = unacceptable risk per flatline r1 SKP-003 (820); deferred post-audit | operator + eileen + flatline |
| 2026-05-07 PM | D-12 anchor upgrade authority frozen post-deploy | flatline r2 SKP-005 (720): mutable upgrade auth during public hackathon = griefing/credential-theft risk; freeze (`set_authority(None)`) post-deploy | operator + flatline |
| 2026-05-07 PM | Sponsored payer pattern (gasless witness) | Eileen §6.1 honored; backend keypair pays PDA rent; users see zero cost | operator (eileen ratified) |
| 2026-05-07 PM | ed25519 verification via Solana instructions sysvar pattern | flatline r3 SKP-002 (890): in-program signature verification not supported on Solana; must use Ed25519Program prior instruction + sysvar read | spec-correct fix |
| 2026-05-07 PM | Drop wallet-age sybil check | flatline r3 SKP-001 (850): `getSignaturesForAddress` too slow for Action timeout; rely on IP rate limit + getBalance ≥0.01 SOL | flatline-fix |
| 2026-05-07 PM | Quiz state HMAC-SHA256 (proper construction) | flatline r3 SKP-001 (900): raw `sha256(secret \|\| ...)` is length-extension vulnerable; replaced with `HMAC-SHA256(secret, canonicalEncode(...))` | flatline-fix |
| 2026-05-07 PM | Tiered sponsored-payer alerts (5/2/1 SOL) | flatline r3 SKP-005 (720): single threshold = 0-warning outage; tiered (warn/page/halt) + day-of-demo top-up + halt-disable env flag | flatline-fix |
| 2026-05-07 PM | Score dashboard moves to zerker's parallel lane | We provide event schema · zerker ships dashboard via Score API/CLI/MCP. Tightens our scope; preserves Score sovereignty. Indexer integration post-anchor-deploy | operator |
| 2026-05-07 PM | Gumi authors quiz (parallel, non-blocking) | 5 resonant questions + 4 answers + 5 archetype reveals. Placeholders ready if she's blocked. Not birthday/gender — must feel familiar | operator (gumi ratified) |
| 2026-05-07 PM | Monetization = sponsored awareness slots | Frontier required artifact; brands/community-ops pay for surface layer; we are infrastructure FOR them; platform/medium agnostic | operator |
| 2026-05-07 PM | Deck punchline = separation-as-moat | Eileen's design: substrate (truth) ≠ presentation (voice); agents present, never mutate state; hallucinations become cosmetic, not financial | operator (eileen ratified) |
| 2026-05-08 | sprint-2 ClaimMessage: 7-field 98B signed projection (NOT 11-field 164B) | Off-chain signed bytes are wallet/element/weather/quiz_hash/issued/expires/nonce only. Domain separation (domain/version/cluster/programId) enforced ON-CHAIN via declare_id! pinning + hardcoded CLAIM_SIGNER_PUBKEY + dedicated single-purpose claim-signer key. Simpler accounts/args. Upgrade to 164B BEFORE claim-signer key is ever shared across programs. | operator + agent |
| 2026-05-08 | sprint-2 NonFungible CreateV1 · NOT pNFT · NO GenesisStone PDA | Hackathon scope: TokenStandard::NonFungible (no royalty rules) · single CreateV1CpiBuilder for mint+metadata+master-edition · update_authority = user wallet (full ownership) · payer = sponsored-payer (gasless UX) · collection field with verified=false (Phantom yellow badge OK for hackathon, post-hackathon job verifies). Replay protection = KV nonce + on-chain expiry only. NO parallel Anchor GenesisStone PDA · adds complexity without security uplift for v0. | operator |
| 2026-05-08 | [ACCEPTED-DEFERRED] AC-S2-1 happy-path full-mint test | Anchor invariant tests cover 6 reject paths (validation gates BEFORE the CPI). Full happy-path mint requires real Phantom wallet sig + KV nonce live + Solana Action POST assembly · all sprint-3 work (S3-T2). Reject tests verify the on-chain validation surface; mint correctness verified end-to-end via API smoke after sprint-3 wires it up. | sprint design |
| 2026-05-08 | [ACCEPTED-DEFERRED] AC-S2-2 end-to-end devnet mint flow | Off-chain primitives (HMAC quiz · ClaimMessage sign · KV nonce · 5 element metadata) all in place + 65 unit tests. End-to-end requires the Solana Action POST route (sprint-3 S3-T2 · 3h estimate). Sprint-2 delivers the substrate · sprint-3 wires it. | sprint design |
| 2026-05-08 | [ACCEPTED-DEFERRED] AC-S2-3/4/6 = stretch tasks T5/T6/T8 | T5 BLINK_DESCRIPTOR upstream PR (external repo) · T6 gumi voice (external authoring) · T8 cmp-boundary lint (blocked on T6). All marked stretch in sprint plan. None gate sprint-2 critical path or sprint-3 start. | sprint design |
| 2026-05-08 | sprint-2 invariant scope: 6-of-7 testable on-chain | Original kickoff doc lists 7 invariants (no_lamport · no_token_mut · double_claim_reject · unsigned_reject · expired_sig_reject · cross_cluster_reject · replay_nonce_reject). 4 of these are NOT testable as anchor TS tests: (a) no_lamport / no_token_mut are absence properties verified by source-grep · (b) double_claim/replay_nonce are KV-side · covered by lib/blink/__tests__/nonce-store.test.ts · (c) cross_cluster doesn't apply to the 7-field design (declare_id! pins program transitively). Delivered 6 testable rejects: ElementOutOfRange · WeatherOutOfRange · Expired · NoPriorInstruction · SignerMismatch · MessageMismatch. | agent (scope decision · operator-implicitly-ratified via Simple Path choice) |
| 2026-05-08 | Genesis Stones Collection NFT minted at 3Be59FPQnnSs5Z7Mxs6XtUD1NrrMEVAzhA751aRi2zj1 | One-time bootstrap via scripts/bootstrap-collection.ts · authority = operator's id.json · supply 1 · isCollection metadata flag set. Hardcoded in lib.rs COLLECTION_MINT_PUBKEY const · paired in .env.local. Sprint-2 child stones reference via collection field with verified=false. | operator (script run) |

## Open at Handoff (for next session)

When zerker returns to do the implementation PRD, see `grimoires/loa/context/00-hackathon-brief.md` "Open gaps" section — 8 unanswered questions that block architecture (movement model, action vocabulary, weather source, demo entry, success criterion, etc.).

## What Already Lives in the Kit

- `public/art/puruhani/puruhani-{wood,fire,earth,water,metal}.png` — 5 base puruhani sprites
- `public/art/jani/jani-{wood,fire,earth,water,metal}.png` — 5 jani sister-character sprites
- `public/art/element-effects/{element}_glow.svg` + `harmony_glow.svg` — 6 glow overlays
- `public/art/cards/` — frames × 4 rarities, 6 elemental backgrounds + frames_pot, 14 behavioral states, 4 rarity treatments
- `public/art/patterns/grain-warm.webp` + `public/art/tsuheji-map.png`
- `public/brand/purupuru-wordmark.svg` + `purupuru-wordmark-white.svg`
- `public/fonts/` — FOT-Yuruka Std (woff2 + ttf), ZCOOL KuaiLe (woff2)
- `public/data/materials/` — 18 Threlte 3D material configs (caretaker × 2 × 5 elements + jani × 5 + 3 transcendence)
- `app/globals.css` — full OKLCH wuxing palette × 4 shades, light + Old Horai dark, motion vocab keyframes (purupuru-place, breathe-fire, breathe-water, breathe-metal, tide-flow, honey-burst, shimmer), per-element breathing rhythms, easing curves, 5 brand font stacks, fluid typography scale
- `lib/score/{types,mock,index}.ts` — read-adapter contract + deterministic mock (seeded from wallet address)
- `lib/utils.ts` — cn() helper (clsx + tailwind-merge)
- Tailwind utilities: `bg-puru-{element}-{tint|pastel|dim|vivid}`, `text-puru-ink-{rich|base|soft|dim|ghost}`, `bg-puru-cloud-{bright|base|dim|deep|shadow}`, `font-puru-{body|display|card|cn|mono}`, `text-{2xs|caption|xs..3xl}`, `leading-puru-{tight|normal|relaxed|loose}`

## Stack Notes Worth Remembering

- **Next.js 16.2.6** (Turbopack default) — AGENTS.md warns: "this is NOT the Next.js you know" — breaking changes vs prior versions, consult `node_modules/next/dist/docs/` before assuming APIs
- **React 19.2.4**
- **Tailwind 4** via `@tailwindcss/postcss` (no JS config; use `@theme` in CSS)
- **Pixi.js v8** vanilla (no @pixi/react) — instantiate inside useEffect with cleanup
- pnpm 10.x

| 2026-05-12 | S6 distill SHIPPED upstream · construct-effect-substrate v0.1.0 → v0.2.0 (doctrine_depth: 2) | Cycle 2's distill landed as `0xHoneyJar/construct-effect-substrate#1` (squash-merged to main as `5b06d16`). 4 NEW patterns (hand-port-with-drift · doc-only-then-runtime · lift-pattern-template · state-ownership-matrix) + 1 compounded (single-effect-provide-site) + scaffold-system.sh + doctrine-evolution.md + MEMORY.md + cycles/ lineage. Status remains `candidate` per original ≥3 distinct projects criterion · doctrine_depth field added to track depth separately from breadth. | autonomous distill pass |
| 2026-05-12 PM | Honeycomb battle scaffold · `feat/honeycomb-battle` branch | Operator named the doctrine "Honeycomb" (= effect-substrate). Loa updated 1.130.0 → 1.157.0 (Multi-Model Live milestone, cycles 103-107). construct-effect-substrate pack installed from local source. Three-source split codified: purupuru-game = state machines (lifted as pure TS into `lib/honeycomb/{wuxing,cards,combos,lineup,conditions,seed,curves,whispers}.ts`), world-purupuru = UI/UX vocabulary (transcribed: 13 puru-curves springs/easings, 7-dim kaironic weights, per-element caretaker whispers Persona/Futaba navigator), Honeycomb pack = scaffold-system.sh template. Battle phase machine (idle → select → arrange → preview → committed) typed via Effect Context.Tag, wired into single AppLayer at `lib/runtime/runtime.ts`, 5/5 tests green. `/battle` route ships with 6 client components — CollectionGrid (pick 5), LineupTray (drag-reorder), CombosPanel (live Shēng/Surge/Setup-Strike/Weather-Blessing), KaironicPanel (7 sliders, hand-rolled v1 stand-in for tweakpane+dialkit), WhisperBubble (caretaker speaks bottom-center), PhaseHud. HTTP 200 on /battle; SSR shell shows "honeycomb warming…", client hydrates with seeded snapshot. Crystallization brief written at `grimoires/loa/context/14-card-game-in-compass-brief.md` (status: candidate). Out of scope this cycle: clash resolution, AI opponent, Three.js viewport, daemon NFT, real Five Oracles. | claude (Opus 4.7 1M) + operator |

## Framework Bugs (2026-05-12 · Loa 1.157.0 regression)

Two layered bugs surfaced when running `/flatline-review` on the new PRD after the 1.157.0 update:

1. **Cost-map gap** — `gen-adapter-maps.sh:241` skips entries with 0 pricing; `model-adapter.sh.legacy:94` requires every key. New CLI-kind headless adapters (`codex-headless`, `gemini-headless`, `claude-headless`) get silently omitted from `generated-model-maps.sh`. Patched inline (3 entries each in COST_INPUT + COST_OUTPUT) — see commit on this branch.
2. **Scoring-engine parse failure** — Opus headless calls succeed (no error) but output doesn't conform to the schema the scoring engine expects. `consensus_summary.degradation_reason = "no_items_to_score"` per issue #759. GPT calls failed entirely (stderr only echoed model-adapter banner, no JSON).

Filed via `/feedback` 2026-05-12. Net: flatline produced no actionable findings for the new PRD. Saved degraded result at `grimoires/loa/a2a/flatline/card-game-prd-degraded-2026-05-12.json`. PRD proceeds to /architect without flatline review this round; operator-ratified post-completion gate stands in.

## 2026-05-12 · DIG fallback used (Gemini 403)

`dig-search.ts` failed across all 4 queries with `PERMISSION_DENIED` — Gemini
API project denied. Tried fallback chain: gemini-3-flash-preview →
gemini-2.5-flash → gemini-2.0-flash. All 403.

Per CLAUDE.md: "If both fail, THEN use Agent WebSearch and log the failure."
Synthesizing from training knowledge instead this turn since the user is
mid-iteration on /battle visuals and cannot wait for an auth fix. Cite the
proposal file `grimoires/loa/proposals/foundation-vfx-camera-audio-2026-05-12.md`
for the doctrine that resulted.

## 2026-05-12 · /goal locked for kickoff session

**Goal source:** `grimoires/loa/proposals/kickoff-next-session-2026-05-12.md` §/goal definition (lines 125-161). Operator approved 2026-05-12 PM.

**Headline:** Ship Layer primitive into honeycomb substrate (P4 Registry Plane) + apply to Lock + ElementQuiz rooms with Slay-the-Spire-grade FEEL.

**Done conditions (6):** (1) `lib/cards/layers/{registry.json, types.ts, resolve.ts, CardStack.tsx}` exist + registered in `lib/registry/index.ts` + tests cover 120 combos (5 elements × 4 rarities × 3 reveal × 2 faces). (2) `CardPetal`, `BattleHand`, `OpponentZone` consume `<CardStack>`; card backs no longer use `BRAND.logoCardBack`. (3) `pnpm cards:audit` clean + `pnpm assets:list --orphan` returns zero for `public/art/cards/`. (4) Lock + Quiz pass operator's Slay-the-Spire vibe check. (5) construct-composition workflow demoed end-to-end once. (6) honey/bera PNGs cleaned up.

**Hard NO:** Arena room, substrate reducer, MCP servers.

**Compass-specific delta vs source repo:** add `face: "front" | "back"` axis to `LayerDefinition` — card backs are first-class layers, not patched filenames.

**Sequencing (operator-driven; each Step is a separate prompt):** 0 kickoff (done) → 1 `compose-run audit-feel` (verdict drives whether rooms need new assets vs compositional-only fixes) → 2 `code-implement-and-review` (layer port) → 3 `direct-render` (conditional; only if Step 1 verdict says new assets needed) → 4 `feel-iterate` ×2 (Lock, then Quiz) → 5 `code-implement-and-review` (cards:audit + assets:list CLIs) → 6 cleanup move of honey/bera assets → 7 goal-condition verification.

**Runner resolution:** `compose-run` is not on PATH; actual script is `~/Documents/GitHub/loa-constructs/.claude/scripts/compose-run.sh`. Compositions live at `~/bonfire/construct-compositions/compositions/{discovery,delivery}/*.yaml`. Interactive palette: `~/bonfire/construct-compositions/bin/loom`.

## 2026-05-12 · Kickoff session COMPLETED

All 7 steps from the kickoff brief executed. See `grimoires/loa/proposals/goal-verification-2026-05-12.md` for the full PASS/FAIL audit. Headline:

- ✅ Step 1 — audit-feel verdict written (`audit-feel-verdict-2026-05-12.md`); both rooms classified as compositional-fix-only (no new assets needed). Step 3 (`direct-render`) explicitly skipped per verdict.
- ✅ Step 2 — Layer primitive shipped at `lib/cards/layers/{registry.json, types.ts, resolve.ts, CardStack.tsx, index.ts}` + 429-test coverage (120 combos × ~3.5 assertions). Registered as `registry.cards.layers`. **Compass delta:** new `face: "front" | "back"` axis + `card_back` layer making element-keyed Tsuheji card backs first-class (replaces `BRAND.logoCardBack` wordmark).
- ✅ Step 2b — 3 callsites wired: CardPetal · BattleHand · OpponentZone all consume `<CardStack>`. `BRAND.logoCardBack` no longer referenced. Typecheck clean. 663 tests pass.
- ✅ Step 5 — `pnpm cards:audit` (360/360 combos clean) + `pnpm assets:list` (`--filter`, `--missing`, `--orphan` modes). Surfaced 1 known harmony edge case (`kaori-harmony.png`) — out-of-band, not in production paths.
- ✅ Step 6 — 97 honey/bera files + 5 card-tree orphans (card-template-water-v{1,2}, jani-trading-{fire,metal,water}) archived to `public/_archive/{honey-collection,orphan-cards}/`. Orphan-check returns zero.
- 🟡 Step 4 — mechanical FEEL fixes from the audit-feel verdict landed (Quiz: selection +15% / rejection saturate 0.35 + brightness 0.85 + scale 0.9, kanji boosted text-lg → text-2xl/3xl; Lock: wuxing strip's current-weather glyph promoted to status, tile-btn anticipation breathe 3.2s). Judgment-territory items (element-consequence copy, wordmark vs companion center, bottom-stack density) deferred to operator HITL.

**Goal status:** 4 of 6 done-conditions full PASS · 2 PARTIAL pending operator visual review. Hard NOs respected (Arena untouched, substrate reducer untouched, no MCP).

**What to look at first when operator returns:** /battle in the browser — confirm CardStack visual at Lock screen + once you tap through to ElementQuiz, the new selection deltas and rejection desaturate. The dev server has been running clean ("Compiled in 30-50ms") through all edits.

**Where the operator's judgment is needed (per goal-verification doc §"What the operator should review next"):**
1. Visual check on /battle (CardStack rendering vs prior flat card aesthetic)
2. Quiz selection feel calibration (scale/saturate/timing knobs available)
3. Lock wuxing strip: does it now fight `entry-tide` pill since both show today's element?
4. tile-btn anticipation period/magnitude tuning
5. CardPetal art treatment — currently renders ALL layers; may want slim variant since `.petal` is already chrome
6. Decision on whether to fire `direct-render` for strict goal-condition #5 spec match

## 2026-05-12 PM · UI-prompt work + construct pack sync

Session shifted from substrate-build to UI-mockup-prompt iteration. Three rounds: v1 (asset-gen, operator deprecated) → v2 (2×2 grid portrait, produced Image #1 which read as "poster not game") → v3 (split horizontal, in-app-screenshot framing) → v3-MINT (after loading THE MINT pack's `prompting-images` SKILL.md, rewrote §2.1.A with four-block structure + named treatments + OKLCH + single-stamp + composite-vs-generate). Image #2 generated against v3 (pre-MINT-discipline) — gorgeous but still concept-art-tier per operator.

**Pack sync done:** `git pull` in `~/.loa/constructs/packs/{the-mint,k-hole,the-easel,rosenzu}`. the-mint got `prompting-images` SKILL.md properly tracked (was missing locally, I'd manually cp'd it earlier as untracked). artisan + observer are tarball-installed (no .git) — need re-install via `/constructs` next session.

**Headline doc:** `grimoires/loa/proposals/ui-prompts-distillation-2026-05-12.md` — full lesson digest. Next agent should read this BEFORE writing any image prompts.

**Open gap:** Hearthstone-tier game-UI feel vs concept-art-tier. Both image gens produced beautiful concept-art-style mockups. Next refinement is layering HUD chrome (settings cog as wind-chime, account chip, hit-state affordances) painted INTO Gumi's soft-painted Tsuheji idiom. See distillation §5 for the v4 prompt addition.

**`/kit/ui-explorer`** is the operator's mockup tasting surface — now in 16:9 landscape tile mode.

## 2026-05-13 · Purupuru Cycle 1 PRD authored

`/plan-and-analyze` ran under minimal mode + gap-skipping. Build doc (`grimoires/loa/specs/arch-enhance-purupuru-cycle-1-wood-vertical.md`) + Gumi's harness (`~/Downloads/purupuru_architecture_harness/`) WERE the pre-PRD; this session translated them into Loa PRD format at `grimoires/loa/cycles/purupuru-cycle-1-wood-vertical-2026-05-13/prd.md`.

**Operator decisions captured (single consolidated AskUserQuestion gate):**
- Cycle dir: `purupuru-cycle-1-wood-vertical-2026-05-13` (date-suffixed, matches prior-cycle convention)
- §13 open questions: defer all 5 to SDD as Q-SDD-* (none block sprint authoring per build-doc close)
- Vertical-slice route: `/battle-v2` (parallel to existing `/battle`)

**PRD shape:** 12 sections (TL;DR · 12 pre-decided decisions · problem · 10 goals · 18 AC metrics · users · 29 FRs across 5 sprints · technical/NFR · scope · 9 risks · sprint dependency graph · references · 5 Q-SDD-* open questions). Authored against minimal-mode gap-skipping — only one operator gate fired; all phases skip-able because the spec is already exhaustive.

**Invariants confirmed extant in codebase:**
- `lib/purupuru/` does NOT exist (greenfield namespace per D1)
- `lib/cards/layers/` exists (preserved · 429-test coverage from battle-foundations-2026-05-12)
- `lib/honeycomb/` exists (preserved · 8-sprint surface from card-game-in-compass-2026-05-12)
- `app/battle/` exists (preserved · stays untouched · `/battle-v2` ships in parallel)
- `lib/registry/index.ts` exists (extensible for `registry.purupuru.runtime` + `registry.purupuru.content`)

**Next step:** `/architect` to produce the SDD. SDD interview resolves Q-SDD-1 through Q-SDD-4 (Q-SDD-5 telemetry destination RESOLVED at PRD-altitude in r1 → JSONL trail).

**r1 post-flatline integration (2026-05-13 PM)**: Operator requested `/flatline-review via /simstim workflow for rigor`. Flatline orchestrator hit the same 2026-05-12 regression class (all 6 Phase-1 model-adapter calls returned bare banners, no `.run/model-invoke.jsonl` envelope written despite cycle-107 routing default-on). Fell back to manual two-voice review: Opus structural (3 BLK + 5 HIGH + 5 MED) + Codex skeptic via codex CLI (4 BLK + 5 HIGH + 5 MED). Both voices verdict REVISE-BEFORE-ARCHITECT. Saved at `grimoires/loa/a2a/flatline/cycle-1-prd-{opus-structural,codex-skeptic,consensus}-2026-05-13.{md,md,json}`. PRD r1 integrates all 14 auto-integrate findings + 4 operator-decided judgment calls.

**Critical Codex catches r1 fixed**:
- Sequence has **11 beats not 12** (verified: `grep -c '^  - id:' sequence.wood_activation.yaml = 11`)
- `contracts.ts` is engine-agnostic pseudocode per file header, NOT canonical TypeScript
- `ajv` + `ajv-formats` already in package.json (only `js-yaml` needs adding)
- S5 sprint graph had typo `sprint-4` review — fixed to `sprint-5`
- SemanticEvent union has 15 in contracts.ts + 5 README-only deferred (I had fabricated "18")

**Critical Opus catches r1 fixed**:
- `validation_rules.md` not vendored (21 design-lint + runtime-assertion rules) → FR-2a NEW
- Resolver ops list missing `set_flag` + `add_resource` from event YAML → FR-13 expanded
- Input-lock owner registry missing → FR-11a NEW
- Sky-eye terminology `growth_rings` → `sky_eye_leaf` per element YAML
- ZoneToken state machine needs 10 gameplay + 6 UI states compose
- 4 target registries (anchor/actor/UI-mount/audio-bus) replace single anchor-registry

**Operator decisions captured in r1**:
- OD-1 (5-zone path): B = 1 schema-backed wood_grove + 4 decorative locked tiles
- OD-2 (CardStack adapter): A = build `harnessCardToLayerInput()` adapter in S4 (~50 LOC)
- OD-3 (telemetry destination): A = JSONL trail at `grimoires/loa/a2a/trajectory/telemetry-cycle-1-*.jsonl`
- OD-4 (S0 spike): C = lightweight (vendor schemas + AJV-validate ONE YAML) — cycle now 6 sprints

**Framework regression report**: Same flatline-orchestrator bug as 2026-05-12 still active. Filed as **loa#877** (https://github.com/0xHoneyJar/loa/issues/877). Root cause isolated: cheval.py registers `claude-opus-4.7` (period form) but NOT `claude-opus-4-7` (dash form) — backfill is incomplete for the current model. Older Opus versions (4.5, 4.6) have BOTH forms registered. Compass `.loa.config.yaml` uses dash form (cycle-104 operator tuning), so all cheval calls fail with `INVALID_CONFIG: Unknown alias`. Diagnostic gap: flatline-orchestrator silently drops cheval's JSON error and only displays the bare banner from model-adapter.sh, forcing manual fallback. Verified the regression exists on upstream main (`6e76582d`) — recent version does NOT fix it. Adjacent open issues: #863 #864 #866. Operator credentials separately exhausted: Anthropic balance + Google project 403 (same DIG fallback issue from 2026-05-12).

**Construct composition this cycle:** ARCH lens (OSTROM · structural · blast radius) + SHIP lens (BARTH · scope guard · cut while-I'm-here) + craft lens (ALEXANDER · pattern language · pixel-level structural).

**Beads health flagged:** JSONL stale 38h. Operator should `br sync` before `/sprint-plan` ships beads tasks.

## 2026-05-12 late · BATTLE SCREEN BREAKTHROUGH (Image #6)

Operator fired §2.2 v1 battle prompt (16KB MINT-disciplined four-block + 7-zone Hearthstone/TFT layout + ember-trail per-element-motif applied per SKY EYES Priority-1 retrofit). ChatGPT image returned a render where ALL discipline held simultaneously: every blank-surface-with-hanko stamp worked (no mangled text), all 7 zones positioned correctly, parallax depth read as 4-5 distance planes, ember-trail particles visible drifting through entire frame, dual HP-gem rails with opponent's metal-violet vs player's fire-vermillion stamp clusters obeyed, chibi puruhani mascot landed in lower-left corner exactly as described, hover-state amber visible on both hand-card AND LOCK-IN CTA simultaneously.

This is the **first render where SKY EYES Priority-1 (per-element non-color motif persistence) shows visually**. Ember-trails are fire's NON-COLOR identity — when this prompt fires with the other 4 elements (water=ripple-circles, wood=growth-rings, metal=clockwork-glints, earth=honeycomb), the element-separation problem (4.8/100 in March 2026) becomes addressable in PRACTICE.

Render saved at `public/art/mockups/clash/a.png` (3MB). Visible at `/kit/ui-explorer`.

Three open next-moves: (A) fire 4 more element battle prompts cold-mode to build full set, (B) composite the legible text via rsvg-convert+magick to prove end-to-end pipeline, (C) start React/CSS port against Image #6 as visual gold standard.

Recommended next: Move A with WATER (Ruan + ripple-circles + harbor-pier-at-rain). Pin Ruan in proper water register (addresses SKY EYES finding she's most visually-inconsistent caretaker) + ripple-circles is the most distinct motif from ember-trails so element-separation gain is biggest on first additional element.
