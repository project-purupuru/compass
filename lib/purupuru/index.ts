/**
 * Purupuru namespace public exports — `PURUPURU_RUNTIME` + `PURUPURU_CONTENT`
 * registry-shaped constants per PRD r2 FR-25 + SDD r1 §2.4.
 *
 * Cycle-1: cycle-1 worktree does NOT have lib/registry/index.ts (S7-only).
 * AC-12 (registry integration) is DEFERRED to cycle-2 when branches merge.
 * The exports here are READY to be imported into lib/registry/index.ts the
 * moment that file lands on this branch.
 */

import * as actorRegistry from "./presentation/actor-registry";
import * as anchorRegistry from "./presentation/anchor-registry";
import * as audioBusRegistry from "./presentation/audio-bus-registry";
import * as sequencer from "./presentation/sequencer";
import * as telemetryBrowserSink from "./presentation/telemetry-browser-sink";
import * as telemetryNodeSink from "./presentation/telemetry-node-sink";
import * as uiMountRegistry from "./presentation/ui-mount-registry";
import * as woodActivation from "./presentation/sequences/wood-activation";

import * as cardStateMachine from "./runtime/card-state-machine";
import * as commandQueue from "./runtime/command-queue";
import * as eventBus from "./runtime/event-bus";
import * as gameState from "./runtime/game-state";
import * as inputLock from "./runtime/input-lock";
import * as resolver from "./runtime/resolver";
import * as skyEyesMotifs from "./runtime/sky-eyes-motifs";
import * as uiStateMachine from "./runtime/ui-state-machine";
import * as zoneStateMachine from "./runtime/zone-state-machine";

import * as loader from "./content/loader";

/** Runtime substrate primitives (Reality + Contracts + State machines + Events). */
export const PURUPURU_RUNTIME = {
  createInitialState: gameState.createInitialState,
  serialize: gameState.serialize,
  deserialize: gameState.deserialize,
  withZoneState: gameState.withZoneState,
  withActiveZone: gameState.withActiveZone,
  withCardLocation: gameState.withCardLocation,
  withResource: gameState.withResource,
  withFlag: gameState.withFlag,
  withZoneEvent: gameState.withZoneEvent,
  createEventBus: eventBus.createEventBus,
  createInputLockRegistry: inputLock.createInputLockRegistry,
  checkLockExpiry: inputLock.checkLockExpiry,
  createCommandQueue: commandQueue.createCommandQueue,
  resolve: resolver.resolve,
  transitionUi: uiStateMachine.transitionUi,
  transitionCard: cardStateMachine.transitionCard,
  transitionZone: zoneStateMachine.transitionZone,
  getSkyEyeMotif: skyEyesMotifs.getSkyEyeMotif,
  SKY_EYES_MOTIFS: skyEyesMotifs.SKY_EYES_MOTIFS,
} as const;

/** Content + presentation primitives (Schemas + Hashes via PROVENANCE.md + Sequence). */
export const PURUPURU_CONTENT = {
  loadYaml: loader.loadYaml,
  loadPack: loader.loadPack,
  buildContentDatabase: loader.buildContentDatabase,
  inferKind: loader.inferKind,
  ContentValidationError: loader.ContentValidationError,
  WOOD_ACTIVATION_SEQUENCE: woodActivation.WOOD_ACTIVATION_SEQUENCE,
  createAnchorRegistry: anchorRegistry.createAnchorRegistry,
  createActorRegistry: actorRegistry.createActorRegistry,
  createUiMountRegistry: uiMountRegistry.createUiMountRegistry,
  createAudioBusRegistry: audioBusRegistry.createAudioBusRegistry,
  createSequencer: sequencer.createSequencer,
  createRafClock: sequencer.createRafClock,
  createTestClock: sequencer.createTestClock,
  classifyBeatTarget: sequencer.classifyBeatTarget,
  emitNodeTelemetry: telemetryNodeSink.emitNodeTelemetry,
  emitBrowserTelemetry: telemetryBrowserSink.emitBrowserTelemetry,
  pickTelemetrySink: telemetryBrowserSink.pickTelemetrySink,
  resolveTelemetryTrailPath: telemetryNodeSink.resolveTrailPath,
} as const;

/** Re-export contracts for convenient consumption. */
export type * from "./contracts/types";
