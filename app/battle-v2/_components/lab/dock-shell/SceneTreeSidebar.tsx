/**
 * SceneTreeSidebar · cycle-2 S4.3 · left region of dock-shell
 *
 * Renders the active scene tree as a flat-list with honey-active state.
 * Narrow-column-friendly (no source-path columns · no overflowing pointer-
 * chain text). Cycle-1 ShapeC_GodotTree is fine for wide modal panels but
 * cramps at 22-30% viewport width · this simpler renderer composes
 * cleanly in the dock-shell left region.
 *
 * Row anatomy (sprint plan S4.3): cycle-2 minimum is label + kind + active
 * state. Future row-anatomy enhancements (tier-stamp Badge · tri-state eye
 * Toggle · ContextMenu) land in S5+ when the supporting metadata exists
 * on EntityTreeNode.
 *
 * API preserved (tree · selectedNodeId · onSelect) so callers swap
 * SceneTreeSidebar ↔ ShapeC_GodotTree without prop changes.
 */

"use client";

import { Icon } from "@/lib/ui/icons/Icon";
import type { EntityTreeNode } from "@/lib/lab/adapter-registry/types";

interface SceneTreeSidebarProps {
  tree: readonly EntityTreeNode[];
  selectedNodeId?: string;
  onSelect?: (node: EntityTreeNode) => void;
}

function Row({
  node,
  selectedNodeId,
  onSelect,
  depth = 0,
}: {
  node: EntityTreeNode;
  selectedNodeId?: string;
  onSelect?: (node: EntityTreeNode) => void;
  depth: number;
}) {
  const isSelected = selectedNodeId === node.id;
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect?.(node)}
        className={`w-full text-left inline-flex items-center gap-1.5 px-3 py-1.5 border-b border-puru-surface-border/20 font-puru-body text-xs cursor-pointer transition-colors ${
          isSelected
            ? "bg-puru-honey-base/15 text-puru-honey-base font-semibold"
            : "text-puru-ink-base hover:bg-puru-cloud-bright/10 hover:text-puru-ink-rich"
        }`}
        style={{ paddingLeft: 12 + depth * 12 }}
        data-tree-row
        data-node-id={node.id}
        data-active={isSelected ? "true" : undefined}
      >
        <Icon
          name={node.children.length > 0 ? "layers" : "raw"}
          size={11}
        />
        <span className="flex-1 truncate">{node.label}</span>
        <span className="text-[9px] text-puru-ink-dim font-puru-mono uppercase tracking-wider">
          {node.kind}
        </span>
      </button>
      {node.children.map((child) => (
        <Row
          key={child.id}
          node={child}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </>
  );
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
          {tree.length}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {tree.length === 0 ? (
          <div className="p-4 text-puru-ink-dim text-center">
            No active entity
          </div>
        ) : (
          tree.map((node) => (
            <Row
              key={node.id}
              node={node}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              depth={0}
            />
          ))
        )}
      </div>
    </aside>
  );
}
