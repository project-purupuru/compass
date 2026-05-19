/**
 * Inspector · right-rail (Thread B · ADR-2)
 *
 * V0 Inspector with Pointer-chain tab populated. Data/Render/Edit tabs are
 * stubs (intentional · land in follow-up sprint per "no big bang" principle).
 *
 * Width: 320px (per FR-S4.1). Collapsible (toggle in header). Persists collapse
 * state to sessionStorage (per SDD §2.2 persistence table).
 */

"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/lib/ui/icons/Icon";
import { segmentLabel, type PointerChain } from "@/lib/lab/pointer-chain/schema";
import type { InspectableNode } from "@/lib/lab/adapter-registry/types";

const STORAGE_KEY = "lab.inspector.collapsed";

type Tab = "pointer-chain" | "data" | "render" | "edit";

interface InspectorProps {
  selectedNode: InspectableNode | null;
  pointerChain: PointerChain | null;
  onClose?: () => void;
}

export function Inspector({ selectedNode, pointerChain, onClose }: InspectorProps) {
  // Default to collapsed so the Inspector doesn't overlap existing rails on first mount;
  // operator opens via the side FAB.
  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("pointer-chain");

  // Hydrate collapse state from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.sessionStorage.getItem(STORAGE_KEY);
      if (v === "0") setCollapsed(false);
    } catch {
      // silent
    }
  }, []);

  // Persist collapse state
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
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(0, 0, 0, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRight: "none",
          borderTopLeftRadius: 6,
          borderBottomLeftRadius: 6,
          padding: "8px 6px",
          color: "rgba(255, 255, 255, 0.8)",
          cursor: "pointer",
          zIndex: 30,
        }}
        title="Open Inspector"
        data-inspector-collapsed
      >
        <Icon name="inspect" size={16} />
      </button>
    );
  }

  return (
    <aside
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 320,
        background: "rgba(10, 10, 10, 0.92)",
        backdropFilter: "blur(12px)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
        color: "rgba(255, 255, 255, 0.92)",
        fontFamily: "ui-sans-serif, -apple-system, sans-serif",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
        zIndex: 25,
      }}
      data-inspector
      data-inspector-tab={activeTab}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Icon name="inspect" size={14} />
        <span style={{ flex: 1, fontWeight: 600 }}>Inspector</span>
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
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: 4,
              display: "inline-flex",
            }}
            title="Close"
          >
            <Icon name="discard" size={12} />
          </button>
        )}
      </header>

      {/* Tabs */}
      <nav style={{ display: "flex", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        {(["pointer-chain", "data", "render", "edit"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "8px 6px",
              background: activeTab === tab ? "rgba(255, 170, 0, 0.12)" : "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #ffaa00" : "2px solid transparent",
              color: activeTab === tab ? "#ffaa00" : "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "inherit",
              textTransform: "capitalize",
            }}
          >
            {tab.replace("-", " ")}
          </button>
        ))}
      </nav>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {!selectedNode && (
          <div style={{ color: "rgba(255, 255, 255, 0.4)", textAlign: "center", padding: 24 }}>
            <p>Click an entity in the viewport to inspect.</p>
          </div>
        )}

        {selectedNode && activeTab === "pointer-chain" && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedNode.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>
                {selectedNode.kind}
              </div>
            </div>
            {pointerChain && pointerChain.length > 0 ? (
              <ol
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {pointerChain.map((seg, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "8px 10px",
                      background: "rgba(255, 255, 255, 0.04)",
                      borderLeft: "2px solid rgba(255, 170, 0, 0.6)",
                      borderRadius: 3,
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.5)", marginBottom: 2 }}>
                      {seg._tag}
                    </div>
                    <div>{segmentLabel(seg)}</div>
                    {("path" in seg) && (
                      <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.5)", marginTop: 2 }}>
                        {seg.path}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div style={{ color: "rgba(255, 255, 255, 0.5)" }}>No chain available.</div>
            )}
          </div>
        )}

        {selectedNode && activeTab === "data" && (
          <pre
            style={{
              fontSize: 11,
              fontFamily: "ui-monospace, monospace",
              color: "rgba(255, 255, 255, 0.8)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(selectedNode.metadata, null, 2)}
          </pre>
        )}

        {selectedNode && activeTab === "render" && (
          <div style={{ color: "rgba(255, 255, 255, 0.6)" }}>
            <p>Render summary (V0 stub — populated in S4 workspace polish).</p>
            <pre style={{ fontSize: 11 }}>id: {selectedNode.id}</pre>
            <pre style={{ fontSize: 11 }}>kind: {selectedNode.kind}</pre>
            <pre style={{ fontSize: 11 }}>inspectable: {String(selectedNode.inspectable)}</pre>
          </div>
        )}

        {selectedNode && activeTab === "edit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(JSON.stringify(pointerChain ?? [], null, 2));
                }
              }}
              style={{
                padding: "8px 12px",
                background: "rgba(255, 170, 0, 0.12)",
                border: "1px solid rgba(255, 170, 0, 0.4)",
                borderRadius: 4,
                color: "#ffaa00",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontFamily: "inherit",
              }}
            >
              <Icon name="copy" size={12} /> Copy pointer chain
            </button>
            <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>
              Edit affordances · V0 stub · expanded in S4 polish.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
