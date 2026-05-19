/**
 * Shape A · Figma-literal layers panel
 *
 * Flat-or-nested rows · eye/lock icons · click row = select.
 * Closest to Figma's actual layers panel UX.
 */

"use client";

import { Icon } from "@/lib/ui/icons/Icon";
import type { EntityTreeNode } from "@/lib/lab/adapter-registry/types";

interface ShapeProps {
  tree: readonly EntityTreeNode[];
  selectedNodeId?: string;
  onSelect?: (node: EntityTreeNode) => void;
  depth?: number;
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
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          paddingLeft: 10 + depth * 16,
          background: isSelected ? "rgba(255, 170, 0, 0.18)" : "transparent",
          border: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
          color: isSelected ? "#ffaa00" : "rgba(255, 255, 255, 0.85)",
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
        }}
        data-shape="A"
        data-node-id={node.id}
      >
        <Icon name="visibility-on" size={12} />
        <Icon name="unlock" size={12} />
        <span style={{ flex: 1 }}>{node.label}</span>
        <span style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.4)" }}>{node.kind}</span>
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

export function ShapeA_FigmaLiteral({ tree, selectedNodeId, onSelect }: ShapeProps) {
  return (
    <div data-composability-shape="A">
      {tree.map((node) => (
        <Row key={node.id} node={node} selectedNodeId={selectedNodeId} onSelect={onSelect} depth={0} />
      ))}
    </div>
  );
}
