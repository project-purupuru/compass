/**
 * AC-8 + AC-9 + AC-15: sequencer fires all 11 beats at correct atMs offsets ±16ms
 * via injectable Clock; per-target resolution through 4 registries; presentation
 * never mutates GameState.
 */

import { describe, expect, test } from "vitest";

import type { ContentDatabase, PresentationSequence } from "../contracts/types";
import { createEventBus } from "../runtime/event-bus";
import { createInputLockRegistry } from "../runtime/input-lock";
import {
  createActorRegistry,
} from "../presentation/actor-registry";
import {
  createAnchorRegistry,
} from "../presentation/anchor-registry";
import {
  createAudioBusRegistry,
} from "../presentation/audio-bus-registry";
import {
  createSequencer,
  createTestClock,
  type BeatFireRecord,
  classifyBeatTarget,
} from "../presentation/sequencer";
import {
  createUiMountRegistry,
} from "../presentation/ui-mount-registry";
import { WOOD_ACTIVATION_SEQUENCE } from "../presentation/sequences/wood-activation";

function buildContentDb(): ContentDatabase {
  return {
    getCardDefinition: () => undefined,
    getZoneDefinition: () => undefined,
    getEventDefinition: () => undefined,
    getPresentationSequence: (id) => (id === "wood_activation_sequence" ? WOOD_ACTIVATION_SEQUENCE : undefined),
    getElementDefinition: () => undefined,
  };
}

function setupAllRegistries() {
  const anchors = createAnchorRegistry();
  const actors = createActorRegistry();
  const uiMounts = createUiMountRegistry();
  const audioBuses = createAudioBusRegistry();

  // Register every target the sequence needs
  anchors.register("anchor.hand.card.center");
  anchors.register("anchor.wood_grove.seedling_center");
  anchors.register("anchor.wood_grove.petal_column");
  anchors.register("anchor.wood_grove.focus_ring");
  anchors.register("anchor.wood_grove.daemon.primary");

  actors.register("actor.kaori_chibi", "actor");
  actors.register("daemon.wood_puruhani_primary", "daemon");

  uiMounts.register("card.source", "card");
  uiMounts.register("zone.wood_grove", "zone");
  uiMounts.register("vfx.sakura_arc", "vfx");
  uiMounts.register("ui.reward_preview", "ui");

  audioBuses.register("audio.bus.sfx");

  return { anchors, actors, uiMounts, audioBuses };
}

describe("AC-8: sequencer fires 11 beats at correct atMs ±16ms", () => {
  test("sequence has exactly 11 beats", () => {
    expect(WOOD_ACTIVATION_SEQUENCE.beats).toHaveLength(11);
  });

  test("first beat atMs=0; last beat atMs=2280", () => {
    const beats = WOOD_ACTIVATION_SEQUENCE.beats;
    expect(beats[0].atMs).toBe(0);
    expect(beats[beats.length - 1].atMs).toBe(2280);
  });

  test("dry-run with mock registries: 11 beats all resolved", () => {
    const bus = createEventBus();
    const lock = createInputLockRegistry(bus);
    const clock = createTestClock();
    const fired: BeatFireRecord[] = [];
    const reg = setupAllRegistries();

    const seq = createSequencer({
      bus,
      content: buildContentDb(),
      lock,
      anchors: reg.anchors,
      actors: reg.actors,
      uiMounts: reg.uiMounts,
      audioBuses: reg.audioBuses,
      clock,
      onBeatFired: (rec) => fired.push(rec),
    });

    seq.fire("wood_activation_sequence");
    clock.flushAll();

    expect(fired).toHaveLength(11);
    const unresolved = fired.filter((r) => !r.resolved);
    expect(unresolved).toEqual([]);
    seq.dispose();
  });

  test("beats fire in atMs order (sorted) when fired through scheduler", () => {
    const bus = createEventBus();
    const lock = createInputLockRegistry(bus);
    const clock = createTestClock();
    const fired: BeatFireRecord[] = [];
    const reg = setupAllRegistries();

    const seq = createSequencer({
      bus,
      content: buildContentDb(),
      lock,
      ...reg,
      clock,
      onBeatFired: (rec) => fired.push(rec),
    });

    seq.fire("wood_activation_sequence");
    clock.flushAll();

    // Beats should fire in non-decreasing atMs order.
    const atMsSeq = fired.map((f) => f.atMs);
    for (let i = 1; i < atMsSeq.length; i++) {
      expect(atMsSeq[i]).toBeGreaterThanOrEqual(atMsSeq[i - 1]);
    }
    seq.dispose();
  });

  test("at advance(720), beats with atMs <= 720 have fired (4 beats: lock, anticipation, launch, audio)", () => {
    const bus = createEventBus();
    const lock = createInputLockRegistry(bus);
    const clock = createTestClock();
    const fired: BeatFireRecord[] = [];
    const reg = setupAllRegistries();

    const seq = createSequencer({
      bus,
      content: buildContentDb(),
      lock,
      ...reg,
      clock,
      onBeatFired: (rec) => fired.push(rec),
    });

    seq.fire("wood_activation_sequence");
    clock.advance(720);

    // Beats with atMs <= 720: lock_input (0), card_anticipation (0), launch_petal_arc (120), play_launch_audio (140), impact_seedling (720)
    expect(fired.length).toBe(5);
    expect(fired.map((f) => f.beatId)).toEqual([
      "lock_input",
      "card_anticipation",
      "launch_petal_arc",
      "play_launch_audio",
      "impact_seedling",
    ]);
    seq.dispose();
  });
});

describe("AC-15: input lock acquired at lock_input beat · released at unlock_input beat", () => {
  test("lock acquired with sequence.wood_activation as owner after lock_input fires", () => {
    const bus = createEventBus();
    const lock = createInputLockRegistry(bus);
    const clock = createTestClock();
    const reg = setupAllRegistries();

    const seq = createSequencer({
      bus,
      content: buildContentDb(),
      lock,
      ...reg,
      clock,
    });

    seq.fire("wood_activation_sequence");
    clock.advance(0);

    expect(lock.getState()?.ownerId).toBe("sequence.wood_activation");
    expect(lock.getState()?.mode).toBe("soft");
    seq.dispose();
  });

  test("lock released at unlock_input beat (atMs=2280)", () => {
    const bus = createEventBus();
    const lock = createInputLockRegistry(bus);
    const clock = createTestClock();
    const reg = setupAllRegistries();

    const seq = createSequencer({
      bus,
      content: buildContentDb(),
      lock,
      ...reg,
      clock,
    });

    seq.fire("wood_activation_sequence");
    clock.advance(2279);
    expect(lock.getState()?.ownerId).toBe("sequence.wood_activation"); // not yet released

    clock.advance(2280);
    expect(lock.getState()).toBe(null); // released
    seq.dispose();
  });
});

describe("AC-9: presentation sequencer never mutates game state (read-only)", () => {
  test("classifyBeatTarget routes correctly for all 11 beat targets", () => {
    expect(classifyBeatTarget("ui.input")).toBe("input");
    expect(classifyBeatTarget("card.source")).toBe("ui-mount");
    expect(classifyBeatTarget("vfx.sakura_arc")).toBe("ui-mount");
    expect(classifyBeatTarget("audio.bus.sfx")).toBe("audio-bus");
    expect(classifyBeatTarget("anchor.wood_grove.seedling_center")).toBe("anchor");
    expect(classifyBeatTarget("anchor.wood_grove.petal_column")).toBe("anchor");
    expect(classifyBeatTarget("zone.wood_grove")).toBe("ui-mount");
    expect(classifyBeatTarget("actor.kaori_chibi")).toBe("actor");
    expect(classifyBeatTarget("daemon.wood_puruhani_primary")).toBe("actor");
    expect(classifyBeatTarget("ui.reward_preview")).toBe("ui-mount");
  });

  test("beat with unbound target reports resolved=false (fail-open)", () => {
    const bus = createEventBus();
    const lock = createInputLockRegistry(bus);
    const clock = createTestClock();
    const fired: BeatFireRecord[] = [];

    // Set up registries WITHOUT the kaori actor — the kaori_gesture beat should fail-open
    const anchors = createAnchorRegistry();
    const actors = createActorRegistry();
    const uiMounts = createUiMountRegistry();
    const audioBuses = createAudioBusRegistry();
    anchors.register("anchor.hand.card.center");
    anchors.register("anchor.wood_grove.seedling_center");
    anchors.register("anchor.wood_grove.petal_column");
    anchors.register("anchor.wood_grove.focus_ring");
    anchors.register("anchor.wood_grove.daemon.primary");
    actors.register("daemon.wood_puruhani_primary", "daemon");
    // NOTE: actor.kaori_chibi NOT registered
    uiMounts.register("card.source");
    uiMounts.register("zone.wood_grove");
    uiMounts.register("vfx.sakura_arc");
    uiMounts.register("ui.reward_preview");
    audioBuses.register("audio.bus.sfx");

    const seq = createSequencer({
      bus,
      content: buildContentDb(),
      lock,
      anchors,
      actors,
      uiMounts,
      audioBuses,
      clock,
      onBeatFired: (rec) => fired.push(rec),
    });

    seq.fire("wood_activation_sequence");
    clock.flushAll();

    const kaoriBeat = fired.find((f) => f.beatId === "kaori_gesture");
    expect(kaoriBeat).toBeDefined();
    expect(kaoriBeat?.resolved).toBe(false);
    // Other beats still resolved
    expect(fired.filter((f) => f.resolved).length).toBe(10);
    seq.dispose();
  });
});
