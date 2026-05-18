/**
 * Seed-driven RNG — "The Seed is King" (per Gemini's ML-engineer framing).
 *
 * Every battle is reproducible from (seed, weather, opponentElement). Three.js
 * scenes, AI rearrangements, whisper picks — all read from this same stream so
 * a battle replay is byte-for-byte identical.
 *
 * mulberry32 — small, fast, sufficient PRNG with a well-understood period.
 */

export interface Rng {
  readonly next: () => number;
  readonly nextInt: (max: number) => number;
  readonly pick: <T>(xs: readonly T[]) => T;
  readonly shuffle: <T>(xs: readonly T[]) => T[];
  readonly snapshot: () => number;
}

export function rngFromSeed(seed: string | number): Rng {
  let state = typeof seed === "number" ? seed >>> 0 : hashStringToInt(seed);
  if (state === 0) state = 0xdeadbeef;

  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (max: number): number => Math.floor(next() * max);

  const pick = <T>(xs: readonly T[]): T => xs[nextInt(xs.length)];

  const shuffle = <T>(xs: readonly T[]): T[] => {
    const arr = [...xs];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const snapshot = () => state >>> 0;

  return { next, nextInt, pick, shuffle, snapshot };
}

export function hashStringToInt(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
