/**
 * Combo discovery ledger.
 *
 * Tracks which combo kinds the player has discovered for the first time.
 * Persisted to localStorage. The first time a player composes a combo, the
 * UI surfaces a ceremony toast naming it (FR-5, Balatro pattern).
 *
 * Pure module + SSR-safe via lib/honeycomb/storage.ts.
 */

import type { ComboKind } from "./combos";
import { isStorageAvailable } from "./storage";

function getRaw(key: string): string | null {
  if (!isStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setRaw(key: string, value: string): void {
  if (!isStorageAvailable()) return;
  try {
    if (value === "") window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* quota / disabled — silent no-op */
  }
}

const STORAGE_KEY = "puru-combo-discoveries-v1";

export interface DiscoveryState {
  /** Combo kinds the player has discovered. */
  readonly seen: ReadonlySet<ComboKind>;
}

export interface ComboDiscoveryMeta {
  readonly kind: ComboKind;
  readonly title: string;
  readonly icon: string;
  readonly subtitle: string;
  readonly tooltip: string;
}

export const COMBO_META: Record<ComboKind, ComboDiscoveryMeta> = {
  "sheng-chain": {
    kind: "sheng-chain",
    title: "Shēng Chain",
    icon: "相",
    subtitle: "the generative cycle holds",
    tooltip: "A run of cards in the generating cycle. Each link multiplies power.",
  },
  "setup-strike": {
    kind: "setup-strike",
    title: "Setup Strike",
    icon: "的",
    subtitle: "the caretaker focuses the strike",
    tooltip: "A caretaker followed by their element's Jani. +30% to the Jani.",
  },
  "elemental-surge": {
    kind: "elemental-surge",
    title: "Elemental Surge",
    icon: "極",
    subtitle: "five winds, one direction",
    tooltip: "Five same-element cards. +25% to every card.",
  },
  "weather-blessing": {
    kind: "weather-blessing",
    title: "Weather Blessing",
    icon: "天",
    subtitle: "today's tide carries you",
    tooltip: "Cards matching today's weather element. +15% each.",
  },
  "garden-grace": {
    kind: "garden-grace",
    title: "Garden Grace",
    icon: "生",
    subtitle: "chain memory lingers",
    tooltip: "The Garden retains a portion of last round's chain bonus.",
  },
};

const ALL_KINDS: readonly ComboKind[] = [
  "sheng-chain",
  "setup-strike",
  "elemental-surge",
  "weather-blessing",
  "garden-grace",
];

interface PersistedShape {
  readonly v: 1;
  readonly seen: readonly ComboKind[];
}

function isPersisted(x: unknown): x is PersistedShape {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as PersistedShape).v === 1 &&
    Array.isArray((x as PersistedShape).seen)
  );
}

export function loadDiscovery(): DiscoveryState {
  const raw = getRaw(STORAGE_KEY);
  if (!raw) return { seen: new Set() };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isPersisted(parsed)) return { seen: new Set() };
    return {
      seen: new Set(parsed.seen.filter((k) => ALL_KINDS.includes(k))),
    };
  } catch {
    return { seen: new Set() };
  }
}

function saveDiscovery(state: DiscoveryState): void {
  saveImpl(state);
}

/** Idempotently record a discovery. Returns the new state. */
export function recordDiscovery(kind: ComboKind): DiscoveryState {
  const current = loadDiscovery();
  if (current.seen.has(kind)) return current;
  const next = { seen: new Set([...current.seen, kind]) };
  saveDiscovery(next);
  return next;
}

function saveImpl(state: DiscoveryState): void {
  const payload: PersistedShape = {
    v: 1,
    seen: Array.from(state.seen),
  };
  setRaw(STORAGE_KEY, JSON.stringify(payload));
}

/** True if the kind has NEVER been seen before by this device. */
export function isFirstTime(kind: ComboKind, state: DiscoveryState): boolean {
  return !state.seen.has(kind);
}

/** Reset (for tests and the dev panel). */
export function clearDiscovery(): void {
  setRaw(STORAGE_KEY, "");
}

/** Meta lookup with type guarantee. */
export function getComboMeta(kind: ComboKind): ComboDiscoveryMeta {
  return COMBO_META[kind];
}
