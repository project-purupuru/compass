/**
 * GameState factory + serialization.
 *
 * Per PRD r2 + SDD r1 §3 / §4. AC-14: parse(serialize(state)) === state deep-equal.
 */

import type {
  CardInstanceState,
  ContentId,
  ElementId,
  EntityId,
  GameState,
  WeatherState,
  ZoneRuntimeState,
} from "../contracts/types";

export interface InitialStateOptions {
  readonly runId: string;
  readonly day?: number;
  readonly dayElementId: ElementId;
  readonly weatherIntensity?: number;
  readonly weatherScope?: "localized" | "global";
  readonly hand?: readonly { instanceId: EntityId; definitionId: ContentId; ownerId?: EntityId }[];
  readonly zones?: readonly {
    zoneId: EntityId;
    elementId: ElementId;
    state?: ZoneRuntimeState["state"];
  }[];
}

export function createInitialState(opts: InitialStateOptions): GameState {
  const weather: WeatherState = {
    activeElement: opts.dayElementId,
    intensity: opts.weatherIntensity ?? 1,
    scope: opts.weatherScope ?? "localized",
  };

  const cards: Record<EntityId, CardInstanceState> = {};
  for (const c of opts.hand ?? []) {
    cards[c.instanceId] = {
      instanceId: c.instanceId,
      definitionId: c.definitionId,
      location: "InHand",
      ownerId: c.ownerId ?? "player",
    };
  }

  const zones: Record<EntityId, ZoneRuntimeState> = {};
  for (const z of opts.zones ?? []) {
    zones[z.zoneId] = {
      zoneId: z.zoneId,
      elementId: z.elementId,
      state: z.state ?? "Idle",
      activeEventIds: [],
      activationLevel: 0,
    };
  }

  return {
    runId: opts.runId,
    turn: 1,
    day: opts.day ?? 1,
    weather,
    cards,
    zones,
    daemons: {},
    resources: {},
    flags: {},
  };
}

const SCHEMA_VERSION = 1;

interface SerializedGameState {
  readonly schemaVersion: number;
  readonly state: GameState;
}

export function serialize(state: GameState): string {
  const wrapper: SerializedGameState = { schemaVersion: SCHEMA_VERSION, state };
  return JSON.stringify(wrapper);
}

export function deserialize(serialized: string): GameState {
  const wrapper = JSON.parse(serialized) as SerializedGameState;
  if (wrapper.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `[game-state] Schema version mismatch: expected ${SCHEMA_VERSION}, got ${wrapper.schemaVersion}`,
    );
  }
  return wrapper.state;
}

// ────────────────────────────────────────────────────────────────────────────
// Pure mutations — return NEW GameState (immutability discipline)
// ────────────────────────────────────────────────────────────────────────────

export function withZoneState(
  state: GameState,
  zoneId: EntityId,
  patch: Partial<ZoneRuntimeState>,
): GameState {
  const existing = state.zones[zoneId];
  if (!existing) return state;
  return {
    ...state,
    zones: { ...state.zones, [zoneId]: { ...existing, ...patch } },
  };
}

export function withActiveZone(state: GameState, zoneId: EntityId | undefined): GameState {
  return { ...state, activeZoneId: zoneId };
}

export function withCardLocation(
  state: GameState,
  cardInstanceId: EntityId,
  location: CardInstanceState["location"],
): GameState {
  const existing = state.cards[cardInstanceId];
  if (!existing) return state;
  return {
    ...state,
    cards: { ...state.cards, [cardInstanceId]: { ...existing, location } },
  };
}

export function withResource(
  state: GameState,
  resourceId: ContentId,
  delta: number,
): GameState {
  const current = state.resources[resourceId] ?? 0;
  return {
    ...state,
    resources: { ...state.resources, [resourceId]: current + delta },
  };
}

export function withFlag(
  state: GameState,
  flag: string,
  value: boolean | number | string,
): GameState {
  return { ...state, flags: { ...state.flags, [flag]: value } };
}

export function withZoneEvent(
  state: GameState,
  zoneId: EntityId,
  eventId: ContentId,
): GameState {
  const existing = state.zones[zoneId];
  if (!existing) return state;
  return {
    ...state,
    zones: {
      ...state.zones,
      [zoneId]: { ...existing, activeEventIds: [...existing.activeEventIds, eventId] },
    },
  };
}
