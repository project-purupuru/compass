import { Layer, ManagedRuntime } from "effect";
import { WeatherLive } from "@/lib/live/weather.live";
import { SonifierLive } from "@/lib/live/sonifier.live";
// S1 lifts (substrate-agentic-2026-05-12 cycle):
import { ActivityLive } from "@/lib/activity/activity.live";
import { PopulationLive } from "@/lib/sim/population.live";
// S4 world substrate (substrate-agentic-2026-05-12 cycle):
import { AwarenessLive } from "@/lib/world/awareness.live";
import { ObservatoryLive } from "@/lib/world/observatory.live";
import { InvocationLive } from "@/lib/world/invocation.live";
// Honeycomb battle (card-game-in-compass · feat/honeycomb-battle):
import { BattleLive } from "@/lib/honeycomb/battle.live";
import { ClashLive } from "@/lib/honeycomb/clash.live";
import { MatchLive } from "@/lib/honeycomb/match.live";
import { OpponentLive } from "@/lib/honeycomb/opponent.live";
// Burn-rite cycle (S1 / sprint-148): the player's persistent owned-card store.
import { CollectionLive } from "@/lib/honeycomb/collection.live";
// Battle-v2 clash substrate (d75579f6): the MatchEngine that drives the
// lock-in → clash-advance → conclude state machine consumed by
// lib/runtime/react.ts. Was authored alongside battle-v2 but never wired
// into AppLayer — restoring the missing provision here (2026-05-17).
import { MatchEngineLive } from "@/lib/cards/battle";

// THE single Effect.provide site for the app. Lint check: a grep for
// `ManagedRuntime.make` in lib/ or app/ should return exactly one match
// — this file. A second site would fragment the service graph and
// fork the Layer scope.
//
// Composition: primitives at the bottom, derived layers on top. Awareness
// depends on Population + Activity. Observatory depends on Awareness.
// Each tier is provided into the next so the AppLayer surface has
// R = never (all deps resolved).
const PrimitivesLayer = Layer.mergeAll(
  WeatherLive,
  SonifierLive,
  ActivityLive,
  PopulationLive,
  InvocationLive,
  BattleLive,
  ClashLive,
  OpponentLive,
  CollectionLive,
  // MatchEngine is R=never (closes over pure ./match functions), so it
  // merges directly into PrimitivesLayer without provide-from.
  MatchEngineLive,
);
const AwarenessOnPrimitives = Layer.provide(AwarenessLive, PrimitivesLayer);
const ObservatoryOnAwareness = Layer.provide(ObservatoryLive, AwarenessOnPrimitives);
// Match depends on Clash (already in PrimitivesLayer).
const MatchOnClash = Layer.provide(MatchLive, PrimitivesLayer);

export const AppLayer = Layer.mergeAll(
  PrimitivesLayer,
  AwarenessOnPrimitives,
  ObservatoryOnAwareness,
  MatchOnClash,
);
export const runtime = ManagedRuntime.make(AppLayer);
