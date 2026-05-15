import { expect, test } from "@playwright/test";

interface BattleV2RenderStats {
  readonly frames: number;
  readonly calls: number;
  readonly triangles: number;
  readonly budget: {
    readonly maxDrawCallsNoPostFx: number;
    readonly maxTrianglesNoPostFx: number;
  };
}

type BattleV2Window = Window & {
  readonly __BATTLE_V2_RENDER_STATS__?: BattleV2RenderStats;
};

test.describe("/battle-v2", () => {
  test("boots the playable clash game and stays inside the 3D render budget", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/battle-v2?fx=0&probe=1");

    await expect(page.locator(".battle-v2-shell")).toBeVisible();
    await expect(page.locator(".clash-arena")).toBeVisible();
    await expect(page.locator(".world-view canvas")).toHaveCount(1);
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Lock In" })).toBeVisible();

    await page.waitForFunction(
      () => ((window as BattleV2Window).__BATTLE_V2_RENDER_STATS__?.frames ?? 0) >= 10,
      undefined,
      { timeout: 20_000 },
    );

    const stats = await page.evaluate(
      () => (window as BattleV2Window).__BATTLE_V2_RENDER_STATS__,
    );
    expect(stats).toBeDefined();
    expect(stats!.calls).toBeLessThanOrEqual(stats!.budget.maxDrawCallsNoPostFx);
    expect(stats!.triangles).toBeLessThanOrEqual(stats!.budget.maxTrianglesNoPostFx);

    await page.getByRole("button", { name: "Lock In" }).click();
    await expect(page.locator(".event-log summary")).toContainText(/Event log \([1-9]/);

    expect(pageErrors).toEqual([]);
  });
});
