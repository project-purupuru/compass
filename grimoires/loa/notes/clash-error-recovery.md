---
status: scaffold
sprint: S1b
task: T1b.5 · Clash error recovery scaffold
date: 2026-05-12
sdd: §3.4.3
follow_up_sprint: S2 (wire into Match's error channel)
---

# Clash Error Recovery

## Error taxonomy

`clash.live.ts:resolveRound` is pure-given-seed and should not throw under
normal conditions. However, defensive guards catch:

| Tag | Condition | User-facing recovery |
|---|---|---|
| `invariant-violation` | A computed clash result violates a documented invariant (e.g., negative power, eliminated card not in lineup, clash count > min lineup size) | "The arena's balance has slipped. We'll start a fresh round." → restart match (preserves seed for replay) |
| `unexpected-result-shape` | Result fails RoundResult type guard (only possible via tampered mock fixture) | Same as above. Log diagnostic; in dev, expose to DevConsole. |
| `garden-grace-overflow` | Garden grace would carry chainBonus >1.5 — a stack overflow indicating combo detection bug | Cap at 1.5 silently, log warning |

## Effect error channel

`clash.live.ts` exports `Clash` which has signature `resolveRound(input):
Effect.Effect<RoundResult>`. The implementation does NOT use `Effect.fail`
today — failures are absorbed as best-effort outputs (safety tiebreak, etc.).

If we add typed errors later, the contract changes to:
`Effect.Effect<RoundResult, ClashError>` and Match's `advance-clash` handler
catches via `Effect.catchAll`.

## Match-side handling

`match.live.ts:invoke({ _tag: "advance-clash" })` will need (S2 wiring):

```typescript
const result = yield* clash.resolveRound(input).pipe(
  Effect.catchAll((err) =>
    Effect.gen(function* () {
      yield* publish({ _tag: "clash-error", error: err });
      // Transition to a recoverable state · NOT idle (which loses seed)
      yield* transition("recoverable-error");
      // Return a no-op RoundResult so the caller doesn't crash
      return {
        round: snap.currentRound + 1,
        clashes: [],
        eliminated: [],
        survivors: { p1: snap.p1Lineup, p2: snap.p2Lineup },
        chainBonusAtRoundStart: snap.chainBonusAtRoundStart,
        chainBonusAtRoundEnd: snap.chainBonusAtRoundStart,
        gardenGraceFired: false,
      } satisfies RoundResult;
    }),
  ),
);
```

## RecoverableErrorScreen (S2 scaffold pending)

UI component path: `app/battle/_scene/RecoverableErrorScreen.tsx`. Three
operator affordances:

1. **Restart match** — `match.invoke({ _tag: "reset-match" })` preserves the
   seed so the same match can be reproduced.
2. **Report bug** — opens GitHub issue template with seed + last-known
   MatchSnapshot prefilled.
3. **Force-resolve as draw** — emergency exit; logs to trajectory.

The state preserves `seed` so the operator can reproduce the failure mode
by pasting it into the SeedReplayPanel (S7).

## Status

- **S1b**: this doc + the catch-all guards in `clash.live.ts:resolveRoundImpl`
  (existing safety tiebreaks).
- **S2**: wire `recoverable-error` into MatchPhase + add `RecoverableErrorScreen`
  component + the Effect.catchAll handler in `match.live.ts:advance-clash`.
- **S6**: register clash-error events in DevConsole's SubstrateInspector.
