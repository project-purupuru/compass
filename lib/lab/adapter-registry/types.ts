/**
 * Lab adapter registry · type contracts
 *
 * Per ADR-2 + ADR-3 + ADR-12 (closed-ADRs from Flatline SDD review):
 *   - Adapters live SURFACE-SIDE at `app/battle-v2/_components/vfx/effects/<effect>/adapter.ts`
 *   - InspectableNode is explicitly defined (NOT phantom)
 *   - Registration is STATIC (module-load time, NOT mount-time) — prevents race
 *     conditions and allows querying inactive effects' capabilities.
 *
 * Per Flatline SKP-005: alignment with EntityTreeNode lets shared rendering
 * primitives work across ComposabilityPanel and Inspector.
 */

import type { PointerChain } from "../pointer-chain/schema";

/**
 * Inspectable node — what the Inspector right-rail surfaces on selection.
 * Per Flatline SKP-005 · explicit struct (NOT phantom type).
 */
/**
 * Reference to a child adapter within a composition (cycle-2 S5 FR-11/12).
 * BigRealmScene's 49 hex children · each is a first-class adapter instance
 * pinned to a transform within the parent composition.
 */
export interface ChildAdapterRef {
  /** Primitive-id of the child adapter (registered in adapter-registry) */
  readonly adapterId: string;
  /** Unique instance identifier within the composition */
  readonly instanceId: string;
  /** Optional transform within parent's local frame */
  readonly transform?: {
    readonly x?: number;
    readonly y?: number;
    readonly z?: number;
  };
}

export interface InspectableNode {
  /** Primitive-local node identifier. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /**
   * Discriminator for renderer selection. Cycle-2 S5 adds "composition" for
   * nested-adapter root nodes (e.g., BigRealmScene composing 49 hex children).
   */
  readonly kind: "entity" | "layer" | "knob" | "param" | "scene" | "composition";
  /** Full pointer chain from pantry/source to this node. */
  readonly pointerChain: PointerChain;
  /** False = visible but read-only (e.g., scene roots in Three.js effects). */
  readonly inspectable: boolean;
  /** Free-form per-primitive metadata (renderer-decided). */
  readonly metadata: Readonly<Record<string, unknown>>;
  /**
   * Cycle-2 S5 FR-11: optional child adapters when this node is a
   * composition. Drill-in surfaces resolve each child by adapterId from
   * the registry · render its tree at this position. Additive to v1.0
   * pointer-chain schema (NFR-7 schema-lock preserved).
   */
  readonly childAdapters?: readonly ChildAdapterRef[];
}

/**
 * Composability tree node — what the Composability panel surfaces.
 * Mirrors InspectableNode shape but recursive (nested children).
 */
export interface EntityTreeNode {
  readonly id: string;
  readonly label: string;
  readonly kind: "layer" | "effect" | "scene" | "group";
  readonly children: readonly EntityTreeNode[];
  readonly pointerChain: PointerChain;
  readonly inspectable: boolean;
}

/**
 * Per-effect inspector adapter.
 *
 * Each effect's `adapter.ts` exports an InspectorAdapter that the
 * AdapterRegistry registers at module load (per ADR-12).
 */
export interface InspectorAdapter {
  /** Stable identifier matching the VfxRegistry slug. */
  readonly primitiveId: string;
  /** Enumerate the effect's inspectable nodes given its current state. */
  readonly listInspectableNodes: (state: unknown) => readonly InspectableNode[];
  /** Resolve the pointer chain for a specific node by id. */
  readonly resolveChain: (nodeId: string) => PointerChain;
}

/**
 * Per-effect composability adapter.
 *
 * Returns the entity tree for the Composability panel.
 */
export interface ComposabilityAdapter {
  readonly primitiveId: string;
  readonly tree: (state: unknown) => readonly EntityTreeNode[];
}

/**
 * Combined adapter export — what each effect's `adapter.ts` exports.
 *
 * Example:
 *   // app/battle-v2/_components/vfx/effects/CardComposition/adapter.ts
 *   export const cardCompositionAdapter: EffectAdapter = {
 *     primitiveId: "card-composition",
 *     inspector: { ... },
 *     composability: { ... },
 *   };
 */
export interface EffectAdapter {
  readonly primitiveId: string;
  readonly inspector: InspectorAdapter;
  readonly composability: ComposabilityAdapter;
}
