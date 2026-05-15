"use client";

import { useEffect, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";

interface ShadowMapSchedulerProps {
  readonly fps?: number;
}

export function ShadowMapScheduler({ fps = 8 }: ShadowMapSchedulerProps) {
  const gl = useThree((state) => state.gl);
  const accumulated = useRef(0);
  const warmupFrames = useRef(4);

  useEffect(() => {
    const previousAutoUpdate = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;

    return () => {
      gl.shadowMap.autoUpdate = previousAutoUpdate;
      gl.shadowMap.needsUpdate = true;
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (warmupFrames.current > 0) {
      warmupFrames.current--;
      gl.shadowMap.needsUpdate = true;
      return;
    }

    accumulated.current += delta;
    if (accumulated.current < 1 / fps) return;

    accumulated.current = 0;
    gl.shadowMap.needsUpdate = true;
  });

  return null;
}
