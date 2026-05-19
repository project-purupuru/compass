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

/**
 * Per-region size bounds (PERCENTAGES). Single source of truth — DockShell.tsx
 * imports these for ResizablePanel `minSize` / `maxSize` (formatted as
 * `"${n}%"` strings — react-resizable-panels v4 treats raw numbers as PIXELS,
 * strings ending in `%` as percentages). `decodeDockShellState` clamps stored
 * values into these ranges on hydration so the substrate self-heals if an
 * operator's localStorage drifts out of band.
 */
export const PANEL_BOUNDS = {
  left: { min: 15, max: 40 },
  right: { min: 18, max: 45 },
  bottom: { min: 10, max: 50 },
} as const;

export const DEFAULT_DOCK_SHELL_STATE: DockShellState = {
  schemaVersion: DOCK_SHELL_SCHEMA_VERSION,
  // Wider defaults so cycle-1 content (KnobPane tweakpane · SceneTreeSidebar
  // adapter labels) fits without squeeze on 1280-1440 viewports.
  leftPanelSize: 20,
  rightPanelSize: 24,
  bottomPanelSize: 25,
  bottomCollapsed: true,
};

export const STORAGE_KEY = "compass.honeycomb.dock-shell.v1" as const;

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

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
    const decoded = S.decodeUnknownSync(DockShellState)(parsed);
    return {
      ...decoded,
      leftPanelSize: clamp(
        decoded.leftPanelSize,
        PANEL_BOUNDS.left.min,
        PANEL_BOUNDS.left.max,
      ),
      rightPanelSize: clamp(
        decoded.rightPanelSize,
        PANEL_BOUNDS.right.min,
        PANEL_BOUNDS.right.max,
      ),
      bottomPanelSize: clamp(
        decoded.bottomPanelSize,
        PANEL_BOUNDS.bottom.min,
        PANEL_BOUNDS.bottom.max,
      ),
    };
  } catch {
    return null;
  }
}

export function encodeDockShellState(state: DockShellState): string {
  return JSON.stringify(state);
}
