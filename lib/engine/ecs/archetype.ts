/**
 * Archetype — columnar (Struct-of-Arrays) storage for entities that share a
 * component shape. Each component is a `Float32Array` slab; iteration is a
 * tight `for` loop over packed memory, so the CPU prefetcher keeps the cache
 * line full and there are no per-entity object allocations.
 *
 * Discipline:
 *   - typed arrays only — no JS object pools
 *   - swap-remove on destroy (move last entity's data into the removed slot)
 *   - capacity grows in powers of 2 (cheap reallocs)
 *
 * Single-archetype is enough for the leaf-proof slice (session-16). Multiple
 * archetypes compose via the World (no shape-migration code yet — when a
 * fixture kind churns components mid-life, the SparseSet layer enters the
 * substrate; until then, archetypes are stable).
 */

export interface ColumnSpec {
  readonly name: string;
  /** Floats per slot. Scalar = 1, vec3 = 3, mat4 = 16, etc. */
  readonly itemSize: number;
}

/** Branded entity id. Currently a dense slot index into the archetype. */
export type EntityId = number & { readonly __entityIdBrand: unique symbol };

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export class Archetype<TCols extends string = string> {
  private _capacity: number;
  private _length: number = 0;
  private readonly _specs: Map<string, ColumnSpec>;
  private readonly _cols: Map<string, Float32Array>;

  constructor(specs: readonly ColumnSpec[], initialCapacity: number = 8) {
    this._capacity = nextPow2(Math.max(1, initialCapacity));
    this._specs = new Map(specs.map((s) => [s.name, s]));
    this._cols = new Map();
    for (const spec of specs) {
      this._cols.set(spec.name, new Float32Array(this._capacity * spec.itemSize));
    }
  }

  get length(): number {
    return this._length;
  }

  get capacity(): number {
    return this._capacity;
  }

  /**
   * Returns the live backing slab for a column. Mutations are visible to all
   * holders (this is the point — systems write through this reference).
   */
  columnArray(name: TCols): Float32Array {
    const arr = this._cols.get(name);
    if (!arr) throw new Error(`Archetype: unknown column "${name}"`);
    return arr;
  }

  /**
   * Append an entity. Returns its slot id. Capacity doubles when full.
   *
   * Columns absent from `init` are zero-filled — this matters after a
   * `destroy()` because swap-remove decrements `length` but does NOT zero
   * the now-unused tail slot, so reusing that slot with a partial init
   * would otherwise inherit stale data from the destroyed entity.
   * Caught by adversarial review 2026-05-17 (sprint-1 cycle
   * engine-substrate-2026-05-17).
   *
   * Init arrays shorter than `itemSize` are zero-padded the same way.
   */
  add(
    init: Partial<Record<TCols, readonly number[] | Float32Array>> = {},
  ): EntityId {
    if (this._length >= this._capacity) {
      this._grow(this._capacity * 2);
    }
    const slot = this._length;
    for (const [name, spec] of this._specs) {
      const col = this._cols.get(name)!;
      const offset = slot * spec.itemSize;
      const initVal = (init as Record<string, readonly number[] | Float32Array | undefined>)[name];
      if (initVal !== undefined) {
        for (let i = 0; i < spec.itemSize; i++) {
          col[offset + i] = initVal[i] ?? 0;
        }
      } else {
        // Explicitly zero — slot may have been previously occupied.
        for (let i = 0; i < spec.itemSize; i++) {
          col[offset + i] = 0;
        }
      }
    }
    this._length++;
    return slot as EntityId;
  }

  /**
   * Remove an entity by swap-remove: copy the last entity's data into the
   * removed slot, then decrement length. O(component-count); contiguity is
   * preserved.
   *
   * Note: any external handle to the formerly-last entity is now stale —
   * the entity that was at slot `length - 1` now lives at `id`.
   */
  destroy(id: EntityId): void {
    if (id < 0 || id >= this._length) {
      throw new Error(`Archetype: invalid entity id ${id} (length ${this._length})`);
    }
    const lastSlot = this._length - 1;
    if (id !== lastSlot) {
      for (const [name, spec] of this._specs) {
        const col = this._cols.get(name)!;
        const fromOff = lastSlot * spec.itemSize;
        const toOff = id * spec.itemSize;
        for (let i = 0; i < spec.itemSize; i++) {
          col[toOff + i] = col[fromOff + i];
        }
      }
    }
    this._length--;
  }

  private _grow(newCapacity: number): void {
    for (const [name, spec] of this._specs) {
      const oldCol = this._cols.get(name)!;
      const newCol = new Float32Array(newCapacity * spec.itemSize);
      newCol.set(oldCol);
      this._cols.set(name, newCol);
    }
    this._capacity = newCapacity;
  }
}
