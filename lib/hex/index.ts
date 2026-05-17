/**
 * lib/hex — IS axial grid/topology/plot data substrate; NOT rendering, scene state, or ECS runtime.
 *
 * Pure math + data, no rendering. Authored per session-14 (2026-05-16) on
 * Gumi's hex-baseline suggestion. Designed for reuse across compass and
 * sibling projects that want plot-based composition.
 *
 * Operator pins:
 *   - Orientation: flat-top
 *   - Default cell size: 1.75 (vertex-to-vertex width 3.5)
 *
 * Recommended import: `import { hexToWorld, hexSpiral, ... } from "@/lib/hex"`.
 */

export * from "./axial";
export * from "./neighbors";
export * from "./world";
export * from "./iter";
export * from "./biome";
export * from "./decorator";
export * from "./zone";
