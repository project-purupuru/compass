/**
 * Opponent — per-element AI lineup builder.
 *
 * Parameterized policy with element-specific coefficients (per PRD D11 /
 * SDD §3.2). NOT LLM-backed · NOT random · deterministic given seed.
 *
 * Closes PRD r1 FR-13 + AC-5 (behavioral fingerprint per element).
 */

import { Context, type Effect } from "effect";
import type { Card } from "./cards";
import type { Element } from "./wuxing";

/** Per-element decision coefficients · operator-tunable via DialKit (S7). */
export interface PolicyCoefficients {
  /** 0..1 · prob of position-1 jani / setup-strike opening */
  readonly aggression: number;
  /** 0..1 · weight toward Shēng chain construction */
  readonly chainPreference: number;
  /** 0..1 · weight toward single-element surge */
  readonly surgePreference: number;
  /** 0..1 · weight toward weather-blessed picks */
  readonly weatherBias: number;
  /** 0..1 · prob of inter-round rearrangement */
  readonly rearrangeRate: number;
  /** 0..1 · target lineup variance (Earth low, Water high) */
  readonly varianceTarget: number;
}

/** Per-element policy table · operator-tunable. */
export const POLICIES: Record<Element, PolicyCoefficients> = {
  fire: {
    aggression: 0.75,
    chainPreference: 0.3,
    surgePreference: 0.2,
    weatherBias: 0.4,
    rearrangeRate: 0.4,
    varianceTarget: 0.8,
  },
  earth: {
    aggression: 0.2,
    chainPreference: 0.4,
    surgePreference: 0.55,
    weatherBias: 0.3,
    rearrangeRate: 0.15,
    varianceTarget: 0.2,
  },
  wood: {
    aggression: 0.3,
    chainPreference: 0.7,
    surgePreference: 0.2,
    weatherBias: 0.55,
    rearrangeRate: 0.3,
    varianceTarget: 0.5,
  },
  metal: {
    aggression: 0.5,
    chainPreference: 0.45,
    surgePreference: 0.4,
    weatherBias: 0.35,
    rearrangeRate: 0.25,
    varianceTarget: 0.4,
  },
  water: {
    aggression: 0.4,
    chainPreference: 0.55,
    surgePreference: 0.25,
    weatherBias: 0.7,
    rearrangeRate: 0.85,
    varianceTarget: 0.7,
  },
};

export interface OpponentArrangement {
  readonly lineup: readonly Card[];
  /** Human-readable rationale · used by SubstrateInspector (S7). */
  readonly rationale: string;
  /** Score of the chosen arrangement vs candidates considered. */
  readonly score: number;
}

export class Opponent extends Context.Tag("purupuru-ttrpg/Opponent")<
  Opponent,
  {
    readonly buildLineup: (
      collection: readonly Card[],
      element: Element,
      weather: Element,
      seed: string,
    ) => Effect.Effect<OpponentArrangement>;
    readonly rearrange: (
      currentLineup: readonly Card[],
      element: Element,
      weather: Element,
      seed: string,
      round: number,
    ) => Effect.Effect<OpponentArrangement>;
    /** Policy lookup — exposed for DevConsole tuning surface (S7). */
    readonly policyFor: (element: Element) => PolicyCoefficients;
  }
>() {}
