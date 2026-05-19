/**
 * ModeTabsBar · cycle-2 S3.2 (the BARTH-verb landing)
 *
 * Top-of-viewport horizontal tabs · BUILD + LIBRARY · per FR-4 (the-arcade
 * probe verdict). Replaces cycle-1's 3-tab WorkspacesTabs (compose/preview/
 * export) with 2 observation-slice tabs + PlayButton header button (sibling
 * component · authored alongside in S3.2).
 *
 * Reads/writes the re-verbed WorkspaceTabId (build|library) from S3.1.
 * Keyboard shortcuts ⌘1/⌘2 carry forward from cycle-1 useActiveWorkspace
 * (auto-rebuilt on the new verb set).
 *
 * Element-accent on tab indicator (artisan FR-17): active tab gets
 * --puru-honey-base accent · plus a 1px left-edge tier-stamp position for
 * future S6 element-aware coloring (e.g. when a wood-element entity is
 * selected, the tabs that hold its data could carry wood-tint accent).
 */

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@/lib/ui/icons/Icon";
import type { IconName } from "@/lib/ui/icons/names";

import type { WorkspaceTabId } from "../workspaces/WorkspacesTabs";

const TABS: Array<{
  id: WorkspaceTabId;
  label: string;
  icon: IconName;
  shortcut: string;
}> = [
  { id: "build", label: "Build", icon: "workspace-compose", shortcut: "1" },
  { id: "library", label: "Library", icon: "workspace-preview", shortcut: "2" },
];

interface ModeTabsBarProps {
  active: WorkspaceTabId;
  onChange: (id: WorkspaceTabId) => void;
  className?: string;
}

export function ModeTabsBar({ active, onChange, className }: ModeTabsBarProps) {
  return (
    <Tabs
      value={active}
      onValueChange={(v) => onChange(v as WorkspaceTabId)}
      className={className}
      data-mode-tabs-bar
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
              data-mode-tab-id={tab.id}
              data-active={isActive ? "true" : undefined}
              title={`${tab.label} · ⌘${tab.shortcut}`}
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
