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
export interface InspectableNode {
  /** Primitive-local node identifier. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Discriminator for renderer selection. */
  readonly kind: "entity" | "layer" | "knob" | "param" | "scene";
  /** Full pointer chain from pantry/source to this node. */
  readonly pointerChain: PointerChain;
  /** False = visible but read-only (e.g., scene roots in Three.js effects). */
  readonly inspectable: boolean;
  /** Free-form per-primitive metadata (renderer-decided). */
  readonly metadata: Readonly<Record<string, unknown>>;
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
