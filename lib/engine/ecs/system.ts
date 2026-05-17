/**
 * System — a function that iterates over the columns of an archetype.
 * The "scheduler" for the leaf proof is just "call it from useFrame".
 * No scheduler/registry abstraction yet — earn that when there are
 * multiple archetypes with cross-system ordering constraints.
 */

import type { Archetype } from "./archetype";

export type System<TCols extends string = string> = (
  archetype: Archetype<TCols>,
  /** Delta-time since previous frame, in seconds. */
  dt: number,
  /** Elapsed simulation time, in seconds. */
  t: number,
) => void;
