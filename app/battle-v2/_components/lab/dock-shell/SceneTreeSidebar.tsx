/**
 * SceneTreeSidebar · cycle-2 S4.3 · left region of dock-shell
 *
 * Re-hosts cycle-1's ShapeC_GodotTree inside the new dock-shell left region.
 * Replaces the cycle-1 ComposabilityPanel's fixed-position aside (cycle-1
 * pattern is collapse-to-FAB · cycle-2 dock-shell is persistent left region
 * with operator-resizable width).
 *
 * Row anatomy per sprint plan S4.3 spec (operator-visible · S4 ships the
 * scaffolding · S5 wires drill-in mutation · S6 wires Inspector live):
 *   - chevron (collapse/expand) — already in cycle-1 ShapeC_GodotTree
 *   - element-accent left-edge — added via ShapeC_GodotTree internal
 *     element-aware coloring (cycle-1 may not have this; future polish)
 *   - label — already in ShapeC_GodotTree
 *   - tier-stamp Badge — DEFERRED to S5/S6 (cycle-1 tree rows don't carry
 *     tier-stamp metadata yet · the metadata lives on adapter level not
 *     EntityTreeNode level)
 *   - tri-state eye Toggle (visibility · Eisel pattern from the-easel
 *     REF-3) — DEFERRED to S5+ (cycle-1 has no visibility state on tree)
 *   - ContextMenu — DEFERRED to S5+ (cycle-1 tree rows aren't context-
 *     menu-eligible yet)
 *
 * For S4 · this component delivers the LEFT-region scaffold · S5/S6 will
 * enhance the row anatomy as the supporting metadata lands. Documented
 * inline so the operator can review the deferral rationale.
 *
 * API: takes a `tree: readonly EntityTreeNode[]` (cycle-1 contract · no
 * changes to EntityTreeNode shape). Selection callback + selectedNodeId
 * preserved.
 */

"use client";

import { Icon } from "@/lib/ui/icons/Icon";
import type { EntityTreeNode } from "@/lib/lab/adapter-registry/types";

import { ShapeC_GodotTree } from "../composability/ShapeC-GodotTree";

interface SceneTreeSidebarProps {
  tree: readonly EntityTreeNode[];
  selectedNodeId?: string;
  onSelect?: (node: EntityTreeNode) => void;
}

export function SceneTreeSidebar({
  tree,
  selectedNodeId,
  onSelect,
}: SceneTreeSidebarProps) {
  return (
    <aside
      className="h-full flex flex-col bg-puru-cloud-deep/40 text-puru-ink-base font-puru-body text-xs"
      data-scene-tree-sidebar
    >
      <header className="flex-none flex items-center gap-1.5 px-3 py-2 border-b border-puru-surface-border/30">
        <Icon name="layers" size={14} />
        <span className="flex-1 font-semibold text-puru-ink-rich">
          Scene Tree
        </span>
        <span className="text-[10px] text-puru-ink-dim font-puru-mono">
          {tree.length} {tree.length === 1 ? "entity" : "entities"}
        </span>
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
