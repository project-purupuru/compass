/**
 * Adapter helpers · S5 retrofit pattern
 *
 * Most effects expose a "scene root" + N opaque children. This helper
 * builds a single-effect EffectAdapter from a minimal config.
 *
 * Three.js effects (BigRealmScene · RealmScene · ZoneScene · TreeFall ·
 * WaterSplash) treat the WebGL canvas as one opaque `kind: "scene"` node
 * with no further drill-in (per SDD §11).
 */

import type {
  EffectAdapter,
  EntityTreeNode,
  InspectableNode,
  InspectorAdapter,
  ComposabilityAdapter,
} from "@/lib/lab/adapter-registry/types";
import type { PointerChain, PointerSegment } from "@/lib/lab/pointer-chain/schema";

interface SimpleEffectAdapterConfig {
  primitiveId: string;
  displayName: string;
  sourcePath: string;
  consumers: readonly string[];
  /** Treat the effect as opaque (no inspectable children). Default false. */
  opaque?: boolean;
  /** How children should be rendered when not opaque. Default "layer". */
  childKind?: "layer" | "scene" | "param" | "knob";
}

export function makeSimpleAdapter(config: SimpleEffectAdapterConfig): EffectAdapter {
  const { primitiveId, displayName, sourcePath, consumers, opaque = false, childKind = "layer" } = config;

  function buildChain(childIndex?: number): PointerChain {
    const chain: PointerSegment[] = [
      {
        _tag: "Primitive",
        name: primitiveId,
        path: sourcePath,
        label: displayName,
      },
    ];
    if (childIndex !== undefined) {
      chain.push({
        _tag: childKind === "scene" ? "Scene" : "Primitive",
        name: `${primitiveId}-${childKind}-${childIndex}`,
        path: `${sourcePath}#${childKind}[${childIndex}]`,
        label: `${childKind} ${childIndex}`,
      });
    }
    chain.push({
      _tag: "Consumer",
      consumers: [...consumers],
    });
    return chain;
  }

  interface SimpleState {
    childCount?: number;
  }

  const inspector: InspectorAdapter = {
    primitiveId,
    listInspectableNodes: (state: unknown): readonly InspectableNode[] => {
      const s = state as SimpleState;
      const root: InspectableNode = {
        id: "scene-root",
        label: `${displayName} root`,
        kind: opaque ? "scene" : "entity",
        pointerChain: buildChain(),
        inspectable: !opaque,
        metadata: { primitiveId, opaque },
      };
      if (opaque) return [root];

      const count = s?.childCount ?? 0;
      const children: InspectableNode[] = [];
      for (let i = 0; i < count; i++) {
        children.push({
          id: `${childKind}-${i}`,
          label: `${childKind} ${i}`,
          kind: childKind,
          pointerChain: buildChain(i),
          inspectable: true,
          metadata: { childIndex: i },
        });
      }
      return [root, ...children];
    },
    resolveChain: (nodeId: string): PointerChain => {
      if (nodeId === "scene-root") return buildChain();
      const m = nodeId.match(new RegExp(`^${childKind}-(\\d+)$`));
      if (m) return buildChain(Number(m[1]));
      return [];
    },
  };

  const composability: ComposabilityAdapter = {
    primitiveId,
    tree: (state: unknown): readonly EntityTreeNode[] => {
      const s = state as SimpleState;
      const count = opaque ? 0 : (s?.childCount ?? 0);
      const childTrees: EntityTreeNode[] = [];
      for (let i = 0; i < count; i++) {
        childTrees.push({
          id: `${childKind}-${i}`,
          label: `${childKind} ${i}`,
          kind: childKind === "scene" ? "scene" : "layer",
          children: [],
          pointerChain: buildChain(i),
          inspectable: true,
        });
      }
      return [
        {
          id: "scene-root",
          label: displayName,
          kind: opaque ? "scene" : "effect",
          children: childTrees,
          pointerChain: buildChain(),
          inspectable: !opaque,
        },
      ];
    },
  };

  return { primitiveId, inspector, composability };
}
