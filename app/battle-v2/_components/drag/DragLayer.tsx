/**
 * DragLayer — window-level pointer + Esc tracking during a card drag.
 *
 * Renders nothing. While a drag is pending/active it forwards pointer-move to
 * the store (which promotes pending → dragging past the threshold) and ends
 * the drag on pointer-up. Esc cancels. Mounted once in HudOverlay.
 */

"use client";

import { useEffect } from "react";

import { cancelDrag, endDrag, updatePointer, useDragState } from "./dragStore";

export function DragLayer() {
  const { phase } = useDragState();
  const armed = phase !== "idle";

  useEffect(() => {
    if (!armed) return;
    const onMove = (e: PointerEvent) => updatePointer(e.clientX, e.clientY);
    const onUp = () => endDrag();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelDrag();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [armed]);

  return null;
}
