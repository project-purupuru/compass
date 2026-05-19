/**
 * DockShell · cycle-2 S4.2 · 4-region Resizable layout
 *
 * Per FR-7: shadcn Resizable layout with 4 regions:
 *   - TOP: 48px fixed height (mode-tabs · breadcrumb · play button)
 *   - LEFT: ~22% default (scene-tree Sidebar · S4.3 SceneTreeSidebar)
 *   - CENTER: flex 1 (viewport · 3D render · effect previews)
 *   - RIGHT: ~25% default (Inspector · S6 wires live)
 *   - BOTTOM: ~25% when expanded · collapsed by default (log/console · S4.4)
 *
 * Per FR-8: panel sizes persist to localStorage via the S4.1 dock-shell
 * schema. Hydrates on mount · saves on resize.
 *
 * Per FR-25: this is where the F5 keyboard listener LIVES (sprint plan:
 * "Keyboard listener at DockShell root"). S3 mounted it at /honeycomb page
 * root as a stand-in · S4 keeps it there for now (the page IS the dock
 * shell) and S6+ may move when the dock-shell becomes a separate wrapper
 * with its own focus boundary.
 *
 * Slots are children-based · operator-side code does not need to know
 * about the Resizable internals. Per [[feedback_shadcn-for-kitchen-ui]]:
 * shadcn for chrome (Resizable), brand tokens for material (--puru-*).
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  DEFAULT_DOCK_SHELL_STATE,
  decodeDockShellState,
  encodeDockShellState,
  STORAGE_KEY,
  type DockShellState,
} from "@/lib/lab/state/dock-shell.schema";

interface DockShellProps {
  /** Top region content · fixed 48px height (mode-tabs · breadcrumb · play) */
  top: ReactNode;
  /** Left region content · scene-tree Sidebar (S4.3) */
  left: ReactNode;
  /** Center region content · viewport · 3D render */
  center: ReactNode;
  /** Right region content · Inspector (S2 rebuild · S6 wires live) */
  right: ReactNode;
  /** Bottom region content · log console (S4.4) · collapsible */
  bottom?: ReactNode;
}

/**
 * React hook · reads dock-shell state from localStorage with SSR-safe
 * default. Returns [state, setState] with auto-persist on every update.
 *
 * Effect substrate (lib/lab/state/dock-shell.port.ts) lives alongside for
 * cross-component subscription via the Stream · this hook is the local
 * UI binding.
 */
function useDockShellState(): [
  DockShellState,
  (patch: Partial<DockShellState>) => void,
] {
  const [state, setState] = useState<DockShellState>(DEFAULT_DOCK_SHELL_STATE);

  // Hydrate from localStorage on mount (SSR-safe · runs only client-side)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const decoded = decodeDockShellState(raw);
      if (decoded !== null) setState(decoded);
    } catch {
      // corruption-recovery: keep default · localStorage may be disabled
    }
  }, []);

  const update = (patch: Partial<DockShellState>) => {
    setState((current) => {
      const next = { ...current, ...patch };
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, encodeDockShellState(next));
        }
      } catch {
        // silent · disabled localStorage doesn't break UI
      }
      return next;
    });
  };

  return [state, update];
}

export function DockShell({ top, left, center, right, bottom }: DockShellProps) {
  const [state, setState] = useDockShellState();

  return (
    <div
      className="fixed inset-0 flex flex-col bg-puru-cloud-deep text-puru-ink-base font-puru-body"
      data-dock-shell
      data-bottom-collapsed={state.bottomCollapsed ? "true" : "false"}
    >
      {/* TOP region · fixed 48px · holds mode-tabs + breadcrumb + play button */}
      <header
        className="flex-none h-12 border-b border-puru-surface-border/30 bg-puru-cloud-deep/65 backdrop-blur-md flex items-center px-3 z-10"
        data-dock-region="top"
      >
        {top}
      </header>

      {/* MAIN region · vertical split for main + bottom-log */}
      <ResizablePanelGroup
        orientation="vertical"
        className="flex-1 min-h-0"
        data-dock-region-group="main+bottom"
      >
        <ResizablePanel
          defaultSize={state.bottomCollapsed ? 100 : 100 - state.bottomPanelSize}
          minSize={50}
          data-dock-region="main"
        >
          {/* MAIN region · horizontal split for left + center + right */}
          <ResizablePanelGroup
            orientation="horizontal"
            className="h-full"
            data-dock-region-group="left+center+right"
          >
            <ResizablePanel
              defaultSize={state.leftPanelSize}
              minSize={12}
              maxSize={40}
              onResize={(size) => setState({ leftPanelSize: size.asPercentage })}
              data-dock-region="left"
            >
              <div className="h-full border-r border-puru-surface-border/30 overflow-auto">
                {left}
              </div>
            </ResizablePanel>

            <ResizableHandle className="bg-puru-surface-border/40 hover:bg-puru-honey-base/40 transition-colors" />

            <ResizablePanel defaultSize={100 - state.leftPanelSize - state.rightPanelSize} data-dock-region="center">
              <div className="h-full overflow-hidden">{center}</div>
            </ResizablePanel>

            <ResizableHandle className="bg-puru-surface-border/40 hover:bg-puru-honey-base/40 transition-colors" />

            <ResizablePanel
              defaultSize={state.rightPanelSize}
              minSize={15}
              maxSize={45}
              onResize={(size) => setState({ rightPanelSize: size.asPercentage })}
              data-dock-region="right"
            >
              <div className="h-full border-l border-puru-surface-border/30 overflow-auto">
                {right}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        {bottom && !state.bottomCollapsed && (
          <>
            <ResizableHandle className="bg-puru-surface-border/40 hover:bg-puru-honey-base/40 transition-colors" />
            <ResizablePanel
              defaultSize={state.bottomPanelSize}
              minSize={10}
              maxSize={50}
              onResize={(size) => setState({ bottomPanelSize: size.asPercentage })}
              data-dock-region="bottom"
            >
              <div className="h-full border-t border-puru-surface-border/30 overflow-auto">
                {bottom}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

/**
 * Companion hook · exposes the bottom-collapsed toggle so LogConsole.tsx
 * can render its expand/collapse button.
 */
export function useDockShellBottom(): {
  collapsed: boolean;
  toggle: () => void;
  reset: () => void;
} {
  const [state, setState] = useDockShellState();
  return {
    collapsed: state.bottomCollapsed,
    toggle: () => setState({ bottomCollapsed: !state.bottomCollapsed }),
    reset: () => {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // silent
      }
      window.location.reload();
    },
  };
}
