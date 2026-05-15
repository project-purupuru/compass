/**
 * dragStore — the seam for card drag-to-region.
 *
 * A module-level store (useSyncExternalStore). Both halves of the interaction
 * build against THIS and nothing else: the card side calls `beginPending`, the
 * map side calls `setHover`, BattleV2 registers `setDropHandler`. Neither side
 * edits the other's files — the store is the contract.
 *
 * Spec: grimoires/loa/context/16-battle-v2-card-drag-to-region.md
 */

"use client";

import { useSyncExternalStore } from "react";

import type { LayerRarity } from "@/lib/cards/layers";
import type { ElementId } from "@/lib/purupuru/contracts/types";

export type DragPhase = "idle" | "pending" | "dragging";

export interface DragState {
  readonly phase: DragPhase;
  readonly cardId: string | null;
  /** Visual payload for the ghost — set at beginPending. */
  readonly element: ElementId;
  readonly rarity: LayerRarity;
  /** Pointer-down position (screen px) — the promote-to-drag origin. */
  readonly origin: { readonly x: number; readonly y: number };
  /** Current pointer position (screen px). */
  readonly pointer: { readonly x: number; readonly y: number };
  /** Set by the map side's ground raycast while dragging. */
  readonly hoverRegion: ElementId | null;
  /** The droppable district zone for the hovered region (null = no valid drop). */
  readonly hoverZoneId: string | null;
}

export interface DragDrop {
  readonly cardId: string;
  readonly zoneId: string;
}

/** Pixels the pointer must travel before a pending press becomes a drag. */
const DRAG_THRESHOLD = 6;

const IDLE: DragState = {
  phase: "idle",
  cardId: null,
  element: "wood",
  rarity: "common",
  origin: { x: 0, y: 0 },
  pointer: { x: 0, y: 0 },
  hoverRegion: null,
  hoverZoneId: null,
};

let state: DragState = IDLE;
const listeners = new Set<() => void>();
let dropHandler: ((drop: DragDrop) => void) | null = null;

function emit(next: DragState) {
  state = next;
  for (const l of listeners) l();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot(): DragState {
  return state;
}

/** React hook — re-renders on any drag-state change. */
export function useDragState(): DragState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Card side — pointer-down on a CardFace. Not yet a visible drag. */
export function beginPending(payload: {
  readonly cardId: string;
  readonly element: ElementId;
  readonly rarity: LayerRarity;
  readonly pointer: { readonly x: number; readonly y: number };
}): void {
  emit({
    ...IDLE,
    phase: "pending",
    cardId: payload.cardId,
    element: payload.element,
    rarity: payload.rarity,
    origin: payload.pointer,
    pointer: payload.pointer,
  });
}

/** DragLayer — pointer-move. Promotes pending → dragging past the threshold. */
export function updatePointer(x: number, y: number): void {
  if (state.phase === "idle") return;
  let phase = state.phase;
  if (phase === "pending") {
    const dx = x - state.origin.x;
    const dy = y - state.origin.y;
    if (dx * dx + dy * dy >= DRAG_THRESHOLD * DRAG_THRESHOLD) phase = "dragging";
  }
  emit({ ...state, phase, pointer: { x, y } });
}

/** Map side — the ground raycast resolved the pointer to a region (or off-map). */
export function setHover(region: ElementId | null, zoneId: string | null): void {
  if (state.phase !== "dragging") return;
  if (state.hoverRegion === region && state.hoverZoneId === zoneId) return;
  emit({ ...state, hoverRegion: region, hoverZoneId: zoneId });
}

/** DragLayer — pointer-up. Fires the drop handler if there's a valid target. */
export function endDrag(): void {
  if (state.phase === "dragging" && state.cardId && state.hoverZoneId && dropHandler) {
    dropHandler({ cardId: state.cardId, zoneId: state.hoverZoneId });
  }
  emit(IDLE);
}

/** Esc, or a sub-threshold release (it was a click — let onClick run). */
export function cancelDrag(): void {
  if (state.phase === "idle") return;
  emit(IDLE);
}

/** BattleV2 registers the PlayCard fire here (coordination step). */
export function setDropHandler(fn: ((drop: DragDrop) => void) | null): void {
  dropHandler = fn;
}
