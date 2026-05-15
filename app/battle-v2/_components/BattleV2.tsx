/**
 * BattleV2 — top-level client component for the cycle-1 vertical slice.
 *
 * Per PRD r2 §5.5 + SDD r1 §5.
 *
 * Holds GameState · ContentDatabase · event-bus · input-lock · command-queue.
 * Owns the player-input → command-queue → resolver → event-bus pipeline.
 * Wires SequenceConsumer for presentation dramatization of the substrate truth.
 *
 * Session 7 (the playable truth): the orchestrator now also owns the
 * presentation-side keystone — the AnchorStore (where effects land) and the
 * live `activeBeat` (which beat the sequencer just fired). It threads both
 * down to the world + the VFX layer so the ritual has an *answer*.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ContentDatabase,
  ElementId,
  GameState,
  SemanticEvent,
} from "@/lib/purupuru/contracts/types";
import { createCommandQueue } from "@/lib/purupuru/runtime/command-queue";
import { createEventBus } from "@/lib/purupuru/runtime/event-bus";
import { createInitialState } from "@/lib/purupuru/runtime/game-state";
import { createInputLockRegistry } from "@/lib/purupuru/runtime/input-lock";
import { resolve as resolverResolve } from "@/lib/purupuru/runtime/resolver";
import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";
import type { ClashEvent } from "@/lib/cards/battle";
import { useClashEvents } from "@/lib/runtime/react";

import type { PackPayload } from "../page";

import { createAnchorStore } from "./anchors/anchorStore";
import { ClashArena } from "./clash/ClashArena";
import { EntityPanel, type SelectedEntity } from "./hud/EntityPanel";
import { HudOverlay } from "./hud/HudOverlay";
import { TideIndicator } from "./hud/TideIndicator";
import { SequenceConsumer } from "./SequenceConsumer";
import { UiScreen } from "./UiScreen";
import { VfxLayer } from "./vfx/VfxLayer";
import { WorldMap } from "./WorldMap";
import { WorldView } from "./WorldView";

type RewardGrantedEvent = Extract<SemanticEvent, { type: "RewardGranted" }>;

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

  // Presentation keystone: one shared screen-space position store. Components
  // that own real refs (the hand, the grove mesh, the daemon) write into it;
  // the beat-driven VFX read from it. Created once, lives for the session.
  const anchorStore = useMemo(() => createAnchorStore(), []);

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

  const [armedCardId, setArmedCardId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  // The unified trace: lib/purupuru SemanticEvents AND the clash's ClashEvents.
  const [eventLog, setEventLog] = useState<readonly (SemanticEvent | ClashEvent)[]>([]);

  // The live beat — which beat the sequencer just fired. A NEW BeatFireRecord
  // object per fire, so VFX components keyed on `activeBeat` re-trigger even
  // when the same beat fires twice across two plays. THE WIRE.
  const [activeBeat, setActiveBeat] = useState<BeatFireRecord | null>(null);
  const handleBeatFired = useCallback((record: BeatFireRecord) => {
    setActiveBeat(record);
  }, []);

  // The last reward the substrate granted — RewardRead consumes this.
  const [lastReward, setLastReward] = useState<RewardGrantedEvent | null>(null);

  // Render mode: 2D (CSS · cycle-1 placeholder) vs 3D (R3F · evolution).
  // Toggled via ?3d=1 query param. Default: 3D (the new direction).
  // Set ?3d=0 to fall back to the CSS WorldMap for comparison.
  const [render3D, setRender3D] = useState<boolean>(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("3d");
    if (flag === "0" || flag === "false") setRender3D(false);
    else setRender3D(true);
  }, []);

  const handleSemanticEvent = useCallback((event: SemanticEvent) => {
    setEventLog((log) => [...log, event]);
    if (event.type === "RewardGranted") setLastReward(event);
  }, []);

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

  // ── The clash → world seam, driven off the engine's event stream ─────────
  // The MatchEngine publishes a ClashEvent trace. We both LOG it — so the
  // clash is observable in the event log, the same discipline as the
  // SemanticEvent bus — and turn each ClashResolved into an `activationLevel`
  // delta on the winner's territory. The existing world reads `activationLevel`
  // and *expresses* it: the grove thickens, the bear colony swarms. The map
  // keeps the score. Cycle-1: only the wood grove (the player's side) is
  // visually wired; the opponent's territory accrues correct data for later.
  const handleClashEvent = useCallback((ev: ClashEvent) => {
    setEventLog((log) => [...log, ev]);
    if (ev.type !== "ClashResolved" || ev.winner === "draw") return;
    const zoneId = ev.winner === "player" ? "wood_grove" : "fire_station";
    setState((prev) => {
      const zone = prev.zones[zoneId];
      if (!zone) return prev;
      return {
        ...prev,
        zones: {
          ...prev.zones,
          [zoneId]: { ...zone, activationLevel: zone.activationLevel + 1 },
        },
      };
    });
    // A player win springs the grove: GroveGrowth keys its tree spring-in on
    // the `impact_seedling` beat; BearColony reads `activationLevel` directly.
    if (ev.winner === "player") {
      setActiveBeat({
        beatId: "impact_seedling",
        target: "wood_grove",
        targetKind: "anchor",
        atMs: performance.now(),
        resolved: true,
        action: "play_vfx",
      });
    }
  }, []);
  useClashEvents(handleClashEvent);

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

  // EntityPanel is summoned by selection — an armed card, or a hovered zone.
  // Emptiness is structural: when nothing is selected, the panel is absent.
  const selectedEntity = useMemo<SelectedEntity | null>(() => {
    if (armedCardId) {
      const def = content.getCardDefinition(armedCardId);
      if (def) {
        return {
          kind: "card",
          name: def.id.replace(/_/g, " "),
          elementId: def.elementId,
          flavor: `${def.cardType} · ${def.verbs.join(" · ")}`,
          stateLabel: "Armed",
          stateValue: `${def.cost.energy}⚡`,
        };
      }
    }
    if (hoveredZoneId) {
      const zone = state.zones[hoveredZoneId];
      if (zone) {
        return {
          kind: "zone",
          name: hoveredZoneId.replace(/_/g, " "),
          elementId: zone.elementId,
          flavor: `${zone.elementId} district`,
          stateLabel: zone.state,
          stateValue: `lv ${zone.activationLevel}`,
        };
      }
    }
    return null;
  }, [armedCardId, hoveredZoneId, content, state.zones]);

  return (
    <>
      <UiScreen
        screen={uiScreen}
        slots={{
          titleCartouche: <div className="title-cartouche">Purupuru</div>,
          focusBanner,
          tideIndicator: (
            <TideIndicator activeElement={state.weather.activeElement as ElementId} />
          ),
          selectedCardPreview: (
            <div className="selected-card-preview">
              {armedCardId ? `Armed: ${armedCardId}` : "(none)"}
            </div>
          ),
          worldMap: render3D ? (
            <WorldView
              state={state}
              content={content}
              hoveredZoneId={hoveredZoneId}
              onZoneClick={handleZoneClick}
              onZoneHoverChange={setHoveredZoneId}
              anchorStore={anchorStore}
              activeBeat={activeBeat}
            />
          ) : (
            <WorldMap
              state={state}
              content={content}
              hoveredZoneId={hoveredZoneId}
              onZoneClick={handleZoneClick}
              onZoneHoverChange={setHoveredZoneId}
            />
          ),
        }}
      />

      {/* The playable clash — arrange a lineup, lock in, the world expresses
          the result. State + cadence live in the MatchEngine Effect service;
          this is a pure overlay layer (z-index 20). The clash → world seam is
          the engine's event stream (useClashEvents above).
          Spec: grimoires/loa/context/17-battle-v2-game-model-reconciliation.md */}
      <ClashArena />

      <EntityPanel entity={selectedEntity} />

      {/* Additive HUD zones from the operator fence brief (2026-05-14):
          StonesColumn F6 · WorldFocusRail F4 · CaretakerCorner F12.
          Spec: grimoires/loa/context/14-battle-v2-hud-zone-map.md */}
      <HudOverlay state={state} hoveredZoneId={hoveredZoneId} />

      <VfxLayer anchorStore={anchorStore} activeBeat={activeBeat} reward={lastReward} />

      <SequenceConsumer
        bus={bus}
        content={content}
        lock={lock}
        onBeatFired={handleBeatFired}
      />

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
