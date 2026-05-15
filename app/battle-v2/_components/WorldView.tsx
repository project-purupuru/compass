/**
 * WorldView — one Canvas, one camera, the view-state machine.
 *
 * Per build doc Session 10. Drop-in for the `worldMap` slot — same prop
 * surface BattleV2 + world-preview already pass.
 *
 * Session 9's two crossfading Canvases are GONE. The crossfade was the
 * "sickening" — two stationary-but-different images dissolving give zero
 * motion cues, so the brain reads a teleport. Now: ONE <Canvas>, ONE
 * continuous Tsuheji scene, ONE RaptorCamera that physically flies between
 * the soaring overview and a district. A coherent motion path the eye can
 * follow — that's the cure.
 *
 * View state is just `focusZoneId`:
 *   - null         → the raptor soars over the whole continent
 *   - "<zoneId>"   → the raptor stoops onto that district and HOLDS there
 *
 * "Stays in the zone" (operator ask): clicking a district stoops in and stays
 * — no auto-return on `unlock_input`. Leaving is an explicit ascend: the Esc
 * key, or the corner control.
 */

"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { NoToneMapping } from "three";

import type { ContentDatabase, GameState } from "@/lib/purupuru/contracts/types";
import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import type { AnchorStore } from "./anchors/anchorStore";
import { PALETTE } from "./world/palette";
import { PostFX } from "./world/PostFX";
import { WorldScene } from "./world/WorldScene";
import { zoneById } from "./world/zones";

interface WorldViewProps {
  readonly state: GameState;
  readonly content: ContentDatabase;
  readonly hoveredZoneId: string | null;
  readonly onZoneClick: (zoneId: string) => void;
  readonly onZoneHoverChange: (zoneId: string | null) => void;
  readonly anchorStore: AnchorStore;
  readonly activeBeat: BeatFireRecord | null;
}

export function WorldView({
  state,
  content,
  hoveredZoneId,
  onZoneClick,
  onZoneHoverChange,
  anchorStore,
  activeBeat,
}: WorldViewProps) {
  void content; // accepted for drop-in parity; the scene doesn't need it in V1

  // null = soaring overview · "<zoneId>" = stooped on that district.
  const [focusZoneId, setFocusZoneId] = useState<string | null>(null);

  // The Ghibli-warm post-processing pass is on by default. `?fx=0` mounts the
  // scene raw — the escape hatch for comparison + perf-constrained devices.
  const [postFX, setPostFX] = useState<boolean>(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = new URLSearchParams(window.location.search).get("fx");
    if (flag === "0" || flag === "false") setPostFX(false);
  }, []);

  // Click a district → the raptor stoops in AND STAYS. Also passes the click
  // through so a played card still fires its ritual in that district.
  const handleZoneClick = useCallback(
    (zoneId: string) => {
      setFocusZoneId(zoneId);
      onZoneClick(zoneId);
    },
    [onZoneClick],
  );

  const ascend = useCallback(() => setFocusZoneId(null), []);

  // Esc climbs back to the soar.
  useEffect(() => {
    if (!focusZoneId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ascend();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusZoneId, ascend]);

  const containerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  };

  const ascendButtonStyle: CSSProperties = {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 20,
    padding: "0.5rem 0.9rem",
    background: "oklch(0.22 0.03 95 / 0.92)",
    color: PALETTE.parchment,
    border: `1px solid ${PALETTE.wood}`,
    borderRadius: 7,
    font: "inherit",
    fontSize: "0.7rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    pointerEvents: "auto",
  };

  return (
    <div className="world-view" style={containerStyle}>
      <Canvas
        shadows="soft"
        camera={{ position: [2, 46, 36], fov: 42 }}
        // NoToneMapping — the PostFX ToneMapping effect owns tone mapping so it
        // isn't applied twice. With ?fx=0 the scene is intentionally raw/linear.
        gl={{ antialias: true, alpha: false, toneMapping: NoToneMapping }}
      >
        <color attach="background" args={[PALETTE.sky]} />
        {/* Far fog — at raptor altitude the whole continent stays crisp;
            fog only melts the void past the map's edge. */}
        <fog attach="fog" args={[PALETTE.fog, 70, 150]} />
        <Suspense fallback={null}>
          <WorldScene
            state={state}
            hoveredZoneId={hoveredZoneId}
            onZoneClick={handleZoneClick}
            onZoneHoverChange={onZoneHoverChange}
            anchorStore={anchorStore}
            activeBeat={activeBeat}
            focusDistrict={zoneById(focusZoneId ?? undefined) ?? null}
          />
        </Suspense>
        {/* The Ghibli-warm grade — tone curve, soft targeted bloom, gouache
            saturation, faint grain. Mounts last so it composites the scene. */}
        {postFX ? <PostFX /> : null}
      </Canvas>

      {/* Ascend — climb back to the soar. Only present while stooped in. */}
      {focusZoneId ? (
        <button type="button" onClick={ascend} style={ascendButtonStyle}>
          ↑ Ascend · Esc
        </button>
      ) : null}
    </div>
  );
}
