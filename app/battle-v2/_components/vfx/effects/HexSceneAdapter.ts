/**
 * HexScene · adapter (second adapter · S3 deliverable)
 *
 * Per ADR-2 surface-side · ADR-12 static registration.
 * Demonstrates the adapter pattern beyond CardComposition.
 */

import type {
  EffectAdapter,
  EntityTreeNode,
  InspectableNode,
  InspectorAdapter,
  ComposabilityAdapter,
} from "@/lib/lab/adapter-registry/types";
import type { PointerChain, PointerSegment } from "@/lib/lab/pointer-chain/schema";

const PRIMITIVE_ID = "hex-scene";

function buildChain(plotIndex?: number): PointerChain {
  const chain: PointerSegment[] = [
    {
      _tag: "Primitive",
      name: PRIMITIVE_ID,
      path: "app/battle-v2/_components/vfx/effects/HexScene.tsx",
      label: "HexScene",
    },
  ];
  if (plotIndex !== undefined) {
    chain.push({
      _tag: "Scene",
      name: `plot-${plotIndex}`,
      path: `HexScene[plot-${plotIndex}]`,
      label: `plot ${plotIndex}`,
    });
  }
  chain.push({
    _tag: "Consumer",
    consumers: ["battle-v2", "world-map"],
  });
  return chain;
}

interface HexSceneState {
  plotCount?: number;
}

const inspector: InspectorAdapter = {
  primitiveId: PRIMITIVE_ID,
  listInspectableNodes: (state: unknown): readonly InspectableNode[] => {
    const s = state as HexSceneState;
    const plots = s?.plotCount ?? 7; // HexScene default = 1 center + 6 neighbors
    const nodes: InspectableNode[] = [
      {
        id: "scene-root",
        label: "HexScene root",
        kind: "scene",
        pointerChain: buildChain(),
        inspectable: true,
        metadata: { plotCount: plots },
      },
    ];
    for (let i = 0; i < plots; i++) {
      nodes.push({
        id: `plot-${i}`,
        label: `plot ${i}`,
        kind: "layer",
        pointerChain: buildChain(i),
        inspectable: true,
        metadata: { plotIndex: i, isCenter: i === 0 },
      });
    }
    return nodes;
  },
  resolveChain: (nodeId: string): PointerChain => {
    if (nodeId === "scene-root") return buildChain();
    const m = nodeId.match(/^plot-(\d+)$/);
    if (m) return buildChain(Number(m[1]));
    return [];
  },
};

const composability: ComposabilityAdapter = {
  primitiveId: PRIMITIVE_ID,
  tree: (state: unknown): readonly EntityTreeNode[] => {
    const s = state as HexSceneState;
    const plots = s?.plotCount ?? 7;
    const children: EntityTreeNode[] = [];
    for (let i = 0; i < plots; i++) {
      children.push({
        id: `plot-${i}`,
        label: `plot ${i}${i === 0 ? " (center)" : ""}`,
        kind: "layer",
        children: [],
        pointerChain: buildChain(i),
        inspectable: true,
      });
    }
    return [
      {
        id: "scene-root",
        label: "HexScene",
        kind: "scene",
        children,
        pointerChain: buildChain(),
        inspectable: true,
      },
    ];
  },
};

export const hexSceneAdapter: EffectAdapter = {
  primitiveId: PRIMITIVE_ID,
  inspector,
  composability,
};
