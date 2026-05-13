/**
 * Pure functional resolver — `(GameState, Command, ContentDatabase) → ResolveResult`.
 *
 * Per PRD r2 D4 + SDD r1 §3.5 / §7.
 *
 * Implements 5 active resolver-step ops per PRD FR-13 (post-flatline):
 *   activate_zone · spawn_event · grant_reward · set_flag · add_resource
 *
 * Plus 1 reserved op per Q-SDD-4 forward-compatibility:
 *   daemon_assist (no-op stub returning rejected.reason="unimplemented")
 *
 * Implements 5 commands:
 *   PlayCard (full pipe) · EndTurn (no-op stub emits TurnEnded marker) ·
 *   ActivateZone · SpawnEvent · GrantReward (system-only)
 *
 * NEVER touches DOM/audio/UI. Pure function (AC-6: same input → same output).
 *
 * Daemon-read prevention (FR-14a / Opus MED-5): this file MUST NOT import the
 * `daemons` getter from `game-state.ts`. Static grep test enforces.
 */

import type {
  CardDefinition,
  ContentDatabase,
  ElementId,
  EntityId,
  GameCommand,
  GameState,
  PlayCardCommand,
  ResolverStep,
  ResolveResult,
  SemanticEvent,
  SemanticMarker,
  TargetRef,
  ZoneEventDefinition,
} from "../contracts/types";
import {
  withActiveZone,
  withCardLocation,
  withFlag,
  withResource,
  withZoneEvent,
  withZoneState,
} from "./game-state";

// ────────────────────────────────────────────────────────────────────────────
// Public entry point
// ────────────────────────────────────────────────────────────────────────────

export function resolve(
  state: GameState,
  command: GameCommand,
  content: ContentDatabase,
): ResolveResult {
  switch (command.type) {
    case "PlayCard":
      return resolvePlayCard(state, command, content);
    case "EndTurn":
      return resolveEndTurn(state);
    case "ActivateZone":
      return resolveActivateZoneCommand(state, command);
    case "SpawnEvent":
      return resolveSpawnEventCommand(state, command, content);
    case "GrantReward":
      return resolveGrantRewardCommand(state, command);
    default: {
      const _exhaustive: never = command;
      void _exhaustive;
      return { nextState: state, semanticEvents: [], rejected: { reason: "unknown_command" } };
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PlayCard — the full cycle-1 pipeline
// ────────────────────────────────────────────────────────────────────────────

function resolvePlayCard(
  state: GameState,
  command: PlayCardCommand,
  content: ContentDatabase,
): ResolveResult {
  const card = content.getCardDefinition(command.cardInstanceId);
  if (!card) {
    return {
      nextState: state,
      semanticEvents: [],
      rejected: { reason: "unknown_card_definition" },
    };
  }

  // Targeting validation
  const targetingError = validateTargeting(card, command.target, state);
  if (targetingError) {
    return {
      nextState: state,
      semanticEvents: [
        {
          type: "CardPlayRejected",
          cardInstanceId: command.cardInstanceId,
          reason: targetingError,
        },
      ],
      rejected: { reason: targetingError },
    };
  }

  // Emit CardCommitted (resolver-side · the command-queue ALSO emits but we
  // include here so resolver-only callers — replay tests — still see it).
  const events: SemanticEvent[] = [
    {
      type: "CardCommitted",
      cardInstanceId: command.cardInstanceId,
      cardDefinitionId: card.id,
      target: command.target,
    },
  ];

  // Move card into Resolving location
  let next = withCardLocation(state, command.cardInstanceId, "Resolving");

  // Execute the card's resolver steps (with full event/state propagation).
  for (const step of card.resolverSteps) {
    const stepResult = executeStep(next, step, command.target, content);
    next = stepResult.nextState;
    events.push(...stepResult.semanticEvents);
    // Recursively execute spawned-event resolver steps.
    if (step.op === "spawn_event") {
      const eventId = (step.args as { eventId?: string }).eventId;
      if (eventId) {
        const def = content.getEventDefinition(eventId);
        if (def) {
          for (const subStep of def.resolverSteps) {
            const subResult = executeStep(next, subStep, command.target, content);
            next = subResult.nextState;
            events.push(...subResult.semanticEvents);
          }
          events.push({ type: "ZoneEventResolved", zoneId: targetZoneId(command.target) ?? "", eventId });
        }
      }
    }
  }

  // Emit DaemonReacted for any resident daemons in the active zone.
  // Cycle-1: daemons have affectsGameplay: false, but the EVENT can still fire
  // (it's presentation-only signal · daemon ROUTINES don't change gameplay,
  //  but the reaction event is part of the semantic stream).
  const zoneId = targetZoneId(command.target);
  if (zoneId) {
    const zoneDef = content.getZoneDefinition(zoneId);
    const primaryDaemon = zoneDef?.residentDaemons?.[0];
    if (primaryDaemon) {
      events.push({
        type: "DaemonReacted",
        daemonId: primaryDaemon.daemonId,
        reactionSetId: primaryDaemon.reactionSetId ?? "",
        zoneId,
      });
    }
  }

  // Emit CardResolved (terminal · card moves to Discarded next tick via state machine)
  events.push({
    type: "CardResolved",
    cardInstanceId: command.cardInstanceId,
    cardDefinitionId: card.id,
  });

  return { nextState: next, semanticEvents: events };
}

// ────────────────────────────────────────────────────────────────────────────
// EndTurn — no-op stub emits TurnEnded marker
// ────────────────────────────────────────────────────────────────────────────

function resolveEndTurn(state: GameState): ResolveResult {
  const markers: SemanticMarker[] = [{ type: "TurnEnded" }];
  return {
    nextState: { ...state, turn: state.turn + 1 },
    semanticEvents: [],
    markers,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// System-only commands (cycle-1: no current invocation path; included for completeness)
// ────────────────────────────────────────────────────────────────────────────

function resolveActivateZoneCommand(
  state: GameState,
  command: { zoneId: EntityId; elementId: ElementId; activationLevelDelta: number },
): ResolveResult {
  return executeStep(
    state,
    {
      id: "system_activate_zone",
      op: "activate_zone",
      scope: "target_zone",
      args: { activationLevelDelta: command.activationLevelDelta },
    },
    { kind: "zone", zoneId: command.zoneId },
    /* content (unused for activate_zone): */ {} as ContentDatabase,
  );
}

function resolveSpawnEventCommand(
  state: GameState,
  command: { eventId: string; zoneId: EntityId },
  content: ContentDatabase,
): ResolveResult {
  return executeStep(
    state,
    {
      id: "system_spawn_event",
      op: "spawn_event",
      scope: "target_zone",
      args: { eventId: command.eventId },
    },
    { kind: "zone", zoneId: command.zoneId },
    content,
  );
}

function resolveGrantRewardCommand(
  state: GameState,
  command: { rewardType: string; id: string; quantity: number },
): ResolveResult {
  return executeStep(
    state,
    {
      id: "system_grant_reward",
      op: "grant_reward",
      scope: "self",
      args: { rewardType: command.rewardType, id: command.id, quantity: command.quantity },
    },
    { kind: "self" },
    {} as ContentDatabase,
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Step executor — dispatches on op
// ────────────────────────────────────────────────────────────────────────────

function executeStep(
  state: GameState,
  step: ResolverStep,
  target: TargetRef,
  content: ContentDatabase,
): ResolveResult {
  switch (step.op) {
    case "activate_zone":
      return opActivateZone(state, step, target);
    case "spawn_event":
      return opSpawnEvent(state, step, target);
    case "grant_reward":
      return opGrantReward(state, step);
    case "set_flag":
      return opSetFlag(state, step, target);
    case "add_resource":
      return opAddResource(state, step);
    case "daemon_assist":
      // Q-SDD-4 reserved op — cycle-1 no-op stub
      return {
        nextState: state,
        semanticEvents: [],
        rejected: { reason: "unimplemented_daemon_assist" },
      };
    default: {
      const _exhaustive: never = step.op;
      void _exhaustive;
      return { nextState: state, semanticEvents: [] };
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Op implementations
// ────────────────────────────────────────────────────────────────────────────

function opActivateZone(state: GameState, step: ResolverStep, target: TargetRef): ResolveResult {
  const zoneId = targetZoneId(target);
  if (!zoneId) return { nextState: state, semanticEvents: [] };
  const args = step.args as { setActiveZone?: boolean; activationLevelDelta?: number };
  const existing = state.zones[zoneId];
  if (!existing) return { nextState: state, semanticEvents: [] };
  const delta = args.activationLevelDelta ?? 1;
  let next = withZoneState(state, zoneId, {
    state: "Active",
    activationLevel: existing.activationLevel + delta,
  });
  if (args.setActiveZone) next = withActiveZone(next, zoneId);
  return {
    nextState: next,
    semanticEvents: [
      {
        type: "ZoneActivated",
        zoneId,
        elementId: existing.elementId,
        activationLevel: existing.activationLevel + delta,
      },
    ],
  };
}

function opSpawnEvent(state: GameState, step: ResolverStep, target: TargetRef): ResolveResult {
  const zoneId = targetZoneId(target);
  if (!zoneId) return { nextState: state, semanticEvents: [] };
  const args = step.args as { eventId?: string };
  const eventId = args.eventId;
  if (!eventId) return { nextState: state, semanticEvents: [] };
  const next = withZoneEvent(state, zoneId, eventId);
  return {
    nextState: next,
    semanticEvents: [{ type: "ZoneEventStarted", zoneId, eventId }],
  };
}

function opGrantReward(state: GameState, step: ResolverStep): ResolveResult {
  const args = step.args as { rewardType?: string; id?: string; quantity?: number };
  const rewardType = args.rewardType ?? "resource";
  const id = args.id ?? "";
  const quantity = args.quantity ?? 1;
  const next = rewardType === "resource" ? withResource(state, id, quantity) : state;
  return {
    nextState: next,
    semanticEvents: [{ type: "RewardGranted", rewardType, id, quantity }],
  };
}

function opSetFlag(state: GameState, step: ResolverStep, target: TargetRef): ResolveResult {
  const args = step.args as { flag?: string; value?: boolean | number | string };
  const flag = args.flag ?? "";
  const value = args.value ?? true;
  if (!flag) return { nextState: state, semanticEvents: [] };
  // Optional zone-id namespace: if flag references a zone-scoped flag (e.g.,
  // "wood_grove.seedling_awakened"), it's already namespaced in the YAML.
  void target;
  return { nextState: withFlag(state, flag, value), semanticEvents: [] };
}

function opAddResource(state: GameState, step: ResolverStep): ResolveResult {
  const args = step.args as { resourceId?: string; quantity?: number };
  const resourceId = args.resourceId ?? "";
  const quantity = args.quantity ?? 1;
  if (!resourceId) return { nextState: state, semanticEvents: [] };
  return {
    nextState: withResource(state, resourceId, quantity),
    semanticEvents: [
      { type: "RewardGranted", rewardType: "resource", id: resourceId, quantity },
    ],
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function targetZoneId(target: TargetRef): EntityId | undefined {
  if (target.kind === "zone") return target.zoneId;
  return undefined;
}

function validateTargeting(
  card: CardDefinition,
  target: TargetRef,
  state: GameState,
): string | null {
  if (card.targeting.mode === "none") return null;
  if (card.targeting.mode === "self" && target.kind !== "self") return "expected_self_target";
  if (card.targeting.mode === "zone") {
    if (target.kind !== "zone") return "expected_zone_target";
    const zone = state.zones[target.zoneId];
    if (!zone) return "unknown_zone";
    if (!card.targeting.validZoneElements.includes(zone.elementId)) {
      return "invalid_zone_element";
    }
  }
  return null;
}
