---
session: 15
date: 2026-05-16
type: kickoff-build-doc
topic: director-event-substrate-and-channels
status: ready
mode: ARCH (OSTROM) + craft lens (ALEXANDER)
depends_on:
  - session 13 (substrate-graduation-utc) — preferred for tier-tagging Director sequences
  - session 14 (vfx-lab) — vfx presets become Director-triggerable sequences
convergence_target: "Director service in Effect that publishes a typed
  unified event stream; UI + VFX + Sound channels subscribe via Layers and
  react with composed sequences; code-only authoring (no scrubber UI v1);
  Sound channel is a noop interface ready for the-speakers to ship"
---

# Session 15 — Director Event Substrate · Unified Stream + Channels

> Operator framing 2026-05-16: "a unified event stream · director-as-
> blockchain-style: action emits event, director reacts, channels subscribe ·
> separation between elements is important · honeycomb substrate doctrine ·
> composable, lives on its own, emits events that can be listened to ·
> code-only authoring this session (scrubber unfamiliar, just reference) ·
> sound hooks noop for now, plug in when the-speakers ships."
>
> The Director extends `lib/purupuru/presentation/sequencer` (the
> BeatFireRecord shape already in compass since session 9) into a generic
> event substrate that coordinates UI choreography + VFX triggers + sound
> cues frame-by-frame. Card play becomes one COMPOSED beat, not 3 things
> racing each other.

## Operator-locked decisions (from kickoff iteration)

| Question | Decision | Why |
|---|---|---|
| Director shape | **unified event stream (blockchain-style)** | actions emit events · director publishes · channels subscribe |
| Channel separation | **composable subscribers per honeycomb doctrine** | each medium (UI · VFX · Sound) lives on its own, listens, reacts |
| Timeline editor | **CODE-ONLY v1** | scrubber is reference-only / unfamiliar · bigger build · defer |
| Sound | **noop hook interface** | the-speakers construct hasn't shipped · plug in when ready · "substrate before implementation" |
| Schema layer | **`@effect/schema`** (consistent with session 14) | one substrate · GameEvent is a TaggedUnion |
| Existing sequencer | **EXTEND not replace** | `lib/purupuru/presentation/sequencer` is the prior art · BeatFireRecord ports forward |

## Invariants (Ostrom)

1. **Director is a pure publisher** — emits events; never reaches into channel internals · channels are blind to each other
2. **Events are typed via TaggedUnion** — `Schema.TaggedUnion("type", [CardPlayed, ComboLinked, ClashResolved, ...])` · single discriminator
3. **Channels are Effect Layers** — `UiChannelLayer`, `VfxChannelLayer`, `SoundChannelLayer` · composed at app boot · each subscribes via `Director.subscribe()`
4. **Sound channel is NOOP until the-speakers ships** — same interface, empty implementation · ship-ready integration point
5. **Code-only authoring** — sequences = TS event-handler functions per channel · no visual scrubber · operator drives via code + tests + the existing BeatFireRecord pattern
6. **Honeycomb substrate doctrine respected** — channels live in `lib/purupuru/director/channels/` · pure Effect services · React surface is pure render+dispatch (per [[feedback_substrate-not-ui-islands]])

## Blast Radius

| Artifact | Change | Risk |
|---|---|---|
| `lib/purupuru/director/Director.ts` | NEW · the central Effect service | low |
| `lib/purupuru/director/GameEvent.ts` | NEW · TaggedUnion of event types | low |
| `lib/purupuru/director/channels/UiChannel.ts` | NEW · subscribes, dispatches UI animations | low |
| `lib/purupuru/director/channels/VfxChannel.ts` | NEW · subscribes, triggers vfx-lab effects (from session 14) | low |
| `lib/purupuru/director/channels/SoundChannel.ts` | NEW · noop interface ready for the-speakers | low |
| `lib/purupuru/director/sequences/` | NEW · per-event-type composed sequences | low |
| `lib/purupuru/presentation/sequencer.ts` | EDIT · extend BeatFireRecord to consume Director or wrap it · backward-compat preserved | medium |
| `app/battle-v2/page.tsx` | EDIT · provide Director Layer at root · 1-line addition | low |
| Existing channel-bound components (HUD bits, VfxLayer, etc.) | NO EDIT v1 · they continue working · gradual migration in session 16+ | none |

No new dependencies (Effect + @effect/schema already used; PubSub + Stream + Layer are standard Effect primitives).

## Data Architecture (Effect-TS shape)

```ts
import { Context, Effect, Layer, PubSub, Stream, Schema as S } from "effect"

// ─── Event types (single TaggedUnion · discriminator: type) ─────────
const CardPlayed = S.Struct({
  type: S.Literal("card.played"),
  cardId: S.String,
  zoneId: S.String,
  playerSide: S.Literal("player", "opponent"),
  atMs: S.Number,
})
const ComboLinked = S.Struct({
  type: S.Literal("combo.linked"),
  cardIds: S.Array(S.String),
  multiplier: S.Number,
  atMs: S.Number,
})
const ClashResolved = S.Struct({
  type: S.Literal("clash.resolved"),
  winnerSlot: S.optional(S.Number),
  loserSlot: S.optional(S.Number),
  atMs: S.Number,
})
const EnvironmentImpacted = S.Struct({
  type: S.Literal("environment.impacted"),
  kind: S.Literal("tree-fall", "water-splash", "anvil-strike"),
  worldPos: S.Tuple(S.Number, S.Number, S.Number),
  atMs: S.Number,
})
// ... extensible · add more event types as channels need them

export const GameEvent = S.Union(
  CardPlayed, ComboLinked, ClashResolved, EnvironmentImpacted
)
export type GameEventT = S.Schema.Type<typeof GameEvent>

// ─── Director service (the unified event bus) ───────────────────────
export class Director extends Context.Tag("Director")<Director, {
  publish: (event: GameEventT) => Effect.Effect<void>
  subscribe: () => Effect.Effect<Stream.Stream<GameEventT>>
  // Schedule N events with offsets — the "videographer" sequence move
  sequence: (events: ReadonlyArray<{ event: GameEventT; offsetMs: number }>) => Effect.Effect<void>
}>() {}

export const DirectorLive = Layer.scoped(
  Director,
  Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<GameEventT>()
    return {
      publish: (event) => PubSub.publish(pubsub, event).pipe(Effect.asVoid),
      subscribe: () => Effect.succeed(Stream.fromPubSub(pubsub)),
      sequence: (events) => Effect.forEach(events, ({ event, offsetMs }) =>
        Effect.sleep(`${offsetMs} millis`).pipe(
          Effect.zipRight(PubSub.publish(pubsub, event))
        ),
        { concurrency: "unbounded" }
      ).pipe(Effect.asVoid),
    }
  })
)

// ─── Channel pattern (per-medium subscriber) ────────────────────────
export const UiChannelLayer = Layer.scopedDiscard(
  Effect.gen(function* () {
    const director = yield* Director
    const stream = yield* director.subscribe()
    yield* stream.pipe(
      Stream.runForEach((event) =>
        Effect.gen(function* () {
          // pattern-match on event.type
          // dispatch UI animation (e.g. CardHandFan.snap("card.played"))
          // pure side-effects · no state writes outside React refs
        })
      )
    )
  })
)
// VfxChannel mirrors this pattern — subscribes, matches event types,
// triggers the appropriate vfx-lab effect via VfxRegistry.
// SoundChannel mirrors this pattern — subscribes, MATCHES events,
// calls Sound.cue("X") which is a noop until the-speakers ships.

// ─── App composition (at /battle-v2 root) ───────────────────────────
const AppLayer = Layer.mergeAll(
  DirectorLive,
  UiChannelLayer,
  VfxChannelLayer,
  SoundChannelLayer,  // noop until the-speakers
)
```

## What to Build (in dependency order)

### 1. `lib/purupuru/director/GameEvent.ts`
TaggedUnion of initial event types (CardPlayed · ComboLinked · ClashResolved · EnvironmentImpacted). Extensible — channels add new event types as needed.

### 2. `lib/purupuru/director/Director.ts`
The Effect service · PubSub-backed · `publish` / `subscribe` / `sequence` API · DirectorLive Layer.

### 3. `lib/purupuru/director/channels/UiChannel.ts`
First channel · subscribes to Director · pattern-matches event.type · dispatches UI animations (initially: log to console + a single demo wired to `card.played` triggering a HUD pulse). Builds the channel pattern other channels copy.

### 4. `lib/purupuru/director/channels/VfxChannel.ts`
Subscribes · routes `environment.impacted` events to VfxRegistry effect triggers from session 14 (e.g. `kind: "tree-fall"` → registry.lookup("tree-fall").trigger()). If session 14 hasn't shipped, stub the registry call.

### 5. `lib/purupuru/director/channels/SoundChannel.ts`
NOOP interface · subscribes · pattern-matches · calls `Sound.cue("X")` which logs to console. Same shape as the other channels. Ready for the-speakers to drop in real audio.

### 6. `lib/purupuru/director/sequences/cardPlayedSequence.ts`
First COMPOSED sequence · when a `card.played` event fires, director schedules:
- t+0ms: UI pulse on the played card
- t+120ms: VFX preview triggers (sticker-stamp summon from PaperPuppet)
- t+240ms: Sound cue (noop for now)
- t+800ms: ComboLink check + emit combo.linked if chain detected
Demonstrates the videographer pattern — one event composes a coordinated multi-channel response.

### 7. `lib/purupuru/presentation/sequencer.ts` (EDIT, backward-compat)
Existing `BeatFireRecord` consumers continue working. Add adapter so the new Director can publish BeatFireRecord-shaped events into the event stream (or the sequencer reads from Director). Decide direction at session start; lower-risk path is Director reads sequencer.

### 8. `app/battle-v2/page.tsx` (EDIT, 1-line)
Mount Director + channel layers at the route root. AppLayer composed once.

### 9. Tests
- Director publish/subscribe round-trip
- Sequence scheduling preserves order at the published offsets
- Each channel receives + correctly pattern-matches its events
- SoundChannel is noop-verifiable (calls happen, no audio output)

## Design Rules (Alexander)

- Director is **invisible to the UI surface** — components dispatch events via `director.publish()`, never reach into channel internals
- **Frame-precise vs ms-precise** — Director schedules in ms. Channel-side decides whether to quantize to stepped frames (per Cuphead doctrine for body motion) or stay smooth (per Genshin doctrine for env/UI/flip)
- **Pure data flow** — `events: in · animations: out` · no event handlers in React components (per [[feedback_substrate-not-ui-islands]])
- **Honeycomb composability** — channels are Layers · composable in any combination · operator can swap a channel out for testing or alt-version

## What NOT to build (Barth)

- NO scrubber UI / visual timeline editor (operator deferred — unfamiliar · "if bigger build, code-only")
- NO sound infrastructure (the-speakers integration is its own scope · noop hooks only)
- NO new event types beyond initial 4 (CardPlayed · ComboLinked · ClashResolved · EnvironmentImpacted) — extensible later
- NO migration of existing components onto Director (gradual · session 16+)
- NO new dependencies (Effect already includes PubSub + Stream + Layer)

## Sub-agent dispatch plan (per pulled thread, interactive)

When operator wants research during session 15:
- Effect-TS PubSub + Stream + Layer patterns (if uncertain on shape): k-hole teach-mode dispatch
- Blockchain event-bus prior art (if validating the analogy): k-hole teach-mode
- Existing compass sequencer migration paths: read `lib/purupuru/presentation/sequencer.ts` first, then k-hole if needed

All dispatches honor the session 13 protocol: ≤5 PullThreads · operator scans
60s · picks 1 · /dig with next_query_seeds · doctrine lands tagged
`tier: silver`. Convergence_target declared per dispatch.

## Verify

```bash
pnpm dev
# open http://localhost:3000/battle-v2
# Director provided at root via AppLayer
# trigger via dev console:
#   await window.__director.publish({ type: "card.played", cardId: "...", ... })
# observe:
#   UI channel logs the event
#   VFX channel logs the trigger (or fires vfx-lab preview if session 14 shipped)
#   Sound channel logs the noop cue
# trigger a sequence:
#   await window.__director.sequence([...cardPlayedSequence(cardId)])
# observe ordered multi-channel reactions at offsets
```

## Key References

| Topic | Path |
|---|---|
| Build doc (this) | `grimoires/loa/specs/enhance-director-event-substrate.md` |
| Session 14 vfx-lab | `grimoires/loa/specs/enhance-vfx-lab.md` (VfxRegistry the VfxChannel consumes) |
| Session 13 substrate | `grimoires/loa/specs/enhance-substrate-graduation-utc.md` (tier-tagging for Director sequences) |
| Existing sequencer | `lib/purupuru/presentation/sequencer.ts` (BeatFireRecord — the prior art) |
| Existing sequencer demo | `app/battle-v2/world-preview/page.tsx:32-40` (FAKE_BEATS array) |
| Effect PubSub docs | https://effect.website/docs/concurrency/pubsub |
| Effect Stream docs | https://effect.website/docs/stream/introduction |
| Effect Layer docs | https://effect.website/docs/requirements-management/layers |
| Honeycomb substrate doctrine | memory `honeycomb-substrate` + `feedback_substrate-not-ui-islands` |
| The-speakers construct (for future Sound) | `.claude/constructs/packs/the-speakers/` (8 audio skills · not shipped yet) |
| Music player at / route (operator-mentioned plug-in point) | `app/page.tsx` (check what's there for sound infra) |

## Convergence target (from frontmatter)

Director service in Effect that publishes a typed unified event stream; UI +
VFX + Sound channels subscribe via Layers and react with composed sequences;
code-only authoring (no scrubber UI v1); Sound channel is a noop interface
ready for the-speakers to ship.

After 3-4 iterations without landing → reset, target was wrong (per the
breadth↔depth-toward-convergence doctrine).

## Open creative questions (for operator at session start)

1. **Existing sequencer direction** — Director READS the existing sequencer (Director queries `lib/purupuru/presentation/sequencer` for BeatFireRecord at session start), OR sequencer publishes INTO Director (sequencer becomes a sub-component)?
2. **CardPlayedSequence default content** — start with the 4-step (UI pulse → VFX summon → Sound cue → combo check) above, OR keep stub-only and let operator-iteration fill in?
3. **VfxChannel coupling to session 14** — strict (errors if VfxRegistry empty) OR soft (logs the trigger, no-ops if registry empty)?
4. **Music player at `/` route** — check what's there for sound infra · does it inform the SoundChannel noop shape now, or stay completely decoupled until the-speakers ships?
