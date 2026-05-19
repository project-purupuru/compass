/**
 * LogConsole · cycle-2 S4.4 · bottom region of dock-shell
 *
 * Per OQ-3 (resolved at sprint-plan time): SUBSET subscription · log only
 * events that matter to the operator's current observability needs:
 *   - selection events (operator selects an entity in scene-tree)
 *   - drill-in events (operator drills into a composition · S5)
 *   - workspace-switch events (BUILD ↔ LIBRARY)
 *   - errors (substrate-level failures · adapter init · etc.)
 *   - operator-tagged events (any event the operator explicitly tags)
 *
 * Prevents noise: NOT logging every adapter re-render · every Three.js
 * frame · every state mutation. The filter is what makes the log useful
 * vs. firehose.
 *
 * Default-collapsed per FR-7 (bottom region collapsible · default closed).
 * Operator expands via the up-arrow at the bottom-right of the dock or
 * via a future keyboard shortcut (S7 polish · `~` toggle).
 *
 * Stream subscription: S4 ships the STUB · S6 wires the actual Effect
 * Stream from the substrate (PointerChain consumers · adapter-registry
 * events · etc.). Cycle-2 minimum: log entries can be PUSHED via
 * operator-side handlers (e.g., scene-tree-click) and rendered here.
 */

"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/lib/ui/icons/Icon";

export interface LogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly category:
    | "selection"
    | "drill-in"
    | "workspace-switch"
    | "error"
    | "operator-tagged";
  readonly message: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

interface LogConsoleProps {
  /** Log entries to render · ordered oldest → newest · auto-scrolls to bottom */
  entries: readonly LogEntry[];
  /** Optional onClear callback if operator wants to wipe the log */
  onClear?: () => void;
}

const CATEGORY_COLORS: Record<LogEntry["category"], string> = {
  selection: "text-puru-honey-base",
  "drill-in": "text-puru-wood-vivid",
  "workspace-switch": "text-puru-water-vivid",
  error: "text-puru-terra-base",
  "operator-tagged": "text-puru-fire-vivid",
};

export function LogConsole({ entries, onClear }: LogConsoleProps) {
  // Auto-scroll to newest entry on update
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef !== null) {
      containerRef.scrollTop = containerRef.scrollHeight;
    }
  }, [entries.length, containerRef]);

  return (
    <div
      className="h-full flex flex-col bg-puru-cloud-deep/50 text-puru-ink-base font-puru-mono text-xs"
      data-log-console
    >
      <header className="flex-none flex items-center gap-1.5 px-3 py-1.5 border-b border-puru-surface-border/30">
        <Icon name="data" size={12} />
        <span className="flex-1 font-semibold text-puru-ink-rich text-[11px]">
          Log Console
        </span>
        <span className="text-[10px] text-puru-ink-dim">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
        {onClear && entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-puru-ink-dim hover:text-puru-honey-base text-[10px] cursor-pointer ml-1"
            title="Clear log"
          >
            clear
          </button>
        )}
      </header>

      <div
        ref={setContainerRef}
        className="flex-1 overflow-auto px-3 py-1 leading-relaxed"
      >
        {entries.length === 0 ? (
          <div className="text-puru-ink-dim text-center py-4">
            No events. Subscribed to: selection · drill-in · workspace-switch · errors · operator-tagged.
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex gap-2 items-baseline py-0.5"
              data-log-category={entry.category}
            >
              <span className="text-[10px] text-puru-ink-dim shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span
                className={`text-[10px] uppercase tracking-wider shrink-0 ${CATEGORY_COLORS[entry.category]}`}
              >
                {entry.category}
              </span>
              <span className="text-puru-ink-base">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
