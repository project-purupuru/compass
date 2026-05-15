/**
 * DaemonReact — the world is inhabited.
 *
 * Per build doc step 5. Beat: `daemon_reaction`.
 *
 * Kaori the wood-puruhani already drifts at the grove as a billboard. On the
 * `daemon_reaction` beat she *notices*: a reverent hop, a small lean toward
 * the bloom, a brief swell. Spring is light and quick — mass 0.4 · stiffness
 * 300 · damping 20 — because a creature notices fast. The ambient `Float`
 * keeps idling underneath; the spring is the punch on top.
 *
 * In-Canvas component — replaces the inline KaoriChibi3D in WorldMap3D. Binds
 * `anchor.wood_grove.daemon.primary` so the daemon is a real, landable anchor.
 *
 * Real GLB expression is V2; this is the honest placeholder reaction.
 */

"use client";

import { useEffect, useRef } from "react";

import { Billboard, Float, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import { ANCHOR, type AnchorStore } from "../anchors/anchorStore";
import { useMeshAnchorBinding } from "../anchors/useAnchorBinding";
import { SPRING_DAEMON, stepSpring } from "./springs";

const REACTION_HOLD_MS = 360;

interface DaemonReactProps {
  readonly anchorStore: AnchorStore;
  readonly activeBeat: BeatFireRecord | null;
  /** Where the daemon hovers, relative to the zone. Default = beside the hut. */
  readonly position?: readonly [number, number, number];
}

export function DaemonReact({
  anchorStore,
  activeBeat,
  position = [-1.4, 1.5, 0.6],
}: DaemonReactProps) {
  const reactRef = useRef<Group>(null);

  // The daemon is a real anchor — bind her world position every frame.
  useMeshAnchorBinding(anchorStore, ANCHOR.daemonPrimary, reactRef);

  const targetReact = useRef(0);
  const react = useRef({ value: 0, velocity: 0 });
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    if (activeBeat?.beatId !== "daemon_reaction") return;
    targetReact.current = 1;
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    // A notice is a pulse, not a pose — let it fall back after the hold.
    holdTimer.current = window.setTimeout(() => {
      targetReact.current = 0;
    }, REACTION_HOLD_MS);
    return () => {
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    };
  }, [activeBeat]);

  useFrame((_, dt) => {
    const g = reactRef.current;
    if (!g) return;
    stepSpring(react.current, targetReact.current, SPRING_DAEMON, dt);
    const r = react.current.value;
    const s = 1 + r * 0.2; // a brief swell
    g.scale.set(s, s, s);
    g.position.y = r * 0.28; // the reverent hop
    g.rotation.z = -r * 0.22; // a small lean toward the bloom
  });

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.3}>
      <Billboard position={position as [number, number, number]}>
        <group ref={reactRef}>
          <Text fontSize={0.6}>🌸</Text>
        </group>
      </Billboard>
    </Float>
  );
}
