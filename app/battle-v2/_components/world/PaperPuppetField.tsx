/**
 * PaperPuppetField — places paper-puppet jani VILLAGES at the active element
 * districts in the live Tsuheji world scene.
 *
 * Cycle-1 doctrine (per project_battle-v2-zone-composition memory):
 *   Two-element matchups, Yugioh-shape. Each match has TWO land elements
 *   active simultaneously (one per side), not all 5 zones at once. The 5-
 *   district zones.ts partitioning remains the territory model; only the
 *   `activeElements` are populated with janis. Default matchup = wood vs water.
 *
 * Each active zone gets a CLUSTER of 4 janis arranged around the zone center
 * (not stacked on top of the ZoneStructure marker). Cluster includes a non-
 * normal variant (wood-flex working pose, water-puddle resting form) for
 * visual variety — reads as a small village, not a row of identical NPCs.
 *
 * Substrate-coupled: reads JaniManifest + MotionConfig directly. What's tuned
 * in /battle-v2/motion-lab or /battle-v2/puppet-3d ports here verbatim.
 *
 * Future hookups:
 *   - Drive `state` from GameState.zones[zoneId].activationLevel
 *   - Drive `activeElements` from match state (which 2 elements are in play)
 *   - Spawn additional puppets when activationLevel grows (BearColony pattern)
 *   - Use sampleOnLand to randomize offsets safely (current offsets are fixed)
 */

"use client";

import { type ElementId } from "../puppet/JaniManifest";
import { PaperPuppet3D } from "../puppet/PaperPuppet3D";
import {
  MOTION_VARIANTS,
  type MotionVariant,
} from "../puppet/PaperPuppetMotion";
import { ACTIVE_MATCHUP, activeBattlefieldZones } from "./activeMatchup";
import { groundHeight } from "./MapGround";

interface PuppetSpec {
  readonly variant?: "normal" | "flex" | "puddle";
  /** Offset from zone center in world units (dx along X, dz along Z). */
  readonly offset: readonly [number, number];
  readonly flipX?: boolean;
}

/**
 * Per-element village cluster layouts. 4 puppets per zone arranged in a loose
 * ring around the zone center. Last entry uses a non-normal variant where one
 * exists (wood-flex, water-puddle). Offsets ~2 world units from center so the
 * cluster sits well inside the district without colliding with ZoneStructure.
 */
const CLUSTERS: Partial<Record<ElementId, readonly PuppetSpec[]>> = {
  wood: [
    { offset: [-2.2, 0.9] },
    { offset: [2.3, 1.3], flipX: true },
    { offset: [0.4, -2.2] },
    { offset: [-0.8, 2.0], variant: "flex" }, // the worker / flexing pose
  ],
  water: [
    { offset: [-1.9, 1.3] },
    { offset: [2.2, 0.9], flipX: true },
    { offset: [0.6, -2.0] },
    { offset: [-1.0, -1.4], variant: "puddle" }, // resting puddle form
  ],
  fire: [
    { offset: [-2.0, 1.0] },
    { offset: [2.1, 1.1], flipX: true },
    { offset: [0.4, -2.0] },
    { offset: [-0.6, -1.4] },
  ],
  earth: [
    { offset: [-2.0, 1.2] },
    { offset: [2.2, 1.0], flipX: true },
    { offset: [0.5, -2.1] },
    { offset: [-0.6, -1.4] },
  ],
  metal: [
    { offset: [-2.0, 1.1] },
    { offset: [2.1, 1.0], flipX: true },
    { offset: [0.6, -2.0] },
    { offset: [-0.6, -1.4] },
  ],
};

interface PaperPuppetFieldProps {
  /** Element zones to populate. Default = ACTIVE_MATCHUP single source of truth. */
  readonly activeElements?: readonly ElementId[];
  readonly variant?: MotionVariant;
  readonly worldHeight?: number;
}

export function PaperPuppetField({
  activeElements = ACTIVE_MATCHUP,
  variant = "billboard",
  worldHeight = 1.6,
}: PaperPuppetFieldProps) {
  const motion = MOTION_VARIANTS[variant];
  const groundY = groundHeight();
  // Use battlefield-overridden positions so jani villages cluster on the
  // player/opponent layout, matching the territory partition + structure markers.
  const battlefieldZones = activeBattlefieldZones();

  return (
    <>
      {activeElements.flatMap((element) => {
        const zone = battlefieldZones.find((z) => z.elementId === element);
        if (!zone) return [];
        const cluster = CLUSTERS[element] ?? [{ offset: [0, 0] as const }];
        return cluster.map((spec, i) => (
          <PaperPuppet3D
            key={`puppet-${zone.zoneId}-${i}`}
            element={element}
            variant={spec.variant}
            motion={motion}
            state="idle"
            position={[
              zone.x + spec.offset[0],
              groundY,
              zone.z + spec.offset[1],
            ]}
            flipX={spec.flipX}
            worldHeight={worldHeight}
          />
        ));
      })}
    </>
  );
}
