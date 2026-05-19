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
// Lab evolution cycle · regression substrate (ADR-1 + ADR-9).
// Env-gated: dev/test gets the Playwright-backed live layer; production gets
// the noop layer so Playwright is NEVER in the production bundle.
import { RegressionCheckNoopLive } from "@/lib/regression/regression.noop";
// Lab evolution cycle · S1b UI substrate (ADR-2 + ADR-3 + ADR-12).
import { AdapterRegistryLive } from "@/lib/lab/adapter-registry/adapter-registry.live";
import { InspectorStateLive } from "@/lib/lab/state/inspector.live";
import { PointerChainResolverLive } from "@/lib/lab/pointer-chain/pointer-chain.live";
// S4 · Workspaces state (per-workspace layout state via Effect Ref).
import { WorkspaceLive } from "@/lib/lab/state/workspace.live";

// THE single Effect.provide site for the app. Lint check: a grep for
// `ManagedRuntime.make` in lib/ or app/ should return exactly one match
// — this file. A second site would fragment the service graph and
// fork the Layer scope.
//
// Composition: primitives at the bottom, derived layers on top. Awareness
// depends on Population + Activity. Observatory depends on Awareness.
// Each tier is provided into the next so the AppLayer surface has
// R = never (all deps resolved).
// Lab evolution cycle · regression substrate env-gating (ADR-9).
// At MODULE LOAD TIME we pick which RegressionCheck implementation feeds
// AppLayer. Production (NODE_ENV !== 'development' AND LOA_REGRESSION !== '1')
// MUST get the noop layer so Playwright never enters the production bundle.
// The dynamic import dance lives in the live layer; here we wire the static
// noop. Dev/test wires the live layer via the Vitest setup helper at
// `tests/regression/setup.ts` which calls `runtime.runWith(RegressionCheckLive)`.
const RegressionLayer = RegressionCheckNoopLive;

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
  RegressionLayer,
  // S1b UI substrate: AdapterRegistry (R=never) + InspectorState (R=never).
  AdapterRegistryLive,
  InspectorStateLive,
  // S4 workspace state (R=never).
  WorkspaceLive,
);
const AwarenessOnPrimitives = Layer.provide(AwarenessLive, PrimitivesLayer);
const ObservatoryOnAwareness = Layer.provide(ObservatoryLive, AwarenessOnPrimitives);
// Match depends on Clash (already in PrimitivesLayer).
const MatchOnClash = Layer.provide(MatchLive, PrimitivesLayer);
// PointerChainResolver depends on AdapterRegistry (in PrimitivesLayer).
const PointerChainOnRegistry = Layer.provide(PointerChainResolverLive, PrimitivesLayer);

export const AppLayer = Layer.mergeAll(
  PrimitivesLayer,
  AwarenessOnPrimitives,
  ObservatoryOnAwareness,
  MatchOnClash,
  PointerChainOnRegistry,
);
export const runtime = ManagedRuntime.make(AppLayer);
