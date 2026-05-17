/**
 * HexPlot — renders ONE hex plot: the hex-shaped ground tile + its fixtures.
 *
 * Per session 14 (2026-05-16) hex-baseline substrate. The plot OWNS its
 * contents — fixtures position relative to plot center, scale relative to
 * cell size. No free-standing world geometry.
 *
 * Ground = flat extruded hexagon (ShapeGeometry with depth via offset).
 * Elevation comes from the Plot data; non-zero elevation gets a side band
 * so the plot reads as a raised platform.
 */

"use client";

import { useMemo } from "react";

import {
  BufferGeometry,
  Float32BufferAttribute,
} from "three";

import { hexToWorld, hexVertices, type HexCoord } from "@/lib/hex";
import type { PlotT } from "@/lib/hex/plot";

import { PALETTE, ELEMENT_ROOF } from "../../world/palette";
import { DEFAULT_TOON_GRADIENT } from "../celShading";
import { jitterHex } from "../celVocab";
import { Bush } from "./Bush";
import { Character } from "./Character";
import { FallenLog } from "./FallenLog";
import { GrassField } from "./Grass";
import { Mushroom } from "./Mushroom";
import { Rock } from "./Rock";
import { Tree } from "./Tree";
import { WaterSurface } from "./WaterSurface";
import { Wildflower } from "./Wildflower";

// ── Foam-ring geometry for water plots ─────────────────────────────────────

/**
 * Builds a thin hex-shaped RING just inside the plot perimeter — gives the
 * toon water a hard "foam line" against neighboring land. Per Nightmare
 * Circus reference: the water's edge is the silhouette tell.
 */
function buildFoamRingGeometry(size: number, ringWidth: number): BufferGeometry {
  const outer = hexVertices(size);
  const inner = hexVertices(size - ringWidth);
  const positions: number[] = [];
  const normals: number[] = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const oa = outer[i], ob = outer[j];
    const ia = inner[i], ib = inner[j];
    // Two triangles per segment forming a thin band. Winding REVERSED
    // (per GPT-5.3-codex review 2026-05-17): previous CW-from-above order
    // was back-face culled by the overhead camera, making the foam ring
    // invisible — that's why water plots read as transparent.
    positions.push(oa[0], 0, oa[1], ib[0], 0, ib[1], ob[0], 0, ob[1]);
    positions.push(oa[0], 0, oa[1], ia[0], 0, ia[1], ib[0], 0, ib[1]);
    for (let k = 0; k < 6; k++) normals.push(0, 1, 0);
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  return geo;
}

// ── Terrain → hue ──────────────────────────────────────────────────────────

function terrainHue(plot: PlotT): string {
  if (plot.tintHex) return plot.tintHex;
  switch (plot.terrain) {
    case "grass":
      return PALETTE.grass;
    case "stone":
      return PALETTE.stone[0];
    case "water":
      // Basin is DARKER than the surface — fake depth so the toon water
      // surface reads as floating over deeper water.
      return PALETTE.seaDeep;
    case "sand":
      return PALETTE.sand;
    case "shrine":
      return ELEMENT_ROOF.wood;
    case "empty":
      return PALETTE.fog;
  }
}

// ── Hex ground geometry ────────────────────────────────────────────────────

/**
 * Build the hex cap as a NEIGHBOR-AWARE corner-blended triangle fan.
 *
 * Per session 14 (2026-05-16) operator feedback: small elevation steps
 * read as "choppy" hard walls when they should read as soft hills. Big
 * elevation steps should still cliff hard. This is height-classified
 * edge rendering (Civ V / Settlers / BattleTech lineage; Blender calls
 * it vertex weight blending + bevel-by-angle).
 *
 * Each of the 6 hex CORNERS sits at a Y that's the AVERAGE of:
 *   - this tile's elevation
 *   - neighbour elevations across the 2 edges meeting at that corner
 *     — but ONLY when their delta is below `hillThreshold`
 *
 * When delta < HILL_THRESHOLD → corner blends toward the lower neighbour
 *                                → cap visibly slopes down → soft hill.
 * When delta ≥ HILL_THRESHOLD → corner stays at this tile's elevation
 *                                → cap stays flat → hard cliff (paired
 *                                  with a vertical wall, see cliff builder).
 *
 * Vertex colors: 1.0 at center, 0.78 at perimeter — fake AO via radial
 * smoothstep. Combined with the height blending, tiles read as soft
 * mounds when they're hills and as flat caps when they're cliffs.
 */
function buildHexCapGeometry(
  size: number,
  thisElev: number,
  cornerElevs: readonly number[], // 6 values — y for each corner
): BufferGeometry {
  const verts = hexVertices(size);
  const n = verts.length;
  const inradius = (Math.sqrt(3) / 2) * size;

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Center vertex — always at this tile's elevation, brightest color.
  positions.push(0, thisElev, 0);
  colors.push(1, 1, 1);

  // 6 corner vertices — each at its blended Y, dimmer color (fake AO).
  for (let i = 0; i < n; i++) {
    positions.push(verts[i][0], cornerElevs[i], verts[i][1]);
    // Smoothstep radial darkening — corners are perimeter so use 0.78.
    const t = 1; // corners are at inradius * ~1
    const ease = t * t * (3 - 2 * t);
    const v = 1 - ease * 0.22;
    colors.push(v, v, v);
  }

  // Triangle fan from center. Winding REVERSED (corner_(i+1) before
  // corner_i) so faces normals point UP when viewed from above; previous
  // order made faces back-faced from the overhead camera (caps invisible).
  for (let i = 0; i < n; i++) {
    indices.push(0, 1 + ((i + 1) % n), 1 + i);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  // inradius reference kept for callers that compose; not used here yet.
  void inradius;
  return geo;
}

/**
 * Build PER-EDGE cliff walls as TWISTED QUADS. Each wall's 4 corners
 * carry potentially different Y values:
 *   - top corners = THIS tile's blended corner Ys at the 2 edge endpoints
 *   - bot corners = NEIGHBOR's blended corner Ys at the SAME world points
 *
 * This is the corner-Y-consistency fix: walls always meet the neighbor's
 * actual rendered cap surface, even when cap-blending has lifted the
 * neighbor's corners above its base elevation.
 *
 * Edge → neighbor mapping (flat-top hex):
 *   edge i → neighbor at HEX_DIRECTIONS index (6 - i) % 6.
 *
 * Corner mapping across an edge (T crosses to N):
 *   T.edge_i.leftCorner  (= T.vertex_i)        = N.vertex_(i+4)%6
 *   T.edge_i.rightCorner (= T.vertex_(i+1)%6)  = N.vertex_(i+3)%6
 */
function buildHexCliffWall(
  size: number,
  ownCornerYs: readonly number[], // 6 — this tile's blended corner Ys
  edgeBottomYs: readonly (readonly [number, number])[], // 6 — [leftY, rightY] per edge
  minWallHeight: number = 0.005,
): BufferGeometry | null {
  const verts = hexVertices(size);
  const positions: number[] = [];
  const normals: number[] = [];
  let anyWalls = false;

  for (let i = 0; i < verts.length; i++) {
    const topL = ownCornerYs[i];
    const topR = ownCornerYs[(i + 1) % 6];
    const [botL, botR] = edgeBottomYs[i];

    // Only render where THIS tile is above the neighbor at either corner.
    // If both ends are at/below neighbor's surface, no wall needed.
    const maxDrop = Math.max(topL - botL, topR - botR);
    if (maxDrop <= minWallHeight) continue;

    anyWalls = true;
    const a = verts[i];
    const b = verts[(i + 1) % 6];
    const ex = b[0] - a[0];
    const ez = b[1] - a[1];
    const len = Math.hypot(ex, ez) || 1;
    const nx = ez / len;
    const nz = -ex / len;

    // Twisted quad: 4 corners may have 4 different Ys.
    const tL: [number, number, number] = [a[0], topL, a[1]];
    const tR: [number, number, number] = [b[0], topR, b[1]];
    const bL: [number, number, number] = [a[0], botL, a[1]];
    const bR: [number, number, number] = [b[0], botR, b[1]];
    // Two triangles, CCW from OUTSIDE. Verified via cross product 2026-05-17
    // (GPT-5.5-pro caught a FAGAN false-positive that briefly inverted this):
    // for edge vector e=(ex,0,ez), outward normal is (ez,0,-ex). Triangle
    // (tL,tR,bR) cross product = (+outward), confirming CCW outside.
    positions.push(...tL, ...tR, ...bR, ...tL, ...bR, ...bL);
    for (let k = 0; k < 6; k++) normals.push(nx, 0, nz);
  }

  if (!anyWalls) return null;
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  return geo;
}

// ── HexPlot renderer ───────────────────────────────────────────────────────

/**
 * Operator-pinned thresholds (session 14, 2026-05-16):
 *   delta < HILL_THRESHOLD → smooth blend (no wall)
 *   delta ≥ HILL_THRESHOLD → cliff wall renders at this edge
 * Above CLIFF_THRESHOLD reserved for future "sharp cliff face" variants
 * (visual cliff decorations, vines, etc.).
 */
export const HILL_THRESHOLD = 0.18;
export const CLIFF_THRESHOLD = 0.4;

/**
 * Compute the per-corner Y values for a tile's hex cap.
 *   - Average this tile's elev with each adjacent neighbor's elev WHEN
 *     within `hillThreshold`. Out-of-threshold neighbors are excluded
 *     (their delta is rendered as a cliff wall instead).
 *
 * Exported so HexScene can compute corner Ys for every tile globally,
 * then derive cliff wall bottom Ys from neighbors' corner Ys.
 *
 * Corner i is between edge (i-1+6)%6 and edge i. Edge i's neighbor lives
 * at HEX_DIRECTIONS[(6-i)%6].
 */
export function computeCornerElevs(
  thisElev: number,
  neighborElevs: readonly number[],
  hillThreshold: number,
): number[] {
  const out = new Array(6);
  for (let corner = 0; corner < 6; corner++) {
    const edgeLeft = (corner - 1 + 6) % 6;
    const edgeRight = corner;
    const neighborA = neighborElevs[(6 - edgeLeft) % 6];
    const neighborB = neighborElevs[(6 - edgeRight) % 6];
    const candidates: number[] = [thisElev];
    if (Math.abs(thisElev - neighborA) < hillThreshold) candidates.push(neighborA);
    if (Math.abs(thisElev - neighborB) < hillThreshold) candidates.push(neighborB);
    out[corner] = candidates.reduce((s, v) => s + v, 0) / candidates.length;
  }
  return out;
}

/** Edge i → adjacent neighbor's HEX_DIRECTIONS index. */
export function edgeToNeighborDir(edgeIndex: number): number {
  return (6 - edgeIndex) % 6;
}

interface HexPlotProps {
  readonly plot: PlotT;
  /** Hex cell size (circumradius). */
  readonly size: number;
  /** Bumped to reseed any fixture randomization that uses it. */
  readonly triggerKey?: number;
  /**
   * Pre-computed blended corner Ys for this tile (6 values, by corner index).
   * Computed globally in HexScene so neighbors see the same value at the
   * same world point. Falls back to plot.elevation everywhere if absent.
   */
  readonly cornerYs?: readonly [number, number, number, number, number, number];
  /**
   * Pre-computed cliff wall bottom Ys per edge. For each of the 6 edges,
   * [leftCornerBottomY, rightCornerBottomY] — the neighbor's corner Y at
   * the two shared corners of that edge. Walls render as twisted quads
   * spanning from THIS tile's cornerYs (top) to these values (bottom).
   */
  readonly edgeBottomYs?: readonly [
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
  ];
  /**
   * When true, fixtures (Tree / Mushroom / Wildflower / Rock) skip their
   * per-component `<LeafPuff>` rendering. The HexScene level mounts a
   * single `<InstancedLeafField>` that aggregates all leaves into one
   * InstancedMesh + one useFrame instead. Bush is out of scope.
   * Cycle: engine-substrate-2026-05-17 / sprint-2.
   */
  readonly suppressLeaves?: boolean;
}

export function HexPlot({
  plot,
  size,
  triggerKey = 0,
  cornerYs,
  edgeBottomYs,
  suppressLeaves = false,
}: HexPlotProps) {
  const [worldX, worldZ] = hexToWorld(plot.coord, size);
  const coordSeed = ((plot.coord.q | 0) * 73856093) ^ ((plot.coord.r | 0) * 19349663);
  const hue = jitterHex(terrainHue(plot), coordSeed, 0.07);

  const elev = plot.elevation;
  // Default to flat (all corners at this tile's elev) when no neighbor data.
  const corners: readonly number[] =
    cornerYs ?? [elev, elev, elev, elev, elev, elev];
  const edges: readonly (readonly [number, number])[] =
    edgeBottomYs ?? [
      [elev, elev], [elev, elev], [elev, elev],
      [elev, elev], [elev, elev], [elev, elev],
    ];

  // Cap geometry — corner Ys are pre-blended in HexScene.
  const capGeometry = useMemo(
    () => buildHexCapGeometry(size, elev, corners),
    [size, elev, corners],
  );

  // Cliff wall — twisted quad per edge, using pre-computed bottom Ys from
  // the neighbor's cap. Walls always meet the neighbor's surface exactly.
  const cliffGeometry = useMemo(
    () => buildHexCliffWall(size, corners, edges),
    [size, corners, edges],
  );

  // Foam ring geometry for water plots — sits just above the water surface
  // along the hex's inner perimeter.
  const foamGeometry = useMemo(() => {
    if (plot.terrain !== "water") return null;
    return buildFoamRingGeometry(size, Math.max(0.06, size * 0.08));
  }, [plot.terrain, size]);

  // Skip empty plots entirely.
  if (plot.terrain === "empty") return null;

  return (
    <group position={[worldX, 0, worldZ]}>
      {/* Cap with corner-blended Y baked into the geometry — sharp corners
       *  mesh with every neighbor at every grid vertex, and small elevation
       *  deltas read as soft hills (no wall needed). */}
      <mesh geometry={capGeometry} castShadow={false} receiveShadow>
        <meshToonMaterial
          color={hue}
          gradientMap={DEFAULT_TOON_GRADIENT}
          vertexColors
        />
      </mesh>

      {/* Cliff wall — only for edges where this tile is meaningfully
       *  HIGHER than its neighbor (delta > HILL_THRESHOLD). */}
      {cliffGeometry && (
        <mesh geometry={cliffGeometry} castShadow={false} receiveShadow>
          <meshToonMaterial
            color={jitterHex(hue, coordSeed + 41, 0.08)}
            gradientMap={DEFAULT_TOON_GRADIENT}
          />
        </mesh>
      )}

      {/* Water plots: animated cel surface + foam ring.
       *  Per GPT-5.5-pro review 2026-05-17: with deep basin (elev -0.25) +
       *  cliff-classified neighbors (corners stay at -0.25), the previous
       *  formula put water at world Y -0.225, BELOW the PreviewPane's
       *  ground plane at y=-0.005 — water tile completely hidden by ground.
       *  Fix: clamp to a minimum world Y safely above the ground plane,
       *  accounting for max wave trough displacement.
       *
       *  Constants:
       *    GROUND_PLANE_Y = -0.005  (PreviewPane backdrop plane)
       *    WAVE_AMP = size * 0.012
       *    WAVE_PEAK_FACTOR = 1.6   (max |sin + 0.6*cos|)
       *    MIN_HEADROOM_ABOVE_GROUND = 0.012 */}
      {plot.terrain === "water" && (() => {
        const GROUND_PLANE_Y = -0.005;
        const WAVE_AMP = size * 0.012;
        const WAVE_PEAK_FACTOR = 1.6;
        const cornerMax = Math.max(
          corners[0], corners[1], corners[2],
          corners[3], corners[4], corners[5],
        );
        const surfaceY = Math.max(
          cornerMax + 0.025,
          GROUND_PLANE_Y + WAVE_AMP * WAVE_PEAK_FACTOR + 0.012,
        );
        const foamY = surfaceY + WAVE_AMP * WAVE_PEAK_FACTOR + 0.006;
        return (
          <>
            <WaterSurface
              size={size}
              insetFraction={0.96}
              y={surfaceY}
              color={jitterHex(PALETTE.sea, coordSeed + 17, 0.05)}
              amplitude={WAVE_AMP}
              frequency={1.1}
              seed={coordSeed}
            />
            {foamGeometry && (
              <mesh
                geometry={foamGeometry}
                position={[0, foamY, 0]}
                receiveShadow={false}
              >
                <meshToonMaterial
                  color="#f3fafd"
                  gradientMap={DEFAULT_TOON_GRADIENT}
                />
              </mesh>
            )}
          </>
        );
      })()}

      {/* Fixtures placed on top — y coords sit on this tile's elevation. */}
      {plot.fixtures.map((fix, i) => {
        const fy = elev; // sit on cap
        const fx = fix.offset[0];
        const fz = fix.offset[1];
        const seed = fix.seed + triggerKey * 31;
        switch (fix.kind) {
          case "tree":
            return (
              <Tree
                key={i}
                position={[fx, fy, fz]}
                flavor={
                  (fix.variant as "green" | "autumn" | "sakura" | undefined) ??
                  "green"
                }
                scale={fix.scale}
                seed={seed}
                suppressLeaves={suppressLeaves}
              />
            );
          case "rock": {
            const rockShape =
              fix.variant === "slab"
                ? "slab"
                : fix.variant === "pebble"
                  ? "pebble"
                  : "boulder";
            return (
              <Rock
                key={i}
                position={[fx, fy, fz]}
                scale={fix.scale}
                shape={rockShape}
                seed={seed}
                suppressLeaves={suppressLeaves}
              />
            );
          }
          case "bush":
            return (
              <Bush
                key={i}
                position={[fx, fy, fz]}
                flavor={
                  (fix.variant as "green" | "autumn" | "sakura" | undefined) ??
                  "green"
                }
                scale={fix.scale}
                seed={seed}
              />
            );
          case "mushroom":
            return (
              <Mushroom
                key={i}
                position={[fx, fy, fz]}
                flavor={
                  (fix.variant as "honey" | "sakura" | "moss" | undefined) ??
                  "honey"
                }
                scale={fix.scale}
                seed={seed}
                suppressLeaves={suppressLeaves}
              />
            );
          case "wildflower":
            return (
              <Wildflower
                key={i}
                position={[fx, fy, fz]}
                flavor={
                  (fix.variant as "sakura" | "honey" | "green" | "autumn" | undefined) ??
                  "sakura"
                }
                scale={fix.scale}
                seed={seed}
                suppressLeaves={suppressLeaves}
              />
            );
          case "fallen-log":
            return (
              <FallenLog
                key={i}
                position={[fx, fy, fz]}
                scale={fix.scale}
                seed={seed}
                facing={fix.seed * 0.0007}
              />
            );
          case "grass-field":
            return (
              <GrassField
                key={i}
                center={[fx, fy, fz]}
                radius={fix.scale}
                count={Math.max(8, Math.floor(fix.scale * 40))}
                height={0.3}
                seed={seed}
              />
            );
          case "character":
            return (
              <Character
                key={i}
                position={[fx, fy, fz]}
                scale={fix.scale}
                facing={fix.seed * 0.0001}
                variant={fix.variant}
              />
            );
          case "structure":
            // Placeholder — simple box. Real structure primitive later.
            return (
              <mesh
                key={i}
                position={[fx, fy + fix.scale * 0.5, fz]}
                scale={[fix.scale, fix.scale, fix.scale]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshToonMaterial
                  color={PALETTE.wall}
                  gradientMap={DEFAULT_TOON_GRADIENT}
                />
              </mesh>
            );
        }
      })}
    </group>
  );
}
