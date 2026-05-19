/**
 * dock-shell.schema · cycle-2 S4 · corruption recovery + round-trip tests
 *
 * Verifies that localStorage state survives encode → store → decode with
 * byte identity AND that malformed payloads fall back to defaults silently
 * (NFR-13 + S4.6 AC: corruption-recovery + reset-to-default flows).
 */

import { describe, expect, test } from "vitest";

import {
  DEFAULT_DOCK_SHELL_STATE,
  DOCK_SHELL_SCHEMA_VERSION,
  decodeDockShellState,
  encodeDockShellState,
  STORAGE_KEY,
  type DockShellState,
} from "../dock-shell.schema";

describe("dock-shell.schema · S4 corruption + round-trip", () => {
  test("default state encodes + decodes identically", () => {
    const encoded = encodeDockShellState(DEFAULT_DOCK_SHELL_STATE);
    const decoded = decodeDockShellState(encoded);
    expect(decoded).toEqual(DEFAULT_DOCK_SHELL_STATE);
  });

  test("custom state round-trips byte-for-byte", () => {
    const state: DockShellState = {
      schemaVersion: DOCK_SHELL_SCHEMA_VERSION,
      leftPanelSize: 30,
      rightPanelSize: 28,
      bottomPanelSize: 35,
      bottomCollapsed: false,
    };
    const decoded = decodeDockShellState(encodeDockShellState(state));
    expect(decoded).toEqual(state);
  });

  test("null input returns null (caller falls back to defaults)", () => {
    expect(decodeDockShellState(null)).toBeNull();
  });

  test("malformed JSON returns null (corruption recovery)", () => {
    expect(decodeDockShellState("not valid json {")).toBeNull();
  });

  test("wrong-shape JSON returns null (missing required fields)", () => {
    const wrongShape = JSON.stringify({ leftPanelSize: 22 });
    expect(decodeDockShellState(wrongShape)).toBeNull();
  });

  test("wrong schemaVersion returns null (forward-compat guard)", () => {
    const wrongVersion = JSON.stringify({
      ...DEFAULT_DOCK_SHELL_STATE,
      schemaVersion: "2.0",
    });
    expect(decodeDockShellState(wrongVersion)).toBeNull();
  });

  test("non-number panel sizes return null (type guard)", () => {
    const wrongType = JSON.stringify({
      ...DEFAULT_DOCK_SHELL_STATE,
      leftPanelSize: "thirty",
    });
    expect(decodeDockShellState(wrongType)).toBeNull();
  });

  test("STORAGE_KEY is version-pinned for future migrations", () => {
    // If schemaVersion bumps, STORAGE_KEY should change too — prevents
    // silent old-state hydration with new code.
    expect(STORAGE_KEY).toMatch(/\.v\d+$/);
    expect(STORAGE_KEY).toContain("compass.honeycomb");
  });
});
