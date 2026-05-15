export const BATTLE_V2_ZONE_COUNT = 5;
export const FENCE_POSTS_PER_ZONE = 12;
export const PLOT_RADIUS = 1.55;
export const FENCE_POST_Y = 0.2;

export interface FencePostTransform {
  readonly position: [number, number, number];
}

export const BATTLE_V2_RENDER_BUDGET = {
  fencePostsBeforeInstancing: BATTLE_V2_ZONE_COUNT * FENCE_POSTS_PER_ZONE,
  fencePostsAfterInstancing: BATTLE_V2_ZONE_COUNT,
  maxDrawCallsNoPostFx: 170,
  maxTrianglesNoPostFx: 260_000,
} as const;

export function buildFencePostTransforms(
  postCount = FENCE_POSTS_PER_ZONE,
  radius = PLOT_RADIUS,
): readonly FencePostTransform[] {
  return Array.from({ length: postCount }, (_, i) => {
    const angle = (i / postCount) * Math.PI * 2;
    return {
      position: [
        Math.cos(angle) * radius,
        FENCE_POST_Y,
        Math.sin(angle) * radius,
      ],
    };
  });
}
