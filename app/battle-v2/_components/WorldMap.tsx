/**
 * WorldMap — top-down 5-zone view.
 *
 * Per PRD r2 FR-20a + OD-1 path B: 1 schema-backed wood_grove + 4 decorative
 * locked tiles (water_harbor · fire_station · metal_mountain · earth_teahouse) +
 * Sora Tower at center.
 *
 * Cosmic-indigo void background · cream map-island · per-element zone tokens.
 */

"use client";

import { useMemo } from "react";

import type {
  ContentDatabase,
  GameState,
  ZoneRuntimeState,
} from "@/lib/purupuru/contracts/types";

import { ZoneToken } from "./ZoneToken";

const DECORATIVE_TILES: ReadonlyArray<{
  readonly zoneId: string;
  readonly elementId: ZoneRuntimeState["elementId"];
  readonly position: { top: string; left: string };
}> = [
  { zoneId: "water_harbor", elementId: "water", position: { top: "20%", left: "20%" } },
  { zoneId: "fire_station", elementId: "fire", position: { top: "20%", left: "80%" } },
  { zoneId: "metal_mountain", elementId: "metal", position: { top: "75%", left: "20%" } },
  { zoneId: "earth_teahouse", elementId: "earth", position: { top: "75%", left: "80%" } },
];

const WOOD_GROVE_POSITION = { top: "50%", left: "30%" };
const SORA_TOWER_POSITION = { top: "50%", left: "55%" };

interface WorldMapProps {
  readonly state: GameState;
  readonly content: ContentDatabase;
  readonly hoveredZoneId: string | null;
  readonly onZoneClick: (zoneId: string) => void;
  readonly onZoneHoverChange: (zoneId: string | null) => void;
}

export function WorldMap({
  state,
  content,
  hoveredZoneId,
  onZoneClick,
  onZoneHoverChange,
}: WorldMapProps) {
  const woodGroveState = useMemo<ZoneRuntimeState>(() => {
    const fromState = state.zones["wood_grove"];
    if (fromState) return fromState;
    // Fallback synthetic state if not yet in GameState
    return {
      zoneId: "wood_grove",
      elementId: "wood",
      state: "Idle",
      activeEventIds: [],
      activationLevel: 0,
    };
  }, [state.zones]);

  void content; // available for future zone-definition lookups (cycle-2)

  return (
    <div className="world-map" data-day-element={state.weather.activeElement}>
      <div className="world-map__island">
        {/* Sora Tower at center · decorative · non-interactive */}
        <div
          className="sora-tower"
          style={{ top: SORA_TOWER_POSITION.top, left: SORA_TOWER_POSITION.left }}
          aria-label="Sora Tower"
        >
          <div className="sora-tower__glyph">塔</div>
        </div>

        {/* The 1 schema-backed wood_grove zone */}
        <div
          className="zone-slot"
          style={{ top: WOOD_GROVE_POSITION.top, left: WOOD_GROVE_POSITION.left }}
        >
          <ZoneToken
            zoneId="wood_grove"
            state={woodGroveState}
            uiState={hoveredZoneId === "wood_grove" ? "hovered" : "idle"}
            onClick={() => onZoneClick("wood_grove")}
            onMouseEnter={() => onZoneHoverChange("wood_grove")}
            onMouseLeave={() => onZoneHoverChange(null)}
          />
        </div>

        {/* 4 decorative locked tiles · render but do not accept commands */}
        {DECORATIVE_TILES.map((tile) => (
          <div
            key={tile.zoneId}
            className="zone-slot zone-slot--decorative"
            style={tile.position}
          >
            <ZoneToken
              zoneId={tile.zoneId}
              state={{
                zoneId: tile.zoneId,
                elementId: tile.elementId,
                state: "Locked",
                activeEventIds: [],
                activationLevel: 0,
              }}
              decorative
            />
          </div>
        ))}

        {/* Chibi Kaori at the wood grove */}
        <div
          className="kaori-chibi"
          style={{ top: WOOD_GROVE_POSITION.top, left: WOOD_GROVE_POSITION.left }}
          aria-label="Chibi Kaori at the wood grove"
        >
          <div className="kaori-chibi__glyph">🌸</div>
        </div>
      </div>
    </div>
  );
}
