/**
 * Clash VFX vocabulary — per-element collision particle systems.
 *
 * Each element fires a signature visual at the clash midpoint when the
 * active clash hits its `impact` phase. The substrate names the
 * element; this module describes how that element makes a sound.
 *
 * Doctrine — composable VFX vocabulary:
 *
 *   Each VFX kit is a *typed config*, not a one-off component. The
 *   ClashVfx React component reads the config and produces DOM; the
 *   CSS keyframes are named per-element and live in ClashVfx.css.
 *
 *   Adding a new element (or a new mode like Transcendence) means
 *   adding a new entry to ELEMENT_VFX — not writing new JSX.
 *
 *   The "shader" idea is honored at the seam: per-particle CSS
 *   variables (--ember-angle, --root-delay, --shard-distance) are
 *   the equivalent of vertex/fragment uniforms. The keyframes are
 *   the shaders.
 *
 * Mirrors the canonical world-purupuru implementation from cycle-088
 * routes/(immersive)/battle/+page.svelte lines 539-571 + 1383-1542.
 */

import type { Element } from "@/lib/honeycomb/wuxing";

export type ClashVfxParticle =
  | "ember" // fire
  | "ring" // earth
  | "root" // wood
  | "slash" // metal-primary
  | "shard" // metal-secondary
  | "wave"; // water

/** One spawned particle. `style` keys become CSS variables on the span. */
export interface ParticleInstance {
  readonly kind: ClashVfxParticle;
  /** Auxiliary class names (e.g. "vfx-ring--1" / "vfx-wave--inner") */
  readonly variant?: string;
  /** Inline CSS variables driving the keyframe. */
  readonly style: Record<string, string>;
}

export interface ElementVfxKit {
  readonly element: Element;
  /** Human-readable signature, used for tooltips + audit doctrine. */
  readonly signature: string;
  /** Build the particle instances for one impact. Seeded by clash idx so
   * the same clash always produces the same VFX (replay-determinism). */
  readonly build: (seed: number) => readonly ParticleInstance[];
  /** Total animation duration so the parent can clean up the DOM after. */
  readonly durationMs: number;
}

// ─────────────────────────────────────────────────────────────────
// Seeded mulberry32 — keeps the visual replayable for a given clash idx
// ─────────────────────────────────────────────────────────────────
function rng(seed: number): () => number {
  let s = (seed + 0x6d2b79f5) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────
// Per-element kits
// ─────────────────────────────────────────────────────────────────

const fireKit: ElementVfxKit = {
  element: "fire",
  signature: "radial ember burst — 8 sparks fly outward and up",
  durationMs: 600,
  build(seed) {
    const r = rng(seed);
    return Array.from({ length: 8 }, (_, i) => ({
      kind: "ember" as const,
      style: {
        "--ember-angle": `${i * 45 + (r() * 20 - 10)}deg`,
        "--ember-dist": `${20 + r() * 20}px`,
        "--ember-delay": `${i * 25}ms`,
        "--ember-size": `${3 + r() * 4}px`,
      },
    }));
  },
};

const earthKit: ElementVfxKit = {
  element: "earth",
  signature: "concentric quake rings — 3 staggered shockwaves",
  durationMs: 800,
  build() {
    return [
      { kind: "ring" as const, variant: "vfx-ring--1", style: {} },
      { kind: "ring" as const, variant: "vfx-ring--2", style: {} },
      { kind: "ring" as const, variant: "vfx-ring--3", style: {} },
    ];
  },
};

const woodKit: ElementVfxKit = {
  element: "wood",
  signature: "radial root growth — 5 lines spread from impact",
  durationMs: 700,
  build(seed) {
    const r = rng(seed);
    return Array.from({ length: 5 }, (_, i) => ({
      kind: "root" as const,
      style: {
        "--root-angle": `${i * 72 + (r() * 15 - 7)}deg`,
        "--root-delay": `${i * 60}ms`,
      },
    }));
  },
};

const metalKit: ElementVfxKit = {
  element: "metal",
  signature: "slash + 4 shards — one cut, then scatter",
  durationMs: 600,
  build() {
    return [
      { kind: "slash" as const, style: {} },
      ...Array.from({ length: 4 }, (_, i) => ({
        kind: "shard" as const,
        style: {
          "--shard-angle": `${-30 + i * 20}deg`,
          "--shard-delay": `${80 + i * 40}ms`,
        },
      })),
    ];
  },
};

const waterKit: ElementVfxKit = {
  element: "water",
  signature: "implosion + expansion — wave collapse then bloom",
  durationMs: 800,
  build() {
    return [
      { kind: "wave" as const, style: {} },
      { kind: "wave" as const, variant: "vfx-wave--inner", style: {} },
    ];
  },
};

// ─────────────────────────────────────────────────────────────────
// Registry — the only thing consumers need
// ─────────────────────────────────────────────────────────────────

export const ELEMENT_VFX: Record<Element, ElementVfxKit> = {
  wood: woodKit,
  fire: fireKit,
  earth: earthKit,
  metal: metalKit,
  water: waterKit,
};

/** Compose all particles for a clash. Useful for the inspector pane too. */
export function buildClashParticles(
  element: Element,
  seed: number,
): { kit: ElementVfxKit; particles: readonly ParticleInstance[] } {
  const kit = ELEMENT_VFX[element];
  return { kit, particles: kit.build(seed) };
}
