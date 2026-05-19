/**
 * DockShell state · Effect Context.Tag port · cycle-2 S4.1
 *
 * Per SDD §5.2 service contract: dock-shell exposes read/write/stream of
 * its layout state. localStorage hydration + write-back happens in the
 * live impl. UI components consume via this port.
 *
 * Per ADR-12 (static registration): this service is registered at module
 * load via the runtime composition root.
 */

import { Context, type Effect, type Stream } from "effect";

import type { DockShellState } from "./dock-shell.schema";

export interface DockShellService {
  /** Current state snapshot · synchronous read for React render */
  readonly read: Effect.Effect<DockShellState>;
  /** Patch a subset · merge with current state · trigger localStorage persist */
  readonly update: (patch: Partial<DockShellState>) => Effect.Effect<void>;
  /** Reset to default state (S4.6 AC: reset-to-default flow) */
  readonly reset: Effect.Effect<void>;
  /** State change stream · UI subscribes to react to size changes */
  readonly stream: Stream.Stream<DockShellState>;
}

export const DockShell = Context.GenericTag<DockShellService>(
  "@compass/lab/DockShell",
);
