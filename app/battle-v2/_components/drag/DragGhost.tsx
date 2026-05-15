/**
 * DragGhost — the dragged card, following the cursor.
 *
 * Renders a live CardStack at the pointer while a drag is active. It leans
 * toward the drag direction (a velocity tilt — like a thrown card) and decays
 * back to flat when the pointer rests. Mounted once in HudOverlay; purely
 * cosmetic, never catches pointer events.
 */

"use client";

import { useRef } from "react";

import { CardStack } from "@/lib/cards/layers";

import { useDragState } from "./dragStore";
import "./drag.css";

export function DragGhost() {
  const drag = useDragState();
  const lastX = useRef<number | null>(null);
  const tilt = useRef(0);

  if (drag.phase !== "dragging") {
    lastX.current = null;
    tilt.current = 0;
    return null;
  }

  // Velocity lean — the ghost tilts toward the drag direction and decays back
  // to flat when the pointer rests.
  const dx = lastX.current === null ? 0 : drag.pointer.x - lastX.current;
  lastX.current = drag.pointer.x;
  tilt.current = Math.max(-16, Math.min(16, tilt.current * 0.55 + dx * 0.8));

  return (
    <div
      className="drag-ghost"
      aria-hidden="true"
      style={{
        left: drag.pointer.x,
        top: drag.pointer.y,
        transform: `translate(-50%, -50%) rotate(${tilt.current.toFixed(2)}deg) scale(1.06)`,
      }}
    >
      <div className="drag-ghost__card">
        <CardStack element={drag.element} rarity={drag.rarity} alt="" />
      </div>
    </div>
  );
}
