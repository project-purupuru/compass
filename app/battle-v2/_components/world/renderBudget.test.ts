import { describe, expect, test } from "vitest";

import {
  BATTLE_V2_RENDER_BUDGET,
  BATTLE_V2_ZONE_COUNT,
  FENCE_POSTS_PER_ZONE,
  PLOT_RADIUS,
  buildFencePostTransforms,
} from "./renderBudget";

describe("Battle V2 render budget helpers", () => {
  test("places fence posts evenly on the plot radius", () => {
    const posts = buildFencePostTransforms();

    expect(posts).toHaveLength(FENCE_POSTS_PER_ZONE);
    expect(posts[0]?.position).toEqual([PLOT_RADIUS, 0.2, 0]);
    expect(posts[FENCE_POSTS_PER_ZONE / 2]?.position[0]).toBeCloseTo(-PLOT_RADIUS);

    for (const post of posts) {
      const [x, , z] = post.position;
      expect(Math.hypot(x, z)).toBeCloseTo(PLOT_RADIUS);
    }
  });

  test("captures the instancing draw-call reduction for zone fences", () => {
    expect(BATTLE_V2_RENDER_BUDGET.fencePostsBeforeInstancing).toBe(
      BATTLE_V2_ZONE_COUNT * FENCE_POSTS_PER_ZONE,
    );
    expect(BATTLE_V2_RENDER_BUDGET.fencePostsAfterInstancing).toBe(BATTLE_V2_ZONE_COUNT);
    expect(
      BATTLE_V2_RENDER_BUDGET.fencePostsBeforeInstancing -
        BATTLE_V2_RENDER_BUDGET.fencePostsAfterInstancing,
    ).toBe(55);
  });
});
