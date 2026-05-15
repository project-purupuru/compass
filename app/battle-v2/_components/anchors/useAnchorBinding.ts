/**
 * useAnchorBinding — binds a real ref (DOM node or R3F mesh) to a named anchor,
 * writing its live screen-space position into the AnchorStore.
 *
 * Per build doc step 1 — the keystone. Nothing else works without it: the
 * sequencer fires beats into the void until effects have somewhere to land.
 *
 * Two binders, one space:
 *   - `useDomAnchorBinding`  — for DOM nodes (the card hand). getBoundingClientRect.
 *   - `useMeshAnchorBinding` — for R3F objects (the grove seedling, the daemon).
 *     MUST be called inside <Canvas>. Projects world→screen every frame.
 *
 * Both resolve to the same viewport-relative CSS-pixel space, so a DOM-anchored
 * VFX overlay and a 3D-anchored one share one coordinate system.
 */

"use client";

import { useEffect, type DependencyList, type RefObject } from "react";

import { useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { Vector3 } from "three";

import type { AnchorStore } from "./anchorStore";
import { useThrottledFrame } from "../world/useThrottledFrame";

// ────────────────────────────────────────────────────────────────────────────
// DOM anchor — getBoundingClientRect center, re-measured on layout shifts
// ────────────────────────────────────────────────────────────────────────────

/**
 * Bind a DOM element's center to a named anchor.
 *
 * Re-measures on mount, on window resize, and on ResizeObserver fire (catches
 * the hand re-laying-out as cards arm/disarm). `deps` forces a remeasure when
 * caller state changes. Clears the anchor on unmount — a beat that fires
 * against an unbound anchor simply has nowhere to land (fail-soft).
 */
export function useDomAnchorBinding(
  store: AnchorStore,
  id: string,
  ref: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
): void {
  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) {
        store.set(id, null);
        return;
      }
      const r = el.getBoundingClientRect();
      store.set(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
      store.set(id, null);
    };
    // store/id/ref are stable; deps are the caller's intentional remeasure triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, id, ref, ...deps]);
}

// ────────────────────────────────────────────────────────────────────────────
// Mesh anchor — world position projected to screen px every frame
// ────────────────────────────────────────────────────────────────────────────

// Scratch vector — useFrame is synchronous, so a module-level reuse is safe.
const _world = new Vector3();

/**
 * Bind an R3F object's world position to a named anchor. Call inside <Canvas>.
 *
 * Projects through the live camera every frame so the anchor tracks the object
 * even as CameraRig leans — a VFX overlay reading this anchor stays glued to
 * the 3D thing it belongs to.
 */
export function useMeshAnchorBinding(
  store: AnchorStore,
  id: string,
  ref: RefObject<THREE.Object3D | null>,
): void {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useThrottledFrame(30, () => {
    const obj = ref.current;
    if (!obj) return;
    obj.getWorldPosition(_world);
    _world.project(camera);
    // NDC [-1,1] → CSS px, offset by the canvas's own viewport rect so the
    // result matches getBoundingClientRect() space used by DOM anchors.
    const x = (_world.x * 0.5 + 0.5) * size.width + size.left;
    const y = (-_world.y * 0.5 + 0.5) * size.height + size.top;
    store.set(id, { x, y });
  });

  useEffect(() => {
    return () => store.set(id, null);
  }, [store, id]);
}

/**
 * Component wrapper for `useMeshAnchorBinding` — lets a parent bind an anchor
 * *conditionally* (hooks can't be called conditionally, but a component can be
 * rendered conditionally). Render this inside the object whose world position
 * should be tracked. Returns nothing.
 */
export function MeshAnchor({
  store,
  id,
  objectRef,
}: {
  store: AnchorStore;
  id: string;
  objectRef: RefObject<THREE.Object3D | null>;
}): null {
  useMeshAnchorBinding(store, id, objectRef);
  return null;
}
