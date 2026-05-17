/**
 * BigRealmScene — the scale-test composer for cycle
 * hex-composition-scale-2026-05-17.
 *
 * Mounts an N×N grid of hex tiles, assigns each tile an element via
 * Voronoi clustering against 5 seeded centers (one per element), and
 * renders per-element SHARED ambient VFX layers (one LeafSwirl for all
 * wood tiles, one Mist for all water tiles, etc.) instead of per-zone.
 *
 * Reuses:
 *   - lib/wuxing/* (elements, time-of-day, resonance)
 *   - effects/{LeafSwirl, PollenMotes, Mist, RippleField, Embers,
 *              DustMotes, Sparks, PuruhaniWalker, ZoneMonument}
 *   - lib/hex utilities (hexToWorld, mulberry32 from world/Foliage)
 *
 * Does NOT reuse HexScene's biome+decorator+fixture-rendering yet — that
 * earns its keep in a future cycle. This composer focuses on the
 * substrate question: when N hex blocks compose, where does the
 * substrate's value emerge (and where does it bottleneck)?
 *
 * Operator decisions baked in (session-18 pair-point 2026-05-17):
 *   - Element distribution: Voronoi (clustered, world-like)
 *   - Walkers: operator-controlled count knob (0–N), per-walker useFrame
 *     for THIS cycle; ECS-ize-walkers is a future cycle's work
 *   - Ambient sharing: ONE InstancedMesh per element across ALL tiles
 *     of that element (the "ambientBindings" pool model)
 */

"use client";

import { useEffect, useMemo, useState } from "react";

import { Color, Fog } from "three";
import { useThree } from "@react-three/fiber";

import { hexToWorld, type HexCoord } from "@/lib/hex";
import { BIOMES, type BiomeIdT } from "@/lib/hex/biome";
import { decoratePlot } from "@/lib/hex/decorator";
import { type PlotT } from "@/lib/hex/plot";
import { ELEMENT_META, ALL_ELEMENTS, type ElementIdT } from "@/lib/wuxing/element";
import { resonanceMultiplier } from "@/lib/wuxing/resonance";
import {
  PHASE_PALETTE,
  timeOfDayFromDate,
  type TimeOfDayPhase,
} from "@/lib/wuxing/timeOfDay";

import type { BigRealmSceneConfigT } from "../VfxConfig";

import { DustMotes } from "./DustMotes";
import { Embers } from "./Embers";
import { HexOutline } from "./HexOutline";
import { HexPlot } from "./HexPlot";
import { LeafSwirl } from "./LeafSwirl";
import { Mist } from "./Mist";
import { PerfReadout } from "./PerfReadout";
import { PollenMotes } from "./PollenMotes";
import { PuruhaniWalker } from "./PuruhaniWalker";
import { RippleField } from "./RippleField";
import { Sparks } from "./Sparks";
import { ZoneMonument } from "./ZoneMonument";

// ── Element → biome mapping ───────────────────────────────────────────────

/**
 * Each wuxing element gets a flavor of biome from the existing
 * lib/hex/biome.ts catalog (no fire-specific biome exists yet; we map fire
 * to rocky-clearing for the scale-test until a `volcanic` biome is added).
 */
const ELEMENT_BIOME: Record<ElementIdT, BiomeIdT> = {
  wood: "glade",
  fire: "rocky-clearing",
  earth: "meadow",
  metal: "shrine-yard",
  water: "wetland",
};

// ── Grid generation ───────────────────────────────────────────────────────

interface TileSpec {
  readonly coord: HexCoord;
  readonly element: ElementIdT;
  readonly world: readonly [number, number];
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a rectangular hex grid of `cols × rows`. Coords are in axial (q, r);
 * the per-row offset shifts q by -floor(r/2) so consecutive rows interleave
 * naturally and hexToWorld produces a clean rectangular footprint.
 */
function buildHexGrid(cols: number, rows: number): HexCoord[] {
  const coords: HexCoord[] = [];
  const halfCols = Math.floor(cols / 2);
  const halfRows = Math.floor(rows / 2);
  for (let r = -halfRows; r < rows - halfRows; r++) {
    const rowOffset = -Math.floor(r / 2);
    for (let q = -halfCols + rowOffset; q < cols - halfCols + rowOffset; q++) {
      coords.push({ q, r });
    }
  }
  return coords;
}

/**
 * Voronoi-assign each tile an element. Seeds 5 centers (one per element)
 * deterministically from `seed`, then for each tile picks the element
 * whose center is closest in world space.
 */
function voronoiAssign(
  coords: readonly HexCoord[],
  hexSize: number,
  seed: number,
): TileSpec[] {
  const rand = mulberry32(seed);
  // Pick 5 center seeds within the grid extent.
  const worldCoords = coords.map((c) => hexToWorld(c, hexSize));
  const xs = worldCoords.map(([x]) => x);
  const zs = worldCoords.map(([, z]) => z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  const centers: ReadonlyArray<{
    element: ElementIdT;
    x: number;
    z: number;
  }> = ALL_ELEMENTS.map((element) => ({
    element,
    x: minX + rand() * (maxX - minX),
    z: minZ + rand() * (maxZ - minZ),
  }));

  return coords.map((coord, i) => {
    const [x, z] = worldCoords[i];
    let best = centers[0];
    let bestDist = Infinity;
    for (const c of centers) {
      const dx = c.x - x;
      const dz = c.z - z;
      const d = dx * dx + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return { coord, element: best.element, world: [x, z] as const };
  });
}

// ── Atmosphere driver (same shape as RealmScene) ──────────────────────────

function BigRealmAtmosphere({
  phase,
  fogDensity,
}: {
  phase: TimeOfDayPhase;
  fogDensity: number;
}) {
  const { scene } = useThree();
  const palette = PHASE_PALETTE[phase];
  useEffect(() => {
    scene.background = new Color(palette.skyBottom);
    scene.fog = new Fog(palette.fog, 24, 120 / Math.max(fogDensity, 0.001));
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, palette.skyBottom, palette.fog, fogDensity]);

  return (
    <>
      <ambientLight intensity={palette.ambientIntensity} color={palette.ambient} />
      <directionalLight
        position={[-12, 16, 8]}
        intensity={palette.directionalIntensity}
        color={palette.directional}
      />
    </>
  );
}

// ── Per-element shared ambient layer ──────────────────────────────────────

function SharedAmbientForElement({
  element,
  tiles,
  hexSize,
  intensity,
  config,
}: {
  element: ElementIdT;
  tiles: readonly HexCoord[];
  hexSize: number;
  intensity: number;
  config: BigRealmSceneConfigT;
}) {
  if (tiles.length === 0) return null;
  const seedBase = config.scatterSeed ^ element.length;

  switch (element) {
    case "wood":
      return (
        <>
          <LeafSwirl
            tiles={tiles}
            hexSize={hexSize}
            count={Math.max(0, Math.round(config.woodLeafCount * tiles.length))}
            palette={["#6fae3e", "#82bd52", "#5a9836", "#9bc77a"]}
            intensity={intensity}
            seed={0x1eaf ^ seedBase}
          />
          <PollenMotes
            tiles={tiles}
            hexSize={hexSize}
            count={Math.max(0, Math.round(config.woodPollenCount * tiles.length))}
            color="#e8c87a"
            intensity={intensity}
            seed={0xd011e ^ seedBase}
          />
        </>
      );
    case "water":
      return (
        <>
          <Mist
            tiles={tiles}
            hexSize={hexSize}
            count={Math.max(0, Math.round(config.waterMistCount * tiles.length))}
            color="#7ab8b8"
            intensity={intensity}
            seed={0xa1c5 ^ seedBase}
          />
          <RippleField
            tiles={tiles}
            hexSize={hexSize}
            count={Math.max(0, Math.round(config.waterRippleCount * tiles.length))}
            color="#6fd6c0"
            intensity={intensity}
            seed={0x12ee ^ seedBase}
          />
        </>
      );
    case "fire":
      return (
        <Embers
          tiles={tiles}
          hexSize={hexSize}
          count={Math.max(0, Math.round(config.fireEmberCount * tiles.length))}
          color="#ff7a3a"
          intensity={intensity}
          seed={0xf12e ^ seedBase}
        />
      );
    case "earth":
      return (
        <DustMotes
          tiles={tiles}
          hexSize={hexSize}
          count={Math.max(0, Math.round(config.earthDustCount * tiles.length))}
          color="#c09060"
          intensity={intensity}
          seed={0xea71 ^ seedBase}
        />
      );
    case "metal":
      return (
        <Sparks
          tiles={tiles}
          hexSize={hexSize}
          count={Math.max(0, Math.round(config.metalSparkCount * tiles.length))}
          color="#f0f4ff"
          intensity={intensity}
          seed={0x5121 ^ seedBase}
        />
      );
    default:
      return null;
  }
}

// ── Element glow disc per tile ────────────────────────────────────────────

function ElementGlowField({
  tiles,
  hexSize,
  intensity,
  color,
}: {
  tiles: readonly TileSpec[];
  hexSize: number;
  intensity: number;
  color: string;
}) {
  const opacity = 0.18 + 0.32 * Math.max(0, Math.min(1, intensity));
  return (
    <>
      {tiles.map((t, i) => (
        <mesh
          key={`glow-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[t.world[0], 0.025, t.world[1]]}
        >
          <circleGeometry args={[hexSize * 0.42, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

// ── Ground plane ───────────────────────────────────────────────────────────

function GroundPlane({ phase, gridSize }: { phase: TimeOfDayPhase; gridSize: number }) {
  const tint = useMemo(() => {
    const base = new Color(PHASE_PALETTE[phase].fog);
    base.multiplyScalar(0.5);
    return `#${base.getHexString()}`;
  }, [phase]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[gridSize * 2, gridSize * 2]} />
      <meshStandardMaterial color={tint} roughness={0.95} metalness={0} />
    </mesh>
  );
}

// ── Phase selection (mirror of RealmScene's useScenePhase) ────────────────

function useScenePhase(config: BigRealmSceneConfigT): TimeOfDayPhase {
  const [phase, setPhase] = useState<TimeOfDayPhase>(() =>
    config.useRealTime ? timeOfDayFromDate(new Date()).phase : config.phaseOverride,
  );
  useEffect(() => {
    if (!config.useRealTime) {
      setPhase(config.phaseOverride);
      return;
    }
    const tick = () => setPhase(timeOfDayFromDate(new Date()).phase);
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [config.useRealTime, config.phaseOverride]);
  return phase;
}

// ── Composer ───────────────────────────────────────────────────────────────

interface BigRealmScenePreviewProps {
  readonly config: BigRealmSceneConfigT;
  readonly triggerKey: number;
}

export function BigRealmScenePreview({
  config,
  triggerKey,
}: BigRealmScenePreviewProps) {
  void triggerKey;
  const phase = useScenePhase(config);

  // Build the grid + element assignments.
  const tiles = useMemo(() => {
    const coords = buildHexGrid(
      Math.max(1, Math.round(config.gridCols)),
      Math.max(1, Math.round(config.gridRows)),
    );
    return voronoiAssign(coords, config.hexSize, config.scatterSeed);
  }, [config.gridCols, config.gridRows, config.hexSize, config.scatterSeed]);

  // Build a fully-decorated PlotT per tile via the biome+decorator pipeline
  // (same path HexScene uses). This is where the scale-test gets its real
  // geometry weight — trees/bushes/rocks/mushrooms/wildflowers per tile.
  // Per session-18 operator feedback: element-glow discs alone don't stress
  // the substrate; the actual fixture content per tile does.
  const plots = useMemo(() => {
    if (!config.showTileContent) return [] as PlotT[];
    return tiles.map((t) => {
      const biomeId = ELEMENT_BIOME[t.element];
      const biome = BIOMES[biomeId];
      const fixtures = decoratePlot({
        worldSeed: config.scatterSeed ^ (t.coord.q * 73856093) ^ (t.coord.r * 19349663),
        coord: t.coord,
        hexSize: config.hexSize,
        biome,
      });
      const elevation =
        biome.terrain === "water"
          ? -0.18
          : biome.terrain === "stone"
            ? 0.12
            : biome.terrain === "shrine"
              ? 0.32
              : biome.terrain === "grass" && biome.id === "glade"
                ? 0.04
                : 0;
      const plot: PlotT = {
        coord: t.coord,
        terrain: biome.terrain,
        elevation,
        fixtures,
        edges: ["flat", "flat", "flat", "flat", "flat", "flat"],
        element: t.element,
      };
      return plot;
    });
  }, [config.showTileContent, tiles, config.hexSize, config.scatterSeed]);

  // Group tiles by element for shared ambients + outlines + monument placement.
  const tilesByElement = useMemo(() => {
    const buckets: Record<ElementIdT, TileSpec[]> = {
      wood: [],
      fire: [],
      earth: [],
      metal: [],
      water: [],
    };
    for (const t of tiles) buckets[t.element].push(t);
    return buckets;
  }, [tiles]);

  // Walker placement — distribute across tiles by element so the count
  // knob produces a visually-distributed wander set.
  const walkers = useMemo(() => {
    const n = Math.max(0, Math.round(config.walkerCount));
    if (n === 0) return [] as ReadonlyArray<{ element: ElementIdT; tiles: HexCoord[]; seed: number }>;
    const rand = mulberry32(config.scatterSeed ^ 0x77a16e7);
    const out: { element: ElementIdT; tiles: HexCoord[]; seed: number }[] = [];
    for (let i = 0; i < n; i++) {
      // Round-robin through elements with available tiles.
      const elements = ALL_ELEMENTS.filter((e) => tilesByElement[e].length > 0);
      if (elements.length === 0) break;
      const element = elements[i % elements.length];
      const bucket = tilesByElement[element];
      // Each walker gets a small sub-cluster of 1–3 tiles to wander within.
      const startIdx = Math.floor(rand() * bucket.length);
      const subCount = Math.min(bucket.length, 1 + Math.floor(rand() * 3));
      const sub: HexCoord[] = [];
      for (let k = 0; k < subCount; k++) {
        sub.push(bucket[(startIdx + k) % bucket.length].coord);
      }
      out.push({ element, tiles: sub, seed: 0xb0b0 ^ (i * 1009) });
    }
    return out;
  }, [config.walkerCount, config.scatterSeed, tilesByElement]);

  // Monuments — operator-controlled "show one per element when available".
  const monuments = useMemo(() => {
    if (!config.showMonuments) return [];
    return ALL_ELEMENTS.filter((e) => tilesByElement[e].length > 0).map(
      (element) => {
        const bucket = tilesByElement[element];
        // Anchor on the center-of-mass of the element's cluster for visual weight.
        const cx =
          bucket.reduce((s, t) => s + t.world[0], 0) / bucket.length;
        const cz =
          bucket.reduce((s, t) => s + t.world[1], 0) / bucket.length;
        return { element, position: [cx, 0, cz] as [number, number, number] };
      },
    );
  }, [config.showMonuments, tilesByElement]);

  return (
    <group>
      <BigRealmAtmosphere phase={phase} fogDensity={config.fogDensity} />
      <GroundPlane
        phase={phase}
        gridSize={Math.max(config.gridCols, config.gridRows) * config.hexSize * 1.5}
      />

      {/* Per-tile full hex content (terrain cap + fixtures + outlines) —
       *  this is the substrate's real workload at scale. Mirrors HexScene's
       *  per-plot rendering pattern. Skip when showTileContent is OFF so
       *  the operator can A/B substrate-only (just element discs + ambients)
       *  vs full-content scenes. */}
      {config.showTileContent &&
        plots.map((plot) => (
          <HexPlot
            key={`plot-${plot.coord.q},${plot.coord.r}`}
            plot={plot}
            size={config.hexSize}
            triggerKey={triggerKey}
          />
        ))}

      {/* Per-element glow discs — kept as a subtle ground tint overlay so
       *  the element-cluster pattern stays visible even with full content. */}
      {!config.showTileContent &&
        ALL_ELEMENTS.map((element) => (
          <ElementGlowField
            key={`glow-${element}`}
            tiles={tilesByElement[element]}
            hexSize={config.hexSize}
            intensity={
              config.ambientBase * resonanceMultiplier(element, phase)
            }
            color={ELEMENT_META[element].canonicalHue}
          />
        ))}

      {/* Optional outlines — heavy at scale; default OFF in config */}
      {config.showOutlines &&
        ALL_ELEMENTS.map((element) =>
          tilesByElement[element].length === 0 ? null : (
            <HexOutline
              key={`outline-${element}`}
              coords={tilesByElement[element].map((t) => t.coord)}
              size={config.hexSize}
              color={ELEMENT_META[element].canonicalHue}
              opacity={config.outlineOpacity}
              yOffset={0.08}
            />
          ),
        )}

      {/* SHARED per-element ambients — one InstancedMesh layer per element
       *  fed all tiles of that element across the entire grid. This is the
       *  scale benefit: 80 wood tiles → ONE LeafSwirl mesh, not 80. */}
      {config.showAmbients &&
        ALL_ELEMENTS.map((element) => (
          <SharedAmbientForElement
            key={`ambient-${element}`}
            element={element}
            tiles={tilesByElement[element].map((t) => t.coord)}
            hexSize={config.hexSize}
            intensity={
              config.ambientBase * resonanceMultiplier(element, phase)
            }
            config={config}
          />
        ))}

      {/* Walkers — per-walker useFrame for this cycle (ECS-ize is a future cycle). */}
      {config.showWalkers &&
        walkers.map((w, i) => (
          <PuruhaniWalker
            key={`walker-${i}`}
            tiles={w.tiles}
            hexSize={config.hexSize}
            element={w.element}
            heightWorld={config.hexSize * 0.55 * config.walkerScale}
            seed={w.seed}
          />
        ))}

      {/* Monuments — one per element at the element-cluster center of mass. */}
      {monuments.map((m, i) => (
        <group key={`monument-${i}`} position={m.position}>
          <ZoneMonument
            element={m.element}
            hexSize={config.hexSize}
            scale={config.monumentScale}
          />
        </group>
      ))}

      {config.debugPerf && <PerfReadout />}
    </group>
  );
}
