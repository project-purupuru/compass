/**
 * SSR-safe + failure-mode-aware localStorage wrapper.
 *
 * Closes flatline-r1 T1 (IMP-002): handles SSR, disabled storage, quota
 * exceeded, corrupt JSON, wrong shape. All failures fall through to a
 * deterministic fallback; consumers never crash from storage issues.
 *
 * Per SDD §3.4.1.
 */

import type { Element } from "./wuxing";

export interface CompassMatchStorage {
  readonly version: 1;
  readonly playerElement: Element | null;
  readonly hasSeenTutorial: boolean;
  readonly dismissedHints: readonly string[];
}

const STORAGE_KEY = "compass.match.v1";

const FALLBACK: CompassMatchStorage = {
  version: 1,
  playerElement: null,
  hasSeenTutorial: false,
  dismissedHints: [],
};

/** Detect if localStorage is usable (SSR · private-mode · disabled · quota-zero). */
export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false; // SSR
  try {
    const probe = "__storage_test__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false; // private mode / disabled / quota
  }
}

/** Read match storage. Returns FALLBACK on any failure. */
export function readMatchStorage(): CompassMatchStorage {
  if (!isStorageAvailable()) return FALLBACK;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return FALLBACK;
    const parsed = JSON.parse(raw) as unknown;
    if (!isCompassMatchStorage(parsed)) return FALLBACK;
    if (parsed.version !== 1) return FALLBACK; // future: migrate
    return parsed;
  } catch {
    return FALLBACK; // corrupt JSON
  }
}

/** Write match storage. Silent no-op on any failure. */
export function writeMatchStorage(state: CompassMatchStorage): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false; // quota exceeded
  }
}

/** Update a single field of match storage. */
export function updateMatchStorage<K extends keyof CompassMatchStorage>(
  key: K,
  value: CompassMatchStorage[K],
): boolean {
  const current = readMatchStorage();
  return writeMatchStorage({ ...current, [key]: value });
}

/** Type guard for stored shape. */
function isCompassMatchStorage(x: unknown): x is CompassMatchStorage {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.version === "number" &&
    (o.playerElement === null || typeof o.playerElement === "string") &&
    typeof o.hasSeenTutorial === "boolean" &&
    Array.isArray(o.dismissedHints)
  );
}

/** Test-only: clear all storage. Production code MUST NOT call this. */
export function __resetMatchStorage(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
