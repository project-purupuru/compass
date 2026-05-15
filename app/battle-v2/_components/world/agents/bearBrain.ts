/**
 * bearBrain.ts — the bear, as an autonomous agent.
 *
 * Per build doc Session 12 (D2). The FSM half of the agent vocabulary.
 *
 * A bear has a BRAIN (this finite state machine) and a BODY (a `Mover` —
 * position + velocity, steered by `steering.ts`). Every frame `stepBear` runs
 * the agent loop:
 *
 *   PERCEIVE — read the world: where am I, where's my target, how close?
 *   DECIDE   — the FSM: should I change state? (arrival, or a state timer)
 *   ACT      — the current state picks a steering behavior + target; integrate.
 *
 * The state cycle is a little supply loop you can watch:
 *
 *   WANDER ──(timer)──▶ SEEK_TREE ──(arrived)──▶ CHOP ──(timer)──▶
 *   HAUL ──(arrived hub)──▶ DELIVER ──(timer)──▶ WANDER ...
 *
 * No pathfinding graph — the continent is open ground, so `arrive` + a
 * land-clamp is enough. The grove is always working; a card play just spawns
 * more bears and more trees (see BearColony — count is f(activationLevel)).
 */

import {
  arrive,
  dist,
  integrate,
  type Mover,
  v2,
  type Vec2,
  wander,
  type WanderState,
} from "./steering";

export type BearState =
  | "wander" // ambling near the grove, between jobs
  | "seekTree" // walking to a chosen tree
  | "chop" // standing at the tree, cutting (timed)
  | "haul" // carrying a log back to Musubi Station
  | "deliver"; // standing at the station, stacking the log (timed)

export interface Bear extends Mover, WanderState {
  readonly id: number;
  /** Which bear artwork (1-3) — picked once at spawn. */
  readonly variant: 1 | 2 | 3;
  /** Per-bear seeded RNG — deterministic wander. */
  readonly rand: () => number;
  state: BearState;
  /** The tree this bear is working — set on the wander→seekTree transition. */
  targetTree: Vec2 | null;
  /** True while hauling/delivering — the body shows a carried log. */
  carrying: boolean;
  /** Counts down (seconds) in the timed states: wander, chop, deliver. */
  stateTimer: number;
  /** Smoothed 0..1 "working" signal — drives a subtle chop/stack bob in the body. */
  effort: number;
}

export interface BearCtx {
  /** Tree positions the bears may walk to and chop. */
  readonly trees: readonly Vec2[];
  /** Musubi Station — where hauled logs are delivered. */
  readonly hub: Vec2;
  /** The wood grove centre — the bears' home; wander stays tethered here. */
  readonly grove: Vec2;
  /** Land query — a step that would leave the continent is rejected. */
  readonly isOnLand: (x: number, z: number) => boolean;
  /** Called once each time a bear completes a delivery (stockpile grows). */
  readonly onDeliver: () => void;
}

// ── Tuning — the feel of a working bear ─────────────────────────────────────

const MAX_SPEED = 2.6; // world units / s — an unhurried amble
const MAX_FORCE = 9; // steering responsiveness
const ARRIVE_RADIUS = 1.1; // slow-down radius for `arrive`
const REACH = 0.55; // "close enough" — triggers chop / deliver
const GROVE_TETHER = 7.5; // wander stays within this of the grove centre
const CHOP_MS = 1.6; // seconds spent cutting
const DELIVER_MS = 0.9; // seconds spent stacking at the station
const WANDER_MIN_MS = 1.2; // idle spread before picking the next tree
const WANDER_MAX_MS = 3.4;

/** Pick the nearest tree to a point — the bear's job-selection rule. */
function nearestTree(from: Vec2, trees: readonly Vec2[]): Vec2 | null {
  let best: Vec2 | null = null;
  let bestSq = Infinity;
  for (const t of trees) {
    const dx = t.x - from.x;
    const dz = t.z - from.z;
    const sq = dx * dx + dz * dz;
    if (sq < bestSq) {
      bestSq = sq;
      best = t;
    }
  }
  return best;
}

/** A fresh wander dwell time — varied so the colony doesn't pulse in lockstep. */
function rollWanderTimer(rand: () => number): number {
  return WANDER_MIN_MS + rand() * (WANDER_MAX_MS - WANDER_MIN_MS);
}

/**
 * Advance one bear by `dt` seconds: perceive → decide → act.
 *
 * Mutates the bear in place (it lives in a ref array — no per-frame allocation
 * for the colony). Returns nothing; side effects are the bear's new pose +
 * `ctx.onDeliver()` on a completed haul.
 */
export function stepBear(bear: Bear, ctx: BearCtx, dt: number): void {
  // ── PERCEIVE ──────────────────────────────────────────────────────────────
  const toGrove = dist(bear.pos, ctx.grove);
  const toHub = dist(bear.pos, ctx.hub);
  const toTree = bear.targetTree ? dist(bear.pos, bear.targetTree) : Infinity;

  // ── DECIDE — the finite state machine ─────────────────────────────────────
  let targetEffort = 0;
  switch (bear.state) {
    case "wander": {
      bear.stateTimer -= dt;
      // Dwell elapsed → take a job: walk to the nearest tree.
      if (bear.stateTimer <= 0) {
        const tree = nearestTree(bear.pos, ctx.trees);
        if (tree) {
          bear.targetTree = tree;
          bear.state = "seekTree";
        } else {
          bear.stateTimer = rollWanderTimer(bear.rand); // no trees yet — keep ambling
        }
      }
      break;
    }
    case "seekTree": {
      if (!bear.targetTree || ctx.trees.length === 0) {
        bear.state = "wander";
        bear.stateTimer = rollWanderTimer(bear.rand);
        break;
      }
      if (toTree < REACH) {
        bear.state = "chop";
        bear.stateTimer = CHOP_MS;
      }
      break;
    }
    case "chop": {
      bear.stateTimer -= dt;
      targetEffort = 1; // cutting — the body bobs
      if (bear.stateTimer <= 0) {
        bear.carrying = true; // log in paws
        bear.state = "haul";
      }
      break;
    }
    case "haul": {
      if (toHub < REACH) {
        bear.state = "deliver";
        bear.stateTimer = DELIVER_MS;
      }
      break;
    }
    case "deliver": {
      bear.stateTimer -= dt;
      targetEffort = 1; // stacking the log
      if (bear.stateTimer <= 0) {
        bear.carrying = false;
        ctx.onDeliver(); // the stockpile grows
        bear.targetTree = null;
        bear.state = "wander";
        bear.stateTimer = rollWanderTimer(bear.rand);
      }
      break;
    }
  }

  // ── ACT — the current state picks a behavior, then we integrate ───────────
  let force: Vec2;
  switch (bear.state) {
    case "wander":
      // Tethered wander: amble freely, but lean home if it drifts too far.
      force =
        toGrove > GROVE_TETHER
          ? arrive(bear.pos, bear.vel, ctx.grove, MAX_SPEED, MAX_FORCE, ARRIVE_RADIUS)
          : wander(bear.pos, bear.vel, bear, MAX_SPEED, MAX_FORCE, bear.rand, dt);
      break;
    case "seekTree":
      force = arrive(
        bear.pos,
        bear.vel,
        bear.targetTree ?? bear.pos,
        MAX_SPEED,
        MAX_FORCE,
        ARRIVE_RADIUS,
      );
      break;
    case "haul":
      force = arrive(bear.pos, bear.vel, ctx.hub, MAX_SPEED, MAX_FORCE, ARRIVE_RADIUS);
      break;
    case "chop":
    case "deliver":
    default:
      // Standing and working — brake to a stop, hold the spot.
      force = v2(-bear.vel.x * MAX_FORCE, -bear.vel.z * MAX_FORCE);
      break;
  }

  integrate(bear, force, MAX_SPEED, dt, (next) =>
    // Land-clamp: a step into the sea is rejected — the bear keeps its old
    // position this frame and `integrate` bleeds its sideways momentum.
    ctx.isOnLand(next.x, next.z) ? next : bear.pos,
  );

  // Smooth the working signal — the body reads `effort` for its chop/stack bob.
  bear.effort += (targetEffort - bear.effort) * Math.min(1, dt * 8);
}
