import { describe, expect, it } from "vitest";

import { Archetype, type EntityId } from "./archetype";

describe("Archetype", () => {
  it("rounds initial capacity up to a power of 2", () => {
    const arch = new Archetype([{ name: "x", itemSize: 1 }], 5);
    expect(arch.capacity).toBe(8);
    expect(arch.length).toBe(0);
  });

  it("adds entities and writes into the column slab", () => {
    const arch = new Archetype([{ name: "x", itemSize: 1 }], 8);
    for (let i = 0; i < 5; i++) arch.add({ x: [i * 10] });
    expect(arch.length).toBe(5);
    const x = arch.columnArray("x");
    for (let i = 0; i < 5; i++) {
      expect(x[i]).toBe(i * 10);
    }
  });

  it("swap-removes a middle slot, moving the last entity into it", () => {
    const arch = new Archetype([{ name: "x", itemSize: 1 }], 8);
    arch.add({ x: [10] });
    arch.add({ x: [20] });
    arch.add({ x: [30] });
    arch.add({ x: [40] });
    arch.add({ x: [50] });

    arch.destroy(2 as EntityId);

    expect(arch.length).toBe(4);
    const x = arch.columnArray("x");
    expect(x[0]).toBe(10);
    expect(x[1]).toBe(20);
    expect(x[2]).toBe(50);
    expect(x[3]).toBe(40);
  });

  it("destroys the last slot with no swap", () => {
    const arch = new Archetype([{ name: "x", itemSize: 1 }], 8);
    arch.add({ x: [10] });
    arch.add({ x: [20] });
    arch.destroy(1 as EntityId);
    expect(arch.length).toBe(1);
    expect(arch.columnArray("x")[0]).toBe(10);
  });

  it("grows capacity in powers of 2 when filled", () => {
    const arch = new Archetype([{ name: "x", itemSize: 1 }], 4);
    expect(arch.capacity).toBe(4);
    for (let i = 0; i < 4; i++) arch.add({ x: [i] });
    expect(arch.capacity).toBe(4);

    arch.add({ x: [4] });
    expect(arch.capacity).toBe(8);
    expect(arch.length).toBe(5);
    expect(arch.columnArray("x")[4]).toBe(4);

    for (let i = 5; i < 8; i++) arch.add({ x: [i] });
    expect(arch.capacity).toBe(8);
    arch.add({ x: [8] });
    expect(arch.capacity).toBe(16);
  });

  it("preserves all data across capacity grows", () => {
    const arch = new Archetype([{ name: "x", itemSize: 1 }], 4);
    for (let i = 0; i < 8; i++) arch.add({ x: [i * 100] });
    expect(arch.capacity).toBeGreaterThanOrEqual(8);
    const x = arch.columnArray("x");
    for (let i = 0; i < 8; i++) {
      expect(x[i]).toBe(i * 100);
    }
  });

  it("returns the live backing slab from columnArray", () => {
    const arch = new Archetype([{ name: "x", itemSize: 1 }], 8);
    arch.add({ x: [42] });
    const x = arch.columnArray("x");
    x[0] = 99;
    expect(arch.columnArray("x")[0]).toBe(99);
  });

  it("supports multi-float columns (itemSize > 1)", () => {
    const arch = new Archetype([{ name: "pos", itemSize: 3 }], 8);
    arch.add({ pos: [1, 2, 3] });
    arch.add({ pos: [4, 5, 6] });
    const pos = arch.columnArray("pos");
    expect(pos[0]).toBe(1);
    expect(pos[1]).toBe(2);
    expect(pos[2]).toBe(3);
    expect(pos[3]).toBe(4);
    expect(pos[4]).toBe(5);
    expect(pos[5]).toBe(6);
  });

  it("swap-removes multi-float columns at the correct offset", () => {
    const arch = new Archetype([{ name: "pos", itemSize: 3 }], 8);
    arch.add({ pos: [1, 2, 3] });
    arch.add({ pos: [4, 5, 6] });
    arch.add({ pos: [7, 8, 9] });

    arch.destroy(0 as EntityId);

    const pos = arch.columnArray("pos");
    expect(pos[0]).toBe(7);
    expect(pos[1]).toBe(8);
    expect(pos[2]).toBe(9);
    expect(pos[3]).toBe(4);
    expect(pos[4]).toBe(5);
    expect(pos[5]).toBe(6);
  });

  it("zero-fills columns that are omitted from init", () => {
    const arch = new Archetype(
      [
        { name: "x", itemSize: 1 },
        { name: "y", itemSize: 1 },
      ],
      8,
    );
    arch.add({ x: [42] });
    expect(arch.columnArray("x")[0]).toBe(42);
    expect(arch.columnArray("y")[0]).toBe(0);
  });

  it("clears omitted columns when reusing a slot after destroy (regression: stale data leak)", () => {
    // Adversarial review 2026-05-17 caught this: swap-remove decrements
    // length but doesn't zero the now-unused tail slot. A subsequent
    // add() with a PARTIAL init would silently inherit stale column data.
    const arch = new Archetype(
      [
        { name: "x", itemSize: 1 },
        { name: "y", itemSize: 1 },
      ],
      8,
    );
    arch.add({ x: [10], y: [99] });
    arch.destroy(0 as EntityId);
    arch.add({ x: [20] }); // partial init — y must NOT carry 99 over

    expect(arch.columnArray("x")[0]).toBe(20);
    expect(arch.columnArray("y")[0]).toBe(0);
  });

  it("clears multi-float omitted columns when reusing a slot", () => {
    const arch = new Archetype(
      [
        { name: "pos", itemSize: 3 },
        { name: "scale", itemSize: 1 },
      ],
      8,
    );
    arch.add({ pos: [1, 2, 3], scale: [7] });
    arch.destroy(0 as EntityId);
    arch.add({ pos: [10, 20, 30] }); // scale omitted

    const pos = arch.columnArray("pos");
    expect(pos[0]).toBe(10);
    expect(pos[1]).toBe(20);
    expect(pos[2]).toBe(30);
    expect(arch.columnArray("scale")[0]).toBe(0);
  });

  it("zero-pads partial init arrays shorter than itemSize", () => {
    const arch = new Archetype([{ name: "pos", itemSize: 3 }], 8);
    arch.add({ pos: [1, 2] }); // 2 elements for a 3-element column
    const pos = arch.columnArray("pos");
    expect(pos[0]).toBe(1);
    expect(pos[1]).toBe(2);
    expect(pos[2]).toBe(0);
  });

  it("throws on destroy with out-of-range id", () => {
    const arch = new Archetype([{ name: "x", itemSize: 1 }], 8);
    arch.add({ x: [10] });
    expect(() => arch.destroy(5 as EntityId)).toThrow();
    expect(() => arch.destroy(-1 as EntityId)).toThrow();
  });

  it("throws on columnArray for unknown name", () => {
    const arch = new Archetype([{ name: "x", itemSize: 1 }], 8);
    expect(() => arch.columnArray("nope" as never)).toThrow();
  });
});
