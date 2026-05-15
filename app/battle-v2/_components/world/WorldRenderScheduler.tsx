"use client";

import { useEffect, useRef } from "react";

import { useThree } from "@react-three/fiber";

const HIGH_MOTION_FPS = 60;
const IDLE_AMBIENT_FPS = 30;
const HIGH_MOTION_HOLD_MS = 1_400;
const INITIAL_WARMUP_MS = 1_000;

interface WorldRenderSchedulerProps {
  readonly highMotion: boolean;
}

export function WorldRenderScheduler({ highMotion }: WorldRenderSchedulerProps) {
  const invalidate = useThree((state) => state.invalidate);
  const highMotionRef = useRef(highMotion);
  const highMotionUntil = useRef(
    typeof performance === "undefined" ? 0 : performance.now() + INITIAL_WARMUP_MS,
  );

  useEffect(() => {
    highMotionRef.current = highMotion;
    if (!highMotion) return;
    highMotionUntil.current = performance.now() + HIGH_MOTION_HOLD_MS;
  }, [highMotion]);

  useEffect(() => {
    let raf = 0;
    let lastRender = 0;

    const tick = (now: number) => {
      const fps =
        highMotionRef.current || now < highMotionUntil.current
          ? HIGH_MOTION_FPS
          : IDLE_AMBIENT_FPS;
      const minDelta = 1_000 / fps;
      if (now - lastRender >= minDelta) {
        lastRender = now;
        invalidate();
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [invalidate]);

  return null;
}
