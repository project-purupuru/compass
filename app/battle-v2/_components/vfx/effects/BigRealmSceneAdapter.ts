import { makeSimpleAdapter } from "./_adapter-helpers";

export const bigRealmSceneAdapter = makeSimpleAdapter({
  primitiveId: "big-realm-scene",
  displayName: "BigRealmScene",
  sourcePath: "app/battle-v2/_components/vfx/effects/BigRealmScene.tsx",
  consumers: ["battle-v2", "world-map"],
  // Three.js scene · per SDD §11 opaque V0
  opaque: true,
});
