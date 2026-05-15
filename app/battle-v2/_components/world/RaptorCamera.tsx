/**
 * RaptorCamera — the global view is a raptor's watch.
 *
 * Per build doc Session 10 + the operator's owl/hawk creative direction.
 * Replaces CameraRig. ONE camera, owned here; nothing else touches it.
 *
 * Four states, one mechanism:
 *   - Soar   — high over the continent, a slow thermal circle, gaze nailed to
 *              the districts' centroid. The world breathes under a watcher.
 *   - Stoop  — the committed dive to a district: accelerate in, decelerate to
 *              the hover. Gaze LOCKED on the district the whole descent.
 *   - Hover  — near-still watchful hold over a district. The ritual plays here.
 *   - Climb  — the reverse, back up to the soar.
 *
 * Mechanism: six per-axis critically-damped springs (posX/Y/Z + lookX/Y/Z),
 * all on the same `SPRING_RAPTOR`. Identical constants → they settle together →
 * the pose moves as one coherent straight glide, ease-in-out, no overshoot.
 * Changing the target mid-flight just re-aims the springs from wherever they
 * are — interruption is graceful, no snapshot bookkeeping.
 *
 * Gaze-lock is load-bearing: the ambient drift moves the camera's *position*
 * only; `lookAt` stays nailed to the focal anchor. The body soars; the eyes
 * don't move. That's the owl — and it's the research's nausea fix.
 */

"use client";

import { useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";

import { SPRING_RAPTOR, stepSpring } from "../vfx/springs";
import { DISTRICTS_CENTROID, type ZonePlacement } from "./zones";

interface Pose {
  readonly pos: readonly [number, number, number];
  readonly look: readonly [number, number, number];
}

/**
 * The soar — high enough to see the WHOLE continent (operator: "I can no
 * longer see the map"). A raptor rides the thermal at altitude; the whole
 * Tsuheji map sits in frame below.
 */
const SOAR_POSE: Pose = (() => {
  const [cx, cz] = DISTRICTS_CENTROID;
  return { pos: [cx, 46, cz + 42], look: [cx, 0, cz] };
})();

/** The hover — close above and behind a district, watching it. */
function districtPose(d: { readonly x: number; readonly z: number }): Pose {
  return { pos: [d.x, 8, d.z + 8.5], look: [d.x, 0.5, d.z] };
}

// Ambient drift — a thermal circle when soaring, a perched micro-sway up close.
const SOAR_DRIFT = 2.2;
const HOVER_DRIFT = 0.16;
const DRIFT_ORBIT_RATE = 0.28; // rad/s — ~22s circle
const DRIFT_BOB_RATE = 0.19;

interface RaptorCameraProps {
  /** null = soaring overview · a placement = stooped + hovering on that district. */
  readonly focusDistrict: ZonePlacement | null;
}

export function RaptorCamera({ focusDistrict }: RaptorCameraProps) {
  const camera = useThree((s) => s.camera);

  // Six per-axis springs: [posX, posY, posZ, lookX, lookY, lookZ].
  const springs = useRef(
    [...SOAR_POSE.pos, ...SOAR_POSE.look].map((v) => ({ value: v, velocity: 0 })),
  );
  const driftPhase = useRef(0);
  const driftAmp = useRef(SOAR_DRIFT);

  useFrame((_, dt) => {
    const target = focusDistrict ? districtPose(focusDistrict) : SOAR_POSE;
    const targetArr = [
      target.pos[0],
      target.pos[1],
      target.pos[2],
      target.look[0],
      target.look[1],
      target.look[2],
    ];
    for (let i = 0; i < 6; i++) {
      stepSpring(springs.current[i], targetArr[i], SPRING_RAPTOR, dt);
    }

    // Drift amplitude eases between soar (wide circle) and hover (micro-sway).
    const targetAmp = focusDistrict ? HOVER_DRIFT : SOAR_DRIFT;
    driftAmp.current += (targetAmp - driftAmp.current) * Math.min(1, dt * 2);

    driftPhase.current += dt;
    const amp = driftAmp.current;
    const dx = Math.cos(driftPhase.current * DRIFT_ORBIT_RATE) * amp;
    const dy = Math.sin(driftPhase.current * DRIFT_BOB_RATE) * amp * 0.4;
    const dz = Math.sin(driftPhase.current * DRIFT_ORBIT_RATE) * amp;

    // Position drifts; the gaze does NOT — the owl's eyes stay locked.
    camera.position.set(
      springs.current[0].value + dx,
      springs.current[1].value + dy,
      springs.current[2].value + dz,
    );
    camera.lookAt(
      springs.current[3].value,
      springs.current[4].value,
      springs.current[5].value,
    );
  });

  return null;
}
