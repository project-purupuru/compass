/**
 * RegionWeather — the active element's territory does something the eye reads
 * as weather.
 *
 * Per build doc Session 12 (D3). The cosmic-weather meta made local: the
 * element in flow today gets its territory animated. Wood active → pollen
 * motes drift up over the wood region + a soft green light washes it. The
 * raptor's eye is drawn to where the element moves.
 *
 * Built element-generic — every element has a signature here — but cycle-1
 * only exercises wood. GLOBAL cosmic weather (the whole sky, driven by IRL
 * weather + cross-instance state) is deliberately NOT this component (D3) —
 * that's a separate, later layer.
 *
 * The motes are an `InstancedMesh` of tiny lit spheres, their matrices updated
 * per frame — one draw call for the whole drift. Homes are rejection-sampled
 * inside `regionAt === activeElement`, recomputed only when the tide turns.
 */

"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import { Color, type InstancedMesh, Matrix4 } from "three";

import type { ElementId } from "@/lib/purupuru/contracts/types";

import { activeBattlefieldZones } from "./activeMatchup";
import { mulberry32 } from "./Foliage";
import { groundHeight } from "./MapGround";
import { regionAt } from "./regions";
import { MAP_SIZE } from "./zones";

interface WeatherSignature {
  /** Mote colour — the element's weather, not its UI glow. */
  readonly color: string;
  readonly count: number;
  /** World units / second the motes rise. */
  readonly rise: number;
  readonly size: number;
}

/** Per-element weather signature. Only `wood` is exercised in cycle-1. */
const ELEMENT_WEATHER: Record<ElementId, WeatherSignature> = {
  wood: { color: "#cfe89a", count: 72, rise: 0.7, size: 0.05 }, // pollen drift
  fire: { color: "#ffb060", count: 60, rise: 1.5, size: 0.055 }, // rising embers
  water: { color: "#a6d8ee", count: 56, rise: 0.4, size: 0.045 }, // sea mist
  metal: { color: "#d2ccdc", count: 44, rise: 0.55, size: 0.04 }, // shimmer
  earth: { color: "#e3cd92", count: 50, rise: 0.32, size: 0.055 }, // golden dust
};

/** How high a mote climbs before it wraps back down to the ground. */
const RISE_HEIGHT = 3.6;

interface Mote {
  readonly homeX: number;
  readonly homeZ: number;
  /** Phase offset — staggers the column so motes don't rise in a sheet. */
  readonly phase: number;
  readonly driftSeed: number;
}

interface RegionWeatherProps {
  readonly activeElement: ElementId;
}

export function RegionWeather({ activeElement }: RegionWeatherProps) {
  const sig = ELEMENT_WEATHER[activeElement];

  // Rejection-sample mote homes inside the active element's territory.
  // Recomputed only when the tide turns (rare).
  const { motes, centroid } = useMemo(() => {
    const battlefieldZones = activeBattlefieldZones();
    const rand = mulberry32(0x3a17 + activeElement.charCodeAt(0) * 131);
    const found: Mote[] = [];
    let sx = 0;
    let sz = 0;
    let guard = 0;
    while (found.length < sig.count && guard < sig.count * 60) {
      guard++;
      const x = (rand() - 0.5) * MAP_SIZE;
      const z = (rand() - 0.5) * MAP_SIZE;
      // Use battlefield seeds so weather falls in the player/opponent layout
      // territory, not at canonical district art positions.
      if (regionAt(x, z, battlefieldZones) !== activeElement) continue;
      found.push({
        homeX: x,
        homeZ: z,
        phase: rand() * RISE_HEIGHT,
        driftSeed: rand() * Math.PI * 2,
      });
      sx += x;
      sz += z;
    }
    const c: [number, number] =
      found.length > 0 ? [sx / found.length, sz / found.length] : [0, 0];
    return { motes: found, centroid: c };
  }, [activeElement, sig.count]);

  const meshRef = useRef<InstancedMesh>(null);
  const scratch = useMemo(() => new Matrix4(), []);
  const moteColor = useMemo(() => new Color(sig.color), [sig.color]);

  useFrame((frame) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = frame.clock.getElapsedTime();
    const groundY = groundHeight();
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      // Rise + wrap — a slow climbing column.
      const y = groundY + 0.12 + ((t * sig.rise + m.phase) % RISE_HEIGHT);
      // Gentle lateral drift — the mote ambles as it climbs.
      const dx = Math.sin(t * 0.6 + m.driftSeed) * 0.45;
      const dz = Math.cos(t * 0.5 + m.driftSeed) * 0.45;
      // Shrink near the top of the climb so the wrap doesn't pop.
      const climb01 = (y - groundY) / RISE_HEIGHT;
      const fade = Math.sin(climb01 * Math.PI); // 0 at ends, 1 mid-climb
      const s = sig.size * (0.4 + fade * 0.9);
      scratch.makeScale(s, s, s);
      scratch.setPosition(m.homeX + dx, y, m.homeZ + dz);
      mesh.setMatrixAt(i, scratch);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (motes.length === 0) return null;

  return (
    <group name={`region-weather.${activeElement}`}>
      {/* The drifting motes — one instanced draw call. */}
      <instancedMesh
        name={`region-weather.${activeElement}.motes`}
        ref={meshRef}
        args={[undefined, undefined, motes.length]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={moteColor} transparent opacity={0.85} toneMapped={false} />
      </instancedMesh>

      {/* A soft light washing the territory — the element's glow on its land. */}
      <pointLight
        position={[centroid[0], 11, centroid[1]]}
        color={moteColor}
        intensity={14}
        distance={30}
        decay={1.6}
      />
    </group>
  );
}
