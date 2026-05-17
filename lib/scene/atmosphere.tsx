"use client";

import { useEffect } from "react";

import { useThree } from "@react-three/fiber";
import { Color, Fog } from "three";

import {
  PHASE_PALETTE,
  type TimeOfDayPhase,
} from "@/lib/wuxing/timeOfDay";

type Vec3 = readonly [number, number, number];

export interface SceneAtmosphereProps {
  readonly phase: TimeOfDayPhase;
  readonly fogDensity: number;
  readonly fogNear: number;
  readonly fogFar: number;
  readonly keyPosition?: Vec3;
  readonly keyCastsShadow?: boolean;
  readonly rimPosition?: Vec3;
  readonly rimIntensityScale?: number;
}

export function SceneAtmosphere({
  phase,
  fogDensity,
  fogNear,
  fogFar,
  keyPosition = [-12, 16, 8],
  keyCastsShadow = false,
  rimPosition,
  rimIntensityScale = 0.35,
}: SceneAtmosphereProps) {
  const { scene } = useThree();
  const palette = PHASE_PALETTE[phase];

  useEffect(() => {
    scene.background = new Color(palette.skyBottom);
    scene.fog = new Fog(palette.fog, fogNear, fogFar / Math.max(fogDensity, 0.001));
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, palette.skyBottom, palette.fog, fogDensity, fogNear, fogFar]);

  return (
    <>
      <ambientLight
        intensity={palette.ambientIntensity}
        color={palette.ambient}
      />
      <directionalLight
        position={keyPosition}
        intensity={palette.directionalIntensity}
        color={palette.directional}
        castShadow={keyCastsShadow}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {rimPosition && (
        <directionalLight
          position={rimPosition}
          intensity={palette.directionalIntensity * rimIntensityScale}
          color={phase === "night" ? "#6f8ab8" : "#c7d8e8"}
        />
      )}
    </>
  );
}
