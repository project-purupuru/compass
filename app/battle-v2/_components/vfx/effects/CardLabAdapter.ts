import { makeSimpleAdapter } from "./_adapter-helpers";

export const cardLabAdapter = makeSimpleAdapter({
  primitiveId: "card-lab",
  displayName: "CardLab",
  sourcePath: "app/battle-v2/_components/vfx/effects/CardLab.tsx",
  consumers: ["card-lab"],
  childKind: "layer",
});
