/**
 * WorldScene — the one continuous Tsuheji scene.
 *
 * Per build doc Session 10. Session 9's two crossfading Canvases collapse into
 * THIS — a single scene the RaptorCamera flies over. The painted continent is
 * the ground; the 5 districts sit on it at their canonical positions; the
 * camera soars, stoops, hovers, climbs.
 *
 * Absorbs what WorldOverview + ZoneScene used to be: there are no longer
 * "separate scenes," only one continent and a camera that goes where the
 * action is.
 */

"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";

import type {
  ElementId,
  GameState,
  ZoneRuntimeState,
} from "@/lib/purupuru/contracts/types";
import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import type { AnchorStore } from "../anchors/anchorStore";
import { DaemonReact } from "../vfx/DaemonReact";
import type { Vec2 } from "./agents/steering";
import { BearColony } from "./BearColony";
import { CloudLayer } from "./CloudLayer";
import { Foliage, mulberry32 } from "./Foliage";
import { GroveGrowth } from "./GroveGrowth";
import { buildGroveTrees, groveTreeCount } from "./groveLayout";
import { sampleOnLand } from "./landmass";
import { MistLayer } from "./MistLayer";
import { groundHeight, MapGround } from "./MapGround";
import { PaperPuppetField } from "./PaperPuppetField";
import { ELEMENT_GLOW, PALETTE } from "./palette";
import { RaptorCamera } from "./RaptorCamera";
import { RegionMap } from "./RegionMap";
import { RegionWeather } from "./RegionWeather";
import { WoodStockpile } from "./WoodStockpile";
import {
  MUSUBI_HUB,
  SORA_TOWER,
  ZONE_POSITIONS,
  zoneById,
  type ZonePlacement,
} from "./zones";
import { ZoneStructure } from "./ZoneStructure";

// ── Sora Tower — Sky-eyes' perch, the raptor's vantage made literal ─────────

function SoraTower() {
  return (
    <group position={[SORA_TOWER.x, groundHeight(), SORA_TOWER.z]}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.72, 0.5, 8]} />
        <meshStandardMaterial color={PALETTE.wallShade} roughness={1} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 1.7, 8]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[0.6, 0.7, 8]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      <Billboard position={[0, 1.35, 0]}>
        <Text
          fontSize={0.4}
          color={PALETTE.ink}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor={PALETTE.parchment}
        >
          塔
        </Text>
      </Billboard>
    </group>
  );
}

// ── Villagers — seeded chibi placeholders, clustered around the districts ───

interface NPCSpec {
  readonly x: number;
  readonly z: number;
  readonly elementId: ElementId;
  readonly scale: number;
  readonly seed: number;
}

function buildVillagers(): NPCSpec[] {
  const rand = mulberry32(0xb00b1e);
  const out: NPCSpec[] = [];
  for (const zone of ZONE_POSITIONS) {
    const n = zone.zoneId === "wood_grove" ? 8 : 3;
    for (let i = 0; i < n; i++) {
      // Rejection-sampled onto the continent — villagers stand on land.
      const p = sampleOnLand(zone.x, zone.z, 4.8, rand);
      if (!p) continue;
      out.push({
        x: p[0],
        z: p[1],
        elementId: zone.elementId,
        scale: 0.7 + rand() * 0.4,
        seed: out.length + 1,
      });
    }
  }
  return out;
}

const ELEMENT_IDS: readonly ElementId[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];

function VillagerBatch({
  specs,
  elementId,
  activeElement,
}: {
  readonly specs: readonly NPCSpec[];
  readonly elementId: ElementId;
  readonly activeElement: ElementId;
}) {
  const bodyRef = useRef<InstancedMesh>(null);
  const headRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tint = ELEMENT_GLOW[elementId];

  const syncInstances = useCallback(
    (t: number) => {
      const body = bodyRef.current;
      const head = headRef.current;
      if (!body || !head) return;

      const groundY = groundHeight();
      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const isActive = spec.elementId === activeElement;
        const speed = (1 + (spec.seed % 7) * 0.15) * (isActive ? 2.1 : 1);
        const floatY = (0.05 + (spec.seed % 5) * 0.02) * (isActive ? 1.8 : 1);
        const bob = Math.sin(t * speed + spec.seed) * floatY;
        const sway = Math.sin(t * speed * 1.7 + spec.seed) * (isActive ? 0.16 : 0.05);

        dummy.position.set(spec.x, groundY + (0.43 * spec.scale) + bob, spec.z);
        dummy.rotation.set(0, 0, sway);
        dummy.scale.setScalar(spec.scale);
        dummy.updateMatrix();
        body.setMatrixAt(i, dummy.matrix);

        dummy.position.set(spec.x, groundY + (0.75 * spec.scale) + bob, spec.z);
        dummy.updateMatrix();
        head.setMatrixAt(i, dummy.matrix);
      }

      body.instanceMatrix.needsUpdate = true;
      head.instanceMatrix.needsUpdate = true;
    },
    [activeElement, dummy, specs],
  );

  useLayoutEffect(() => {
    syncInstances(0);
  }, [syncInstances]);

  useFrame((frame) => {
    syncInstances(frame.clock.getElapsedTime());
  });

  if (specs.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={bodyRef}
        args={[undefined, undefined, specs.length]}
        castShadow
        frustumCulled={false}
      >
        <coneGeometry args={[0.16, 0.4, 8]} />
        <meshStandardMaterial color={tint} roughness={0.85} />
      </instancedMesh>
      <instancedMesh
        ref={headRef}
        args={[undefined, undefined, specs.length]}
        castShadow
        frustumCulled={false}
      >
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#f4e6cf" roughness={0.7} />
      </instancedMesh>
    </group>
  );
}

function VillagerSwarm({
  villagers,
  activeElement,
}: {
  readonly villagers: readonly NPCSpec[];
  readonly activeElement: ElementId;
}) {
  const batches = useMemo(
    () =>
      ELEMENT_IDS.map((elementId) => ({
        elementId,
        specs: villagers.filter((spec) => spec.elementId === elementId),
      })),
    [villagers],
  );

  return (
    <group>
      {batches.map((batch) => (
        <VillagerBatch
          key={batch.elementId}
          specs={batch.specs}
          elementId={batch.elementId}
          activeElement={activeElement}
        />
      ))}
    </group>
  );
}

// ── WorldScene ──────────────────────────────────────────────────────────────

interface WorldSceneProps {
  readonly state: GameState;
  readonly hoveredZoneId: string | null;
  readonly onZoneClick: (zoneId: string) => void;
  readonly onZoneHoverChange: (zoneId: string | null) => void;
  readonly anchorStore: AnchorStore;
  readonly activeBeat: BeatFireRecord | null;
  /** Which district the raptor is stooped on (null = soaring overview). */
  readonly focusDistrict: ZonePlacement | null;
}

export function WorldScene({
  state,
  hoveredZoneId,
  onZoneClick,
  onZoneHoverChange,
  anchorStore,
  activeBeat,
  focusDistrict,
}: WorldSceneProps) {
  const activeElement = state.weather.activeElement;
  const villagers = useMemo(buildVillagers, []);
  const woodGrove = zoneById("wood_grove");

  // ── Session 12: the grove juice loop ────────────────────────────────────
  // The grove remembers via the substrate — tree count + colony size are
  // f(activationLevel). The bears run an autonomous supply loop; their haul
  // lands on the stockpile at Musubi Station.
  const grove = useMemo<Vec2>(
    () => ({ x: woodGrove?.x ?? 0, z: woodGrove?.z ?? 0 }),
    [woodGrove],
  );
  const hub = useMemo<Vec2>(() => ({ x: MUSUBI_HUB.x, z: MUSUBI_HUB.z }), []);
  const activationLevel = state.zones["wood_grove"]?.activationLevel ?? 0;
  const groveTreePool = useMemo(() => buildGroveTrees(grove), [grove]);
  const treePositions = useMemo<readonly Vec2[]>(
    () => groveTreePool.slice(0, groveTreeCount(activationLevel)).map((t) => t.pos),
    [groveTreePool, activationLevel],
  );
  // Live deliveries this session — pure presentation, the colony's heartbeat.
  const [delivered, setDelivered] = useState(0);
  const handleDeliver = useCallback(() => setDelivered((d) => d + 1), []);

  return (
    <>
      {/* Warm cozy daylight — hemisphere bounce + a soft warm key. */}
      <hemisphereLight args={[PALETTE.sky, PALETTE.skyGround, 0.92]} />
      <directionalLight
        position={[14, 22, 8]}
        intensity={1.15}
        color={PALETTE.sunWarm}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={64}
      />
      <ambientLight intensity={0.2} />

      <MapGround />
      {/* The elemental territories — Sky-eyes' read of the world. Five element
          regions washed over the continent, the active one brighter, the
          coastline traced. */}
      <RegionMap activeElement={activeElement} />
      {/* Foliage dresses the continent — rejection-sampled onto land, clear
          enough that the map still reads. */}
      <Foliage innerRadius={6} ringDepth={14} treeCount={42} bushCount={28} />
      {/* Session 12: the active element's territory does something the eye
          reads as weather (D3) — drifting motes + a soft light wash. */}
      <RegionWeather activeElement={activeElement} />
      {/* The raptor flies ABOVE the clouds — a soft halo of cumulus around
          the continent's edges, a few drifting over the map. Casts shadows
          inside the directional light's bounds (gentle moving cloud-shade). */}
      <CloudLayer />
      {/* Noise-modulated ground mist — two stacked drifting layers that read
          as patches hugging the lowlands. The Luminist "memory of fog." */}
      <MistLayer />
      <SoraTower />
      {woodGrove ? (
        <DaemonReact
          anchorStore={anchorStore}
          activeBeat={activeBeat}
          position={[woodGrove.x + 1.5, 1.35, woodGrove.z + 0.5]}
        />
      ) : null}

      {/* Session 12: the grove juice loop — trees grow with activation, the
          bear colony works the grove autonomously, the haul stacks at Musubi. */}
      <GroveGrowth
        activationLevel={activationLevel}
        grove={grove}
        activeBeat={activeBeat}
      />
      <BearColony
        activationLevel={activationLevel}
        grove={grove}
        hub={hub}
        trees={treePositions}
        onDeliver={handleDeliver}
      />
      <WoodStockpile delivered={delivered} hub={hub} />

      {/* Paper-puppet jani VILLAGES — 4 puppets per active zone in a loose
       * cluster around the zone center. Cycle-1 matchup = wood vs water per
       * project_battle-v2-zone-composition: only 2 zones populated, not all 5.
       * Future: activeElements driven by GameState match config. */}
      <PaperPuppetField
        activeElements={["wood", "water"]}
        variant="billboard"
        worldHeight={1.6}
      />

      <VillagerSwarm villagers={villagers} activeElement={activeElement} />

      {ZONE_POSITIONS.map((placement) => {
        const zoneState: ZoneRuntimeState = placement.decorative
          ? {
              zoneId: placement.zoneId,
              elementId: placement.elementId,
              state: "Locked",
              activeEventIds: [],
              activationLevel: 0,
            }
          : state.zones[placement.zoneId] ?? {
              zoneId: placement.zoneId,
              elementId: placement.elementId,
              state: "Idle",
              activeEventIds: [],
              activationLevel: 0,
            };
        const isRitualTarget = placement.zoneId === "wood_grove";
        return (
          <ZoneStructure
            key={placement.zoneId}
            placement={placement}
            state={zoneState}
            hovered={hoveredZoneId === placement.zoneId}
            decorative={!!placement.decorative}
            onClick={() => onZoneClick(placement.zoneId)}
            onPointerOver={() => onZoneHoverChange(placement.zoneId)}
            onPointerOut={() => onZoneHoverChange(null)}
            isRitualTarget={isRitualTarget}
            anchorStore={isRitualTarget ? anchorStore : undefined}
            activeBeat={isRitualTarget ? activeBeat : null}
          />
        );
      })}

      <RaptorCamera focusDistrict={focusDistrict} />
    </>
  );
}
