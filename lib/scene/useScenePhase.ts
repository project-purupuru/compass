"use client";

import { useEffect, useState } from "react";

import {
  timeOfDayFromDate,
  type TimeOfDayPhase,
} from "@/lib/wuxing/timeOfDay";

export interface ScenePhaseConfig {
  readonly useRealTime: boolean;
  readonly phaseOverride: TimeOfDayPhase;
}

export function useScenePhase(config: ScenePhaseConfig): TimeOfDayPhase {
  const [phase, setPhase] = useState<TimeOfDayPhase>(() =>
    config.useRealTime ? timeOfDayFromDate(new Date()).phase : config.phaseOverride,
  );

  useEffect(() => {
    if (!config.useRealTime) {
      setPhase(config.phaseOverride);
      return;
    }

    const tick = () => setPhase(timeOfDayFromDate(new Date()).phase);
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [config.useRealTime, config.phaseOverride]);

  return phase;
}
