/**
 * Shared Tweakpane utilities for the dev panels.
 *
 * Centralizes:
 *   - FpsGraph mounting (registered as a blade via the essentials plugin)
 *   - Preset save/load to localStorage
 *   - Common type-cast helpers
 *
 * The essentials plugin gives us FpsGraph, IntervalSlider, RadioGrid, and
 * ButtonGrid — none of which ship in core Tweakpane v4.
 */

import { type FolderApi, Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";

/** Tweakpane v4's published types are narrower than runtime. Cast to this
 * shape for `dispose`, `refresh`, `on`, `addFolder`, `addButton`, `addBlade`,
 * `registerPlugin` — all exist on the actual Pane object. */
export type PaneEx = FolderApi & {
  readonly dispose: () => void;
  readonly refresh: () => void;
  readonly on: (event: string, handler: (e: { value: unknown }) => void) => void;
  readonly registerPlugin: (plugin: unknown) => void;
};

/** Per-instance registration. Tweakpane v4 plugin registration is
 * pane-scoped, NOT global — every pane must call this. */
export function registerEssentials(pane: PaneEx): void {
  pane.registerPlugin(EssentialsPlugin);
}

/** Add an FpsGraph at the top of the pane. Returns the blade. */
export function addFpsGraph(pane: PaneEx | FolderApi, label = "fps") {
  return (pane as PaneEx).addBlade({
    view: "fpsgraph",
    label,
    rows: 2,
  });
}

/** Construct a Pane and cast to PaneEx in one place. */
export function makePane(opts: { container?: HTMLElement; title?: string }): PaneEx {
  return new Pane(opts) as unknown as PaneEx;
}

const PRESET_PREFIX = "puru-devpanel-preset-";

export function savePreset(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRESET_PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadPreset<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PRESET_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function copyJsonToClipboard(value: unknown): void {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  navigator.clipboard.writeText(JSON.stringify(value, null, 2)).catch(() => {
    /* ignore */
  });
}
