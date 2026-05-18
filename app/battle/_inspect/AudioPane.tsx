"use client";

/**
 * AudioPane — Tweakpane bound to the audio engine's bus structure.
 *
 * Surface:
 *   - Master / SFX / Music gain
 *   - Snapshots (combat / menu / victory / silent) — atomic preset apply
 *   - Ducking knobs (depth, attack, release) + manual "duck now" button
 *   - Per-sound mute list (auto-built from registered sounds)
 *   - Audition buttons (current sounds for quick preview)
 *   - Monitor: per-namespace active voice count + ducking state
 */

import { useEffect, useRef } from "react";
import { audioEngine, SNAPSHOTS } from "@/lib/audio/engine";
import { addFpsGraph, copyJsonToClipboard, loadPreset, makePane, registerEssentials, savePreset } from "./_pane-shared";

const PRESET_KEY = "audio";
const SNAPSHOT_NAMES = Object.keys(SNAPSHOTS);

interface AudioPaneState {
  master: number;
  sfx: number;
  music: number;
  enabled: boolean;
  duckDepth: number;
  duckAttackMs: number;
  duckReleaseMs: number;
  snapshot: string;
}

export function AudioPane() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const eng = audioEngine();

    const initial: AudioPaneState = {
      ...eng.getVolumes(),
      enabled: eng.isEnabled(),
      duckDepth: 0.3,
      duckAttackMs: 100,
      duckReleaseMs: 400,
      snapshot: "combat",
    };
    const preset = loadPreset<AudioPaneState>(PRESET_KEY);
    if (preset) Object.assign(initial, preset);
    // Apply hydrated state
    eng.setMasterVolume(initial.master);
    eng.setSfxVolume(initial.sfx);
    eng.setMusicVolume(initial.music);
    eng.setEnabled(initial.enabled);
    eng.setDuckConfig(initial.duckDepth, initial.duckAttackMs, initial.duckReleaseMs);

    const state = initial;
    const pane = makePane({ container: containerRef.current, title: "Audio" });
    registerEssentials(pane);
    addFpsGraph(pane, "fps");

    const fBus = pane.addFolder({ title: "Bus", expanded: true });
    fBus.addBinding(state, "enabled", { label: "audio on" }).on("change", (e: { value: boolean }) => eng.setEnabled(e.value));
    fBus.addBinding(state, "master", { min: 0, max: 1, step: 0.01 }).on("change", (e: { value: number }) => eng.setMasterVolume(e.value));
    fBus.addBinding(state, "sfx", { min: 0, max: 1, step: 0.01 }).on("change", (e: { value: number }) => eng.setSfxVolume(e.value));
    fBus.addBinding(state, "music", { min: 0, max: 1, step: 0.01 }).on("change", (e: { value: number }) => eng.setMusicVolume(e.value));

    const fSnap = pane.addFolder({ title: "Snapshots", expanded: true });
    fSnap.addBinding(state, "snapshot", {
      options: Object.fromEntries(SNAPSHOT_NAMES.map((n) => [n, n])),
    });
    fSnap.addButton({ title: "apply snapshot" }).on("click", () => {
      const snap = SNAPSHOTS[state.snapshot];
      if (!snap) return;
      eng.applySnapshot(snap);
      state.master = snap.master;
      state.sfx = snap.sfx;
      state.music = snap.music;
      pane.refresh();
    });

    const fDuck = pane.addFolder({ title: "Ducking", expanded: false });
    fDuck.addBinding(state, "duckDepth", { min: 0, max: 1, step: 0.05, label: "depth" }).on("change", () =>
      eng.setDuckConfig(state.duckDepth, state.duckAttackMs, state.duckReleaseMs),
    );
    fDuck.addBinding(state, "duckAttackMs", { min: 0, max: 1000, step: 10, label: "attack ms" }).on("change", () =>
      eng.setDuckConfig(state.duckDepth, state.duckAttackMs, state.duckReleaseMs),
    );
    fDuck.addBinding(state, "duckReleaseMs", { min: 0, max: 2000, step: 10, label: "release ms" }).on("change", () =>
      eng.setDuckConfig(state.duckDepth, state.duckAttackMs, state.duckReleaseMs),
    );
    fDuck.addButton({ title: "duck for 400ms" }).on("click", () => eng.duck(400));

    const fAudition = pane.addFolder({ title: "Audition", expanded: false });
    const sounds = ["ui.tap", "ui.hover", "card.deal", "card.lift", "match.lock-in", "match.win", "match.lose", "discovery.combo"];
    for (const id of sounds) {
      if (!eng.has(id)) continue;
      fAudition.addButton({ title: `▶ ${id}` }).on("click", () => eng.play(id));
    }

    const fMonitor = pane.addFolder({ title: "Monitor", expanded: false });
    const monitor = { ui: 0, card: 0, match: 0, discovery: 0, music: 0, ducking: false };
    fMonitor.addBinding(monitor, "ui", { readonly: true });
    fMonitor.addBinding(monitor, "card", { readonly: true });
    fMonitor.addBinding(monitor, "match", { readonly: true });
    fMonitor.addBinding(monitor, "discovery", { readonly: true });
    fMonitor.addBinding(monitor, "music", { readonly: true });
    fMonitor.addBinding(monitor, "ducking", { readonly: true });

    const monitorTimer = window.setInterval(() => {
      const counts = eng.getActiveVoiceCounts();
      monitor.ui = counts.ui;
      monitor.card = counts.card;
      monitor.match = counts.match;
      monitor.discovery = counts.discovery;
      monitor.music = counts.music;
      monitor.ducking = eng.isDucking();
    }, 200);

    const fPersist = pane.addFolder({ title: "Preset", expanded: false });
    fPersist.addButton({ title: "save preset" }).on("click", () => savePreset(PRESET_KEY, state));
    fPersist.addButton({ title: "copy json" }).on("click", () => copyJsonToClipboard(state));

    pane.on("change", () => savePreset(PRESET_KEY, state));

    return () => {
      window.clearInterval(monitorTimer);
      pane.dispose();
    };
  }, []);

  return <div ref={containerRef} />;
}
