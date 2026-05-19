/**
 * ComposabilityPanel · Thread C (3 sketched shapes · operator picks canonical)
 *
 * Per FR-S5: left-rail, ~280px, collapsible. Header includes ShapeToggle
 * (A / B / C) that switches between three rendering shapes against the
 * SAME active entity tree.
 *
 * After operator names canonical shape in S3.T12 + commits decision artifact
 * to grimoires/loa/distillations/composability-shape-decision-2026-05-18.md,
 * S5.T15 will remove the unselected shape files (cleanup).
 *
 * Per ADR-13: this panel READS from the pointer-chain schema (locks at S3.T10
 * in this PR — see lib/lab/pointer-chain/schema.ts SCHEMA_VERSION constant).
 */

"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/lib/ui/icons/Icon";
import { ShapeA_FigmaLiteral } from "./ShapeA-FigmaLiteral";
import { ShapeB_FigmaPointerChain } from "./ShapeB-FigmaPointerChain";
import { ShapeC_GodotTree } from "./ShapeC-GodotTree";
import type { EntityTreeNode } from "@/lib/lab/adapter-registry/types";

const STORAGE_KEY = "lab.composabilityShape";

export type ShapeId = "A" | "B" | "C";

interface ComposabilityPanelProps {
  tree: readonly EntityTreeNode[];
  selectedNodeId?: string;
  onSelect?: (node: EntityTreeNode) => void;
}

export function ComposabilityPanel({ tree, selectedNodeId, onSelect }: ComposabilityPanelProps) {
  const [shape, setShape] = useState<ShapeId>("A");
  // Default collapsed so doesn't overlap EffectPicker on first mount.
  const [collapsed, setCollapsed] = useState(true);

  // Hydrate shape + collapse from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const s = window.sessionStorage.getItem(STORAGE_KEY);
      if (s === "A" || s === "B" || s === "C") setShape(s);
      const c = window.sessionStorage.getItem("lab.composabilityCollapsed");
      if (c === "0") setCollapsed(false);
    } catch {
      // silent
    }
  }, []);

  // Persist shape changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, shape);
    } catch {
      // silent
    }
  }, [shape]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem("lab.composabilityCollapsed", collapsed ? "1" : "0");
    } catch {
      // silent
    }
  }, [collapsed]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        style={{
          position: "fixed",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(0, 0, 0, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderLeft: "none",
          borderTopRightRadius: 6,
          borderBottomRightRadius: 6,
          padding: "8px 6px",
          color: "rgba(255, 255, 255, 0.8)",
          cursor: "pointer",
          zIndex: 30,
        }}
        title="Open Composability"
        data-composability-collapsed
      >
        <Icon name="layers" size={16} />
      </button>
    );
  }

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 280,
        background: "rgba(10, 10, 10, 0.92)",
        backdropFilter: "blur(12px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        color: "rgba(255, 255, 255, 0.92)",
        fontFamily: "ui-sans-serif, -apple-system, sans-serif",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
        zIndex: 24,
      }}
      data-composability-panel
      data-shape={shape}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Icon name="layers" size={14} />
        <span style={{ flex: 1, fontWeight: 600 }}>Composability</span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            padding: 4,
            display: "inline-flex",
          }}
          title="Collapse"
        >
          <Icon name="visibility-off" size={12} />
        </button>
      </header>

      {/* Shape toggle */}
      <div
        style={{
          display: "flex",
          padding: "6px 8px",
          gap: 4,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {(["A", "B", "C"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setShape(id)}
            style={{
              flex: 1,
              padding: "4px 8px",
              background: shape === id ? "rgba(255, 170, 0, 0.18)" : "rgba(255, 255, 255, 0.04)",
              border: shape === id ? "1px solid rgba(255, 170, 0, 0.5)" : "1px solid transparent",
              borderRadius: 3,
              color: shape === id ? "#ffaa00" : "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              fontSize: 10,
              fontFamily: "inherit",
            }}
            title={
              id === "A"
                ? "Figma layers panel"
                : id === "B"
                  ? "Figma + inline pointer chain"
                  : "Godot-shaped tree"
            }
          >
            Shape {id}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {tree.length === 0 ? (
          <div style={{ padding: 16, color: "rgba(255, 255, 255, 0.4)", textAlign: "center" }}>
            No active entity
          </div>
        ) : shape === "A" ? (
          <ShapeA_FigmaLiteral tree={tree} selectedNodeId={selectedNodeId} onSelect={onSelect} />
        ) : shape === "B" ? (
          <ShapeB_FigmaPointerChain tree={tree} selectedNodeId={selectedNodeId} onSelect={onSelect} />
        ) : (
          <ShapeC_GodotTree tree={tree} selectedNodeId={selectedNodeId} onSelect={onSelect} />
        )}
      </div>
    </aside>
  );
}
