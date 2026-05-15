"use client";

import { useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";

import { BATTLE_V2_RENDER_BUDGET } from "./renderBudget";

export interface BattleV2RenderStats {
  readonly frames: number;
  readonly calls: number;
  readonly triangles: number;
  readonly points: number;
  readonly lines: number;
  readonly geometries: number;
  readonly textures: number;
  readonly postFX: boolean;
  readonly budget: typeof BATTLE_V2_RENDER_BUDGET;
}

type BattleV2ProbeWindow = Window & {
  __BATTLE_V2_RENDER_STATS__?: BattleV2RenderStats;
};

export function RenderBudgetProbe({ postFX }: { readonly postFX: boolean }) {
  const gl = useThree((state) => state.gl);
  const frames = useRef(0);

  useFrame(() => {
    frames.current += 1;
    (window as BattleV2ProbeWindow).__BATTLE_V2_RENDER_STATS__ = {
      frames: frames.current,
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      points: gl.info.render.points,
      lines: gl.info.render.lines,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      postFX,
      budget: BATTLE_V2_RENDER_BUDGET,
    };
  });

  return null;
}
