/**
 * DockShell state · cycle-2 S4.1
 *
 * Per FR-7: 4-region Resizable layout (top mode-tabs · left scene-tree ·
 * center viewport · right Inspector · bottom log/console). Region sizes
 * persisted to localStorage (FR-8) so operator's pane arrangement survives
 * reloads.
 *
 * Per NFR-7: schema additive to pointer-chain v1.0 LOCK · this is a NEW
 * primitive, not a modification to existing schemas.
 *
 * Per OQ-1: URL-only state for hot-jump (S3); localStorage is fine for
 * dock-shell sizes since those are operator-machine preference (cycle-2
 * is solo-operator per Q3) not part of the hot-jump payload.
 */

import { Schema as S } from "effect";

/**
 * The operator's dock-shell layout state. Percentages for shadcn Resizable
 * compatibility (Resizable panels work in percentages not pixels).
 *
 * Defaults derived from sprint plan §S4: left 22% (~280px @ 1280viewport) ·
 * right 25% (~320px) · bottom 25% (when expanded) · top is fixed 48px
 * (NOT included here since it's not Resizable · it's a fixed-height shell).
 */
export const DockShellState = S.Struct({
  schemaVersion: S.Literal("1.0"),
  /** Left region (scene-tree) · default 22% */
  leftPanelSize: S.Number,
  /** Right region (Inspector) · default 25% */
  rightPanelSize: S.Number,
  /** Bottom region (log/console) · default 25% when expanded */
  bottomPanelSize: S.Number,
  /** Whether bottom region is collapsed · default true */
  bottomCollapsed: S.Boolean,
});

export type DockShellState = S.Schema.Type<typeof DockShellState>;

export const DOCK_SHELL_SCHEMA_VERSION = "1.0" as const;

export const DEFAULT_DOCK_SHELL_STATE: DockShellState = {
  schemaVersion: DOCK_SHELL_SCHEMA_VERSION,
  leftPanelSize: 22,
  rightPanelSize: 25,
  bottomPanelSize: 25,
  bottomCollapsed: true,
};

export const STORAGE_KEY = "compass.honeycomb.dock-shell.v1" as const;

/**
 * Validates raw localStorage JSON against schema. Returns null on any
 * failure (malformed JSON · schema mismatch · wrong version). Caller falls
 * back to DEFAULT_DOCK_SHELL_STATE.
 *
 * Corruption-recovery (S4.6 AC): invalid stored state → default state ·
 * no exception thrown · no UI break.
 */
export function decodeDockShellState(raw: string | null): DockShellState | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return S.decodeUnknownSync(DockShellState)(parsed);
  } catch {
    return null;
  }
}

export function encodeDockShellState(state: DockShellState): string {
  return JSON.stringify(state);
}
