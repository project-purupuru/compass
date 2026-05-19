/**
 * Workspace state · Effect Context.Tag port
 *
 * Per SDD §2.2 + S4 sprint plan: per-workspace state Ref keyed by WorkspaceId.
 * Each workspace preserves: active entity, panel collapse state, knob values.
 * Switching workspaces preserves the state of the workspace you left.
 */

import { Context, type Effect, type Stream } from "effect";

export type WorkspaceId = "compose" | "preview" | "export";

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
