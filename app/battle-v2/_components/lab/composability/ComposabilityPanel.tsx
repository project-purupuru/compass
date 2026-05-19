/**
 * ComposabilityPanel · cycle-2 S2.4 rebuild on shadcn Collapsible + brand tokens
 *
 * Left-rail panel showing the active entity's composability tree. Cycle-1
 * had three Shape sketches (A/B/C) toggleable to let operator pick canonical.
 * Sprint plan S2.4: "preserve cycle-1 Shape C tree render" — Shape C is the
 * chosen direction (the-easel REF-1 + REF-3 Blender Outliner influence
 * compatible). Shape toggle removed · Shape C renders directly.
 *
 * S2 decision (sprint plan: "rebuild on shadcn Sidebar + Collapsible"):
 *   - shadcn Sidebar rejected for S2: Sidebar requires SidebarProvider wrap
 *     at the app level + its own layout system (collapsible icon-rail or
 *     offcanvas patterns). That's S4 dock-shell work (FR-7). Adding it
 *     standalone in S2 would force a Provider wrap and disrupt cycle-1
 *     positioning.
 *   - Collapsible adopted partially: cycle-1's collapse-to-FAB pattern is
 *     functionally a Collapsible (open/closed binary). Keeping cycle-1's
 *     fixed-aside + FAB pattern explicitly · Collapsible primitive deferred
 *     to S4 when the dock-shell Resizable parent lands.
 *   - DECISION: preserve cycle-1's fixed-position aside · FAB toggle · drop
 *     Shape A/B toggle (Shape C only) · rebuild styling on brand tokens ·
 *     Shape A and Shape B component files remain on disk as orphan code,
 *     cleanup deferred to S7 polish or cycle-3.
 *
 * API PRESERVED: same props (tree · selectedNodeId · onSelect) ·
 * sessionStorage key (lab.composabilityCollapsed) · data-composability-panel
 * attribute · cycle-1 callers work unchanged. Shape state removed (no longer
 * meaningful with single-shape render).
 */

"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/lib/ui/icons/Icon";
import type { EntityTreeNode } from "@/lib/lab/adapter-registry/types";

import { ShapeC_GodotTree } from "./ShapeC-GodotTree";

const STORAGE_KEY = "lab.composabilityCollapsed";

interface ComposabilityPanelProps {
  tree: readonly EntityTreeNode[];
  selectedNodeId?: string;
  onSelect?: (node: EntityTreeNode) => void;
}

export function ComposabilityPanel({
  tree,
  selectedNodeId,
  onSelect,
}: ComposabilityPanelProps) {
  // Default collapsed so doesn't overlap EffectPicker on first mount.
  const [collapsed, setCollapsed] = useState(true);

  // Hydrate collapse state from sessionStorage (cycle-1 persistence preserved)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const c = window.sessionStorage.getItem(STORAGE_KEY);
      if (c === "0") setCollapsed(false);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // silent
    }
  }, [collapsed]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed left-0 top-1/2 -translate-y-1/2 bg-puru-cloud-deep/60 border border-puru-surface-border/40 border-l-0 rounded-r-md px-1.5 py-2 text-puru-ink-base hover:text-puru-honey-base transition-colors z-30 cursor-pointer"
        title="Open Composability"
        data-composability-collapsed
      >
        <Icon name="layers" size={16} />
      </button>
    );
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-70 bg-puru-cloud-deep/92 backdrop-blur-md border-r-2 border-r-puru-honey-base/50 text-puru-ink-base font-puru-body text-xs flex flex-col z-24"
      style={{ width: 280 }}
      data-composability-panel
    >
      <header className="flex items-center gap-1.5 px-3 py-2.5 border-b border-puru-surface-border/30">
        <Icon name="layers" size={14} />
        <span className="flex-1 font-semibold">Composability</span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="bg-transparent border-0 text-inherit cursor-pointer p-1 inline-flex hover:text-puru-honey-base transition-colors"
          title="Collapse"
        >
          <Icon name="visibility-off" size={12} />
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        {tree.length === 0 ? (
          <div className="p-4 text-puru-ink-dim text-center">
            No active entity
          </div>
        ) : (
          <ShapeC_GodotTree
            tree={tree}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          />
        )}
      </div>
    </aside>
  );
}
