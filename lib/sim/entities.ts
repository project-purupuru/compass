/**
 * Puruhani entity helpers — element-zone resting positions, breath
 * advancement, synthetic Solana-style wallets.
 *
 * Position model: each sprite sits in a "zone" around its primaryElement
 * vertex with jitter, plus a small pull toward its secondary element.
 * This produces 5 distinct visible clusters (the wuxing diagram reading)
 * rather than a center-of-mass collapse from pure affinityBlend.
 *
 * Population orchestration (initial seed, trickle, YOU spawn) lives in
 * `./population.ts` — this file only exports the per-sprite primitives.
 */

import type { Element, Wallet } from "@/lib/score";
import { ELEMENTS } from "@/lib/score";
import type { PentagramGeometry, Puruhani, Vec2 } from "./types";

const BREATH_SECONDS: Record<Element, number> = {
  wood: 6,
  fire: 4,
  earth: 7,
  water: 5,
  metal: 8,
};

export function breathPeriodMs(element: Element): number {
  return BREATH_SECONDS[element] * 1000;
}

// Bitcoin/Solana base58 alphabet — excludes 0/O/I/l for readability.
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function syntheticAddress(seed: number): Wallet {
  // Solana-shape base58 wallet (~44 chars) generated deterministically from
  // the seed. Not a valid Ed25519 pubkey — this is a visualization-only
  // synthetic address. The activity stream + identity registry both use
  // this function so wallet → identity round-trips stay stable.
  let s = ((Math.abs(seed) * 2654435761) >>> 0) | 1;
  let out = "";
  for (let i = 0; i < 44; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    out += BASE58_ALPHABET[s % 58];
  }
  return out;
}

function topSecondary(
  affinity: Record<Element, number>,
  primary: Element,
): { element: Element; weight: number } {
  let best: Element = primary;
  let bestVal = -1;
  for (const el of ELEMENTS) {
    if (el === primary) continue;
    if (affinity[el] > bestVal) {
      bestVal = affinity[el];
      best = el;
    }
  }
  const total = ELEMENTS.reduce((s, el) => s + affinity[el], 0);
  return { element: best, weight: total > 0 ? bestVal / total : 0 };
}

function zoneOffset(rngFn: () => number, zoneRadius: number): Vec2 {
  // Uniform random point in a disk: r = R*sqrt(u), θ = 2π*v
  const r = zoneRadius * Math.sqrt(rngFn());
  const t = 2 * Math.PI * rngFn();
  return { x: r * Math.cos(t), y: r * Math.sin(t) };
}

export function restingPositionFor(
  primary: Element,
  affinity: Record<Element, number>,
  geometry: PentagramGeometry,
  rngFn: () => number,
): Vec2 {
  const primaryV = geometry.vertex(primary);
  const zone = geometry.radius * 0.2;
  const jitter = zoneOffset(rngFn, zone);
  const sec = topSecondary(affinity, primary);
  const secV = geometry.vertex(sec.element);
  // Pull toward secondary, capped — typical secondary weight is 0.15-0.25,
  // so multiplier 0.6 gives a 9-15% pull which reads as drift without
  // breaking the cluster identity.
  const pull = Math.min(sec.weight, 0.4) * 0.6;
  return {
    x: primaryV.x + jitter.x + pull * (secV.x - primaryV.x),
    y: primaryV.y + jitter.y + pull * (secV.y - primaryV.y),
  };
}

export function advanceBreath(entity: Puruhani, dtMs: number): void {
  const period = breathPeriodMs(entity.primaryElement);
  entity.breath_phase = (entity.breath_phase + dtMs / period) % 1;
}
