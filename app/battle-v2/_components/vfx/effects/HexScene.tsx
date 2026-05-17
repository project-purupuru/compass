/**
 * HexScene — 7 plots composed on a hex grid: 1 center + 6 neighbors.
 *
 * Session 14 (2026-05-16) — biome+decorator substrate + global corner-Y
 * blending. Each plot's cap corners are computed GLOBALLY so all tiles
 * meeting at a corner agree on its Y position (when within hill
 * threshold). Cliff walls bottom-Ys come from the neighbor's corner Ys,
 * so walls always meet the neighbor's actual rendered cap.
 */

"use client";

import { useMemo } from "react";

import {
  BIOMES,
  decoratePlot,
  HEX_DIRECTIONS,
  hexAdd,
  hexKey,
  hexSpiral,
  hexToWorld,
  type BiomeIdT,
  type HexCoord,
} from "@/lib/hex";
import { type PlotT } from "@/lib/hex/plot";

import type { HexSceneConfigT } from "../VfxConfig";
import {
  computeCornerElevs,
  edgeToNeighborDir,
  HexPlot,
  HILL_THRESHOLD,
} from "./HexPlot";
import { HexDebugOverlay } from "./HexDebugOverlay";
import { HexOutline } from "./HexOutline";
import { InstancedLeafField } from "./InstancedLeafField";
import { gatherLeavesFromPlots } from "./leafExtractors";
import { PerfReadout } from "./PerfReadout";
import { Rain } from "./Rain";

interface HexScenePreviewProps {
  readonly config: HexSceneConfigT;
  readonly triggerKey: number;
}

// Ring-1 biome assignment KEYED BY COORD (per FAGAN 2026-05-17). Previously
// this was a positional array indexed by `(i - 1) % 6`, but `hexRing`
// iterates in [SW, S, E, NE, N, NW] order — positional indexing put biomes
// on the wrong tiles, which is why earlier "shrine-yard at SW" fixes were
// landing on the wrong geometry.
const RING_1_BIOMES: ReadonlyMap<string, BiomeIdT> = new Map([
  [hexKey({ q: 1, r: 0 }),  "glade"],          // E
  [hexKey({ q: 1, r: -1 }), "rocky-clearing"], // ENE
  [hexKey({ q: 0, r: -1 }), "shrine-yard"],    // N — the focal raised plot
  [hexKey({ q: -1, r: 0 }), "wetland"],        // WNW
  [hexKey({ q: -1, r: 1 }), "rocky-clearing"], // WSW
  [hexKey({ q: 0, r: 1 }),  "meadow"],         // S
]);
const FALLBACK_RING_BIOME: BiomeIdT = "meadow";

function buildPlot(
  coord: HexCoord,
  biomeId: BiomeIdT,
  worldSeed: number,
  hexSize: number,
): PlotT {
  const biome = BIOMES[biomeId];
  const fixtures = decoratePlot({ worldSeed, coord, hexSize, biome });
  const elevation =
    biome.terrain === "water"
      ? -0.25 // deeper basin gives wave headroom below grass neighbors
      : biome.terrain === "stone"
        ? 0.16
        : biome.terrain === "shrine"
          ? 0.55
          : biome.terrain === "grass" && biome.id === "glade"
            ? 0.04
            : 0;
  return {
    coord,
    terrain: biome.terrain,
    elevation,
    fixtures,
    edges: ["flat", "flat", "flat", "flat", "flat", "flat"],
  };
}

/**
 * Corner-mapping across an edge:
 *   T.edge_i.leftCorner  (T.vertex_i)        = N.vertex_(i+4)%6
 *   T.edge_i.rightCorner (T.vertex_(i+1)%6)  = N.vertex_(i+3)%6
 *
 * So when fetching the bottom-Y for T's edge i wall, we look up neighbor
 * N's corner Y at those mapped indices.
 */
function edgeBottomY(
  edge: number,
  neighborCornerYs: readonly number[] | undefined,
  fallback: number,
): readonly [number, number] {
  if (!neighborCornerYs) return [fallback, fallback];
  return [neighborCornerYs[(edge + 4) % 6], neighborCornerYs[(edge + 3) % 6]];
}

export function HexScenePreview({
  config,
  triggerKey,
}: HexScenePreviewProps) {
  const worldSeed = config.scatterSeed + triggerKey * 7919;

  const plots = useMemo(() => {
    const coords = hexSpiral({ q: 0, r: 0 }, 1);
    const out: PlotT[] = [];
    out.push(buildPlot(coords[0], "meadow", worldSeed, config.hexSize));
    for (let i = 1; i < coords.length; i++) {
      const biomeId =
        RING_1_BIOMES.get(hexKey(coords[i])) ?? FALLBACK_RING_BIOME;
      out.push(buildPlot(coords[i], biomeId, worldSeed, config.hexSize));
    }
    return out;
  }, [worldSeed, config.hexSize]);

  // Global elevation map.
  const elevMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const plot of plots) map.set(hexKey(plot.coord), plot.elevation);
    return map;
  }, [plots]);

  // Per-tile neighbor elevations (6 directions, indexed by HEX_DIRECTIONS).
  // Missing neighbors fall back to the tile's own elevation.
  const neighborElevsMap = useMemo(() => {
    const map = new Map<string, readonly number[]>();
    for (const plot of plots) {
      const elevs = HEX_DIRECTIONS.map((d) =>
        elevMap.get(hexKey(hexAdd(plot.coord, d))) ?? plot.elevation,
      );
      map.set(hexKey(plot.coord), elevs);
    }
    return map;
  }, [plots, elevMap]);

  // Global corner-Y map — every tile's blended corner Ys, computed ONCE
  // so each pair of adjacent tiles can see exactly what its neighbor's
  // corner Y is at any shared point.
  const cornerYsMap = useMemo(() => {
    const map = new Map<string, readonly number[]>();
    for (const plot of plots) {
      const neighborElevs = neighborElevsMap.get(hexKey(plot.coord))!;
      const corners = computeCornerElevs(plot.elevation, neighborElevs, HILL_THRESHOLD);
      map.set(hexKey(plot.coord), corners);
    }
    return map;
  }, [plots, neighborElevsMap]);

  // ECS instanced-leaf data — only computed when the alternate render path
  // is ON. When OFF, leaves render via per-fixture <LeafPuff> as before.
  // Cycle: engine-substrate-2026-05-17 / sprint-2.
  const instancedLeafSpecs = useMemo(() => {
    if (!config.useInstancedLeaves) return null;
    const plotWorldPositions = plots.map(
      (p) => hexToWorld(p.coord, config.hexSize) as [number, number],
    );
    return gatherLeavesFromPlots(plots, plotWorldPositions);
  }, [config.useInstancedLeaves, plots, config.hexSize]);

  // Per-tile per-edge cliff wall bottom Ys (2 per edge, from neighbor's
  // corner Ys at the shared corners).
  const edgeBottomYsMap = useMemo(() => {
    const map = new Map<
      string,
      readonly [
        readonly [number, number], readonly [number, number],
        readonly [number, number], readonly [number, number],
        readonly [number, number], readonly [number, number],
      ]
    >();
    for (const plot of plots) {
      const ownCornerYs = cornerYsMap.get(hexKey(plot.coord))!;
      const edges = new Array(6) as Array<readonly [number, number]>;
      for (let i = 0; i < 6; i++) {
        const neighborDir = edgeToNeighborDir(i);
        const neighborCoord = hexAdd(plot.coord, HEX_DIRECTIONS[neighborDir]);
        const neighborCornerYs = cornerYsMap.get(hexKey(neighborCoord));
        if (neighborCornerYs) {
          edges[i] = edgeBottomY(i, neighborCornerYs, plot.elevation);
        } else {
          // No neighbor — fall back to this tile's own corner Ys (so no
          // wall renders, since maxDrop = 0).
          edges[i] = [ownCornerYs[i], ownCornerYs[(i + 1) % 6]];
        }
      }
      map.set(
        hexKey(plot.coord),
        edges as unknown as readonly [
          readonly [number, number], readonly [number, number],
          readonly [number, number], readonly [number, number],
          readonly [number, number], readonly [number, number],
        ],
      );
    }
    return map;
  }, [plots, cornerYsMap]);

  return (
    <group>
      {plots.map((plot) => {
        const cornerYs = cornerYsMap.get(hexKey(plot.coord)) as
          | readonly [number, number, number, number, number, number]
          | undefined;
        const edges = edgeBottomYsMap.get(hexKey(plot.coord));
        return (
          <HexPlot
            key={`${plot.coord.q},${plot.coord.r}`}
            plot={plot}
            size={config.hexSize}
            triggerKey={triggerKey}
            cornerYs={cornerYs}
            edgeBottomYs={edges}
            suppressLeaves={config.useInstancedLeaves}
          />
        );
      })}

      {/* ECS instanced-leaf path — ONE InstancedMesh + ONE useFrame for
       *  ALL hex-plot leaves across the scene. Mounted only when the
       *  useInstancedLeaves toggle is ON; fixtures suppress their per-
       *  component <LeafPuff> so leaves aren't drawn twice. */}
      {config.useInstancedLeaves && instancedLeafSpecs && instancedLeafSpecs.length > 0 && (
        <InstancedLeafField specs={instancedLeafSpecs} />
      )}

      {config.showOutline && (
        <HexOutline
          coords={plots.map((p) => p.coord)}
          size={config.hexSize}
          color={config.outlineColor}
          opacity={config.outlineOpacity}
          yOffset={0.08}
        />
      )}

      {config.debugPerf && <PerfReadout />}

      {config.rainEnabled && (
        <Rain
          tiles={plots
            .slice(0, Math.max(1, Math.min(7, Math.round(config.rainTileCount))))
            .map((p) => p.coord)}
          hexSize={config.hexSize}
          count={Math.max(50, Math.round(config.rainDropCount))}
          ceilingY={config.hexSize * 1.6}
          groundY={-0.05}
        />
      )}

      {(config.debugLabels ||
        config.debugCornerDots ||
        config.debugCapWireframe ||
        config.debugAxes) && (
        <HexDebugOverlay
          caps={plots.map((p) => ({
            coord: p.coord,
            biomeLabel:
              p.coord.q === 0 && p.coord.r === 0
                ? "meadow"
                : RING_1_BIOMES.get(hexKey(p.coord)) ?? FALLBACK_RING_BIOME,
            elevation: p.elevation,
            cornerYs: cornerYsMap.get(hexKey(p.coord)) ?? [
              p.elevation, p.elevation, p.elevation,
              p.elevation, p.elevation, p.elevation,
            ],
          }))}
          size={config.hexSize}
          showLabels={config.debugLabels}
          showCornerDots={config.debugCornerDots}
          showCapWireframe={config.debugCapWireframe}
          showAxes={config.debugAxes}
        />
      )}
    </group>
  );
}
