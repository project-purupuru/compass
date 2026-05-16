/**
 * PaperPuppetField — places one paper-puppet jani at each element district
 * in the live Tsuheji world scene.
 *
 * Additive layer mounted as a sibling of BearColony / ZoneStructure / etc.
 * inside WorldScene. Pulls zone positions from the canonical ZONE_POSITIONS
 * table — every jani is its district's elemental guardian (wood at Konka,
 * fire at Heart's Hearth, earth at Golden Veil, metal at Steel Jungle Shrine,
 * water at Sea Street Stalls).
 *
 * Substrate-coupled: reads JaniManifest + MotionConfig directly. What's tuned
 * in /battle-v2/motion-lab or /battle-v2/puppet-3d ports here verbatim.
 *
 * Default state = idle. Future hookups:
 *   - Drive `state` from GameState.zones[zoneId].activationLevel (recent card
 *     play → `action`; zone activation crosses threshold → `summon`)
 *   - Drive `flipX` from puppet's facing direction toward player camera or
 *     toward a moving target
 *   - Spawn additional janis when activationLevel grows (BearColony pattern)
 */

"use client";

import { PaperPuppet3D } from "../puppet/PaperPuppet3D";
import {
  MOTION_VARIANTS,
  type MotionVariant,
} from "../puppet/PaperPuppetMotion";
import { groundHeight } from "./MapGround";
import { ZONE_POSITIONS } from "./zones";

interface PaperPuppetFieldProps {
  readonly variant?: MotionVariant;
  readonly worldHeight?: number;
}

export function PaperPuppetField({
  variant = "billboard",
  worldHeight = 2.6,
}: PaperPuppetFieldProps) {
  const motion = MOTION_VARIANTS[variant];
  const groundY = groundHeight();

  return (
    <>
      {ZONE_POSITIONS.map((zone) => (
        <PaperPuppet3D
          key={`puppet-field-${zone.zoneId}`}
          element={zone.elementId}
          motion={motion}
          state="idle"
          position={[zone.x, groundY, zone.z]}
          worldHeight={worldHeight}
        />
      ))}
    </>
  );
}
