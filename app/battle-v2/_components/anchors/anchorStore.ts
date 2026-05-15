/**
 * AnchorStore — presentation-side screen-space position store.
 *
 * Per build doc "Data Architecture — the keystone seam".
 *
 * This is the POSITION layer. It is deliberately NOT the lib/purupuru
 * AnchorRegistry (that registry is the *contract* layer — the sequencer asks
 * it `.has(id)` to mark a beat resolved, and per invariant 1 lib/purupuru/**
 * stays untouched). This store holds the *where*: a viewport-relative CSS-pixel
 * point per named anchor, written by the components that own the real refs
 * (DOM nodes, R3F meshes) and read by the beat-driven VFX components.
 *
 * Both layers key off the SAME named anchor IDs — effects still originate and
 * land at named anchors, never hardcoded coordinates (invariant 3).
 *
 * Plain mutable object: no React state, no subscription. Writers (useFrame
 * projectors, ResizeObserver callbacks) set freely; readers (VFX components)
 * read imperatively at beat-fire time. A 2.3s ritual is a fast flash — reading
 * once on the beat avoids a 60fps re-render storm.
 */

/** Viewport-relative CSS pixels — same space as getBoundingClientRect(). */
export interface AnchorPoint {
  readonly x: number;
  readonly y: number;
}

export interface AnchorStore {
  /** Write a point, or `null` to clear (the ref unmounted / went stale). */
  set(id: string, point: AnchorPoint | null): void;
  /** Read the current point, or `null` if the anchor is unbound. */
  get(id: string): AnchorPoint | null;
}

export function createAnchorStore(): AnchorStore {
  const map = new Map<string, AnchorPoint>();
  return {
    set(id, point) {
      if (point === null) map.delete(id);
      else map.set(id, point);
    },
    get(id) {
      return map.get(id) ?? null;
    },
  };
}

/**
 * The named anchor IDs the wood-activation ritual lands on.
 * Mirrors `lib/purupuru/presentation/sequences/wood-activation.ts` requiredAnchors.
 */
export const ANCHOR = {
  handCardCenter: "anchor.hand.card.center",
  seedlingCenter: "anchor.wood_grove.seedling_center",
  petalColumn: "anchor.wood_grove.petal_column",
  focusRing: "anchor.wood_grove.focus_ring",
  daemonPrimary: "anchor.wood_grove.daemon.primary",
} as const;
