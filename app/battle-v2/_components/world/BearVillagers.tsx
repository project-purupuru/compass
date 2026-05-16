/**
 * BearVillagers — replaces VillagerSwarm's cone+sphere primitives with
 * billboard bear-sprite villagers of the appropriate element.
 *
 * Operator direction (2026-05-16): "the blue template characters in the
 * water zone should be all bears." Extended to ALL villager swarms (wood +
 * water) for consistency — the world is populated by jani-bears at every
 * scale: villagers, workers (BearColony), named guardians (PaperPuppetField).
 *
 * Visual hierarchy:
 *   guardians   PaperPuppetField · worldHeight 1.6 · normal + flex/puddle
 *   workers     BearColony       · worldHeight 1.2 · wood-flex sprite
 *   villagers   BearVillagers    · worldHeight 0.7-1.0 · normal-{el}-jani
 *
 * Same villager data shape as VillagerSwarm consumed (x, z, elementId, scale,
 * seed). Drop-in render swap at WorldScene's mount site.
 */

"use client";

import type { ElementId } from "@/lib/purupuru/contracts/types";

import { PaperPuppet3D } from "../puppet/PaperPuppet3D";
import { MOTION_VARIANTS } from "../puppet/PaperPuppetMotion";
import { groundHeight } from "./MapGround";

interface BearVillagerSpec {
  readonly x: number;
  readonly z: number;
  readonly elementId: ElementId;
  readonly scale: number;
  readonly seed: number;
}

interface BearVillagersProps {
  readonly villagers: readonly BearVillagerSpec[];
}

export function BearVillagers({ villagers }: BearVillagersProps) {
  const motion = MOTION_VARIANTS.billboard;
  const groundY = groundHeight();

  return (
    <>
      {villagers.map((v) => (
        <PaperPuppet3D
          key={`bear-villager-${v.seed}`}
          element={v.elementId}
          variant="normal"
          motion={motion}
          state="idle"
          position={[v.x, groundY, v.z]}
          // ~0.75-1.0 worldHeight depending on per-villager scale. Smaller
          // than BearColony workers (1.2) and named guardians (1.6) so the
          // hierarchy reads at a glance.
          worldHeight={0.85 * v.scale}
          flipX={v.seed % 2 === 0}
        />
      ))}
    </>
  );
}
