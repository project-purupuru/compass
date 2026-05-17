# lib/honeycomb/grounding

> Cycle-4 grounding envelope · compass runtime hand-port of upstream honeycomb doctrine.

Hand-ported from `construct-effect-substrate/schemas/grounding-envelope.schema.json` + `constraints/GroundingEnvelope.constraints.json` per the `hand-port-with-drift` pattern (cycle-2 doctrine). Upstream owns the contract; this folder owns the compass runtime expression.

## What's here

| file | purpose |
|---|---|
| `envelope.schema.json` | Vendored JSON Schema 2020-12 (drift-checked vs upstream) |
| `envelope.constraints.json` | Vendored constraint DSL (mirrors loa-hounfour) |
| `envelope.ts` | Effect Schema hand-port + types |
| `validate.ts` | Entry-point validator (structural + cross-field) |
| `__vectors__/` | Golden test vectors (4 valid + 2 invalid REJECT) |

## Usage

```ts
import { validate } from "@/lib/honeycomb/grounding/validate";
import { Effect } from "effect";

const result = await Effect.runPromise(validate(input));
if (!result.valid) {
  console.error("invalid envelope:", result.errors);
} else {
  // result.envelope is typed GroundingEnvelope
  // result.warnings may surface non-blocking concerns (refuted-gold, bronze-with-signature)
}
```

## The 3+3 discipline

| axis | states |
|---|---|
| **tier** (promotion ladder) | `bronze` (agent-forward · default) · `silver` (operator-blessed) · `gold` (UTC-backed) |
| **grounding_status** (epistemic tristate) | `grounded` (current evidence) · `refuted` (UTC moved or operator-marked) · `unverifiable` (can't confirm) |

The two axes are orthogonal. A gold artifact can be refuted (history preserved, integration blocked). A bronze artifact can be unverifiable (default for unmoored agent generation).

## 10 enforced rules

5 structural errors + 3 cross-field errors + 2 warnings. See `envelope.constraints.json` for the canonical list. Highlights:

- **gold needs UTC** with learning_status in `[strongly-validated, directionally-correct]`
- **silver needs** operator_signed OR construct-consensus quorum (≥2 voices)
- **operator_signed needs blessed_by=operator** (signature non-transferability)
- **refuted needs refuted_at timestamp** (provenance trace)

## Drift CI

The upstream contract lives at `~/Documents/GitHub/construct-effect-substrate/schemas/grounding-envelope.schema.json`. Drift is detectable via diff against the vendored JSON in this folder. A CI script can be wired later (`scripts/check-honeycomb-grounding-drift.sh` is TBD).

## Doctrine

- Pattern: [`grounding-ladder-as-substrate-primitive`](https://github.com/0xHoneyJar/construct-effect-substrate/blob/main/patterns/grounding-ladder-as-substrate-primitive.md)
- Sibling: [`hakkutsu-as-divining-rod`](https://github.com/0xHoneyJar/construct-effect-substrate/blob/main/patterns/hakkutsu-as-divining-rod.md) — operates ON the envelope
- Cycle-4 of honeycomb's doctrine evolution (structural → positional → peer-substrates → grounding-and-hakkutsu)
