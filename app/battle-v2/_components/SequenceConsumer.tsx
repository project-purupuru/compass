/**
 * SequenceConsumer — React useEffect host wiring registries + sequencer.
 *
 * Per PRD r2 FR-23 + SDD r1 §5.5.
 *
 * On mount: register all anchors/actors/UI-mounts/audio-buses for the wood
 * sequence; subscribe sequencer to event-bus on CardCommitted; wire up
 * dispose on unmount.
 *
 * Cycle-1: registries are populated with synthetic handles (the actual scene
 * refs aren't bound yet · presentation effects render through child components
 * directly using simple CSS state classes).
 */

"use client";

import { useEffect, useState } from "react";

import type { ContentDatabase, SemanticEvent } from "@/lib/purupuru/contracts/types";
import { createActorRegistry } from "@/lib/purupuru/presentation/actor-registry";
import { createAnchorRegistry } from "@/lib/purupuru/presentation/anchor-registry";
import { createAudioBusRegistry } from "@/lib/purupuru/presentation/audio-bus-registry";
import {
  createRafClock,
  createSequencer,
  type BeatFireRecord,
} from "@/lib/purupuru/presentation/sequencer";
import { createUiMountRegistry } from "@/lib/purupuru/presentation/ui-mount-registry";
import type { EventBus } from "@/lib/purupuru/runtime/event-bus";
import type { InputLockRegistry } from "@/lib/purupuru/runtime/input-lock";

interface SequenceConsumerProps {
  readonly bus: EventBus;
  readonly content: ContentDatabase;
  readonly lock: InputLockRegistry;
  readonly onBeatFired?: (record: BeatFireRecord) => void;
  readonly onSemanticEvent?: (event: SemanticEvent) => void;
}

export function SequenceConsumer({
  bus,
  content,
  lock,
  onBeatFired,
  onSemanticEvent,
}: SequenceConsumerProps) {
  const [activeBeat, setActiveBeat] = useState<string | null>(null);

  useEffect(() => {
    const anchors = createAnchorRegistry();
    const actors = createActorRegistry();
    const uiMounts = createUiMountRegistry();
    const audioBuses = createAudioBusRegistry();

    // Register all targets the wood-activation sequence needs
    [
      "anchor.hand.card.center",
      "anchor.wood_grove.seedling_center",
      "anchor.wood_grove.petal_column",
      "anchor.wood_grove.focus_ring",
      "anchor.wood_grove.daemon.primary",
    ].forEach((id) => anchors.register(id));
    actors.register("actor.kaori_chibi", "actor");
    actors.register("daemon.wood_puruhani_primary", "daemon");
    ["card.source", "vfx.sakura_arc", "zone.wood_grove", "ui.reward_preview"].forEach((id) =>
      uiMounts.register(id),
    );
    audioBuses.register("audio.bus.sfx");

    const seq = createSequencer({
      bus,
      content,
      lock,
      anchors,
      actors,
      uiMounts,
      audioBuses,
      clock: createRafClock(),
      onBeatFired: (record) => {
        setActiveBeat(record.beatId);
        onBeatFired?.(record);
      },
    });

    const unsubscribeAll = bus.subscribeAll((event) => {
      onSemanticEvent?.(event);
    });

    return () => {
      seq.dispose();
      unsubscribeAll();
      anchors.reset();
      actors.reset();
      uiMounts.reset();
      audioBuses.reset();
    };
  }, [bus, content, lock, onBeatFired, onSemanticEvent]);

  return (
    <div className="sequence-consumer" data-active-beat={activeBeat ?? "none"} aria-hidden="true" />
  );
}
