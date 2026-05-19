import { makeSimpleAdapter } from "./_adapter-helpers";

export const waterSplashAdapter = makeSimpleAdapter({
  primitiveId: "water-splash",
  displayName: "WaterSplash",
  sourcePath: "app/battle-v2/_components/vfx/effects/WaterSplash.tsx",
  consumers: ["battle-v2", "vfx-lab"],
  // Animation primitive · opaque V0
  opaque: true,
});
