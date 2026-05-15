/**
 * /battle-v2/world-preview — additive preview route for Session 9.
 *
 * Wiring `WorldView` into `BattleV2.tsx` is held: the worktree has concurrent
 * HUD work in that file (per the concurrent-worktree-isolation rule — stay
 * additive, don't edit another agent's in-flight file). This route lets the
 * overview ⇄ zone architecture be touched and reviewed in isolation, with a
 * faked beat sequence standing in for the substrate's sequencer.
 *
 * It exercises the REAL `WorldView` state machine — the only mocks are the
 * GameState, an inert ContentDatabase, and the beat timeline.
 */

"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type {
  ContentDatabase,
  ElementId,
  GameState,
  ZoneRuntimeState,
} from "@/lib/purupuru/contracts/types";
import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import { createAnchorStore } from "../_components/anchors/anchorStore";
import { VfxLayer } from "../_components/vfx/VfxLayer";
import { WorldView } from "../_components/WorldView";
import "../_styles/battle-v2.css";

// Mirrors lib/purupuru/.../wood-activation.ts beat offsets — the timeline only.
const FAKE_BEATS: readonly { readonly id: string; readonly atMs: number }[] = [
  { id: "lock_input", atMs: 0 },
  { id: "card_anticipation", atMs: 0 },
  { id: "launch_petal_arc", atMs: 120 },
  { id: "impact_seedling", atMs: 720 },
  { id: "kaori_gesture", atMs: 940 },
  { id: "daemon_reaction", atMs: 1040 },
  { id: "reward_preview", atMs: 1680 },
  { id: "unlock_input", atMs: 2280 },
];

function makeZone(
  zoneId: string,
  elementId: ElementId,
  state: ZoneRuntimeState["state"],
): ZoneRuntimeState {
  return {
    zoneId,
    elementId,
    state,
    activeEventIds: [],
    activationLevel: state === "Active" ? 1 : 0,
  };
}

function mockState(activeZoneId: string | undefined): GameState {
  return {
    runId: "world-preview",
    turn: 1,
    day: 1,
    weather: { activeElement: "wood", intensity: 1, scope: "localized" },
    activeZoneId,
    cards: {},
    zones: {
      wood_grove: makeZone(
        "wood_grove",
        "wood",
        activeZoneId === "wood_grove" ? "Active" : "Idle",
      ),
      water_harbor: makeZone("water_harbor", "water", "Locked"),
      fire_station: makeZone("fire_station", "fire", "Locked"),
      metal_mountain: makeZone("metal_mountain", "metal", "Locked"),
      earth_teahouse: makeZone("earth_teahouse", "earth", "Locked"),
    },
    daemons: {},
    resources: {},
    flags: {},
  };
}

const INERT_CONTENT: ContentDatabase = {
  getCardDefinition: () => undefined,
  getZoneDefinition: () => undefined,
  getEventDefinition: () => undefined,
  getPresentationSequence: () => undefined,
  getElementDefinition: () => undefined,
};

export default function WorldPreviewPage() {
  const anchorStore = useMemo(() => createAnchorStore(), []);
  const [activeZoneId, setActiveZoneId] = useState<string | undefined>(undefined);
  const [activeBeat, setActiveBeat] = useState<BeatFireRecord | null>(null);
  const timersRef = useRef<number[]>([]);

  const state = useMemo(() => mockState(activeZoneId), [activeZoneId]);

  const runRitual = useCallback((zoneId: string) => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (zoneId !== "wood_grove") return; // only the wood grove is playable in V1
    setActiveZoneId("wood_grove");
    for (const beat of FAKE_BEATS) {
      timersRef.current.push(
        window.setTimeout(() => {
          setActiveBeat({
            beatId: beat.id,
            target: "ui.input",
            targetKind: "input",
            atMs: beat.atMs,
            resolved: true,
            action: "wait",
          });
          if (beat.id === "unlock_input") setActiveZoneId(undefined);
        }, beat.atMs),
      );
    }
  }, []);

  return (
    <main className="battle-v2-shell">
      <div style={{ position: "fixed", inset: 0 }}>
        <WorldView
          state={state}
          content={INERT_CONTENT}
          hoveredZoneId={null}
          onZoneClick={runRitual}
          onZoneHoverChange={() => {}}
          anchorStore={anchorStore}
          activeBeat={activeBeat}
        />
      </div>

      <VfxLayer anchorStore={anchorStore} activeBeat={activeBeat} reward={null} />

      <button
        type="button"
        onClick={() => runRitual("wood_grove")}
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          padding: "0.7rem 1.4rem",
          background: "oklch(0.22 0.03 95 / 0.92)",
          color: "var(--island-bg)",
          border: "1px solid var(--wood-vivid)",
          borderRadius: 8,
          font: "inherit",
          fontSize: "0.8rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        ▶ Demo — enter the Wood Grove
      </button>

      <p
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 50,
          margin: 0,
          font: "inherit",
          fontSize: "0.7rem",
          color: "var(--island-bg)",
          opacity: 0.7,
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        Session 9 preview — world overview ⇄ zone scenes. Click the Wood Grove
        district (or the button) to transition into its scene; it returns on
        ritual end. Petals need the hand anchor (BattleV2 only) — the bloom +
        camera lean fire here.
      </p>
    </main>
  );
}
