/**
 * Workspace state · Effect Context.Tag port
 *
 * Per SDD §2.2 + S4 sprint plan: per-workspace state Ref keyed by WorkspaceId.
 * Each workspace preserves: active entity, panel collapse state, knob values.
 * Switching workspaces preserves the state of the workspace you left.
 */

import { Context, type Effect, type Stream } from "effect";

/**
 * Cycle-2 S3.1 re-verb: was `"compose" | "preview" | "export"` (cycle-1 ·
 * Studio-mode 3-workspace exploration). Cycle-2 commits to BUILD/LIBRARY +
 * Play header button per FR-4 (BARTH probe verdict · operator-ratified).
 * PLAY is a header button, not a tab — so this type covers tabs only.
 */
export type WorkspaceId = "build" | "library";

export interface WorkspaceState {
  readonly activeEntityId: string | null;
  readonly panelCollapse: {
    readonly composability: boolean;
    readonly inspector: boolean;
  };
  readonly knobValues: Readonly<Record<string, unknown>>;
}

export interface WorkspaceService {
  readonly active: Effect.Effect<WorkspaceId>;
  readonly switch: (id: WorkspaceId) => Effect.Effect<void>;
  readonly get: (id: WorkspaceId) => Effect.Effect<WorkspaceState>;
  readonly update: (id: WorkspaceId, patch: Partial<WorkspaceState>) => Effect.Effect<void>;
  readonly stream: Stream.Stream<WorkspaceId>;
}

export const Workspace = Context.GenericTag<WorkspaceService>("@compass/lab/Workspace");

export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  activeEntityId: null,
  panelCollapse: { composability: false, inspector: false },
  knobValues: {},
};
