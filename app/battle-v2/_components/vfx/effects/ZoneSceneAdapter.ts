import { makeSimpleAdapter } from "./_adapter-helpers";

export const zoneSceneAdapter = makeSimpleAdapter({
  primitiveId: "zone-scene",
  displayName: "ZoneScene",
  sourcePath: "app/battle-v2/_components/vfx/effects/ZoneScene.tsx",
  consumers: ["battle-v2", "zone-overlay"],
  // Three.js scene · per SDD §11 opaque V0
  opaque: true,
});
