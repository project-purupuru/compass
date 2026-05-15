/**
 * ClashEvent — the clash domain's event stream.
 *
 * The clash match is a state machine; this is the trace it emits. The
 * MatchEngine publishes these on a PubSub; the surface (BattleV2's event log)
 * subscribes so the clash is *observable* — the substrate's events trace, the
 * same discipline as lib/purupuru's SemanticEvent bus. The world reaction
 * (activationLevel deltas) is also driven off this stream — events in, world
 * out.
 */

import type { Element } from "../synergy";

export type ClashEventType = ClashEvent["type"];

export type ClashEvent =
  | { readonly type: "MatchStarted"; readonly weather: Element }
  | { readonly type: "RoundLocked"; readonly round: number }
  | {
      readonly type: "ClashResolved";
      readonly round: number;
      readonly index: number;
      readonly winner: "player" | "opponent" | "draw";
      /** The winning card's element — null on a draw. */
      readonly element: Element | null;
    }
  | {
      readonly type: "RoundConcluded";
      readonly round: number;
      readonly playerSurvivors: number;
      readonly opponentSurvivors: number;
    }
  | { readonly type: "MatchEnded"; readonly winner: "player" | "opponent" | "draw" };
