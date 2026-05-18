/**
 * Simulation domain — pentagram geometry + Puruhani entity model.
 * Pure types only; pentagram math lives in ./pentagram, entity registry in ./entities.
 */

import type { Element, Wallet } from "@/lib/score";

export interface Vec2 {
  x: number;
  y: number;
}

export type HenloArchetype = "hopeful" | "empty" | "naughty" | "loyal" | "overstimulated";

export interface AvatarSeed {
  eyeKind: 0 | 1 | 2 | 3 | 4;
  mouthKind: 0 | 1 | 2 | 3 | 4;
  browTilt: -1 | 0 | 1;
  dropletPos: 0 | 1 | 2 | 3;
  bodyTilt: number;
}

export interface PuruhaniIdentity {
  trader: Wallet;
  username: string;
  displayName: string;
  archetype: HenloArchetype;
  pfp: AvatarSeed;
}

export interface Puruhani {
  id: string;
  trader: Wallet;
  primaryElement: Element;
  affinity: Record<Element, number>;
  position: Vec2;
  velocity: Vec2;
  state: "idle" | "migrating" | "burst";
  breath_phase: number;
  resting_position: Vec2;
  identity: PuruhaniIdentity;
}

export interface PentagramGeometry {
  center: Vec2;
  radius: number;
  vertex(element: Element): Vec2;
  pentagonEdge(from: Element, to: Element): Vec2[];
  innerStarEdge(from: Element, to: Element): Vec2[];
  affinityBlend(affinity: Record<Element, number>): Vec2;
}
