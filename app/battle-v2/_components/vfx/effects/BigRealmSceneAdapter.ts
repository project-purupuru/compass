/**
 * BigRealmSceneAdapter · cycle-2 S5 extends to composition with hex children
 *
 * Per FR-11/12: BigRealmScene becomes a `kind: "composition"` adapter with
 * 49 hex children declared as childAdapters refs (7x7 grid · each instance
 * pinned to hex coordinates). Drill-in (FR-13) renders each child as an
 * inspectable adapter at its position.
 *
 * Cycle-2 S5 ships the SUBSTRATE EXTENSION · 49 childAdapters declared.
 * S6 wires Inspector live to consume these · operator drills into a hex
 * and sees that hex's adapter render in Inspector.
 */
import type { ChildAdapterRef, EffectAdapter, InspectableNode } from "@/lib/lab/adapter-registry/types";
import type { PointerChain, PointerSegment } from "@/lib/lab/pointer-chain/schema";

const PRIMITIVE_ID = "big-realm-scene";
const SOURCE_PATH = "app/battle-v2/_components/vfx/effects/BigRealmScene.tsx";

function buildChain(): PointerChain {
  const segments: PointerSegment[] = [
    {
      _tag: "Primitive",
      name: PRIMITIVE_ID,
      path: SOURCE_PATH,
      label: "BigRealmScene",
    },
    {
      _tag: "Consumer",
      consumers: ["battle-v2", "world-map"],
    },
  ];
  return segments;
}

/**
 * Synthesize 49 hex children · 7x7 grid · cycle-1 BigRealmScene mocks
 * this internally for rendering · cycle-2 surfaces them as adapter refs
 * so operator drill-in (FR-13) works.
 */
function buildHexChildren(): InspectableNode["childAdapters"] {
  const children: ChildAdapterRef[] = [];
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      children.push({
        adapterId: "hex-scene",
        instanceId: `hex-${q + 3}-${r + 3}`,
        transform: { x: q, y: 0, z: r },
      });
    }
  }
  return children;
}

const compositionRoot: InspectableNode = {
  id: "scene-root",
  label: "BigRealmScene root",
  kind: "composition",
  pointerChain: buildChain(),
  inspectable: true,
  metadata: { primitiveId: PRIMITIVE_ID, hexCount: 49 },
  childAdapters: buildHexChildren(),
};

export const bigRealmSceneAdapter: EffectAdapter = {
  primitiveId: PRIMITIVE_ID,
  inspector: {
    primitiveId: PRIMITIVE_ID,
    listInspectableNodes: () => [compositionRoot],
    resolveChain: () => buildChain(),
  },
  composability: {
    primitiveId: PRIMITIVE_ID,
    tree: () => [
      {
        id: "scene-root",
        label: "BigRealmScene",
        kind: "scene",
        children: [],
        pointerChain: buildChain(),
        inspectable: true,
      },
    ],
  },
};
