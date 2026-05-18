/**
 * swayLeafSystem — column-iterating sway loop.
 *
 * Math mirrors `app/battle-v2/_components/vfx/celVocab.ts:swayAngle`:
 *
 *   omega = 2π * frequencyHz
 *   rotY[i] = sin(t * omega + phase[i]) * amplitude[i]
 *
 * Phase is precomputed at archetype-add time (mulberry32(seed) * 2π) so
 * the per-frame inner loop is a tight sin + multiply with no seeded-RNG
 * calls. This is the key win over the per-component LeafPuff path: 1
 * useFrame + 1 pass through packed memory replaces N React-mounted
 * useFrame callbacks.
 */

import type { Archetype } from "../ecs/archetype";
import type { System } from "../ecs/system";

const TWO_PI = Math.PI * 2;

export type SwayLeafCols = "phase" | "amplitude" | "frequency" | "rotY";

export const swayLeafSystem: System<SwayLeafCols> = (arch, _dt, t) => {
  const phase = arch.columnArray("phase");
  const amplitude = arch.columnArray("amplitude");
  const frequency = arch.columnArray("frequency");
  const rotY = arch.columnArray("rotY");
  const n = arch.length;
  for (let i = 0; i < n; i++) {
    const omega = TWO_PI * frequency[i];
    rotY[i] = Math.sin(t * omega + phase[i]) * amplitude[i];
  }
};
