/**
 * ZoneStructure — a zone as a place: a stylized hut in a fenced plot.
 *
 * Per build doc Session 8. Replaces `ZoneToken3D` (the coloured box).
 *
 * Every zone is a warm-plaster hut with an element-tinted roof, sitting in a
 * dirt plot ringed by a low fence. The hut body is the procedural fallback for
 * a future `zone.<id>` GLB slot — but it's wrapped so the click/hover/state
 * behaviour lives on the zone group, not the model, so swapping the model
 * later changes nothing about how the zone *plays*.
 *
 * The wood grove additionally grows a real **seedling sprout** — that sprout
 * is `anchor.wood_grove.seedling_center` (the petals' destination) and it
 * carries the `impact_seedling` bloom spring. The anchor moved from "the box"
 * to an actual living thing in the plot; the screen-space contract is identical.
 *
 * Preserved from ZoneToken3D: click/hover, hover-lift, Active glow + breathe,
 * ValidTarget pulse, Locked dim, the bloom spring (now on the seedling).
 */

"use client";

import { useEffect, useRef } from "react";

import { Billboard, Instance, Instances, Text } from "@react-three/drei";
import type { Group } from "three";

import type { ElementId, ZoneRuntimeState } from "@/lib/purupuru/contracts/types";
import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import { ANCHOR, type AnchorStore } from "../anchors/anchorStore";
import { MeshAnchor } from "../anchors/useAnchorBinding";
import { SPRING_BLOOM, stepSpring } from "../vfx/springs";
import { ModelSlot } from "./modelSlot";
import { ELEMENT_GLOW, ELEMENT_KANJI, ELEMENT_ROOF, PALETTE } from "./palette";
import { groundHeight } from "./MapGround";
import {
  FENCE_POSTS_PER_ZONE,
  PLOT_RADIUS,
  buildFencePostTransforms,
} from "./renderBudget";
import { useThrottledFrame } from "./useThrottledFrame";
import type { ZonePlacement } from "./zones";

interface ZoneStructureProps {
  readonly placement: ZonePlacement;
  readonly state: ZoneRuntimeState;
  readonly hovered: boolean;
  readonly decorative: boolean;
  readonly onClick: () => void;
  readonly onPointerOver: () => void;
  readonly onPointerOut: () => void;
  readonly isRitualTarget?: boolean;
  readonly anchorStore?: AnchorStore;
  readonly activeBeat?: BeatFireRecord | null;
}

// ── The hut — procedural fallback for the `zone.<id>` GLB slot ───────────────

function Hut({ elementId, glow }: { elementId: ElementId; glow: number }) {
  const roof = ELEMENT_ROOF[elementId];
  const glowColor = ELEMENT_GLOW[elementId];
  return (
    <group>
      {/* wood-trim base */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.02, 0.12, 1.02]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={1} />
      </mesh>
      {/* plaster body */}
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.7, 0.9]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.95} />
      </mesh>
      {/* door */}
      <mesh position={[0, 0.27, 0.455]} castShadow>
        <boxGeometry args={[0.26, 0.4, 0.06]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={1} />
      </mesh>
      {/* hip roof — element-tinted, the eye reads the village by its roofs */}
      <mesh position={[0, 1.06, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.86, 0.62, 4]} />
        <meshStandardMaterial
          color={roof}
          roughness={0.85}
          emissive={glowColor}
          emissiveIntensity={glow * 0.5}
        />
      </mesh>
    </group>
  );
}

// ── The seedling — wood grove only · the petals' destination ────────────────

const SeedlingSprout = ({ objectRef }: { objectRef: React.RefObject<Group | null> }) => (
  <group ref={objectRef} position={[0, 0, 0]}>
    {/* stem */}
    <mesh position={[0, 0.16, 0]} castShadow>
      <cylinderGeometry args={[0.025, 0.04, 0.32, 5]} />
      <meshStandardMaterial color={PALETTE.canopyGreen[2]} roughness={1} />
    </mesh>
    {/* bud */}
    <mesh position={[0, 0.36, 0]} castShadow>
      <icosahedronGeometry args={[0.11, 0]} />
      <meshStandardMaterial color={PALETTE.canopyGreen[0]} roughness={0.9} flatShading />
    </mesh>
    {/* two leaves */}
    <mesh position={[0.1, 0.22, 0]} rotation={[0, 0, -0.7]} castShadow>
      <icosahedronGeometry args={[0.07, 0]} />
      <meshStandardMaterial color={PALETTE.canopyGreen[1]} roughness={0.9} flatShading />
    </mesh>
    <mesh position={[-0.1, 0.26, 0.02]} rotation={[0, 0, 0.7]} castShadow>
      <icosahedronGeometry args={[0.06, 0]} />
      <meshStandardMaterial color={PALETTE.canopyGreen[1]} roughness={0.9} flatShading />
    </mesh>
  </group>
);

// ── Fence ring — low posts around the plot ──────────────────────────────────

function FenceRing() {
  return (
    <Instances limit={FENCE_POSTS_PER_ZONE} castShadow>
      <boxGeometry args={[0.08, 0.4, 0.08]} />
      <meshStandardMaterial color={PALETTE.wood} roughness={1} />
      {buildFencePostTransforms().map((post, index) => (
        <Instance key={index} position={post.position} />
      ))}
    </Instances>
  );
}

// ── ZoneStructure ───────────────────────────────────────────────────────────

export function ZoneStructure({
  placement,
  state,
  hovered,
  decorative,
  onClick,
  onPointerOver,
  onPointerOut,
  isRitualTarget = false,
  anchorStore,
  activeBeat,
}: ZoneStructureProps) {
  const hutGroup = useRef<Group>(null);
  const seedlingRef = useRef<Group>(null);
  const groundY = groundHeight();

  const isInteractive = !decorative && state.state !== "Locked";
  const isActive = state.state === "Active";
  const isValidTarget = state.state === "ValidTarget";

  // The bloom spring — heavy (mass 1.2 · stiffness 180 · damping 14). On
  // `impact_seedling` the seedling gets a kick: dips to 0.97, a velocity throw
  // carries it past 1.0, then it rings down. The world catches a thrown thing.
  const bloom = useRef({ value: 1, velocity: 0 });
  const bloomActive = useRef(false);
  useEffect(() => {
    if (!isRitualTarget) return;
    if (activeBeat?.beatId !== "impact_seedling") return;
    bloom.current.value = 0.97;
    bloom.current.velocity = 2.4;
    bloomActive.current = true;
  }, [activeBeat, isRitualTarget]);

  useThrottledFrame(30, (frame, dt) => {
    const t = frame.clock.getElapsedTime();

    // Hut: hover-lift + Active breathe + ValidTarget pulse.
    const hut = hutGroup.current;
    if (hut) {
      let targetLift = 0;
      let scale = 1;
      let needsHutTick = false;
      if (isValidTarget) {
        scale = 1 + Math.sin(t * 4) * 0.04;
        needsHutTick = true;
      } else if (isActive) {
        scale = 1 + Math.sin(t * 2) * 0.02;
        targetLift = 0.04;
        needsHutTick = true;
      } else if (hovered && isInteractive) {
        targetLift = 0.12;
        needsHutTick = true;
      }
      needsHutTick =
        needsHutTick ||
        Math.abs(hut.position.y - targetLift) > 0.001 ||
        Math.abs(hut.scale.x - scale) > 0.001;
      if (!needsHutTick && !bloomActive.current) return;
      hut.position.y += (targetLift - hut.position.y) * 0.18;
      hut.scale.x += (scale - hut.scale.x) * 0.2;
      hut.scale.y = hut.scale.x;
      hut.scale.z = hut.scale.x;
    }

    // Seedling: the bloom spring.
    const sprout = seedlingRef.current;
    if (sprout && isRitualTarget && bloomActive.current) {
      stepSpring(bloom.current, 1, SPRING_BLOOM, dt);
      const s = bloom.current.value;
      sprout.scale.set(s, s, s);
      if (
        Math.abs(bloom.current.value - 1) < 0.001 &&
        Math.abs(bloom.current.velocity) < 0.01
      ) {
        bloom.current.value = 1;
        bloom.current.velocity = 0;
        bloomActive.current = false;
        sprout.scale.set(1, 1, 1);
      }
    }
  });

  const glow = isActive ? 1 : hovered && isInteractive ? 0.45 : 0;
  // Locked decorative zones recede — dimmed and slightly sunk.
  const dim = decorative ? 0.5 : 1;

  return (
    <group
      position={[placement.x, groundY, placement.z]}
      onClick={
        isInteractive
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
      onPointerOver={
        isInteractive
          ? (e) => {
              e.stopPropagation();
              onPointerOver();
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={
        isInteractive
          ? () => {
              onPointerOut();
              document.body.style.cursor = "default";
            }
          : undefined
      }
    >
      {/* dirt plot — slightly proud of the terrain so it never z-fights */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[PLOT_RADIUS, 32]} />
        <meshStandardMaterial color={decorative ? PALETTE.grassDark : PALETTE.dirtDark} roughness={1} />
      </mesh>

      <group scale={[1, dim, 1]}>
        <FenceRing />
        <group ref={hutGroup}>
          <ModelSlot
            slotId={`zone.${placement.zoneId}`}
            fallback={<Hut elementId={placement.elementId} glow={glow} />}
          />
        </group>
      </group>

      {/* Wood grove: the living seedling — anchor + bloom target. */}
      {isRitualTarget ? (
        <group position={[0, 0.05, 0.85]}>
          <SeedlingSprout objectRef={seedlingRef} />
          {anchorStore ? (
            <MeshAnchor
              store={anchorStore}
              id={ANCHOR.seedlingCenter}
              objectRef={seedlingRef}
            />
          ) : null}
        </group>
      ) : null}

      {/* Zone sign — kanji + name, low and unobtrusive. */}
      <Billboard position={[0, 1.7, 0]}>
        <Text
          fontSize={0.32}
          color={ELEMENT_ROOF[placement.elementId]}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor={PALETTE.parchment}
          fillOpacity={decorative ? 0.55 : 1}
        >
          {ELEMENT_KANJI[placement.elementId]}
        </Text>
      </Billboard>
      <Billboard position={[0, 1.4, 0]}>
        <Text
          fontSize={0.12}
          color={PALETTE.parchment}
          anchorX="center"
          anchorY="middle"
          fillOpacity={decorative ? 0.45 : 0.9}
        >
          {placement.zoneId.replace(/_/g, " ").toUpperCase()}
        </Text>
      </Billboard>
    </group>
  );
}
