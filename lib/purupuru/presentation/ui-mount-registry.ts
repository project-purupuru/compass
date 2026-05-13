/**
 * UI-mount registry — handles for ui.* / card.* / zone.* / vfx.* surfaces.
 *
 * Per SDD r1 §3 / §6 + Codex SKP-HIGH-005. Catches the broad surface category
 * of "stuff the sequencer paints onto" that isn't a coordinate anchor, animated
 * actor, or audio bus.
 */

import type { ContentId } from "../contracts/types";

export type UiMountId = ContentId;
export type UiMountKind = "ui" | "card" | "zone" | "vfx";

export interface UiMountHandle {
  readonly id: UiMountId;
  readonly kind: UiMountKind;
  readonly registeredAt: number;
}

export interface UiMountRegistry {
  register(id: UiMountId, kind?: UiMountKind): UiMountHandle;
  get(id: UiMountId): UiMountHandle | undefined;
  has(id: UiMountId): boolean;
  unregister(id: UiMountId): boolean;
  reset(): void;
  list(): readonly UiMountId[];
}

function inferKind(id: UiMountId): UiMountKind {
  if (id.startsWith("ui.")) return "ui";
  if (id.startsWith("card.")) return "card";
  if (id.startsWith("zone.")) return "zone";
  if (id.startsWith("vfx.")) return "vfx";
  return "ui"; // default fallback
}

export function createUiMountRegistry(): UiMountRegistry {
  const map = new Map<UiMountId, UiMountHandle>();
  return {
    register(id, kind) {
      const k = kind ?? inferKind(id);
      const h: UiMountHandle = {
        id,
        kind: k,
        registeredAt: performance.now(),
      };
      map.set(id, h);
      return h;
    },
    get(id) {
      return map.get(id);
    },
    has(id) {
      return map.has(id);
    },
    unregister(id) {
      return map.delete(id);
    },
    reset() {
      map.clear();
    },
    list() {
      return [...map.keys()];
    },
  };
}
