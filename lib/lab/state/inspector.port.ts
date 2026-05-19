/**
 * Inspector state · Effect Context.Tag port
 *
 * Per SDD §2.2 + §3.5: selection state for the right-rail Inspector. Stored
 * in memory (Ref). React Context bridge in S2 surface code consumes the
 * Stream for reactive updates.
 */

import { Context, type Effect, type Stream } from "effect";

export interface Selection {
  readonly primitiveId: string;
  readonly nodeId: string;
  /**
   * S4.5 adds "scene-tree-click" for the new dock-shell SceneTreeSidebar
   * (cycle-2 left region replaces cycle-1 ComposabilityPanel-with-FAB).
   * "composability-click" preserved for backward compat with cycle-1 code
   * that still uses the floating composability panel.
   */
  readonly source:
    | "viewport-click"
    | "composability-click"
    | "scene-tree-click"
    | "breadcrumb-click";
}

export interface InspectorState {
  readonly current: Effect.Effect<Selection | null>;
  readonly select: (selection: Selection) => Effect.Effect<void>;
  readonly clear: () => Effect.Effect<void>;
  readonly stream: Stream.Stream<Selection | null>;
}

export const InspectorState = Context.GenericTag<InspectorState>(
  "@compass/lab/InspectorState",
);
