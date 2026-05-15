/**
 * steering.ts — the autonomous-agent vocabulary.
 *
 * Per build doc Session 12 (D2). The expert language, made explicit:
 *
 * STEERING BEHAVIORS (Craig Reynolds, 1999). An autonomous agent is a
 * point-mass: a position, a velocity, a `maxSpeed` it can't exceed, and a
 * `maxForce` — the strongest steering impulse it can apply per second. A
 * behavior is a pure function that looks at the world and returns a STEERING
 * FORCE: "push me this way." The agent sums the forces it cares about, clamps
 * the total to `maxForce`, and integrates. Emergent, smooth, no pathfinding
 * graph — just a creature leaning toward what it wants.
 *
 * This file is the behavior library + the integrator. It is pure (no R3F, no
 * three.js) so the bear brain can be reasoned about and tested on its own.
 *
 * The world plane is x/z (y is up); a Vec2 is a point on the ground.
 */

export interface Vec2 {
  x: number;
  z: number;
}

// ── Vector math — the small kit every behavior is built from ────────────────

export const v2 = (x: number, z: number): Vec2 => ({ x, z });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, z: a.z + b.z });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, z: a.z - b.z });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, z: a.z * s });
export const len = (a: Vec2): number => Math.hypot(a.x, a.z);
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z);

/** Unit vector in the same direction — zero stays zero (no NaN). */
export function normalize(a: Vec2): Vec2 {
  const l = len(a);
  return l > 1e-6 ? { x: a.x / l, z: a.z / l } : { x: 0, z: 0 };
}

/** Clamp a vector's magnitude to `max` — the cap on how hard an agent can steer. */
export function limit(a: Vec2, max: number): Vec2 {
  const l = len(a);
  return l > max && l > 1e-6 ? { x: (a.x / l) * max, z: (a.z / l) * max } : a;
}

// ── Behaviors — each returns a STEERING FORCE ("push me this way") ───────────

/**
 * SEEK — steer straight at a target as fast as allowed.
 *
 * The classic. Desired velocity points at the target at full speed; the
 * steering force is the *correction* from current velocity to desired. The
 * agent accelerates onto the line and holds it.
 */
export function seek(
  pos: Vec2,
  vel: Vec2,
  target: Vec2,
  maxSpeed: number,
  maxForce: number,
): Vec2 {
  const desired = scale(normalize(sub(target, pos)), maxSpeed);
  return limit(sub(desired, vel), maxForce);
}

/**
 * ARRIVE — seek, but ease to a clean stop instead of orbiting the target.
 *
 * Inside `slowRadius` the desired speed ramps down linearly to zero. This is
 * what stops a bear jittering forever on the tree it's trying to reach — it
 * decelerates into the spot and settles.
 */
export function arrive(
  pos: Vec2,
  vel: Vec2,
  target: Vec2,
  maxSpeed: number,
  maxForce: number,
  slowRadius: number,
): Vec2 {
  const offset = sub(target, pos);
  const d = len(offset);
  if (d < 1e-4) return scale(vel, -1); // dead on it — kill residual drift
  const ramp = d < slowRadius ? maxSpeed * (d / slowRadius) : maxSpeed;
  const desired = scale(normalize(offset), ramp);
  return limit(sub(desired, vel), maxForce);
}

/**
 * WANDER — aimless-but-coherent drift. The idle behavior.
 *
 * A point is projected ahead of the agent; a target rides a small circle
 * around that point, nudged each frame by a bounded random walk on its angle.
 * The result reads as a creature ambling — not a random-number twitch, not a
 * straight line. `wanderAngle` is per-agent state the caller must persist.
 */
export interface WanderState {
  /** Persisted between frames — the current angle on the wander circle. */
  wanderAngle: number;
}

export function wander(
  pos: Vec2,
  vel: Vec2,
  state: WanderState,
  maxSpeed: number,
  maxForce: number,
  rand: () => number,
  dt: number,
): Vec2 {
  // Random-walk the angle — bounded so the drift stays smooth.
  state.wanderAngle += (rand() - 0.5) * 4 * dt;
  const heading = len(vel) > 1e-4 ? normalize(vel) : v2(1, 0);
  const ahead = add(pos, scale(heading, 1.6));
  const offset = v2(
    Math.cos(state.wanderAngle) * 0.9,
    Math.sin(state.wanderAngle) * 0.9,
  );
  return seek(pos, vel, add(ahead, offset), maxSpeed, maxForce);
}

// ── Integrator — apply a steering force, move the agent ─────────────────────

export interface Mover {
  pos: Vec2;
  vel: Vec2;
}

/**
 * Advance a mover by `dt` under a steering `force`.
 *
 * force → velocity (clamped to `maxSpeed`) → position. Semi-implicit Euler;
 * `dt` is clamped upstream by the caller's frame loop. `onStep` lets the caller
 * veto a move (e.g. reject a step that would walk a bear into the sea) by
 * returning a corrected position.
 */
export function integrate(
  mover: Mover,
  force: Vec2,
  maxSpeed: number,
  dt: number,
  onStep?: (next: Vec2) => Vec2,
): void {
  mover.vel = limit(add(mover.vel, scale(force, dt)), maxSpeed);
  let next = add(mover.pos, scale(mover.vel, dt));
  if (onStep) {
    const corrected = onStep(next);
    if (corrected !== next) {
      next = corrected;
      // Bounced off a boundary — bleed sideways momentum so the agent doesn't
      // grind into the wall every frame.
      mover.vel = scale(mover.vel, 0.3);
    }
  }
  mover.pos = next;
}
