/**
 * useFences — fence state with localStorage persistence.
 *
 * A "fence" is an operator-drawn rectangle over the battle-v2 UI, carrying a
 * label, a free-text refinement note, and a resolved DOM hint (see
 * dom-resolve.ts). Fences persist per-route in localStorage so a refinement
 * pass survives reloads.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import type { FenceDomHint, RectPct } from "./dom-resolve";
import { DUPLICATE_IOU, iou } from "./rect-utils";

export interface Fence {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  /** The operator-drawn rectangle (viewport %). */
  readonly rect: RectPct;
  readonly dom: FenceDomHint | null;
  readonly createdAt: string;
}

const STORAGE_KEY = "battle-v2:fences:v1";

function loadInitial(): readonly Fence[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Fence[]) : [];
  } catch {
    return [];
  }
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `fence-${Date.now().toString(36)}-${idCounter}`;
}

/** How richly annotated a fence is — used to pick the survivor when deduping. */
function annotationScore(f: Fence): number {
  return (f.label.trim() ? 2 : 0) + (f.note.trim() ? 1 : 0);
}

export interface UseFencesResult {
  readonly fences: readonly Fence[];
  readonly addFence: (rect: RectPct, dom: FenceDomHint | null) => string;
  readonly updateFence: (id: string, patch: Partial<Pick<Fence, "label" | "note">>) => void;
  readonly deleteFence: (id: string) => void;
  readonly clearAll: () => void;
  /** Collapse fences that cover the same region — keeps the better-annotated one. */
  readonly dedupeFences: () => number;
}

export function useFences(): UseFencesResult {
  const [fences, setFences] = useState<readonly Fence[]>(loadInitial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fences));
    } catch {
      // Storage full or unavailable — fences stay in memory for this session.
    }
  }, [fences]);

  const addFence = useCallback((rect: RectPct, dom: FenceDomHint | null): string => {
    const id = nextId();
    const fence: Fence = {
      id,
      label: "",
      note: "",
      rect,
      dom,
      createdAt: new Date().toISOString(),
    };
    setFences((prev) => [...prev, fence]);
    return id;
  }, []);

  const updateFence = useCallback(
    (id: string, patch: Partial<Pick<Fence, "label" | "note">>) => {
      setFences((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    },
    [],
  );

  const deleteFence = useCallback((id: string) => {
    setFences((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFences([]);
  }, []);

  const dedupeFences = useCallback((): number => {
    const kept: Fence[] = [];
    let removed = 0;
    for (const f of fences) {
      const dupIdx = kept.findIndex((k) => iou(k.rect, f.rect) > DUPLICATE_IOU);
      if (dupIdx >= 0) {
        removed += 1;
        if (annotationScore(f) > annotationScore(kept[dupIdx])) kept[dupIdx] = f;
      } else {
        kept.push(f);
      }
    }
    if (removed > 0) setFences(kept);
    return removed;
  }, [fences]);

  return { fences, addFence, updateFence, deleteFence, clearAll, dedupeFences };
}
