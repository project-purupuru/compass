/**
 * BlenderDataMock · in-memory test substrate · per-instance state.
 *
 * Mirrors the lib/world/awareness.mock.ts pattern: Layer.effect closures
 * over a fresh Ref so each test gets isolated state.
 *
 * Critical: this mock is what lets compass write agent-validation tests
 * WITHOUT a running Blender instance. The honeycomb-substrate doctrine
 * (port/live/mock) requires the mock to be a faithful behavior simulator,
 * not just a stub.
 */

import { Effect, Layer, PubSub, Ref, Stream } from "effect";

import {
  BlenderData,
  type BlenderDataChange,
  type BlenderDataError,
  type BlenderObject,
  type BlenderObjectPatch,
  type BlenderObjectSpec,
} from "./data.port";

/**
 * Default field values applied when createObject receives a sparse spec.
 * Match Blender's defaults so behavior diverges minimally between mock and
 * live.
 */
const DEFAULT_LOCATION: readonly [number, number, number] = [0, 0, 0];
const DEFAULT_ROTATION: readonly [number, number, number] = [0, 0, 0];
const DEFAULT_SCALE: readonly [number, number, number] = [1, 1, 1];

function applyDefaults(spec: BlenderObjectSpec): BlenderObject {
  return {
    name: spec.name,
    type: spec.type,
    location: spec.location ?? DEFAULT_LOCATION,
    rotation: spec.rotation ?? DEFAULT_ROTATION,
    scale: spec.scale ?? DEFAULT_SCALE,
    meshName: spec.meshName ?? null,
    materialNames: spec.materialNames ?? [],
    visible: spec.visible ?? true,
    parentName: spec.parentName ?? null,
  };
}

/**
 * BlenderDataMock factory. Seed lets tests start with a non-empty store.
 */
export const BlenderDataMock = (seed: readonly BlenderObject[] = []) =>
  Layer.effect(
    BlenderData,
    Effect.gen(function* () {
      // Per-instance state · Map keyed by object name for O(1) lookups
      const objects = yield* Ref.make<Map<string, BlenderObject>>(
        new Map(seed.map((o) => [o.name, o])),
      );
      // Bounded PubSub for change events — bound matches typical
      // depsgraph_update_post burst size · adjust if tests overflow.
      const changesPubSub = yield* PubSub.bounded<BlenderDataChange>(64);

      const emit = (change: BlenderDataChange) =>
        PubSub.publish(changesPubSub, change);

      const nowIso = () => new Date().toISOString();

      return BlenderData.of({
        listObjects: Ref.get(objects).pipe(
          Effect.map((m) => Array.from(m.values())),
        ),

        getObject: (name) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(objects);
            const obj = map.get(name);
            if (!obj) {
              return yield* Effect.fail<BlenderDataError>({
                _tag: "ObjectNotFound",
                name,
              });
            }
            return obj;
          }),

        createObject: (spec) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(objects);
            if (map.has(spec.name)) {
              return yield* Effect.fail<BlenderDataError>({
                _tag: "ObjectAlreadyExists",
                name: spec.name,
              });
            }
            const obj = applyDefaults(spec);
            yield* Ref.update(objects, (m) => {
              const next = new Map(m);
              next.set(obj.name, obj);
              return next;
            });
            yield* emit({ _tag: "ObjectCreated", name: obj.name, ts: nowIso() });
            return obj;
          }),

        updateObject: (name, patch) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(objects);
            const obj = map.get(name);
            if (!obj) {
              return yield* Effect.fail<BlenderDataError>({
                _tag: "ObjectNotFound",
                name,
              });
            }
            const next: BlenderObject = { ...obj, ...patch };
            yield* Ref.update(objects, (m) => {
              const updated = new Map(m);
              updated.set(name, next);
              return updated;
            });
            const fields = Object.keys(patch) as readonly string[];
            yield* emit({
              _tag: "ObjectUpdated",
              name,
              fields,
              ts: nowIso(),
            });
            return next;
          }),

        deleteObject: (name) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(objects);
            if (!map.has(name)) {
              return yield* Effect.fail<BlenderDataError>({
                _tag: "ObjectNotFound",
                name,
              });
            }
            yield* Ref.update(objects, (m) => {
              const next = new Map(m);
              next.delete(name);
              return next;
            });
            yield* emit({ _tag: "ObjectDeleted", name, ts: nowIso() });
          }),

        changes: Stream.fromPubSub(changesPubSub),
      });
    }),
  );
