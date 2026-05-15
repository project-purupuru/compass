/**
 * VfxLayer — the screen-space host for the ritual's answer.
 *
 * Per build doc "Data Architecture": the beat-driven VFX that live in DOM
 * space (the travel, the impact, the result) all mount here, on one fixed
 * full-viewport overlay between the world (z:0) and the HUD chrome (z:10).
 *
 * pointer-events:none — the ritual never eats input. Input is governed by the
 * sequencer's input-lock, not by a div sitting over the world.
 *
 * In-Canvas reactions (CameraRig, the seedling mesh spring, DaemonReact) do
 * NOT live here — they're wired inside WorldMap3D, driven by the same
 * `activeBeat`.
 */

"use client";

import type { SemanticEvent } from "@/lib/purupuru/contracts/types";
import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import type { AnchorStore } from "../anchors/anchorStore";
import { PetalArc } from "./PetalArc";
import { RewardRead } from "./RewardRead";
import { ZoneBloom } from "./ZoneBloom";

type RewardGrantedEvent = Extract<SemanticEvent, { type: "RewardGranted" }>;

interface VfxLayerProps {
  readonly anchorStore: AnchorStore;
  readonly activeBeat: BeatFireRecord | null;
  readonly reward: RewardGrantedEvent | null;
}

export function VfxLayer({ anchorStore, activeBeat, reward }: VfxLayerProps) {
  return (
    <div className="vfx-layer" aria-hidden="true">
      <PetalArc anchorStore={anchorStore} activeBeat={activeBeat} />
      <ZoneBloom anchorStore={anchorStore} activeBeat={activeBeat} />
      <RewardRead activeBeat={activeBeat} reward={reward} />
    </div>
  );
}
