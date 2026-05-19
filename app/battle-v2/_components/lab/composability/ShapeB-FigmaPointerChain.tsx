/**
 * Shape B · Figma + inline pointer chain
 *
 * Layers panel UX but each row shows its full pointer chain as a subtitle.
 * Hybrid: Figma feel + compass substrate awareness.
 */

"use client";

import { Icon } from "@/lib/ui/icons/Icon";
import { segmentLabel } from "@/lib/lab/pointer-chain/schema";
import type { EntityTreeNode } from "@/lib/lab/adapter-registry/types";

interface ShapeProps {
  tree: readonly EntityTreeNode[];
  selectedNodeId?: string;
  onSelect?: (node: EntityTreeNode) => void;
  depth?: number;
}

function chainString(chain: EntityTreeNode["pointerChain"]): string {
  return chain.map(segmentLabel).join(" › ");
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
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
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
        data-shape="B"
        data-node-id={node.id}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
          <Icon name="layers" size={11} />
          <span style={{ flex: 1 }}>{node.label}</span>
          <span style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.4)" }}>{node.kind}</span>
        </div>
        <div
          style={{
            fontSize: 9.5,
            color: "rgba(255, 255, 255, 0.5)",
            fontFamily: "ui-monospace, monospace",
            marginLeft: 17,
            wordBreak: "break-all",
          }}
        >
          {chainString(node.pointerChain)}
        </div>
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

export function ShapeB_FigmaPointerChain({ tree, selectedNodeId, onSelect }: ShapeProps) {
  return (
    <div data-composability-shape="B">
      {tree.map((node) => (
        <Row key={node.id} node={node} selectedNodeId={selectedNodeId} onSelect={onSelect} depth={0} />
      ))}
    </div>
  );
}
