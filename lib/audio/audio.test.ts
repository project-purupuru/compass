/**
 * Audio module tests — registry shape + music director routing.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import { SOUND_REGISTRY, ensureRegistered } from "./registry";
import { musicDirector } from "./music-director";
import { audioEngine } from "./engine";

describe("SOUND_REGISTRY", () => {
  it("has unique ids", () => {
    const ids = SOUND_REGISTRY.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has either a path or a build function", () => {
    for (const s of SOUND_REGISTRY) {
      const has = (s.kind === "file" && !!s.path) || (s.kind === "procedural" && !!s.build);
      expect(has, s.id).toBe(true);
    }
  });

  it("covers all 5 elemental clash impacts", () => {
    const clashIds = SOUND_REGISTRY.filter((s) => s.id.startsWith("match.clash-impact.")).map((s) => s.id);
    expect(clashIds).toEqual(
      expect.arrayContaining([
        "match.clash-impact.wood",
        "match.clash-impact.fire",
        "match.clash-impact.earth",
        "match.clash-impact.metal",
        "match.clash-impact.water",
      ]),
    );
  });

  it("includes 5 music slots (entry / arrange / clash / result / idle)", () => {
    const musicIds = SOUND_REGISTRY.filter((s) => s.namespace === "music").map((s) => s.id);
    expect(musicIds.length).toBe(5);
  });
});

describe("audioEngine settings", () => {
  it("clamps master volume into [0,1]", () => {
    const eng = audioEngine();
    eng.setMasterVolume(2);
    expect(eng.getVolumes().master).toBe(1);
    eng.setMasterVolume(-1);
    expect(eng.getVolumes().master).toBe(0);
    eng.setMasterVolume(0.5);
    expect(eng.getVolumes().master).toBe(0.5);
  });

  it("setEnabled flips the toggle", () => {
    const eng = audioEngine();
    eng.setEnabled(false);
    expect(eng.isEnabled()).toBe(false);
    eng.setEnabled(true);
    expect(eng.isEnabled()).toBe(true);
  });

  it("registry registration is idempotent via ensureRegistered", () => {
    ensureRegistered();
    ensureRegistered();
    expect(audioEngine().has("match.lock-in")).toBe(true);
    expect(audioEngine().has("discovery.combo")).toBe(true);
  });
});

describe("musicDirector", () => {
  it("returns the same singleton", () => {
    expect(musicDirector()).toBe(musicDirector());
  });

  it("currentTrack starts null, updates on onPhase", () => {
    const md = musicDirector();
    md.silence();
    expect(md.getCurrentTrack()).toBeNull();
    md.onPhase("arrange");
    expect(md.getCurrentTrack()).toBe("music.arrange-tension");
    md.onPhase("clashing");
    expect(md.getCurrentTrack()).toBe("music.clash");
  });

  it("same-phase calls are no-ops (track doesn't change)", () => {
    const md = musicDirector();
    md.onPhase("arrange");
    const before = md.getCurrentTrack();
    md.onPhase("arrange");
    expect(md.getCurrentTrack()).toBe(before);
  });
});
