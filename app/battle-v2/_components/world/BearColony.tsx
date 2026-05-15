/**
 * BearColony — the grove is inhabited, and the inhabitants work.
 *
 * Per build doc Session 12 (D2). Hosts the autonomous-agent system: a colony
 * of bears, each running the perceive→decide→act loop from `bearBrain.ts`,
 * steered by `steering.ts`. The grove is *always working* — bears wander,
 * pick a tree, chop, haul the log to Musubi Station, deliver, repeat.
 *
 * A card play doesn't script the bears — it makes the grove BIGGER: the colony
 * size is `f(activationLevel)` (D1), so playing a wood card grows the forest
 * AND adds bears to work it. That growth is the card's felt consequence.
 *
 * Bodies are billboard sprites drawn from the existing bear artwork — the
 * honest procedural placeholder for a future MeshyAI GLB (drop a `bear` GLB in
 * and these sprites become the fallback, exactly like `modelSlot`). The brain
 * doesn't care what the body looks like.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Billboard, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, Group } from "three";

import type { Bear, BearCtx } from "./agents/bearBrain";
import { stepBear } from "./agents/bearBrain";
import { v2, type Vec2 } from "./agents/steering";
import { mulberry32 } from "./Foliage";
import { isOnLand, sampleOnLand } from "./landmass";
import { groundHeight } from "./MapGround";
import { PALETTE } from "./palette";
import {
  SpriteSheetPlane,
  spriteSheetAspect,
  type SpriteSheetDefinition,
} from "./SpriteSheetPlane";

const WOOD_BEAR_SPRITE: SpriteSheetDefinition = {
  src: "/brand/sprites/flex-jani-bear.png",
  columns: 2,
  rows: 1,
  frameCount: 2,
  frameWidth: 227,
  frameHeight: 213,
};

const BASE_BEARS = 3; // the grove is never empty — it's always being worked
const MAX_BEARS = 9; // colony ceiling
const BEAR_HEIGHT = 1.2; // world units, foot-to-ear

/** Colony size from activation — each wood card play adds a worker. */
function bearCount(activationLevel: number): number {
  return Math.min(BASE_BEARS + activationLevel, MAX_BEARS);
}

/** Spawn one bear near the grove, on land, with a fresh seeded brain. */
function spawnBear(id: number, grove: Vec2): Bear {
  const rand = mulberry32(0xbea2 + id * 2654435761);
  const p = sampleOnLand(grove.x, grove.z, 5, rand) ?? [grove.x, grove.z];
  return {
    id,
    variant: ((id % 3) + 1) as 1 | 2 | 3,
    rand,
    pos: v2(p[0], p[1]),
    vel: v2((rand() - 0.5) * 0.5, (rand() - 0.5) * 0.5),
    wanderAngle: rand() * Math.PI * 2,
    state: "wander",
    targetTree: null,
    carrying: false,
    stateTimer: 0.4 + rand() * 2.4, // staggered — the colony doesn't pulse in sync
    effort: 0,
  };
}

interface BearColonyProps {
  /** Drives colony size — read from `state.zones.wood_grove.activationLevel`. */
  readonly activationLevel: number;
  /** Grove centre — the bears' home. */
  readonly grove: Vec2;
  /** Musubi Station — where hauled logs are delivered. */
  readonly hub: Vec2;
  /** Tree positions the bears chop — shared with GroveGrowth via groveLayout. */
  readonly trees: readonly Vec2[];
  /** Fires once per completed delivery — the wood stockpile grows. */
  readonly onDeliver?: () => void;
}

export function BearColony({
  activationLevel,
  grove,
  hub,
  trees,
  onDeliver,
}: BearColonyProps) {
  // A soft contact shadow — one shared radial-gradient texture for the whole
  // colony. Without it the billboard bears float; a grounded blob is the
  // cheap fix that makes them sit ON the continent (the Fresnel-rim fix from
  // the lighting dig is the deeper, later answer).
  const shadowTex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(0.6, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new CanvasTexture(c);
  }, []);

  const spriteSize = useMemo(
    () => ({
      w: BEAR_HEIGHT * spriteSheetAspect(WOOD_BEAR_SPRITE),
      h: BEAR_HEIGHT,
    }),
    [],
  );

  // The colony lives in a ref — bears are mutated in place each frame, never
  // re-allocated. `count` state triggers the re-render that adds group slots.
  const bearsRef = useRef<Bear[]>([]);
  const [count, setCount] = useState(0);

  // Grow the colony to match activation. New bears are APPENDED — existing
  // bears keep their position + brain state, so the colony never teleports.
  useEffect(() => {
    const target = bearCount(activationLevel);
    const bears = bearsRef.current;
    while (bears.length < target) bears.push(spawnBear(bears.length, grove));
    if (bears.length !== count) setCount(bears.length);
  }, [activationLevel, grove, count]);

  // Per-bear render handles: the world-space group, the inner sprite group
  // (bob / sway / flip), and the carried log.
  const groupRefs = useRef<(Group | null)[]>([]);
  const spriteRefs = useRef<(Group | null)[]>([]);
  const logRefs = useRef<(Group | null)[]>([]);

  // The agent-loop context — rebuilt only when its inputs change.
  const ctx = useMemo<BearCtx>(
    () => ({
      trees: trees.map((t) => v2(t.x, t.z)),
      hub: v2(hub.x, hub.z),
      grove: v2(grove.x, grove.z),
      isOnLand,
      onDeliver: () => onDeliver?.(),
    }),
    [trees, hub, grove, onDeliver],
  );

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 1 / 20); // a stalled tab must not explode the sim
    const t = frame.clock.getElapsedTime();
    const groundY = groundHeight();
    const bears = bearsRef.current;

    for (let i = 0; i < bears.length; i++) {
      const bear = bears[i];
      stepBear(bear, ctx, dt); // perceive → decide → act

      // ── Sync the body to the brain ────────────────────────────────────────
      const g = groupRefs.current[i];
      if (g) g.position.set(bear.pos.x, groundY, bear.pos.z);

      const sprite = spriteRefs.current[i];
      if (sprite) {
        const speed01 = Math.min(1, Math.hypot(bear.vel.x, bear.vel.z) / 2.6);
        // Waddle — a walk-cycle sway, proportional to how fast it's moving.
        sprite.rotation.z = Math.sin(t * 9 + bear.id) * speed01 * 0.12;
        // Effort bob — chopping / stacking pushes the body down on the beat.
        sprite.position.y = -Math.abs(Math.sin(t * 11 + bear.id)) * bear.effort * 0.16;
        // Face the direction of travel (mirror the billboard sprite).
        if (Math.abs(bear.vel.x) > 0.05) {
          sprite.scale.x = bear.vel.x < 0 ? -1 : 1;
        }
      }

      const log = logRefs.current[i];
      if (log) log.visible = bear.carrying;
    }
  });

  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const bear = bearsRef.current[i];
        const size = spriteSize;
        return (
          <group key={i} ref={(el) => void (groupRefs.current[i] = el)}>
            {/* Contact shadow — flat on the ground, does NOT billboard. Stays
                put while the body waddles/bobs above it. */}
            {shadowTex ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
                <circleGeometry args={[size.w * 0.52, 20]} />
                <meshBasicMaterial
                  map={shadowTex}
                  transparent
                  depthWrite={false}
                  opacity={0.9}
                  toneMapped={false}
                />
              </mesh>
            ) : null}
            <Billboard position={[0, BEAR_HEIGHT / 2, 0]}>
              <group ref={(el) => void (spriteRefs.current[i] = el)}>
                <SpriteSheetPlane
                  sheet={WOOD_BEAR_SPRITE}
                  height={size.h}
                  fps={2.4}
                  frameOffset={bear?.id ?? i}
                  phase={(bear?.id ?? i) * 0.17}
                  alphaTest={0.4}
                  name={`bear-colony.bear-${bear?.id ?? i}.sprite`}
                />
                {/* The carried log — only visible while hauling/delivering. */}
                <group
                  ref={(el) => void (logRefs.current[i] = el)}
                  position={[size.w * 0.18, -BEAR_HEIGHT * 0.16, 0.06]}
                  rotation={[0, 0, Math.PI / 2]}
                  visible={false}
                >
                  <mesh castShadow>
                    <cylinderGeometry args={[0.075, 0.09, 0.5, 6]} />
                    <meshStandardMaterial color={PALETTE.trunk} roughness={1} />
                  </mesh>
                </group>
              </group>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

useTexture.preload(WOOD_BEAR_SPRITE.src);
