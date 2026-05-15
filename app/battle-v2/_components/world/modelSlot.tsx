/**
 * ModelSlot — the GLB swap scaffold.
 *
 * Per build doc Session 8 + the operator's "procedural first, swap later"
 * decision.
 *
 * Every place a real model could eventually live (a zone hut, the Sora Tower,
 * a daemon) renders through a `<ModelSlot slotId fallback>`. In V1 the registry
 * is empty, so every slot renders its procedural fallback. To swap in a real
 * model — MeshyAI bespoke, or a CC0 kit asset dropped under `public/models/` —
 * add one line to `SLOT_MODELS`. Nothing else changes: the click/hover/state
 * behaviour lives on the zone group around the slot, not in the model.
 *
 * Must render inside the Canvas's <Suspense> boundary (WorldMap3D provides it)
 * — `useGLTF` suspends while a model loads.
 */

"use client";

import { useMemo, type ReactNode } from "react";

import { useGLTF } from "@react-three/drei";

export interface SlotModel {
  /** Path under `public/` — e.g. "/models/wood_hut.glb". */
  readonly gltf: string;
  readonly scale?: number;
  readonly position?: readonly [number, number, number];
  readonly rotationY?: number;
}

/**
 * The model registry. EMPTY in V1 — every slot renders procedurally.
 *
 * To swap a slot, add an entry keyed by slotId:
 *   "zone.wood_grove": { gltf: "/models/wood_hut.glb", scale: 1 },
 *   "zone.fire_station": { gltf: "/models/forge.glb", scale: 1.1, rotationY: Math.PI },
 */
export const SLOT_MODELS: Record<string, SlotModel> = {};

function GltfModel({ model }: { model: SlotModel }) {
  const { scene } = useGLTF(model.gltf);
  // Clone so one GLB can fill several slots without sharing a scene-graph node.
  const object = useMemo(() => scene.clone(true), [scene]);
  return (
    <primitive
      object={object}
      scale={model.scale ?? 1}
      position={model.position ?? [0, 0, 0]}
      rotation={[0, model.rotationY ?? 0, 0]}
    />
  );
}

interface ModelSlotProps {
  readonly slotId: string;
  /** The procedural build — rendered until a GLB is registered for this slot. */
  readonly fallback: ReactNode;
}

export function ModelSlot({ slotId, fallback }: ModelSlotProps) {
  const model = SLOT_MODELS[slotId];
  if (!model) return <>{fallback}</>;
  return <GltfModel model={model} />;
}

// Preload any registered models so a swap is seamless (no-op while empty).
for (const model of Object.values(SLOT_MODELS)) {
  useGLTF.preload(model.gltf);
}
