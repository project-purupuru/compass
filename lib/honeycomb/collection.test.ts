/**
 * @vitest-environment jsdom
 *
 * Collection tests — burn-rite cycle S1 (sprint-148).
 *
 * Two halves:
 *   1. collection.mock — round-trip determinism (the S1 acceptance criterion).
 *   2. collection.live — storage failure modes, mirroring
 *      __tests__/storage.test.ts (empty / corrupt / shape / version / quota).
 *      The live impl reuses `storage.ts` discipline; these tests confirm the
 *      discipline holds for the `compass.collection.v1` key.
 */

import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CARD_DEFINITIONS, createCard, type Card } from "./cards";
import { __resetCollectionStorage, __test, CollectionLive } from "./collection.live";
import { CollectionMock } from "./collection.mock";
import { Collection } from "./collection.port";

const sampleCards = (n: number): Card[] =>
  CARD_DEFINITIONS.slice(0, n).map((d) => createCard(d));

describe("collection.mock — round-trip determinism", () => {
  it("replaceAll then getAll returns the same cards (the AC)", async () => {
    const cards = sampleCards(5);
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(Collection, (c) =>
          Effect.flatMap(c.replaceAll(cards), () => c.getAll()),
        ),
        CollectionMock(),
      ),
    );
    expect(result).toEqual(cards);
  });

  it("accepts initial fixtures", async () => {
    const cards = sampleCards(3);
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(Collection, (c) => c.getAll()),
        CollectionMock(cards),
      ),
    );
    expect(result).toEqual(cards);
  });

  it("grant appends one card", async () => {
    const initial = sampleCards(2);
    const extra = createCard(CARD_DEFINITIONS[5]);
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(Collection, (c) =>
          Effect.flatMap(c.grant(extra), () => c.getAll()),
        ),
        CollectionMock(initial),
      ),
    );
    expect(result).toEqual([...initial, extra]);
  });
});

describe("collection.live — storage failure modes", () => {
  beforeEach(() => __resetCollectionStorage());
  afterEach(() => vi.restoreAllMocks());

  it("returns [] when storage is empty", () => {
    expect(__test.readCollection()).toEqual([]);
  });

  it("round-trips a valid write", () => {
    const cards = sampleCards(4);
    __test.writeCollection(cards);
    expect(__test.readCollection()).toEqual(cards);
  });

  it("returns [] on corrupt JSON", () => {
    window.localStorage.setItem(__test.STORAGE_KEY, "{not valid json");
    expect(__test.readCollection()).toEqual([]);
  });

  it("returns [] on wrong shape (cards not an array)", () => {
    window.localStorage.setItem(
      __test.STORAGE_KEY,
      JSON.stringify({ foo: "bar", cards: "not an array" }),
    );
    expect(__test.readCollection()).toEqual([]);
  });

  it("returns [] when the cards array holds a non-Card", () => {
    window.localStorage.setItem(
      __test.STORAGE_KEY,
      JSON.stringify({ version: 1, cards: [{ id: "x" }] }),
    );
    expect(__test.readCollection()).toEqual([]);
  });

  it("returns [] on wrong version", () => {
    window.localStorage.setItem(
      __test.STORAGE_KEY,
      JSON.stringify({ version: 2, cards: sampleCards(2) }),
    );
    expect(__test.readCollection()).toEqual([]);
  });

  it("writeCollection returns false when storage throws (quota)", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(__test.writeCollection(sampleCards(1))).toBe(false);
    spy.mockRestore();
  });

  it("CollectionLive round-trips through localStorage", async () => {
    const cards = sampleCards(3);
    await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(Collection, (c) => c.replaceAll(cards)),
        CollectionLive,
      ),
    );
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(Collection, (c) => c.getAll()),
        CollectionLive,
      ),
    );
    expect(result).toEqual(cards);
  });

  it("CollectionLive grant appends through localStorage", async () => {
    __test.writeCollection(sampleCards(1));
    const extra = createCard(CARD_DEFINITIONS[7]);
    await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(Collection, (c) => c.grant(extra)),
        CollectionLive,
      ),
    );
    expect(__test.readCollection()).toHaveLength(2);
  });
});
