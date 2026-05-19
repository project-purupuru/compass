/**
 * hot-jump.schema · round-trip tests · cycle-2 S3.5
 *
 * Verifies that operator state hot-jumped from /honeycomb survives the
 * base64-canonical-JSON encode → URL → decode pipeline with byte-for-byte
 * identity. Plus rejection of malformed payloads (caller falls back to
 * defaults).
 */

import { describe, expect, test } from "vitest";

import {
  deserializeHotJumpState,
  HOT_JUMP_SCHEMA_VERSION,
  serializeHotJumpState,
  type HotJumpState,
} from "../hot-jump.schema";

describe("hot-jump schema · S3.5 round-trip", () => {
  test("minimal state round-trips (activeTab only)", () => {
    const state: HotJumpState = {
      schemaVersion: HOT_JUMP_SCHEMA_VERSION,
      activeTab: "build",
    };
    const encoded = serializeHotJumpState(state);
    const decoded = deserializeHotJumpState(encoded);
    expect(decoded).toEqual(state);
  });

  test("state with selectedAdapterId round-trips", () => {
    const state: HotJumpState = {
      schemaVersion: HOT_JUMP_SCHEMA_VERSION,
      activeTab: "library",
      selectedAdapterId: "card-composition",
    };
    const decoded = deserializeHotJumpState(serializeHotJumpState(state));
    expect(decoded).toEqual(state);
  });

  test("full state with selectedNodeId round-trips", () => {
    const state: HotJumpState = {
      schemaVersion: HOT_JUMP_SCHEMA_VERSION,
      activeTab: "build",
      selectedAdapterId: "big-realm-scene",
      selectedNodeId: "hex-wood-3",
    };
    const decoded = deserializeHotJumpState(serializeHotJumpState(state));
    expect(decoded).toEqual(state);
  });

  test("rejects malformed base64", () => {
    expect(deserializeHotJumpState("!!!notbase64!!!")).toBeNull();
  });

  test("rejects invalid JSON", () => {
    // valid base64 but invalid JSON inside
    const garbage = Buffer.from("not valid json", "utf-8").toString("base64");
    expect(deserializeHotJumpState(garbage)).toBeNull();
  });

  test("rejects wrong-shape JSON (missing required field)", () => {
    const wrongShape = Buffer.from(
      JSON.stringify({ activeTab: "build" }),
      "utf-8",
    ).toString("base64");
    expect(deserializeHotJumpState(wrongShape)).toBeNull();
  });

  test("rejects wrong activeTab value", () => {
    const wrongValue = Buffer.from(
      JSON.stringify({ schemaVersion: "1.0", activeTab: "compose" }),
      "utf-8",
    ).toString("base64");
    expect(deserializeHotJumpState(wrongValue)).toBeNull();
  });

  test("canonical-JSON: key-order edits to JSON do NOT change round-trip", () => {
    const stateA: HotJumpState = {
      schemaVersion: HOT_JUMP_SCHEMA_VERSION,
      activeTab: "build",
      selectedAdapterId: "card-composition",
    };
    const encodedA = serializeHotJumpState(stateA);

    // Manually construct a JSON with different key order
    const reordered = JSON.stringify({
      selectedAdapterId: "card-composition",
      activeTab: "build",
      schemaVersion: HOT_JUMP_SCHEMA_VERSION,
    });
    const encodedReordered = Buffer.from(reordered, "utf-8").toString("base64");

    // Both encodings should deserialize to the same state
    expect(deserializeHotJumpState(encodedReordered)).toEqual(
      deserializeHotJumpState(encodedA),
    );
  });
});
