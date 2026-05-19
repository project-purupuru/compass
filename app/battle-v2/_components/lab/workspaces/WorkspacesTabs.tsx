/**
 * WorkspacesTabs · cycle-2 S2.3 rebuild on shadcn Tabs
 *
 * Top-of-viewport horizontal tabs with IconRegistry glyphs + Cmd/Ctrl+1/2/3
 * shortcut. Active workspace persisted to sessionStorage.
 *
 * S2 rebuild PRESERVES cycle-1 verbs (compose/preview/export). S3 re-verbs to
 * BUILD/LIBRARY + Play header button per FR-4 (BARTH probe verdict). S2 is
 * pure chrome rebuild · zero behavior change.
 *
 * API PRESERVED: WorkspaceTabId type · WorkspacesTabs props · useActiveWorkspace
 * hook · sessionStorage key (lab.activeWorkspace) · data-workspaces-tabs and
 * data-workspace-id + data-active attributes · cycle-1 callers work unchanged.
 */

"use client";

import { useEffect, useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@/lib/ui/icons/Icon";
import type { IconName } from "@/lib/ui/icons/names";

const STORAGE_KEY = "lab.activeWorkspace";

export type WorkspaceTabId = "compose" | "preview" | "export";

const TABS: Array<{
  id: WorkspaceTabId;
  label: string;
  icon: IconName;
  shortcut: string;
}> = [
  { id: "compose", label: "Compose", icon: "workspace-compose", shortcut: "1" },
  { id: "preview", label: "Preview", icon: "workspace-preview", shortcut: "2" },
  { id: "export", label: "Export", icon: "workspace-export", shortcut: "3" },
];

interface WorkspacesTabsProps {
  active: WorkspaceTabId;
  onChange: (id: WorkspaceTabId) => void;
}

export function WorkspacesTabs({ active, onChange }: WorkspacesTabsProps) {
  // Keyboard shortcuts: Cmd/Ctrl + 1/2/3 (cycle-1 behavior preserved)
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
    <Tabs
      value={active}
      onValueChange={(v) => onChange(v as WorkspaceTabId)}
      className="sticky top-0 z-22"
      data-workspaces-tabs
      data-active={active}
    >
      <TabsList className="gap-0.5 px-3 py-2 bg-puru-cloud-deep/65 backdrop-blur-md border-b border-puru-surface-border/30 rounded-none h-auto">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-puru-body data-[state=active]:bg-puru-honey-base/18 data-[state=active]:border data-[state=active]:border-puru-honey-base/50 data-[state=active]:text-puru-honey-base data-[state=active]:font-semibold data-[state=active]:shadow-none border border-transparent text-puru-ink-soft hover:text-puru-ink-base"
              data-workspace-id={tab.id}
              data-active={isActive ? "true" : undefined}
              title={`${tab.label} · Cmd/Ctrl+${tab.shortcut}`}
            >
              <Icon name={tab.icon} size={14} />
              <span>{tab.label}</span>
              <span
                className={`text-[9px] font-puru-mono ${isActive ? "text-puru-honey-base/60" : "text-puru-ink-dim"}`}
              >
                ⌘{tab.shortcut}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

/**
 * Hook: manage active workspace with sessionStorage persistence.
 * Cycle-1 API preserved.
 */
export function useActiveWorkspace(
  initial: WorkspaceTabId = "compose",
): [WorkspaceTabId, (id: WorkspaceTabId) => void] {
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
