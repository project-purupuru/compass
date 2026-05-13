/**
 * AC-15: input-lock invariants per SDD §6.5 (5-state lifecycle + 9-test surface).
 */

import { describe, expect, test } from "vitest";

import type { SemanticEvent } from "../contracts/types";
import { createEventBus } from "../runtime/event-bus";
import { checkLockExpiry, createInputLockRegistry } from "../runtime/input-lock";

describe("InputLockRegistry — SDD §6.5", () => {
  test("acquire succeeds when state is null", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    expect(reg.acquire("seq.A", "soft", 1000)).toBe(true);
    expect(reg.getState()?.ownerId).toBe("seq.A");
  });

  test("acquire fails when held by different owner", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    reg.acquire("seq.A", "soft", 1000);
    expect(reg.acquire("seq.B", "soft", 1000)).toBe(false);
    expect(reg.getState()?.ownerId).toBe("seq.A");
  });

  test("acquire by same owner is idempotent (refreshes timestamp)", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    let now = 100;
    reg.setClock(() => now);
    reg.acquire("seq.A", "soft", 1000);
    const t1 = reg.getState()?.acquiredAt;
    now = 200;
    expect(reg.acquire("seq.A", "soft", 1000)).toBe(true);
    expect(reg.getState()?.acquiredAt).toBe(200);
    expect(t1).toBe(100);
  });

  test("release succeeds for the owner", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    reg.acquire("seq.A", "soft", 1000);
    expect(reg.release("seq.A")).toBe(true);
    expect(reg.getState()).toBe(null);
  });

  test("release fails for non-owner (returns false; no state change)", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    reg.acquire("seq.A", "soft", 1000);
    expect(reg.release("seq.B")).toBe(false);
    expect(reg.getState()?.ownerId).toBe("seq.A");
  });

  test("transfer atomically swaps ownership · 2 events emitted in order", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    const events: SemanticEvent[] = [];
    bus.subscribeAll((e) => events.push(e));

    reg.acquire("seq.A", "soft", 1000);
    events.length = 0;
    expect(reg.transfer("seq.A", "seq.B")).toBe(true);
    expect(reg.getState()?.ownerId).toBe("seq.B");
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: "InputUnlocked", ownerId: "seq.A" });
    expect(events[1]).toMatchObject({ type: "InputLocked", ownerId: "seq.B", mode: "soft" });
  });

  test("transfer fails when fromOwner doesn't hold lock", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    reg.acquire("seq.A", "soft", 1000);
    expect(reg.transfer("seq.X", "seq.B")).toBe(false);
    expect(reg.getState()?.ownerId).toBe("seq.A");
  });

  test("checkLockExpiry releases lock after maxDurationMs", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    let now = 0;
    reg.setClock(() => now);
    reg.acquire("seq.A", "soft", 100);
    now = 50;
    expect(checkLockExpiry(reg, now)).toBe(false);
    expect(reg.getState()?.ownerId).toBe("seq.A");
    now = 200;
    expect(checkLockExpiry(reg, now)).toBe(true);
    expect(reg.getState()).toBe(null);
  });

  test("isLockedBy / isLockedByOther mirror state", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    expect(reg.isLockedBy("seq.A")).toBe(false);
    expect(reg.isLockedByOther("seq.A")).toBe(false);
    reg.acquire("seq.A", "soft", 1000);
    expect(reg.isLockedBy("seq.A")).toBe(true);
    expect(reg.isLockedBy("seq.B")).toBe(false);
    expect(reg.isLockedByOther("seq.A")).toBe(false);
    expect(reg.isLockedByOther("seq.B")).toBe(true);
  });

  test("InputLocked event fires on acquire · InputUnlocked on release (replay-deterministic)", () => {
    const bus = createEventBus();
    const reg = createInputLockRegistry(bus);
    const events: SemanticEvent[] = [];
    bus.subscribeAll((e) => events.push(e));

    reg.acquire("seq.A", "hard", 500);
    reg.release("seq.A");

    expect(events).toEqual([
      { type: "InputLocked", ownerId: "seq.A", mode: "hard" },
      { type: "InputUnlocked", ownerId: "seq.A" },
    ]);
  });
});
