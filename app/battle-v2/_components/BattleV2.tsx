/**
 * BattleV2 — top-level client component for the cycle-1 vertical slice.
 *
 * Per PRD r2 §5.5 + SDD r1 §5.
 *
 * Holds GameState · ContentDatabase · event-bus · input-lock · command-queue.
 * Owns the player-input → command-queue → resolver → event-bus pipeline.
 * Wires SequenceConsumer for presentation dramatization of the substrate truth.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ContentDatabase,
  GameState,
  SemanticEvent,
} from "@/lib/purupuru/contracts/types";
import { createCommandQueue } from "@/lib/purupuru/runtime/command-queue";
import { createEventBus } from "@/lib/purupuru/runtime/event-bus";
import { createInitialState } from "@/lib/purupuru/runtime/game-state";
import { createInputLockRegistry } from "@/lib/purupuru/runtime/input-lock";
import { resolve as resolverResolve } from "@/lib/purupuru/runtime/resolver";

import type { PackPayload } from "../page";

import { CardHandFan } from "./CardHandFan";
import { SequenceConsumer } from "./SequenceConsumer";
import { UiScreen } from "./UiScreen";
import { WorldMap } from "./WorldMap";

interface BattleV2Props {
  readonly pack: PackPayload;
}

export function BattleV2({ pack }: BattleV2Props) {
  // Build ContentDatabase client-side from plain data (functions can't cross
  // server→client boundary in Next.js).
  const content = useMemo<ContentDatabase>(() => {
    const cards = new Map(pack.cards.map((c) => [c.id, c]));
    const zones = new Map(pack.zones.map((z) => [z.id, z]));
    const events = new Map(pack.events.map((e) => [e.id, e]));
    const sequences = new Map(pack.sequences.map((s) => [s.id, s]));
    const elements = new Map(pack.elements.map((e) => [e.id, e]));
    return {
      getCardDefinition: (id) => cards.get(id),
      getZoneDefinition: (id) => zones.get(id),
      getEventDefinition: (id) => events.get(id),
      getPresentationSequence: (id) => sequences.get(id),
      getElementDefinition: (id) => elements.get(id),
    };
  }, [pack]);

  const uiScreen = pack.uiScreens[0];

  const bus = useMemo(() => createEventBus(), []);
  const lock = useMemo(() => createInputLockRegistry(bus), [bus]);
  const queue = useMemo(
    () => createCommandQueue({ bus, lock, content, playerOwnerId: "player" }),
    [bus, lock, content],
  );

  const [state, setState] = useState<GameState>(() =>
    createInitialState({
      runId: "battle-v2-session",
      dayElementId: "wood",
      hand: pack.cards.map((c) => ({
        instanceId: c.id,
        definitionId: c.id,
      })),
      zones: [
        { zoneId: "wood_grove", elementId: "wood", state: "Idle" },
        { zoneId: "water_harbor", elementId: "water", state: "Locked" },
        { zoneId: "fire_station", elementId: "fire", state: "Locked" },
        { zoneId: "metal_mountain", elementId: "metal", state: "Locked" },
        { zoneId: "earth_teahouse", elementId: "earth", state: "Locked" },
      ],
    }),
  );

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [armedCardId, setArmedCardId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<readonly SemanticEvent[]>([]);

  const handleSemanticEvent = useCallback((event: SemanticEvent) => {
    setEventLog((log) => [...log, event]);
  }, []);

  const handleCardClick = useCallback(
    (cardInstanceId: string) => {
      // Cycle-1 simplified: clicking a card arms it (UI-only). The actual
      // PlayCardCommand fires on subsequent zone click.
      if (lock.isLockedByOther("player")) return;
      setArmedCardId((prev) => (prev === cardInstanceId ? null : cardInstanceId));
      bus.emit({ type: "CardArmed", cardInstanceId });
    },
    [bus, lock],
  );

  const handleZoneClick = useCallback(
    (zoneId: string) => {
      if (!armedCardId) return;
      if (lock.isLockedByOther("player")) return;

      const result = queue.enqueue({
        type: "PlayCard",
        commandId: `cmd-${Date.now()}`,
        issuedAtTurn: state.turn,
        source: "player",
        cardInstanceId: armedCardId,
        target: { kind: "zone", zoneId },
      });

      if (!result.accepted) {
        // CardPlayRejected was emitted by the queue
        setArmedCardId(null);
        return;
      }

      // Drain + resolve.
      // Skip resolver-side CardCommitted re-emission — command-queue already
      // emitted it on the bus during enqueue (otherwise sequencer would fire
      // the wood_activation_sequence TWICE, triggering double-lock + 2× beats).
      // Resolver still includes CardCommitted in its semanticEvents output so
      // that resolver-only callers (golden replay tests) see the full sequence.
      const drained = queue.drain();
      let next = state;
      for (const cmd of drained) {
        const r = resolverResolve(next, cmd, content);
        next = r.nextState;
        for (const event of r.semanticEvents) {
          if (event.type === "CardCommitted") continue;
          bus.emit(event);
        }
      }
      setState(next);
      setArmedCardId(null);
    },
    [armedCardId, bus, content, lock, queue, state],
  );

  // Subscribe directly so semantic events feed the event log even outside
  // SequenceConsumer's lifecycle (which manages sequencer-side subscription).
  useEffect(() => {
    const unsub = bus.subscribeAll(handleSemanticEvent);
    return unsub;
  }, [bus, handleSemanticEvent]);

  const focusBanner = (
    <div className="focus-banner">
      <span className="focus-banner__label">Active Tide</span>
      <span className="focus-banner__value">{state.weather.activeElement}</span>
    </div>
  );

  return (
    <>
      <UiScreen
        screen={uiScreen}
        slots={{
          titleCartouche: <div className="title-cartouche">Purupuru</div>,
          focusBanner,
          tideIndicator: (
            <div className="tide-indicator">
              <span className="tide-indicator__stone tide-indicator__stone--active">{state.weather.activeElement}</span>
            </div>
          ),
          selectedCardPreview: (
            <div className="selected-card-preview">
              {armedCardId ? `Armed: ${armedCardId}` : "(none)"}
            </div>
          ),
          worldMap: (
            <WorldMap
              state={state}
              content={content}
              hoveredZoneId={hoveredZoneId}
              onZoneClick={handleZoneClick}
              onZoneHoverChange={setHoveredZoneId}
            />
          ),
          deckCounter: <div className="deck-counter">3</div>,
          cardHand: (
            <CardHandFan
              state={state}
              content={content}
              hoveredCardId={hoveredCardId}
              armedCardId={armedCardId}
              onCardClick={handleCardClick}
              onCardHoverChange={setHoveredCardId}
            />
          ),
          endTurnButton: (
            <button type="button" className="end-turn-button" disabled aria-label="End turn (cycle-2)">
              End Turn
            </button>
          ),
        }}
      />

      <SequenceConsumer bus={bus} content={content} lock={lock} />

      <details className="event-log">
        <summary>Event log ({eventLog.length})</summary>
        <ul>
          {eventLog.map((e, i) => (
            <li key={i}>{e.type}</li>
          ))}
        </ul>
      </details>
    </>
  );
}
