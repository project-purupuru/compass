/**
 * lib/engine — columnar (SoA) ECS substrate.
 *
 * Session-16 / cycle engine-substrate-2026-05-17 / leaf-proof slice.
 * See `grimoires/loa/sdd.md` (build doc) and the cycle PRD for context.
 *
 * The substrate is intentionally minimal:
 *   - Archetype: typed-array column slabs with swap-remove + power-of-2 grow
 *   - World: lightweight named-archetype registry
 *   - System: a function type — no scheduler abstraction yet
 *   - swayLeafSystem: the first concrete system, replaces N per-LeafPuff useFrames
 *
 * No Three.js / R3F / React imports — this layer is renderer-agnostic.
 * Integration with R3F happens at `app/battle-v2/_components/vfx/effects/InstancedLeafField.tsx`.
 */

export { Archetype } from "./ecs/archetype";
export type { ColumnSpec, EntityId } from "./ecs/archetype";
export { World } from "./ecs/world";
export type { System } from "./ecs/system";
export { swayLeafSystem } from "./animation/sway-system";
export type { SwayLeafCols } from "./animation/sway-system";

// Cycle-3 fixture-ecs-instancing-2026-05-17 archetypes.
// Static column layouts (no per-frame system needed; renderer composes
// per-instance matrices in useEffect, not useFrame). See SDD §3 for the
// per-archetype design and §7 for the extractor → archetype → InstancedMesh
// data-flow contract.
export { TREE_TRUNK_COLUMN_SPECS } from "./ecs/tree-trunk-archetype";
export type { TreeTrunkCols } from "./ecs/tree-trunk-archetype";
export { TREE_BRANCH_COLUMN_SPECS } from "./ecs/tree-branch-archetype";
export type { TreeBranchCols } from "./ecs/tree-branch-archetype";
export {
  ROCK_COLUMN_SPECS,
  ROCK_SHAPE_BOULDER,
  ROCK_SHAPE_SLAB,
  ROCK_SHAPE_PEBBLE,
} from "./ecs/rock-archetype";
export type { RockCols } from "./ecs/rock-archetype";
