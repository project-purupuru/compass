import { makeSimpleAdapter } from "./_adapter-helpers";

export const realmSceneAdapter = makeSimpleAdapter({
  primitiveId: "realm-scene",
  displayName: "RealmScene",
  sourcePath: "app/battle-v2/_components/vfx/effects/RealmScene.tsx",
  consumers: ["battle-v2", "world-map"],
  // Three.js scene · per SDD §11 opaque V0
  opaque: true,
});
