/**
 * Collection.live — localStorage-backed Layer.
 *
 * Follows the `storage.ts` failure-mode discipline exactly: SSR-safe via
 * `isStorageAvailable()`, type-guard + version check on read with a safe
 * empty fallback (never throws), quota-aware writes (silent no-op on
 * failure). Per SDD §5.2, §7.3.
 *
 * Persisted shape: `CollectionStorage { version: 1; cards: readonly Card[] }`
 * under key `compass.collection.v1`. localStorage IS the state — every
 * method reads/writes it directly, so there is no in-memory cache to
 * drift (the disposable-impl principle: this Layer holds no state).
 *
 * Trust boundary (SDD §10): localStorage content is untrusted on read.
 * Corrupt or forged JSON type-guards + version-checks to an empty
 * fallback — a malformed store can never crash a consumer.
 */

import { Effect, Layer } from "effect";
import type { Card } from "./cards";
import { Collection } from "./collection.port";
import { isStorageAvailable } from "./storage";

const STORAGE_KEY = "compass.collection.v1";

interface CollectionStorage {
  readonly version: 1;
  readonly cards: readonly Card[];
}

/** Type guard for a single stored Card. Untrusted-input safe. */
function isCard(x: unknown): x is Card {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.defId === "string" &&
    typeof o.element === "string" &&
    typeof o.cardType === "string" &&
    typeof o.stage === "string" &&
    typeof o.evolutionEnergy === "number" &&
    typeof o.acquiredAt === "string" &&
    (o.resonance === undefined || typeof o.resonance === "number")
  );
}

/** Type guard for the stored shape. Untrusted-input safe. */
function isCollectionStorage(x: unknown): x is CollectionStorage {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.version === "number" &&
    Array.isArray(o.cards) &&
    o.cards.every(isCard)
  );
}

/** Read the collection. Returns [] on any failure (SSR, corrupt, version). */
function readCollection(): readonly Card[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!isCollectionStorage(parsed)) return [];
    if (parsed.version !== 1) return []; // future: migrate
    return parsed.cards;
  } catch {
    return []; // corrupt JSON
  }
}

/** Write the collection. Silent no-op on any failure (quota, disabled). */
function writeCollection(cards: readonly Card[]): boolean {
  if (!isStorageAvailable()) return false;
  try {
    const payload: CollectionStorage = { version: 1, cards };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false; // quota exceeded
  }
}

export const CollectionLive: Layer.Layer<Collection> = Layer.succeed(
  Collection,
  Collection.of({
    getAll: () => Effect.sync(() => readCollection()),
    grant: (card) =>
      Effect.sync(() => {
        writeCollection([...readCollection(), card]);
      }),
    replaceAll: (cards) =>
      Effect.sync(() => {
        writeCollection(cards);
      }),
  }),
);

/** Test-only: clear the collection key. Production code MUST NOT call this. */
export function __resetCollectionStorage(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Test-only: direct access to the storage functions for failure-mode tests. */
export const __test = { readCollection, writeCollection, STORAGE_KEY };
