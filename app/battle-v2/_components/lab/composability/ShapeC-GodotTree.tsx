/**
 * Shape C · Godot-shaped tree
 *
 * Nested tree with columns: label · scene-ref · override-state · source-path.
 * Diverges from Figma toward DCC tree-view (Godot Scene Tree dock).
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

function getSourcePath(node: EntityTreeNode): string {
  // First Pantry or Primitive segment carries the path.
  const seg = node.pointerChain.find((s) => s._tag === "Pantry" || s._tag === "Primitive");
  if (!seg) return "—";
  if (seg._tag === "Pantry") return seg.path;
  if (seg._tag === "Primitive") return seg.path;
  return "—";
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
          display: "grid",
          gridTemplateColumns: "1fr 60px",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          paddingLeft: 10 + depth * 14,
          background: isSelected ? "rgba(255, 170, 0, 0.18)" : "transparent",
          border: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
          color: isSelected ? "#ffaa00" : "rgba(255, 255, 255, 0.85)",
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
        }}
        data-shape="C"
        data-node-id={node.id}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {depth > 0 && (
            <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>{"└─"}</span>
          )}
          <Icon name={node.children.length > 0 ? "layers" : "raw"} size={10} />
          <span>{node.label}</span>
        </div>
        <div style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.5)", textAlign: "right" }}>
          {node.kind}
        </div>
      </button>
      <div
        style={{
          paddingLeft: 10 + depth * 14 + 18,
          fontSize: 9.5,
          fontFamily: "ui-monospace, monospace",
          color: "rgba(255, 255, 255, 0.4)",
          paddingBottom: 4,
          borderBottom: "1px solid rgba(255, 255, 255, 0.02)",
          wordBreak: "break-all",
        }}
      >
        {getSourcePath(node)}
      </div>
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

export function ShapeC_GodotTree({ tree, selectedNodeId, onSelect }: ShapeProps) {
  return (
    <div data-composability-shape="C">
      {tree.map((node) => (
        <Row key={node.id} node={node} selectedNodeId={selectedNodeId} onSelect={onSelect} depth={0} />
      ))}
    </div>
  );
}
