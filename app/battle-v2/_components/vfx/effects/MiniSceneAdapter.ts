import { makeSimpleAdapter } from "./_adapter-helpers";

export const miniSceneAdapter = makeSimpleAdapter({
  primitiveId: "mini-scene",
  displayName: "MiniScene",
  sourcePath: "app/battle-v2/_components/vfx/effects/MiniScene.tsx",
  consumers: ["battle-v2", "world-map"],
  childKind: "layer",
});
