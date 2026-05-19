/**
 * WorkspacesTabs · Thread D (per FR-S6 + ADR-13 ratified Q6 top-tabs)
 *
 * Three workspaces: Compose / Preview / Export.
 * Top-of-viewport horizontal tabs with IconRegistry glyphs.
 * Keyboard: Cmd/Ctrl + 1/2/3 (Mac/Win aware).
 * Active workspace persisted to sessionStorage `lab.activeWorkspace`.
 */

"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/lib/ui/icons/Icon";
import type { IconName } from "@/lib/ui/icons/names";

const STORAGE_KEY = "lab.activeWorkspace";

export type WorkspaceTabId = "compose" | "preview" | "export";

const TABS: Array<{ id: WorkspaceTabId; label: string; icon: IconName; shortcut: string }> = [
  { id: "compose", label: "Compose", icon: "workspace-compose", shortcut: "1" },
  { id: "preview", label: "Preview", icon: "workspace-preview", shortcut: "2" },
  { id: "export", label: "Export", icon: "workspace-export", shortcut: "3" },
];

interface WorkspacesTabsProps {
  active: WorkspaceTabId;
  onChange: (id: WorkspaceTabId) => void;
}

export function WorkspacesTabs({ active, onChange }: WorkspacesTabsProps) {
  // Keyboard shortcuts: Cmd/Ctrl + 1/2/3
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const tab = TABS.find((t) => t.shortcut === e.key);
      if (!tab) return;
      e.preventDefault();
      onChange(tab.id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onChange]);

  return (
    <nav
      style={{
        display: "flex",
        gap: 2,
        padding: "8px 12px",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 22,
      }}
      data-workspaces-tabs
      data-active={active}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: isActive ? "rgba(255, 170, 0, 0.18)" : "transparent",
              border: isActive ? "1px solid rgba(255, 170, 0, 0.5)" : "1px solid transparent",
              borderRadius: 4,
              color: isActive ? "#ffaa00" : "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "ui-sans-serif, -apple-system, sans-serif",
              fontWeight: isActive ? 600 : 400,
            }}
            data-workspace-id={tab.id}
            data-active={isActive ? "true" : undefined}
            title={`${tab.label} · Cmd/Ctrl+${tab.shortcut}`}
          >
            <Icon name={tab.icon} size={14} />
            <span>{tab.label}</span>
            <span
              style={{
                fontSize: 9,
                color: isActive ? "rgba(255, 170, 0, 0.6)" : "rgba(255, 255, 255, 0.3)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              ⌘{tab.shortcut}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Hook: manage active workspace with sessionStorage persistence.
 */
export function useActiveWorkspace(initial: WorkspaceTabId = "compose"): [WorkspaceTabId, (id: WorkspaceTabId) => void] {
  const [active, setActive] = useState<WorkspaceTabId>(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved === "compose" || saved === "preview" || saved === "export") {
        setActive(saved);
      }
    } catch {
      // silent
    }
  }, []);

  const setActivePersisted = (id: WorkspaceTabId) => {
    setActive(id);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, id);
      } catch {
        // silent
      }
    }
  };

  return [active, setActivePersisted];
}
