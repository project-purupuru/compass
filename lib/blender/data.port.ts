/**
 * BlenderData Service · the data-seam port.
 *
 * Mirrors bpy.data — Blender's truth store. Read + write data-blocks
 * (objects · meshes · materials · …). NO UI control · NO operator dispatch
 * (that's blender-operator.port.ts in a future chunk).
 *
 * Substrate doctrine: lib/world/awareness.port.ts is the canonical pattern
 * being mirrored — port owns the Context.Tag + state shape · live composes
 * with real Blender · mock provides in-memory substrate for tests.
 *
 * Reference: grimoires/loa/context/blender-adapter-design-brief-2026-05-18.md §Surface
 * Force-chain mapping: step 1 data (observation tier)
 */

import { Context, Effect, Stream } from "effect";

// ── Data-block shapes (mirrors bpy.data.objects entries) ──────────────────

/**
 * Blender object types we currently model. Extend cautiously — each new
 * variant means the mock + live + agent prompts all need to handle it.
 */
export type BlenderObjectType =
  | "MESH"
  | "EMPTY"
  | "LIGHT"
  | "CAMERA"
  | "ARMATURE"
  | "CURVE"
  | "SURFACE"
  | "META"
  | "FONT"
  | "VOLUME"
  | "GPENCIL"
  | "LATTICE";

/**
 * BlenderObject · the agent-facing projection of one bpy.data.objects entry.
 *
 * Intentionally LOSSY — we surface only the fields agents reason about.
 * Raw bpy.types.Object has hundreds of properties; surfacing them all
 * destroys the agent's context budget and invites prompt-engineering by
 * field-spelunking. Stay curated.
 */
export interface BlenderObject {
  /** bpy.data.objects key · unique within scene */
  readonly name: string;
  readonly type: BlenderObjectType;
  /** World-space location [x, y, z] · meters */
  readonly location: readonly [number, number, number];
  /** Euler rotation [x, y, z] · radians */
  readonly rotation: readonly [number, number, number];
  /** Per-axis scale [x, y, z] · 1.0 = identity */
  readonly scale: readonly [number, number, number];
  /** bpy.data.meshes key · null for non-MESH objects */
  readonly meshName: string | null;
  /** bpy.data.materials keys · indexed into object.material_slots */
  readonly materialNames: readonly string[];
  /** object.hide_viewport === false */
  readonly visible: boolean;
  /** object.parent.name · null for unparented */
  readonly parentName: string | null;
}

/**
 * Patch for updateObject — partial fields. Required fields (name, type) are
 * immutable post-create (renaming is a separate op; type-change is destroy +
 * recreate).
 */
export type BlenderObjectPatch = Partial<
  Pick<
    BlenderObject,
    | "location"
    | "rotation"
    | "scale"
    | "meshName"
    | "materialNames"
    | "visible"
    | "parentName"
  >
>;

/**
 * BlenderObjectSpec for create — same as BlenderObject but name and type are
 * required + optional fields can be omitted (defaults applied by live/mock).
 */
export interface BlenderObjectSpec {
  readonly name: string;
  readonly type: BlenderObjectType;
  readonly location?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: readonly [number, number, number];
  readonly meshName?: string | null;
  readonly materialNames?: readonly string[];
  readonly visible?: boolean;
  readonly parentName?: string | null;
}

/**
 * Change-stream events for observing data-seam mutations. The live layer
 * subscribes to Blender's depsgraph_update_post handler and emits these;
 * the mock emits them inline on each write.
 */
export type BlenderDataChange =
  | { readonly _tag: "ObjectCreated"; readonly name: string; readonly ts: string }
  | { readonly _tag: "ObjectUpdated"; readonly name: string; readonly fields: readonly string[]; readonly ts: string }
  | { readonly _tag: "ObjectDeleted"; readonly name: string; readonly ts: string };

// ── Service interface ─────────────────────────────────────────────────────

/**
 * Errors the data-seam can surface to callers. Caller chooses how to
 * react — operator-style error handling per-call, NOT defensive
 * try/catch-everywhere.
 */
export type BlenderDataError =
  | { readonly _tag: "ObjectNotFound"; readonly name: string }
  | { readonly _tag: "ObjectAlreadyExists"; readonly name: string }
  | { readonly _tag: "InvalidPatch"; readonly reason: string };

export class BlenderData extends Context.Tag("compass/BlenderData")<
  BlenderData,
  {
    /** List all objects · pure read · safe to call frequently */
    readonly listObjects: Effect.Effect<readonly BlenderObject[]>;
    /** Get one object by name · returns ObjectNotFound if absent */
    readonly getObject: (name: string) => Effect.Effect<BlenderObject, BlenderDataError>;
    /** Create a new object · returns ObjectAlreadyExists if name taken */
    readonly createObject: (
      spec: BlenderObjectSpec,
    ) => Effect.Effect<BlenderObject, BlenderDataError>;
    /** Patch an existing object · returns ObjectNotFound if absent */
    readonly updateObject: (
      name: string,
      patch: BlenderObjectPatch,
    ) => Effect.Effect<BlenderObject, BlenderDataError>;
    /** Delete an object · idempotent · returns ObjectNotFound if absent */
    readonly deleteObject: (name: string) => Effect.Effect<void, BlenderDataError>;
    /** Stream of data-seam changes · live emits on depsgraph events */
    readonly changes: Stream.Stream<BlenderDataChange>;
  }
>() {}
