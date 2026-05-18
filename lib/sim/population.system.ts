/**
 * Population store — single source of truth for "who is on the map right now".
 *
 * v0 demo simulation (2026-05-10): the observatory shows a living world
 * with a small seeded population that grows as the viewer watches. Each
 * spawn is a synthetic "user claimed [element] Stone" event that flows
 * to the canvas (new sprite with pop-in), the activity rail (new row),
 * and the KPI strip (live count).
 *
 * Architecture:
 *   - Module-singleton, browser-only. SSR-safe (start() no-ops without window).
 *   - Initial seed (~14 sprites) populates synchronously on first subscribe,
 *     with backdated joinedAt timestamps so the activity rail shows "5m ago"
 *     style history when the user lands rather than 14 "just now" rows.
 *   - YOU is NOT auto-spawned. The connected-wallet flow in
 *     ObservatoryClient calls `spawnYou()` when (a) a wallet is
 *     connected AND (b) a real radar mint event matches it — so the
 *     YOU sprite always lands in the same element wedge as the user's
 *     actual claimed stone. Guests never trigger a spawn.
 *   - Trickle: every 6-18s a new sprite joins, up to MAX_POPULATION. Pace
 *     is slow enough that the activity rail's history isn't flushed before
 *     the viewer can read it.
 *   - Distribution is skewed via a wuxing-rotating favored-element picker
 *     (one element clearly leads, others taper through rank). The leader
 *     rotates every ~120s so a long demo shows the lead changing hands.
 */

import { ELEMENTS, type Element } from "@/lib/score";
import { identityFor } from "./identity";
import type { PuruhaniIdentity } from "./types";

export interface SpawnedPuruhani {
  seed: number;
  trader: string;
  identity: PuruhaniIdentity;
  primaryElement: Element;
  joinedAt: string;
  isYou: boolean;
}

export interface PopulationStore {
  current(): SpawnedPuruhani[];
  subscribe(cb: (spawn: SpawnedPuruhani) => void): () => void;
  distribution(): Record<Element, number>;
  youTrader(): string | null;
  /**
   * Spawn the YOU sprite for the connected wallet. Idempotent — once a
   * YOU sprite exists this is a no-op (returns null). Bypasses the
   * MAX_POPULATION cap so the user's avatar always lands.
   */
  spawnYou(opts: {
    trader: string;
    element: Element;
    identity: PuruhaniIdentity;
    joinedAt?: string;
  }): SpawnedPuruhani | null;
}

const MAX_POPULATION = 80;
const INITIAL_SEED_COUNT = 20;
const TRICKLE_MIN_MS = 3_000;
const TRICKLE_MAX_MS = 9_000;
// Rank-ordered population share — leader clearly dominates, then taper.
const RANK_SHARES = [0.36, 0.24, 0.18, 0.13, 0.09];
// Favored-element rotation period; full wuxing cycle takes ~10 min.
const FAVORED_CYCLE_SECONDS = 120;

const buffer: SpawnedPuruhani[] = [];
const subscribers = new Set<(s: SpawnedPuruhani) => void>();
let nextSeed = 1;
let youTrader: string | null = null;
let trickleHandle: ReturnType<typeof setTimeout> | null = null;
let started = false;

function pickElement(): Element {
  // Same picker shape as lib/score/mock.ts so the leader rotation is
  // coherent if anything else still consumes that adapter.
  const t = Date.now() / 1000;
  const favoredIdx = Math.floor((t / FAVORED_CYCLE_SECONDS) % ELEMENTS.length);
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < ELEMENTS.length; i++) {
    const rank = (i - favoredIdx + ELEMENTS.length) % ELEMENTS.length;
    acc += RANK_SHARES[rank];
    if (r < acc) return ELEMENTS[i];
  }
  return ELEMENTS[ELEMENTS.length - 1];
}

function makeEntry(
  opts: {
    element?: Element;
    isYou?: boolean;
    joinedAt?: string;
  } = {},
): SpawnedPuruhani {
  const seed = nextSeed++;
  const element = opts.element ?? pickElement();
  const identity = identityFor(seed, element);
  return {
    seed,
    trader: identity.trader,
    identity,
    primaryElement: element,
    joinedAt: opts.joinedAt ?? new Date().toISOString(),
    isYou: opts.isYou ?? false,
  };
}

function emit(entry: SpawnedPuruhani): void {
  buffer.push(entry);
  for (const cb of subscribers) {
    try {
      cb(entry);
    } catch {
      // isolate subscriber errors
    }
  }
}

function spawnNow(opts: { isYou?: boolean } = {}): SpawnedPuruhani | null {
  if (buffer.length >= MAX_POPULATION) return null;
  const entry = makeEntry({ isYou: opts.isYou });
  if (entry.isYou) youTrader = entry.trader;
  emit(entry);
  return entry;
}

function scheduleTrickle(): void {
  if (typeof window === "undefined") return;
  const delay = TRICKLE_MIN_MS + Math.random() * (TRICKLE_MAX_MS - TRICKLE_MIN_MS);
  trickleHandle = setTimeout(() => {
    spawnNow();
    scheduleTrickle();
  }, delay);
}

function start(): void {
  if (started) return;
  if (typeof window === "undefined") return;
  started = true;

  // Initial seed — populate buffer directly (no subscribe emit) so these
  // sprites read as "already here when the user arrived" rather than
  // 14 simultaneous spawn pops. joinedAt is backdated so the activity
  // rail's "Xm ago" timestamps make sense from frame 0.
  const now = Date.now();
  // Stagger backdated arrivals from ~24min ago down to ~30s ago so the
  // rail shows a credible recent history without claiming everyone
  // joined in the last minute.
  for (let i = 0; i < INITIAL_SEED_COUNT; i++) {
    const minutesAgo = 1 + (INITIAL_SEED_COUNT - i) * 1.7;
    const entry = makeEntry({
      joinedAt: new Date(now - minutesAgo * 60_000).toISOString(),
    });
    buffer.push(entry);
  }

  // YOU is not auto-spawned — see spawnYou() and the wallet-connect
  // effect in ObservatoryClient. Pre-connect / guest sessions never
  // see a YOU sprite.

  scheduleTrickle();
}

export const populationStore: PopulationStore = {
  current() {
    return [...buffer];
  },
  subscribe(cb) {
    // Start before adding subscriber so the initial seed is already
    // populated when the caller reads current(). Future spawns fire
    // through the subscriber.
    start();
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
      // Never stop on last unsub — the world keeps running across
      // StrictMode double-mount and component remounts.
    };
  },
  distribution() {
    const out: Record<Element, number> = {
      wood: 0,
      fire: 0,
      earth: 0,
      water: 0,
      metal: 0,
    };
    for (const p of buffer) out[p.primaryElement]++;
    return out;
  },
  youTrader() {
    return youTrader;
  },
  spawnYou(opts) {
    if (typeof window === "undefined") return null;
    if (youTrader !== null) return null;
    // Bypass MAX_POPULATION — YOU always lands. The real claim is
    // canonical; the cap is a soft visual budget for ambient sprites.
    const seed = nextSeed++;
    const entry: SpawnedPuruhani = {
      seed,
      trader: opts.trader,
      identity: opts.identity,
      primaryElement: opts.element,
      joinedAt: opts.joinedAt ?? new Date().toISOString(),
      isYou: true,
    };
    youTrader = opts.trader;
    emit(entry);
    return entry;
  },
};

// Test-only — allow resetting between unit tests. Not wired up by the app.
export function __resetPopulation(): void {
  buffer.length = 0;
  subscribers.clear();
  nextSeed = 1;
  youTrader = null;
  if (trickleHandle !== null) clearTimeout(trickleHandle);
  trickleHandle = null;
  started = false;
}
