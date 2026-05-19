import { makeSimpleAdapter } from "./_adapter-helpers";

export const treeFallAdapter = makeSimpleAdapter({
  primitiveId: "tree-fall",
  displayName: "TreeFall",
  sourcePath: "app/battle-v2/_components/vfx/effects/TreeFall.tsx",
  consumers: ["battle-v2", "vfx-lab"],
  // Animation primitive · opaque V0
  opaque: true,
});
