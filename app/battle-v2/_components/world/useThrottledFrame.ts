"use client";

import { useRef } from "react";

import { useFrame, type RootState } from "@react-three/fiber";

type FrameCallback = (state: RootState, delta: number) => void;

export function useThrottledFrame(fps: number, callback: FrameCallback): void {
  const accumulated = useRef(0);
  const minDelta = fps > 0 ? 1 / fps : 0;

  useFrame((state, delta) => {
    accumulated.current += delta;
    if (accumulated.current < minDelta) return;

    const elapsed = accumulated.current;
    accumulated.current = 0;
    callback(state, elapsed);
  });
}
