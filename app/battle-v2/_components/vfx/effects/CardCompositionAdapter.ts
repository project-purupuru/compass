/**
 * CardComposition · first inspector + composability adapter
 *
 * Per ADR-2: lives surface-side (alongside CardComposition.tsx). Contract
 * enforced by the TS interface in lib/lab/adapter-registry/types.ts.
 *
 * Per ADR-12: registered statically at module-load via VfxRegistry.ts.
 *
 * The adapter exposes:
 *   - inspector: list inspectable nodes (the codex layers + the card root)
 *   - composability: same nodes as an entity tree
 */

import type {
  EffectAdapter,
  EntityTreeNode,
  InspectableNode,
  InspectorAdapter,
  ComposabilityAdapter,
} from "@/lib/lab/adapter-registry/types";
import type { PointerChain, PointerSegment } from "@/lib/lab/pointer-chain/schema";

const PRIMITIVE_ID = "card-composition";

/**
 * Build the canonical pointer chain for a CardComposition node.
 *
 * Chain shape:
 *   Pantry(slug) → Primitive(card-composition) → Consumer([card-lab, battle, showcase])
 *
 * Per Flatline IMP-007: the chain is canonical here; downstream views
 * (breadcrumb, inspector, composability) READ from this resolver — never
 * duplicate inline.
 */
function buildChain(opts: { slug: string; layerIndex?: number }): PointerChain {
  const chain: PointerSegment[] = [
    {
      _tag: "Pantry",
      slug: opts.slug,
      path: `/codex/cards/${opts.slug}`,
      label: opts.slug,
    },
    {
      _tag: "Primitive",
      name: PRIMITIVE_ID,
      path: "app/battle-v2/_components/vfx/effects/CardComposition.tsx",
      label: "CardComposition",
    },
  ];

  if (opts.layerIndex !== undefined) {
    chain.push({
      _tag: "Primitive",
      name: `layer-${opts.layerIndex}`,
      path: `/codex/cards/${opts.slug}/layers.json#layers[${opts.layerIndex}]`,
      label: `layer ${opts.layerIndex}`,
    });
  }

  chain.push({
    _tag: "Consumer",
    consumers: ["card-lab", "battle-v2", "card-showcase"],
  });

  return chain;
}

interface CardCompositionState {
  /** The active codex slug being rendered (e.g., "earth-jani"). */
  slug?: string;
  /** Number of layers in the active card. */
  layerCount?: number;
}

const inspectorAdapter: InspectorAdapter = {
  primitiveId: PRIMITIVE_ID,
  listInspectableNodes: (state: unknown): readonly InspectableNode[] => {
    const s = state as CardCompositionState;
    if (!s?.slug) return [];

    const nodes: InspectableNode[] = [
      {
        id: "card-root",
        label: `card · ${s.slug}`,
        kind: "entity",
        pointerChain: buildChain({ slug: s.slug }),
        inspectable: true,
        metadata: { slug: s.slug, layerCount: s.layerCount ?? 0 },
      },
    ];

    const layerCount = s.layerCount ?? 0;
    for (let i = 0; i < layerCount; i++) {
      nodes.push({
        id: `layer-${i}`,
        label: `layer ${i}`,
        kind: "layer",
        pointerChain: buildChain({ slug: s.slug, layerIndex: i }),
        inspectable: true,
        metadata: { slug: s.slug, layerIndex: i },
      });
    }

    return nodes;
  },
  resolveChain: (nodeId: string): PointerChain => {
    // For node id like "layer-3", extract the index.
    // For "card-root", no layerIndex.
    if (nodeId === "card-root") {
      return buildChain({ slug: "earth-jani" }); // default slug; surface code passes state via listInspectableNodes
    }
    const layerMatch = nodeId.match(/^layer-(\d+)$/);
    if (layerMatch) {
      return buildChain({ slug: "earth-jani", layerIndex: Number(layerMatch[1]) });
    }
    return [];
  },
};

const composabilityAdapter: ComposabilityAdapter = {
  primitiveId: PRIMITIVE_ID,
  tree: (state: unknown): readonly EntityTreeNode[] => {
    const s = state as CardCompositionState;
    if (!s?.slug) return [];

    const layerCount = s.layerCount ?? 0;
    const children: EntityTreeNode[] = [];
    for (let i = 0; i < layerCount; i++) {
      children.push({
        id: `layer-${i}`,
        label: `layer ${i}`,
        kind: "layer",
        children: [],
        pointerChain: buildChain({ slug: s.slug, layerIndex: i }),
        inspectable: true,
      });
    }

    return [
      {
        id: "card-root",
        label: `card · ${s.slug}`,
        kind: "effect",
        children,
        pointerChain: buildChain({ slug: s.slug }),
        inspectable: true,
      },
    ];
  },
};

export const cardCompositionAdapter: EffectAdapter = {
  primitiveId: PRIMITIVE_ID,
  inspector: inspectorAdapter,
  composability: composabilityAdapter,
};
