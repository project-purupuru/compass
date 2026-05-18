/**
 * Companion — per-element tally of the player's match history.
 *
 * The first move toward "your Puruhani remembers." For now: localStorage-
 * backed counts of wins/losses/draws keyed by element. The "deepest
 * element" is the one the player has played most. Surfaces on EntryScreen
 * as the player's identity strip.
 *
 * Wallet-backed identity is post-hackathon. localStorage keeps the seam
 * narrow so we can swap the persistence layer without touching consumers.
 */

import { isStorageAvailable } from "./storage";
import type { Element } from "./wuxing";
import { ELEMENT_ORDER } from "./wuxing";

const STORAGE_KEY = "puru-companion-v1";

export interface ElementTally {
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
}

export interface CompanionState {
  /** Per-element record. */
  readonly perElement: Readonly<Record<Element, ElementTally>>;
  /** First-time element pick (immutable witness of the player's "first vow"). */
  readonly firstElement: Element | null;
  /** Most-played element so far (ties broken by ELEMENT_ORDER). */
  readonly deepestElement: Element | null;
  /** Total matches played. */
  readonly totalMatches: number;
}

interface PersistedShape {
  readonly v: 1;
  readonly perElement: Record<Element, ElementTally>;
  readonly firstElement: Element | null;
}

const EMPTY_TALLY: ElementTally = { wins: 0, losses: 0, draws: 0 };

const EMPTY_STATE: CompanionState = {
  perElement: {
    wood: EMPTY_TALLY,
    fire: EMPTY_TALLY,
    earth: EMPTY_TALLY,
    metal: EMPTY_TALLY,
    water: EMPTY_TALLY,
  },
  firstElement: null,
  deepestElement: null,
  totalMatches: 0,
};

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
    /* ignore */
  }
}

function isPersisted(x: unknown): x is PersistedShape {
  if (typeof x !== "object" || x === null) return false;
  const o = x as PersistedShape;
  if (o.v !== 1) return false;
  if (typeof o.perElement !== "object" || o.perElement === null) return false;
  for (const el of ELEMENT_ORDER) {
    const t = o.perElement[el];
    if (typeof t !== "object" || t === null) return false;
    if (typeof t.wins !== "number" || typeof t.losses !== "number" || typeof t.draws !== "number") {
      return false;
    }
  }
  return true;
}

function deepestOf(perElement: Record<Element, ElementTally>): Element | null {
  let best: Element | null = null;
  let bestCount = 0;
  for (const el of ELEMENT_ORDER) {
    const t = perElement[el];
    const total = t.wins + t.losses + t.draws;
    if (total > bestCount) {
      bestCount = total;
      best = el;
    }
  }
  return best;
}

function totalOf(perElement: Record<Element, ElementTally>): number {
  let n = 0;
  for (const el of ELEMENT_ORDER) {
    const t = perElement[el];
    n += t.wins + t.losses + t.draws;
  }
  return n;
}

export function loadCompanion(): CompanionState {
  const raw = getRaw(STORAGE_KEY);
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isPersisted(parsed)) return EMPTY_STATE;
    return {
      perElement: parsed.perElement,
      firstElement: parsed.firstElement,
      deepestElement: deepestOf(parsed.perElement),
      totalMatches: totalOf(parsed.perElement),
    };
  } catch {
    return EMPTY_STATE;
  }
}

function saveCompanion(state: CompanionState): void {
  const payload: PersistedShape = {
    v: 1,
    perElement: state.perElement,
    firstElement: state.firstElement,
  };
  setRaw(STORAGE_KEY, JSON.stringify(payload));
}

/** Record a match outcome. `result` is the winner of the match overall. */
export function recordMatchOutcome(
  playerElement: Element,
  result: "win" | "loss" | "draw",
): CompanionState {
  const current = loadCompanion();
  const prev = current.perElement[playerElement];
  const updated: ElementTally =
    result === "win"
      ? { ...prev, wins: prev.wins + 1 }
      : result === "loss"
        ? { ...prev, losses: prev.losses + 1 }
        : { ...prev, draws: prev.draws + 1 };
  const perElement: Record<Element, ElementTally> = {
    ...current.perElement,
    [playerElement]: updated,
  };
  const firstElement = current.firstElement ?? playerElement;
  const next: CompanionState = {
    perElement,
    firstElement,
    deepestElement: deepestOf(perElement),
    totalMatches: totalOf(perElement),
  };
  saveCompanion(next);
  return next;
}

/** Mark an element as picked without recording an outcome (e.g. on quiz pick). */
export function rememberFirstElement(playerElement: Element): CompanionState {
  const current = loadCompanion();
  if (current.firstElement !== null) return current;
  const next: CompanionState = { ...current, firstElement: playerElement };
  saveCompanion(next);
  return next;
}

/** Test/dev reset. */
export function clearCompanion(): void {
  setRaw(STORAGE_KEY, "");
}
