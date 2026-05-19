import { describe, it, expect } from "vitest";
import { Effect, Exit } from "effect";

import { BlenderData, type BlenderObject } from "../data.port";
import { BlenderDataMock } from "../data.mock";
import {
  encodeCommand,
  WireResponse,
  WireResponseDecoder,
  type WireCommandT,
  type WireResponseT,
} from "../wire";
import { Schema } from "effect";

// ── Mock substrate · proves data-seam behavior without Blender ────────────

describe("BlenderData mock · data-seam behavior contract", () => {
  it("listObjects returns seeded objects", async () => {
    const seed: BlenderObject[] = [
      {
        name: "Cube",
        type: "MESH",
        location: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        meshName: "Cube",
        materialNames: [],
        visible: true,
        parentName: null,
      },
    ];
    const program = Effect.gen(function* () {
      const blender = yield* BlenderData;
      return yield* blender.listObjects;
    });
    const result = await Effect.runPromise(
      Effect.provide(program, BlenderDataMock(seed)),
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Cube");
  });

  it("createObject adds a new object and getObject finds it", async () => {
    const program = Effect.gen(function* () {
      const blender = yield* BlenderData;
      const created = yield* blender.createObject({
        name: "SoraTower",
        type: "MESH",
      });
      const fetched = yield* blender.getObject("SoraTower");
      return { created, fetched };
    });
    const { created, fetched } = await Effect.runPromise(
      Effect.provide(program, BlenderDataMock()),
    );
    expect(created.name).toBe("SoraTower");
    expect(created.location).toEqual([0, 0, 0]); // default applied
    expect(fetched).toEqual(created);
  });

  it("createObject fails ObjectAlreadyExists on duplicate name", async () => {
    const program = Effect.gen(function* () {
      const blender = yield* BlenderData;
      yield* blender.createObject({ name: "Dupe", type: "MESH" });
      return yield* blender.createObject({ name: "Dupe", type: "EMPTY" });
    });
    const result = await Effect.runPromiseExit(
      Effect.provide(program, BlenderDataMock()),
    );
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      const cause = result.cause;
      expect(JSON.stringify(cause)).toContain("ObjectAlreadyExists");
    }
  });

  it("updateObject applies a partial patch", async () => {
    const program = Effect.gen(function* () {
      const blender = yield* BlenderData;
      yield* blender.createObject({ name: "Tower", type: "MESH" });
      return yield* blender.updateObject("Tower", {
        location: [10, 0, 0],
        visible: false,
      });
    });
    const result = await Effect.runPromise(
      Effect.provide(program, BlenderDataMock()),
    );
    expect(result.location).toEqual([10, 0, 0]);
    expect(result.visible).toBe(false);
    expect(result.type).toBe("MESH"); // unchanged
  });

  it("deleteObject removes the object · getObject then fails", async () => {
    const program = Effect.gen(function* () {
      const blender = yield* BlenderData;
      yield* blender.createObject({ name: "Temp", type: "EMPTY" });
      yield* blender.deleteObject("Temp");
      return yield* blender.getObject("Temp");
    });
    const result = await Effect.runPromiseExit(
      Effect.provide(program, BlenderDataMock()),
    );
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      expect(JSON.stringify(result.cause)).toContain("ObjectNotFound");
    }
  });

  it("getObject on missing name fails ObjectNotFound", async () => {
    const program = Effect.gen(function* () {
      const blender = yield* BlenderData;
      return yield* blender.getObject("NeverCreated");
    });
    const result = await Effect.runPromiseExit(
      Effect.provide(program, BlenderDataMock()),
    );
    expect(Exit.isFailure(result)).toBe(true);
  });

  it("deleteObject is NOT silent · failures surface ObjectNotFound", async () => {
    const program = Effect.gen(function* () {
      const blender = yield* BlenderData;
      return yield* blender.deleteObject("Ghost");
    });
    const result = await Effect.runPromiseExit(
      Effect.provide(program, BlenderDataMock()),
    );
    expect(Exit.isFailure(result)).toBe(true);
  });
});

// ── Wire substrate · proves length-prefix framing round-trips ─────────────

describe("Wire protocol · length-prefix framing round-trip", () => {
  it("encodeCommand prefixes a 4-byte big-endian length header", () => {
    const cmd: WireCommandT = {
      cmdId: "test-1",
      op: "blender.data.listObjects",
      params: {},
      ts: 1700000000000,
    };
    const frame = encodeCommand(cmd);
    // First 4 bytes = body length, big-endian
    const view = new DataView(frame.buffer, frame.byteOffset, 4);
    const declaredLen = view.getUint32(0, false);
    expect(declaredLen).toBe(frame.length - 4);
    // Body parses as the original command
    const body = new TextDecoder().decode(frame.subarray(4));
    expect(JSON.parse(body)).toEqual(cmd);
  });

  it("decoder reassembles a frame delivered in arbitrary chunks", () => {
    const response: WireResponseT = {
      _tag: "Success",
      cmdId: "test-1",
      result: { objectCount: 42 },
      ts: 1700000000001,
    };
    // Build a length-prefixed frame the same way the addon would
    const body = new TextEncoder().encode(JSON.stringify(response));
    const frame = new Uint8Array(4 + body.length);
    new DataView(frame.buffer).setUint32(0, body.length, false);
    frame.set(body, 4);

    // Deliver in 3 arbitrary chunks (header split mid-uint32 + body split)
    const decoder = new WireResponseDecoder();
    decoder.feed(frame.subarray(0, 2));
    expect(decoder.drainRaw()).toHaveLength(0); // incomplete header
    decoder.feed(frame.subarray(2, 10));
    expect(decoder.drainRaw()).toHaveLength(0); // incomplete body
    decoder.feed(frame.subarray(10));
    const drained = decoder.drainRaw();
    expect(drained).toHaveLength(1);
    // Schema-validate before trusting
    const parsed = Schema.decodeUnknownSync(WireResponse)(drained[0]);
    expect(parsed._tag).toBe("Success");
    if (parsed._tag === "Success") {
      expect(parsed.cmdId).toBe("test-1");
    }
  });

  it("decoder handles two back-to-back frames in one feed", () => {
    const make = (id: string): Uint8Array => {
      const body = new TextEncoder().encode(
        JSON.stringify({
          _tag: "Success",
          cmdId: id,
          result: null,
          ts: 0,
        }),
      );
      const frame = new Uint8Array(4 + body.length);
      new DataView(frame.buffer).setUint32(0, body.length, false);
      frame.set(body, 4);
      return frame;
    };
    const frame1 = make("a");
    const frame2 = make("b");
    const combined = new Uint8Array(frame1.length + frame2.length);
    combined.set(frame1, 0);
    combined.set(frame2, frame1.length);

    const decoder = new WireResponseDecoder();
    decoder.feed(combined);
    const drained = decoder.drainRaw();
    expect(drained).toHaveLength(2);
  });
});
